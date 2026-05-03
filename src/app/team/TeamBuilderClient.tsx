'use client'

import { useState, useEffect, useCallback, useRef, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { usePokemonStore } from '@/store/pokemonStore'
import { usePokemonCacheStore } from '@/store/pokemonCacheStore'
import { usePokemonList } from '@/hooks/usePokemonList'
import { usePokemonDetail } from '@/hooks/usePokemonDetail'
import { getOfficialArtworkUrl, getSpriteUrl } from '@/lib/api'
import { TYPE_COLORS, STAT_COLORS, STAT_LABELS } from '@/types/pokemon'
import { TYPE_NAMES_ES } from '@/lib/translations'
import type { Pokemon } from '@/types/pokemon'

// Sparse table: TYPE_CHART[attacker][defender] = multiplier
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

const ALL_TYPES = Object.keys(TYPE_CHART)

const TYPE_ICONS: Record<string, string> = {
  fire: '🔥', water: '💧', grass: '🌿', electric: '⚡', psychic: '🔮',
  ice: '❄️', dragon: '🐉', dark: '🌑', fairy: '✨', normal: '⬜',
  fighting: '👊', poison: '☠️', ground: '🌍', flying: '💨', bug: '🐛',
  rock: '🪨', ghost: '👻', steel: '⚙️',
}

const STAT_ORDER = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed']
const LS_KEY = 'datadex-team'

function getDefEffectiveness(attacker: string, defenderTypes: string[]): number {
  const row = TYPE_CHART[attacker] ?? {}
  return defenderTypes.reduce((acc, def) => acc * (row[def] ?? 1), 1)
}

// ─── Focus trap hook ─────────────────────────────────────────────────────────

function useFocusTrap(containerRef: React.RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active || !containerRef.current) return
    const container = containerRef.current
    const selector = 'button:not([disabled]), input, [href], [tabindex]:not([tabindex="-1"])'
    const getFocusable = () => Array.from(container.querySelectorAll<HTMLElement>(selector))

    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const focusable = getFocusable()
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [active, containerRef])
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TeamBuilderClient() {
  const language = usePokemonStore((s) => s.language)
  const pokemonCache = usePokemonCacheStore((s) => s.pokemonCache)

  const [teamIds, setTeamIds] = useState<(number | null)[]>([null, null, null, null, null, null])
  const [pickerSlot, setPickerSlot] = useState<number | null>(null)
  const [analysisTab, setAnalysisTab] = useState<'types' | 'stats'>('types')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length === 6) setTeamIds(parsed)
      }
    } catch {}
  }, [])

  const addToSlot = useCallback((slotIdx: number, pokemonId: number) => {
    setTeamIds((prev) => {
      const next = [...prev]
      next[slotIdx] = pokemonId
      localStorage.setItem(LS_KEY, JSON.stringify(next))
      return next
    })
    setPickerSlot(null)
  }, [])

  const removeFromSlot = useCallback((slotIdx: number) => {
    setTeamIds((prev) => {
      const next = [...prev]
      next[slotIdx] = null
      localStorage.setItem(LS_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const clearTeam = useCallback(() => {
    const empty = [null, null, null, null, null, null] as (number | null)[]
    setTeamIds(empty)
    localStorage.setItem(LS_KEY, JSON.stringify(empty))
  }, [])

  const teamSize = teamIds.filter((id) => id !== null).length
  const teamPokemon = teamIds
    .map((id) => (id !== null ? pokemonCache[id] : null))
    .filter((p): p is Pokemon => p !== null && p !== undefined)

  const isES = language === 'es'
  const tabId = useId()
  const [liveMessage, setLiveMessage] = useState('')

  const announceChange = useCallback((msg: string) => {
    setLiveMessage('')
    // Pequeño delay para que el cambio de '' a msg sea detectado por screen readers
    setTimeout(() => setLiveMessage(msg), 50)
  }, [])

  const addToSlotWithAnnounce = useCallback((slotIdx: number, pokemonId: number) => {
    addToSlot(slotIdx, pokemonId)
    const list = (window as any).__pokemonList as { id: number; name: string }[] | undefined
    const name = list?.find(p => p.id === pokemonId)?.name ?? `#${pokemonId}`
    announceChange(isES ? `${name} añadido al slot ${slotIdx + 1}` : `${name} added to slot ${slotIdx + 1}`)
  }, [addToSlot, announceChange, isES])

  const removeWithAnnounce = useCallback((slotIdx: number) => {
    const id = teamIds[slotIdx]
    removeFromSlot(slotIdx)
    if (id !== null && pokemonCache[id]) {
      const name = pokemonCache[id].name
      announceChange(isES ? `${name} eliminado del slot ${slotIdx + 1}` : `${name} removed from slot ${slotIdx + 1}`)
    }
  }, [removeFromSlot, teamIds, pokemonCache, announceChange, isES])

  return (
    <div className="min-h-screen dot-grid">
      {/* Región aria-live para anuncios a lectores de pantalla */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {liveMessage}
      </div>

      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)' }} />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #ef4444, transparent 70%)' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-bold mb-5 tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            {teamSize}/6 Pokémon
          </div>
          <h1 className="font-pixel text-3xl sm:text-4xl md:text-5xl mb-4 leading-tight">
            <span style={{ color: '#6366f1', textShadow: '0 0 40px rgba(99,102,241,0.4)' }}>
              {isES ? 'EQUIPO' : 'TEAM'}
            </span>
            <span className="text-white"> BUILDER</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            {isES
              ? 'Construye tu equipo ideal de 6 Pokémon y analiza sus fortalezas y debilidades de tipo.'
              : 'Build your ideal team of 6 Pokémon and analyze type strengths and weaknesses.'}
          </p>
        </div>

        {/* Clear button */}
        {teamSize > 0 && (
          <div className="flex justify-end mb-4">
            <button
              onClick={clearTeam}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              {isES ? '✕ Limpiar equipo' : '✕ Clear team'}
            </button>
          </div>
        )}

        {/* Team Slots */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          {teamIds.map((id, idx) =>
            id !== null ? (
              <FilledSlot
                key={`filled-${idx}-${id}`}
                id={id}
                slotIndex={idx}
                language={language}
                onRemove={removeWithAnnounce}
                onReplace={() => setPickerSlot(idx)}
              />
            ) : (
              <EmptySlot
                key={`empty-${idx}`}
                slotIndex={idx}
                language={language}
                onSelect={() => setPickerSlot(idx)}
              />
            )
          )}
        </div>

        {/* Analysis Section */}
        <AnimatePresence>
          {teamPokemon.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <div
                role="tablist"
                aria-label={isES ? 'Secciones de análisis' : 'Analysis sections'}
                className="flex gap-2 mb-6"
              >
                {(['types', 'stats'] as const).map((tab) => (
                  <button
                    key={tab}
                    id={`${tabId}-tab-${tab}`}
                    role="tab"
                    aria-selected={analysisTab === tab}
                    aria-controls={`${tabId}-panel-${tab}`}
                    onClick={() => setAnalysisTab(tab)}
                    className="px-5 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer"
                    style={
                      analysisTab === tab
                        ? { background: '#6366f1', color: '#fff' }
                        : {
                            background: 'rgba(255,255,255,0.05)',
                            color: '#94a3b8',
                            border: '1px solid rgba(255,255,255,0.08)',
                          }
                    }
                  >
                    {tab === 'types'
                      ? isES ? '🛡️ Cobertura de Tipos' : '🛡️ Type Coverage'
                      : isES ? '📊 Estadísticas' : '📊 Stats'}
                  </button>
                ))}
              </div>

              <div
                id={`${tabId}-panel-${analysisTab}`}
                role="tabpanel"
                aria-labelledby={`${tabId}-tab-${analysisTab}`}
              >
                {analysisTab === 'types' ? (
                  <TeamTypeAnalysis teamPokemon={teamPokemon} teamIds={teamIds} language={language} />
                ) : (
                  <TeamStatsComparison teamPokemon={teamPokemon} language={language} />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {teamSize === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4 opacity-30">⚔️</div>
            <p className="text-lg font-bold text-slate-600">
              {isES ? 'Tu equipo está vacío' : 'Your team is empty'}
            </p>
            <p className="text-sm text-slate-700 mt-2">
              {isES
                ? 'Añade Pokémon para comenzar el análisis'
                : 'Add Pokémon to start the analysis'}
            </p>
          </div>
        )}
      </div>

      {/* Picker Modal */}
      <AnimatePresence>
        {pickerSlot !== null && (
          <PokemonPicker
            slotIndex={pickerSlot}
            teamIds={teamIds}
            language={language}
            onSelect={addToSlotWithAnnounce}
            onClose={() => setPickerSlot(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Filled Slot ──────────────────────────────────────────────────────────────

function FilledSlot({
  id,
  slotIndex,
  language,
  onRemove,
  onReplace,
}: {
  id: number
  slotIndex: number
  language: 'en' | 'es'
  onRemove: (idx: number) => void
  onReplace: () => void
}) {
  const { data: pokemon, isLoading } = usePokemonDetail(id)
  const isES = language === 'es'

  if (isLoading || !pokemon) {
    return (
      <div
        className="rounded-2xl p-4 flex items-center justify-center h-72 animate-pulse"
        style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="w-20 h-20 rounded-full bg-slate-800" />
      </div>
    )
  }

  const types = pokemon.types.map((t) => t.type.name)
  const primaryType = types[0]
  const typeColor = TYPE_COLORS[primaryType] ?? '#A8A878'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      className="rounded-2xl overflow-hidden relative group"
      style={{
        background: `linear-gradient(150deg, ${typeColor}18 0%, rgba(15,23,42,0.97) 60%)`,
        border: `1px solid ${typeColor}35`,
      }}
    >
      {/* Slot number */}
      <div className="absolute top-3 left-3 font-pixel text-[9px] opacity-30" style={{ color: typeColor }}>
        SLOT {slotIndex + 1}
      </div>

      {/* Action buttons — visibles en hover Y en foco de teclado */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-10">
        <button
          onClick={onReplace}
          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold cursor-pointer"
          style={{ background: 'rgba(99,102,241,0.8)', color: '#fff' }}
          aria-label={isES ? 'Reemplazar Pokémon' : 'Replace Pokémon'}
          title={isES ? 'Reemplazar' : 'Replace'}
        >
          ↺
        </button>
        <button
          onClick={() => onRemove(slotIndex)}
          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold cursor-pointer"
          style={{ background: 'rgba(239,68,68,0.8)', color: '#fff' }}
          aria-label={isES ? 'Quitar del equipo' : 'Remove from team'}
        >
          ✕
        </button>
      </div>

      {/* Artwork */}
      <div className="flex justify-center pt-8 pb-1 px-4">
        <div className="relative w-28 h-28">
          <Image
            src={getOfficialArtworkUrl(pokemon.id)}
            alt={pokemon.name}
            fill
            className="object-contain drop-shadow-xl"
            sizes="112px"
          />
        </div>
      </div>

      {/* Info */}
      <div className="px-4 pb-4">
        <div className="flex items-baseline gap-2 mb-2">
          <h3 className="font-black text-white capitalize text-sm truncate">
            {pokemon.name.replace(/-/g, ' ')}
          </h3>
          <span className="font-pixel text-[9px] text-slate-600 flex-shrink-0">
            #{String(pokemon.id).padStart(3, '0')}
          </span>
        </div>

        {/* Types */}
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {types.map((type) => {
            const tc = TYPE_COLORS[type] ?? '#A8A878'
            const name = language === 'es' ? (TYPE_NAMES_ES[type] ?? type) : type
            return (
              <span
                key={type}
                className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide"
                style={{ background: `${tc}22`, color: tc, border: `1px solid ${tc}40` }}
              >
                {name}
              </span>
            )
          })}
        </div>

        {/* Stat bars */}
        <div className="space-y-1.5">
          {STAT_ORDER.map((statKey) => {
            const stat = pokemon.stats.find((s) => s.stat.name === statKey)
            const value = stat?.base_stat ?? 0
            const pct = Math.min(Math.round((value / 255) * 100), 100)
            const color = STAT_COLORS[statKey] ?? '#94a3b8'
            const label = STAT_LABELS[statKey] ?? statKey
            return (
              <div key={statKey} className="flex items-center gap-2">
                <span
                  className="text-[9px] font-black w-12 text-right flex-shrink-0 tabular-nums"
                  style={{ color: `${color}99` }}
                  aria-hidden="true"
                >
                  {label}
                </span>
                <div
                  role="progressbar"
                  aria-label={label}
                  aria-valuenow={value}
                  aria-valuemin={0}
                  aria-valuemax={255}
                  className="flex-1 h-1.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: color, opacity: 0.85 }}
                  />
                </div>
                <span className="text-[9px] font-bold text-slate-500 w-7 text-right tabular-nums" aria-hidden="true">
                  {value}
                </span>
              </div>
            )
          })}
        </div>

        {/* Total */}
        <div className="flex justify-end mt-2 pt-2 border-t border-white/5">
          <span className="text-[10px] font-black text-slate-500">
            {language === 'es' ? 'TOTAL' : 'TOTAL'}{' '}
            <span style={{ color: typeColor }}>
              {pokemon.stats.reduce((acc, s) => acc + s.base_stat, 0)}
            </span>
          </span>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Empty Slot ───────────────────────────────────────────────────────────────

function EmptySlot({
  slotIndex,
  language,
  onSelect,
}: {
  slotIndex: number
  language: 'en' | 'es'
  onSelect: () => void
}) {
  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="rounded-2xl flex flex-col items-center justify-center gap-3 h-72 w-full transition-colors"
      style={{
        background: 'rgba(15,23,42,0.4)',
        border: '2px dashed rgba(255,255,255,0.07)',
        cursor: 'pointer',
      }}
      aria-label={
        language === 'es'
          ? `Añadir Pokémon al slot ${slotIndex + 1}`
          : `Add Pokémon to slot ${slotIndex + 1}`
      }
    >
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center text-2xl text-slate-600 transition-colors hover:text-slate-400"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        +
      </div>
      <div>
        <p className="text-xs font-bold text-slate-600">
          {language === 'es' ? 'Añadir Pokémon' : 'Add Pokémon'}
        </p>
        <p className="font-pixel text-[9px] text-slate-700 text-center mt-0.5">SLOT {slotIndex + 1}</p>
      </div>
    </motion.button>
  )
}

// ─── Pokémon Picker ───────────────────────────────────────────────────────────

function PokemonPicker({
  slotIndex,
  teamIds,
  language,
  onSelect,
  onClose,
}: {
  slotIndex: number
  teamIds: (number | null)[]
  language: 'en' | 'es'
  onSelect: (slotIdx: number, pokemonId: number) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const { data: pokemonList } = usePokemonList()
  const inputRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const isES = language === 'es'
  const titleId = useId()

  // Foco al input al abrir, restaurar al elemento previo al cerrar
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    inputRef.current?.focus()
    return () => { prev?.focus() }
  }, [])

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Trampa de foco dentro del modal
  useFocusTrap(dialogRef, true)

  const results =
    query.trim().length === 0
      ? (pokemonList ?? []).slice(0, 48)
      : (pokemonList ?? [])
          .filter((p) => {
            const q = query.trim().toLowerCase()
            return p.name.includes(q) || String(p.id).startsWith(q)
          })
          .slice(0, 48)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={{ scale: 0.92, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 8 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: '#0b1120',
          border: '1px solid rgba(255,255,255,0.1)',
          maxHeight: '85vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5 flex-shrink-0">
          <div className="flex-1">
            <h2 id={titleId} className="font-black text-white text-base">
              {isES
                ? `Slot ${slotIndex + 1} — Elige un Pokémon`
                : `Slot ${slotIndex + 1} — Choose a Pokémon`}
            </h2>
            <p className="text-slate-600 text-xs mt-0.5">
              {isES ? 'Haz clic para añadir al equipo' : 'Click to add to team'}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label={isES ? 'Cerrar' : 'Close'}
            className="text-slate-500 hover:text-white transition-colors text-lg leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-white/5 flex-shrink-0">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 text-sm pointer-events-none">
              🔍
            </span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isES ? 'Buscar por nombre o número...' : 'Search by name or number...'}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none"
              style={{
                background: 'rgba(30,41,59,0.8)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              autoComplete="off"
            />
          </div>
        </div>

        {/* Results grid */}
        <div className="overflow-y-auto flex-1 p-3 grid grid-cols-4 sm:grid-cols-6 gap-2">
          {results.map((entry) => {
            const alreadyInTeam = teamIds.includes(entry.id)
            return (
              <button
                key={entry.id}
                onClick={() => !alreadyInTeam && onSelect(slotIndex, entry.id)}
                disabled={alreadyInTeam}
                className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all text-center group/item"
                style={{
                  background: alreadyInTeam
                    ? 'rgba(255,255,255,0.02)'
                    : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${alreadyInTeam ? 'transparent' : 'rgba(255,255,255,0.07)'}`,
                  opacity: alreadyInTeam ? 0.35 : 1,
                  cursor: alreadyInTeam ? 'not-allowed' : 'pointer',
                }}
              >
                <img
                  src={getSpriteUrl(entry.id)}
                  alt={entry.name}
                  width={48}
                  height={48}
                  className="object-contain group-hover/item:scale-110 transition-transform"
                  style={{ imageRendering: 'pixelated' }}
                />
                <span className="text-[9px] text-slate-400 capitalize leading-tight truncate w-full">
                  {entry.name.replace(/-/g, ' ')}
                </span>
                <span className="font-pixel text-[8px] text-slate-700">
                  #{String(entry.id).padStart(3, '0')}
                </span>
              </button>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Team Type Analysis ───────────────────────────────────────────────────────

interface TypeCoverage {
  weak: number
  veryWeak: number
  resist: number
  veryResist: number
  immune: number
  // per-slot effectiveness for dot visualization
  slots: number[]
}

function TeamTypeAnalysis({
  teamPokemon,
  teamIds,
  language,
}: {
  teamPokemon: Pokemon[]
  teamIds: (number | null)[]
  language: 'en' | 'es'
}) {
  const isES = language === 'es'

  const coverage: Record<string, TypeCoverage> = {}

  for (const atkType of ALL_TYPES) {
    const slotEffectiveness: number[] = []
    let weak = 0, veryWeak = 0, resist = 0, veryResist = 0, immune = 0

    // Build slot array based on teamIds order (null slots get mult=1)
    for (const id of teamIds) {
      if (id === null) {
        slotEffectiveness.push(1)
        continue
      }
      const pokemon = teamPokemon.find((p) => p.id === id)
      if (!pokemon) { slotEffectiveness.push(1); continue }
      const defTypes = pokemon.types.map((t) => t.type.name)
      const mult = getDefEffectiveness(atkType, defTypes)
      slotEffectiveness.push(mult)
      if (mult === 0) immune++
      else if (mult <= 0.25) { resist++; veryResist++ }
      else if (mult <= 0.5) resist++
      else if (mult >= 4) { weak++; veryWeak++ }
      else if (mult >= 2) weak++
    }

    coverage[atkType] = { weak, veryWeak, resist, veryResist, immune, slots: slotEffectiveness }
  }

  // Sort: most dangerous first
  const sorted = ALL_TYPES.slice().sort((a, b) => {
    const ca = coverage[a]
    const cb = coverage[b]
    const scoreA = ca.veryWeak * 3 + ca.weak - ca.resist - ca.veryResist - ca.immune * 2
    const scoreB = cb.veryWeak * 3 + cb.weak - cb.resist - cb.veryResist - cb.immune * 2
    return scoreB - scoreA
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-6"
      style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <h2 className="font-black text-white text-xl mb-1">
        {isES ? '🛡️ Cobertura Defensiva del Equipo' : '🛡️ Team Defensive Coverage'}
      </h2>
      <p className="text-slate-500 text-xs mb-6">
        {isES
          ? 'Ordenado por peligrosidad. Cada punto representa un miembro del equipo.'
          : 'Sorted by danger. Each dot represents a team member.'}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {sorted.map((atkType) => {
          const c = coverage[atkType]
          const tc = TYPE_COLORS[atkType] ?? '#A8A878'
          const typeName = isES ? (TYPE_NAMES_ES[atkType] ?? atkType) : atkType
          const icon = TYPE_ICONS[atkType] ?? ''

          let borderColor = 'rgba(255,255,255,0.06)'
          let bgColor = 'rgba(15,23,42,0.5)'
          if (c.veryWeak > 0) { borderColor = 'rgba(239,68,68,0.35)'; bgColor = 'rgba(239,68,68,0.07)' }
          else if (c.weak >= 2) { borderColor = 'rgba(249,115,22,0.35)'; bgColor = 'rgba(249,115,22,0.07)' }
          else if (c.weak === 1) { borderColor = 'rgba(234,179,8,0.3)'; bgColor = 'rgba(234,179,8,0.05)' }
          else if (c.immune > 0) { borderColor = 'rgba(167,139,250,0.35)'; bgColor = 'rgba(167,139,250,0.07)' }
          else if (c.veryResist > 0) { borderColor = 'rgba(34,211,238,0.3)'; bgColor = 'rgba(34,211,238,0.05)' }
          else if (c.resist > 0) { borderColor = 'rgba(74,222,128,0.3)'; bgColor = 'rgba(74,222,128,0.05)' }

          return (
            <div
              key={atkType}
              className="rounded-xl p-3 flex flex-col gap-2"
              style={{ background: bgColor, border: `1px solid ${borderColor}` }}
            >
              {/* Type header */}
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm flex-shrink-0">{icon}</span>
                <span className="text-[11px] font-black uppercase tracking-wide truncate" style={{ color: tc }}>
                  {typeName}
                </span>
              </div>

              {/* Team dots */}
              <div className="flex gap-1 flex-wrap">
                {c.slots.map((mult, i) => {
                  const slotId = teamIds[i]
                  if (slotId === null) {
                    return (
                      <span
                        key={i}
                        className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                        title={`Slot ${i + 1}: empty`}
                      />
                    )
                  }
                  let dotColor = 'rgba(100,116,139,0.5)'
                  let dotTitle = `×1`
                  if (mult === 0) { dotColor = '#a78bfa'; dotTitle = '×0 (immune)' }
                  else if (mult <= 0.25) { dotColor = '#22d3ee'; dotTitle = '¼×' }
                  else if (mult <= 0.5) { dotColor = '#4ade80'; dotTitle = '½×' }
                  else if (mult >= 4) { dotColor = '#ef4444'; dotTitle = '×4' }
                  else if (mult >= 2) { dotColor = '#f97316'; dotTitle = '×2' }

                  const pokemon = teamPokemon.find((p) => p.id === slotId)
                  return (
                    <span
                      key={i}
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                      style={{ background: dotColor }}
                      title={`${pokemon?.name ?? `Slot ${i + 1}`}: ${dotTitle}`}
                    />
                  )
                })}
              </div>

              {/* Count badges */}
              <div className="flex flex-wrap gap-1 min-h-[18px]">
                {c.veryWeak > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black tabular-nums"
                    style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>
                    ×4 {c.veryWeak}
                  </span>
                )}
                {(c.weak - c.veryWeak) > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black tabular-nums"
                    style={{ background: 'rgba(249,115,22,0.2)', color: '#f97316' }}>
                    ×2 {c.weak - c.veryWeak}
                  </span>
                )}
                {(c.resist - c.veryResist) > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black tabular-nums"
                    style={{ background: 'rgba(74,222,128,0.2)', color: '#4ade80' }}>
                    ½ {c.resist - c.veryResist}
                  </span>
                )}
                {c.veryResist > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black tabular-nums"
                    style={{ background: 'rgba(34,211,238,0.2)', color: '#22d3ee' }}>
                    ¼ {c.veryResist}
                  </span>
                )}
                {c.immune > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black tabular-nums"
                    style={{ background: 'rgba(167,139,250,0.2)', color: '#a78bfa' }}>
                    ×0 {c.immune}
                  </span>
                )}
                {c.weak === 0 && c.resist === 0 && c.immune === 0 && (
                  <span className="text-[9px] text-slate-700 font-bold">—</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-6 pt-4 border-t border-white/5">
        {[
          { color: '#ef4444', label: isES ? 'Muy débil ×4' : 'Very Weak ×4' },
          { color: '#f97316', label: isES ? 'Débil ×2' : 'Weak ×2' },
          { color: '#4ade80', label: isES ? 'Resiste ½' : 'Resists ½' },
          { color: '#22d3ee', label: isES ? 'Resiste ¼' : 'Resists ¼' },
          { color: '#a78bfa', label: isES ? 'Inmune ×0' : 'Immune ×0' },
          { color: 'rgba(100,116,139,0.5)', label: isES ? 'Neutral' : 'Neutral' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
            {label}
          </div>
        ))}
      </div>

      {/* Summary callouts */}
      <TeamWeaknessSummary coverage={coverage} teamPokemon={teamPokemon} language={language} />
    </motion.div>
  )
}

// ─── Weakness Summary ─────────────────────────────────────────────────────────

function TeamWeaknessSummary({
  coverage,
  teamPokemon,
  language,
}: {
  coverage: Record<string, TypeCoverage>
  teamPokemon: Pokemon[]
  language: 'en' | 'es'
}) {
  const isES = language === 'es'
  if (teamPokemon.length === 0) return null

  const dangerous = ALL_TYPES.filter((t) => coverage[t].weak >= 2 || coverage[t].veryWeak >= 1)
    .sort((a, b) => {
      const ca = coverage[a], cb = coverage[b]
      return (cb.veryWeak * 2 + cb.weak) - (ca.veryWeak * 2 + ca.weak)
    })
    .slice(0, 5)

  const covered = ALL_TYPES.filter((t) => coverage[t].immune >= 1 || coverage[t].veryResist >= 2)
    .slice(0, 5)

  if (dangerous.length === 0 && covered.length === 0) return null

  return (
    <div className="mt-5 grid sm:grid-cols-2 gap-4">
      {dangerous.length > 0 && (
        <div className="rounded-xl p-4" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-3">
            {isES ? '⚠️ Principales debilidades' : '⚠️ Main Vulnerabilities'}
          </p>
          <div className="flex flex-wrap gap-2">
            {dangerous.map((t) => {
              const tc = TYPE_COLORS[t] ?? '#A8A878'
              const name = isES ? (TYPE_NAMES_ES[t] ?? t) : t
              const c = coverage[t]
              return (
                <div key={t} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-black"
                  style={{ background: `${tc}18`, border: `1px solid ${tc}40`, color: tc }}>
                  <span>{TYPE_ICONS[t]}</span>
                  <span className="uppercase tracking-wide">{name}</span>
                  {c.veryWeak > 0 && <span className="text-red-400 text-[9px]">×4</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}
      {covered.length > 0 && (
        <div className="rounded-xl p-4" style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)' }}>
          <p className="text-[10px] font-black uppercase tracking-widest text-green-400 mb-3">
            {isES ? '✅ Buenas coberturas' : '✅ Good Coverage'}
          </p>
          <div className="flex flex-wrap gap-2">
            {covered.map((t) => {
              const tc = TYPE_COLORS[t] ?? '#A8A878'
              const name = isES ? (TYPE_NAMES_ES[t] ?? t) : t
              const c = coverage[t]
              return (
                <div key={t} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-black"
                  style={{ background: `${tc}18`, border: `1px solid ${tc}40`, color: tc }}>
                  <span>{TYPE_ICONS[t]}</span>
                  <span className="uppercase tracking-wide">{name}</span>
                  {c.immune > 0 && <span className="text-purple-400 text-[9px]">×0</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Team Stats Comparison ────────────────────────────────────────────────────

function TeamStatsComparison({
  teamPokemon,
  language,
}: {
  teamPokemon: Pokemon[]
  language: 'en' | 'es'
}) {
  const isES = language === 'es'
  if (teamPokemon.length === 0) return null

  const statLabels: Record<string, string> = isES
    ? { hp: 'PS', attack: 'ATQ', defense: 'DEF', 'special-attack': 'ATQ.E', 'special-defense': 'DEF.E', speed: 'VEL' }
    : { hp: 'HP', attack: 'ATK', defense: 'DEF', 'special-attack': 'SP.ATK', 'special-defense': 'SP.DEF', speed: 'SPD' }

  const totals = teamPokemon.map((p) => p.stats.reduce((acc, s) => acc + s.base_stat, 0))
  const maxTotal = Math.max(...totals)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-6"
      style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <h2 className="font-black text-white text-xl mb-6">
        {isES ? '📊 Comparación de Estadísticas' : '📊 Stats Comparison'}
      </h2>

      {/* Pokemon headers */}
      <div className="flex items-end gap-2 mb-4">
        <span className="w-16 flex-shrink-0" />
        <div className="flex-1 flex gap-2">
          {teamPokemon.map((pokemon) => {
            const primaryType = pokemon.types[0]?.type.name ?? 'normal'
            const typeCol = TYPE_COLORS[primaryType] ?? '#A8A878'
            return (
              <div key={pokemon.id} className="flex-1 flex flex-col items-center gap-1">
                <img
                  src={getSpriteUrl(pokemon.id)}
                  alt={pokemon.name}
                  width={36}
                  height={36}
                  className="object-contain"
                  style={{ imageRendering: 'pixelated' }}
                />
                <span
                  className="text-[8px] font-bold text-center capitalize truncate w-full leading-tight"
                  style={{ color: typeCol }}
                >
                  {pokemon.name.replace(/-/g, ' ').split(' ')[0]}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Stat rows */}
      <div className="space-y-3">
        {STAT_ORDER.map((statKey) => {
          const color = STAT_COLORS[statKey] ?? '#94a3b8'
          const label = statLabels[statKey] ?? statKey
          const values = teamPokemon.map(
            (p) => p.stats.find((s) => s.stat.name === statKey)?.base_stat ?? 0
          )
          const maxVal = Math.max(...values, 1)

          return (
            <div key={statKey} className="flex items-center gap-2">
              <span
                className="text-[10px] font-black w-16 text-right flex-shrink-0 tabular-nums"
                style={{ color: `${color}aa` }}
              >
                {label}
              </span>
              <div className="flex-1 flex gap-2 items-end">
                {teamPokemon.map((pokemon) => {
                  const val = pokemon.stats.find((s) => s.stat.name === statKey)?.base_stat ?? 0
                  const pct = Math.round((val / 255) * 100)
                  const isHighest = val === maxVal
                  const primaryType = pokemon.types[0]?.type.name ?? 'normal'
                  const typeCol = TYPE_COLORS[primaryType] ?? color

                  return (
                    <div key={pokemon.id} className="flex-1 flex flex-col gap-0.5">
                      <div
                        className="h-3 rounded-full overflow-hidden"
                        style={{ background: 'rgba(255,255,255,0.04)' }}
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.05 }}
                          className="h-full rounded-full"
                          style={{
                            background: isHighest ? typeCol : `${color}60`,
                            boxShadow: isHighest ? `0 0 6px ${typeCol}60` : 'none',
                          }}
                        />
                      </div>
                      <span
                        className="text-[9px] font-bold text-center tabular-nums"
                        style={{ color: isHighest ? typeCol : '#475569' }}
                      >
                        {val}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Totals */}
        <div className="flex items-center gap-2 pt-3 border-t border-white/5">
          <span className="text-[10px] font-black w-16 text-right text-slate-500 flex-shrink-0">
            {isES ? 'TOTAL' : 'TOTAL'}
          </span>
          <div className="flex-1 flex gap-2">
            {teamPokemon.map((pokemon, i) => {
              const total = totals[i]
              const primaryType = pokemon.types[0]?.type.name ?? 'normal'
              const typeCol = TYPE_COLORS[primaryType] ?? '#A8A878'
              const isHighest = total === maxTotal
              return (
                <div key={pokemon.id} className="flex-1 flex flex-col gap-0.5">
                  <div
                    className="h-3 rounded-full overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round((total / 780) * 100)}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{
                        background: isHighest ? typeCol : `${typeCol}50`,
                        boxShadow: isHighest ? `0 0 6px ${typeCol}60` : 'none',
                      }}
                    />
                  </div>
                  <span
                    className="text-[10px] font-black text-center tabular-nums"
                    style={{ color: isHighest ? typeCol : '#64748b' }}
                  >
                    {total}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Team averages */}
      <div className="mt-6 pt-4 border-t border-white/5">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-3">
          {isES ? 'Promedios del equipo' : 'Team Averages'}
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {STAT_ORDER.map((statKey) => {
            const color = STAT_COLORS[statKey] ?? '#94a3b8'
            const label = statLabels[statKey] ?? statKey
            const values = teamPokemon.map(
              (p) => p.stats.find((s) => s.stat.name === statKey)?.base_stat ?? 0
            )
            const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length)
            return (
              <div
                key={statKey}
                className="rounded-lg p-2 text-center"
                style={{ background: `${color}10`, border: `1px solid ${color}25` }}
              >
                <div className="text-[9px] font-black mb-1" style={{ color: `${color}99` }}>
                  {label}
                </div>
                <div className="text-base font-black" style={{ color }}>
                  {avg}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
