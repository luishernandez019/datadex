# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run start    # Run production server
```

No lint or test scripts are configured.

Environment variable: `NEXT_PUBLIC_SITE_URL` — used for canonical URLs, sitemap, and OG metadata.

## Architecture

**Stack:** Next.js 16 App Router · React 19 · TypeScript · Tailwind CSS v4 · TanStack React Query v5 · Zustand · Framer Motion · Axios

**Data source:** [PokéAPI](https://pokeapi.co/api/v2) — no backend, all data is fetched client-side or at build time.

### Routing

- `/` — Home page (client component): hero + `PokemonTable` with sorting/filtering/pagination
- `/pokemon/[id]` — Detail page: async **server component** handles metadata/JSON-LD/ISR (`revalidate: 86400`), delegates UI to `PokemonDetailClient` (client component)
- `robots.ts`, `sitemap.ts`, `manifest.ts` — auto-generated Next.js API routes

### Data flow

```
PokéAPI
  └─ src/lib/api.ts (axios, 15s timeout)
       └─ src/hooks/ (React Query hooks, staleTime 10min, GC 30min, 2 retries)
            └─ src/store/pokemonStore.ts (Zustand: pokemon cache + UI state)
                 └─ Components
```

Key hooks:
- `usePokemonList` — fetches all 1,302 Pokemon names/IDs, cached indefinitely
- `usePokemonDetail` — fetches a single Pokemon, writes into Zustand `pokemonCache`
- `useAllPokemonLoader` — background chunk loader (50 at a time) that activates only when sorting by stats; shows a live progress bar

### Global state (Zustand — `src/store/pokemonStore.ts`)

Holds: `pokemonCache`, `sortField`, `sortOrder`, `searchQuery`, `typeFilter`, `generationFilter`, `currentPage`, `language`, `loadAllStats`.

`language` (`'en' | 'es'`) is persisted to `localStorage`. Generation ranges (Gen I = 1–151, etc.) are defined in `src/lib/translations.ts`.

### Path alias

`@/*` maps to `./src/*` — use it for all imports.

### Styling

Tailwind CSS v4 with dark theme (slate-950 background). Type colors and stat colors are defined as constants in `src/types/pokemon.ts` (`TYPE_COLORS`, `STAT_COLORS`, `STAT_LABELS`) and used directly in components.

### Images

Next.js `<Image>` with AVIF/WebP formats. Remote pattern: `raw.githubusercontent.com/PokeAPI/sprites/**`. Sprite URLs are built by helpers in `src/lib/api.ts` (e.g. `getOfficialArtworkUrl`, `getShinyArtworkUrl`).
