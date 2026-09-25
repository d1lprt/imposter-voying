# Infiltrator

A real-time multiplayer voting game for social-deduction party nights. Create a room, everyone piles in on their own phone or laptop, the host starts the vote, each player casts 2 votes (stackable), and results reveal live with a full "who voted for whom" breakdown.

Built with **React + Vite + Tailwind** on the frontend and **Supabase** (Postgres + Realtime + Anonymous Auth) as the entire backend — no custom server to run.

## How it works

- Every browser gets a real Supabase **anonymous auth session** the moment it loads. That auth id *is* the player's identity — it's what every security rule checks against, and it's what makes a page refresh reconnect you to your existing seat instead of creating a duplicate player.
- All game logic that needs to be trustworthy (creating a room, joining, starting a vote, submitting votes, tallying results) runs as **Postgres functions** on Supabase, not in the browser. The client never writes to `rooms`, `players`, or `votes` directly — Row Level Security blocks that. This is what stops someone from opening devtools and giving themselves 5 votes or reading everyone else's picks early.
- **Supabase Realtime** pushes every change (joins, leaves, status flips, vote submissions) to all connected players within the room, so a phone and a laptop in the same room stay in sync automatically. Nothing about the game state lives in `localStorage` — the only thing stored locally is your Supabase auth token (so refreshing doesn't log you out) and, for convenience, the last room code you were in.

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, paste in the contents of [`supabase/schema.sql`](./supabase/schema.sql) and run it. It creates the tables, locks them down with RLS, adds the game-logic functions, and turns on Realtime for the three tables. It's safe to re-run.
3. Go to **Authentication → Sign In / Providers** and enable **Anonymous Sign-Ins**. This is required — it's how players get an identity without a signup form.
4. Grab your project's URL and anon public key from **Project Settings → API**.

## 2. Run it locally

```bash
npm install
cp .env.example .env   # then fill in your Supabase URL + anon key
npm run dev
```

Open the printed URL, and to actually test multiplayer, open it again on your phone (same Wi-Fi, using your machine's local IP that Vite prints) or just open a second browser tab/profile — anonymous auth gives each one a distinct identity.

## 3. Deploy

Push this folder to a Git repo, then:

- **Vercel**: import the repo, framework preset "Vite", add the two `VITE_SUPABASE_*` env vars in project settings. `vercel.json` is already set up so client-side routing works on refresh.
- **Netlify**: import the repo (build command `npm run build`, publish dir `dist`), add the same env vars. `netlify.toml` is already set up for SPA redirects.

Either way, once deployed, a room created on one device is immediately joinable from any other device, anywhere — it's not tied to a local network.

## 4. Keep rooms tidy (optional but recommended)

`cleanup_expired_rooms()` (in the schema) deletes rooms older than 24 hours. Trigger it on a schedule with either:

- **pg_cron** (simplest): enable the `pg_cron` extension under Database → Extensions, then run the `cron.schedule(...)` line commented at the bottom of `schema.sql`.
- **A scheduled Edge Function or external cron** (e.g. GitHub Actions, cron-job.org) that calls `select cleanup_expired_rooms();` via the Supabase REST/RPC endpoint on an hourly timer.

## Project structure

```
supabase/schema.sql       tables, RLS policies, RPC functions, realtime setup
src/lib/                  Supabase client + tiny local-storage convenience helper
src/hooks/                useAuthSession, useRoom, usePlayers, useVotes, usePresence
src/pages/                Home, CreateRoom, JoinRoom, Room (status router)
src/components/           Lobby, VotingScreen, ResultsScreen, and their pieces
```

## Game rules encoded server-side

- Rooms need 4–20 players; voting can't start until the room is completely full.
- Every player gets exactly 2 votes, which can go to the same person or be split — enforced by a unique `(room_id, voter_id, vote_number)` constraint plus checks in `submit_votes()`.
- Self-votes are rejected server-side, not just hidden in the UI.
- Vote targets are invisible to everyone (RLS-enforced) until the room's status flips to `RESULTS`, which happens automatically the instant the last player submits.
- A tie for the top spot shows a **Start Tiebreaker** option (host-only) that clears votes and jumps straight back into voting without returning to the lobby; a clean win shows **Play Again**, which resets and returns to the lobby instead.
