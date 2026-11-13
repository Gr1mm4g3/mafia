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

// STAGE 6: FRONT BUSINESSES (Passive Income & Money Laundering)
export interface FrontBusinessSpec {
  businessType: string;
  name: string;
  description: string;
  baseCost: number;
  baseHourlyYield: number;
  launderBonusPct: number;
}

export const FRONT_BUSINESS_CATALOG: FrontBusinessSpec[] = [
  {
    businessType: "LAUNDROMAT",
    name: "24-Hour Steam Laundromat",
    description: "Washes dirty street bills alongside neighborhood linen.",
    baseCost: 1200,
    baseHourlyYield: 320,
    launderBonusPct: 1,
  },
  {
    businessType: "SPEAKEASY",
    name: "Velvet Curtain Speakeasy & Jazz Club",
    description: "Backroom gin mill that funnels nightly cash straight into your Family Vault.",
    baseCost: 3400,
    baseHourlyYield: 950,
    launderBonusPct: 1,
  },
  {
    businessType: "AUTO_SHOP",
    name: "Red Hook Body & Chassis Works",
    description: "Re-stamps VIN plates and generates steady mechanical revenue.",
    baseCost: 7500,
    baseHourlyYield: 2200,
    launderBonusPct: 2,
  },
  {
    businessType: "IMPORT_DOCK",
    name: "Bonded Pier Import/Export Terminal",
    description: "Controls stevedore manifests and cleans high-volume syndicate capital.",
    baseCost: 16000,
    baseHourlyYield: 5200,
    launderBonusPct: 3,
  },
];

// STAGE 6: REAL ESTATE & SAFEHOUSES
export interface SafehouseSpec {
  tier: number;
  name: string;
  cost: number;
  boozeBonus: number;
  narcoticsBonus: number;
  stealthBonusPct: number;
  description: string;
}

export const SAFEHOUSE_CATALOG: SafehouseSpec[] = [
  {
    tier: 0,
    name: "Backroom Cot",
    cost: 0,
    boozeBonus: 0,
    narcoticsBonus: 0,
    stealthBonusPct: 0,
    description: "A folding mattress behind an Italian bakery.",
  },
  {
    tier: 1,
    name: "Cold-Water Tenement Flat",
    cost: 1500,
    boozeBonus: 20,
    narcoticsBonus: 5,
    stealthBonusPct: 4,
    description: "Hidden floorboard stash and fire-escape exit.",
  },
  {
    tier: 2,
    name: "Suburban Brick Safe House",
    cost: 4800,
    boozeBonus: 55,
    narcoticsBonus: 15,
    stealthBonusPct: 8,
    description: "Reinforced cellar for extra crates and quiet layovers.",
  },
  {
    tier: 3,
    name: "Fortified Brownstone Townhouse",
    cost: 12500,
    boozeBonus: 120,
    narcoticsBonus: 35,
    stealthBonusPct: 12,
    description: "Steel shutters, secret tunnel to the alley, and private vault.",
  },
  {
    tier: 4,
    name: "Gated Lakeside Compound",
    cost: 32000,
    boozeBonus: 260,
    narcoticsBonus: 80,
    stealthBonusPct: 18,
    description: "Floodlights, guard towers, and boathouse smuggling slip.",
  },
  {
    tier: 5,
    name: "Don's Palazzo Estate",
    cost: 75000,
    boozeBonus: 600,
    narcoticsBonus: 200,
    stealthBonusPct: 25,
    description: "Impenetrable syndicate fortress with underground wine & contraband catacombs.",
  },
];

// STAGE 6: GUN SHOP & ARMOR
export interface WeaponSpec {
  name: string;
  power: number;
  cost: number;
  description: string;
}

export const WEAPONS_CATALOG: WeaponSpec[] = [
  {
    name: "Snub-Nose .38 Detective Special",
    power: 15,
    cost: 850,
    description: "Concealable revolver for close-quarters street work.",
  },
  {
    name: "Winchester Trench Sawed-Off Shotgun",
    power: 32,
    cost: 2600,
    description: "Devastating scattergun for ambushes and warehouse raids.",
  },
  {
    name: "Thompson M1928 'Chicago Typewriter'",
    power: 60,
    cost: 7200,
    description: "50-round drum submachine gun — the signature voice of the Syndicate.",
  },
  {
    name: "Custom Springfield Scoped Sniper Rifle",
    power: 95,
    cost: 16500,
    description: "Precision long-range rifle for high-profile contract hits.",
  },
];

