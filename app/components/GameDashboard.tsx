"use client";

import React, { useEffect, useState, useTransition } from "react";
import {
  ActionResponse,
  attackDistrictAction,
  bankTransactionAction,
  bribeWardenAction,
  bustInmateAction,
  buyBulletsAction,
  buyCityMonopolyAction,
  buyFactoryBulletsAction,
  buyOrUpgradeBusinessAction,
  buyWeaponOrArmorAction,
  claimDistrictTributeAction,
  claimMonopolyProfitsAction,
  collectBusinessIncomeAction,
  commitCrimeAction,
  commitGtaAction,
  configureMonopolyAction,
  contributeFamilyTreasuryAction,
  createFamilyAction,
  createOrganizedCrimeAction,
  executeAssassinationAction,
  executeOrganizedCrimeAction,
  familyBailMemberAction,
  healAtDoctorAction,
  hireBodyguardsAction,
  hireDetectiveAction,
  joinFamilyAction,
  joinOrganizedCrimeRoleAction,
  leaveFamilyAction,
  logoutAction,
  placeBountyAction,
  playBlackjackAction,
  playDiceAction,
  playHorseRacingAction,
  playRouletteAction,
  repairVehicleAction,
  RouletteBetType,
  sellVehicleAction,
  shipVehicleAction,
  tradeSmugglingItemAction,
  travelToCityAction,
  upgradeSafehouseAction,
  updateWillAction,
  withdrawFamilyTreasuryAction,
} from "@/app/actions/game";
import {
  ARMOR_CATALOG,
  CITIES,
  DERBY_HORSES,
  FRONT_BUSINESS_CATALOG,
  getRankInfo,
  GTA_OPTIONS,
  OC_HEIST_TEMPLATES,
  RANKS,
  SAFEHOUSE_CATALOG,
  SMUGGLING_ITEMS,
  WEAPONS_CATALOG,
} from "@/lib/game-config";

export interface SerializedUser {
  id: string;
  username: string;
  cash: number;
  bankCash: number;
  health: number;
  bullets: number;
  rankPoints: number;
  city: string;
  nextCrimeAtMs: number;
  nextGtaAtMs: number;
  jailUntilMs: number;
  jailReason: string | null;
  travelUntilMs: number;
  crimesCommitted: number;
  carsStolen: number;
  bustsSucceeded: number;
  killsCount: number;
  deathsCount: number;
  equippedWeapon: string;
  weaponPower: number;
  equippedArmor: string;
  armorDefense: number;
  safehouseTier: number;
  safehouseName: string;
  bodyguards: number;
  heirUsername: string | null;
  willMessage: string;
  familyId: string | null;
  familyTag: string | null;
  familyName: string | null;
  familyRole: string;
  familyContribution: number;
  vehicles: {
    id: string;
    name: string;
    classTier: string;
    baseValue: number;
    damage: number;
    originCity: string;
    currentCity: string;
  }[];
  inventory: {
    id: string;
    itemType: string;
    itemName: string;
    quantity: number;
    avgCost: number;
  }[];
  businesses: {
    id: string;
    businessType: string;
    name: string;
    city: string;
    level: number;
    hourlyYield: number;
    launderBonusPct: number;
  }[];
  detectiveReports: {
    id: string;
    targetUsername: string;
    discoveredCity: string;
    targetHealth: number;
    targetGuards: number;
    targetFamily: string | null;
    createdAtIso: string;
  }[];
}

export interface SerializedCrime {
  id: string;
  tier: number;
  name: string;
  description: string;
  baseCashMin: number;
  baseCashMax: number;
  baseSuccessRate: number;
  rankRequirement: number;
  cooldownSeconds: number;
  rankPointsReward: number;
  jailSeconds: number;
}

export interface SerializedInmate {
  id: string;
  username: string;
  isNpc: boolean;
  city: string;
  rankPoints: number;
  familyId: string | null;
  jailUntilMs: number;
  jailReason: string | null;
}

export interface SerializedMarketRow {
  city: string;
  itemType: string;
  itemName: string;
  price: number;
}

export interface SerializedLog {
  id: string;
  actorName: string;
  category: string;
  headline: string;
  details: string;
  city: string;
  createdAtIso: string;
}

export interface SerializedFamily {
  id: string;
  name: string;
  tag: string;
  motto: string;
  homeCity: string;
  treasuryCash: number;
  founderName: string;
  warsWon: number;
  memberCount: number;
  totalRankPoints: number;
  totalMemberWealth: number;
  combinedSyndicateWorth: number;
  members: {
    id: string;
    username: string;
    familyRole: string;
    rankPoints: number;
    city: string;
    familyContribution: number;
  }[];
}

export interface SerializedLeaderboardPlayer {
  id: string;
  username: string;
  isNpc: boolean;
  familyTag: string | null;
  familyName: string | null;
  familyRole: string;
  city: string;
  rankPoints: number;
  netWorth: number;
  crimesCommitted: number;
  carsStolen: number;
  bustsSucceeded: number;
  killsCount: number;
}

export interface SerializedDistrict {
  id: string;
  city: string;
  name: string;
  description: string;
  tributePerClaim: number;
  defenseStrength: number;
  controllingFamilyId: string | null;
  controllingFamilyTag: string | null;
  controllingFamilyName: string | null;
}

export interface SerializedMonopoly {
  id: string;
  city: string;
  propertyType: string;
  name: string;
  ownerId: string | null;
  ownerName: string;
  buyoutPrice: number;
  houseEdgePct: number;
  bulletPrice: number;
  bulletStock: number;
  vaultBalance: number;
}

export interface SerializedBounty {
  id: string;
  targetId: string;
  targetUsername: string;
  posterUsername: string;
  rewardCash: number;
  reason: string;
}

export interface SerializedOrganizedCrime {
  id: string;
  title: string;
  city: string;
  targetPayoutMin: number;
  targetPayoutMax: number;
  leaderName: string;
  weaponsName: string | null;
  demolitionsName: string | null;
  driverName: string | null;
  status: string;
}

type NavTab =
  | "crimes"
  | "oc"
  | "gta"
  | "garage"
  | "jail"
  | "combat"
  | "empire"
  | "smuggling"
  | "travel"
  | "casino"
  | "families"
  | "leaderboards"
  | "bank"
  | "newspaper"
  | "ranks";

interface Props {
  user: SerializedUser;
  crimes: SerializedCrime[];
  inmates: SerializedInmate[];
  markets: SerializedMarketRow[];
  logs: SerializedLog[];
  families: SerializedFamily[];
  leaderboardPlayers: SerializedLeaderboardPlayer[];
  districts: SerializedDistrict[];
  monopolies: SerializedMonopoly[];
  bounties: SerializedBounty[];
  organizedCrimes: SerializedOrganizedCrime[];
  serverNowMs: number;
}

