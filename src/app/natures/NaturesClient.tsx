'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePokemonStore } from '@/store/pokemonStore'
import { STAT_COLORS } from '@/types/pokemon'

type StatKey = 'attack' | 'defense' | 'special-attack' | 'special-defense' | 'speed'

interface Nature {
  en: string
  es: string
  up: StatKey
  down: StatKey
}

const STAT_KEYS: StatKey[] = ['attack', 'defense', 'special-attack', 'special-defense', 'speed']

const STAT_LABELS_FULL: Record<StatKey, { en: string; es: string }> = {
  'attack':          { en: 'Attack',  es: 'Ataque' },
  'defense':         { en: 'Defense', es: 'Defensa' },
  'special-attack':  { en: 'Sp. Atk', es: 'Atq. Esp.' },
  'special-defense': { en: 'Sp. Def', es: 'Def. Esp.' },
  'speed':           { en: 'Speed',   es: 'Velocidad' },
}

const STAT_LABELS_SHORT: Record<StatKey, { en: string; es: string }> = {
  'attack':          { en: 'ATK',    es: 'ATQ' },
  'defense':         { en: 'DEF',    es: 'DEF' },
  'special-attack':  { en: 'SP.ATK', es: 'ATQ.E' },
  'special-defense': { en: 'SP.DEF', es: 'DEF.E' },
  'speed':           { en: 'SPD',    es: 'VEL' },
}

const STAT_ICONS: Record<StatKey, string> = {
  'attack': '⚔️',
  'defense': '🛡️',
  'special-attack': '✨',
  'special-defense': '🌟',
  'speed': '⚡',
}

// Naturalezas en orden canónico de la matriz 5×5.
// Diagonal (up === down) son neutrales: Hardy, Docile, Bashful, Quirky, Serious.
const NATURES: Nature[] = [
  { en: 'Hardy',   es: 'Fuerte',   up: 'attack',          down: 'attack'          },
  { en: 'Lonely',  es: 'Huraña',   up: 'attack',          down: 'defense'         },
  { en: 'Adamant', es: 'Firme',    up: 'attack',          down: 'special-attack'  },
  { en: 'Naughty', es: 'Pícara',   up: 'attack',          down: 'special-defense' },
  { en: 'Brave',   es: 'Audaz',    up: 'attack',          down: 'speed'           },

  { en: 'Bold',    es: 'Osada',    up: 'defense',         down: 'attack'          },
  { en: 'Docile',  es: 'Dócil',    up: 'defense',         down: 'defense'         },
  { en: 'Impish',  es: 'Agitada',  up: 'defense',         down: 'special-attack'  },
  { en: 'Lax',     es: 'Floja',    up: 'defense',         down: 'special-defense' },
  { en: 'Relaxed', es: 'Plácida',  up: 'defense',         down: 'speed'           },

  { en: 'Modest',  es: 'Modesta',  up: 'special-attack',  down: 'attack'          },
  { en: 'Mild',    es: 'Afable',   up: 'special-attack',  down: 'defense'         },
  { en: 'Bashful', es: 'Tímida',   up: 'special-attack',  down: 'special-attack'  },
  { en: 'Rash',    es: 'Alocada',  up: 'special-attack',  down: 'special-defense' },
  { en: 'Quiet',   es: 'Mansa',    up: 'special-attack',  down: 'speed'           },

  { en: 'Calm',    es: 'Serena',   up: 'special-defense', down: 'attack'          },
  { en: 'Gentle',  es: 'Amable',   up: 'special-defense', down: 'defense'         },
  { en: 'Careful', es: 'Cauta',    up: 'special-defense', down: 'special-attack'  },
  { en: 'Quirky',  es: 'Rara',     up: 'special-defense', down: 'special-defense' },
  { en: 'Sassy',   es: 'Grosera',  up: 'special-defense', down: 'speed'           },

  { en: 'Timid',   es: 'Miedosa',  up: 'speed',           down: 'attack'          },
  { en: 'Hasty',   es: 'Activa',   up: 'speed',           down: 'defense'         },
  { en: 'Jolly',   es: 'Alegre',   up: 'speed',           down: 'special-attack'  },
  { en: 'Naive',   es: 'Ingenua',  up: 'speed',           down: 'special-defense' },
  { en: 'Serious', es: 'Seria',    up: 'speed',           down: 'speed'           },
]

