import { prisma } from "./db";
import { CITIES, DEFAULT_CRIMES, SMUGGLING_ITEMS } from "./game-config";

const SEED_FAMILIES = [
  {
    name: "Corleone Syndicate",
    tag: "CORL",
    motto: "Never let anyone outside the Family know what you are thinking.",
    homeCity: "New York",
    treasuryCash: 38500,
    founderName: "Vito_Castellano",
  },
  {
    name: "The Chicago Outfit",
    tag: "OUTF",
    motto: "You can get much farther with a kind word and a Tommy gun.",
    homeCity: "Chicago",
    treasuryCash: 29000,
    founderName: "Rocco_The_Butcher",
  },
  {
    name: "Caribbean Cartel",
    tag: "CUBA",
    motto: "Own the piers, own the republic.",
    homeCity: "Havana",
    treasuryCash: 21500,
    founderName: "Enzo_Di_aboli",
  },
];

const NPC_ROSTER = [
  {
    username: "Frankie_Five_Fingers",
    city: "New York",
    rankPoints: 180,
    cash: 1850,
    bankCash: 6400,
    crimesCommitted: 28,
    carsStolen: 6,
    bustsSucceeded: 4,
    familyTag: "CORL",
    familyRole: "Caporegime",
    jailReason: "Caught cracking a garment district furriers' vault",
  },
  {
    username: "Vito_Castellano",
    city: "Chicago",
    rankPoints: 620,
    cash: 4200,
    bankCash: 19500,
    crimesCommitted: 64,
    carsStolen: 14,
    bustsSucceeded: 11,
    familyTag: "CORL",
    familyRole: "Don",
    jailReason: "Arrested during a South Side speakeasy raid",
  },
  {
    username: "Lucky_Sal_Moretti",
    city: "Detroit",
    rankPoints: 95,
    cash: 920,
    bankCash: 3100,
    crimesCommitted: 15,
    carsStolen: 5,
    bustsSucceeded: 2,
    familyTag: "OUTF",
    familyRole: "Soldier",
    jailReason: "Picked up hotwiring a judge's Packard Touring",
  },
  {
    username: "Rocco_The_Butcher",
    city: "Las Vegas",
    rankPoints: 980,
    cash: 6800,
    bankCash: 32000,
    crimesCommitted: 89,
    carsStolen: 21,
    bustsSucceeded: 15,
    familyTag: "OUTF",
    familyRole: "Don",
    jailReason: "Detained by federal marshals at the Flamingo",
  },
  {
    username: "Enzo_Di_aboli",
    city: "Havana",
    rankPoints: 410,
    cash: 3100,
    bankCash: 14200,
    crimesCommitted: 42,
    carsStolen: 9,
    bustsSucceeded: 7,
    familyTag: "CUBA",
    familyRole: "Don",
    jailReason: "Intercepted unloading untaxed rum crates at the pier",
  },
];

let initialized = false;

export function computeDeterministicMarketPrice(
  cityName: string,
  itemName: string,
  minPrice: number,
  maxPrice: number,
  windowBucket: number
): number {
  const seedStr = `${cityName}:${itemName}:${windowBucket}`;
  let hash = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    hash ^= seedStr.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const normalized = (hash >>> 0) / 4294967295;

  let modifier = 1.0;
  if (cityName === "Havana" && itemName.includes("Rum")) modifier = 0.55;
  if (cityName === "Detroit" && itemName.includes("Rye")) modifier = 0.6;
  if (
    cityName === "Palermo" &&
    (itemName.includes("Grappa") || itemName.includes("Heroin"))
  ) {
    modifier = 0.62;
  }
  if (cityName === "Las Vegas") modifier = 1.25;
  if (cityName === "New York" && itemName.includes("Heroin")) modifier = 1.3;

  const rawPrice = minPrice + normalized * (maxPrice - minPrice);
  return Math.max(Math.round(minPrice * 0.5), Math.round(rawPrice * modifier));
}

