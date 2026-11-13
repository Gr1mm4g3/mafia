"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  clearSessionCookie,
  getCurrentUser,
  hashPassword,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import {
  CAR_CATALOG,
  CITIES,
  getRankInfo,
  GTA_OPTIONS,
  RANKS,
  SMUGGLING_ITEMS,
} from "@/lib/game-config";
import { ensureWorldSeeded } from "@/lib/seed";

export interface ActionResponse {
  ok: boolean;
  tone: "success" | "warning" | "danger" | "anti-cheat";
  title: string;
  message: string;
  timestamp: number;
}

function makeResponse(
  ok: boolean,
  tone: ActionResponse["tone"],
  title: string,
  message: string
): ActionResponse {
  return {
    ok,
    tone,
    title,
    message,
    timestamp: Date.now(),
  };
}

export async function registerOrLoginAction(formData: FormData): Promise<ActionResponse> {
  await ensureWorldSeeded();

  const mode = String(formData.get("mode") || "login");

  if (mode === "quick") {
    const suffixes = ["Corleone", "Luciano", "Capone", "Genovese", "Costello", "Torrio", "Lansky"];
    const chosen = suffixes[Math.floor(Math.random() * suffixes.length)];
    const randNum = Math.floor(100 + Math.random() * 899);
    const username = `Don_${chosen}_${randNum}`;
    const passwordHash = hashPassword("quickpass");

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        cash: 750,
        bankCash: 250,
        health: 100,
        bullets: 20,
        rankPoints: 10,
        city: "New York",
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        actorName: user.username,
        category: "SYSTEM",
        headline: `${user.username} Stepped Off the Boat in New York`,
        details: `A new earner has entered the Commission's territory with $750 in pocket cash.`,
        city: "New York",
      },
    });

    await setSessionCookie(user.id);
    revalidatePath("/");
    return makeResponse(
      true,
      "success",
      "Welcome to the Syndicate",
      `Signed in as ${user.username}. Keep your eyes on the timers.`
    );
  }

  const rawUsername = String(formData.get("username") || "").trim();
  const rawPassword = String(formData.get("password") || "");

  if (rawUsername.length < 3 || rawUsername.length > 24) {
    return makeResponse(
      false,
      "warning",
      "Invalid Handle",
      "Mobster username must be between 3 and 24 characters."
    );
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(rawUsername)) {
    return makeResponse(
      false,
      "warning",
      "Invalid Handle",
      "Use only letters, numbers, underscores, or hyphens."
    );
  }

  if (rawPassword.length < 4) {
    return makeResponse(
      false,
      "warning",
      "Weak Passcode",
      "Passcode must be at least 4 characters."
    );
  }

  const existing = await prisma.user.findUnique({
    where: { username: rawUsername },
  });

  if (mode === "register") {
    if (existing) {
      return makeResponse(
        false,
        "danger",
        "Alias Already Taken",
        `Another made man is already operating under "${rawUsername}".`
      );
    }

    const user = await prisma.user.create({
      data: {
        username: rawUsername,
        passwordHash: hashPassword(rawPassword),
        cash: 600,
        bankCash: 0,
        health: 100,
        bullets: 15,
        rankPoints: 0,
        city: "New York",
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        actorName: user.username,
        category: "SYSTEM",
        headline: `${user.username} Swore Omerta in New York`,
        details: `A fresh associate has joined the underworld ranks.`,
        city: "New York",
      },
    });

    await setSessionCookie(user.id);
    revalidatePath("/");
    return makeResponse(true, "success", "Books Opened", `Welcome to the family, ${user.username}.`);
  }

  // Login mode
  if (!existing || existing.isNpc || !verifyPassword(rawPassword, existing.passwordHash)) {
    return makeResponse(
      false,
      "danger",
      "Authentication Failed",
      "Unknown handle or wrong passcode."
    );
  }

  await setSessionCookie(existing.id);
  revalidatePath("/");
  return makeResponse(true, "success", "Welcome Back", `Returned to ${existing.city}.`);
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  revalidatePath("/");
}

/**
 * STAGE 2: COMMIT CRIME (with Anti-Tamper Timer Trap & Atomic DB Transaction)
 */
