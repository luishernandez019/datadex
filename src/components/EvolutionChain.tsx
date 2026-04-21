'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChainLink, EvolutionChainData, TYPE_COLORS } from '@/types/pokemon'
import { getPokemonIdFromUrl, getOfficialArtworkUrl } from '@/lib/api'

interface Stage {
  id: number
  name: string
  minLevel: number | null
  trigger: string
  item: string | null
  happiness: boolean
  timeOfDay: string
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

  if (paths.length === 1 && paths[0].length === 1) {
    return (
      <p className="text-slate-600 text-sm text-center py-4 italic">
        This Pokémon does not evolve.
      </p>
    )
  }

  // Single linear path
  if (paths.length === 1) {
    const path = paths[0]
    return (
      <div className="flex items-center justify-center flex-wrap gap-1">
        {path.map((stage, i) => (
          <div key={stage.id} className="flex items-center gap-1">
            <EvoNode stage={stage} currentId={currentPokemonId} />
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
      <EvoNode stage={root} currentId={currentPokemonId} />

      <svg width="2" height="24" viewBox="0 0 2 24">
        <line x1="1" y1="0" x2="1" y2="24" stroke="#334155" strokeWidth="1.5" />
      </svg>

      <div className="flex flex-wrap justify-center gap-4">
        {branches.map((branch, bi) => (
          <div key={bi} className="flex items-center gap-1">
            {branch.map((stage, i) => (
              <div key={stage.id} className="flex items-center gap-1">
                <Arrow stage={stage} />
                <EvoNode stage={stage} currentId={currentPokemonId} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
