export interface RankTier {
  index: number;
  name: string;
  minPoints: number;
  boozeCapacity: number;
  narcoticsCapacity: number;
}

// Classic 16-tier Omerta / Barafranca Hierarchy
export const RANKS: RankTier[] = [
  { index: 0, name: "Empty Suit", minPoints: 0, boozeCapacity: 15, narcoticsCapacity: 2 },
  { index: 1, name: "Delivery Boy", minPoints: 25, boozeCapacity: 25, narcoticsCapacity: 4 },
  { index: 2, name: "Picciotto", minPoints: 65, boozeCapacity: 40, narcoticsCapacity: 7 },
  { index: 3, name: "Shoplifter", minPoints: 130, boozeCapacity: 60, narcoticsCapacity: 10 },
  { index: 4, name: "Pickpocket", minPoints: 230, boozeCapacity: 85, narcoticsCapacity: 15 },
  { index: 5, name: "Thief", minPoints: 380, boozeCapacity: 120, narcoticsCapacity: 22 },
  { index: 6, name: "Associate", minPoints: 600, boozeCapacity: 165, narcoticsCapacity: 30 },
  { index: 7, name: "Mobster", minPoints: 920, boozeCapacity: 220, narcoticsCapacity: 40 },
  { index: 8, name: "Soldier", minPoints: 1380, boozeCapacity: 290, narcoticsCapacity: 55 },
  { index: 9, name: "Swindler", minPoints: 2000, boozeCapacity: 380, narcoticsCapacity: 75 },
  { index: 10, name: "Assassin", minPoints: 2850, boozeCapacity: 500, narcoticsCapacity: 100 },
  { index: 11, name: "Local Chief", minPoints: 4000, boozeCapacity: 650, narcoticsCapacity: 135 },
  { index: 12, name: "Chief", minPoints: 5600, boozeCapacity: 850, narcoticsCapacity: 180 },
  { index: 13, name: "Bruglione", minPoints: 7800, boozeCapacity: 1100, narcoticsCapacity: 240 },
  { index: 14, name: "Capodecina", minPoints: 10800, boozeCapacity: 1450, narcoticsCapacity: 320 },
  { index: 15, name: "Godfather", minPoints: 15000, boozeCapacity: 2000, narcoticsCapacity: 500 },
];

export function getRankInfo(rankPoints: number) {
  let current = RANKS[0];
  let next: RankTier | null = RANKS[1];

  for (let i = 0; i < RANKS.length; i++) {
    if (rankPoints >= RANKS[i].minPoints) {
      current = RANKS[i];
      next = RANKS[i + 1] ?? null;
    } else {
      break;
    }
  }

  let progressPercent = 100;
  if (next) {
    const span = next.minPoints - current.minPoints;
    const earned = rankPoints - current.minPoints;
    progressPercent = Math.min(99.9, Math.max(0, Number(((earned / span) * 100).toFixed(1))));
  }

  return {
    current,
    next,
    progressPercent,
  };
}

export interface CityInfo {
  name: string;
  nickname: string;
  ticketCost: number;
  travelCooldownSeconds: number;
  specialty: string;
}

export const CITIES: CityInfo[] = [
  {
    name: "New York",
    nickname: "The Five Families Port",
    ticketCost: 350,
    travelCooldownSeconds: 45,
    specialty: "Imported Scotch & Morphine Hub",
  },
  {
    name: "Chicago",
    nickname: "The Outfit Syndicate",
    ticketCost: 300,
    travelCooldownSeconds: 40,
    specialty: "Bootleg Whiskey & Speakeasies",
  },
  {
    name: "Detroit",
    nickname: "The Purple Gang Motor City",
    ticketCost: 275,
    travelCooldownSeconds: 35,
    specialty: "Canadian Rum Border & Luxury Cars",
  },
  {
    name: "Las Vegas",
    nickname: "The Desert Oasis",
    ticketCost: 450,
    travelCooldownSeconds: 55,
    specialty: "High-Roller Demand & Premium Payoffs",
  },
  {
    name: "Havana",
    nickname: "The Caribbean Drop",
    ticketCost: 550,
    travelCooldownSeconds: 65,
    specialty: "Cheap Rum & Raw Narcotics",
  },
  {
    name: "Palermo",
    nickname: "The Old Country",
    ticketCost: 700,
    travelCooldownSeconds: 80,
    specialty: "Sicilian Amaro & Pure Heroin",
  },
];

export interface SmugglingItemSpec {
  itemType: "booze" | "narcotics";
  itemName: string;
  minPrice: number;
  maxPrice: number;
}

export const SMUGGLING_ITEMS: SmugglingItemSpec[] = [
  { itemType: "booze", itemName: "Bootleg Gin", minPrice: 35, maxPrice: 140 },
  { itemType: "booze", itemName: "Canadian Rye", minPrice: 65, maxPrice: 240 },
  { itemType: "booze", itemName: "Havana Rum", minPrice: 80, maxPrice: 310 },
  { itemType: "booze", itemName: "Sicilian Grappa", minPrice: 110, maxPrice: 420 },
  { itemType: "narcotics", itemName: "Opium Bricks", minPrice: 420, maxPrice: 1550 },
  { itemType: "narcotics", itemName: "Morphine Vials", minPrice: 750, maxPrice: 2600 },
  { itemType: "narcotics", itemName: "Cocaine Crates", minPrice: 1300, maxPrice: 4400 },
  { itemType: "narcotics", itemName: "Pure Marseille Heroin", minPrice: 2100, maxPrice: 6800 },
];

