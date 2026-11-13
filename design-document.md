Design Document: Text-Based Mafia Browser Game (Omerta / Barafranca Style)

Target Environment: Next.js (App Router), TypeScript, Tailwind CSS, SQLite (via Prisma or Drizzle ORM)
1. Project Overview & Architecture
Core Concept

A minimalist, text-driven multiplayer (or single-player with simulated actors) crime browser game. Players manage independent timers across various criminal activities, steal cars, smuggle goods between cities, land in jail on failures, and rank up through a 16-tier hierarchy.
Recommended Tech Stack

    Framework: Next.js (App Router) using Server Actions for all game state mutations (ensures zero server leakage of game logic).

    Styling: Tailwind CSS with a dark mode theme (#121212 / #1e1e1e, high-contrast text, retro terminal or sleek dark layout).

    Database & ORM: SQLite + Prisma (or Drizzle) for atomic database transactions.

    State & UI Sync: Server components for initial page loads, client-side interval timers (setInterval) strictly for visual countdown UX, and Server Actions for button clicks.

2. Anti-Cheat & Game Design Rules (Crucial Instructions for the AI)

    Server-Side Authority: All timestamps (nextCrimeAt, jailUntil, etc.), success percentages, and RNG rolls must be calculated and enforced on the server. Never trust the client.

    The Anti-Tamper Timer Trap: If a client submits a request to an action endpoint before Date.now() < user.nextCrimeAt, do not just return an error. Punish the player by extending their timer or throwing them straight into jail for "sloppy work."

    Concurrency Safety: Wrap all inventory changes, cash deductions, and stat updates inside database transactions to prevent race conditions during rapid clicks.

3. Phased Development Roadmap
Stage 1: Foundation, Auth, and Database Schema

    Objective: Establish the data models, layout scaffolding, and user account creation.

    Database Models to Build:

        User: id, username, passwordHash, cash (BigInt/Float), bankCash, health (0-100), bullets, rankPoints (float representing percentage or raw XP), city (string), nextCrimeAt (DateTime), nextGtaAt (DateTime), jailUntil (DateTime), travelUntil (DateTime), familyId (nullable foreign key), familyRole (Don, Underboss, Consigliere, Caporegime, Soldier).

        Family: id, name, tag (3-5 chars), motto, homeCity, treasuryCash, founderId, createdAt, members (relation to User).

        CrimeConfig: Defines static tiers of crimes (name, base cash reward, base success rate, rank requirement, cooldown seconds).

        CityMarket: Tracks fluctuating prices for booze/narcotics per city.

    UI Layout:

        Classic 3-section layout: Top status bar (Cash, Health, Bullets, City, Rank progress), fixed left navigation sidebar, and a central action viewport.

Stage 2: The Core Solo Loop (Crimes & GTA)

    Objective: Implement the primary timer-driven gameplay loops.

    Features to Build:

        Crimes Page: List available crimes. Clicking one triggers a Server Action checking nextCrimeAt.

            Logic: Roll random number against success rate. On success: award cash and rank points, update nextCrimeAt. On critical failure: assign jailUntil = now + X seconds.

        GTA (Steal a Car) Page: Similar timer loop (nextGtaAt). Success adds a vehicle record to a Garage table with a random damage percentage (0-100%).

        Visual Timers: Client-side countdown timers that sync with server timestamps and re-enable buttons when zero is reached.

Stage 3: Jail, Smuggling, and Travel

    Objective: Add social friction and economic arbitrage.

    Features to Build:

        Jail & Busting System: A page listing all users where jailUntil > now. Players not in jail can click "Bust" to free an inmate. Success gives rank points; failure lands the rescuer in jail too.

        City Travel & Smuggling:

            A travel interface allowing users to move between cities (e.g., New York, Chicago, Detroit) incurring a travelUntil cooldown and a ticket fee.

            A smuggling marketplace where item prices vary by city, allowing low-buy / high-sell loops constrained by the player's current rank cargo capacity.

Stage 4: Economy Sinks, Banking, and Final Polish

    Objective: Balance the economy and polish the retro aesthetic.

    Features to Build:

        Bank: Secure cash from muggings by depositing it into a bank account (with a small interest rate or withdrawal fee).

        Garage Actions: Interface to repair, sell, or ship stored stolen cars for profit.

        Polishing & Logs: An activity log or "newspaper" showing recent jail busts, successful crimes, and system updates.

Stage 5: Underground Casino, Mafia Families, and Leaderboards

    Objective: Expand high-stakes economy sinks, syndicate social organization, and competitive rankings.

    Features to Build:

        Underground Casino: Server-authoritative parlor games where players wager pocket cash inside atomic database transactions:
            - Roulette Wheel: Bet on Red (2x), Black (2x), Odd/Even (2x), Dozens (3x), or Single Number (36x, 0-36).
            - Back-Alley Dice (High/Low & Exact Seven): Roll 2d6 — Under 7 (2.1x), Over 7 (2.1x), or Lucky Seven (5.2x).
            - High-Roller Blackjack (21): Instant server-dealt hand against the House Dealer with 2x standard win and 2.5x natural Blackjack payout.

        Mafia Families (Syndicates):
            - Create a Family: Players with sufficient cash ($2,500 charter fee) and standing can found a new Family with a custom Name, [TAG], Home City, and Motto, becoming its Don.
            - Join / Leave a Family: Unaffiliated players can browse active Families and swear allegiance to join, or step down to go independent.
            - Family Treasury & Tribute: Members can donate street cash into the Family Treasury to grow the syndicate's power and prestige.

        Hall of Infamy (Player & Family Leaderboards):
            - Player Leaderboard: Ranks top mobsters by Rank XP / Hierarchy Tier, Net Worth (Pocket Cash + Bank Vault), Crimes Committed, Cars Boosted, and Jail Busts.
            - Family Leaderboard: Ranks Mafia Families by Total Syndicate Net Worth (Treasury + Combined Member Wealth), Total Family Rank XP, and Member Count.

Stage 6: Additional Features

Master List of Additional Features
1. The Social & Faction Layer (Mafia Families)

    Family Creation & Hierarchy: Allow high-rank players to pool money to found a Family, complete with custom tags (e.g., [CORLEONE]) and roles (Don, Consigliere, Capo, Soldier).

    Shared Family Vault: A centralized bank vault where members deposit a percentage of their cash to fund wars, buy assets, or bail members out.

    Family Protection & Deterrence: Independent players risk severe retaliation if they attack a family member, as the whole crew gets automated alerts.

    Family Wars & Territory: Full-scale syndicate warfare where families fight for control of specific city districts or smuggling routes.

2. Economy Sinks & Money Laundering

    Front Businesses (Passive Income): Buy laundromats, auto-shops, or import/export docks that generate hourly income and help convert "dirty" crime cash into clean bank funds.

    Real Estate & Safehouses: Properties that increase your storage caps (like holding more drugs or bullets) or lower your visibility to police.

    Player-Owned Casinos: Buy and run interactive high-roller spots (Blackjack, Roulette, Horse Racing) where other players gamble, and you set the house edge to rake in profits.

3. Combat, Arms, and Assassinations

    The Gun Shop & Bullet Factories: A marketplace for heavy weapons (Tommy guns, sniper rifles) and limited-supply ammunition. Bullets are a primary consumable currency.

    NPC & Player Bodyguards: Hire muscle to absorb incoming assassination hits before your health takes damage.

    The Hitlist & Bounties: Put a price on a rival's head. Any player on the server can hunt them down to claim the bounty cash.

    Detectives & Recon: Pay private investigators to track a target's location across different cities before launching a hit.

Extra "Deep-Cut" Features for Maximum Nostalgia

If you want to lean even further into what made games like Omerta and Bootleggers unforgettable, these three systems add incredible flavor:
A. The Last Will & Testament

Because permanent death (permadeath) was a real threat, players spent time writing a Will in their settings. If your character got assassinated, your specified heir (a friend or alt account) automatically inherited a percentage of your cash, cars, and property instead of it vanishing into the ether. It added a layer of legal/familial drama.
B. The In-Game Newspaper / Tabloid

An automated feed or player-run paper that broadcasts server events. It publishes:

    Obituaries: "Don Corleone was whacked in Chicago by rival hitmen using a Thompson submachine gun."

    Jail Breaks: "Player X successfully busted 10 inmates out of the downtown lockup today."

    Heist Records: "A massive Organized Crime ring pulled off a $50,000,000 Federal Reserve heist."
    It gives players a massive dopamine hit to see their names in print.

C. Organized Crime (OC) Multi-Player Heists

Solo crimes stop being viable around mid-game. To pull off massive scores (like robbing a federal mint or hijacking an armored train), you have to form an ad-hoc crew of 4 to 8 players, assigning specific roles:

    1 Mastermind / Leader

    1 Weapons Expert

    1 Demolitions Tech

    1–5 Drivers
    If even one crew member is late or messes up their timer, the whole heist fails, and everyone goes to jail. It creates fantastic social coordination (and betrayal).