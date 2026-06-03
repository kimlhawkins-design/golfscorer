# AGENTS.md

This document provides an overview of the project structure for developers and AI agents working on this codebase.

## Project Overview

A golf scoring app for tracking an 18-hole round stroke-by-stroke for up to 4 players. Built with TanStack Start and deployed on Netlify with Netlify Database (Postgres) for persistence.

## Key Directories

```
src/
  routes/
    index.tsx           # Home page: list rounds, create new round
    rounds.$roundId.tsx # Round view: scorecard + score entry panel
  server/
    golf.functions.ts   # TanStack Start server functions (all DB access)
db/
  schema.ts             # Drizzle ORM schema (rounds, players, scores)
  index.ts              # Drizzle client initialization
netlify/database/migrations/  # Auto-generated SQL migrations
drizzle.config.ts       # Drizzle Kit config
```

## Database Schema

- **rounds**: id, name, created_at
- **players**: id, round_id (FK), name, position (1–4)
- **scores**: id, round_id (FK), player_id (FK), hole_number (1–18), strokes

## Coding Conventions

- Server-side DB logic lives in `src/server/*.functions.ts` using `createServerFn`
- Use `.inputValidator()` (not `.validator()`) on server functions that accept input
- DB schema changes require running `npx drizzle-kit generate` to produce a migration file
- Migrations go to `netlify/database/migrations/` — Netlify applies them automatically on deploy
- Par values are hardcoded in the frontend as `PARS` array (standard par 72 course)
- All imports from `db/` use `.js` extension (ESM requirement)
- `router.invalidate()` re-runs loaders to refresh data after mutations

## Non-obvious Decisions

- `upsertScore` checks for an existing score by player+hole and updates in place to avoid duplicate rows (no unique constraint needed)
- The leaderboard sorts by "to par" differential, not raw strokes (standard golf convention)
- Par values are hardcoded as a standard par-72 layout; changing them requires editing the `PARS` array in the route files

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | TanStack Start |
| Frontend | React 19, TanStack Router v1 |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 |
| UI Components | Radix UI + custom components |
| Content | Content Collections (type-safe markdown) |
| AI | TanStack AI with multi-provider support |
| Language | TypeScript 5.7 (strict mode) |
| Deployment | Netlify |

## Directory Structure

```
├── public
│   ├── favicon.ico
│   ├── tanstack-circle-logo.png
│   └── tanstack-word-logo-white.svg  # TanStack wordmark logo (white) used in header/nav.
├── src
│   ├── components
│   │   ├── Header.tsx  # Header component.
│   │   └── HeaderNav.tsx  # Navigation sidebar template: mobile menu, Home link, add-on routes; EJS-driven for dynamic route generation.
│   ├── routes
│   │   ├── __root.tsx  # Root layout: Header, styles.
│   │   └── index.tsx  # Dashboard home: Bar, Line, Doughnut charts (revenue, users, sales).
│   ├── router.tsx  # TanStack Router setup: creates router from generated routeTree with scroll restoration.
│   └── styles.css  # Global styles: Tailwind import plus base body/code font styling.
├── .gitignore  # Template for .gitignore: node_modules, dist, .env, .netlify, .tanstack, etc.
├── AGENTS.md  # This document provides an overview of the project structure for developers and AI agents working on this codebase.
├── netlify.toml  # Netlify deployment config: build command (vite build), publish directory (dist/client), and dev server settings (port 8888, target 3000).
├── package.json  # Project manifest with TanStack Start, React 19, Vite 7, Tailwind CSS 4, and Netlify plugin dependencies; defines dev and build scripts.
├── pnpm-lock.yaml
├── tsconfig.json  # TypeScript config: ES2022 target, strict mode, @/* path alias for src/*, bundler module resolution.
└── vite.config.ts  # Vite config template: TanStack Start, React, Tailwind, Netlify plugin, and optional add-on integrations; processed by EJS.
```

## Key Concepts

### File-Based Routing (TanStack Router)

Routes are defined by files in `src/routes/`:

- `__root.tsx` - Root layout wrapping all pages
- `index.tsx` - Route for `/`
- `api.*.ts` - Server API endpoints (e.g., `api.resume-chat.ts` → `/api/resume-chat`)

### Component Architecture

**UI Primitives** (`src/components/ui/`):
- Radix UI-based, Tailwind-styled
- Card, Badge, Checkbox, Separator, HoverCard

**Feature Components** (`src/components/`):
- Header, HeaderNav, ResumeAssistant

## Configuration Files

| File | Purpose |
|------|---------|
| `vite.config.ts` | Vite plugins: TanStack Start, Netlify, Tailwind, Content Collections |
| `tsconfig.json` | TypeScript config with `@/*` path alias for `src/*` |
| `netlify.toml` | Build command, output directory, dev server settings |
| `content-collections.ts` | Zod schemas for jobs and education frontmatter |
| `styles.css` | Tailwind imports + CSS custom properties (oklch colors) |

## Development Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview production build
```

## Conventions

### Naming
- Components: PascalCase
- Utilities/hooks: camelCase
- Routes: kebab-case files

### Styling
- Tailwind CSS utility classes
- `cn()` helper for conditional class merging
- CSS variables for theme tokens in `styles.css`

### TypeScript
- Strict mode enabled
- Import paths use `@/` alias
- Zod for runtime validation
- Type-only imports with `type` keyword

### State Management
- React hooks for local state
- Zustand if you need it for global state
### Chart.js Dashboard

Analytics dashboard with Chart.js and react-chartjs-2.

**Dependencies:** chart.js, react-chartjs-2

**Chart types:**
- Bar - Revenue by month
- Line - User growth
- Doughnut - Sales by category

**Setup:** Register Chart.js components before use (CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler).

## Application Name

This starter uses "Application Name" as a placeholder throughout the UI and metadata. Replace it with the user's desired application name in the following locations:

### UI Components
- `src/components/Header.tsx` — app name displayed in the header
- `src/components/HeaderNav.tsx` — app name in the mobile navigation header

### SEO Metadata
- `src/routes/__root.tsx` — the `title` field in the `head()` configuration

Search for all occurrences of "Application Name" in the `src/` directory and replace with the user's application name.
