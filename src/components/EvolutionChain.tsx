'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useQueries } from '@tanstack/react-query'
import { ChainLink, EvolutionChainData } from '@/types/pokemon'
import { getPokemonIdFromUrl, getOfficialArtworkUrl, fetchPokemonSpecies } from '@/lib/api'

interface Stage {
  id: number
  name: string
  minLevel: number | null
  trigger: string
  item: string | null
  happiness: boolean
  timeOfDay: string
}

interface VariantEntry { id: number; label: string }

const VARIANT_KEYWORDS = ['mega', 'gmax', 'alola', 'galar', 'hisui', 'paldea', 'primal']

function isNotableVariant(name: string): boolean {
  return VARIANT_KEYWORDS.some((kw) => name.includes(kw))
}

function variantLabel(fullName: string, baseName: string): string {
  const suffix = fullName.startsWith(baseName + '-')
    ? fullName.slice(baseName.length + 1)
    : fullName
  if (suffix.startsWith('mega')) {
    const extra = suffix.slice(4).replace(/-/g, ' ').trim()
    return extra ? `Mega ${extra.toUpperCase()}` : 'Mega'
  }
  if (suffix === 'gmax') return 'Gigantamax'
  if (suffix === 'alola') return 'Alolan'
  if (suffix === 'galar') return 'Galarian'
  if (suffix === 'hisui') return 'Hisuian'
  if (suffix === 'paldea') return 'Paldean'
  if (suffix === 'primal') return 'Primal'
  return suffix.replace(/-/g, ' ')
}

function getChainSpeciesIds(chain: ChainLink): number[] {
  const id = getPokemonIdFromUrl(chain.species.url)
  return [id, ...chain.evolves_to.flatMap(getChainSpeciesIds)]
}

function flattenChain(chain: ChainLink): Stage[][] {
  const id = getPokemonIdFromUrl(chain.species.url)
  const d = chain.evolution_details[0]

  const stage: Stage = {
    id,
    name: chain.species.name,
    minLevel: d?.min_level ?? null,
    trigger: d?.trigger?.name ?? 'level-up',
    item: d?.item?.name ?? d?.held_item?.name ?? null,
    happiness: !!(d?.min_happiness),
    timeOfDay: d?.time_of_day ?? '',
  }

  if (chain.evolves_to.length === 0) return [[stage]]
  return chain.evolves_to.flatMap((next) =>
    flattenChain(next).map((path) => [stage, ...path])
  )
}

function triggerLabel(s: Stage): string {
  if (s.item)      return s.item.replace(/-/g, ' ')
  if (s.happiness) return 'high friendship'
  if (s.minLevel)  return `Level ${s.minLevel}`
  if (s.trigger === 'trade') return 'trade'
  if (s.timeOfDay) return s.timeOfDay
  return 'evolve'
}

function EvoNode({ stage, currentId }: { stage: Stage; currentId: number }) {
  const isActive = stage.id === currentId
  return (
    <Link href={`/pokemon/${stage.id}`}>
      <motion.div
        whileHover={{ scale: 1.06, y: -4 }}
        whileTap={{ scale: 0.95 }}
        className="flex flex-col items-center gap-2 p-3 rounded-2xl cursor-pointer transition-all"
        style={{
          background: isActive ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)',
          border: isActive ? '2px solid rgba(59,130,246,0.5)' : '2px solid rgba(255,255,255,0.06)',
          boxShadow: isActive ? '0 0 20px rgba(59,130,246,0.2)' : 'none',
          minWidth: 90,
        }}
      >
        <div className="relative w-20 h-20">
          <Image
            src={getOfficialArtworkUrl(stage.id)}
            alt={stage.name}
            fill
            className="object-contain drop-shadow-lg"
            unoptimized
          />
        </div>
        <div className="text-center">
          <p className="text-slate-600 text-[9px] tabular-nums font-mono">#{String(stage.id).padStart(3, '0')}</p>
          <p className={`text-xs font-black capitalize ${isActive ? 'text-blue-300' : 'text-white'}`}>
            {stage.name.replace(/-/g, ' ')}
          </p>
        </div>
      </motion.div>
    </Link>
  )
}

