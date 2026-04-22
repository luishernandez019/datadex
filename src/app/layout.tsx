import type { Metadata, Viewport } from 'next'
import './globals.css'
import QueryProvider from '@/providers/QueryProvider'
import Navbar from '@/components/Navbar'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Datadex — All 1,302 Pokémon',
    template: '%s | Datadex',
  },
  description: 'Explore all 1,302 Pokémon with stats, abilities, moves and evolution chains. Filter by type and generation, sort by any stat.',
  keywords: ['datadex', 'pokédex', 'pokedex', 'pokemon', 'pokemon stats', 'pokemon abilities', 'pokemon moves', 'pokemon evolution', 'national pokedex', 'all pokemon'],
  authors: [{ name: 'Datadex' }],
  creator: 'Datadex',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['es_ES'],
    siteName: 'Datadex',
    title: 'Datadex — All 1,302 Pokémon',
    description: 'Explore all 1,302 Pokémon with stats, abilities, moves and evolution chains. Filter by type, sort by any stat.',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Datadex — All 1,302 Pokémon',
    description: 'Explore all 1,302 Pokémon with stats, abilities, moves and evolution chains.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>",
  },
  manifest: '/manifest.webmanifest',
}

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://pokeapi.co" />
        <link rel="preconnect" href="https://raw.githubusercontent.com" />
        <link rel="dns-prefetch" href="https://pokeapi.co" />
        <link rel="dns-prefetch" href="https://raw.githubusercontent.com" />
      </head>
      <body className="min-h-full flex flex-col bg-slate-950 text-white">
        <QueryProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="text-center py-4 text-slate-600 text-xs border-t border-slate-800">
            Data from{' '}
            <a
              href="https://pokeapi.co"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition-colors"
            >
              PokéAPI
            </a>
          </footer>
        </QueryProvider>
      </body>
    </html>
  )
}
