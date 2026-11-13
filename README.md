# Omerta: The Syndicate (1930s Text-Based Mafia Browser RPG)

A minimalist, server-authoritative 1930s Mafia browser game inspired by classic *Omerta / Barafranca*. Built with **Next.js 16 (App Router + Cache Components + Server Actions)**, **TypeScript**, **Tailwind CSS**, and **SQLite + Prisma ORM**.

---

## Core Features

### 1. Server-Authoritative Anti-Cheat & Concurrency Safety
- **Zero Client Trust**: Every RNG roll, cooldown check (`nextCrimeAt`, `nextGtaAt`, `jailUntil`, `travelUntil`), casino wager, and market quote is evaluated strictly inside Next.js Server Actions.
- **The Anti-Tamper Timer Trap**: Submitting a Crime or GTA request before the server timestamp expires (or while locked in jail) triggers an immediate server-side sting operation — throwing the player straight into Precinct Jail (or extending their sentence) and publishing an `ANTI_CHEAT` dispatch in *The Syndicate Gazette*.
- **Atomic Database Transactions**: All cash transfers, smuggling trades, casino bets, family treasury contributions, and stat mutations execute inside `prisma.$transaction(...)`.

### 2. 16-Tier Mafia Hierarchy
Climb from **Empty Suit** (#1) to **Godfather** (#16). Each rank unlocks heavier street heists, higher GTA and Jail Bust odds, and expanded **Booze & Narcotics** smuggling cargo capacity.

### 3. Rackets, GTA, Chop-Shop Garage & Precinct Jail
- **Street Crimes**: 6 tiers of timed capers ranging from shaking down newsstands to robbing armored federal payroll vans.
- **Grand Theft Auto (GTA) & Garage**: Boost pre-war classics (*1932 Ford Model B*, *1938 Packard Eight*, *1936 Duesenberg Model J Armored*), repair body damage, or ship stolen cars out-of-state for a `+25%` fencing bonus.
- **Precinct Jail & Busting**: Bust incarcerated players and simulated NPC associates out of lockup for Rank XP and tribute cash—or risk landing in an adjacent cell on a botched bust.

### 4. Contraband Smuggling & Six-City Transit
Travel across **New York**, **Chicago**, **Detroit**, **Las Vegas**, **Havana**, and **Palermo**. Spot cross-city price spreads on 8 Booze & Narcotics commodities and run arbitrage loops within your rank's cargo capacity.

### 5. Underground Casino, Mafia Families & Leaderboards
- **Underground Casino**: Wager pocket cash on **European Roulette** (Red/Black, Odd/Even, Dozens, Straight-Up 36x), **2d6 Craps / Seven Dice**, and **High-Roller Blackjack 21**.
- **Mafia Families**: Found your own Syndicate (`[TAG]`, Motto, Home City, Family Treasury) as Don, or join an existing Family and contribute to its war chest.
- **Hall of Infamy Leaderboards**: Live rankings for both **Top Mobsters** (by Rank XP, Net Worth, Crimes, GTA, and Busts) and **Top Mafia Families** (by Combined Syndicate Wealth, Total XP, and Treasury).

---

## Getting Started

1. **Install dependencies & push SQLite schema**:
   ```bash
   pnpm install
   pnpm run db:push
   ```

2. **Start the development server**:
   ```bash
   pnpm dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser. Use **Instant Mobster** for a 1-click start or register a custom handle.