export async function ensureWorldSeeded() {
  const now = new Date();
  const windowBucket = Math.floor(now.getTime() / (1000 * 60 * 5));

  if (!initialized) {
    // 1. Seed CrimeConfigs
    for (const crime of DEFAULT_CRIMES) {
      await prisma.crimeConfig.upsert({
        where: { id: crime.id },
        update: {
          tier: crime.tier,
          name: crime.name,
          description: crime.description,
          baseCashMin: crime.baseCashMin,
          baseCashMax: crime.baseCashMax,
          baseSuccessRate: crime.baseSuccessRate,
          rankRequirement: crime.rankRequirement,
          cooldownSeconds: crime.cooldownSeconds,
          rankPointsReward: crime.rankPointsReward,
          jailSeconds: crime.jailSeconds,
        },
        create: crime,
      });
    }

    // 2. Seed CityMarket items
    for (const city of CITIES) {
      for (const spec of SMUGGLING_ITEMS) {
        const price = computeDeterministicMarketPrice(
          city.name,
          spec.itemName,
          spec.minPrice,
          spec.maxPrice,
          windowBucket
        );
        await prisma.cityMarket.upsert({
          where: {
            city_itemName: {
              city: city.name,
              itemName: spec.itemName,
            },
          },
          update: {
            price,
            updatedAt: now,
          },
          create: {
            city: city.name,
            itemType: spec.itemType,
            itemName: spec.itemName,
            price,
            updatedAt: now,
          },
        });
      }
    }

    // 3. Seed Initial Syndicate Families
    for (const fam of SEED_FAMILIES) {
      await prisma.family.upsert({
        where: { tag: fam.tag },
        update: {},
        create: fam,
      });
    }

    // 4. Seed Initial Newspaper Logs if empty
    const logCount = await prisma.activityLog.count();
    if (logCount === 0) {
      await prisma.activityLog.createMany({
        data: [
          {
            actorName: "The Commission",
            category: "SYSTEM",
            headline: "Commission Opens the Books Across Six Cities",
            details:
              "Syndicate routes between New York, Chicago, Detroit, Las Vegas, Havana, and Palermo are now open for ambitious earners.",
            city: "New York",
          },
          {
            actorName: "Vito_Castellano",
            category: "CRIME",
            headline: "Armed Payroll Heist Echoes Through Downtown Chicago",
            details:
              "Witnesses report black sedans fleeing Michigan Avenue after a brazen daylight holdup.",
            city: "Chicago",
          },
          {
            actorName: "Enzo_Di_aboli",
            category: "SMUGGLING",
            headline: "Contraband Rum Shipment Slips Past Coast Guard",
            details:
              "Cases of Caribbean spirits fetched record prices in Las Vegas backrooms overnight.",
            city: "Havana",
          },
        ],
      });
    }

    initialized = true;
  }

  // Always ensure at least 3 NPCs are currently in jail so solo players can bust them out
  const jailedNpcs = await prisma.user.count({
    where: {
      isNpc: true,
      jailUntil: { gt: now },
    },
  });

  if (jailedNpcs < 3) {
    const families = await prisma.family.findMany();
    const famByTag = new Map(families.map((f) => [f.tag, f.id]));

    for (let i = 0; i < NPC_ROSTER.length; i++) {
      const npc = NPC_ROSTER[i];
      const shouldJail = i < 3;
      const jailDurationSec = 75 + i * 45;
      const jailUntil = shouldJail
        ? new Date(now.getTime() + jailDurationSec * 1000)
        : new Date(now.getTime() - 1000);
      const familyId = famByTag.get(npc.familyTag) ?? null;

      await prisma.user.upsert({
        where: { username: npc.username },
        update: shouldJail
          ? {
              jailUntil,
              jailReason: npc.jailReason,
              city: npc.city,
              familyId,
              familyRole: npc.familyRole,
            }
          : {
              familyId,
              familyRole: npc.familyRole,
            },
        create: {
          username: npc.username,
          passwordHash: "NPC_LOCKED_ACCOUNT",
          isNpc: true,
          cash: npc.cash,
          bankCash: npc.bankCash,
          health: 100,
          bullets: 50,
          rankPoints: npc.rankPoints,
          city: npc.city,
          crimesCommitted: npc.crimesCommitted,
          carsStolen: npc.carsStolen,
          bustsSucceeded: npc.bustsSucceeded,
          familyId,
          familyRole: npc.familyRole,
          jailUntil,
          jailReason: npc.jailReason,
        },
      });
    }
  }
}
