'use client'

import { memo, useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { usePokemonDetail } from '@/hooks/usePokemonDetail'
import { usePokemonList } from '@/hooks/usePokemonList'
import { fetchMoveDetail, getSpriteUrl } from '@/lib/api'
import { TYPE_COLORS, STAT_COLORS } from '@/types/pokemon'
import { usePokemonStore } from '@/store/pokemonStore'
import { T, TYPE_NAMES_ES, NATURE_NAMES_ES } from '@/lib/translations'
import { useMoveTranslations } from '@/hooks/useMoveTranslations'
import type { Lang } from '@/lib/translations'
import type { PokemonMove } from '@/types/pokemon'

// ── Types ──────────────────────────────────────────────────────────────────────

type StatKey = 'hp' | 'attack' | 'defense' | 'special-attack' | 'special-defense' | 'speed'
const STAT_KEYS: StatKey[] = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed']
const STAT_SHORT: Record<StatKey, string> = {
  hp: 'HP', attack: 'Atk', defense: 'Def',
  'special-attack': 'SpA', 'special-defense': 'SpD', speed: 'Spe',
}

interface PokeConfig {
  level: number
  nature: string
  ivs: Record<StatKey, number>
  evs: Record<StatKey, number>
}

const initConfig = (): PokeConfig => ({
  level: 50,
  nature: 'hardy',
  ivs: { hp: 31, attack: 31, defense: 31, 'special-attack': 31, 'special-defense': 31, speed: 31 },
  evs: { hp: 0, attack: 0, defense: 0, 'special-attack': 0, 'special-defense': 0, speed: 0 },
})

type Weather = 'sun' | 'rain' | 'sand' | 'snow' | null
type Terrain = 'electric' | 'grassy' | 'psychic' | 'misty' | null

interface Conditions {
  weather: Weather
  terrain: Terrain
  isCritical: boolean
  isBurned: boolean
  isReflect: boolean
  isLightScreen: boolean
}

type Translations = typeof T['en'] | typeof T['es']

// ── Natures ────────────────────────────────────────────────────────────────────

const NATURES: Record<string, { boost: StatKey | null; reduce: StatKey | null }> = {
  hardy:   { boost: null,              reduce: null },
  lonely:  { boost: 'attack',          reduce: 'defense' },
  brave:   { boost: 'attack',          reduce: 'speed' },
  adamant: { boost: 'attack',          reduce: 'special-attack' },
  naughty: { boost: 'attack',          reduce: 'special-defense' },
  bold:    { boost: 'defense',         reduce: 'attack' },
  docile:  { boost: null,              reduce: null },
  relaxed: { boost: 'defense',         reduce: 'speed' },
  impish:  { boost: 'defense',         reduce: 'special-attack' },
  lax:     { boost: 'defense',         reduce: 'special-defense' },
  timid:   { boost: 'speed',           reduce: 'attack' },
  hasty:   { boost: 'speed',           reduce: 'defense' },
  serious: { boost: null,              reduce: null },
  jolly:   { boost: 'speed',           reduce: 'special-attack' },
  naive:   { boost: 'speed',           reduce: 'special-defense' },
  modest:  { boost: 'special-attack',  reduce: 'attack' },
  mild:    { boost: 'special-attack',  reduce: 'defense' },
  quiet:   { boost: 'special-attack',  reduce: 'speed' },
  bashful: { boost: null,              reduce: null },
  rash:    { boost: 'special-attack',  reduce: 'special-defense' },
  calm:    { boost: 'special-defense', reduce: 'attack' },
  gentle:  { boost: 'special-defense', reduce: 'defense' },
  sassy:   { boost: 'special-defense', reduce: 'speed' },
  careful: { boost: 'special-defense', reduce: 'special-attack' },
  quirky:  { boost: null,              reduce: null },
}

// ── Type effectiveness (attack type → defender type → multiplier) ──────────────

const TYPE_CHART: Record<string, Record<string, number>> = {
  normal:   { rock: 0.5, ghost: 0, steel: 0.5 },
  fire:     { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water:    { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass:    { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice:      { water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, rock: 2, dark: 2, steel: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, fairy: 0.5, ghost: 0 },
  poison:   { grass: 2, fairy: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0 },
  ground:   { fire: 2, electric: 2, poison: 2, rock: 2, steel: 2, grass: 0.5, bug: 0.5, flying: 0 },
  flying:   { grass: 2, fighting: 2, bug: 2, electric: 0.5, rock: 0.5, steel: 0.5 },
  psychic:  { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug:      { grass: 2, psychic: 2, dark: 2, fire: 0.5, fighting: 0.5, flying: 0.5, ghost: 0.5, steel: 0.5, fairy: 0.5, poison: 0.5 },
  rock:     { fire: 2, ice: 2, flying: 2, bug: 2, fighting: 0.5, ground: 0.5, steel: 0.5 },
  ghost:    { psychic: 2, ghost: 2, dark: 0.5, normal: 0 },
  dragon:   { dragon: 2, steel: 0.5, fairy: 0 },
  dark:     { psychic: 2, ghost: 2, fighting: 0.5, dark: 0.5, fairy: 0.5 },
  steel:    { ice: 2, rock: 2, fairy: 2, fire: 0.5, water: 0.5, electric: 0.5, steel: 0.5 },
  fairy:    { fighting: 2, dragon: 2, dark: 2, fire: 0.5, poison: 0.5, steel: 0.5 },
}

// ── Calculation helpers ────────────────────────────────────────────────────────

function calcStat(base: number, iv: number, ev: number, level: number, natureMult: number, isHp: boolean): number {
  const inner = Math.floor((2 * base + iv + Math.floor(ev / 4)) * level / 100)
  return isHp ? inner + level + 10 : Math.floor((inner + 5) * natureMult)
}

function getNatureMult(nature: string, stat: StatKey): number {
  const n = NATURES[nature]
  if (!n || stat === 'hp') return 1
  if (n.boost === stat) return 1.1
  if (n.reduce === stat) return 0.9
  return 1
}

function getTypeEff(moveType: string, defTypes: string[]): number {
  return defTypes.reduce((acc, t) => acc * (TYPE_CHART[moveType]?.[t] ?? 1), 1)
}

function getDamageRange(
  level: number, atkStat: number, defStat: number, power: number,
  stab: boolean, typeEff: number, weatherMult: number, terrainMult: number,
  isCritical: boolean, isBurned: boolean, screenMult: number, isPhysical: boolean,
): [number, number] {
  if (power <= 0 || defStat <= 0) return [0, 0]
  const base = Math.floor(Math.floor(Math.floor(2 * level / 5 + 2) * power * atkStat / defStat) / 50) + 2
  let mod = weatherMult * terrainMult * (isCritical ? 1.5 : 1) * (stab ? 1.5 : 1) * typeEff
  if (isBurned && isPhysical) mod *= 0.5
  mod *= screenMult
  const max = Math.floor(base * mod)
  const min = Math.floor(max * 0.85)
  return [min, max]
}

function getCategoryLabel(cat: string, t: Translations): string {
  if (cat === 'physical') return t.calcPhysical
  if (cat === 'special')  return t.calcSpecial
  if (cat === 'status')   return t.calcStatus
  return cat
}

// ── PokemonSearch ──────────────────────────────────────────────────────────────

interface PokemonSearchProps {
  onSelect: (id: number) => void
  placeholder: string
  listboxId: string
  t: Translations
}

const PokemonSearch = memo(function PokemonSearch({ onSelect, placeholder, listboxId, t }: PokemonSearchProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { data: list } = usePokemonList()

  const suggestions = useMemo(() => {
    if (!query.trim() || !list) return []
    const q = query.trim().toLowerCase()
    return list
      .filter(p => p.name.includes(q) || String(p.id).startsWith(q))
      .sort((a, b) => (a.name.startsWith(q) ? 0 : 1) - (b.name.startsWith(q) ? 0 : 1) || a.id - b.id)
      .slice(0, 8)
  }, [query, list])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setActiveIdx(-1)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = useCallback((id: number) => {
    onSelect(id)
    setQuery('')
    setOpen(false)
    setActiveIdx(-1)
    inputRef.current?.focus()
  }, [onSelect])

  const isExpanded = open && suggestions.length > 0
  const activeId = activeIdx >= 0 && suggestions[activeIdx] ? `${listboxId}-opt-${suggestions[activeIdx].id}` : undefined

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none" aria-hidden="true">🔍</span>
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-label={placeholder}
          aria-autocomplete="list"
          aria-expanded={isExpanded}
          aria-controls={listboxId}
          aria-activedescendant={activeId}
          aria-haspopup="listbox"
          autoComplete="off"
          value={query}
          placeholder={placeholder}
          onChange={e => { setQuery(e.target.value); setOpen(true); setActiveIdx(-1) }}
          onFocus={() => { if (query) setOpen(true) }}
          onKeyDown={e => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActiveIdx(i => Math.min(i + 1, suggestions.length - 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActiveIdx(i => Math.max(i - 1, -1))
            } else if (e.key === 'Enter') {
              e.preventDefault()
              if (activeIdx >= 0 && suggestions[activeIdx]) handleSelect(suggestions[activeIdx].id)
            } else if (e.key === 'Escape') {
              setOpen(false)
              setActiveIdx(-1)
            }
          }}
          className="w-full pl-9 pr-3 py-2 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
        />
      </div>
      <AnimatePresence>
        {isExpanded && (
          <motion.ul
            id={listboxId}
            role="listbox"
            aria-label={placeholder}
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.1 }}
            className="absolute z-50 mt-1 left-0 right-0 rounded-xl overflow-hidden"
            style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 16px 40px rgba(0,0,0,0.7)' }}
          >
            {suggestions.map((p, i) => (
              <li key={p.id} role="option" aria-selected={i === activeIdx} id={`${listboxId}-opt-${p.id}`}>
                <button
                  type="button"
                  onMouseDown={e => { e.preventDefault(); handleSelect(p.id) }}
                  onMouseEnter={() => setActiveIdx(i)}
                  tabIndex={-1}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors"
                  style={{ background: i === activeIdx ? 'rgba(239,68,68,0.12)' : 'transparent' }}
                >
                  <img src={getSpriteUrl(p.id)} width={28} height={28} alt="" aria-hidden="true"
                    style={{ imageRendering: 'pixelated' }} />
                  <span className="text-sm font-semibold text-white capitalize flex-1">{p.name.replace(/-/g, ' ')}</span>
                  <span className="text-[10px] text-slate-500 font-pixel" aria-hidden="true">#{String(p.id).padStart(3, '0')}</span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
})

// ── StatRow ────────────────────────────────────────────────────────────────────

interface StatRowProps {
  stat: StatKey
  base: number
  config: PokeConfig
  totalEVs: number
  onChange: (updates: Partial<PokeConfig>) => void
  panelId: string
  t: Translations
}

const StatRow = memo(function StatRow({ stat, base, config, totalEVs, onChange, panelId, t }: StatRowProps) {
  const iv = config.ivs[stat]
  const ev = config.evs[stat]
  const natureMult = getNatureMult(config.nature, stat)
  const calculated = calcStat(base, iv, ev, config.level, natureMult, stat === 'hp')
  const nat = NATURES[config.nature]
  const natColor = nat?.boost === stat ? '#4ade80' : nat?.reduce === stat ? '#f87171' : undefined

  const setIv = useCallback((v: number) =>
    onChange({ ivs: { ...config.ivs, [stat]: Math.min(31, Math.max(0, v)) } }),
    [onChange, config.ivs, stat])

  const setEv = useCallback((v: number) => {
    const clamped = Math.min(252, Math.max(0, v))
    if (totalEVs - ev + clamped > 510) return
    onChange({ evs: { ...config.evs, [stat]: clamped } })
  }, [onChange, config.evs, stat, totalEVs, ev])

  const inputStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }
  const ivId = `${panelId}-${stat}-iv`
  const evId = `${panelId}-${stat}-ev`

  return (
    <tr className="text-xs">
      <td className="py-0.5 pr-2 font-bold w-10" style={{ color: STAT_COLORS[stat] }}>
        <span aria-hidden="true">{STAT_SHORT[stat]}</span>
      </td>
      <td className="pr-2 text-slate-500 text-center w-8" aria-label={`${STAT_SHORT[stat]} base stat: ${base}`}>{base}</td>
      <td className="pr-1">
        <label htmlFor={ivId} className="sr-only">{STAT_SHORT[stat]} {t.calcIV} (0–31)</label>
        <input
          id={ivId}
          type="number" min={0} max={31} value={iv}
          onChange={e => setIv(Number(e.target.value))}
          className="w-12 px-1 py-0.5 rounded text-center text-white text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
          style={inputStyle}
        />
      </td>
      <td className="pr-2">
        <label htmlFor={evId} className="sr-only">{STAT_SHORT[stat]} {t.calcEV} (0–252)</label>
        <input
          id={evId}
          type="number" min={0} max={252} value={ev}
          onChange={e => setEv(Number(e.target.value))}
          aria-describedby={`${panelId}-ev-total`}
          className="w-14 px-1 py-0.5 rounded text-center text-white text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
          style={inputStyle}
        />
      </td>
      <td className="text-right font-black w-10" style={{ color: natColor ?? '#e2e8f0' }}
        aria-label={`${STAT_SHORT[stat]} calculated: ${calculated}${natColor === '#4ade80' ? ' (boosted)' : natColor === '#f87171' ? ' (reduced)' : ''}`}>
        {calculated}
      </td>
    </tr>
  )
})

// ── PokemonPanel ───────────────────────────────────────────────────────────────

interface PokemonPanelProps {
  panelId: string
  label: string
  accentColor: string
  pokemonId: number | null
  config: PokeConfig
  onPokemonSelect: (id: number) => void
  onConfigChange: (updates: Partial<PokeConfig>) => void
  t: Translations
  language: string
}

const PokemonPanel = memo(function PokemonPanel({
  panelId, label, accentColor, pokemonId, config, onPokemonSelect, onConfigChange, t, language,
}: PokemonPanelProps) {
  const { data: pokemon, isLoading } = usePokemonDetail(pokemonId ?? 0)
  const totalEVs = Object.values(config.evs).reduce((a, b) => a + b, 0)

  const evColor = totalEVs > 510 ? '#f87171' : totalEVs === 510 ? '#4ade80' : '#64748b'
  const inputStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }
  const levelId = `${panelId}-level`
  const natureId = `${panelId}-nature`
  const listboxId = `${panelId}-search-listbox`

  return (
    <section
      aria-label={label}
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${accentColor}22` }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: accentColor }}
          aria-hidden="true">{label}</span>
        {pokemon && pokemon.types.map(tp => (
          <span key={tp.type.name} className="px-2 py-0.5 rounded-full text-[10px] font-bold capitalize"
            style={{ background: `${TYPE_COLORS[tp.type.name] ?? '#888'}22`, color: TYPE_COLORS[tp.type.name] ?? '#888', border: `1px solid ${TYPE_COLORS[tp.type.name] ?? '#888'}44` }}>
            {tp.type.name}
          </span>
        ))}
      </div>

      {/* Search */}
      <PokemonSearch
        onSelect={onPokemonSelect}
        placeholder={t.calcSearchPokemon}
        listboxId={listboxId}
        t={t}
      />

      {/* Loading / Pokémon display */}
      {isLoading && (
        <p className="text-slate-600 text-sm text-center py-2" aria-live="polite">{t.calcLoading}</p>
      )}
      {pokemon && (
        <div className="flex items-center gap-3">
          <img src={getSpriteUrl(pokemon.id)} width={64} height={64}
            alt={pokemon.name.replace(/-/g, ' ')}
            style={{ imageRendering: 'pixelated' }} />
          <div>
            <div className="font-black text-white capitalize">{pokemon.name.replace(/-/g, ' ')}</div>
            <div className="text-slate-500 text-[11px] font-pixel" aria-label={`Número ${pokemon.id}`}>
              #{String(pokemon.id).padStart(3, '0')}
            </div>
          </div>
        </div>
      )}

      {/* Level + Nature */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label htmlFor={levelId} className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
            {t.calcLevel}
          </label>
          <input
            id={levelId}
            type="number" min={1} max={100} value={config.level}
            onChange={e => onConfigChange({ level: Math.min(100, Math.max(1, Number(e.target.value))) })}
            className="w-full px-2 py-1.5 rounded-lg text-sm text-white text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
            style={inputStyle}
          />
        </div>
        <div className="flex-[2]">
          <label htmlFor={natureId} className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
            {t.calcNature}
          </label>
          <select
            id={natureId}
            value={config.nature}
            onChange={e => onConfigChange({ nature: e.target.value })}
            className="w-full px-2 py-1.5 rounded-lg text-sm text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 capitalize cursor-pointer"
            style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            {Object.keys(NATURES).map(n => (
              <option key={n} value={n}>
                {language === 'es' ? (NATURE_NAMES_ES[n] ?? n) : n.charAt(0).toUpperCase() + n.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats table */}
      {pokemon && (
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t.calcStats}</span>
            <span
              id={`${panelId}-ev-total`}
              className="text-[10px] font-bold"
              style={{ color: evColor }}
              aria-live="polite"
            >
              {t.calcEV} {totalEVs}/510
            </span>
          </div>
          <table className="w-full border-separate" style={{ borderSpacing: '0 1px' }}>
            <thead>
              <tr className="text-[9px] text-slate-600 uppercase tracking-wider">
                <th scope="col" className="text-left pb-1 font-bold">{t.calcStats.slice(0, 4)}</th>
                <th scope="col" className="pb-1 text-center font-bold">{t.calcBase}</th>
                <th scope="col" className="pb-1 text-center font-bold">{t.calcIV}</th>
                <th scope="col" className="pb-1 text-center font-bold">{t.calcEV}</th>
                <th scope="col" className="pb-1 text-right font-bold">{t.calcStatTotal}</th>
              </tr>
            </thead>
            <tbody>
              {STAT_KEYS.map(stat => (
                <StatRow
                  key={stat}
                  stat={stat}
                  base={pokemon.stats.find(s => s.stat.name === stat)?.base_stat ?? 0}
                  config={config}
                  totalEVs={totalEVs}
                  onChange={onConfigChange}
                  panelId={panelId}
                  t={t}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
})

// ── MoveSelector ───────────────────────────────────────────────────────────────

interface MoveSelectorProps {
  moves: PokemonMove[] | null
  selectedMove: string | null
  onSelect: (name: string) => void
  t: Translations
  language: Lang
}

const MoveSelector = memo(function MoveSelector({ moves, selectedMove, onSelect, t, language }: MoveSelectorProps) {
  const sorted = useMemo(() => {
    if (!moves) return []
    const isLevelUp = (m: PokemonMove) => m.version_group_details.some(d => d.move_learn_method.name === 'level-up')
    const lvUp = moves
      .filter(isLevelUp)
      .sort((a, b) => {
        const aLv = a.version_group_details.find(d => d.move_learn_method.name === 'level-up')?.level_learned_at ?? 0
        const bLv = b.version_group_details.find(d => d.move_learn_method.name === 'level-up')?.level_learned_at ?? 0
        return aLv - bLv || a.move.name.localeCompare(b.move.name)
      })
    const others = moves
      .filter(m => !isLevelUp(m))
      .sort((a, b) => a.move.name.localeCompare(b.move.name))
    return [...lvUp, ...others]
  }, [moves])

  const slugs = useMemo(() => sorted.map(m => m.move.name), [sorted])
  const moveNames = useMoveTranslations(slugs, language)

  if (!moves) return (
    <p className="text-slate-600 text-sm text-center py-2" aria-live="polite">{t.calcSelectAttackerFirst}</p>
  )

  return (
    <select
      value={selectedMove ?? ''}
      onChange={e => onSelect(e.target.value)}
      aria-label={t.calcMove}
      className="w-full px-3 py-2 rounded-xl text-sm text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 cursor-pointer"
      style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' }}
    >
      <option value="">{t.calcSelectMove}</option>
      {sorted.map(m => (
        <option key={m.move.name} value={m.move.name}>
          {moveNames.get(m.move.name) ?? m.move.name.replace(/-/g, ' ')}
        </option>
      ))}
    </select>
  )
})

// ── ConditionsPanel ────────────────────────────────────────────────────────────

interface ConditionsPanelProps {
  conditions: Conditions
  onChange: (c: Partial<Conditions>) => void
  t: Translations
}

const ConditionsPanel = memo(function ConditionsPanel({ conditions, onChange, t }: ConditionsPanelProps) {
  const weathers: { value: Weather; label: string; icon: string }[] = [
    { value: 'sun',  label: t.calcSun,  icon: '☀️' },
    { value: 'rain', label: t.calcRain, icon: '🌧️' },
    { value: 'sand', label: t.calcSand, icon: '🌪️' },
    { value: 'snow', label: t.calcSnow, icon: '❄️' },
  ]
  const terrains: { value: Terrain; label: string; icon: string }[] = [
    { value: 'electric', label: t.calcTerrainElectric, icon: '⚡' },
    { value: 'grassy',   label: t.calcTerrainGrassy,   icon: '🌿' },
    { value: 'psychic',  label: t.calcTerrainPsychic,  icon: '🔮' },
    { value: 'misty',    label: t.calcTerrainMisty,    icon: '🌫️' },
  ]
  const toggles: { key: keyof Conditions; label: string; icon: string }[] = [
    { key: 'isCritical',    label: t.calcCritical,    icon: '⚡' },
    { key: 'isBurned',      label: t.calcBurned,      icon: '🔥' },
    { key: 'isReflect',     label: t.calcReflect,     icon: '🛡️' },
    { key: 'isLightScreen', label: t.calcLightScreen, icon: '✨' },
  ]

  const chipBase    = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }
  const chipWeather = { background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.4)',  color: '#fbbf24' }
  const chipTerrain = { background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.4)', color: '#a5b4fc' }
  const chipToggle  = { background: 'rgba(239,68,68,0.15)',  border: '1px solid rgba(239,68,68,0.4)',  color: '#fca5a5' }

  return (
    <div className="rounded-2xl p-4 flex flex-col gap-4"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t.calcBattleConditions}</span>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Weather */}
        <div role="group" aria-label={t.calcWeather}>
          <div className="text-[10px] text-slate-600 font-bold uppercase mb-2" aria-hidden="true">{t.calcWeather}</div>
          <div className="flex flex-wrap gap-1.5">
            {weathers.map(w => (
              <button key={w.value} type="button"
                aria-pressed={conditions.weather === w.value}
                onClick={() => onChange({ weather: conditions.weather === w.value ? null : w.value })}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                style={conditions.weather === w.value ? chipWeather : chipBase}>
                <span aria-hidden="true">{w.icon}</span> {w.label}
              </button>
            ))}
          </div>
        </div>

        {/* Terrain */}
        <div role="group" aria-label={t.calcTerrain}>
          <div className="text-[10px] text-slate-600 font-bold uppercase mb-2" aria-hidden="true">{t.calcTerrain}</div>
          <div className="flex flex-wrap gap-1.5">
            {terrains.map(tr => (
              <button key={tr.value} type="button"
                aria-pressed={conditions.terrain === tr.value}
                onClick={() => onChange({ terrain: conditions.terrain === tr.value ? null : tr.value })}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                style={conditions.terrain === tr.value ? chipTerrain : chipBase}>
                <span aria-hidden="true">{tr.icon}</span> {tr.label}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div role="group" aria-label={t.calcModifiers}>
          <div className="text-[10px] text-slate-600 font-bold uppercase mb-2" aria-hidden="true">{t.calcModifiers}</div>
          <div className="flex flex-wrap gap-1.5">
            {toggles.map(({ key, label, icon }) => (
              <button key={key} type="button"
                aria-pressed={conditions[key] as boolean}
                onClick={() => onChange({ [key]: !conditions[key] })}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                style={conditions[key] ? chipToggle : chipBase}>
                <span aria-hidden="true">{icon}</span> {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
})

// ── ResultDisplay ──────────────────────────────────────────────────────────────

interface ResultDisplayProps {
  min: number; max: number; defHp: number; moveType: string; typeEff: number
  moveName: string; movePower: number | null; moveCategory: string; stab: boolean
  language: string; t: Translations
}

const ResultDisplay = memo(function ResultDisplay({
  min, max, defHp, moveType, typeEff, moveName, movePower, moveCategory, stab, language, t,
}: ResultDisplayProps) {
  const noData = min === 0 && max === 0
  const minPct = defHp > 0 ? (min / defHp) * 100 : 0
  const maxPct = defHp > 0 ? (max / defHp) * 100 : 0

  const effLabel =
    typeEff === 0    ? t.calcImmune  :
    typeEff >= 4     ? t.calc4x      :
    typeEff >= 2     ? t.calc2x      :
    typeEff <= 0.25  ? t.calcQuarter :
    typeEff < 1      ? t.calcHalf    : null
  const effColor = typeEff === 0 ? '#64748b' : typeEff < 1 ? '#f87171' : '#4ade80'

  const koLabel = useMemo(() => {
    if (noData || defHp === 0) return null
    for (let h = 1; h <= 4; h++) {
      if (max * h >= defHp) {
        const guaranteed = min * h >= defHp
        return `${guaranteed ? '' : t.calcPossible + ' '}${h}HKO`
      }
    }
    return '5HKO+'
  }, [noData, defHp, min, max, t.calcPossible])

  const barColor = maxPct >= 100 ? '#ef4444' : maxPct >= 50 ? '#f59e0b' : '#4ade80'
  const isKO = koLabel?.includes('1HKO')
  const typeLabel = language === 'es' ? (TYPE_NAMES_ES[moveType] ?? moveType) : moveType

  const resultText = noData
    ? ''
    : `${min}–${max} (${minPct.toFixed(1)}%–${maxPct.toFixed(1)}% ${t.calcOfHP})${koLabel ? `. ${koLabel}` : ''}`

  return (
    <div className="rounded-2xl p-6"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>

      {/* Screen-reader live region */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {resultText}
      </div>

      {!moveName ? (
        <p className="text-slate-600 text-center text-sm">{t.calcPrompt}</p>
      ) : noData ? (
        <p className="text-slate-500 text-center text-sm">{t.calcStatusMove}</p>
      ) : (
        <div aria-label={t.calcResult}>
          {/* Move summary */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            <span className="font-black text-white capitalize">{moveName.replace(/-/g, ' ')}</span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize"
              style={{ background: `${TYPE_COLORS[moveType] ?? '#888'}22`, color: TYPE_COLORS[moveType] ?? '#888', border: `1px solid ${TYPE_COLORS[moveType] ?? '#888'}44` }}>
              {typeLabel}
            </span>
            <span className="text-[11px] text-slate-500">{getCategoryLabel(moveCategory, t)}</span>
            {movePower != null && (
              <span className="text-[11px] text-slate-500">{t.calcPower} {movePower}</span>
            )}
            {stab && <span className="text-[11px] font-bold text-amber-400">STAB</span>}
          </div>

          {effLabel && (
            <p className="text-center text-sm font-bold mb-3" style={{ color: effColor }}>{effLabel}</p>
          )}

          {/* Damage bar */}
          <div
            role="img"
            aria-label={`${minPct.toFixed(1)}%–${maxPct.toFixed(1)}% ${t.calcOfHP}`}
            className="relative h-3 rounded-full mb-4 overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <motion.div className="absolute left-0 top-0 bottom-0 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(maxPct, 100)}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{ background: barColor }}
            />
          </div>

          {/* Numbers */}
          <div className="text-center mb-1">
            <span className="text-4xl font-black text-white" aria-hidden="true">{min} – {max}</span>
          </div>
          <p className="text-center text-slate-400 text-sm mb-4" aria-hidden="true">
            {minPct.toFixed(1)}% – {maxPct.toFixed(1)}% {t.calcOfHP}
          </p>

          {koLabel && (
            <div className="flex justify-center">
              <span className="px-4 py-1.5 rounded-full text-sm font-black"
                style={{
                  background: isKO ? 'rgba(239,68,68,0.2)' : 'rgba(99,102,241,0.2)',
                  border: `1px solid ${isKO ? 'rgba(239,68,68,0.5)' : 'rgba(99,102,241,0.5)'}`,
                  color: isKO ? '#fca5a5' : '#a5b4fc',
                }}>
                {koLabel}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
})

// ── Main ───────────────────────────────────────────────────────────────────────

export default function DamageCalcClient() {
  const language = usePokemonStore(s => s.language)
  const t = T[language]

  const [attackerId, setAttackerId] = useState<number | null>(null)
  const [defenderId, setDefenderId] = useState<number | null>(null)
  const [atkCfg, setAtkCfg] = useState<PokeConfig>(initConfig)
  const [defCfg, setDefCfg] = useState<PokeConfig>(initConfig)
  const [selectedMove, setSelectedMove] = useState<string | null>(null)
  const [conditions, setConditions] = useState<Conditions>({
    weather: null, terrain: null,
    isCritical: false, isBurned: false, isReflect: false, isLightScreen: false,
  })

  const { data: attacker } = usePokemonDetail(attackerId ?? 0)
  const { data: defender } = usePokemonDetail(defenderId ?? 0)

  const { data: moveDetail } = useQuery({
    queryKey: ['move', selectedMove],
    queryFn: () => fetchMoveDetail(selectedMove!),
    enabled: !!selectedMove,
    staleTime: Infinity,
    gcTime: Infinity,
  })

  useEffect(() => { setSelectedMove(null) }, [attackerId])

  // Stable callbacks to prevent child re-renders
  const handleAttackerSelect  = useCallback((id: number) => setAttackerId(id), [])
  const handleDefenderSelect  = useCallback((id: number) => setDefenderId(id), [])
  const handleAtkCfgChange    = useCallback((u: Partial<PokeConfig>) => setAtkCfg(p => ({ ...p, ...u })), [])
  const handleDefCfgChange    = useCallback((u: Partial<PokeConfig>) => setDefCfg(p => ({ ...p, ...u })), [])
  const handleConditionsChange = useCallback((u: Partial<Conditions>) => setConditions(p => ({ ...p, ...u })), [])

  const result = useMemo(() => {
    if (!attacker || !defender || !moveDetail?.power) return null

    const moveType  = moveDetail.type.name
    const isPhysical = moveDetail.damage_class.name === 'physical'
    const atkKey: StatKey = isPhysical ? 'attack' : 'special-attack'
    const defKey: StatKey = isPhysical ? 'defense' : 'special-defense'

    const atkBase   = attacker.stats.find(s => s.stat.name === atkKey)?.base_stat ?? 0
    const defBase   = defender.stats.find(s => s.stat.name === defKey)?.base_stat ?? 0
    const defHpBase = defender.stats.find(s => s.stat.name === 'hp')?.base_stat ?? 0

    const atkStat = calcStat(atkBase, atkCfg.ivs[atkKey], atkCfg.evs[atkKey], atkCfg.level, getNatureMult(atkCfg.nature, atkKey), false)
    const defStat = calcStat(defBase, defCfg.ivs[defKey], defCfg.evs[defKey], defCfg.level, getNatureMult(defCfg.nature, defKey), false)
    const defHp   = calcStat(defHpBase, defCfg.ivs.hp, defCfg.evs.hp, defCfg.level, 1, true)

    const defTypes = defender.types.map(tp => tp.type.name)
    const atkTypes = attacker.types.map(tp => tp.type.name)
    const stab     = atkTypes.includes(moveType)
    const typeEff  = getTypeEff(moveType, defTypes)

    let weatherMult = 1
    if (conditions.weather === 'sun')  { if (moveType === 'fire')  weatherMult = 1.5; else if (moveType === 'water') weatherMult = 0.5 }
    if (conditions.weather === 'rain') { if (moveType === 'water') weatherMult = 1.5; else if (moveType === 'fire')  weatherMult = 0.5 }

    let terrainMult = 1
    if      (conditions.terrain === 'electric' && moveType === 'electric') terrainMult = 1.3
    else if (conditions.terrain === 'grassy'   && moveType === 'grass')    terrainMult = 1.3
    else if (conditions.terrain === 'psychic'  && moveType === 'psychic')  terrainMult = 1.3
    else if (conditions.terrain === 'misty'    && moveType === 'dragon')   terrainMult = 0.5

    const screenMult = (isPhysical && conditions.isReflect) || (!isPhysical && conditions.isLightScreen) ? 0.5 : 1

    const [min, max] = getDamageRange(
      atkCfg.level, atkStat, defStat, moveDetail.power,
      stab, typeEff, weatherMult, terrainMult,
      conditions.isCritical, conditions.isBurned, screenMult, isPhysical,
    )

    return { min, max, defHp, typeEff, stab }
  }, [attacker, defender, moveDetail, atkCfg, defCfg, conditions])

  const defHpForDisplay = useMemo(() => {
    if (!defender) return 0
    const base = defender.stats.find(s => s.stat.name === 'hp')?.base_stat ?? 0
    return calcStat(base, defCfg.ivs.hp, defCfg.evs.hp, defCfg.level, 1, true)
  }, [defender, defCfg.ivs.hp, defCfg.evs.hp, defCfg.level])

  return (
    <main className="min-h-screen" style={{ background: '#0a0f1e' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <header className="mb-6">
          <h1 className="font-black text-white text-3xl mb-1">{t.calcTitle}</h1>
          <p className="text-slate-500 text-sm">{t.calcSubtitle}</p>
        </header>

        {/* Pokémon panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <PokemonPanel
            panelId="atk"
            label={t.calcAttacker}
            accentColor="#ef4444"
            pokemonId={attackerId}
            config={atkCfg}
            onPokemonSelect={handleAttackerSelect}
            onConfigChange={handleAtkCfgChange}
            t={t}
            language={language}
          />
          <PokemonPanel
            panelId="def"
            label={t.calcDefender}
            accentColor="#6366f1"
            pokemonId={defenderId}
            config={defCfg}
            onPokemonSelect={handleDefenderSelect}
            onConfigChange={handleDefCfgChange}
            t={t}
            language={language}
          />
        </div>

        {/* Move selector */}
        <section
          aria-label={t.calcMove}
          className="rounded-2xl p-4 mb-4"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2" aria-hidden="true">
            {t.calcMove}
          </div>
          <MoveSelector
            moves={attacker?.moves ?? null}
            selectedMove={selectedMove}
            onSelect={setSelectedMove}
            t={t}
            language={language}
          />
          {moveDetail && (
            <dl className="flex flex-wrap gap-3 mt-2 text-xs">
              <div className="flex gap-1">
                <dt className="sr-only">Tipo</dt>
                <dd className="capitalize font-bold" style={{ color: TYPE_COLORS[moveDetail.type.name] }}>
                  {language === 'es' ? (TYPE_NAMES_ES[moveDetail.type.name] ?? moveDetail.type.name) : moveDetail.type.name}
                </dd>
              </div>
              <div className="flex gap-1">
                <dt className="sr-only">Categoría</dt>
                <dd className="text-slate-500">{getCategoryLabel(moveDetail.damage_class.name, t)}</dd>
              </div>
              <div className="flex gap-1">
                <dt className="text-slate-600">{t.calcPower}:</dt>
                <dd className="text-slate-400">{moveDetail.power ?? '—'}</dd>
              </div>
              <div className="flex gap-1">
                <dt className="text-slate-600">{t.calcAccuracy}:</dt>
                <dd className="text-slate-400">{moveDetail.accuracy ?? '—'}</dd>
              </div>
              <div className="flex gap-1">
                <dt className="text-slate-600">{t.calcPP}:</dt>
                <dd className="text-slate-400">{moveDetail.pp ?? '—'}</dd>
              </div>
            </dl>
          )}
        </section>

        {/* Battle conditions */}
        <div className="mb-4">
          <ConditionsPanel conditions={conditions} onChange={handleConditionsChange} t={t} />
        </div>

        {/* Result */}
        <ResultDisplay
          min={result?.min ?? 0}
          max={result?.max ?? 0}
          defHp={defHpForDisplay}
          moveType={moveDetail?.type.name ?? 'normal'}
          typeEff={result?.typeEff ?? 1}
          moveName={selectedMove ?? ''}
          movePower={moveDetail?.power ?? null}
          moveCategory={moveDetail?.damage_class.name ?? ''}
          stab={result?.stab ?? false}
          language={language}
          t={t}
        />
      </div>
    </main>
  )
}
