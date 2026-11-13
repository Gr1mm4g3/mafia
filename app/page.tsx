import { Suspense } from "react";
import { connection } from "next/server";
import AuthScreen from "@/app/components/AuthScreen";
import GameDashboard, {
  SerializedCrime,
  SerializedInmate,
  SerializedLog,
  SerializedMarketRow,
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
  const [crimes, inmatesRaw, marketsRaw, logsRaw] = await Promise.all([
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
      take: 30,
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

  return (
    <GameDashboard
      user={serializedUser}
      crimes={serializedCrimes}
      inmates={serializedInmates}
      markets={serializedMarkets}
      logs={serializedLogs}
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