const isNeutral = (n: Nature) => n.up === n.down

type Filter = StatKey | 'neutral' | null

// ─── Main Component ──────────────────────────────────────────────────────────

export default function NaturesClient() {
  const language = usePokemonStore((s) => s.language)
  const isES = language === 'es'
  const [filter, setFilter] = useState<Filter>(null)

  const filtered =
    filter === null
      ? NATURES
      : filter === 'neutral'
        ? NATURES.filter(isNeutral)
        : NATURES.filter((n) => !isNeutral(n) && n.up === filter)

  return (
    <div className="min-h-screen dot-grid">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #ec4899, transparent 70%)' }} />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #8b5cf6, transparent 70%)' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-pink-500/30 bg-pink-500/10 text-pink-400 text-xs font-bold mb-5 tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
            25 {isES ? 'Naturalezas' : 'Natures'}
          </div>
          <h1 className="font-pixel text-3xl sm:text-4xl md:text-5xl mb-4 leading-tight">
            <span style={{ color: '#ec4899', textShadow: '0 0 40px rgba(236,72,153,0.4)' }}>
              {isES ? 'NATURALEZAS' : 'NATURES'}
            </span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            {isES
              ? 'Cada Pokémon nace con una naturaleza que aumenta una estadística en un 10% y disminuye otra en un 10%. Las 5 naturalezas neutrales no afectan a las estadísticas.'
              : "Every Pokémon is born with a nature that increases one stat by 10% and decreases another by 10%. The 5 neutral natures don't affect stats."}
          </p>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-3 mb-10 max-w-2xl mx-auto">
          <SummaryCard value="20" label={isES ? 'Modificadoras' : 'Modifying'} color="#4ade80" />
          <SummaryCard value="5"  label={isES ? 'Neutrales'    : 'Neutral'}    color="#94a3b8" />
          <SummaryCard value="±10%" label={isES ? 'Modificador' : 'Modifier'}  color="#ec4899" />
        </div>

        {/* Matrix */}
        <NatureMatrix language={language} filter={filter} setFilter={setFilter} />

        {/* Filters */}
        <div className="mt-10">
          <p className="text-[10px] uppercase tracking-widest font-black text-slate-500 mb-3">
            {isES ? 'Filtrar por estadística aumentada' : 'Filter by boosted stat'}
          </p>
          <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label={isES ? 'Filtros de naturaleza' : 'Nature filters'}>
            <FilterChip
              active={filter === null}
              onClick={() => setFilter(null)}
              label={isES ? 'Todas' : 'All'}
              color="#94a3b8"
            />
            {STAT_KEYS.map((stat) => (
              <FilterChip
                key={stat}
                active={filter === stat}
                onClick={() => setFilter(stat)}
                label={`${STAT_ICONS[stat]} ${STAT_LABELS_FULL[stat][language]}`}
                color={STAT_COLORS[stat] ?? '#94a3b8'}
              />
            ))}
            <FilterChip
              active={filter === 'neutral'}
              onClick={() => setFilter('neutral')}
              label={isES ? '⚪ Neutrales' : '⚪ Neutral'}
              color="#94a3b8"
            />
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((nature) => (
                <NatureCard key={nature.en} nature={nature} language={language} />
              ))}
            </AnimatePresence>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-600">
              {isES ? 'Sin resultados' : 'No results'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Summary card ────────────────────────────────────────────────────────────

function SummaryCard({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div
      className="rounded-xl p-4 text-center"
      style={{ background: `${color}10`, border: `1px solid ${color}30` }}
    >
      <div className="text-2xl font-black tabular-nums" style={{ color }}>
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">
        {label}
      </div>
    </div>
  )
}

// ─── Filter chip ─────────────────────────────────────────────────────────────

function FilterChip({
  active,
  onClick,
  label,
  color,
}: {
  active: boolean
  onClick: () => void
  label: string
  color: string
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className="px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wide transition-all hover:opacity-90 active:scale-95 cursor-pointer"
      style={
        active
          ? { background: color, color: '#0b1120', boxShadow: `0 0 12px ${color}55` }
          : { background: `${color}10`, color, border: `1px solid ${color}30` }
      }
    >
      {label}
    </button>
  )
}

// ─── Matrix view ─────────────────────────────────────────────────────────────

function NatureMatrix({
  language,
  filter,
  setFilter,
}: {
  language: 'en' | 'es'
  filter: Filter
  setFilter: (f: Filter) => void
}) {
  const isES = language === 'es'

  return (
    <div
      className="rounded-2xl p-4 sm:p-6"
      style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-baseline justify-between gap-2 mb-2 flex-wrap">
        <h2 className="font-black text-white text-base sm:text-lg">
          {isES ? '📊 Matriz de Naturalezas' : '📊 Nature Matrix'}
        </h2>
        <p className="text-slate-600 text-[10px] uppercase tracking-wider font-bold">
          5 × 5 = 25
        </p>
      </div>
      <p className="text-slate-500 text-xs mb-5">
        {isES
          ? 'Filas = estadística que aumenta · Columnas = estadística que disminuye · Diagonal = neutral'
          : 'Rows = boosted stat · Columns = lowered stat · Diagonal = neutral'}
      </p>

      <div className="overflow-x-auto -mx-2 px-2">
        <div className="min-w-[640px]">
          {/* Column headers (lowered stats) */}
          <div
            className="grid gap-1.5 mb-1.5"
            style={{ gridTemplateColumns: '90px repeat(5, 1fr)' }}
          >
            <div className="flex items-end justify-end pr-2 pb-1">
              <div className="text-[8px] font-black text-slate-600 leading-tight text-right uppercase tracking-wider">
                <div className="text-green-500/70">↑ {isES ? 'Aumenta' : 'Boosts'}</div>
                <div className="text-red-500/70">↓ {isES ? 'Disminuye' : 'Lowers'}</div>
              </div>
            </div>
            {STAT_KEYS.map((stat) => {
              const color = STAT_COLORS[stat] ?? '#94a3b8'
              return (
                <div
                  key={stat}
                  className="flex flex-col items-center gap-1 py-2 rounded-lg"
                  style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}
                >
                  <span className="text-base" aria-hidden="true">{STAT_ICONS[stat]}</span>
                  <span className="text-[9px] font-black text-red-400">↓</span>
                  <span className="text-[10px] font-black uppercase tracking-wide" style={{ color }}>
                    {STAT_LABELS_SHORT[stat][language]}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Body rows (boosted stats) */}
          {STAT_KEYS.map((rowStat) => {
            const rowColor = STAT_COLORS[rowStat] ?? '#94a3b8'
            const rowActive = filter === rowStat
            return (
              <div
                key={rowStat}
                className="grid gap-1.5 mb-1.5"
                style={{ gridTemplateColumns: '90px repeat(5, 1fr)' }}
              >
                {/* Row header — clickable to filter */}
                <button
                  onClick={() => setFilter(rowActive ? null : rowStat)}
                  aria-pressed={rowActive}
                  className="flex items-center justify-end gap-1 px-2 rounded-lg py-2 transition-all hover:opacity-90 active:scale-95 cursor-pointer"
                  style={{
                    background: rowActive ? `${rowColor}25` : 'rgba(74,222,128,0.05)',
                    border: rowActive
                      ? `1px solid ${rowColor}80`
                      : '1px solid rgba(74,222,128,0.15)',
                  }}
                >
                  <span className="text-[10px] font-black uppercase tracking-wide" style={{ color: rowColor }}>
                    {STAT_LABELS_SHORT[rowStat][language]}
                  </span>
                  <span className="text-[9px] font-black text-green-400">↑</span>
                  <span className="text-base" aria-hidden="true">{STAT_ICONS[rowStat]}</span>
                </button>

                {/* Cells */}
                {STAT_KEYS.map((colStat) => {
                  const nature = NATURES.find((n) => n.up === rowStat && n.down === colStat)
                  if (!nature) return <div key={colStat} />
                  const dim =
                    filter !== null &&
                    !(filter === 'neutral' ? isNeutral(nature) : nature.up === filter && !isNeutral(nature))
                  return (
                    <NatureCell
                      key={colStat}
                      nature={nature}
                      language={language}
                      dim={dim}
                    />
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function NatureCell({
  nature,
  language,
  dim,
}: {
  nature: Nature
  language: 'en' | 'es'
  dim: boolean
}) {
  const neutral = isNeutral(nature)
  const upColor = STAT_COLORS[nature.up] ?? '#94a3b8'
  const downColor = STAT_COLORS[nature.down] ?? '#94a3b8'

  return (
    <motion.div
      whileHover={{ scale: 1.04 }}
      className="flex items-center justify-center p-2 rounded-lg select-none transition-opacity"
      style={{
        background: neutral
          ? 'rgba(148,163,184,0.05)'
          : `linear-gradient(135deg, ${upColor}20, ${downColor}10)`,
        border: neutral
          ? '1px dashed rgba(148,163,184,0.25)'
          : `1px solid ${upColor}30`,
        opacity: dim ? 0.25 : 1,
        minHeight: '52px',
      }}
      title={
        neutral
          ? language === 'es'
            ? `${nature.es} — Neutral`
            : `${nature.en} — Neutral`
          : language === 'es'
            ? `${nature.es}: +${STAT_LABELS_FULL[nature.up].es} / −${STAT_LABELS_FULL[nature.down].es}`
            : `${nature.en}: +${STAT_LABELS_FULL[nature.up].en} / −${STAT_LABELS_FULL[nature.down].en}`
      }
    >
      <span
        className="text-[11px] sm:text-xs font-black text-center leading-tight"
        style={{ color: neutral ? '#94a3b8' : '#fff' }}
      >
        {nature[language]}
      </span>
    </motion.div>
  )
}

// ─── Nature card ─────────────────────────────────────────────────────────────

function NatureCard({ nature, language }: { nature: Nature; language: 'en' | 'es' }) {
  const isES = language === 'es'
  const neutral = isNeutral(nature)
  const upColor = STAT_COLORS[nature.up] ?? '#94a3b8'
  const downColor = STAT_COLORS[nature.down] ?? '#94a3b8'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl p-4"
      style={{
        background: neutral
          ? 'rgba(148,163,184,0.04)'
          : `linear-gradient(135deg, ${upColor}12, rgba(15,23,42,0.95))`,
        border: neutral
          ? '1px dashed rgba(148,163,184,0.18)'
          : `1px solid ${upColor}30`,
      }}
    >
      <div className="flex items-baseline justify-between gap-2 mb-3">
        <h3 className="font-black text-white text-base">{nature[language]}</h3>
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">
          {language === 'es' ? nature.en : nature.es}
        </span>
      </div>

      {neutral ? (
        <div
          className="flex items-center justify-center py-3 rounded-lg"
          style={{ background: 'rgba(148,163,184,0.05)', border: '1px dashed rgba(148,163,184,0.15)' }}
        >
          <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
            {isES ? '⚪ Sin efectos' : '⚪ No effects'}
          </span>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Boosted */}
          <div
            className="flex items-center gap-3 px-3 py-2 rounded-lg"
            style={{ background: `${upColor}18`, border: `1px solid ${upColor}35` }}
          >
            <span className="text-lg" aria-hidden="true">{STAT_ICONS[nature.up]}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[9px] uppercase tracking-widest font-black text-green-400">
                {isES ? '↑ +10%' : '↑ +10%'}
              </div>
              <div className="text-xs font-black uppercase tracking-wide truncate" style={{ color: upColor }}>
                {STAT_LABELS_FULL[nature.up][language]}
              </div>
            </div>
          </div>

          {/* Lowered */}
          <div
            className="flex items-center gap-3 px-3 py-2 rounded-lg"
            style={{ background: `${downColor}10`, border: `1px solid ${downColor}25` }}
          >
            <span className="text-lg opacity-70" aria-hidden="true">{STAT_ICONS[nature.down]}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[9px] uppercase tracking-widest font-black text-red-400">
                {isES ? '↓ −10%' : '↓ −10%'}
              </div>
              <div className="text-xs font-black uppercase tracking-wide truncate opacity-80" style={{ color: downColor }}>
                {STAT_LABELS_FULL[nature.down][language]}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