export async function commitCrimeAction(crimeId: string): Promise<ActionResponse> {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    return makeResponse(false, "danger", "Unauthorized", "Log in before pulling a job.");
  }

  const now = new Date();
  const nowMs = now.getTime();

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: sessionUser.id } });
    const crime = await tx.crimeConfig.findUnique({ where: { id: crimeId } });

    if (!user || !crime) {
      return makeResponse(false, "danger", "Invalid Caper", "Crime target no longer exists.");
    }

    // Check travel lock
    if (nowMs < user.travelUntil.getTime()) {
      const rem = Math.ceil((user.travelUntil.getTime() - nowMs) / 1000);
      return makeResponse(
        false,
        "warning",
        "In Transit",
        `You are still aboard transport for another ${rem}s.`
      );
    }

    // ANTI-TAMPER TIMER TRAP #1: Acting while in jail extends sentence!
    if (nowMs < user.jailUntil.getTime()) {
      const penaltySec = 30;
      const extendedJail = new Date(user.jailUntil.getTime() + penaltySec * 1000);
      await tx.user.update({
        where: { id: user.id },
        data: {
          jailUntil: extendedJail,
          jailReason: "Anti-Tamper Trap: Caught scheming a crime from inside a locked cell (+30s)",
        },
      });
      await tx.activityLog.create({
        data: {
          userId: user.id,
          actorName: user.username,
          category: "ANTI_CHEAT",
          headline: `Warden Extends ${user.username}'s Sentence for Sloppy Work`,
          details: `${user.username} tried to trigger a street crime while still behind bars. +${penaltySec}s added to cell time.`,
          city: user.city,
        },
      });
      revalidatePath("/");
      return makeResponse(
        false,
        "anti-cheat",
        "ANTI-TAMPER TRAP TRIGGERED!",
        `You tried to pull a job while still in jail! The warden tacked +${penaltySec}s onto your sentence for sloppy work.`
      );
    }

    // ANTI-TAMPER TIMER TRAP #2: Submitting crime request before Date.now() >= user.nextCrimeAt
    if (nowMs < user.nextCrimeAt.getTime()) {
      const penaltyJailSec = 40;
      const newJailUntil = new Date(nowMs + penaltyJailSec * 1000);
      const extendedCooldown = new Date(user.nextCrimeAt.getTime() + 25 * 1000);

      await tx.user.update({
        where: { id: user.id },
        data: {
          jailUntil: newJailUntil,
          nextCrimeAt: extendedCooldown,
          jailReason:
            "Anti-Tamper Timer Trap: Rushed a crime before cooldown expired — detectives were waiting!",
        },
      });

      await tx.activityLog.create({
        data: {
          userId: user.id,
          actorName: user.username,
          category: "ANTI_CHEAT",
          headline: `${user.username} Pinched for Sloppy, Premature Work!`,
          details: `Server caught an early action request before nextCrimeAt expired. Thrown straight into ${user.city} Precinct Jail for ${penaltyJailSec}s.`,
          city: user.city,
        },
      });

      revalidatePath("/");
      return makeResponse(
        false,
        "anti-cheat",
        "SLOPPY WORK — THROWN IN JAIL!",
        `Anti-Tamper Timer Trap triggered: You acted before your Crime cooldown expired! Undercover detectives nabbed you for ${penaltyJailSec}s.`
      );
    }

    const rankInfo = getRankInfo(user.rankPoints);
    if (rankInfo.current.index < crime.rankRequirement) {
      const reqRank = RANKS[crime.rankRequirement]?.name ?? "Higher Rank";
      return makeResponse(
        false,
        "warning",
        "Insufficient Standing",
        `You must reach the rank of ${reqRank} before attempting "${crime.name}".`
      );
    }

    // Calculate server-side success rate (base + rank bonus up to +15%)
    const rankBonus = Math.min(15, (rankInfo.current.index - crime.rankRequirement) * 2.5);
    const effectiveChance = Math.min(95, Math.max(10, crime.baseSuccessRate + rankBonus));
    const roll = Math.random() * 100;
    const nextCrimeAt = new Date(nowMs + crime.cooldownSeconds * 1000);

    if (roll <= effectiveChance) {
      // SUCCESS
      const cashEarned =
        Math.floor(Math.random() * (crime.baseCashMax - crime.baseCashMin + 1)) +
        crime.baseCashMin;
      const newRankPoints = Number((user.rankPoints + crime.rankPointsReward).toFixed(2));
      const newRankInfo = getRankInfo(newRankPoints);
      const rankedUp = newRankInfo.current.index > rankInfo.current.index;

      await tx.user.update({
        where: { id: user.id },
        data: {
          cash: { increment: cashEarned },
          rankPoints: newRankPoints,
          nextCrimeAt,
          crimesCommitted: { increment: 1 },
        },
      });

      if (crime.tier >= 3 || rankedUp) {
        await tx.activityLog.create({
          data: {
            userId: user.id,
            actorName: user.username,
            category: "CRIME",
            headline: rankedUp
              ? `${user.username} Promoted to ${newRankInfo.current.name}!`
              : `${user.username} Pulled Off "${crime.name}" in ${user.city}`,
            details: `Walked away clean with $${cashEarned.toLocaleString()} and +${crime.rankPointsReward} XP.`,
            city: user.city,
          },
        });
      }

      revalidatePath("/");
      return makeResponse(
        true,
        "success",
        rankedUp ? `Heist Clean — Ranked Up to ${newRankInfo.current.name}!` : "Job Pulled Cleanly",
        `You executed "${crime.name}" and pocketed $${cashEarned.toLocaleString()} (+${crime.rankPointsReward} Rank XP).`
      );
    }

    // FAILURE: Check if critical failure (60% of failures result in jail)
    const isCritical = Math.random() < 0.65;
    if (isCritical) {
      const jailUntil = new Date(nowMs + crime.jailSeconds * 1000);
      await tx.user.update({
        where: { id: user.id },
        data: {
          nextCrimeAt,
          jailUntil,
          jailReason: `Busted during "${crime.name}" in ${user.city}`,
        },
      });

      await tx.activityLog.create({
        data: {
          userId: user.id,
          actorName: user.username,
          category: "CRIME",
          headline: `${user.username} Collared by Police in ${user.city}`,
          details: `Sirens surrounded the block during "${crime.name}". Locked up for ${crime.jailSeconds}s.`,
          city: user.city,
        },
      });

      revalidatePath("/");
      return makeResponse(
        false,
        "danger",
        "BUSTED BY THE COPS!",
        `Critical failure on "${crime.name}"! Patrol cars boxed you in — you're in ${user.city} Jail for ${crime.jailSeconds}s.`
      );
    } else {
      // Minor scrape escape
      const hpLoss = Math.min(user.health - 5, 3);
      await tx.user.update({
        where: { id: user.id },
        data: {
          nextCrimeAt,
          health: Math.max(5, user.health - Math.max(0, hpLoss)),
        },
      });

      revalidatePath("/");
      return makeResponse(
        false,
        "warning",
        "Job Botched — Escaped on Foot",
        `The mark raised the alarm during "${crime.name}". You ditched the scene empty-handed.`
      );
    }
  });
}

/**
 * STAGE 2: GTA (STEAL A CAR)
 */
export async function commitGtaAction(gtaOptionId: string): Promise<ActionResponse> {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    return makeResponse(false, "danger", "Unauthorized", "Log in first.");
  }

  const gtaOption = GTA_OPTIONS.find((o) => o.id === gtaOptionId);
  if (!gtaOption) {
    return makeResponse(false, "danger", "Invalid Approach", "Unknown GTA method.");
  }

  const now = new Date();
  const nowMs = now.getTime();

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: sessionUser.id } });
    if (!user) {
      return makeResponse(false, "danger", "User Not Found", "Session invalid.");
    }

    if (nowMs < user.travelUntil.getTime()) {
      const rem = Math.ceil((user.travelUntil.getTime() - nowMs) / 1000);
      return makeResponse(false, "warning", "In Transit", `Wait ${rem}s until you land.`);
    }

    // Anti-Tamper Trap if in jail
    if (nowMs < user.jailUntil.getTime()) {
      const penaltySec = 35;
      const extendedJail = new Date(user.jailUntil.getTime() + penaltySec * 1000);
      await tx.user.update({
        where: { id: user.id },
        data: {
          jailUntil: extendedJail,
          jailReason: "Anti-Tamper Trap: Tried boosting a car while locked in a cell (+35s)",
        },
      });
      revalidatePath("/");
      return makeResponse(
        false,
        "anti-cheat",
        "ANTI-TAMPER TRAP TRIGGERED!",
        `You tried to boost a vehicle while in jail! Sentence extended by +${penaltySec}s.`
      );
    }

    // Anti-Tamper Trap if Date.now() < user.nextGtaAt
    if (nowMs < user.nextGtaAt.getTime()) {
      const penaltyJailSec = 45;
      const newJailUntil = new Date(nowMs + penaltyJailSec * 1000);
      const extendedGta = new Date(user.nextGtaAt.getTime() + 30 * 1000);

      await tx.user.update({
        where: { id: user.id },
        data: {
          jailUntil: newJailUntil,
          nextGtaAt: extendedGta,
          jailReason: "Anti-Tamper Timer Trap: Triggered GTA before heat died down!",
        },
      });

      await tx.activityLog.create({
        data: {
          userId: user.id,
          actorName: user.username,
          category: "ANTI_CHEAT",
          headline: `${user.username} Walked Into a Police Bait-Car Sting!`,
          details: `Server rejected premature GTA timestamp and threw ${user.username} into jail for ${penaltyJailSec}s.`,
          city: user.city,
        },
      });

      revalidatePath("/");
      return makeResponse(
        false,
        "anti-cheat",
        "BAIT CAR STING — JAILED FOR SLOPPY WORK!",
        `Anti-Tamper Timer Trap: You attempted GTA before your timer reached 00:00! Locked up for ${penaltyJailSec}s.`
      );
    }

    const rankInfo = getRankInfo(user.rankPoints);
    if (rankInfo.current.index < gtaOption.rankRequirement) {
      return makeResponse(
        false,
        "warning",
        "Rank Too Low",
        `Requires ${RANKS[gtaOption.rankRequirement]?.name} rank.`
      );
    }

    const effectiveChance = Math.min(
      90,
      gtaOption.baseSuccessRate + (rankInfo.current.index - gtaOption.rankRequirement) * 2
    );
    const roll = Math.random() * 100;
    const nextGtaAt = new Date(nowMs + gtaOption.cooldownSeconds * 1000);

    if (roll <= effectiveChance) {
      // Pick car model based on GTA option tier
      const allowedCars = CAR_CATALOG.filter((c) => {
        if (gtaOption.id === "street-parked") return c.classTier !== "Exotic";
        if (gtaOption.id === "valet-heist") return true;
        return c.classTier !== "Street";
      });

      const totalWeight = allowedCars.reduce((acc, c) => acc + c.weight, 0);
      let r = Math.random() * totalWeight;
      let chosenCar = allowedCars[0];
      for (const car of allowedCars) {
        r -= car.weight;
        if (r <= 0) {
          chosenCar = car;
          break;
        }
      }

      // Random damage percentage (0-75%)
      const damage = Math.floor(Math.random() * 76);
      const newRankPoints = Number((user.rankPoints + gtaOption.rankPointsReward).toFixed(2));

      const vehicle = await tx.vehicle.create({
        data: {
          userId: user.id,
          name: chosenCar.name,
          classTier: chosenCar.classTier,
          baseValue: chosenCar.baseValue,
          damage,
          originCity: user.city,
          currentCity: user.city,
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: {
          nextGtaAt,
          rankPoints: newRankPoints,
          carsStolen: { increment: 1 },
        },
      });

      await tx.activityLog.create({
        data: {
          userId: user.id,
          actorName: user.username,
          category: "GTA",
          headline: `${user.username} Boosted a ${chosenCar.name} in ${user.city}`,
          details: `Stashed in the garage with ${damage}% body damage (${chosenCar.classTier} class).`,
          city: user.city,
        },
      });

      revalidatePath("/");
      return makeResponse(
        true,
        "success",
        `Stolen: ${vehicle.name}!`,
        `You hotwired a ${vehicle.name} (${vehicle.damage}% damage, base value $${vehicle.baseValue.toLocaleString()}) and parked it in your ${user.city} Garage!`
      );
    }

    // Failed GTA -> 70% chance of jail
    if (Math.random() < 0.7) {
      const jailUntil = new Date(nowMs + gtaOption.jailSeconds * 1000);
      await tx.user.update({
        where: { id: user.id },
        data: {
          nextGtaAt,
          jailUntil,
          jailReason: `Caught boosting a car (${gtaOption.label})`,
        },
      });

      await tx.activityLog.create({
        data: {
          userId: user.id,
          actorName: user.username,
          category: "GTA",
          headline: `Auto-Theft Squad Nabbed ${user.username} in ${user.city}`,
          details: `Car alarm triggered a precinct response. Sentenced to ${gtaOption.jailSeconds}s.`,
          city: user.city,
        },
      });

      revalidatePath("/");
      return makeResponse(
        false,
        "danger",
        "SIRENS WAIL — ARRESTED!",
        `The steering column locked and squad cars cornered the alley! You're in jail for ${gtaOption.jailSeconds}s.`
      );
    }

    await tx.user.update({
      where: { id: user.id },
      data: { nextGtaAt },
    });
    revalidatePath("/");
    return makeResponse(
      false,
      "warning",
      "Ignition Snapped",
      "The screwdriver sheared off in the ignition cylinder. You slipped away before the owner returned."
    );
  });
}