function VariantNode({ variantId, label, currentId }: { variantId: number; label: string; currentId: number }) {
  const isActive = variantId === currentId
  return (
    <Link href={`/pokemon/${variantId}`}>
      <motion.div
        whileHover={{ scale: 1.06, y: -3 }}
        whileTap={{ scale: 0.95 }}
        className="flex flex-col items-center gap-1 p-2 rounded-xl cursor-pointer"
        style={{
          background: isActive ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.02)',
          border: isActive ? '2px solid rgba(59,130,246,0.5)' : '2px solid rgba(255,255,255,0.04)',
          minWidth: 68,
        }}
      >
        <div className="relative w-14 h-14">
          <Image
            src={getOfficialArtworkUrl(variantId)}
            alt={label}
            fill
            className="object-contain drop-shadow-md"
            unoptimized
          />
        </div>
        <p className="text-[9px] text-slate-400 font-semibold capitalize text-center leading-tight">{label}</p>
      </motion.div>
    </Link>
  )
}

function EvoNodeWithVariants({
  stage,
  currentId,
  variants,
}: {
  stage: Stage
  currentId: number
  variants: VariantEntry[]
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <EvoNode stage={stage} currentId={currentId} />
      {variants.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5">
          {variants.map((v) => (
            <VariantNode key={v.id} variantId={v.id} label={v.label} currentId={currentId} />
          ))}
        </div>
      )}
    </div>
  )
}

function Arrow({ stage }: { stage: Stage }) {
  return (
    <div className="flex flex-col items-center gap-1 px-1 flex-shrink-0">
      <span className="text-[9px] text-slate-500 text-center capitalize max-w-16 leading-tight">
        {triggerLabel(stage)}
      </span>
      <svg width="36" height="14" viewBox="0 0 36 14">
        <path d="M0 7 L28 7 M23 2 L32 7 L23 12"
          stroke="#475569" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

interface Props { chain: EvolutionChainData; currentPokemonId: number }

export default function EvolutionChain({ chain, currentPokemonId }: Props) {
  const paths = flattenChain(chain.chain)

  const speciesIds = [...new Set(getChainSpeciesIds(chain.chain))]
  const speciesResults = useQueries({
    queries: speciesIds.map((id) => ({
      queryKey: ['pokemon-species', id],
      queryFn: () => fetchPokemonSpecies(id),
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 1,
    })),
  })

  const variantsMap: Record<number, VariantEntry[]> = {}
  speciesIds.forEach((id, i) => {
    const data = speciesResults[i]?.data
    if (!data) return
    variantsMap[id] = data.varieties
      .filter((v) => !v.is_default && isNotableVariant(v.pokemon.name))
      .map((v) => ({
        id: getPokemonIdFromUrl(v.pokemon.url),
        label: variantLabel(v.pokemon.name, data.name),
      }))
  })

  if (paths.length === 1 && paths[0].length === 1) {
    const stage = paths[0][0]
    const variants = variantsMap[stage.id] ?? []
    if (variants.length === 0) {
      return (
        <p className="text-slate-600 text-sm text-center py-4 italic">
          This Pokémon does not evolve.
        </p>
      )
    }
    return (
      <div className="flex flex-col items-center gap-3">
        <EvoNodeWithVariants stage={stage} currentId={currentPokemonId} variants={variants} />
      </div>
    )
  }

  // Single linear path
  if (paths.length === 1) {
    const path = paths[0]
    return (
      <div className="flex items-center justify-center flex-wrap gap-1">
        {path.map((stage, i) => (
          <div key={stage.id} className="flex items-center gap-1">
            <EvoNodeWithVariants stage={stage} currentId={currentPokemonId} variants={variantsMap[stage.id] ?? []} />
            {i < path.length - 1 && <Arrow stage={path[i + 1]} />}
          </div>
        ))}
      </div>
    )
  }

  // Branching evolution (e.g. Eevee)
  const root = paths[0][0]
  const branches = paths.map((p) => p.slice(1)).filter((p) => p.length > 0)

  return (
    <div className="flex flex-col items-center gap-4">
      <EvoNodeWithVariants stage={root} currentId={currentPokemonId} variants={variantsMap[root.id] ?? []} />

      <svg width="2" height="24" viewBox="0 0 2 24">
        <line x1="1" y1="0" x2="1" y2="24" stroke="#334155" strokeWidth="1.5" />
      </svg>

      <div className="flex flex-wrap justify-center gap-4">
        {branches.map((branch, bi) => (
          <div key={bi} className="flex items-center gap-1">
            {branch.map((stage) => (
              <div key={stage.id} className="flex items-center gap-1">
                <Arrow stage={stage} />
                <EvoNodeWithVariants stage={stage} currentId={currentPokemonId} variants={variantsMap[stage.id] ?? []} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