function formatSeconds(sec: number): string {
  if (sec <= 0) return "READY";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function GameDashboard({
  user,
  crimes,
  inmates,
  markets,
  logs,
  families,
  leaderboardPlayers,
  districts,
  monopolies,
  bounties,
  organizedCrimes,
  serverNowMs,
}: Props) {
  const [activeTab, setActiveTab] = useState<NavTab>("crimes");
  const [feedback, setFeedback] = useState<ActionResponse | null>(null);
  const [isPending, startTransition] = useTransition();

  // Anti-cheat test toggle
  const [bypassClientLock, setBypassClientLock] = useState(false);

  // Smuggling input quantities per item
  const [tradeQuantities, setTradeQuantities] = useState<Record<string, number>>({});
  // Bank input
  const [bankAmount, setBankAmount] = useState<string>("250");
  // Garage ship destination per vehicle
  const [shipTargets, setShipTargets] = useState<Record<string, string>>({});

  // Casino state
  const [rouletteWager, setRouletteWager] = useState<string>("100");
  const [rouletteBetType, setRouletteBetType] = useState<RouletteBetType>("red");
  const [rouletteNumber, setRouletteNumber] = useState<string>("7");
  const [diceWager, setDiceWager] = useState<string>("100");
  const [blackjackWager, setBlackjackWager] = useState<string>("150");
  const [selectedHorseId, setSelectedHorseId] = useState<number>(1);
  const [horseWager, setHorseWager] = useState<string>("100");

  // Family creation / contribution state
  const [newFamName, setNewFamName] = useState("");
  const [newFamTag, setNewFamTag] = useState("");
  const [newFamMotto, setNewFamMotto] = useState("");
  const [tributeAmount, setTributeAmount] = useState<string>("250");

  // Combat, Hitlist, Recon & Will state
  const [reconTarget, setReconTarget] = useState<string>("Rocco_The_Butcher");
  const [hitTarget, setHitTarget] = useState<string>("Rocco_The_Butcher");
  const [bulletsToFire, setBulletsToFire] = useState<string>("35");
  const [bountyTarget, setBountyTarget] = useState<string>("Vito_Castellano");
  const [bountyAmount, setBountyAmount] = useState<string>("2500");
  const [bountyReason, setBountyReason] = useState<string>(" encroaching on syndicate rackets");
  const [heirInput, setHeirInput] = useState<string>(user.heirUsername || "Vito_Castellano");
  const [willInput, setWillInput] = useState<string>(user.willMessage);
  const [factoryBuyQty, setFactoryBuyQty] = useState<string>("50");

  // Newspaper category filter
  const [logFilter, setLogFilter] = useState<string>("ALL");

  // Leaderboard sort mode
  const [playerSort, setPlayerSort] = useState<"xp" | "wealth" | "crimes">("xp");

  // Sync client clock with serverNowMs offset
  const [clockOffset] = useState(() => serverNowMs - Date.now());
  const [nowMs, setNowMs] = useState(() => serverNowMs);

  useEffect(() => {
    const interval = setInterval(() => {
      setNowMs(Date.now() + clockOffset);
    }, 250);
    return () => clearInterval(interval);
  }, [clockOffset]);

  const crimeRemainingSec = Math.max(0, Math.ceil((user.nextCrimeAtMs - nowMs) / 1000));
  const gtaRemainingSec = Math.max(0, Math.ceil((user.nextGtaAtMs - nowMs) / 1000));
  const jailRemainingSec = Math.max(0, Math.ceil((user.jailUntilMs - nowMs) / 1000));
  const travelRemainingSec = Math.max(0, Math.ceil((user.travelUntilMs - nowMs) / 1000));

  const isInJail = jailRemainingSec > 0;
  const isTraveling = travelRemainingSec > 0;

  const rankInfo = getRankInfo(user.rankPoints);
  const safehouseSpec = SAFEHOUSE_CATALOG[user.safehouseTier] ?? SAFEHOUSE_CATALOG[0];
  const effectiveBoozeCap = rankInfo.current.boozeCapacity + safehouseSpec.boozeBonus;
  const effectiveNarcoticsCap =
    rankInfo.current.narcoticsCapacity + safehouseSpec.narcoticsBonus;

  const activeInmates = inmates.filter((inm) => inm.jailUntilMs > nowMs);
  const localMarkets = markets.filter((m) => m.city === user.city);
  const localCasino = monopolies.find(
    (m) => m.city === user.city && m.propertyType === "CASINO"
  );
  const localBulletFactory = monopolies.find(
    (m) => m.city === user.city && m.propertyType === "BULLET_FACTORY"
  );

  const carriedBooze = user.inventory
    .filter((i) => i.itemType === "booze")
    .reduce((acc, i) => acc + i.quantity, 0);
  const carriedNarcotics = user.inventory
    .filter((i) => i.itemType === "narcotics")
    .reduce((acc, i) => acc + i.quantity, 0);

  const currentUserFamily = families.find((f) => f.id === user.familyId) ?? null;

  const sortedFamilies = [...families].sort(
    (a, b) => b.combinedSyndicateWorth - a.combinedSyndicateWorth
  );

  const sortedPlayers = [...leaderboardPlayers].sort((a, b) => {
    if (playerSort === "wealth") return b.netWorth - a.netWorth;
    if (playerSort === "crimes") {
      return (
        b.crimesCommitted +
        b.carsStolen +
        b.bustsSucceeded +
        b.killsCount -
        (a.crimesCommitted + a.carsStolen + a.bustsSucceeded + a.killsCount)
      );
    }
    return b.rankPoints - a.rankPoints;
  });

  const filteredLogs =
    logFilter === "ALL" ? logs : logs.filter((l) => l.category === logFilter);

  function runAction(fn: () => Promise<ActionResponse>) {
    startTransition(async () => {
      const res = await fn();
      setFeedback(res);
    });
  }

  return (
    <div className="min-h-screen bg-[#121212] text-zinc-100 font-mono flex flex-col">
      {/* 1. TOP STATUS BAR (Classic Omerta Header) */}
      <header className="sticky top-0 z-30 bg-[#171717] border-b border-zinc-800 shadow-lg">
        <div className="max-w-[1440px] mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-4">
          {/* Brand & Player Identity */}
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 text-black font-black px-2.5 py-1 text-xs tracking-wider uppercase">
              OMERTA
            </div>
            <div>
              <div className="flex items-center gap-2">
                {user.familyTag && (
                  <span className="text-xs font-bold text-amber-400">[{user.familyTag}]</span>
                )}
                <span className="text-sm font-bold text-zinc-100">{user.username}</span>
                <span className="text-[11px] px-2 py-0.5 bg-zinc-800 border border-zinc-700 text-amber-400 font-semibold">
                  {rankInfo.current.name}
                </span>
              </div>
              <div className="text-[11px] text-zinc-400 flex flex-wrap items-center gap-2 mt-0.5">
                <span>
                  City: <strong className="text-zinc-200">{user.city}</strong>
                </span>
                <span>•</span>
                <span>
                  Weapon: <strong className="text-zinc-200">{user.equippedWeapon}</strong>
                </span>
                <span>•</span>
                <span>
                  Guards: <strong className="text-amber-300">{user.bodyguards}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Core Stats: Cash, Personal Bank, Shared Family Vault, Health, Bullets, Rank Progress */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="bg-[#121212] border border-zinc-800 px-3 py-1.5">
              <span className="text-[10px] uppercase text-zinc-500 block">Pocket Cash</span>
              <span className="text-emerald-400 font-bold text-sm">
                ${user.cash.toLocaleString()}
              </span>
            </div>

            <div
              onClick={() => setActiveTab("bank")}
              title="Your Personal Bank balance (automatically used if Pocket Cash is short, or click to manage)"
              className="bg-[#121212] border border-zinc-800 hover:border-amber-500/50 px-3 py-1.5 cursor-pointer transition-colors"
            >
              <span className="text-[10px] uppercase text-zinc-500 block">
                Personal Bank
              </span>
              <span className="text-amber-300 font-bold text-sm">
                ${user.bankCash.toLocaleString()}
              </span>
            </div>

            {currentUserFamily && (
              <div
                onClick={() => setActiveTab("families")}
                title="Shared Family Vault (click to deposit, withdraw, or fund Turf Wars)"
                className="bg-[#121212] border border-amber-500/40 hover:border-amber-400 px-3 py-1.5 cursor-pointer transition-colors"
              >
                <span className="text-[10px] uppercase text-amber-400/80 block">
                  [{currentUserFamily.tag}] Family Vault
                </span>
                <span className="text-amber-400 font-bold text-sm">
                  ${currentUserFamily.treasuryCash.toLocaleString()}
                </span>
              </div>
            )}

            <div className="bg-[#121212] border border-zinc-800 px-3 py-1.5 min-w-[115px]">
              <div className="flex justify-between text-[10px] uppercase text-zinc-500">
                <span>Health</span>
                <span className="text-zinc-200 font-bold">{user.health}%</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 mt-1 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    user.health > 50
                      ? "bg-emerald-500"
                      : user.health > 25
                        ? "bg-amber-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, user.health))}%` }}
                />
              </div>
            </div>

            <div className="bg-[#121212] border border-zinc-800 px-3 py-1.5">
              <span className="text-[10px] uppercase text-zinc-500 block">Bullets (.45)</span>
              <span className="text-zinc-200 font-bold text-sm">
                {user.bullets.toLocaleString()}
              </span>
            </div>

            <div className="bg-[#121212] border border-zinc-800 px-3 py-1.5 min-w-[145px]">
              <div className="flex justify-between text-[10px] uppercase text-zinc-500">
                <span>Rank #{rankInfo.current.index + 1}/16</span>
                <span className="text-amber-400 font-bold">{rankInfo.progressPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 mt-1 overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all"
                  style={{ width: `${rankInfo.progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Live Countdown Timers Strip */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div
              className={`px-2.5 py-1 border ${
                crimeRemainingSec > 0
                  ? "bg-amber-950/30 border-amber-500/40 text-amber-300"
                  : "bg-emerald-950/30 border-emerald-500/30 text-emerald-400"
              }`}
            >
              <span className="text-[10px] uppercase block opacity-75">Crime Timer</span>
              <span className="font-bold">{formatSeconds(crimeRemainingSec)}</span>
            </div>

            <div
              className={`px-2.5 py-1 border ${
                gtaRemainingSec > 0
                  ? "bg-amber-950/30 border-amber-500/40 text-amber-300"
                  : "bg-emerald-950/30 border-emerald-500/30 text-emerald-400"
              }`}
            >
              <span className="text-[10px] uppercase block opacity-75">GTA Timer</span>
              <span className="font-bold">{formatSeconds(gtaRemainingSec)}</span>
            </div>

            <div
              className={`px-2.5 py-1 border ${
                isInJail
                  ? "bg-red-950/60 border-red-500 text-red-300 animate-pulse"
                  : "bg-[#121212] border-zinc-800 text-zinc-400"
              }`}
            >
              <span className="text-[10px] uppercase block opacity-75">Jail Status</span>
              <span className="font-bold">
                {isInJail ? `LOCKED (${formatSeconds(jailRemainingSec)})` : "FREE"}
              </span>
            </div>

            {isTraveling && (
              <div className="px-2.5 py-1 border bg-sky-950/50 border-sky-500/50 text-sky-300">
                <span className="text-[10px] uppercase block opacity-75">Transit</span>
                <span className="font-bold">{formatSeconds(travelRemainingSec)}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MAIN 2-COLUMN BODY (Fixed Left Navigation Sidebar + Central Action Viewport) */}
      <div className="flex-1 max-w-[1440px] w-full mx-auto flex flex-col md:flex-row">
        {/* 2. FIXED LEFT NAVIGATION SIDEBAR */}
        <aside className="w-full md:w-64 shrink-0 bg-[#181818] border-b md:border-b-0 md:border-r border-zinc-800 p-4 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-1.5 px-2">
                Rackets & Operations
              </div>
              <nav className="space-y-1">
                {[
                  {
                    id: "crimes" as NavTab,
                    label: "Street Crimes",
                    badge: crimeRemainingSec > 0 ? `${crimeRemainingSec}s` : "READY",
                    badgeTone: crimeRemainingSec > 0 ? "amber" : "emerald",
                  },
                  {
                    id: "oc" as NavTab,
                    label: "Organized Crime (OC)",
                    badge: `${organizedCrimes.length} Crews`,
                    badgeTone: "amber",
                  },
                  {
                    id: "gta" as NavTab,
                    label: "GTA (Steal Car)",
                    badge: gtaRemainingSec > 0 ? `${gtaRemainingSec}s` : "READY",
                    badgeTone: gtaRemainingSec > 0 ? "amber" : "emerald",
                  },
                  {
                    id: "garage" as NavTab,
                    label: "Chop-Shop Garage",
                    badge: `${user.vehicles.length}`,
                    badgeTone: "zinc",
                  },
                  {
                    id: "jail" as NavTab,
                    label: "Precinct Jail",
                    badge: `${activeInmates.length} Inmates`,
                    badgeTone: isInJail ? "red" : "zinc",
                  },
                  {
                    id: "combat" as NavTab,
                    label: "Hitlist, Recon & Will",
                    badge: `${bounties.length} Hits`,
                    badgeTone: "red",
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider transition cursor-pointer border ${
                      activeTab === item.id
                        ? "bg-amber-500/15 border-amber-500/60 text-amber-300"
                        : "bg-[#141414] border-zinc-800/80 text-zinc-300 hover:bg-zinc-800/60"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 ${
                        item.badgeTone === "emerald"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : item.badgeTone === "amber"
                            ? "bg-amber-500/20 text-amber-300"
                            : item.badgeTone === "red"
                              ? "bg-red-500/30 text-red-200"
                              : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {item.badge}
                    </span>
                  </button>
                ))}
              </nav>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-1.5 px-2">
                Syndicate & Economy
              </div>
              <nav className="space-y-1">
                {[
                  {
                    id: "empire" as NavTab,
                    label: "Fronts & Real Estate",
                    badge: `${user.businesses.length}/4`,
                  },
                  {
                    id: "casino" as NavTab,
                    label: "Casino & Horse Derby",
                    badge: "4 Games",
                  },
                  {
                    id: "families" as NavTab,
                    label: "Families & Turf Wars",
                    badge: user.familyTag ? `[${user.familyTag}]` : `${families.length}`,
                  },
                  {
                    id: "leaderboards" as NavTab,
                    label: "Leaderboards",
                    badge: "TOP",
                  },
                  {
                    id: "smuggling" as NavTab,
                    label: "Booze & Narcotics",
                    badge: `${carriedBooze + carriedNarcotics}`,
                  },
                  {
                    id: "travel" as NavTab,
                    label: "City Transit",
                    badge: user.city,
                  },
                  {
                    id: "bank" as NavTab,
                    label: "Bank & Surgeon",
                    badge: `$${(user.bankCash / 1000).toFixed(1)}k`,
                  },
                  {
                    id: "newspaper" as NavTab,
                    label: "The Syndicate Gazette",
                    badge: `${logs.length}`,
                  },
                  {
                    id: "ranks" as NavTab,
                    label: "16-Tier Hierarchy",
                    badge: `#${rankInfo.current.index + 1}`,
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider transition cursor-pointer border ${
                      activeTab === item.id
                        ? "bg-amber-500/15 border-amber-500/60 text-amber-300"
                        : "bg-[#141414] border-zinc-800/80 text-zinc-300 hover:bg-zinc-800/60"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-zinc-800 text-zinc-400">
                      {item.badge}
                    </span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Anti-Cheat Trap Tester Switch */}
            <div className="bg-[#121212] border border-zinc-800 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">
                  Anti-Cheat Trap Test
                </span>
                <button
                  type="button"
                  onClick={() => setBypassClientLock((v) => !v)}
                  className={`text-[10px] px-2 py-0.5 font-bold uppercase cursor-pointer border ${
                    bypassClientLock
                      ? "bg-red-500/20 border-red-500 text-red-300"
                      : "bg-zinc-800 border-zinc-700 text-zinc-400"
                  }`}
                >
                  {bypassClientLock ? "UNLOCKED" : "SAFE"}
                </button>
              </div>
              <p className="text-[11px] text-zinc-400 leading-snug">
                Toggle <strong>UNLOCKED</strong> to click Crime/GTA buttons during cooldowns and
                trigger the server&apos;s <em>Anti-Tamper Timer Trap</em>!
              </p>
            </div>
          </div>

          {/* Dossier Footer & Logout */}
          <div className="border-t border-zinc-800 pt-4 space-y-3 text-xs text-zinc-400">
            <div className="grid grid-cols-4 gap-1 text-center bg-[#121212] border border-zinc-800 p-2">
              <div>
                <div className="text-[10px] text-zinc-500 uppercase">Crimes</div>
                <div className="font-bold text-zinc-200">{user.crimesCommitted}</div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 uppercase">Boosts</div>
                <div className="font-bold text-zinc-200">{user.carsStolen}</div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 uppercase">Busts</div>
                <div className="font-bold text-zinc-200">{user.bustsSucceeded}</div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 uppercase">Whacks</div>
                <div className="font-bold text-red-400">{user.killsCount}</div>
              </div>
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs uppercase tracking-widest cursor-pointer"
              >
                Leave Territory (Sign Out)
              </button>
            </form>
          </div>
        </aside>

        {/* 3. CENTRAL ACTION VIEWPORT */}
        <main className="flex-1 p-4 md:p-6 space-y-5 overflow-y-auto">
          {/* Active Jail Lockup Banner */}
          {isInJail && (
            <div className="bg-red-950/40 border-2 border-red-500/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-red-400">
                  PRECINCT LOCKUP — BEHIND BARS ({formatSeconds(jailRemainingSec)} REMAINING)
                </div>
                <div className="text-xs text-zinc-200 mt-1">
                  {user.jailReason || `Detained in ${user.city} Precinct Cell.`}
                </div>
                <div className="text-[11px] text-red-300/80 mt-1">
                  Warning: Attempting crimes or car thefts before release triggers the Anti-Tamper
                  Trap and extends your sentence!
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {user.familyId && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => runAction(() => familyBailMemberAction(user.id))}
                    className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold text-xs uppercase tracking-wider px-4 py-2.5 cursor-pointer"
                  >
                    Family Vault Bail ($250)
                  </button>
                )}
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => runAction(() => bribeWardenAction())}
                  className="bg-red-500 hover:bg-red-400 disabled:opacity-50 text-black font-bold text-xs uppercase tracking-wider px-4 py-2.5 cursor-pointer"
                >
                  Bribe Warden (${Math.max(150, jailRemainingSec * 8).toLocaleString()})
                </button>
              </div>
            </div>
          )}

          {/* Action Result Notification Banner */}
          {feedback && (
            <div
              className={`p-4 border flex items-start justify-between gap-4 ${
                feedback.tone === "anti-cheat"
                  ? "bg-fuchsia-950/50 border-fuchsia-500 text-fuchsia-200"
                  : feedback.tone === "success"
                    ? "bg-emerald-950/40 border-emerald-500/60 text-emerald-200"
                    : feedback.tone === "danger"
                      ? "bg-red-950/40 border-red-500/60 text-red-200"
                      : "bg-amber-950/40 border-amber-500/60 text-amber-200"
              }`}
            >
              <div>
                <div className="text-xs font-black uppercase tracking-wider">{feedback.title}</div>
                <div className="text-xs text-zinc-200 mt-1">{feedback.message}</div>
              </div>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="text-xs text-zinc-400 hover:text-white uppercase cursor-pointer"
              >
                [Dismiss]
              </button>
            </div>
          )}

          {/* VIEWPORT: CRIMES (STAGE 2) */}
          {activeTab === "crimes" && (
            <section className="space-y-4">
              <div className="bg-[#1a1a1a] border border-zinc-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-zinc-100 uppercase">
                    Street Crimes & Heists — {user.city}
                  </h2>
                  <p className="text-xs text-zinc-400">
                    All success rates and rewards are rolled strictly on the server. Higher ranks
                    unlock heavier heists and boost accuracy.
                  </p>
                </div>
                <div className="text-xs px-3 py-1.5 bg-[#121212] border border-zinc-800">
                  Cooldown:{" "}
                  <strong
                    className={crimeRemainingSec > 0 ? "text-amber-400" : "text-emerald-400"}
                  >
                    {formatSeconds(crimeRemainingSec)}
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {crimes.map((crime) => {
                  const reqRank = RANKS[crime.rankRequirement];
                  const rankLocked = rankInfo.current.index < crime.rankRequirement;
                  const rankBonus = Math.min(
                    15,
                    Math.max(0, (rankInfo.current.index - crime.rankRequirement) * 2.5)
                  );
                  const effectiveSuccess = Math.min(95, crime.baseSuccessRate + rankBonus);

                  const clientDisabled =
                    isPending ||
                    rankLocked ||
                    (!bypassClientLock && (crimeRemainingSec > 0 || isInJail || isTraveling));

                  return (
                    <div
                      key={crime.id}
                      className={`bg-[#1a1a1a] border p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        rankLocked ? "border-zinc-800/50 opacity-60" : "border-zinc-800"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-amber-400 font-bold uppercase">
                            Tier {crime.tier}
                          </span>
                          <h3 className="text-sm font-bold text-zinc-100">{crime.name}</h3>
                          {rankLocked && (
                            <span className="text-[10px] px-2 py-0.5 bg-red-950/60 border border-red-500/40 text-red-300 uppercase">
                              Requires {reqRank?.name}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400">{crime.description}</p>
                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-400 pt-1">
                          <span>
                            Payout:{" "}
                            <strong className="text-emerald-400">
                              ${crime.baseCashMin.toLocaleString()} – $
                              {crime.baseCashMax.toLocaleString()}
                            </strong>
                          </span>
                          <span>
                            Odds:{" "}
                            <strong className="text-amber-300">
                              {effectiveSuccess.toFixed(0)}%
                            </strong>
                          </span>
                          <span>
                            XP: <strong className="text-zinc-200">+{crime.rankPointsReward}</strong>
                          </span>
                          <span>
                            Cooldown:{" "}
                            <strong className="text-zinc-200">{crime.cooldownSeconds}s</strong>
                          </span>
                          <span>
                            Risk:{" "}
                            <strong className="text-red-400">{crime.jailSeconds}s Jail</strong>
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={clientDisabled}
                        onClick={() => runAction(() => commitCrimeAction(crime.id))}
                        className={`shrink-0 px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                          rankLocked
                            ? "bg-zinc-900 text-zinc-500 border border-zinc-800 cursor-not-allowed"
                            : crimeRemainingSec > 0 && bypassClientLock
                              ? "bg-fuchsia-600 hover:bg-fuchsia-500 text-white border border-fuchsia-400"
                              : clientDisabled
                                ? "bg-zinc-900 text-zinc-500 border border-zinc-800 cursor-not-allowed"
                                : "bg-amber-500 hover:bg-amber-400 text-black"
                        }`}
                      >
                        {rankLocked
                          ? `Locked (${reqRank?.name})`
                          : crimeRemainingSec > 0
                            ? bypassClientLock
                              ? `Force Early (${crimeRemainingSec}s) [TRAP]`
                              : `Wait ${crimeRemainingSec}s`
                            : "Commit Crime"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* VIEWPORT: ORGANIZED CRIME (OC) MULTI-ROLE CREW HEISTS (STAGE 6) */}
          {activeTab === "oc" && (
            <section className="space-y-5">
              <div className="bg-[#1a1a1a] border border-zinc-800 p-4">
                <h2 className="text-lg font-bold tracking-tight text-zinc-100 uppercase">
                  Organized Crime (OC) — 4-Role Syndicate Crew Heists
                </h2>
                <p className="text-xs text-zinc-400">
                  Assemble a 4-man crew (<strong>Mastermind</strong>,{" "}
                  <strong>Weapons Expert</strong>, <strong>Demolitions Tech</strong>, and{" "}
                  <strong>Getaway Driver</strong>) to pull off multi-million feel federal scores.
                </p>
              </div>

              {/* Blueprints to Start a New OC Crew */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {OC_HEIST_TEMPLATES.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="bg-[#1a1a1a] border border-zinc-800 p-4 flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-amber-400 uppercase">{tpl.title}</h3>
                      <p className="text-xs text-zinc-400">{tpl.description}</p>
                      <div className="text-xs text-zinc-300 pt-1">
                        Est. Take:{" "}
                        <strong className="text-emerald-400">
                          ${tpl.payoutMin.toLocaleString()} – ${tpl.payoutMax.toLocaleString()}
                        </strong>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={isPending || isInJail}
                      onClick={() => runAction(() => createOrganizedCrimeAction(tpl.id))}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase cursor-pointer"
                    >
                      Plan Heist as Mastermind (${tpl.setupCost.toLocaleString()})
                    </button>
                  </div>
                ))}
              </div>

              {/* Active Recruiting OC Crews */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Active Recruiting Heist Crews ({organizedCrimes.length})
                </h3>
                {organizedCrimes.map((oc) => {
                  const readyToLaunch =
                    Boolean(oc.weaponsName) &&
                    Boolean(oc.demolitionsName) &&
                    Boolean(oc.driverName);

                  return (
                    <div
                      key={oc.id}
                      className="bg-[#1a1a1a] border border-zinc-800 p-5 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-300 font-bold uppercase">
                              {oc.city} Operation
                            </span>
                            <h4 className="text-base font-bold text-zinc-100">{oc.title}</h4>
                          </div>
                          <div className="text-xs text-zinc-400 mt-0.5">
                            Target Score:{" "}
                            <strong className="text-emerald-400">
                              ${oc.targetPayoutMin.toLocaleString()} – $
                              {oc.targetPayoutMax.toLocaleString()}
                            </strong>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isPending || isInJail || !readyToLaunch}
                          onClick={() => runAction(() => executeOrganizedCrimeAction(oc.id))}
                          className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer ${
                            readyToLaunch
                              ? "bg-emerald-500 hover:bg-emerald-400 text-black"
                              : "bg-zinc-900 text-zinc-500 border border-zinc-800 cursor-not-allowed"
                          }`}
                        >
                          {readyToLaunch ? "Execute Coordinated Heist →" : "Fill All 4 Roles First"}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                        {/* Slot 1: Mastermind */}
                        <div className="bg-[#121212] border border-zinc-800 p-3">
                          <div className="text-[10px] uppercase text-zinc-500">
                            1. Mastermind / Leader
                          </div>
                          <div className="text-sm font-bold text-amber-400 mt-1">
                            {oc.leaderName}
                          </div>
                        </div>

                        {/* Slot 2..4 */}
                        {(
                          [
                            {
                              key: "weapons" as const,
                              label: "2. Weapons Expert",
                              val: oc.weaponsName,
                            },
                            {
                              key: "demolitions" as const,
                              label: "3. Demolitions Tech",
                              val: oc.demolitionsName,
                            },
                            {
                              key: "driver" as const,
                              label: "4. Getaway Driver",
                              val: oc.driverName,
                            },
                          ] as const
                        ).map((slot) => (
                          <div
                            key={slot.key}
                            className="bg-[#121212] border border-zinc-800 p-3 flex flex-col justify-between gap-2"
                          >
                            <div>
                              <div className="text-[10px] uppercase text-zinc-500">
                                {slot.label}
                              </div>
                              <div className="text-sm font-bold text-zinc-100 mt-1">
                                {slot.val || (
                                  <span className="text-zinc-500 italic">Open Slot</span>
                                )}
                              </div>
                            </div>
                            {!slot.val && (
                              <div className="flex gap-1.5 pt-1">
                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() =>
                                    runAction(() =>
                                      joinOrganizedCrimeRoleAction(oc.id, slot.key, false)
                                    )
                                  }
                                  className="flex-1 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-[10px] uppercase cursor-pointer"
                                >
                                  Take Role
                                </button>
                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() =>
                                    runAction(() =>
                                      joinOrganizedCrimeRoleAction(oc.id, slot.key, true)
                                    )
                                  }
                                  className="flex-1 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-[10px] uppercase cursor-pointer"
                                >
                                  Hire NPC ($500)
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* VIEWPORT: GTA / STEAL A CAR (STAGE 2) */}
          {activeTab === "gta" && (
            <section className="space-y-4">
              <div className="bg-[#1a1a1a] border border-zinc-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-zinc-100 uppercase">
                    Grand Theft Auto — {user.city} Streets
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Boost pre-war vehicles and stash them in your Garage. Repair body damage or ship
                    cars to another city for a +25% fencing bonus.
                  </p>
                </div>
                <div className="text-xs px-3 py-1.5 bg-[#121212] border border-zinc-800">
                  GTA Timer:{" "}
                  <strong className={gtaRemainingSec > 0 ? "text-amber-400" : "text-emerald-400"}>
                    {formatSeconds(gtaRemainingSec)}
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {GTA_OPTIONS.map((gta) => {
                  const reqRank = RANKS[gta.rankRequirement];
                  const rankLocked = rankInfo.current.index < gta.rankRequirement;
                  const effectiveOdds = Math.min(
                    90,
                    gta.baseSuccessRate +
                      Math.max(0, (rankInfo.current.index - gta.rankRequirement) * 2)
                  );
                  const clientDisabled =
                    isPending ||
                    rankLocked ||
                    (!bypassClientLock && (gtaRemainingSec > 0 || isInJail || isTraveling));

                  return (
                    <div
                      key={gta.id}
                      className="bg-[#1a1a1a] border border-zinc-800 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-zinc-100">{gta.label}</h3>
                          {rankLocked && (
                            <span className="text-[10px] px-2 py-0.5 bg-red-950/60 border border-red-500/40 text-red-300 uppercase">
                              Requires {reqRank?.name}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400">{gta.subtitle}</p>
                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-400 pt-1">
                          <span>
                            Success Odds:{" "}
                            <strong className="text-amber-300">{effectiveOdds}%</strong>
                          </span>
                          <span>
                            XP Reward:{" "}
                            <strong className="text-zinc-200">+{gta.rankPointsReward}</strong>
                          </span>
                          <span>
                            Cooldown:{" "}
                            <strong className="text-zinc-200">{gta.cooldownSeconds}s</strong>
                          </span>
                          <span>
                            Heat Risk:{" "}
                            <strong className="text-red-400">{gta.jailSeconds}s Jail</strong>
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={clientDisabled}
                        onClick={() => runAction(() => commitGtaAction(gta.id))}
                        className={`shrink-0 px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                          rankLocked
                            ? "bg-zinc-900 text-zinc-500 border border-zinc-800 cursor-not-allowed"
                            : gtaRemainingSec > 0 && bypassClientLock
                              ? "bg-fuchsia-600 hover:bg-fuchsia-500 text-white border border-fuchsia-400"
                              : clientDisabled
                                ? "bg-zinc-900 text-zinc-500 border border-zinc-800 cursor-not-allowed"
                                : "bg-amber-500 hover:bg-amber-400 text-black"
                        }`}
                      >
                        {rankLocked
                          ? `Locked (${reqRank?.name})`
                          : gtaRemainingSec > 0
                            ? bypassClientLock
                              ? `Force GTA (${gtaRemainingSec}s) [TRAP]`
                              : `Cooldown ${gtaRemainingSec}s`
                            : "Boost Vehicle"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* VIEWPORT: GARAGE (STAGE 2 & STAGE 4) */}
          {activeTab === "garage" && (
            <section className="space-y-4">
              <div className="bg-[#1a1a1a] border border-zinc-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-zinc-100 uppercase">
                    Underground Chop-Shop & Garage ({user.vehicles.length} Stored)
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Repair body damage to maximize payout, or ship stolen cars out-of-state for a
                    +25% clean-plates fencing bonus.
                  </p>
                </div>
              </div>

              {user.vehicles.length === 0 ? (
                <div className="bg-[#1a1a1a] border border-zinc-800 p-8 text-center space-y-3">
                  <div className="text-sm text-zinc-300 font-bold uppercase">
                    Your Garage is Empty
                  </div>
                  <p className="text-xs text-zinc-500">
                    Visit the GTA tab to hotwire parked sedans, bribe valets, or raid luxury
                    dealerships.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("gta")}
                    className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase px-4 py-2 cursor-pointer"
                  >
                    Go to GTA →
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {user.vehicles.map((car) => {
                    const conditionFactor = Math.max(0.15, (100 - car.damage) / 100);
                    const isSmuggled = car.currentCity !== car.originCity;
                    const saleValue = Math.round(
                      car.baseValue * conditionFactor * (isSmuggled ? 1.25 : 1.0)
                    );
                    const repairCost =
                      car.damage > 0
                        ? Math.max(60, Math.round(car.baseValue * (car.damage / 100) * 0.25))
                        : 0;
                    const defaultShipCity =
                      shipTargets[car.id] ||
                      CITIES.find((c) => c.name !== car.currentCity)?.name ||
                      "Chicago";

                    return (
                      <div
                        key={car.id}
                        className="bg-[#1a1a1a] border border-zinc-800 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] px-2 py-0.5 font-bold uppercase ${
                                car.classTier === "Exotic"
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                  : car.classTier === "Executive"
                                    ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                                    : "bg-zinc-800 text-zinc-300"
                              }`}
                            >
                              {car.classTier}
                            </span>
                            <h3 className="text-sm font-bold text-zinc-100">{car.name}</h3>
                            {isSmuggled && (
                              <span className="text-[10px] px-2 py-0.5 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 uppercase">
                                +25% Out-of-State Plates
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
                            <span>
                              Base Value:{" "}
                              <strong className="text-zinc-200">
                                ${car.baseValue.toLocaleString()}
                              </strong>
                            </span>
                            <span>
                              Damage:{" "}
                              <strong
                                className={
                                  car.damage === 0
                                    ? "text-emerald-400"
                                    : car.damage < 40
                                      ? "text-amber-400"
                                      : "text-red-400"
                                }
                              >
                                {car.damage}%
                              </strong>
                            </span>
                            <span>
                              Origin: <strong className="text-zinc-300">{car.originCity}</strong>
                            </span>
                            <span>
                              Parked In:{" "}
                              <strong className="text-amber-300">{car.currentCity}</strong>
                            </span>
                            <span>
                              Fence Quote:{" "}
                              <strong className="text-emerald-400">
                                ${saleValue.toLocaleString()}
                              </strong>
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {car.damage > 0 && (
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => runAction(() => repairVehicleAction(car.id))}
                              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs uppercase font-bold cursor-pointer border border-zinc-700"
                            >
                              Repair (${repairCost.toLocaleString()})
                            </button>
                          )}

                          <div className="flex items-center border border-zinc-700 bg-[#121212]">
                            <select
                              value={defaultShipCity}
                              onChange={(e) =>
                                setShipTargets((prev) => ({
                                  ...prev,
                                  [car.id]: e.target.value,
                                }))
                              }
                              className="bg-transparent text-xs px-2 py-2 text-zinc-200 outline-none"
                            >
                              {CITIES.filter((c) => c.name !== car.currentCity).map((c) => (
                                <option key={c.name} value={c.name} className="bg-[#121212]">
                                  {c.name}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() =>
                                runAction(() => shipVehicleAction(car.id, defaultShipCity))
                              }
                              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-xs uppercase font-bold cursor-pointer border-l border-zinc-700"
                            >
                              Ship ($220)
                            </button>
                          </div>

                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => runAction(() => sellVehicleAction(car.id))}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs uppercase font-bold cursor-pointer"
                          >
                            Fence (${saleValue.toLocaleString()})
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* VIEWPORT: PRECINCT JAIL & BUSTING (STAGE 3 + SHARED FAMILY VAULT BAIL) */}
          {activeTab === "jail" && (
            <section className="space-y-4">
              <div className="bg-[#1a1a1a] border border-zinc-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-zinc-100 uppercase">
                    Precinct Lockup & Jailbreak Roster
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Bust incarcerated mobsters out of jail for +18 Rank XP and $175 tribute, or use
                    your Family&apos;s Shared Vault ($250) to bail out made members!
                  </p>
                </div>
                <div className="text-xs px-3 py-1.5 bg-[#121212] border border-zinc-800">
                  Your Bust Odds:{" "}
                  <strong className="text-amber-400">
                    {Math.min(88, 52 + rankInfo.current.index * 3)}%
                  </strong>
                </div>
              </div>

              {activeInmates.length === 0 ? (
                <div className="bg-[#1a1a1a] border border-zinc-800 p-8 text-center text-xs text-zinc-400">
                  No mobsters are currently behind bars. Check back in a moment!
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {activeInmates.map((inmate) => {
                    const remSec = Math.max(0, Math.ceil((inmate.jailUntilMs - nowMs) / 1000));
                    const inmateRank = getRankInfo(inmate.rankPoints).current.name;
                    const isSelf = inmate.id === user.id;
                    const sameFamily =
                      Boolean(user.familyId) && user.familyId === inmate.familyId;

                    return (
                      <div
                        key={inmate.id}
                        className="bg-[#1a1a1a] border border-zinc-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-zinc-100">
                              {inmate.username}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-amber-400 uppercase">
                              {inmateRank}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 bg-zinc-900 border border-zinc-700 text-zinc-400 uppercase">
                              {inmate.city} Precinct
                            </span>
                            {sameFamily && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 uppercase font-bold">
                                [{user.familyTag}] Family Member
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400">
                            {inmate.jailReason || "Held on suspicion of racketeering"}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <div className="text-right mr-2">
                            <div className="text-[10px] uppercase text-zinc-500">Sentence</div>
                            <div className="text-xs font-bold text-red-400">
                              {formatSeconds(remSec)}
                            </div>
                          </div>

                          {sameFamily && (
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => runAction(() => familyBailMemberAction(inmate.id))}
                              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-amber-500/40 text-amber-300 font-bold text-xs uppercase cursor-pointer"
                            >
                              Family Vault Bail ($250)
                            </button>
                          )}

                          {isSelf ? (
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => runAction(() => bribeWardenAction())}
                              className="px-4 py-2 bg-red-500 hover:bg-red-400 text-black font-bold text-xs uppercase cursor-pointer"
                            >
                              Bribe Warden (${Math.max(150, remSec * 8).toLocaleString()})
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isPending || isInJail || isTraveling}
                              onClick={() => runAction(() => bustInmateAction(inmate.id))}
                              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-900 disabled:text-zinc-500 text-black font-bold text-xs uppercase cursor-pointer"
                            >
                              {isInJail ? "You Are In Jail" : "Bust Out (+18 XP)"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* VIEWPORT: HITLIST, RECON, ARMS & LAST WILL (STAGE 6.3 & 6.4) */}
          {activeTab === "combat" && (
            <section className="space-y-6">
              <div className="bg-[#1a1a1a] border border-zinc-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-zinc-100 uppercase">
                    Arms, Detectives, Hitlist Bounties & Assassinations
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Equip heavy weapons, hire bodyguards, track targets across cities with
                    Detectives, claim Hitlist Bounties, and notarize your Last Will & Testament.
                  </p>
                </div>
                <div className="text-xs px-3 py-1.5 bg-[#121212] border border-zinc-800">
                  Weapon: <strong className="text-amber-400">{user.equippedWeapon}</strong> (+
                  {user.weaponPower}) | Armor:{" "}
                  <strong className="text-emerald-400">{user.equippedArmor}</strong> (+
                  {user.armorDefense})
                </div>
              </div>

              {/* Row 1: Detectives & Assassination Strike + Hitlist Bounties */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Detective Recon & Assassination Strike */}
                <div className="bg-[#1a1a1a] border border-zinc-800 p-5 space-y-4">
                  <h3 className="text-sm font-bold uppercase text-red-400 border-b border-zinc-800 pb-2">
                    1. Private Detectives & Assassination Contract
                  </h3>

                  <div className="space-y-2 bg-[#121212] border border-zinc-800 p-3">
                    <label className="block text-[10px] uppercase text-zinc-400">
                      Hire Private Detective to Locate Target ($400)
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={reconTarget}
                        onChange={(e) => {
                          setReconTarget(e.target.value);
                          setHitTarget(e.target.value);
                        }}
                        className="flex-1 bg-[#1a1a1a] border border-zinc-700 px-3 py-2 text-xs text-zinc-100 outline-none"
                      >
                        {leaderboardPlayers
                          .filter((p) => p.id !== user.id)
                          .map((p) => (
                            <option key={p.id} value={p.username}>
                              {p.username} ({p.familyTag ? `[${p.familyTag}]` : "Independent"})
                            </option>
                          ))}
                      </select>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => runAction(() => hireDetectiveAction(reconTarget))}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-amber-300 font-bold text-xs uppercase cursor-pointer"
                      >
                        Track ($400)
                      </button>
                    </div>

                    {user.detectiveReports.length > 0 && (
                      <div className="pt-2 space-y-1">
                        <div className="text-[10px] uppercase text-zinc-500">
                          Recent Detective Recon Files:
                        </div>
                        {user.detectiveReports.slice(0, 3).map((rep) => (
                          <div
                            key={rep.id}
                            className="text-[11px] text-zinc-300 flex items-center justify-between bg-[#181818] px-2.5 py-1 border border-zinc-800"
                          >
                            <span>
                              <strong>{rep.targetUsername}</strong> →{" "}
                              <span className="text-amber-400 font-bold">{rep.discoveredCity}</span>
                            </span>
                            <span>
                              {rep.targetHealth}% HP | {rep.targetGuards} Guards
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Launch Hit */}
                  <div className="space-y-3 bg-red-950/20 border border-red-500/40 p-3">
                    <div className="text-xs font-bold uppercase text-red-300">
                      Execute Drive-By Assassination (Must Be in Target&apos;s City)
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] uppercase text-zinc-400 mb-1">
                          Target Handle
                        </label>
                        <input
                          type="text"
                          value={hitTarget}
                          onChange={(e) => setHitTarget(e.target.value)}
                          className="w-full bg-[#121212] border border-zinc-700 px-3 py-1.5 text-xs text-zinc-100 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase text-zinc-400 mb-1">
                          Bullets to Fire (Have: {user.bullets})
                        </label>
                        <input
                          type="number"
                          min={5}
                          max={200}
                          value={bulletsToFire}
                          onChange={(e) => setBulletsToFire(e.target.value)}
                          className="w-full bg-[#121212] border border-zinc-700 px-3 py-1.5 text-xs text-zinc-100 outline-none"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={isPending || isInJail}
                      onClick={() =>
                        runAction(() =>
                          executeAssassinationAction(hitTarget, Number(bulletsToFire))
                        )
                      }
                      className="w-full py-2.5 bg-red-500 hover:bg-red-400 text-black font-black text-xs uppercase tracking-wider cursor-pointer"
                    >
                      Open Fire & Whack {hitTarget} ({bulletsToFire} Bullets)
                    </button>
                  </div>
                </div>

                {/* The Hitlist & Bounties */}
                <div className="bg-[#1a1a1a] border border-zinc-800 p-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold uppercase text-amber-400 border-b border-zinc-800 pb-2">
                      2. Commission Hitlist & Open Bounties ({bounties.length})
                    </h3>

                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {bounties.map((b) => (
                        <div
                          key={b.id}
                          className="bg-[#121212] border border-zinc-800 p-3 flex items-center justify-between gap-2"
                        >
                          <div>
                            <div className="text-xs font-bold text-zinc-100">
                              Target: <span className="text-red-400">{b.targetUsername}</span>
                            </div>
                            <div className="text-[11px] text-zinc-400">
                              Reason: &ldquo;{b.reason}&rdquo; (by {b.posterUsername})
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs font-bold text-emerald-400">
                              ${b.rewardCash.toLocaleString()}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setReconTarget(b.targetUsername);
                                setHitTarget(b.targetUsername);
                              }}
                              className="text-[10px] text-amber-400 underline uppercase cursor-pointer"
                            >
                              Select Target
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Place a New Bounty */}
                  <div className="bg-[#121212] border border-zinc-800 p-3 space-y-2">
                    <div className="text-xs font-bold uppercase text-zinc-300">
                      Put a Price on a Rival&apos;s Head
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={bountyTarget}
                        onChange={(e) => setBountyTarget(e.target.value)}
                        className="bg-[#1a1a1a] border border-zinc-700 px-2 py-1.5 text-xs text-zinc-100 outline-none"
                      >
                        {leaderboardPlayers
                          .filter((p) => p.id !== user.id)
                          .map((p) => (
                            <option key={p.id} value={p.username}>
                              {p.username}
                            </option>
                          ))}
                      </select>
                      <input
                        type="number"
                        min={500}
                        value={bountyAmount}
                        onChange={(e) => setBountyAmount(e.target.value)}
                        placeholder="Bounty ($)"
                        className="bg-[#1a1a1a] border border-zinc-700 px-2 py-1.5 text-xs text-zinc-100 outline-none"
                      />
                    </div>
                    <input
                      type="text"
                      value={bountyReason}
                      onChange={(e) => setBountyReason(e.target.value)}
                      placeholder="Contract reason..."
                      className="w-full bg-[#1a1a1a] border border-zinc-700 px-2 py-1.5 text-xs text-zinc-100 outline-none"
                    />
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        runAction(() =>
                          placeBountyAction(bountyTarget, Number(bountyAmount), bountyReason)
                        )
                      }
                      className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase cursor-pointer"
                    >
                      Post Contract Bounty (${Number(bountyAmount || 0).toLocaleString()})
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 2: Gun Shop, Armor, Bodyguards & City Bullet Factory */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Heavy Weapons */}
                <div className="bg-[#1a1a1a] border border-zinc-800 p-4 space-y-3">
                  <h3 className="text-sm font-bold uppercase text-amber-400 border-b border-zinc-800 pb-2">
                    Heavy Weapons Rack
                  </h3>
                  {WEAPONS_CATALOG.map((w) => {
                    const equipped = user.equippedWeapon === w.name;
                    return (
                      <div
                        key={w.name}
                        className="bg-[#121212] border border-zinc-800 p-3 flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="text-xs font-bold text-zinc-100">{w.name}</div>
                          <div className="text-[11px] text-zinc-400">
                            Power: <strong className="text-amber-300">+{w.power}</strong> —{" "}
                            {w.description}
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={isPending || equipped}
                          onClick={() => runAction(() => buyWeaponOrArmorAction("weapon", w.name))}
                          className="shrink-0 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-bold text-xs uppercase cursor-pointer"
                        >
                          {equipped ? "Equipped" : `$${w.cost.toLocaleString()}`}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Armor & Bodyguards */}
                <div className="bg-[#1a1a1a] border border-zinc-800 p-4 space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold uppercase text-emerald-400 border-b border-zinc-800 pb-2">
                      Ballistic Protection & Bodyguards
                    </h3>
                    {ARMOR_CATALOG.map((a) => {
                      const equipped = user.equippedArmor === a.name;
                      return (
                        <div
                          key={a.name}
                          className="bg-[#121212] border border-zinc-800 p-3 flex items-center justify-between gap-2"
                        >
                          <div>
                            <div className="text-xs font-bold text-zinc-100">{a.name}</div>
                            <div className="text-[11px] text-zinc-400">
                              Defense: <strong className="text-emerald-300">+{a.defense}</strong>
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={isPending || equipped}
                            onClick={() => runAction(() => buyWeaponOrArmorAction("armor", a.name))}
                            className="shrink-0 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-bold text-xs uppercase cursor-pointer"
                          >
                            {equipped ? "Equipped" : `$${a.cost.toLocaleString()}`}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bodyguards */}
                  <div className="bg-[#121212] border border-zinc-800 p-3 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-zinc-200">Personal Bodyguards</span>
                      <span className="text-amber-400 font-bold">{user.bodyguards} / 15</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Each bodyguard absorbs an assassination volley before your health takes
                      damage ($650/guard).
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => runAction(() => hireBodyguardsAction(1))}
                        className="py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-xs uppercase cursor-pointer border border-zinc-700"
                      >
                        Hire +1 ($650)
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => runAction(() => hireBodyguardsAction(3))}
                        className="py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase cursor-pointer"
                      >
                        Hire +3 ($1,950)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Local City Bullet Factory + Last Will & Testament */}
                <div className="space-y-4">
                  <div className="bg-[#1a1a1a] border border-zinc-800 p-4 space-y-3">
                    <h3 className="text-sm font-bold uppercase text-sky-400 border-b border-zinc-800 pb-2">
                      {user.city} Bullet Factory
                    </h3>
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div>
                        Proprietor:{" "}
                        <strong className="text-zinc-200">
                          {localBulletFactory?.ownerName || "The Commission"}
                        </strong>
                      </div>
                      <div>
                        Factory Stock:{" "}
                        <strong className="text-amber-300">
                          {localBulletFactory?.bulletStock ?? 500} rounds
                        </strong>{" "}
                        @{" "}
                        <strong className="text-emerald-400">
                          ${localBulletFactory?.bulletPrice ?? 12}/bullet
                        </strong>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={10}
                        max={500}
                        value={factoryBuyQty}
                        onChange={(e) => setFactoryBuyQty(e.target.value)}
                        className="w-24 bg-[#121212] border border-zinc-700 px-2 py-1.5 text-xs text-zinc-100 outline-none"
                      />
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          runAction(() => buyFactoryBulletsAction(Number(factoryBuyQty)))
                        }
                        className="flex-1 py-1.5 bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs uppercase cursor-pointer"
                      >
                        Buy {factoryBuyQty} Rounds ($
                        {(
                          Number(factoryBuyQty || 0) * (localBulletFactory?.bulletPrice ?? 12)
                        ).toLocaleString()}
                        )
                      </button>
                    </div>
                  </div>

                  {/* Last Will & Testament */}
                  <div className="bg-[#1a1a1a] border border-zinc-800 p-4 space-y-3">
                    <h3 className="text-sm font-bold uppercase text-amber-400 border-b border-zinc-800 pb-2">
                      The Last Will & Testament
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      If you get assassinated, your designated Heir automatically inherits 50% of
                      your estate and your final words appear in the Newspaper Obituary.
                    </p>
                    <div>
                      <label className="block text-[10px] uppercase text-zinc-400 mb-1">
                        Designated Heir Username
                      </label>
                      <input
                        type="text"
                        value={heirInput}
                        onChange={(e) => setHeirInput(e.target.value)}
                        placeholder="e.g. Vito_Castellano"
                        className="w-full bg-[#121212] border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-100 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-zinc-400 mb-1">
                        Final Testament Quote
                      </label>
                      <input
                        type="text"
                        value={willInput}
                        onChange={(e) => setWillInput(e.target.value)}
                        className="w-full bg-[#121212] border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-100 outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => runAction(() => updateWillAction(heirInput, willInput))}
                      className="w-full py-2 bg-zinc-200 hover:bg-white text-black font-bold text-xs uppercase cursor-pointer"
                    >
                      Notarize Last Will & Testament
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* VIEWPORT: FRONTS, REAL ESTATE SAFEHOUSES & CITY MONOPOLIES (STAGE 6.2) */}
          {activeTab === "empire" && (
            <section className="space-y-6">
              <div className="bg-[#1a1a1a] border border-zinc-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-zinc-100 uppercase">
                    Syndicate Empire — Front Businesses, Safehouses & City Monopolies
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Acquire passive-income money laundering fronts, upgrade fortified safehouses to
                    expand contraband storage, or buy out entire City Casinos & Bullet Factories!
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isPending || user.businesses.length === 0}
                  onClick={() => runAction(() => collectBusinessIncomeAction())}
                  className="shrink-0 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-900 disabled:text-zinc-600 text-black font-bold text-xs uppercase cursor-pointer"
                >
                  Collect All Front Revenue →
                </button>
              </div>

              {/* 1. Front Businesses */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  1. Money Laundering Front Businesses (Passive Clean Bank Income)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {FRONT_BUSINESS_CATALOG.map((spec) => {
                    const owned = user.businesses.find(
                      (b) => b.businessType === spec.businessType
                    );
                    const nextLevel = (owned?.level ?? 0) + 1;
                    const nextCost = Math.round(spec.baseCost * Math.pow(1.55, nextLevel - 1));

                    return (
                      <div
                        key={spec.businessType}
                        className="bg-[#1a1a1a] border border-zinc-800 p-4 flex flex-col justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-zinc-100">{spec.name}</h4>
                            <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-amber-300 font-bold uppercase">
                              {owned ? `Level ${owned.level}` : "Unowned"}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 mt-1">{spec.description}</p>
                          <div className="text-xs text-zinc-300 mt-2">
                            Clean Yield:{" "}
                            <strong className="text-emerald-400">
                              ${(owned ? owned.hourlyYield : spec.baseHourlyYield).toLocaleString()}
                              /hr
                            </strong>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() =>
                            runAction(() => buyOrUpgradeBusinessAction(spec.businessType))
                          }
                          className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase cursor-pointer"
                        >
                          {owned
                            ? `Upgrade to Lv.${nextLevel} ($${nextCost.toLocaleString()})`
                            : `Acquire Front ($${nextCost.toLocaleString()})`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Real Estate & Safehouses */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  2. Real Estate & Fortified Safehouses (Current: {user.safehouseName})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {SAFEHOUSE_CATALOG.filter((s) => s.tier > 0).map((s) => {
                    const isOwned = user.safehouseTier >= s.tier;
                    return (
                      <div
                        key={s.tier}
                        className={`bg-[#1a1a1a] border p-4 flex flex-col justify-between gap-3 ${
                          user.safehouseTier === s.tier
                            ? "border-emerald-500"
                            : "border-zinc-800"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-100">{s.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 bg-zinc-800 text-zinc-400">
                              Tier {s.tier}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 mt-1">{s.description}</p>
                          <div className="text-[11px] text-emerald-400 mt-2">
                            +{s.boozeBonus} Booze | +{s.narcoticsBonus} Narcotics | +
                            {s.stealthBonusPct}% Stealth
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isPending || isOwned}
                          onClick={() => runAction(() => upgradeSafehouseAction(s.tier))}
                          className="w-full py-2 bg-zinc-100 hover:bg-white disabled:bg-zinc-900 disabled:text-zinc-500 text-black font-bold text-xs uppercase cursor-pointer"
                        >
                          {isOwned ? "Owned / Surpassed" : `Purchase Deed ($${s.cost.toLocaleString()})`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Player-Owned City Casinos & Bullet Factories */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400">
                  3. Player-Owned City Casinos & Bullet Factories ({user.city} Territory)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[localCasino, localBulletFactory].filter(Boolean).map((prop) => {
                    if (!prop) return null;
                    const isOwner = prop.ownerId === user.id;
                    return (
                      <div
                        key={prop.id}
                        className="bg-[#1a1a1a] border border-zinc-800 p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] px-2 py-0.5 bg-sky-500/20 text-sky-300 font-bold uppercase">
                              {prop.propertyType}
                            </span>
                            <h4 className="text-sm font-bold text-zinc-100 mt-1">{prop.name}</h4>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] uppercase text-zinc-500 block">
                              Proprietor
                            </span>
                            <span className="text-xs font-bold text-amber-400">
                              {prop.ownerName}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 bg-[#121212] border border-zinc-800 p-2.5 text-xs">
                          <div>
                            <span className="text-[10px] text-zinc-500 uppercase block">
                              House Vault Profits
                            </span>
                            <strong className="text-emerald-400">
                              ${prop.vaultBalance.toLocaleString()}
                            </strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-500 uppercase block">
                              {prop.propertyType === "CASINO" ? "House Edge" : "Bullet Stock / Rate"}
                            </span>
                            <strong className="text-zinc-200">
                              {prop.propertyType === "CASINO"
                                ? `${prop.houseEdgePct}%`
                                : `${prop.bulletStock} rds @ $${prop.bulletPrice}`}
                            </strong>
                          </div>
                        </div>

                        {isOwner ? (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={isPending || prop.vaultBalance <= 0}
                              onClick={() => runAction(() => claimMonopolyProfitsAction(prop.id))}
                              className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase cursor-pointer"
                            >
                              Skim Profits (${prop.vaultBalance.toLocaleString()})
                            </button>
                            {prop.propertyType === "BULLET_FACTORY" && (
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() =>
                                  runAction(() =>
                                    configureMonopolyAction(
                                      prop.id,
                                      prop.houseEdgePct,
                                      prop.bulletPrice,
                                      true
                                    )
                                  )
                                }
                                className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase cursor-pointer"
                              >
                                Smelt +250 Bullets ($900)
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => runAction(() => buyCityMonopolyAction(prop.id))}
                            className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase cursor-pointer"
                          >
                            Buy Out Controlling Deed (${prop.buyoutPrice.toLocaleString()})
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* VIEWPORT: UNDERGROUND CASINO + HORSE RACING DERBY (STAGE 5 & STAGE 6) */}
          {activeTab === "casino" && (
            <section className="space-y-5">
              <div className="bg-[#1a1a1a] border border-zinc-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-zinc-100 uppercase">
                    {localCasino?.name || `${user.city} Underground Casino`}
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Proprietor:{" "}
                    <strong className="text-amber-400">
                      {localCasino?.ownerName || "The Commission"}
                    </strong>{" "}
                    (House Edge: {localCasino?.houseEdgePct ?? 5}%). Want to own this casino? Visit{" "}
                    <button
                      type="button"
                      onClick={() => setActiveTab("empire")}
                      className="text-amber-300 underline cursor-pointer"
                    >
                      Fronts & Real Estate
                    </button>
                    .
                  </p>
                </div>
                <div className="text-xs px-3 py-1.5 bg-[#121212] border border-zinc-800">
                  Chips on Hand:{" "}
                  <strong className="text-emerald-400">${user.cash.toLocaleString()}</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 1. European Roulette Wheel */}
                <div className="bg-[#1a1a1a] border border-zinc-800 p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                      <h3 className="text-sm font-bold uppercase text-amber-400">
                        1. European Roulette (0–36)
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-300">
                        Up to 36x
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 text-xs pt-1">
                      {[
                        { id: "red" as RouletteBetType, label: "Red (2x)" },
                        { id: "black" as RouletteBetType, label: "Black (2x)" },
                        { id: "even" as RouletteBetType, label: "Even (2x)" },
                        { id: "odd" as RouletteBetType, label: "Odd (2x)" },
                        { id: "dozen-1" as RouletteBetType, label: "1st 12 (3x)" },
                        { id: "dozen-2" as RouletteBetType, label: "2nd 12 (3x)" },
                        { id: "dozen-3" as RouletteBetType, label: "3rd 12 (3x)" },
                        { id: "number" as RouletteBetType, label: "Exact # (36x)" },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setRouletteBetType(opt.id)}
                          className={`py-1.5 px-2 font-bold uppercase border cursor-pointer ${
                            rouletteBetType === opt.id
                              ? "bg-amber-500/20 border-amber-500 text-amber-300"
                              : "bg-[#121212] border-zinc-800 text-zinc-400"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {rouletteBetType === "number" && (
                      <div className="pt-2">
                        <label className="block text-[10px] uppercase text-zinc-400 mb-1">
                          Straight-Up Number (0–36)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={36}
                          value={rouletteNumber}
                          onChange={(e) => setRouletteNumber(e.target.value)}
                          className="w-full bg-[#121212] border border-zinc-700 px-3 py-1.5 text-xs text-zinc-100 outline-none"
                        />
                      </div>
                    )}

                    <div className="pt-2">
                      <label className="block text-[10px] uppercase text-zinc-400 mb-1">
                        Wager Amount ($)
                      </label>
                      <input
                        type="number"
                        min={10}
                        value={rouletteWager}
                        onChange={(e) => setRouletteWager(e.target.value)}
                        className="w-full bg-[#121212] border border-zinc-700 px-3 py-2 text-sm text-zinc-100 outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isPending || isInJail}
                    onClick={() =>
                      runAction(() =>
                        playRouletteAction(
                          rouletteBetType,
                          Number(rouletteNumber),
                          Number(rouletteWager)
                        )
                      )
                    }
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase cursor-pointer"
                  >
                    Spin Roulette Wheel (${Number(rouletteWager || 0).toLocaleString()})
                  </button>
                </div>

                {/* 2. Syndicate Turf Club Horse Racing Derby */}
                <div className="bg-[#1a1a1a] border border-zinc-800 p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                      <h3 className="text-sm font-bold uppercase text-amber-300">
                        2. Syndicate Turf Club — Horse Racing Derby
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-300">
                        2.3x – 12.5x
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      {DERBY_HORSES.map((h) => (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => setSelectedHorseId(h.id)}
                          className={`w-full px-3 py-1.5 text-xs flex items-center justify-between border cursor-pointer ${
                            selectedHorseId === h.id
                              ? "bg-amber-500/20 border-amber-500 text-amber-300 font-bold"
                              : "bg-[#121212] border-zinc-800 text-zinc-300"
                          }`}
                        >
                          <span>
                            #{h.id} {h.name} <span className="text-zinc-500">(Form {h.form})</span>
                          </span>
                          <span className="text-emerald-400 font-bold">{h.multiplier}x Payout</span>
                        </button>
                      ))}
                    </div>

                    <div className="pt-1">
                      <label className="block text-[10px] uppercase text-zinc-400 mb-1">
                        Derby Ticket Wager ($)
                      </label>
                      <input
                        type="number"
                        min={20}
                        value={horseWager}
                        onChange={(e) => setHorseWager(e.target.value)}
                        className="w-full bg-[#121212] border border-zinc-700 px-3 py-1.5 text-sm text-zinc-100 outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isPending || isInJail}
                    onClick={() =>
                      runAction(() => playHorseRacingAction(selectedHorseId, Number(horseWager)))
                    }
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase cursor-pointer"
                  >
                    Place Derby Bet (${Number(horseWager || 0).toLocaleString()})
                  </button>
                </div>

                {/* 3. Back-Alley 2d6 Dice */}
                <div className="bg-[#1a1a1a] border border-zinc-800 p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold uppercase text-emerald-400 border-b border-zinc-800 pb-2">
                      3. Back-Alley 2d6 Craps Dice
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Call Under 7 (2.1x), Lucky 7 (5.2x), or Over 7 (2.1x).
                    </p>
                    <input
                      type="number"
                      min={10}
                      value={diceWager}
                      onChange={(e) => setDiceWager(e.target.value)}
                      className="w-full bg-[#121212] border border-zinc-700 px-3 py-2 text-sm text-zinc-100 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      disabled={isPending || isInJail}
                      onClick={() => runAction(() => playDiceAction("under7", Number(diceWager)))}
                      className="py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-xs uppercase cursor-pointer"
                    >
                      Under 7 (2.1x)
                    </button>
                    <button
                      type="button"
                      disabled={isPending || isInJail}
                      onClick={() => runAction(() => playDiceAction("seven", Number(diceWager)))}
                      className="py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase cursor-pointer"
                    >
                      Lucky 7 (5.2x)
                    </button>
                    <button
                      type="button"
                      disabled={isPending || isInJail}
                      onClick={() => runAction(() => playDiceAction("over7", Number(diceWager)))}
                      className="py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-xs uppercase cursor-pointer"
                    >
                      Over 7 (2.1x)
                    </button>
                  </div>
                </div>

                {/* 4. High-Roller Blackjack 21 */}
                <div className="bg-[#1a1a1a] border border-zinc-800 p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold uppercase text-sky-400 border-b border-zinc-800 pb-2">
                      4. High-Roller Blackjack 21
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Heads-up against the House Shoe. Natural 21 pays 2.5x.
                    </p>
                    <input
                      type="number"
                      min={25}
                      value={blackjackWager}
                      onChange={(e) => setBlackjackWager(e.target.value)}
                      className="w-full bg-[#121212] border border-zinc-700 px-3 py-2 text-sm text-zinc-100 outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={isPending || isInJail}
                    onClick={() => runAction(() => playBlackjackAction(Number(blackjackWager)))}
                    className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs uppercase cursor-pointer"
                  >
                    Deal Blackjack Hand (${Number(blackjackWager || 0).toLocaleString()})
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* VIEWPORT: MAFIA FAMILIES & TERRITORY TURF WARS (STAGE 5 & STAGE 6.1) */}
          {activeTab === "families" && (
            <section className="space-y-5">
              <div className="bg-[#1a1a1a] border border-zinc-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-zinc-100 uppercase">
                    Mafia Families, Shared Vault & Territory Turf Wars
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Pool funds in the Shared Family Vault, bail out incarcerated crew members, and
                    wage war over the six City Districts!
                  </p>
                </div>
              </div>

              {/* Territory Turf Wars Map */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Syndicate Territory Control — Six City Districts
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {districts.map((d) => {
                    const controlledByMyFam =
                      Boolean(user.familyId) && d.controllingFamilyId === user.familyId;
                    return (
                      <div
                        key={d.id}
                        className={`bg-[#1a1a1a] border p-4 flex flex-col justify-between gap-3 ${
                          controlledByMyFam ? "border-amber-500/70" : "border-zinc-800"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-300 uppercase">
                              {d.city}
                            </span>
                            <span className="text-xs font-bold text-amber-400">
                              Holder:{" "}
                              {d.controllingFamilyTag
                                ? `[${d.controllingFamilyTag}]`
                                : "Unclaimed"}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-zinc-100 mt-1.5">{d.name}</h4>
                          <p className="text-xs text-zinc-400 mt-0.5">{d.description}</p>
                          <div className="text-[11px] text-emerald-400 mt-2">
                            Tribute: <strong>${d.tributePerClaim.toLocaleString()}</strong> |
                            Defense: <strong>{d.defenseStrength}</strong>
                          </div>
                        </div>

                        {controlledByMyFam ? (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => runAction(() => claimDistrictTributeAction(d.id))}
                            className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase cursor-pointer"
                          >
                            Collect Turf Tribute (+${d.tributePerClaim.toLocaleString()})
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isPending || !user.familyId}
                            onClick={() => runAction(() => attackDistrictAction(d.id))}
                            className="w-full py-2 bg-red-500/90 hover:bg-red-400 disabled:bg-zinc-900 disabled:text-zinc-600 text-black font-bold text-xs uppercase cursor-pointer"
                          >
                            {user.familyId
                              ? "Launch Turf Assault ($1.5k Vault + 15 Bullets)"
                              : "Join a Family to Wage War"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Current Player's Family HQ (if affiliated) */}
              {currentUserFamily ? (
                <div className="bg-[#1a1a1a] border-2 border-amber-500/60 p-5 space-y-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-amber-500 text-black font-black text-xs">
                          [{currentUserFamily.tag}]
                        </span>
                        <h3 className="text-lg font-bold text-zinc-100 uppercase">
                          {currentUserFamily.name}
                        </h3>
                        <span className="text-xs px-2 py-0.5 bg-zinc-800 text-amber-300 font-semibold">
                          Your Role: {user.familyRole}
                        </span>
                      </div>
                      <p className="text-xs italic text-zinc-400 mt-1">
                        &ldquo;{currentUserFamily.motto}&rdquo;
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="bg-[#121212] border border-zinc-800 px-4 py-2 text-right">
                        <span className="text-[10px] uppercase text-zinc-500 block">
                          Your Spendable (Pocket + Bank)
                        </span>
                        <span className="text-base font-bold text-zinc-200">
                          ${(user.cash + user.bankCash).toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-[#121212] border border-amber-500/40 px-4 py-2 text-right">
                        <span className="text-[10px] uppercase text-amber-400/80 block">
                          Shared Family Vault
                        </span>
                        <span className="text-base font-bold text-amber-400">
                          ${currentUserFamily.treasuryCash.toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-[#121212] border border-zinc-800 px-4 py-2 text-right">
                        <span className="text-[10px] uppercase text-zinc-500 block">
                          Your Tribute
                        </span>
                        <span className="text-base font-bold text-emerald-400">
                          ${user.familyContribution.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Deposit or Withdraw Shared Family Vault */}
                  <div className="bg-[#121212] border border-zinc-800 p-4 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold uppercase text-amber-400">
                          Shared Family Vault — Deposit & Withdraw
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Deposits draw from your Pocket Cash or Personal Bank (${(user.cash + user.bankCash).toLocaleString()} available) and award +1 Rank XP per $250. You can also withdraw funds from the Shared Family Vault or transfer your Personal Bank (${user.bankCash.toLocaleString()}) to Pocket Cash.
                        </p>
                      </div>
                      {user.bankCash > 0 && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() =>
                            runAction(() => bankTransactionAction("withdraw", user.bankCash))
                          }
                          className="shrink-0 px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-500/50 text-emerald-300 font-bold text-xs uppercase cursor-pointer"
                        >
                          Pull Personal Bank (${user.bankCash.toLocaleString()}) to Pocket
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={tributeAmount}
                        onChange={(e) =>
                          setTributeAmount(e.target.value.replace(/[^0-9]/g, ""))
                        }
                        placeholder="Amount (e.g. 1000)"
                        className="w-40 bg-[#1a1a1a] border border-zinc-700 px-3 py-2 text-sm text-zinc-100 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setTributeAmount(String(user.cash))}
                        className="px-2.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-300 uppercase cursor-pointer"
                      >
                        Max Pocket (${user.cash.toLocaleString()})
                      </button>
                      <button
                        type="button"
                        onClick={() => setTributeAmount(String(user.cash + user.bankCash))}
                        className="px-2.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-[11px] text-amber-300 uppercase cursor-pointer"
                      >
                        Max Spendable (${(user.cash + user.bankCash).toLocaleString()})
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setTributeAmount(String(currentUserFamily.treasuryCash))
                        }
                        className="px-2.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-[11px] text-emerald-300 uppercase cursor-pointer"
                      >
                        Max Family Vault (${currentUserFamily.treasuryCash.toLocaleString()})
                      </button>

                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => {
                          const amt =
                            parseInt(String(tributeAmount).replace(/[^0-9]/g, ""), 10) || 0;
                          runAction(() => contributeFamilyTreasuryAction(amt));
                        }}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase cursor-pointer"
                      >
                        Donate ($
                        {(
                          parseInt(String(tributeAmount).replace(/[^0-9]/g, ""), 10) || 0
                        ).toLocaleString()}
                        )
                      </button>

                      <button
                        type="button"
                        disabled={isPending || currentUserFamily.treasuryCash <= 0}
                        onClick={() => {
                          const amt =
                            parseInt(String(tributeAmount).replace(/[^0-9]/g, ""), 10) || 0;
                          runAction(() => withdrawFamilyTreasuryAction(amt));
                        }}
                        className="px-4 py-2 bg-zinc-200 hover:bg-white disabled:bg-zinc-900 disabled:text-zinc-600 text-black font-bold text-xs uppercase cursor-pointer"
                      >
                        Withdraw to Pocket ($
                        {(
                          parseInt(String(tributeAmount).replace(/[^0-9]/g, ""), 10) || 0
                        ).toLocaleString()}
                        )
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => runAction(() => leaveFamilyAction())}
                      className="text-xs text-red-400 hover:text-red-300 uppercase cursor-pointer"
                    >
                      [Step Down & Leave Family]
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#1a1a1a] border border-zinc-800 p-5 space-y-4">
                  <h3 className="text-sm font-bold uppercase text-amber-400">
                    Charter a New Mafia Family ($2,500 Fee)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={newFamName}
                      onChange={(e) => setNewFamName(e.target.value)}
                      placeholder="Family Name (e.g. Gambino Syndicate)"
                      className="bg-[#121212] border border-zinc-700 px-3 py-2 text-xs text-zinc-100 outline-none"
                    />
                    <input
                      type="text"
                      maxLength={5}
                      value={newFamTag}
                      onChange={(e) => setNewFamTag(e.target.value.toUpperCase())}
                      placeholder="Tag (e.g. GAMB)"
                      className="bg-[#121212] border border-zinc-700 px-3 py-2 text-xs text-zinc-100 uppercase outline-none"
                    />
                    <input
                      type="text"
                      value={newFamMotto}
                      onChange={(e) => setNewFamMotto(e.target.value)}
                      placeholder="Family Motto"
                      className="bg-[#121212] border border-zinc-700 px-3 py-2 text-xs text-zinc-100 outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() =>
                      runAction(() => createFamilyAction(newFamName, newFamTag, newFamMotto))
                    }
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase cursor-pointer"
                  >
                    Found Family as Don ($2,500)
                  </button>
                </div>
              )}

              {/* Active Families Directory */}
              <div className="grid grid-cols-1 gap-3">
                {sortedFamilies.map((fam) => (
                  <div
                    key={fam.id}
                    className="bg-[#1a1a1a] border border-zinc-800 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-300 font-bold">
                          [{fam.tag}]
                        </span>
                        <h4 className="text-sm font-bold text-zinc-100">{fam.name}</h4>
                        <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-400">
                          HQ: {fam.homeCity}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-[11px] text-zinc-400 pt-1">
                        <span>
                          Members: <strong className="text-zinc-200">{fam.memberCount}</strong>
                        </span>
                        <span>
                          Shared Vault:{" "}
                          <strong className="text-amber-400">
                            ${fam.treasuryCash.toLocaleString()}
                          </strong>
                        </span>
                        <span>
                          Syndicate Worth:{" "}
                          <strong className="text-emerald-400">
                            ${fam.combinedSyndicateWorth.toLocaleString()}
                          </strong>
                        </span>
                      </div>
                    </div>
                    {!user.familyId && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => runAction(() => joinFamilyAction(fam.id))}
                        className="px-4 py-2 bg-zinc-100 hover:bg-white text-black font-bold text-xs uppercase cursor-pointer"
                      >
                        Swear Allegiance (Join)
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* VIEWPORT: HALL OF INFAMY LEADERBOARDS (STAGE 5) */}
          {activeTab === "leaderboards" && (
            <section className="space-y-6">
              <div className="bg-[#1a1a1a] border border-zinc-800 p-4">
                <h2 className="text-lg font-bold tracking-tight text-zinc-100 uppercase">
                  Hall of Infamy — Syndicate & Player Leaderboards
                </h2>
              </div>

              {/* 1. FAMILY LEADERBOARD */}
              <div className="bg-[#1a1a1a] border border-zinc-800 p-4 space-y-3 overflow-x-auto">
                <h3 className="text-sm font-bold uppercase text-amber-400">
                  Top Mafia Families (Syndicate Leaderboard)
                </h3>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-[#121212] text-zinc-400">
                      <th className="py-2.5 px-3">Rank</th>
                      <th className="py-2.5 px-3">Syndicate</th>
                      <th className="py-2.5 px-3">HQ</th>
                      <th className="py-2.5 px-3">Members</th>
                      <th className="py-2.5 px-3">Total XP</th>
                      <th className="py-2.5 px-3">Shared Vault</th>
                      <th className="py-2.5 px-3">Combined Net Worth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedFamilies.map((fam, idx) => (
                      <tr
                        key={fam.id}
                        className={`border-b border-zinc-800/60 ${
                          fam.id === user.familyId ? "bg-amber-500/10" : ""
                        }`}
                      >
                        <td className="py-2.5 px-3 font-bold text-amber-400">#{idx + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-zinc-100">
                          <span className="text-amber-300 mr-1.5">[{fam.tag}]</span>
                          {fam.name}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-400">{fam.homeCity}</td>
                        <td className="py-2.5 px-3 text-zinc-200">{fam.memberCount}</td>
                        <td className="py-2.5 px-3 text-zinc-200">
                          {fam.totalRankPoints.toFixed(1)} XP
                        </td>
                        <td className="py-2.5 px-3 text-amber-300 font-bold">
                          ${fam.treasuryCash.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-emerald-400 font-bold">
                          ${fam.combinedSyndicateWorth.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 2. PLAYER LEADERBOARD */}
              <div className="bg-[#1a1a1a] border border-zinc-800 p-4 space-y-3 overflow-x-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-sm font-bold uppercase text-emerald-400">
                    Top Made Men (Player Leaderboard)
                  </h3>
                  <div className="flex gap-1.5 text-xs">
                    {[
                      { id: "xp" as const, label: "By Rank XP" },
                      { id: "wealth" as const, label: "By Net Worth" },
                      { id: "crimes" as const, label: "By Street Record" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setPlayerSort(tab.id)}
                        className={`px-3 py-1 font-bold uppercase border cursor-pointer ${
                          playerSort === tab.id
                            ? "bg-amber-500 text-black border-amber-500"
                            : "bg-[#121212] text-zinc-400 border-zinc-800"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-[#121212] text-zinc-400">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Mobster</th>
                      <th className="py-2.5 px-3">Family</th>
                      <th className="py-2.5 px-3">Rank</th>
                      <th className="py-2.5 px-3">Rank XP</th>
                      <th className="py-2.5 px-3">Net Worth</th>
                      <th className="py-2.5 px-3">Crimes / GTA / Busts / Whacks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPlayers.map((p, idx) => {
                      const pRank = getRankInfo(p.rankPoints).current.name;
                      const isMe = p.id === user.id;
                      return (
                        <tr
                          key={p.id}
                          className={`border-b border-zinc-800/60 ${
                            isMe ? "bg-amber-500/15 font-bold" : ""
                          }`}
                        >
                          <td className="py-2.5 px-3 font-bold text-amber-400">#{idx + 1}</td>
                          <td className="py-2.5 px-3 text-zinc-100">
                            {p.username} {isMe && <span className="text-amber-300">(YOU)</span>}
                          </td>
                          <td className="py-2.5 px-3 text-zinc-400">
                            {p.familyTag ? (
                              <span className="text-amber-300">
                                [{p.familyTag}] {p.familyRole}
                              </span>
                            ) : (
                              "Independent"
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-zinc-200">{pRank}</td>
                          <td className="py-2.5 px-3 text-amber-300">
                            {p.rankPoints.toFixed(1)} XP
                          </td>
                          <td className="py-2.5 px-3 text-emerald-400">
                            ${p.netWorth.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-zinc-300">
                            {p.crimesCommitted} / {p.carsStolen} / {p.bustsSucceeded} /{" "}
                            <span className="text-red-400">{p.killsCount}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* VIEWPORT: SMUGGLING MARKETPLACE (STAGE 3 + SAFEHOUSE STORAGE BONUS) */}
          {activeTab === "smuggling" && (
            <section className="space-y-5">
              <div className="bg-[#1a1a1a] border border-zinc-800 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-zinc-100 uppercase">
                    Contraband Smuggling Exchange — {user.city}
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Safehouse: <strong className="text-emerald-400">{user.safehouseName}</strong>{" "}
                    (+{safehouseSpec.boozeBonus} Booze / +{safehouseSpec.narcoticsBonus} Narcotics
                    bonus capacity).
                  </p>
                </div>
                <div className="flex gap-3 text-xs shrink-0">
                  <div className="bg-[#121212] border border-zinc-800 px-3 py-2">
                    <span className="text-[10px] uppercase text-zinc-500 block">
                      Booze Capacity
                    </span>
                    <strong className="text-amber-400">
                      {carriedBooze} / {effectiveBoozeCap} crates
                    </strong>
                  </div>
                  <div className="bg-[#121212] border border-zinc-800 px-3 py-2">
                    <span className="text-[10px] uppercase text-zinc-500 block">
                      Narcotics Capacity
                    </span>
                    <strong className="text-emerald-400">
                      {carriedNarcotics} / {effectiveNarcoticsCap} kilos
                    </strong>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(["booze", "narcotics"] as const).map((type) => {
                  const items = SMUGGLING_ITEMS.filter((i) => i.itemType === type);
                  const remainingCap =
                    type === "booze"
                      ? effectiveBoozeCap - carriedBooze
                      : effectiveNarcoticsCap - carriedNarcotics;

                  return (
                    <div
                      key={type}
                      className="bg-[#1a1a1a] border border-zinc-800 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                        <h3 className="text-sm font-bold uppercase text-amber-400">
                          {type === "booze" ? "Bootleg Spirits (Booze)" : "Syndicate Narcotics"}
                        </h3>
                        <span className="text-[11px] text-zinc-400">
                          Free Space: <strong>{remainingCap}</strong>
                        </span>
                      </div>

                      <div className="space-y-3">
                        {items.map((spec) => {
                          const quote = localMarkets.find((m) => m.itemName === spec.itemName);
                          const localPrice = quote?.price ?? spec.minPrice;
                          const invRow = user.inventory.find((i) => i.itemName === spec.itemName);
                          const owned = invRow?.quantity ?? 0;
                          const avgCost = invRow?.avgCost ?? 0;
                          const qtyInput =
                            tradeQuantities[spec.itemName] ??
                            Math.max(1, Math.min(5, remainingCap || 1));

                          return (
                            <div
                              key={spec.itemName}
                              className="bg-[#121212] border border-zinc-800 p-3 space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-xs font-bold text-zinc-100">
                                    {spec.itemName}
                                  </div>
                                  <div className="text-[11px] text-zinc-400">
                                    Carrying: <strong className="text-zinc-200">{owned}</strong>
                                    {owned > 0 && ` (Avg Paid: $${avgCost.toLocaleString()})`}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-[10px] uppercase text-zinc-500">
                                    {user.city} Price
                                  </div>
                                  <div className="text-sm font-bold text-emerald-400">
                                    ${localPrice.toLocaleString()}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min={1}
                                  max={2000}
                                  value={qtyInput}
                                  onChange={(e) =>
                                    setTradeQuantities((prev) => ({
                                      ...prev,
                                      [spec.itemName]: Math.max(1, Number(e.target.value) || 1),
                                    }))
                                  }
                                  className="w-20 bg-[#1a1a1a] border border-zinc-700 px-2 py-1.5 text-xs text-zinc-100 outline-none"
                                />
                                <button
                                  type="button"
                                  disabled={isPending || isInJail || remainingCap <= 0}
                                  onClick={() =>
                                    runAction(() =>
                                      tradeSmugglingItemAction(spec.itemName, "buy", qtyInput)
                                    )
                                  }
                                  className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-900 disabled:text-zinc-600 text-black font-bold text-xs uppercase cursor-pointer"
                                >
                                  Buy (${(localPrice * qtyInput).toLocaleString()})
                                </button>
                                <button
                                  type="button"
                                  disabled={isPending || isInJail || owned <= 0}
                                  onClick={() =>
                                    runAction(() =>
                                      tradeSmugglingItemAction(
                                        spec.itemName,
                                        "sell",
                                        Math.min(owned, qtyInput)
                                      )
                                    )
                                  }
                                  className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-900 disabled:text-zinc-600 text-black font-bold text-xs uppercase cursor-pointer"
                                >
                                  Sell ({Math.min(owned, qtyInput)})
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* VIEWPORT: CITY TRAVEL (STAGE 3) */}
          {activeTab === "travel" && (
            <section className="space-y-4">
              <div className="bg-[#1a1a1a] border border-zinc-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-zinc-100 uppercase">
                    Inter-City Transit Charter
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Move across the six syndicate territories to arbitrage smuggling prices, hunt
                    Hitlist targets, or fence stolen vehicles.
                  </p>
                </div>
                <div className="text-xs px-3 py-1.5 bg-[#121212] border border-zinc-800">
                  Transit Timer:{" "}
                  <strong className={isTraveling ? "text-sky-400" : "text-emerald-400"}>
                    {formatSeconds(travelRemainingSec)}
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {CITIES.map((city) => {
                  const isCurrent = city.name === user.city;
                  return (
                    <div
                      key={city.name}
                      className={`bg-[#1a1a1a] border p-4 flex flex-col justify-between gap-4 ${
                        isCurrent ? "border-amber-500/60" : "border-zinc-800"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-zinc-100 uppercase">{city.name}</h3>
                          {isCurrent && (
                            <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-300 font-bold uppercase">
                              Current Location
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-amber-400/90 mt-0.5">{city.nickname}</div>
                        <p className="text-xs text-zinc-400 mt-2">{city.specialty}</p>
                      </div>

                      <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
                        <div className="text-xs text-zinc-400">
                          Ticket:{" "}
                          <strong className="text-emerald-400">
                            ${city.ticketCost.toLocaleString()}
                          </strong>{" "}
                          • Cooldown: <strong>{city.travelCooldownSeconds}s</strong>
                        </div>
                        <button
                          type="button"
                          disabled={isCurrent || isPending || isInJail || isTraveling}
                          onClick={() => runAction(() => travelToCityAction(city.name))}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-900 disabled:text-zinc-500 text-black font-bold text-xs uppercase cursor-pointer"
                        >
                          {isCurrent
                            ? "In City"
                            : isTraveling
                              ? `Wait ${travelRemainingSec}s`
                              : `Charter ($${city.ticketCost})`}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* VIEWPORT: FAMILY BANK, DOCTOR & ARMORY (STAGE 4) */}
          {activeTab === "bank" && (
            <section className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#1a1a1a] border border-zinc-800 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase text-amber-400">
                      Personal Bank Account (Safe Storage & Dividends)
                    </h3>
                    {user.bankCash > 0 && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          runAction(() => bankTransactionAction("withdraw", user.bankCash))
                        }
                        className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[11px] uppercase cursor-pointer"
                      >
                        Withdraw All (${user.bankCash.toLocaleString()})
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 bg-[#121212] border border-zinc-800 p-3">
                    <div>
                      <span className="text-[10px] uppercase text-zinc-500 block">Pocket Cash</span>
                      <span className="text-base font-bold text-emerald-400">
                        ${user.cash.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-zinc-500 block">
                        Personal Bank Balance
                      </span>
                      <span className="text-base font-bold text-amber-300">
                        ${user.bankCash.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={bankAmount}
                      onChange={(e) => setBankAmount(e.target.value.replace(/[^0-9]/g, ""))}
                      className="flex-1 bg-[#121212] border border-zinc-700 px-3 py-2 text-sm text-zinc-100 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setBankAmount(String(user.cash))}
                      className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 uppercase cursor-pointer"
                    >
                      Max Pocket
                    </button>
                    <button
                      type="button"
                      onClick={() => setBankAmount(String(user.bankCash))}
                      className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs text-amber-300 uppercase cursor-pointer"
                    >
                      Max Bank
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        runAction(() =>
                          bankTransactionAction(
                            "deposit",
                            parseInt(String(bankAmount).replace(/[^0-9]/g, ""), 10) || 0
                          )
                        )
                      }
                      className="py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase cursor-pointer"
                    >
                      Deposit (3% Fee)
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        runAction(() =>
                          bankTransactionAction(
                            "withdraw",
                            parseInt(String(bankAmount).replace(/[^0-9]/g, ""), 10) || 0
                          )
                        )
                      }
                      className="py-2.5 bg-zinc-200 hover:bg-white text-black font-bold text-xs uppercase cursor-pointer"
                    >
                      Withdraw to Pocket (Free)
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={isPending || user.bankCash < 500}
                    onClick={() => runAction(() => bankTransactionAction("dividend", 0))}
                    className="w-full py-2 bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 font-bold text-xs uppercase cursor-pointer disabled:opacity-50"
                  >
                    Collect 3% Syndicate Vault Dividend
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-[#1a1a1a] border border-zinc-800 p-5 space-y-3">
                    <h3 className="text-sm font-bold uppercase text-emerald-400">
                      Back-Alley Surgeon
                    </h3>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-zinc-300">
                        Current Health: <strong>{user.health}%</strong>
                      </span>
                      <button
                        type="button"
                        disabled={isPending || user.health >= 100}
                        onClick={() => runAction(() => healAtDoctorAction())}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-900 disabled:text-zinc-600 text-black font-bold text-xs uppercase cursor-pointer"
                      >
                        {user.health >= 100
                          ? "At 100% Health"
                          : `Heal to 100% ($${(100 - user.health) * 15})`}
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#1a1a1a] border border-zinc-800 p-5 space-y-3">
                    <h3 className="text-sm font-bold uppercase text-amber-400">
                      Quick Munitions Crates
                    </h3>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => runAction(() => buyBulletsAction(1))}
                        className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase cursor-pointer"
                      >
                        +25 Rounds ($300)
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => runAction(() => buyBulletsAction(4))}
                        className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-zinc-700 font-bold text-xs uppercase cursor-pointer"
                      >
                        +100 Rounds ($1,200)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* VIEWPORT: THE SYNDICATE GAZETTE / TABLOID (STAGE 4 & STAGE 6.B) */}
          {activeTab === "newspaper" && (
            <section className="space-y-4">
              <div className="bg-[#1a1a1a] border border-zinc-800 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-zinc-100 uppercase">
                    The Syndicate Gazette — Obituaries, Heist Records & Tabloid Wire
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Front-page dispatches covering Assassination Obituaries, Organized Crime Heist
                    Records, Turf Wars, Jail Breaks, and Anti-Cheat Stings.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1 text-xs">
                  {[
                    "ALL",
                    "OBITUARY",
                    "HEIST_RECORD",
                    "FAMILY_WAR",
                    "JAIL_BUST",
                    "HITLIST",
                    "ANTI_CHEAT",
                  ].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setLogFilter(cat)}
                      className={`px-2.5 py-1 font-bold uppercase border cursor-pointer ${
                        logFilter === cat
                          ? "bg-amber-500 text-black border-amber-500"
                          : "bg-[#121212] text-zinc-400 border-zinc-800"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-[#1a1a1a] border border-zinc-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 font-bold uppercase ${
                            log.category === "OBITUARY"
                              ? "bg-red-600 text-white"
                              : log.category === "HEIST_RECORD"
                                ? "bg-emerald-500 text-black"
                                : log.category === "FAMILY_WAR" || log.category === "HITLIST"
                                  ? "bg-red-500/20 text-red-300 border border-red-500/40"
                                  : log.category === "ANTI_CHEAT"
                                    ? "bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40"
                                    : "bg-zinc-800 text-amber-300"
                          }`}
                        >
                          {log.category}
                        </span>
                        <span className="text-[11px] text-zinc-400 uppercase">{log.city}</span>
                        <h3 className="text-sm font-bold text-zinc-100">{log.headline}</h3>
                      </div>
                      <p className="text-xs text-zinc-400">{log.details}</p>
                    </div>
                    <div className="text-[11px] text-zinc-500 shrink-0">
                      {new Date(log.createdAtIso).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* VIEWPORT: 16-TIER HIERARCHY TABLE */}
          {activeTab === "ranks" && (
            <section className="space-y-4">
              <div className="bg-[#1a1a1a] border border-zinc-800 p-4">
                <h2 className="text-lg font-bold tracking-tight text-zinc-100 uppercase">
                  16-Tier Omerta Hierarchy & Cargo Capacities
                </h2>
              </div>

              <div className="bg-[#1a1a1a] border border-zinc-800 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400 bg-[#141414]">
                      <th className="py-2.5 px-4">Tier</th>
                      <th className="py-2.5 px-4">Rank Title</th>
                      <th className="py-2.5 px-4">Min Rank XP</th>
                      <th className="py-2.5 px-4">Base Booze Cap</th>
                      <th className="py-2.5 px-4">Base Narcotics Cap</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RANKS.map((r) => {
                      const isCurrent = r.index === rankInfo.current.index;
                      const isUnlocked = user.rankPoints >= r.minPoints;
                      return (
                        <tr
                          key={r.index}
                          className={`border-b border-zinc-800/60 ${
                            isCurrent
                              ? "bg-amber-500/15 text-amber-300 font-bold"
                              : isUnlocked
                                ? "text-zinc-200"
                                : "text-zinc-500"
                          }`}
                        >
                          <td className="py-2 px-4">#{r.index + 1}</td>
                          <td className="py-2 px-4">
                            {r.name} {isCurrent && " (YOU)"}
                          </td>
                          <td className="py-2 px-4">{r.minPoints.toLocaleString()} XP</td>
                          <td className="py-2 px-4">{r.boozeCapacity} crates</td>
                          <td className="py-2 px-4">{r.narcoticsCapacity} kilos</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