/**
 * STAGE 3: JAIL BUSTING & SELF BAILOUT
 */
export async function bustInmateAction(inmateId: string): Promise<ActionResponse> {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    return makeResponse(false, "danger", "Unauthorized", "Log in first.");
  }

  const now = new Date();
  const nowMs = now.getTime();

  return prisma.$transaction(async (tx) => {
    const rescuer = await tx.user.findUnique({ where: { id: sessionUser.id } });
    const inmate = await tx.user.findUnique({ where: { id: inmateId } });

    if (!rescuer || !inmate) {
      return makeResponse(false, "danger", "Not Found", "Inmate not found.");
    }

    if (rescuer.id === inmate.id) {
      return makeResponse(
        false,
        "warning",
        "Cannot Bust Yourself",
        "You cannot unlock your own cell from the outside! Bribe the warden or wait for a crew member."
      );
    }

    if (nowMs < rescuer.jailUntil.getTime()) {
      return makeResponse(
        false,
        "danger",
        "Behind Bars",
        "You are currently locked up yourself and cannot bust others out!"
      );
    }

    if (nowMs < rescuer.travelUntil.getTime()) {
      return makeResponse(false, "warning", "In Transit", "Wait until your travel completes.");
    }

    if (nowMs >= inmate.jailUntil.getTime()) {
      return makeResponse(
        false,
        "warning",
        "Already Released",
        `${inmate.username} was just released from custody.`
      );
    }

    const rankInfo = getRankInfo(rescuer.rankPoints);
    const bustChance = Math.min(88, 52 + rankInfo.current.index * 3);
    const roll = Math.random() * 100;

    if (roll <= bustChance) {
      const xpGain = 18;
      const tipCash = 175;
      const freeTime = new Date(nowMs - 1000);

      await tx.user.update({
        where: { id: inmate.id },
        data: {
          jailUntil: freeTime,
          jailReason: null,
        },
      });

      await tx.user.update({
        where: { id: rescuer.id },
        data: {
          rankPoints: Number((rescuer.rankPoints + xpGain).toFixed(2)),
          cash: { increment: tipCash },
          bustsSucceeded: { increment: 1 },
        },
      });

      await tx.activityLog.create({
        data: {
          userId: rescuer.id,
          actorName: rescuer.username,
          category: "JAIL_BUST",
          headline: `${rescuer.username} Busted ${inmate.username} Out of Precinct Lockup!`,
          details: `A smokescreen and crowbar freed ${inmate.username}. ${rescuer.username} earned +${xpGain} XP and a $${tipCash} tribute.`,
          city: inmate.city,
        },
      });

      revalidatePath("/");
      return makeResponse(
        true,
        "success",
        `Jailbreak Succeeded!`,
        `You busted ${inmate.username} out of ${inmate.city} Jail! Earned +${xpGain} Rank XP and $${tipCash} gratitude money.`
      );
    } else {
      // Rescuer lands in jail too!
      const penaltySec = 40;
      const rescuerJailUntil = new Date(nowMs + penaltySec * 1000);

      await tx.user.update({
        where: { id: rescuer.id },
        data: {
          jailUntil: rescuerJailUntil,
          jailReason: `Caught trying to bust ${inmate.username} out of jail`,
        },
      });

      await tx.activityLog.create({
        data: {
          userId: rescuer.id,
          actorName: rescuer.username,
          category: "JAIL_BUST",
          headline: `Botched Jailbreak! ${rescuer.username} Thrown Into Adjacent Cell`,
          details: `Guards caught ${rescuer.username} attempting to free ${inmate.username}. Locked up for ${penaltySec}s.`,
          city: rescuer.city,
        },
      });

      revalidatePath("/");
      return makeResponse(
        false,
        "danger",
        "BOTCHED BUST — YOU'RE IN JAIL TOO!",
        `Turnkeys caught you sawing the bars for ${inmate.username}! You've been thrown into a cell for ${penaltySec}s.`
      );
    }
  });
}

