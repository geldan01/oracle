# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## App Context

**Oracle** is a household command center and agent hub that consolidates everyday tracking tools into a single dashboard. The target users are members of a household who want a shared space to manage daily life — and a future control center for AI agents.

### Features

- **TV Show Tracker** — track shows the household is watching (status, progress, ratings)
- **Meal Planner & Recipes** — save liked meals, store recipes, and plan what to cook
- **Shared Todos** — collaborative to-do lists visible to all household members
- **Weather Forecast** — display forecasts for the home location and a few other saved cities
- **Household Projects** — track home improvement or other projects with status and notes
- **More to come** — the portal is designed to grow with additional household tools over time

### UX Approach

- The **main dashboard** serves as a hub, showing at-a-glance summaries/widgets for each tool
- Each tool has its own detail view where items can be added, removed, and modified
- Navigation should make it easy to jump between the dashboard and individual tool pages

## Commands

- `npm run dev` — start dev server (http://localhost:3000)
- `npm run build` — production build
- `npm run start` — serve production build
- `npm run lint` — run ESLint
- `npx prisma generate` — regenerate Prisma client after schema changes
- `npx prisma migrate dev` — create and apply a migration
- `npx prisma migrate deploy` — apply pending migrations (production)
- `docker compose up --build` — build and run app + PostgreSQL locally

## Architecture

- **Framework:** Next.js 16 with App Router, React 19, TypeScript (strict mode)
- **Styling:** Tailwind CSS v4 (via `@tailwindcss/postcss`)
- **Database:** PostgreSQL via Prisma ORM; schema in `prisma/schema.prisma`, client singleton in `src/lib/prisma.ts`
- **Deployment:** Docker (multi-stage, standalone output) for Coolify on Hostinger
- **Fonts:** Geist and Geist Mono loaded via `next/font/google`, exposed as CSS variables `--font-geist-sans` and `--font-geist-mono`
- **Import alias:** `@/*` maps to `./src/*`
- **Source layout:** All application code lives under `src/app/` using the App Router file conventions (`page.tsx`, `layout.tsx`, etc.)

## Testing

- Every new feature must include a Playwright end-to-end test covering the primary user flows
- Add unit tests for any non-trivial logic (utilities, data transformations, hooks, server actions, etc.)
- Tests should be written alongside the feature code, not deferred to a later step
