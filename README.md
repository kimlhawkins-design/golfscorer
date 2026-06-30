# Golf Scorecard

A full-featured golf scoring app for tracking a round hole-by-hole for up to 4 players.

## Features

- Create rounds with 2–4 named players
- 18-hole scorecard with standard par values (par 72)
- Stroke entry with +/− buttons and named score labels (Eagle, Birdie, Par, Bogey, Double)
- Live leaderboard sorted by score to par
- Color-coded scorecard (gold = eagle, green = birdie, orange = bogey, red = double bogey+)
- Front nine / back nine subtotals and total score
- Persistent storage via Netlify Database (Postgres)

## Tech Stack

- **Framework**: TanStack Start (React + Vite)
- **Styling**: Tailwind CSS v4
- **Database**: Netlify Database (Postgres) via Drizzle ORM
- **Deployment**: Netlify

## Running Locally

```bash
npm install
netlify dev
```

The app runs at http://localhost:8888. Netlify CLI provides local emulation of Netlify Database.


## Deployment

Netlify builds this app with `npm run build` and publishes `dist/client`. The project pins Node 22 in `netlify.toml` so Vite and TanStack Start use a current runtime on deploy.

Useful commands:

```bash
npm install
npm run build
npm run preview
```

For local Netlify Database emulation, use:

```bash
netlify dev
```