export async function bribeWardenAction(): Promise<ActionResponse> {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    return makeResponse(false, "danger", "Unauthorized", "Log in first.");
  }

  const now = new Date();
  const nowMs = now.getTime();

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: sessionUser.id } });
    if (!user) return makeResponse(false, "danger", "Error", "User missing.");

    if (nowMs >= user.jailUntil.getTime()) {
      return makeResponse(false, "warning", "Already Free", "You are no longer in jail.");
    }

    const remainingSec = Math.ceil((user.jailUntil.getTime() - nowMs) / 1000);
    const bribeCost = Math.max(150, remainingSec * 8);

    if (user.cash < bribeCost) {
      return makeResponse(
        false,
        "danger",
        "Not Enough Cash on Hand",
        `The turnkey demands $${bribeCost.toLocaleString()} cash in an envelope (you have $${user.cash.toLocaleString()}).`
      );
    }

    await tx.user.update({
      where: { id: user.id },
      data: {
        cash: { decrement: bribeCost },
        jailUntil: new Date(nowMs - 1000),
        jailReason: null,
      },
    });

    await tx.activityLog.create({
      data: {
        userId: user.id,
        actorName: user.username,
        category: "JAIL_BUST",
        headline: `${user.username} Greased the Warden's Palm in ${user.city}`,
        details: `Walked out the side door after slipping $${bribeCost.toLocaleString()} to precinct brass.`,
        city: user.city,
      },
    });

    revalidatePath("/");
    return makeResponse(
      true,
      "success",
      "Warden Bribed — You're Free!",
      `You slipped $${bribeCost.toLocaleString()} to the desk sergeant and walked out onto the street.`
    );
  });
}

/**
 * STAGE 3: CITY TRAVEL & SMUGGLING MARKETPLACE
 */
export async function travelToCityAction(destinationCity: string): Promise<ActionResponse> {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    return makeResponse(false, "danger", "Unauthorized", "Log in first.");
  }

  const citySpec = CITIES.find((c) => c.name === destinationCity);
  if (!citySpec) {
    return makeResponse(false, "danger", "Invalid Destination", "City route does not exist.");
  }

  const now = new Date();
  const nowMs = now.getTime();

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: sessionUser.id } });
    if (!user) return makeResponse(false, "danger", "Error", "User missing.");

    if (user.city === citySpec.name) {
      return makeResponse(false, "warning", "Already Here", `You are already in ${citySpec.name}.`);
    }

    if (nowMs < user.jailUntil.getTime()) {
      return makeResponse(
        false,
        "danger",
        "Locked Up",
        "You can't board a flight while sitting in a precinct cell!"
      );
    }

    if (nowMs < user.travelUntil.getTime()) {
      const rem = Math.ceil((user.travelUntil.getTime() - nowMs) / 1000);
      return makeResponse(
        false,
        "warning",
        "Already Traveling",
        `Wait ${rem}s before chartering another route.`
      );
    }

    if (user.cash < citySpec.ticketCost) {
      return makeResponse(
        false,
        "danger",
        "Insufficient Pocket Cash",
        `Ticket to ${citySpec.name} costs $${citySpec.ticketCost.toLocaleString()} cash.`
      );
    }

    const travelUntil = new Date(nowMs + citySpec.travelCooldownSeconds * 1000);
    const origin = user.city;

    await tx.user.update({
      where: { id: user.id },
      data: {
        cash: { decrement: citySpec.ticketCost },
        city: citySpec.name,
        travelUntil,
      },
    });

    await tx.activityLog.create({
      data: {
        userId: user.id,
        actorName: user.username,
        category: "TRAVEL",
        headline: `${user.username} Chartered Transit from ${origin} to ${citySpec.name}`,
        details: `Paid $${citySpec.ticketCost} for private passage (${citySpec.travelCooldownSeconds}s transit cooldown).`,
        city: citySpec.name,
      },
    });

    revalidatePath("/");
    return makeResponse(
      true,
      "success",
      `Arrived in ${citySpec.name}`,
      `Paid $${citySpec.ticketCost.toLocaleString()} for transit from ${origin} to ${citySpec.name}. Travel cooldown: ${citySpec.travelCooldownSeconds}s.`
    );
  });
}

export async function tradeSmugglingItemAction(
  itemName: string,
  tradeType: "buy" | "sell",
  quantity: number
): Promise<ActionResponse> {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    return makeResponse(false, "danger", "Unauthorized", "Log in first.");
  }

  const cleanQty = Math.floor(Number(quantity));
  if (!Number.isFinite(cleanQty) || cleanQty <= 0) {
    return makeResponse(false, "warning", "Invalid Quantity", "Enter a positive crate quantity.");
  }

  const itemSpec = SMUGGLING_ITEMS.find((i) => i.itemName === itemName);
  if (!itemSpec) {
    return makeResponse(false, "danger", "Unknown Contraband", "Commodity not recognized.");
  }

  const now = new Date();
  const nowMs = now.getTime();

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: sessionUser.id },
      include: { inventory: true },
    });

    if (!user) return makeResponse(false, "danger", "Error", "User missing.");

    if (nowMs < user.jailUntil.getTime()) {
      return makeResponse(
        false,
        "danger",
        "Behind Bars",
        "You cannot trade contraband from inside jail!"
      );
    }

    const marketQuote = await tx.cityMarket.findUnique({
      where: {
        city_itemName: {
          city: user.city,
          itemName: itemSpec.itemName,
        },
      },
    });

    if (!marketQuote) {
      return makeResponse(false, "danger", "Market Closed", "No local quote found.");
    }

    const rankInfo = getRankInfo(user.rankPoints);
    const currentTypeTotal = user.inventory
      .filter((inv) => inv.itemType === itemSpec.itemType)
      .reduce((acc, inv) => acc + inv.quantity, 0);

    const maxCapacity =
      itemSpec.itemType === "booze"
        ? rankInfo.current.boozeCapacity
        : rankInfo.current.narcoticsCapacity;

    const existingRow = user.inventory.find((inv) => inv.itemName === itemSpec.itemName);

    if (tradeType === "buy") {
      if (currentTypeTotal + cleanQty > maxCapacity) {
        return makeResponse(
          false,
          "warning",
          "Cargo Capacity Exceeded",
          `Your ${rankInfo.current.name} rank allows at most ${maxCapacity} ${itemSpec.itemType} units (currently carrying ${currentTypeTotal}).`
        );
      }

      const totalCost = marketQuote.price * cleanQty;
      if (user.cash < totalCost) {
        return makeResponse(
          false,
          "danger",
          "Insufficient Cash",
          `${cleanQty}x ${itemSpec.itemName} costs $${totalCost.toLocaleString()} in ${user.city}.`
        );
      }

      const prevQty = existingRow?.quantity ?? 0;
      const prevAvg = existingRow?.avgCost ?? 0;
      const newQty = prevQty + cleanQty;
      const newAvg = Math.round((prevQty * prevAvg + totalCost) / newQty);

      await tx.user.update({
        where: { id: user.id },
        data: {
          cash: { decrement: totalCost },
        },
      });

      await tx.smugglingInventory.upsert({
        where: {
          userId_itemName: {
            userId: user.id,
            itemName: itemSpec.itemName,
          },
        },
        update: {
          quantity: newQty,
          avgCost: newAvg,
        },
        create: {
          userId: user.id,
          itemType: itemSpec.itemType,
          itemName: itemSpec.itemName,
          quantity: cleanQty,
          avgCost: marketQuote.price,
        },
      });

      revalidatePath("/");
      return makeResponse(
        true,
        "success",
        `Purchased ${cleanQty}x ${itemSpec.itemName}`,
        `Paid $${totalCost.toLocaleString()} ($${marketQuote.price.toLocaleString()}/unit) in ${user.city}.`
      );
    } else {
      // SELL
      const ownedQty = existingRow?.quantity ?? 0;
      if (ownedQty < cleanQty) {
        return makeResponse(
          false,
          "warning",
          "Not Enough Inventory",
          `You only carry ${ownedQty}x ${itemSpec.itemName}.`
        );
      }

      const grossRevenue = marketQuote.price * cleanQty;
      const costBasis = (existingRow?.avgCost ?? marketQuote.price) * cleanQty;
      const netProfit = grossRevenue - costBasis;
      // Grant XP when selling at a profit!
      const xpGain = netProfit > 0 ? Math.min(35, Number((netProfit / 250).toFixed(1))) : 0;

      await tx.user.update({
        where: { id: user.id },
        data: {
          cash: { increment: grossRevenue },
          rankPoints: Number((user.rankPoints + xpGain).toFixed(2)),
        },
      });

      await tx.smugglingInventory.update({
        where: {
          userId_itemName: {
            userId: user.id,
            itemName: itemSpec.itemName,
          },
        },
        data: {
          quantity: ownedQty - cleanQty,
        },
      });

      if (netProfit >= 500) {
        await tx.activityLog.create({
          data: {
            userId: user.id,
            actorName: user.username,
            category: "SMUGGLING",
            headline: `${user.username} Unloaded Contraband ${itemSpec.itemName} in ${user.city}`,
            details: `Sold ${cleanQty} units for $${grossRevenue.toLocaleString()} (net profit $${netProfit.toLocaleString()}).`,
            city: user.city,
          },
        });
      }

      revalidatePath("/");
      return makeResponse(
        true,
        "success",
        `Sold ${cleanQty}x ${itemSpec.itemName}`,
        `Collected $${grossRevenue.toLocaleString()} (${netProfit >= 0 ? `+$${netProfit.toLocaleString()} profit` : `-$${Math.abs(netProfit).toLocaleString()} loss`}${xpGain > 0 ? `, +${xpGain} XP` : ""}).`
      );
    }
  });
}