export interface GtaOption {
  id: string;
  label: string;
  subtitle: string;
  baseSuccessRate: number;
  cooldownSeconds: number;
  jailSeconds: number;
  rankPointsReward: number;
  rankRequirement: number;
}

export const GTA_OPTIONS: GtaOption[] = [
  {
    id: "street-parked",
    label: "Hotwire Parked Sedan on Dark Side-Street",
    subtitle: "Low heat, common commuter cars, decent odds for beginners.",
    baseSuccessRate: 68,
    cooldownSeconds: 30,
    jailSeconds: 35,
    rankPointsReward: 8,
    rankRequirement: 0,
  },
  {
    id: "valet-heist",
    label: "Bribe Hotel Valet at Downtown Supper Club",
    subtitle: "Moderate heat, targets mid-tier coupes and town cars.",
    baseSuccessRate: 52,
    cooldownSeconds: 45,
    jailSeconds: 50,
    rankPointsReward: 16,
    rankRequirement: 2,
  },
  {
    id: "showroom-raid",
    label: "Smash & Grab Luxury Import Dealership",
    subtitle: "High heat, sirens likely, yields rare roadsters & armored limousines.",
    baseSuccessRate: 36,
    cooldownSeconds: 60,
    jailSeconds: 70,
    rankPointsReward: 30,
    rankRequirement: 5,
  },
];

export interface CarModelSpec {
  name: string;
  classTier: "Street" | "Executive" | "Exotic";
  baseValue: number;
  weight: number;
}

export const CAR_CATALOG: CarModelSpec[] = [
  { name: "1932 Ford Model B Tudor", classTier: "Street", baseValue: 950, weight: 40 },
  { name: "1934 Chevrolet Master Sedan", classTier: "Street", baseValue: 1350, weight: 35 },
  { name: "1936 Dodge Brothers Coupe", classTier: "Street", baseValue: 1750, weight: 25 },
  { name: "1937 Buick Century Special", classTier: "Executive", baseValue: 3200, weight: 35 },
  { name: "1938 Packard Eight Touring", classTier: "Executive", baseValue: 4800, weight: 25 },
  { name: "1939 Lincoln Zephyr V12", classTier: "Executive", baseValue: 6400, weight: 15 },
  { name: "1938 Cadillac V-16 Town Car", classTier: "Exotic", baseValue: 11500, weight: 12 },
  { name: "1937 Cord 812 Supercharged", classTier: "Exotic", baseValue: 16800, weight: 8 },
  { name: "1936 Duesenberg Model J Armored", classTier: "Exotic", baseValue: 26000, weight: 4 },
];

export const DEFAULT_CRIMES = [
  {
    id: "crime-1",
    tier: 1,
    name: "Shake Down Corner Newsstand",
    description: "Intimidate the local paperboy and cigar vendor for protection change.",
    baseCashMin: 45,
    baseCashMax: 120,
    baseSuccessRate: 85,
    rankRequirement: 0,
    cooldownSeconds: 12,
    rankPointsReward: 4.5,
    jailSeconds: 20,
  },
  {
    id: "crime-2",
    tier: 2,
    name: "Fleece Back-Alley Dice Game",
    description: "Slip loaded ivories into the dockworkers' craps circle.",
    baseCashMin: 120,
    baseCashMax: 310,
    baseSuccessRate: 74,
    rankRequirement: 1,
    cooldownSeconds: 18,
    rankPointsReward: 8.0,
    jailSeconds: 28,
  },
  {
    id: "crime-3",
    tier: 3,
    name: "Stick Up Butcher & Grocer Safe",
    description: "Force the neighborhood merchant to open the backroom strongbox.",
    baseCashMin: 280,
    baseCashMax: 680,
    baseSuccessRate: 64,
    rankRequirement: 2,
    cooldownSeconds: 25,
    rankPointsReward: 14.0,
    jailSeconds: 35,
  },
  {
    id: "crime-4",
    tier: 4,
    name: "Hijack Bonded Liquor Delivery Truck",
    description: "Intercept a customs-sealed flatbed before it reaches the warehouse.",
    baseCashMin: 650,
    baseCashMax: 1500,
    baseSuccessRate: 55,
    rankRequirement: 4,
    cooldownSeconds: 35,
    rankPointsReward: 24.0,
    jailSeconds: 45,
  },
  {
    id: "crime-5",
    tier: 5,
    name: "Blackmail City Alderman",
    description: "Deliver compromising photographs from the speakeasy VIP parlor.",
    baseCashMin: 1500,
    baseCashMax: 3400,
    baseSuccessRate: 46,
    rankRequirement: 6,
    cooldownSeconds: 45,
    rankPointsReward: 42.0,
    jailSeconds: 60,
  },
  {
    id: "crime-6",
    tier: 6,
    name: "Rob Armored Federal Payroll Van",
    description: "Blow the rear doors off the treasury courier with Thompson submachine guns.",
    baseCashMin: 3800,
    baseCashMax: 8500,
    baseSuccessRate: 36,
    rankRequirement: 9,
    cooldownSeconds: 60,
    rankPointsReward: 75.0,
    jailSeconds: 80,
  },
];

