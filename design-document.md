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

        User: id, username, passwordHash, cash (BigInt/Float), bankCash, health (0-100), bullets, rankPoints (float representing percentage or raw XP), city (string), nextCrimeAt (DateTime), nextGtaAt (DateTime), jailUntil (DateTime), travelUntil (DateTime).

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