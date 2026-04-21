import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export default function sitemap(): MetadataRoute.Sitemap {
  const pokemonEntries: MetadataRoute.Sitemap = Array.from({ length: 1302 }, (_, i) => ({
    url: `${SITE_URL}/pokemon/${i + 1}`,
    changeFrequency: 'monthly',
    priority: i < 151 ? 0.9 : 0.8, // Gen 1 gets slight boost (most searched)
  }))

  return [
    {
      url: SITE_URL,
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...pokemonEntries,
  ]
}
