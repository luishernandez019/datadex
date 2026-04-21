import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Datadex',
    short_name: 'Datadex',
    description: 'Explore all 1,302 Pokémon with stats, abilities, moves and evolution chains.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#ef4444',
    orientation: 'portrait-primary',
    categories: ['games', 'entertainment', 'reference'],
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}