/**
 * STAGE 4: GARAGE ACTIONS (REPAIR, SELL, SHIP) & BANK / DOCTOR / ARMORY
 */
export async function repairVehicleAction(vehicleId: string): Promise<ActionResponse> {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return makeResponse(false, "danger", "Unauthorized", "Log in first.");

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: sessionUser.id } });
    const car = await tx.vehicle.findUnique({ where: { id: vehicleId } });

    if (!user || !car || car.userId !== user.id) {
      return makeResponse(false, "danger", "Not Found", "Vehicle not found in your garage.");
    }

    if (car.damage === 0) {
      return makeResponse(false, "warning", "Mint Condition", `${car.name} already has 0% damage.`);
    }

    const repairCost = Math.max(60, Math.round(car.baseValue * (car.damage / 100) * 0.25));
    if (user.cash < repairCost) {
      return makeResponse(
        false,
        "danger",
        "Insufficient Cash",
        `Body shop requires $${repairCost.toLocaleString()} to restore ${car.name} to 0% damage.`
      );
    }

    await tx.user.update({
      where: { id: user.id },
      data: { cash: { decrement: repairCost } },
    });

    await tx.vehicle.update({
      where: { id: car.id },
      data: { damage: 0 },
    });

    revalidatePath("/");
    return makeResponse(
      true,
      "success",
      `${car.name} Restored`,
      `Paid the chop-shop mechanic $${repairCost.toLocaleString()} — ${car.name} is now in pristine 0% damage condition.`
    );
  });
}

export async function shipVehicleAction(
  vehicleId: string,
  targetCity: string
): Promise<ActionResponse> {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return makeResponse(false, "danger", "Unauthorized", "Log in first.");

  const cityExists = CITIES.some((c) => c.name === targetCity);
  if (!cityExists) return makeResponse(false, "danger", "Invalid City", "Unknown destination.");

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: sessionUser.id } });
    const car = await tx.vehicle.findUnique({ where: { id: vehicleId } });

    if (!user || !car || car.userId !== user.id) {
      return makeResponse(false, "danger", "Not Found", "Vehicle not in your garage.");
    }

    if (car.currentCity === targetCity) {
      return makeResponse(false, "warning", "Same City", `Vehicle is already in ${targetCity}.`);
    }

    const shipFee = 220;
    if (user.cash < shipFee) {
      return makeResponse(
        false,
        "danger",
        "Insufficient Cash",
        `Freight transport requires $${shipFee} cash.`
      );
    }

    await tx.user.update({
      where: { id: user.id },
      data: { cash: { decrement: shipFee } },
    });

    await tx.vehicle.update({
      where: { id: car.id },
      data: { currentCity: targetCity },
    });

    revalidatePath("/");
    return makeResponse(
      true,
      "success",
      `Vehicle Shipped to ${targetCity}`,
      `${car.name} was loaded onto a freight car to ${targetCity} (+25% out-of-state fencing bonus unlocked!).`
    );
  });
}

export async function sellVehicleAction(vehicleId: string): Promise<ActionResponse> {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return makeResponse(false, "danger", "Unauthorized", "Log in first.");

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: sessionUser.id } });
    const car = await tx.vehicle.findUnique({ where: { id: vehicleId } });

    if (!user || !car || car.userId !== user.id) {
      return makeResponse(false, "danger", "Not Found", "Vehicle not in your garage.");
    }

    const conditionFactor = Math.max(0.15, (100 - car.damage) / 100);
    const outOfStateBonus = car.currentCity !== car.originCity ? 1.25 : 1.0;
    const salePrice = Math.round(car.baseValue * conditionFactor * outOfStateBonus);

    await tx.vehicle.delete({ where: { id: car.id } });
    await tx.user.update({
      where: { id: user.id },
      data: { cash: { increment: salePrice } },
    });

    if (salePrice >= 3500) {
      await tx.activityLog.create({
        data: {
          userId: user.id,
          actorName: user.username,
          category: "GTA",
          headline: `${user.username} Fenced a ${car.name} in ${car.currentCity}`,
          details: `Chop-shop paid out $${salePrice.toLocaleString()} cash.`,
          city: car.currentCity,
        },
      });
    }

    revalidatePath("/");
    return makeResponse(
      true,
      "success",
      `Sold ${car.name} for $${salePrice.toLocaleString()}`,
      `Fenced ${car.name} in ${car.currentCity}${car.currentCity !== car.originCity ? " (includes +25% out-of-state smuggling bonus!)" : ""}.`
    );
  });
}

