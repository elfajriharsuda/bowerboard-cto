# Site Directory – Next.js + Prisma Bootstrap

This repository is a bootstrap of a TypeScript Next.js App Router project for a bookmark directory. It includes Tailwind CSS, Prisma ORM, and common libraries to build forms and data fetching.

## Tech stack

- Next.js 14 (App Router, TypeScript)
- Tailwind CSS (via PostCSS, Autoprefixer)
- Prisma ORM (+ PostgreSQL)
- React Hook Form + Zod (forms and validation)
- React Query (data fetching/caching)
- Open Graph scraping (for fetching page metadata)

## Getting started

1. Install dependencies

   npm install

2. Create your environment file

   cp .env.example .env

   Then edit .env to set your `DATABASE_URL` and any metadata fetch config.

3. Initialize Prisma Client and database

   # Generate Prisma Client
   npm run prisma:generate

   # Push schema to your database (creates tables)
   npm run prisma:push

   # Optional: open Prisma Studio
   npm run prisma:studio

4. Run the dev server

   npm run dev

   Open http://localhost:3000 to view the app.

## Project layout

- app/
  - page.tsx – Home (browse sites)
  - add/page.tsx – Add Site (placeholder form)
  - api/
    - sites/route.ts – Example API endpoint for listing/paginating sites (currently uses static data)
    - metadata/route.ts – Fetches Open Graph metadata for a provided URL
- components/ – Reusable UI components
- lib/
  - env.ts – Centralized environment management
  - prisma.ts – Prisma client singleton
  - sites.ts – Helpers for static demo data
- prisma/
  - schema.prisma – Prisma schema (Site, Category, Tag models)

## Tailwind CSS

Tailwind is configured with `tailwind.config.ts` and `postcss.config.js`. Global directives are added to `app/globals.css`. Use utility classes as needed alongside the existing minimal CSS.

## Linting & formatting

- Format with Prettier:

  npm run format

- Check formatting:

  npm run format:check

- Lint (Next.js ESLint integration):

  npm run lint

Note: You may be prompted to install ESLint or related plugins on first run.

## Environment

The following environment variables are supported (see `.env.example`):

- `DATABASE_URL` – PostgreSQL connection string for Prisma
- `METADATA_TIMEOUT_MS` – Timeout (ms) for fetching metadata via `/api/metadata`
- `METADATA_USER_AGENT` – Custom user-agent used when fetching metadata

## Prisma notes

- The Prisma client is provided via a singleton (`lib/prisma.ts`) to avoid multiple instances during development hot reloads.
- The initial UI uses static data for browsing (see `data/` + `lib/sites.ts`). You can migrate to Prisma-backed queries by replacing those reads with `prisma.site.findMany` etc.

## Scripts

- `dev` – Start Next.js in development
- `build` – Build for production
- `start` – Start production server
- `prisma:generate` – Generate Prisma Client
- `prisma:push` – Push the Prisma schema to the database
- `prisma:studio` – Open Prisma Studio
- `format` – Format code with Prettier
- `format:check` – Check formatting with Prettier
- `lint` – Run Next.js ESLint

## License

MIT
