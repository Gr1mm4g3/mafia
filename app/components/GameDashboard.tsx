"use client";

import React, { useEffect, useState, useTransition } from "react";
import {
  ActionResponse,
  bankTransactionAction,
  bribeWardenAction,
  bustInmateAction,
  buyBulletsAction,
  commitCrimeAction,
  commitGtaAction,
  contributeFamilyTreasuryAction,
  createFamilyAction,
  healAtDoctorAction,
  joinFamilyAction,
  leaveFamilyAction,
  logoutAction,
  playBlackjackAction,
  playDiceAction,
  playRouletteAction,
  repairVehicleAction,
  RouletteBetType,
  sellVehicleAction,
  shipVehicleAction,
  tradeSmugglingItemAction,
  travelToCityAction,
} from "@/app/actions/game";
import {
  CITIES,
  getRankInfo,
  GTA_OPTIONS,
  RANKS,
  SMUGGLING_ITEMS,
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
}

type NavTab =
  | "crimes"
  | "gta"
  | "garage"
  | "jail"
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

  // Family creation / contribution state
  const [newFamName, setNewFamName] = useState("");
  const [newFamTag, setNewFamTag] = useState("");
  const [newFamMotto, setNewFamMotto] = useState("");
  const [tributeAmount, setTributeAmount] = useState<string>("250");

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

  const activeInmates = inmates.filter((inm) => inm.jailUntilMs > nowMs);
  const localMarkets = markets.filter((m) => m.city === user.city);

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
        b.bustsSucceeded -
        (a.crimesCommitted + a.carsStolen + a.bustsSucceeded)
      );
    }
    return b.rankPoints - a.rankPoints;
  });

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
              <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                <span>
                  Location: <strong className="text-zinc-200">{user.city}</strong>
                </span>
                <span>•</span>
                <span>
                  XP: <strong className="text-zinc-200">{user.rankPoints.toFixed(1)}</strong>
                </span>
                {user.familyName && (
                  <>
                    <span>•</span>
                    <span>
                      Family:{" "}
                      <strong className="text-amber-300">
                        {user.familyName} ({user.familyRole})
                      </strong>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Core Stats: Cash, Bank, Health, Bullets, Rank Progress */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="bg-[#121212] border border-zinc-800 px-3 py-1.5">
              <span className="text-[10px] uppercase text-zinc-500 block">Pocket Cash</span>
              <span className="text-emerald-400 font-bold text-sm">
                ${user.cash.toLocaleString()}
              </span>
            </div>

            <div className="bg-[#121212] border border-zinc-800 px-3 py-1.5">
              <span className="text-[10px] uppercase text-zinc-500 block">Family Vault</span>
              <span className="text-amber-300 font-bold text-sm">
                ${user.bankCash.toLocaleString()}
              </span>
            </div>

            <div className="bg-[#121212] border border-zinc-800 px-3 py-1.5 min-w-[120px]">
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

            <div className="bg-[#121212] border border-zinc-800 px-3 py-1.5 min-w-[155px]">
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
          <div className="space-y-5">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2 px-2">
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
              <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2 px-2">
                Syndicate & Economy
              </div>
              <nav className="space-y-1">
                {[
                  {
                    id: "casino" as NavTab,
                    label: "Underground Casino",
                    badge: "3 Games",
                  },
                  {
                    id: "families" as NavTab,
                    label: "Mafia Families",
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
                    label: "Bank, Doc & Armory",
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
                Toggle <strong>UNLOCKED</strong> to allow clicking Crime/GTA buttons during
                cooldowns and see the server&apos;s <em>Anti-Tamper Timer Trap</em> throw you in
                jail!
              </p>
            </div>
          </div>

          {/* Dossier Footer & Logout */}
          <div className="border-t border-zinc-800 pt-4 space-y-3 text-xs text-zinc-400">
            <div className="grid grid-cols-3 gap-1 text-center bg-[#121212] border border-zinc-800 p-2">
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
              <div className="flex items-center gap-2 shrink-0">
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

          {/* VIEWPORT: PRECINCT JAIL & BUSTING (STAGE 3) */}
          {activeTab === "jail" && (
            <section className="space-y-4">
              <div className="bg-[#1a1a1a] border border-zinc-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-zinc-100 uppercase">
                    Precinct Lockup & Jailbreak Roster
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Bust incarcerated mobsters out of jail for +18 Rank XP and a $175 tribute. Be
                    careful: a botched jailbreak lands you in an adjacent cell!
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
                            {inmate.isNpc && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-zinc-800 text-zinc-400 uppercase">
                                Syndicate Associate
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400">
                            {inmate.jailReason || "Held on suspicion of racketeering"}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div className="text-[10px] uppercase text-zinc-500">Sentence</div>
                            <div className="text-xs font-bold text-red-400">
                              {formatSeconds(remSec)}
                            </div>
                          </div>

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

          {/* VIEWPORT: UNDERGROUND CASINO (STAGE 5) */}
          {activeTab === "casino" && (
            <section className="space-y-4">
              <div className="bg-[#1a1a1a] border border-zinc-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-zinc-100 uppercase">
                    The Velvet Room — {user.city} Underground Casino
                  </h2>
                  <p className="text-xs text-zinc-400">
                    High-stakes parlor tables backed by the Syndicate. All spins, dice rolls, and
                    card shoes are settled atomically on the server.
                  </p>
                </div>
                <div className="text-xs px-3 py-1.5 bg-[#121212] border border-zinc-800">
                  Chips on Hand:{" "}
                  <strong className="text-emerald-400">${user.cash.toLocaleString()}</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* 1. European Roulette Wheel */}
                <div className="bg-[#1a1a1a] border border-zinc-800 p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                      <h3 className="text-sm font-bold uppercase text-amber-400">
                        European Roulette (0–36)
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-300">
                        Up to 36x
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Call Red/Black (2x), Odd/Even (2x), Dozens (3x), or a Single Number (36x).
                    </p>

                    <div className="pt-2 space-y-3">
                      <div>
                        <label className="block text-[10px] uppercase text-zinc-400 mb-1">
                          Select Table Call
                        </label>
                        <div className="grid grid-cols-2 gap-1.5 text-xs">
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
                                  : "bg-[#121212] border-zinc-800 text-zinc-400 hover:text-zinc-200"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {rouletteBetType === "number" && (
                        <div>
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

                      <div>
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
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-900 disabled:text-zinc-600 text-black font-bold text-xs uppercase tracking-wider cursor-pointer"
                  >
                    Spin Roulette Wheel (${Number(rouletteWager || 0).toLocaleString()})
                  </button>
                </div>

                {/* 2. Back-Alley 2d6 Craps / Seven Dice */}
                <div className="bg-[#1a1a1a] border border-zinc-800 p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                      <h3 className="text-sm font-bold uppercase text-emerald-400">
                        Back-Alley 2d6 Dice
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-300">
                        2.1x / 5.2x
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Roll two six-sided bones against the house wall. Call Under 7 (2–6), Lucky 7,
                      or Over 7 (8–12).
                    </p>

                    <div className="pt-2 space-y-3">
                      <div>
                        <label className="block text-[10px] uppercase text-zinc-400 mb-1">
                          Dice Wager ($)
                        </label>
                        <input
                          type="number"
                          min={10}
                          value={diceWager}
                          onChange={(e) => setDiceWager(e.target.value)}
                          className="w-full bg-[#121212] border border-zinc-700 px-3 py-2 text-sm text-zinc-100 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        disabled={isPending || isInJail}
                        onClick={() =>
                          runAction(() => playDiceAction("under7", Number(diceWager)))
                        }
                        className="py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-100 font-bold text-xs uppercase cursor-pointer"
                      >
                        Under 7 (2.1x)
                      </button>
                      <button
                        type="button"
                        disabled={isPending || isInJail}
                        onClick={() => runAction(() => playDiceAction("seven", Number(diceWager)))}
                        className="py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase cursor-pointer"
                      >
                        Lucky 7 (5.2x)
                      </button>
                      <button
                        type="button"
                        disabled={isPending || isInJail}
                        onClick={() => runAction(() => playDiceAction("over7", Number(diceWager)))}
                        className="py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-100 font-bold text-xs uppercase cursor-pointer"
                      >
                        Over 7 (2.1x)
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. High-Roller Blackjack 21 */}
                <div className="bg-[#1a1a1a] border border-zinc-800 p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                      <h3 className="text-sm font-bold uppercase text-sky-400">
                        High-Roller Blackjack 21
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-300">
                        2x / 2.5x Natural
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Face the House Dealer heads-up. Dealer stands on 17. Natural 21 pays 3:2
                      (2.5x total return).
                    </p>

                    <div className="pt-2 space-y-3">
                      <div>
                        <label className="block text-[10px] uppercase text-zinc-400 mb-1">
                          Table Bet (Min $25)
                        </label>
                        <input
                          type="number"
                          min={25}
                          value={blackjackWager}
                          onChange={(e) => setBlackjackWager(e.target.value)}
                          className="w-full bg-[#121212] border border-zinc-700 px-3 py-2 text-sm text-zinc-100 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isPending || isInJail}
                    onClick={() => runAction(() => playBlackjackAction(Number(blackjackWager)))}
                    className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 disabled:bg-zinc-900 disabled:text-zinc-600 text-black font-bold text-xs uppercase tracking-wider cursor-pointer"
                  >
                    Deal Blackjack Hand (${Number(blackjackWager || 0).toLocaleString()})
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* VIEWPORT: MAFIA FAMILIES (STAGE 5) */}
          {activeTab === "families" && (
            <section className="space-y-5">
              <div className="bg-[#1a1a1a] border border-zinc-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-zinc-100 uppercase">
                    The Commission — Mafia Families & Syndicates
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Swear allegiance to an existing Family, contribute tribute to rise from Soldier
                    to Underboss, or charter your own Syndicate as Don.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("leaderboards")}
                  className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-amber-400 font-bold uppercase cursor-pointer"
                >
                  View Family Leaderboard →
                </button>
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
                      <div className="text-[11px] text-zinc-400 mt-1 flex flex-wrap gap-4">
                        <span>
                          Home Territory:{" "}
                          <strong className="text-zinc-200">{currentUserFamily.homeCity}</strong>
                        </span>
                        <span>
                          Founder:{" "}
                          <strong className="text-zinc-200">
                            {currentUserFamily.founderName}
                          </strong>
                        </span>
                        <span>
                          Members:{" "}
                          <strong className="text-zinc-200">
                            {currentUserFamily.memberCount}
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="bg-[#121212] border border-zinc-800 px-4 py-2 text-right">
                        <span className="text-[10px] uppercase text-zinc-500 block">
                          Family Treasury
                        </span>
                        <span className="text-base font-bold text-amber-400">
                          ${currentUserFamily.treasuryCash.toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-[#121212] border border-zinc-800 px-4 py-2 text-right">
                        <span className="text-[10px] uppercase text-zinc-500 block">
                          Your Lifetime Tribute
                        </span>
                        <span className="text-base font-bold text-emerald-400">
                          ${user.familyContribution.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contribute Tribute to Treasury */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-[#121212] border border-zinc-800 p-4">
                    <div>
                      <div className="text-xs font-bold uppercase text-amber-400">
                        Pay Tribute to Family Treasury
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Earn +1 Rank XP per $250 contributed and automatically earn promotion
                        (Caporegime at $2.5k, Consigliere at $10k, Underboss at $25k).
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={50}
                        value={tributeAmount}
                        onChange={(e) => setTributeAmount(e.target.value)}
                        className="flex-1 bg-[#1a1a1a] border border-zinc-700 px-3 py-2 text-sm text-zinc-100 outline-none"
                      />
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          runAction(() => contributeFamilyTreasuryAction(Number(tributeAmount)))
                        }
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase cursor-pointer"
                      >
                        Donate (${Number(tributeAmount || 0).toLocaleString()})
                      </button>
                    </div>
                  </div>

                  {/* Family Member Roster */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-zinc-300">
                        Made Members Roster ({currentUserFamily.members.length})
                      </span>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => runAction(() => leaveFamilyAction())}
                        className="text-xs text-red-400 hover:text-red-300 uppercase cursor-pointer"
                      >
                        [Step Down & Leave Family]
                      </button>
                    </div>
                    <div className="overflow-x-auto border border-zinc-800">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#121212] border-b border-zinc-800 text-zinc-400">
                            <th className="py-2 px-3">Mobster</th>
                            <th className="py-2 px-3">Family Role</th>
                            <th className="py-2 px-3">Standing</th>
                            <th className="py-2 px-3">City</th>
                            <th className="py-2 px-3">Tribute Paid</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentUserFamily.members.map((m) => (
                            <tr key={m.id} className="border-b border-zinc-800/60">
                              <td className="py-2 px-3 font-bold text-zinc-100">{m.username}</td>
                              <td className="py-2 px-3 text-amber-400">{m.familyRole}</td>
                              <td className="py-2 px-3 text-zinc-300">
                                {getRankInfo(m.rankPoints).current.name} ({m.rankPoints.toFixed(0)}{" "}
                                XP)
                              </td>
                              <td className="py-2 px-3 text-zinc-400">{m.city}</td>
                              <td className="py-2 px-3 text-emerald-400">
                                ${m.familyContribution.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                /* Charter a New Family Form (if unaffiliated) */
                <div className="bg-[#1a1a1a] border border-zinc-800 p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                    <div>
                      <h3 className="text-sm font-bold uppercase text-amber-400">
                        Charter a New Mafia Family ($2,500 Fee)
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Establish your own Syndicate as Don in {user.city}. $1,000 of your charter
                        fee goes directly into your new Family Treasury.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase text-zinc-400 mb-1">
                        Family Name
                      </label>
                      <input
                        type="text"
                        value={newFamName}
                        onChange={(e) => setNewFamName(e.target.value)}
                        placeholder="e.g. Gambino Syndicate"
                        className="w-full bg-[#121212] border border-zinc-700 px-3 py-2 text-xs text-zinc-100 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-zinc-400 mb-1">
                        Syndicate Tag (2–5 chars)
                      </label>
                      <input
                        type="text"
                        maxLength={5}
                        value={newFamTag}
                        onChange={(e) => setNewFamTag(e.target.value.toUpperCase())}
                        placeholder="e.g. GAMB"
                        className="w-full bg-[#121212] border border-zinc-700 px-3 py-2 text-xs text-zinc-100 uppercase outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-zinc-400 mb-1">
                        Family Motto
                      </label>
                      <input
                        type="text"
                        value={newFamMotto}
                        onChange={(e) => setNewFamMotto(e.target.value)}
                        placeholder="Silence is golden."
                        className="w-full bg-[#121212] border border-zinc-700 px-3 py-2 text-xs text-zinc-100 outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() =>
                      runAction(() => createFamilyAction(newFamName, newFamTag, newFamMotto))
                    }
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider cursor-pointer"
                  >
                    Found Family as Don ($2,500)
                  </button>
                </div>
              )}

              {/* Directory of Active Families */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Active Commission Families ({families.length})
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {sortedFamilies.map((fam) => {
                    const isMember = user.familyId === fam.id;
                    return (
                      <div
                        key={fam.id}
                        className="bg-[#1a1a1a] border border-zinc-800 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold">
                              [{fam.tag}]
                            </span>
                            <h4 className="text-sm font-bold text-zinc-100">{fam.name}</h4>
                            <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-400 uppercase">
                              HQ: {fam.homeCity}
                            </span>
                          </div>
                          <p className="text-xs italic text-zinc-400">&ldquo;{fam.motto}&rdquo;</p>
                          <div className="flex flex-wrap gap-4 text-[11px] text-zinc-400 pt-1">
                            <span>
                              Boss/Founder:{" "}
                              <strong className="text-zinc-200">{fam.founderName}</strong>
                            </span>
                            <span>
                              Members: <strong className="text-zinc-200">{fam.memberCount}</strong>
                            </span>
                            <span>
                              Treasury:{" "}
                              <strong className="text-amber-400">
                                ${fam.treasuryCash.toLocaleString()}
                              </strong>
                            </span>
                            <span>
                              Syndicate Net Worth:{" "}
                              <strong className="text-emerald-400">
                                ${fam.combinedSyndicateWorth.toLocaleString()}
                              </strong>
                            </span>
                          </div>
                        </div>

                        {!user.familyId ? (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => runAction(() => joinFamilyAction(fam.id))}
                            className="shrink-0 px-4 py-2 bg-zinc-100 hover:bg-white text-black font-bold text-xs uppercase cursor-pointer"
                          >
                            Swear Allegiance (Join)
                          </button>
                        ) : (
                          isMember && (
                            <span className="text-xs px-3 py-1.5 bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold uppercase">
                              Your Family
                            </span>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
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
                <p className="text-xs text-zinc-400">
                  Live standings of the most powerful Mafia Families and top individual earners
                  across all six territories.
                </p>
              </div>

              {/* 1. FAMILY LEADERBOARD */}
              <div className="bg-[#1a1a1a] border border-zinc-800 p-4 space-y-3 overflow-x-auto">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase text-amber-400">
                    Top Mafia Families (Syndicate Leaderboard)
                  </h3>
                  <span className="text-[11px] text-zinc-400">
                    Ranked by Combined Syndicate Net Worth
                  </span>
                </div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-[#121212] text-zinc-400">
                      <th className="py-2.5 px-3">Rank</th>
                      <th className="py-2.5 px-3">Syndicate</th>
                      <th className="py-2.5 px-3">HQ Territory</th>
                      <th className="py-2.5 px-3">Members</th>
                      <th className="py-2.5 px-3">Total Family XP</th>
                      <th className="py-2.5 px-3">Family Treasury</th>
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
                            : "bg-[#121212] text-zinc-400 border-zinc-800 hover:text-zinc-200"
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
                      <th className="py-2.5 px-3">Hierarchy Rank</th>
                      <th className="py-2.5 px-3">Rank XP</th>
                      <th className="py-2.5 px-3">Net Worth</th>
                      <th className="py-2.5 px-3">Crimes / GTA / Busts</th>
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
                            {p.crimesCommitted} / {p.carsStolen} / {p.bustsSucceeded}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* VIEWPORT: SMUGGLING MARKETPLACE (STAGE 3) */}
          {activeTab === "smuggling" && (
            <section className="space-y-5">
              <div className="bg-[#1a1a1a] border border-zinc-800 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-zinc-100 uppercase">
                    Contraband Smuggling Exchange — {user.city}
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Buy low in producer cities (like Havana for Rum or Palermo for Heroin) and
                    travel to high-demand hubs (like Las Vegas or New York) to sell for profit & XP.
                  </p>
                </div>
                <div className="flex gap-3 text-xs shrink-0">
                  <div className="bg-[#121212] border border-zinc-800 px-3 py-2">
                    <span className="text-[10px] uppercase text-zinc-500 block">
                      Booze Capacity
                    </span>
                    <strong className="text-amber-400">
                      {carriedBooze} / {rankInfo.current.boozeCapacity} crates
                    </strong>
                  </div>
                  <div className="bg-[#121212] border border-zinc-800 px-3 py-2">
                    <span className="text-[10px] uppercase text-zinc-500 block">
                      Narcotics Capacity
                    </span>
                    <strong className="text-emerald-400">
                      {carriedNarcotics} / {rankInfo.current.narcoticsCapacity} kilos
                    </strong>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(["booze", "narcotics"] as const).map((type) => {
                  const items = SMUGGLING_ITEMS.filter((i) => i.itemType === type);
                  const remainingCap =
                    type === "booze"
                      ? rankInfo.current.boozeCapacity - carriedBooze
                      : rankInfo.current.narcoticsCapacity - carriedNarcotics;

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

              {/* Cross-City Arbitrage Ticker */}
              <div className="bg-[#1a1a1a] border border-zinc-800 p-4 space-y-3 overflow-x-auto">
                <div className="text-xs font-bold uppercase text-zinc-300">
                  Syndicate Wire — Cross-City Commodity Quotes
                </div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400">
                      <th className="py-2 pr-3">Commodity</th>
                      {CITIES.map((c) => (
                        <th
                          key={c.name}
                          className={`py-2 px-2 ${
                            c.name === user.city ? "text-amber-400 font-bold" : ""
                          }`}
                        >
                          {c.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SMUGGLING_ITEMS.map((item) => {
                      const rowPrices = CITIES.map(
                        (c) =>
                          markets.find((m) => m.city === c.name && m.itemName === item.itemName)
                            ?.price ?? 0
                      );
                      const minP = Math.min(...rowPrices);
                      const maxP = Math.max(...rowPrices);

                      return (
                        <tr key={item.itemName} className="border-b border-zinc-800/60">
                          <td className="py-2 pr-3 font-bold text-zinc-200">{item.itemName}</td>
                          {CITIES.map((c) => {
                            const p =
                              markets.find(
                                (m) => m.city === c.name && m.itemName === item.itemName
                              )?.price ?? 0;
                            return (
                              <td
                                key={c.name}
                                className={`py-2 px-2 ${
                                  p === minP
                                    ? "text-emerald-400 font-bold"
                                    : p === maxP
                                      ? "text-amber-300 font-bold"
                                      : "text-zinc-400"
                                }`}
                              >
                                ${p.toLocaleString()}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
                    Move across the six syndicate territories to arbitrage smuggling prices or fence
                    stolen vehicles.
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
              <div className="bg-[#1a1a1a] border border-zinc-800 p-4">
                <h2 className="text-lg font-bold tracking-tight text-zinc-100 uppercase">
                  Family Bank, Underground Surgeon & Armory
                </h2>
                <p className="text-xs text-zinc-400">
                  Launder street cash into the Family Vault (3% bookkeeper fee, free withdrawals),
                  collect 3% vault dividends, stitch up bullet wounds, or stock up on .45 ammo.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Family Vault */}
                <div className="bg-[#1a1a1a] border border-zinc-800 p-5 space-y-4">
                  <div className="border-b border-zinc-800 pb-3">
                    <h3 className="text-sm font-bold uppercase text-amber-400">
                      The Family Bank Vault
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      Deposits incur a 3% laundering fee. Withdrawals are instant and fee-free.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-[#121212] border border-zinc-800 p-3">
                    <div>
                      <span className="text-[10px] uppercase text-zinc-500 block">Street Cash</span>
                      <span className="text-base font-bold text-emerald-400">
                        ${user.cash.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-zinc-500 block">
                        Vault Balance
                      </span>
                      <span className="text-base font-bold text-amber-300">
                        ${user.bankCash.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[11px] uppercase text-zinc-400">
                      Transfer Amount ($)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={1}
                        value={bankAmount}
                        onChange={(e) => setBankAmount(e.target.value)}
                        className="flex-1 bg-[#121212] border border-zinc-700 px-3 py-2 text-sm text-zinc-100 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setBankAmount(String(user.cash))}
                        className="px-3 py-2 bg-zinc-800 text-xs text-zinc-300 uppercase cursor-pointer"
                      >
                        Max Cash
                      </button>
                      <button
                        type="button"
                        onClick={() => setBankAmount(String(user.bankCash))}
                        className="px-3 py-2 bg-zinc-800 text-xs text-zinc-300 uppercase cursor-pointer"
                      >
                        Max Vault
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        runAction(() => bankTransactionAction("deposit", Number(bankAmount)))
                      }
                      className="py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase cursor-pointer"
                    >
                      Deposit (3% Fee)
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        runAction(() => bankTransactionAction("withdraw", Number(bankAmount)))
                      }
                      className="py-2.5 bg-zinc-200 hover:bg-white text-black font-bold text-xs uppercase cursor-pointer"
                    >
                      Withdraw (Free)
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={isPending || user.bankCash < 500}
                    onClick={() => runAction(() => bankTransactionAction("dividend", 0))}
                    className="w-full py-2 bg-emerald-950/50 hover:bg-emerald-900/50 border border-emerald-500/40 text-emerald-300 font-bold text-xs uppercase cursor-pointer disabled:opacity-50"
                  >
                    Collect 3% Syndicate Vault Dividend (Min $500 Balance)
                  </button>
                </div>

                {/* Doctor & Armory */}
                <div className="space-y-4">
                  <div className="bg-[#1a1a1a] border border-zinc-800 p-5 space-y-3">
                    <h3 className="text-sm font-bold uppercase text-emerald-400">
                      Back-Alley Surgeon
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Botched street crimes wear down your health. Restore your condition to 100%
                      for $15 per missing HP.
                    </p>
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
                      Syndicate Munitions Depot
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Stockpile .45 ACP Thompson drum magazines ($300 per crate of 25 rounds).
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-zinc-300">
                        In Stockpile: <strong>{user.bullets} rounds</strong>
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => runAction(() => buyBulletsAction(1))}
                          className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase cursor-pointer"
                        >
                          +25 Rounds ($300)
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => runAction(() => buyBulletsAction(4))}
                          className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-zinc-700 font-bold text-xs uppercase cursor-pointer"
                        >
                          +100 Rounds ($1,200)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* VIEWPORT: THE SYNDICATE GAZETTE / ACTIVITY LOG (STAGE 4) */}
          {activeTab === "newspaper" && (
            <section className="space-y-4">
              <div className="bg-[#1a1a1a] border border-zinc-800 p-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-zinc-100 uppercase">
                    The Syndicate Gazette — Underworld Wire
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Dispatches covering major heists, precinct jailbreaks, exotic car thefts,
                    casino windfalls, family charters, and Anti-Tamper Timer Trap arrests.
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 bg-zinc-900 border border-zinc-700 text-zinc-400">
                  LIVE TELETYPE
                </span>
              </div>

              <div className="space-y-2.5">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-[#1a1a1a] border border-zinc-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 font-bold uppercase ${
                            log.category === "ANTI_CHEAT"
                              ? "bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40"
                              : log.category === "JAIL_BUST"
                                ? "bg-amber-500/20 text-amber-300"
                                : log.category === "GTA"
                                  ? "bg-sky-500/20 text-sky-300"
                                  : log.category === "SMUGGLING" || log.category === "CASINO"
                                    ? "bg-emerald-500/20 text-emerald-300"
                                    : log.category === "FAMILY"
                                      ? "bg-amber-500 text-black"
                                      : "bg-zinc-800 text-zinc-300"
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
                <p className="text-xs text-zinc-400">
                  Earn Rank XP from Crimes, GTA, Jail Busts, Family Tribute, and profitable
                  Smuggling runs.
                </p>
              </div>

              <div className="bg-[#1a1a1a] border border-zinc-800 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400 bg-[#141414]">
                      <th className="py-2.5 px-4">Tier</th>
                      <th className="py-2.5 px-4">Rank Title</th>
                      <th className="py-2.5 px-4">Min Rank XP</th>
                      <th className="py-2.5 px-4">Booze Capacity</th>
                      <th className="py-2.5 px-4">Narcotics Capacity</th>
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