export async function bankTransactionAction(
  type: "deposit" | "withdraw" | "dividend",
  amount: number
): Promise<ActionResponse> {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return makeResponse(false, "danger", "Unauthorized", "Log in first.");

  const cleanAmount = Math.floor(Number(amount));

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: sessionUser.id } });
    if (!user) return makeResponse(false, "danger", "Error", "User missing.");

    if (type === "dividend") {
      if (user.bankCash < 500) {
        return makeResponse(
          false,
          "warning",
          "Minimum Vault Balance",
          "Keep at least $500 in the Family Bank to collect syndicate interest."
        );
      }
      const interest = Math.max(15, Math.round(user.bankCash * 0.03));
      await tx.user.update({
        where: { id: user.id },
        data: { bankCash: { increment: interest } },
      });
      revalidatePath("/");
      return makeResponse(
        true,
        "success",
        `Syndicate Dividend Credited (+$${interest.toLocaleString()})`,
        `3% vault interest added directly to your Family Bank balance.`
      );
    }

    if (!Number.isFinite(cleanAmount) || cleanAmount <= 0) {
      return makeResponse(false, "warning", "Invalid Amount", "Enter a positive dollar amount.");
    }

    if (type === "deposit") {
      if (user.cash < cleanAmount) {
        return makeResponse(
          false,
          "danger",
          "Insufficient Street Cash",
          `You only have $${user.cash.toLocaleString()} in your pocket.`
        );
      }

      // 3% laundering fee
      const fee = Math.max(1, Math.round(cleanAmount * 0.03));
      const netDeposit = cleanAmount - fee;

      await tx.user.update({
        where: { id: user.id },
        data: {
          cash: { decrement: cleanAmount },
          bankCash: { increment: netDeposit },
        },
      });

      revalidatePath("/");
      return makeResponse(
        true,
        "success",
        `Deposited $${netDeposit.toLocaleString()}`,
        `Laundered $${cleanAmount.toLocaleString()} into the Family Vault ($${fee.toLocaleString()} 3% bookkeeper cut).`
      );
    } else {
      if (user.bankCash < cleanAmount) {
        return makeResponse(
          false,
          "danger",
          "Insufficient Bank Balance",
          `Your vault only holds $${user.bankCash.toLocaleString()}.`
        );
      }

      await tx.user.update({
        where: { id: user.id },
        data: {
          bankCash: { decrement: cleanAmount },
          cash: { increment: cleanAmount },
        },
      });

      revalidatePath("/");
      return makeResponse(
        true,
        "success",
        `Withdrew $${cleanAmount.toLocaleString()}`,
        `$${cleanAmount.toLocaleString()} moved from the Family Vault to your street pocket.`
      );
    }
  });
}

export async function healAtDoctorAction(): Promise<ActionResponse> {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return makeResponse(false, "danger", "Unauthorized", "Log in first.");

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: sessionUser.id } });
    if (!user) return makeResponse(false, "danger", "Error", "User missing.");

    if (user.health >= 100) {
      return makeResponse(false, "warning", "Full Health", "You are already at 100% health.");
    }

    const missing = 100 - user.health;
    const cost = missing * 15;
    if (user.cash < cost) {
      return makeResponse(
        false,
        "danger",
        "Insufficient Cash",
        `Back-alley surgeon demands $${cost.toLocaleString()} to stitch you up.`
      );
    }

    await tx.user.update({
      where: { id: user.id },
      data: {
        cash: { decrement: cost },
        health: 100,
      },
    });

    revalidatePath("/");
    return makeResponse(
      true,
      "success",
      "Stitched Up to 100% Health",
      `Paid the back-alley doctor $${cost.toLocaleString()}.`
    );
  });
}

export async function buyBulletsAction(packs: number): Promise<ActionResponse> {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return makeResponse(false, "danger", "Unauthorized", "Log in first.");

  const cleanPacks = Math.max(1, Math.min(50, Math.floor(Number(packs) || 1)));
  const bulletsAdded = cleanPacks * 25;
  const totalCost = cleanPacks * 300;

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: sessionUser.id } });
    if (!user) return makeResponse(false, "danger", "Error", "User missing.");

    if (user.cash < totalCost) {
      return makeResponse(
        false,
        "danger",
        "Insufficient Cash",
        `${bulletsAdded} rounds of .45 ACP costs $${totalCost.toLocaleString()}.`
      );
    }

    await tx.user.update({
      where: { id: user.id },
      data: {
        cash: { decrement: totalCost },
        bullets: { increment: bulletsAdded },
      },
    });

    revalidatePath("/");
    return makeResponse(
      true,
      "success",
      `Purchased ${bulletsAdded} Bullets`,
      `Paid the armorer $${totalCost.toLocaleString()} for ${bulletsAdded} rounds of .45 Thompson ammunition.`
    );
  });
}

/**
 * STAGE 5: UNDERGROUND CASINO (ROULETTE, DICE, BLACKJACK)
 */
const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

export type RouletteBetType =
  | "red"
  | "black"
  | "even"
  | "odd"
  | "dozen-1"
  | "dozen-2"
  | "dozen-3"
  | "number";

export async function playRouletteAction(
  betType: RouletteBetType,
  chosenNumber: number,
  wager: number
): Promise<ActionResponse> {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return makeResponse(false, "danger", "Unauthorized", "Log in first.");

  const cleanWager = Math.floor(Number(wager));
  if (!Number.isFinite(cleanWager) || cleanWager < 10) {
    return makeResponse(false, "warning", "Minimum Wager", "Minimum roulette wager is $10.");
  }

  const cleanNum = Math.max(0, Math.min(36, Math.floor(Number(chosenNumber) || 0)));
  const nowMs = Date.now();

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: sessionUser.id } });
    if (!user) return makeResponse(false, "danger", "Error", "User missing.");

    if (nowMs < user.jailUntil.getTime()) {
      return makeResponse(
        false,
        "danger",
        "Locked Up",
        "No roulette tables inside a precinct cell!"
      );
    }

    if (user.cash < cleanWager) {
      return makeResponse(
        false,
        "danger",
        "Insufficient Pocket Cash",
        `You only have $${user.cash.toLocaleString()} in your pocket.`
      );
    }

    const landed = Math.floor(Math.random() * 37); // 0..36
    const landedColor =
      landed === 0 ? "GREEN" : RED_NUMBERS.has(landed) ? "RED" : "BLACK";

    let multiplier = 0;
    if (betType === "red" && landedColor === "RED") multiplier = 2;
    else if (betType === "black" && landedColor === "BLACK") multiplier = 2;
    else if (betType === "even" && landed !== 0 && landed % 2 === 0) multiplier = 2;
    else if (betType === "odd" && landed % 2 === 1) multiplier = 2;
    else if (betType === "dozen-1" && landed >= 1 && landed <= 12) multiplier = 3;
    else if (betType === "dozen-2" && landed >= 13 && landed <= 24) multiplier = 3;
    else if (betType === "dozen-3" && landed >= 25 && landed <= 36) multiplier = 3;
    else if (betType === "number" && landed === cleanNum) multiplier = 36;

    const grossPayout = cleanWager * multiplier;
    const netDelta = grossPayout - cleanWager;

    await tx.user.update({
      where: { id: user.id },
      data: {
        cash: { increment: netDelta },
      },
    });

    if (netDelta >= 1500) {
      await tx.activityLog.create({
        data: {
          userId: user.id,
          actorName: user.username,
          category: "CASINO",
          headline: `${user.username} Hit Big on the ${user.city} Roulette Wheel!`,
          details: `Wheel landed on ${landed} (${landedColor}) — paid out $${grossPayout.toLocaleString()} (net +$${netDelta.toLocaleString()}).`,
          city: user.city,
        },
      });
    }

    revalidatePath("/");

    if (multiplier > 0) {
      return makeResponse(
        true,
        "success",
        `Wheel Landed on ${landed} (${landedColor}) — YOU WON $${grossPayout.toLocaleString()}!`,
        `Your $${cleanWager.toLocaleString()} wager hit (${multiplier}x payout, net profit +$${netDelta.toLocaleString()}).`
      );
    } else {
      return makeResponse(
        false,
        "warning",
        `Wheel Landed on ${landed} (${landedColor}) — House Takes $${cleanWager.toLocaleString()}`,
        `The croupier raked in your $${cleanWager.toLocaleString()} chips.`
      );
    }
  });
}

