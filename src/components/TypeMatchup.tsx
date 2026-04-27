'use client'

import { motion } from 'framer-motion'
import { usePokemonStore } from '@/store/pokemonStore'
import { TYPE_COLORS } from '@/types/pokemon'
import { TYPE_NAMES_ES } from '@/lib/translations'
import type { PokemonType } from '@/types/pokemon'

// Sparse table: TYPE_CHART[attacker][defender] = multiplier (1 if absent)
const TYPE_CHART: Record<string, Record<string, number>> = {
  normal:   { rock: 0.5, ghost: 0, steel: 0.5 },
  fire:     { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water:    { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass:    { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice:      { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison:   { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground:   { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying:   { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic:  { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug:      { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock:     { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost:    { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon:   { dragon: 2, steel: 0.5, fairy: 0 },
  dark:     { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel:    { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy:    { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
}

const TYPE_ICONS: Record<string, string> = {
  fire: '🔥', water: '💧', grass: '🌿', electric: '⚡', psychic: '🔮',
  ice: '❄️', dragon: '🐉', dark: '🌑', fairy: '✨', normal: '⬜',
  fighting: '👊', poison: '☠️', ground: '🌍', flying: '💨', bug: '🐛',
  rock: '🪨', ghost: '👻', steel: '⚙️',
}

// Color and label per multiplier value
const MULT_CONFIG: Record<number, { label: string; color: string }> = {
  4:    { label: '×4', color: '#ef4444' },
  2:    { label: '×2', color: '#f97316' },
  0.5:  { label: '½×', color: '#4ade80' },
  0.25: { label: '¼×', color: '#22d3ee' },
  0:    { label: '×0', color: '#a78bfa' },
}

const ALL_TYPES = Object.keys(TYPE_CHART)

function getEffectiveness(attacker: string, defenders: string[]): number {
  const row = TYPE_CHART[attacker] ?? {}
  return defenders.reduce((acc, def) => acc * (row[def] ?? 1), 1)
}

interface Props {
  types: PokemonType[]
  typeColor: string
}

export default function TypeMatchup({ types, typeColor }: Props) {
  const language = usePokemonStore((s) => s.language)
  const defenders = types.map((t) => t.type.name)

  const effectiveness = ALL_TYPES.map((atk) => ({
    type: atk,
    multiplier: getEffectiveness(atk, defenders),
  }))

  const groups = [
    {
      key: 'weak',
      label: language === 'es' ? 'Debilidades' : 'Weaknesses',
      headerColor: '#f97316',
      subgroups: [
        { multiplier: 4,   items: effectiveness.filter((e) => e.multiplier === 4) },
        { multiplier: 2,   items: effectiveness.filter((e) => e.multiplier === 2) },
      ].filter((s) => s.items.length > 0),
    },
    {
      key: 'resist',
      label: language === 'es' ? 'Resistencias' : 'Resistances',
      headerColor: '#4ade80',
      subgroups: [
        { multiplier: 0.25, items: effectiveness.filter((e) => e.multiplier === 0.25) },
        { multiplier: 0.5,  items: effectiveness.filter((e) => e.multiplier === 0.5)  },
      ].filter((s) => s.items.length > 0),
    },
    {
      key: 'immune',
      label: language === 'es' ? 'Inmunidades' : 'Immunities',
      headerColor: '#a78bfa',
      subgroups: [
        { multiplier: 0, items: effectiveness.filter((e) => e.multiplier === 0) },
      ].filter((s) => s.items.length > 0),
    },
  ].filter((g) => g.subgroups.length > 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="rounded-2xl p-6"
      style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <h2 className="font-black text-white text-xl mb-6 flex items-center gap-2">
        <span style={{ color: typeColor }}>🛡️</span>{' '}
        {language === 'es' ? 'Efectividad de Tipos' : 'Type Matchups'}
      </h2>

      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.key}>
            <p className="text-[10px] uppercase tracking-widest font-black mb-3"
              style={{ color: group.headerColor }}>
              {group.label}
            </p>
            <div className="space-y-2">
              {group.subgroups.map(({ multiplier, items }) => {
                const mult = MULT_CONFIG[multiplier]
                if (!mult) return null
                return (
                  <div key={multiplier} className="flex items-start gap-3">
                    {/* Multiplier badge anchored to the left */}
                    <span
                      className="flex-shrink-0 mt-0.5 px-2 py-1 rounded-md text-[11px] font-black tabular-nums w-10 text-center"
                      style={{ background: `${mult.color}25`, color: mult.color, border: `1px solid ${mult.color}40` }}
                    >
                      {mult.label}
                    </span>
                    {/* Pills row */}
                    <div className="flex flex-wrap gap-1.5">
                      {items.map(({ type }) => {
                        const tc       = TYPE_COLORS[type] ?? '#A8A878'
                        const typeName = language === 'es' ? (TYPE_NAMES_ES[type] ?? type) : type
                        const icon     = TYPE_ICONS[type] ?? ''
                        return (
                          <div
                            key={type}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-black"
                            style={{
                              background: `${mult.color}18`,
                              border: `1px solid ${mult.color}45`,
                              color: mult.color,
                            }}
                          >
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: tc }} aria-hidden="true" />
                            <span>{icon}</span>
                            <span className="uppercase tracking-wide">{typeName}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
