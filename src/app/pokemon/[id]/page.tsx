import { cache } from 'react'
import type { Metadata } from 'next'
import PokemonDetailClient from './PokemonDetailClient'

interface PageProps {
  params: Promise<{ id: string }>
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

const getPokemonMeta = cache(async (id: string) => {
  try {
    const [pokemonRes, speciesRes] = await Promise.all([
      fetch(`https://pokeapi.co/api/v2/pokemon/${id}`, { next: { revalidate: 86400 } }),
      fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`, { next: { revalidate: 86400 } }),
    ])
    if (!pokemonRes.ok) return null
    const pokemon = await pokemonRes.json()
    const species = speciesRes.ok ? await speciesRes.json() : null
    return { pokemon, species }
  } catch {
    return null
  }
})

export async function generateStaticParams() {
  return Array.from({ length: 1302 }, (_, i) => ({ id: String(i + 1) }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const data = await getPokemonMeta(id)

  if (!data) {
    return { title: `Pokémon #${id}` }
  }

  const { pokemon, species } = data
  const name = pokemon.name
    .split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  const number = String(pokemon.id).padStart(3, '0')
  const types: string = pokemon.types.map((t: { type: { name: string } }) => t.type.name).join('/')

  const flavorText: string = (
    species?.flavor_text_entries?.find((e: { language: { name: string } }) => e.language.name === 'en')?.flavor_text
    ?? `${name} is a ${types}-type Pokémon.`
  ).replace(/\f|\n/g, ' ')

  const artworkUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`
  const pageUrl = `${SITE_URL}/pokemon/${pokemon.id}`

  return {
    title: `${name} — #${number}`,
    description: flavorText,
    alternates: { canonical: pageUrl },
    openGraph: {
      type: 'website',
      url: pageUrl,
      title: `${name} (#${number}) — Datadex`,
      description: flavorText,
      images: [{ url: artworkUrl, width: 475, height: 475, alt: `${name} official artwork` }],
    },
    twitter: {
      card: 'summary',
      title: `${name} (#${number}) — Datadex`,
      description: flavorText,
      images: [artworkUrl],
    },
  }
}

export default async function PokemonPage({ params }: PageProps) {
  const { id } = await params
  const data = await getPokemonMeta(id)

  let jsonLd: object | null = null
  if (data) {
    const { pokemon, species } = data
    const name = pokemon.name
      .split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    const number = String(pokemon.id).padStart(3, '0')
    const types: string[] = pokemon.types.map((t: { type: { name: string } }) => t.type.name)
    const flavorText: string = (
      species?.flavor_text_entries?.find((e: { language: { name: string } }) => e.language.name === 'en')?.flavor_text
      ?? ''
    ).replace(/\f|\n/g, ' ')
    const artworkUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`
    const pageUrl = `${SITE_URL}/pokemon/${pokemon.id}`

    jsonLd = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Pokédex', item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: name, item: pageUrl },
          ],
        },
        {
          '@type': 'WebPage',
          '@id': pageUrl,
          url: pageUrl,
          name: `${name} — Datadex #${number}`,
          description: flavorText,
          image: artworkUrl,
          mainEntity: {
            '@type': 'Thing',
            name,
            description: flavorText,
            image: artworkUrl,
            identifier: `#${number}`,
            additionalProperty: [
              { '@type': 'PropertyValue', name: 'National Pokédex Number', value: pokemon.id },
              { '@type': 'PropertyValue', name: 'Type', value: types.join(', ') },
              { '@type': 'PropertyValue', name: 'Height', value: `${(pokemon.height / 10).toFixed(1)} m` },
              { '@type': 'PropertyValue', name: 'Weight', value: `${(pokemon.weight / 10).toFixed(1)} kg` },
            ],
          },
        },
      ],
    }
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <PokemonDetailClient params={params} />
    </>
  )
}