export async function playDiceAction(
  betChoice: "under7" | "seven" | "over7",
  wager: number
): Promise<ActionResponse> {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return makeResponse(false, "danger", "Unauthorized", "Log in first.");

  const cleanWager = Math.floor(Number(wager));
  if (!Number.isFinite(cleanWager) || cleanWager < 10) {
    return makeResponse(false, "warning", "Minimum Wager", "Minimum dice wager is $10.");
  }

  const nowMs = Date.now();

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: sessionUser.id } });
    if (!user) return makeResponse(false, "danger", "Error", "User missing.");

    if (nowMs < user.jailUntil.getTime()) {
      return makeResponse(false, "danger", "Behind Bars", "Wait until you are out of jail.");
    }

    if (user.cash < cleanWager) {
      return makeResponse(
        false,
        "danger",
        "Insufficient Pocket Cash",
        `You only carry $${user.cash.toLocaleString()}.`
      );
    }

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const total = d1 + d2;

    let multiplier = 0;
    if (betChoice === "under7" && total < 7) multiplier = 2.1;
    else if (betChoice === "seven" && total === 7) multiplier = 5.2;
    else if (betChoice === "over7" && total > 7) multiplier = 2.1;

    const grossPayout = Math.round(cleanWager * multiplier);
    const netDelta = grossPayout - cleanWager;

    await tx.user.update({
      where: { id: user.id },
      data: { cash: { increment: netDelta } },
    });

    if (netDelta >= 1500) {
      await tx.activityLog.create({
        data: {
          userId: user.id,
          actorName: user.username,
          category: "CASINO",
          headline: `${user.username} Rolled Hot Ivories (${d1} + ${d2} = ${total}) in ${user.city}`,
          details: `Collected $${grossPayout.toLocaleString()} at the backroom craps table.`,
          city: user.city,
        },
      });
    }

    revalidatePath("/");

    if (multiplier > 0) {
      return makeResponse(
        true,
        "success",
        `Dice Rolled [${d1}] + [${d2}] = ${total} — WON $${grossPayout.toLocaleString()}!`,
        `Net profit +$${netDelta.toLocaleString()} (${multiplier}x payout).`
      );
    }

    return makeResponse(
      false,
      "warning",
      `Dice Rolled [${d1}] + [${d2}] = ${total} — Lost $${cleanWager.toLocaleString()}`,
      `Your call missed the roll.`
    );
  });
}

export async function playBlackjackAction(wager: number): Promise<ActionResponse> {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return makeResponse(false, "danger", "Unauthorized", "Log in first.");

  const cleanWager = Math.floor(Number(wager));
  if (!Number.isFinite(cleanWager) || cleanWager < 25) {
    return makeResponse(
      false,
      "warning",
      "Minimum Table Bet",
      "High-Roller Blackjack minimum bet is $25."
    );
  }

  const nowMs = Date.now();

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: sessionUser.id } });
    if (!user) return makeResponse(false, "danger", "Error", "User missing.");

    if (nowMs < user.jailUntil.getTime()) {
      return makeResponse(false, "danger", "Behind Bars", "Wait until you are released.");
    }

    if (user.cash < cleanWager) {
      return makeResponse(
        false,
        "danger",
        "Insufficient Pocket Cash",
        `You only carry $${user.cash.toLocaleString()}.`
      );
    }

    const suits = ["♠", "♥", "♦", "♣"];
    const ranks = [
      { label: "A", val: 11 },
      { label: "2", val: 2 },
      { label: "3", val: 3 },
      { label: "4", val: 4 },
      { label: "5", val: 5 },
      { label: "6", val: 6 },
      { label: "7", val: 7 },
      { label: "8", val: 8 },
      { label: "9", val: 9 },
      { label: "10", val: 10 },
      { label: "J", val: 10 },
      { label: "Q", val: 10 },
      { label: "K", val: 10 },
    ];

    function drawCard() {
      const r = ranks[Math.floor(Math.random() * ranks.length)];
      const s = suits[Math.floor(Math.random() * suits.length)];
      return { text: `${r.label}${s}`, val: r.val, isAce: r.label === "A" };
    }

    function scoreHand(cards: { text: string; val: number; isAce: boolean }[]) {
      let sum = cards.reduce((a, c) => a + c.val, 0);
      let aces = cards.filter((c) => c.isAce).length;
      while (sum > 21 && aces > 0) {
        sum -= 10;
        aces--;
      }
      return sum;
    }

    const playerCards = [drawCard(), drawCard()];
    const dealerCards = [drawCard(), drawCard()];

    const playerNatural = scoreHand(playerCards) === 21;
    const dealerNatural = scoreHand(dealerCards) === 21;

    while (!playerNatural && !dealerNatural && scoreHand(playerCards) < 17) {
      playerCards.push(drawCard());
    }

    const pTotal = scoreHand(playerCards);
    if (pTotal <= 21 && !playerNatural) {
      while (scoreHand(dealerCards) < 17) {
        dealerCards.push(drawCard());
      }
    }
    const dTotal = scoreHand(dealerCards);

    const pHandStr = `${playerCards.map((c) => c.text).join(" ")} (${pTotal})`;
    const dHandStr = `${dealerCards.map((c) => c.text).join(" ")} (${dTotal})`;

    let multiplier = 0;
    let outcomeLabel = "";

    if (playerNatural && !dealerNatural) {
      multiplier = 2.5;
      outcomeLabel = "NATURAL BLACKJACK (2.5x)!";
    } else if (pTotal > 21) {
      multiplier = 0;
      outcomeLabel = "Player Busted Over 21";
    } else if (dTotal > 21) {
      multiplier = 2;
      outcomeLabel = "Dealer Busted — You Win!";
    } else if (pTotal > dTotal) {
      multiplier = 2;
      outcomeLabel = "Player Beats Dealer!";
    } else if (pTotal === dTotal) {
      multiplier = 1;
      outcomeLabel = "Push (Tie Hand)";
    } else {
      multiplier = 0;
      outcomeLabel = "Dealer Wins";
    }

    const grossPayout = Math.round(cleanWager * multiplier);
    const netDelta = grossPayout - cleanWager;

    if (netDelta !== 0) {
      await tx.user.update({
        where: { id: user.id },
        data: { cash: { increment: netDelta } },
      });
    }

    if (netDelta >= 1500) {
      await tx.activityLog.create({
        data: {
          userId: user.id,
          actorName: user.username,
          category: "CASINO",
          headline: `${user.username} Cleaned Out the Blackjack Shoe in ${user.city}`,
          details: `Dealt ${pHandStr} against Dealer's ${dHandStr} for a +$${netDelta.toLocaleString()} profit.`,
          city: user.city,
        },
      });
    }

    revalidatePath("/");

    return makeResponse(
      netDelta >= 0,
      netDelta > 0 ? "success" : netDelta === 0 ? "warning" : "danger",
      `${outcomeLabel} — You: ${pHandStr} vs Dealer: ${dHandStr}`,
      netDelta > 0
        ? `Collected $${grossPayout.toLocaleString()} (net profit +$${netDelta.toLocaleString()}).`
        : netDelta === 0
          ? `Your $${cleanWager.toLocaleString()} wager was returned.`
          : `Lost $${cleanWager.toLocaleString()} to the house shoe.`
    );
  });
}

