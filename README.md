# Datadex

A fast, fully-featured Pokédex built with Next.js. Browse all 1,302 Pokémon across 9 generations, sort by any stat, filter by type or generation, and explore detailed profiles with stats, abilities, moves, and evolution chains — in English or Spanish.

---

## Features

### Pokédex Table
- **Sortable columns** — click any column header (name, number, type, HP, ATK, DEF, SP.ATK, SP.DEF, SPD, Total) to sort ascending or descending
- **Full-dataset stat sorting** — sorting by a stat triggers a background loader that fetches all 1,302 Pokémon progressively, with a live progress bar while it loads
- **Search** — filter by Pokémon name or Pokédex number in real time
- **Type filter** — narrow the list to a single type via dropdown
- **Generation filter** — pills in the navbar instantly filter by generation (Gen I – Gen IX)
- **Pagination** — browse results page by page

### Pokémon Detail Page
- **Official artwork** with a toggle to switch between normal and shiny variants
- **Base stats** displayed as animated bars and circular rings
- **Type-colored UI** — the hero section adapts its gradient and accent color to the Pokémon's primary type
- **Abilities tab** — lists all abilities with their localized name, hidden-ability badge, and full description
- **Moves tab** — shows all level-up moves sorted by level, plus a search box to find any move across the full learnset
- **Evolution chain** — visual chain with sprites and evolution triggers
- **Species info** — height, weight, base XP, generation, habitat, catch rate, genus, and flavor text
- **Legendary / Mythical / Baby** badges when applicable
- **Prev / Next navigation** between consecutive Pokémon

### Internationalization
- **English / Spanish toggle** in the navbar, persisted to `localStorage`
- Translates UI labels, type names, ability names, ability descriptions, and move names
- Flavor text and genus pulled from the API in the selected language when available

### SEO & Performance
- Dynamic `<title>` and Open Graph / Twitter Card metadata per Pokémon page
- JSON-LD structured data (BreadcrumbList + WebPage entity) on every detail page
- `sitemap.xml` covering all 1,303 pages; `robots.txt` auto-generated
- Web App Manifest for PWA installability
- AVIF / WebP image conversion via Next.js Image Optimization
- `preconnect` and `dns-prefetch` hints for PokéAPI domains
- Long-lived cache headers for static assets; 24 h ISR for Pokémon pages

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Animations | Framer Motion |
| Data fetching | TanStack React Query 5 + Axios |
| Global state | Zustand 5 |
| Data source | [PokéAPI](https://pokeapi.co) |

---

## Data Source

All Pokémon data — names, stats, abilities, moves, evolution chains, species descriptions, flavor texts, and artwork — is sourced from **[PokéAPI](https://pokeapi.co)**, a free and open REST API for Pokémon data. No data is stored locally; everything is fetched on demand and cached client-side via React Query.

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm, yarn, or pnpm

### Install & run

```bash
# 1. Clone the repository
git clone https://github.com/your-username/datadex.git
cd datadex

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for production

```bash
npm run build
npm start
```

### Environment variables

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical base URL used for sitemap, OG tags, and JSON-LD | `http://localhost:3000` |

Create a `.env.local` file at the project root:

```env
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx               # Root layout, global metadata
│   ├── page.tsx                 # Home — hero + Pokédex table
│   ├── robots.ts                # Auto-generated robots.txt
│   ├── sitemap.ts               # Auto-generated sitemap.xml
│   ├── manifest.ts              # Web App Manifest
│   └── pokemon/[id]/
│       ├── page.tsx             # Server component — metadata + JSON-LD
│       └── PokemonDetailClient.tsx  # Client component — full detail UI
├── components/                  # Shared UI components
├── hooks/                       # React Query data hooks
├── lib/                         # API client, translations, helpers
├── store/                       # Zustand global store
└── types/                       # TypeScript interfaces
```

---

> Pokémon and all related names are trademarks of Nintendo / Game Freak. This project is fan-made and not affiliated with or endorsed by Nintendo, Game Freak, or The Pokémon Company.
