import { Suspense } from "react";
import { connection } from "next/server";
import AuthScreen from "@/app/components/AuthScreen";
import GameDashboard, {
  SerializedBounty,
  SerializedCrime,
  SerializedDistrict,
  SerializedFamily,
  SerializedInmate,
  SerializedLeaderboardPlayer,
  SerializedLog,
  SerializedMarketRow,
  SerializedMonopoly,
  SerializedOrganizedCrime,
  SerializedUser,
} from "@/app/components/GameDashboard";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function GameServerContent() {
  await connection();
  const user = await getCurrentUser();

  if (!user) {
    return <AuthScreen />;
  }

  const now = new Date();
  const [
    crimes,
    inmatesRaw,
    marketsRaw,
    logsRaw,
    familiesRaw,
    allPlayersRaw,
    districtsRaw,
    monopoliesRaw,
    bountiesRaw,
    organizedCrimesRaw,
  ] = await Promise.all([
    prisma.crimeConfig.findMany({
      orderBy: { tier: "asc" },
    }),
    prisma.user.findMany({
      where: {
        jailUntil: { gt: now },
      },
      orderBy: { jailUntil: "asc" },
      take: 25,
    }),
    prisma.cityMarket.findMany({
      orderBy: [{ city: "asc" }, { itemName: "asc" }],
    }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 45,
    }),
    prisma.family.findMany({
      include: {
        members: {
          orderBy: { rankPoints: "desc" },
        },
      },
      orderBy: { treasuryCash: "desc" },
    }),
    prisma.user.findMany({
      include: {
        family: true,
      },
      orderBy: { rankPoints: "desc" },
      take: 30,
    }),
    prisma.cityDistrict.findMany({
      include: {
        controllingFamily: true,
      },
      orderBy: { city: "asc" },
    }),
    prisma.cityMonopoly.findMany({
      orderBy: [{ city: "asc" }, { propertyType: "asc" }],
    }),
    prisma.bounty.findMany({
      orderBy: { rewardCash: "desc" },
      take: 25,
    }),
    prisma.organizedCrime.findMany({
      where: { status: "RECRUITING" },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
  ]);

  const serializedUser: SerializedUser = {
    id: user.id,
    username: user.username,
    cash: user.cash,
    bankCash: user.bankCash,
    health: user.health,
    bullets: user.bullets,
    rankPoints: user.rankPoints,
    city: user.city,
    nextCrimeAtMs: user.nextCrimeAt.getTime(),
    nextGtaAtMs: user.nextGtaAt.getTime(),
    jailUntilMs: user.jailUntil.getTime(),
    jailReason: user.jailReason,
    travelUntilMs: user.travelUntil.getTime(),
    crimesCommitted: user.crimesCommitted,
    carsStolen: user.carsStolen,
    bustsSucceeded: user.bustsSucceeded,
    killsCount: user.killsCount,
    deathsCount: user.deathsCount,
    equippedWeapon: user.equippedWeapon,
    weaponPower: user.weaponPower,
    equippedArmor: user.equippedArmor,
    armorDefense: user.armorDefense,
    safehouseTier: user.safehouseTier,
    safehouseName: user.safehouseName,
    bodyguards: user.bodyguards,
    heirUsername: user.heirUsername,
    willMessage: user.willMessage,
    familyId: user.familyId,
    familyTag: user.family?.tag ?? null,
    familyName: user.family?.name ?? null,
    familyRole: user.familyRole,
    familyContribution: user.familyContribution,
    vehicles: user.vehicles.map((v) => ({
      id: v.id,
      name: v.name,
      classTier: v.classTier,
      baseValue: v.baseValue,
      damage: v.damage,
      originCity: v.originCity,
      currentCity: v.currentCity,
    })),
    inventory: user.inventory.map((inv) => ({
      id: inv.id,
      itemType: inv.itemType,
      itemName: inv.itemName,
      quantity: inv.quantity,
      avgCost: inv.avgCost,
    })),
    businesses: user.businesses.map((b) => ({
      id: b.id,
      businessType: b.businessType,
      name: b.name,
      city: b.city,
      level: b.level,
      hourlyYield: b.hourlyYield,
      launderBonusPct: b.launderBonusPct,
    })),
    detectiveReports: user.detectiveReports.map((r) => ({
      id: r.id,
      targetUsername: r.targetUsername,
      discoveredCity: r.discoveredCity,
      targetHealth: r.targetHealth,
      targetGuards: r.targetGuards,
      targetFamily: r.targetFamily,
      createdAtIso: r.createdAt.toISOString(),
    })),
  };

  const serializedCrimes: SerializedCrime[] = crimes.map((c) => ({
    id: c.id,
    tier: c.tier,
    name: c.name,
    description: c.description,
    baseCashMin: c.baseCashMin,
    baseCashMax: c.baseCashMax,
    baseSuccessRate: c.baseSuccessRate,
    rankRequirement: c.rankRequirement,
    cooldownSeconds: c.cooldownSeconds,
    rankPointsReward: c.rankPointsReward,
    jailSeconds: c.jailSeconds,
  }));

  const serializedInmates: SerializedInmate[] = inmatesRaw.map((inm) => ({
    id: inm.id,
    username: inm.username,
    isNpc: inm.isNpc,
    city: inm.city,
    rankPoints: inm.rankPoints,
    familyId: inm.familyId,
    jailUntilMs: inm.jailUntil.getTime(),
    jailReason: inm.jailReason,
  }));

  const serializedMarkets: SerializedMarketRow[] = marketsRaw.map((m) => ({
    city: m.city,
    itemType: m.itemType,
    itemName: m.itemName,
    price: m.price,
  }));

  const serializedLogs: SerializedLog[] = logsRaw.map((l) => ({
    id: l.id,
    actorName: l.actorName,
    category: l.category,
    headline: l.headline,
    details: l.details,
    city: l.city,
    createdAtIso: l.createdAt.toISOString(),
  }));

  const serializedFamilies: SerializedFamily[] = familiesRaw.map((fam) => {
    const totalRankPoints = fam.members.reduce((acc, m) => acc + m.rankPoints, 0);
    const totalMemberWealth = fam.members.reduce((acc, m) => acc + m.cash + m.bankCash, 0);
    return {
      id: fam.id,
      name: fam.name,
      tag: fam.tag,
      motto: fam.motto,
      homeCity: fam.homeCity,
      treasuryCash: fam.treasuryCash,
      founderName: fam.founderName,
      warsWon: fam.warsWon,
      memberCount: fam.members.length,
      totalRankPoints,
      totalMemberWealth,
      combinedSyndicateWorth: fam.treasuryCash + totalMemberWealth,
      members: fam.members.map((m) => ({
        id: m.id,
        username: m.username,
        familyRole: m.familyRole,
        rankPoints: m.rankPoints,
        city: m.city,
        familyContribution: m.familyContribution,
      })),
    };
  });

  const serializedLeaderboardPlayers: SerializedLeaderboardPlayer[] = allPlayersRaw.map((p) => ({
    id: p.id,
    username: p.username,
    isNpc: p.isNpc,
    familyTag: p.family?.tag ?? null,
    familyName: p.family?.name ?? null,
    familyRole: p.familyRole,
    city: p.city,
    rankPoints: p.rankPoints,
    netWorth: p.cash + p.bankCash,
    crimesCommitted: p.crimesCommitted,
    carsStolen: p.carsStolen,
    bustsSucceeded: p.bustsSucceeded,
    killsCount: p.killsCount,
  }));

  const serializedDistricts: SerializedDistrict[] = districtsRaw.map((d) => ({
    id: d.id,
    city: d.city,
    name: d.name,
    description: d.description,
    tributePerClaim: d.tributePerClaim,
    defenseStrength: d.defenseStrength,
    controllingFamilyId: d.controllingFamilyId,
    controllingFamilyTag: d.controllingFamily?.tag ?? null,
    controllingFamilyName: d.controllingFamily?.name ?? null,
  }));

  const serializedMonopolies: SerializedMonopoly[] = monopoliesRaw.map((m) => ({
    id: m.id,
    city: m.city,
    propertyType: m.propertyType,
    name: m.name,
    ownerId: m.ownerId,
    ownerName: m.ownerName,
    buyoutPrice: m.buyoutPrice,
    houseEdgePct: m.houseEdgePct,
    bulletPrice: m.bulletPrice,
    bulletStock: m.bulletStock,
    vaultBalance: m.vaultBalance,
  }));

  const serializedBounties: SerializedBounty[] = bountiesRaw.map((b) => ({
    id: b.id,
    targetId: b.targetId,
    targetUsername: b.targetUsername,
    posterUsername: b.posterUsername,
    rewardCash: b.rewardCash,
    reason: b.reason,
  }));

  const serializedOrganizedCrimes: SerializedOrganizedCrime[] = organizedCrimesRaw.map((oc) => ({
    id: oc.id,
    title: oc.title,
    city: oc.city,
    targetPayoutMin: oc.targetPayoutMin,
    targetPayoutMax: oc.targetPayoutMax,
    leaderName: oc.leaderName,
    weaponsName: oc.weaponsName,
    demolitionsName: oc.demolitionsName,
    driverName: oc.driverName,
    status: oc.status,
  }));

  return (
    <GameDashboard
      user={serializedUser}
      crimes={serializedCrimes}
      inmates={serializedInmates}
      markets={serializedMarkets}
      logs={serializedLogs}
      families={serializedFamilies}
      leaderboardPlayers={serializedLeaderboardPlayers}
      districts={serializedDistricts}
      monopolies={serializedMonopolies}
      bounties={serializedBounties}
      organizedCrimes={serializedOrganizedCrimes}
      serverNowMs={now.getTime()}
    />
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#121212] text-zinc-400 font-mono flex items-center justify-center text-xs uppercase tracking-widest">
          Connecting to Syndicate Wire...
        </div>
      }
    >
      <GameServerContent />
    </Suspense>
  );
}