export interface ArmorSpec {
  name: string;
  defense: number;
  cost: number;
  description: string;
}

export const ARMOR_CATALOG: ArmorSpec[] = [
  {
    name: "Lined Wool Overcoat",
    defense: 12,
    cost: 900,
    description: "Heavy tailored wool with steel-mesh breastplate.",
  },
  {
    name: "Bootlegger Steel-Plate Vest",
    defense: 30,
    cost: 3400,
    description: "Concealed ballistic steel plates under a pinstripe suit.",
  },
  {
    name: "Syndicate Armored Escort Detail",
    defense: 55,
    cost: 9800,
    description: "Bulletproof glass sedan and full Kevlar body plating.",
  },
];

// STAGE 6: HORSE RACING DERBY
export interface DerbyHorse {
  id: number;
  name: string;
  winChance: number; // sums to 100
  multiplier: number;
  form: string;
}

export const DERBY_HORSES: DerbyHorse[] = [
  { id: 1, name: "Lucky Luciano's Pride", winChance: 38, multiplier: 2.3, form: "1-1-2" },
  { id: 2, name: "Midnight Bootlegger", winChance: 26, multiplier: 3.4, form: "2-1-3" },
  { id: 3, name: "Sicilian Thunder", winChance: 18, multiplier: 5.0, form: "3-2-1" },
  { id: 4, name: "copperhead Express", winChance: 11, multiplier: 8.0, form: "4-3-2" },
  { id: 5, name: "Dead Man's Hand", winChance: 7, multiplier: 12.5, form: "5-4-1" },
];

// STAGE 6: ORGANIZED CRIME (OC) MULTI-ROLE HEIST TEMPLATES
export interface OcTemplate {
  id: string;
  title: string;
  description: string;
  payoutMin: number;
  payoutMax: number;
  setupCost: number;
}

export const OC_HEIST_TEMPLATES: OcTemplate[] = [
  {
    id: "oc-train",
    title: "Hijack Federal Reserve Armored Train",
    description:
      "4-man coordinated strike: Mastermind, Weapons Expert, Demolitions Tech, and Getaway Driver.",
    payoutMin: 18000,
    payoutMax: 42000,
    setupCost: 1500,
  },
  {
    id: "oc-diamond",
    title: "Tunnel Into Manhattan Diamond Bourse",
    description:
      "Thermite through the reinforced vault floor while lookouts jam police radio bands.",
    payoutMin: 38000,
    payoutMax: 85000,
    setupCost: 3200,
  },
  {
    id: "oc-mint",
    title: "Raid the Treasury Bullion Depository",
    description:
      "The ultimate syndicate score — requires all 4 specialists in sync to crack the time-locks.",
    payoutMin: 75000,
    payoutMax: 165000,
    setupCost: 6000,
  },
];

// STAGE 6: INITIAL TERRITORY DISTRICTS FOR FAMILY WARS
export const INITIAL_DISTRICTS = [
  {
    city: "New York",
    name: "Manhattan Waterfront Docks",
    description: "Controls transatlantic cargo liners and customs stevedores.",
    tributePerClaim: 2400,
    defenseStrength: 100,
    defaultFamilyTag: "CORL",
  },
  {
    city: "Chicago",
    name: "South Side Union Stockyards",
    description: "Racketeering hub over meatpacking unions and rail depots.",
    tributePerClaim: 2100,
    defenseStrength: 100,
    defaultFamilyTag: "OUTF",
  },
  {
    city: "Detroit",
    name: "Riverfront Foundry & Ferry Crossing",
    description: "Prime Canadian whiskey pipeline across the Detroit River.",
    tributePerClaim: 1950,
    defenseStrength: 90,
    defaultFamilyTag: "OUTF",
  },
  {
    city: "Las Vegas",
    name: "Fremont High-Roller Strip",
    description: "Skims neon casino cages and desert resort wire rooms.",
    tributePerClaim: 2800,
    defenseStrength: 110,
    defaultFamilyTag: "CORL",
  },
  {
    city: "Havana",
    name: "Malecón Sugar & Rum Pier",
    description: "Export monopoly on Caribbean distilleries and pleasure yachts.",
    tributePerClaim: 2250,
    defenseStrength: 95,
    defaultFamilyTag: "CUBA",
  },
  {
    city: "Palermo",
    name: "Castellammare Old Port",
    description: "Ancestral Sicilian stronghold governing Mediterranean contraband.",
    tributePerClaim: 2650,
    defenseStrength: 115,
    defaultFamilyTag: "CUBA",
  },
];