/**
 * STAGE 5: MAFIA FAMILIES (CREATE, JOIN, LEAVE, CONTRIBUTE TREASURY)
 */
export async function createFamilyAction(
  name: string,
  tag: string,
  motto: string
): Promise<ActionResponse> {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return makeResponse(false, "danger", "Unauthorized", "Log in first.");

  const cleanName = String(name || "").trim();
  const cleanTag = String(tag || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  const cleanMotto =
    String(motto || "").trim() || "Blood, honor, and silence.";

  if (cleanName.length < 3 || cleanName.length > 28) {
    return makeResponse(
      false,
      "warning",
      "Invalid Family Name",
      "Family name must be between 3 and 28 characters."
    );
  }

  if (cleanTag.length < 2 || cleanTag.length > 5) {
    return makeResponse(
      false,
      "warning",
      "Invalid Tag",
      "Family tag must be 2 to 5 alphanumeric characters (e.g. CORL)."
    );
  }

  const charterCost = 2500;

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: sessionUser.id } });
    if (!user) return makeResponse(false, "danger", "Error", "User missing.");

    if (user.familyId) {
      return makeResponse(
        false,
        "warning",
        "Already in a Family",
        "Leave your current Family before founding a new syndicate."
      );
    }

    if (user.cash < charterCost) {
      return makeResponse(
        false,
        "danger",
        "Insufficient Charter Capital",
        `Founding a Commission-recognized Family requires $${charterCost.toLocaleString()} pocket cash.`
      );
    }

    const dup = await tx.family.findFirst({
      where: {
        OR: [{ name: cleanName }, { tag: cleanTag }],
      },
    });

    if (dup) {
      return makeResponse(
        false,
        "danger",
        "Name or Tag Taken",
        "Another Syndicate already operates under that name or tag."
      );
    }

    const family = await tx.family.create({
      data: {
        name: cleanName,
        tag: cleanTag,
        motto: cleanMotto,
        homeCity: user.city,
        treasuryCash: 1000, // $1,000 of the charter goes straight into the family vault
        founderName: user.username,
      },
    });

    await tx.user.update({
      where: { id: user.id },
      data: {
        cash: { decrement: charterCost },
        familyId: family.id,
        familyRole: "Don",
        familyContribution: 1000,
      },
    });

    await tx.activityLog.create({
      data: {
        userId: user.id,
        actorName: user.username,
        category: "FAMILY",
        headline: `Don ${user.username} Founded [${family.tag}] ${family.name} in ${user.city}!`,
        details: `"${family.motto}" — The Commission has recognized a new seat at the table.`,
        city: user.city,
      },
    });

    revalidatePath("/");
    return makeResponse(
      true,
      "success",
      `Founded [${family.tag}] ${family.name}!`,
      `You are now the Don of ${family.name} ($1,000 seeded into the Family Treasury).`
    );
  });
}

export async function joinFamilyAction(familyId: string): Promise<ActionResponse> {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return makeResponse(false, "danger", "Unauthorized", "Log in first.");

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: sessionUser.id } });
    const family = await tx.family.findUnique({ where: { id: familyId } });

    if (!user || !family) {
      return makeResponse(false, "danger", "Not Found", "Family not found.");
    }

    if (user.familyId) {
      return makeResponse(
        false,
        "warning",
        "Already Affiliated",
        "Step down from your current Family before swearing allegiance to another."
      );
    }

    await tx.user.update({
      where: { id: user.id },
      data: {
        familyId: family.id,
        familyRole: "Soldier",
        familyContribution: 0,
      },
    });

    await tx.activityLog.create({
      data: {
        userId: user.id,
        actorName: user.username,
        category: "FAMILY",
        headline: `${user.username} Swore Allegiance to [${family.tag}] ${family.name}`,
        details: `Inducted as a Soldier in the ${family.homeCity} syndicate.`,
        city: user.city,
      },
    });

    revalidatePath("/");
    return makeResponse(
      true,
      "success",
      `Joined [${family.tag}] ${family.name}`,
      `You are now a Soldier in ${family.name}. Contribute to the Family Treasury to rise through the family ranks!`
    );
  });
}

export async function leaveFamilyAction(): Promise<ActionResponse> {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return makeResponse(false, "danger", "Unauthorized", "Log in first.");

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: sessionUser.id },
      include: { family: true },
    });

    if (!user || !user.family) {
      return makeResponse(false, "warning", "No Family", "You are not part of a Family.");
    }

    const oldName = user.family.name;
    await tx.user.update({
      where: { id: user.id },
      data: {
        familyId: null,
        familyRole: "Soldier",
        familyContribution: 0,
      },
    });

    revalidatePath("/");
    return makeResponse(
      true,
      "warning",
      `Left ${oldName}`,
      "You are now operating as an independent earner."
    );
  });
}

export async function contributeFamilyTreasuryAction(amount: number): Promise<ActionResponse> {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return makeResponse(false, "danger", "Unauthorized", "Log in first.");

  const cleanAmount = Math.floor(Number(amount));
  if (!Number.isFinite(cleanAmount) || cleanAmount < 50) {
    return makeResponse(false, "warning", "Minimum Tribute", "Minimum tribute is $50.");
  }

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: sessionUser.id },
      include: { family: true },
    });

    if (!user || !user.family) {
      return makeResponse(
        false,
        "warning",
        "No Family",
        "Join or create a Family before contributing to a Treasury."
      );
    }

    if (user.cash < cleanAmount) {
      return makeResponse(
        false,
        "danger",
        "Insufficient Pocket Cash",
        `You only have $${user.cash.toLocaleString()} on hand.`
      );
    }

    const newContribution = user.familyContribution + cleanAmount;
    let newRole = user.familyRole;
    if (user.familyRole !== "Don") {
      if (newContribution >= 25000) newRole = "Underboss";
      else if (newContribution >= 10000) newRole = "Consigliere";
      else if (newContribution >= 2500) newRole = "Caporegime";
      else newRole = "Soldier";
    }

    const xpBonus = Number((cleanAmount / 250).toFixed(1));

    await tx.family.update({
      where: { id: user.family.id },
      data: {
        treasuryCash: { increment: cleanAmount },
      },
    });

    await tx.user.update({
      where: { id: user.id },
      data: {
        cash: { decrement: cleanAmount },
        familyContribution: newContribution,
        familyRole: newRole,
        rankPoints: Number((user.rankPoints + xpBonus).toFixed(2)),
      },
    });

    if (cleanAmount >= 1000) {
      await tx.activityLog.create({
        data: {
          userId: user.id,
          actorName: user.username,
          category: "FAMILY",
          headline: `${user.username} Paid $${cleanAmount.toLocaleString()} Tribute to [${user.family.tag}] ${user.family.name}`,
          details: `Family Treasury strengthened (${user.username} standing: ${newRole}).`,
          city: user.city,
        },
      });
    }

    revalidatePath("/");
    return makeResponse(
      true,
      "success",
      `Contributed $${cleanAmount.toLocaleString()} to [${user.family.tag}]`,
      `Family Treasury increased by $${cleanAmount.toLocaleString()}${xpBonus > 0 ? ` (+${xpBonus} Rank XP)` : ""}. Your Family role: ${newRole}.`
    );
  });
}


