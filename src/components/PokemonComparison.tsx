'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { usePokemonDetail } from '@/hooks/usePokemonDetail'
import { usePokemonList } from '@/hooks/usePokemonList'
import { useAbilityDetail } from '@/hooks/useAbilityDetail'
import { getOfficialArtworkUrl, getSpriteUrl } from '@/lib/api'
import { usePokemonStore } from '@/store/pokemonStore'
import TypeBadge from '@/components/TypeBadge'
import LoadingSpinner from '@/components/LoadingSpinner'
import { TYPE_COLORS, STAT_COLORS, type Pokemon } from '@/types/pokemon'
import { T } from '@/lib/translations'

const STAT_ORDER = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed']
const MAX_STAT = 255
const MAX_SUGGESTIONS = 8

interface Props {
  pokemon: Pokemon
  typeColor: string
}

function AbilityPill({
  name, isHidden, accentColor, shared,
}: { name: string; isHidden: boolean; accentColor: string; shared: boolean }) {
  const language = usePokemonStore((s) => s.language)
  const { data } = useAbilityDetail(name)

  const localName =
    data?.names.find((n) => n.language.name === language)?.name ??
    data?.names.find((n) => n.language.name === 'en')?.name ??
    name.replace(/-/g, ' ')

  return (
    <div
      className="px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 font-semibold"
      style={{
        background: shared ? `${accentColor}18` : 'rgba(15,23,42,0.9)',
        border: `1px solid ${shared ? accentColor + '40' : 'rgba(255,255,255,0.06)'}`,
        color: shared ? accentColor : '#94a3b8',
      }}
    >
      <span className="truncate capitalize">{localName}</span>
      {isHidden && (
        <span
          className="text-[9px] px-1.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0"
          style={{ background: 'rgba(168,85,247,0.15)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.25)' }}
        >
          {language === 'es' ? 'Oculta' : 'Hidden'}
        </span>
      )}
    </div>
  )
}

export default function PokemonComparison({ pokemon, typeColor }: Props) {
  const [searchInput, setSearchInput] = useState('')
  const [compareId, setCompareId] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const language = usePokemonStore((s) => s.language)
  const t = T[language]

  const { data: pokemonList } = usePokemonList()
  const { data: comparePokemon, isLoading, isError } = usePokemonDetail(compareId)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
        setActiveIndex(-1)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const suggestions = searchInput.trim().length === 0 ? [] : (pokemonList ?? [])
    .filter((p) => {
      const q = searchInput.trim().toLowerCase()
      return p.name.includes(q) || String(p.id).startsWith(q)
    })
    .sort((a, b) => {
      const q = searchInput.trim().toLowerCase()
      const aStarts = a.name.startsWith(q) ? 0 : 1
      const bStarts = b.name.startsWith(q) ? 0 : 1
      return aStarts - bStarts || a.id - b.id
    })
    .slice(0, MAX_SUGGESTIONS)

  const handleSelect = (name: string) => {
    setSearchInput(name)
    setCompareId(name)
    setShowSuggestions(false)
    setActiveIndex(-1)
  }

  const handleSearch = () => {
    const trimmed = searchInput.trim().toLowerCase()
    if (!trimmed) return
    setCompareId(trimmed)
    setShowSuggestions(false)
    setActiveIndex(-1)
  }

  const handleInputChange = (value: string) => {
    setSearchInput(value)
    setShowSuggestions(value.trim().length > 0)
    setActiveIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') handleSearch()
      return
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, -1))
        break
      case 'Enter':
        e.preventDefault()
        if (activeIndex >= 0 && suggestions[activeIndex]) {
          handleSelect(suggestions[activeIndex].name)
        } else {
          handleSearch()
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setActiveIndex(-1)
        break
    }
  }

  const bTypeColor = comparePokemon
    ? (TYPE_COLORS[comparePokemon.types[0]?.type.name ?? 'normal'] ?? '#A8A878')
    : '#A8A878'

  const totalA = pokemon.stats.reduce((sum, s) => sum + s.base_stat, 0)
  const totalB = comparePokemon?.stats.reduce((sum, s) => sum + s.base_stat, 0) ?? 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="rounded-2xl p-6"
      style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <h2 className="font-black text-white text-xl mb-6 flex items-center gap-2">
        <span style={{ color: typeColor }}>⚔️</span>{' '}
        {language === 'es' ? 'Comparar Pokémon' : 'Compare Pokémon'}
      </h2>

      {/* Search with autocomplete */}
      <div ref={containerRef} className="relative flex gap-2 mb-6">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            placeholder={language === 'es' ? 'Nombre o # del Pokémon...' : 'Pokémon name or #...'}
            value={searchInput}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => searchInput.trim().length > 0 && setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none"
            style={{ background: 'rgba(30,41,59,0.8)', border: `1px solid ${showSuggestions && suggestions.length > 0 ? typeColor + '50' : 'rgba(255,255,255,0.1)'}` }}
          />

          {/* Dropdown */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, y: -4, scaleY: 0.95 }}
                animate={{ opacity: 1, y: 0, scaleY: 1 }}
                exit={{ opacity: 0, y: -4, scaleY: 0.95 }}
                transition={{ duration: 0.12 }}
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  right: 0,
                  zIndex: 50,
                  background: '#0f172a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '0.75rem',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
                  overflow: 'hidden',
                  transformOrigin: 'top',
                  listStyle: 'none',
                  margin: 0,
                  padding: '4px',
                }}
              >
                {suggestions.map((entry, i) => {
                  const isActive = i === activeIndex
                  return (
                    <li key={entry.id}>
                      <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); handleSelect(entry.name) }}
                        onMouseEnter={() => setActiveIndex(i)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left cursor-pointer transition-colors"
                        style={{
                          background: isActive ? `${typeColor}20` : 'transparent',
                          border: `1px solid ${isActive ? typeColor + '40' : 'transparent'}`,
                        }}
                      >
                        <img
                          src={getSpriteUrl(entry.id)}
                          alt={entry.name}
                          width={36}
                          height={36}
                          className="object-contain flex-shrink-0"
                          style={{ imageRendering: 'pixelated' }}
                        />
                        <span className="flex-1 text-sm font-semibold text-white capitalize truncate">
                          {entry.name.replace(/-/g, ' ')}
                        </span>
                        <span className="font-pixel text-[9px] flex-shrink-0"
                          style={{ color: isActive ? typeColor : '#475569' }}>
                          #{String(entry.id).padStart(3, '0')}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        {comparePokemon && (
          <motion.button
            onClick={() => { setCompareId(''); setSearchInput(''); setShowSuggestions(false) }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white cursor-pointer transition-colors flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            ✕
          </motion.button>
        )}
      </div>

      {/* Loading */}
      {isLoading && compareId && (
        <div className="flex justify-center py-8">
          <LoadingSpinner size={40} text={t.loadingPokemon} />
        </div>
      )}

      {/* Error */}
      {isError && !isLoading && (
        <div className="text-center py-6 text-sm" style={{ color: '#f87171' }}>
          {language === 'es'
            ? '❌ Pokémon no encontrado. Prueba otro nombre o número.'
            : '❌ Pokémon not found. Try another name or number.'}
        </div>
      )}

      {/* Comparison content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={comparePokemon?.id ?? 'empty'}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
        {comparePokemon && !isLoading && (
          <div className="space-y-8">
            {/* Pokemon headers */}
            <div className="grid items-center gap-2" style={{ gridTemplateColumns: '1fr 3rem 1fr' }}>
              {/* Pokemon A (current) */}
              <div className="flex flex-col items-center gap-2">
                <Image
                  src={getOfficialArtworkUrl(pokemon.id)}
                  alt={pokemon.name}
                  width={96}
                  height={96}
                  className="object-contain"
                  style={{ filter: `drop-shadow(0 4px 16px ${typeColor}55)` }}
                />
                <p className="font-black text-white capitalize text-sm text-center leading-tight">
                  {pokemon.name.replace(/-/g, ' ')}
                </p>
                <p className="font-pixel text-[9px]" style={{ color: typeColor }}>
                  #{String(pokemon.id).padStart(3, '0')}
                </p>
                <div className="flex gap-1 flex-wrap justify-center">
                  {pokemon.types.map((tp) => (
                    <TypeBadge key={tp.type.name} type={tp.type.name} size="sm" />
                  ))}
                </div>
              </div>

              {/* VS */}
              <div className="flex items-center justify-center">
                <span className="font-pixel text-[10px] text-slate-600">VS</span>
              </div>

              {/* Pokemon B (comparison) */}
              <div className="flex flex-col items-center gap-2">
                <Link href={`/pokemon/${comparePokemon.id}`} className="hover:opacity-80 transition-opacity">
                  <Image
                    src={getOfficialArtworkUrl(comparePokemon.id)}
                    alt={comparePokemon.name}
                    width={96}
                    height={96}
                    className="object-contain"
                    style={{ filter: `drop-shadow(0 4px 16px ${bTypeColor}55)` }}
                  />
                </Link>
                <p className="font-black text-white capitalize text-sm text-center leading-tight">
                  {comparePokemon.name.replace(/-/g, ' ')}
                </p>
                <p className="font-pixel text-[9px]" style={{ color: bTypeColor }}>
                  #{String(comparePokemon.id).padStart(3, '0')}
                </p>
                <div className="flex gap-1 flex-wrap justify-center">
                  {comparePokemon.types.map((tp) => (
                    <TypeBadge key={tp.type.name} type={tp.type.name} size="sm" />
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-white/5" />

            {/* Stats comparison */}
            <div>
              <p className="text-[10px] uppercase tracking-widest font-black mb-4" style={{ color: 'rgba(100,116,139,0.8)' }}>
                {t.stats}
              </p>
              <div className="space-y-3">
                {STAT_ORDER.map((statName, i) => {
                  const valA = pokemon.stats.find((s) => s.stat.name === statName)?.base_stat ?? 0
                  const valB = comparePokemon.stats.find((s) => s.stat.name === statName)?.base_stat ?? 0
                  const pctA = Math.min((valA / MAX_STAT) * 100, 100)
                  const pctB = Math.min((valB / MAX_STAT) * 100, 100)
                  const statColor = STAT_COLORS[statName] ?? '#9DB7F5'
                  const shortLabel = T[language].statLabels[statName] ?? statName
                  const aWins = valA > valB
                  const bWins = valB > valA

                  return (
                    <div key={statName} className="flex items-center gap-2">
                      <span className="w-7 text-right text-xs font-black tabular-nums"
                        style={{ color: aWins ? '#fff' : '#475569' }}>
                        {valA}
                      </span>
                      <div className="flex-1 relative h-2.5 rounded-full overflow-hidden"
                        style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <motion.div
                          className="absolute right-0 top-0 bottom-0 rounded-full"
                          style={{ background: aWins ? typeColor : `${statColor}55` }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pctA}%` }}
                          transition={{ duration: 1, delay: i * 0.08, ease: 'easeOut' }}
                        />
                      </div>
                      <span className="w-11 text-center text-[9px] uppercase tracking-wider font-black flex-shrink-0 text-slate-600">
                        {shortLabel}
                      </span>
                      <div className="flex-1 relative h-2.5 rounded-full overflow-hidden"
                        style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <motion.div
                          className="absolute left-0 top-0 bottom-0 rounded-full"
                          style={{ background: bWins ? bTypeColor : `${statColor}55` }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pctB}%` }}
                          transition={{ duration: 1, delay: i * 0.08, ease: 'easeOut' }}
                        />
                      </div>
                      <span className="w-7 text-left text-xs font-black tabular-nums"
                        style={{ color: bWins ? '#fff' : '#475569' }}>
                        {valB}
                      </span>
                    </div>
                  )
                })}

                {/* Total row */}
                <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                  <span className="w-7 text-right text-sm font-black tabular-nums"
                    style={{ color: totalA >= totalB ? '#fff' : '#475569' }}>
                    {totalA}
                  </span>
                  <div className="flex-1" />
                  <span className="w-11 text-center text-[9px] uppercase tracking-wider font-black flex-shrink-0"
                    style={{ color: typeColor }}>
                    {t.total}
                  </span>
                  <div className="flex-1" />
                  <span className="w-7 text-left text-sm font-black tabular-nums"
                    style={{ color: totalB > totalA ? '#fff' : '#475569' }}>
                    {totalB}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-white/5" />

            {/* Abilities comparison */}
            <div>
              <p className="text-[10px] uppercase tracking-widest font-black mb-4" style={{ color: 'rgba(100,116,139,0.8)' }}>
                {t.abilities}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  {pokemon.abilities.map((a) => (
                    <AbilityPill
                      key={a.ability.name}
                      name={a.ability.name}
                      isHidden={a.is_hidden}
                      accentColor={typeColor}
                      shared={comparePokemon.abilities.some((b) => b.ability.name === a.ability.name)}
                    />
                  ))}
                </div>
                <div className="space-y-2">
                  {comparePokemon.abilities.map((b) => (
                    <AbilityPill
                      key={b.ability.name}
                      name={b.ability.name}
                      isHidden={b.is_hidden}
                      accentColor={bTypeColor}
                      shared={pokemon.abilities.some((a) => a.ability.name === b.ability.name)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        </motion.div>
      </AnimatePresence>

      {/* Empty state */}
      {!compareId && !isLoading && (
        <p className="text-center py-8 text-sm text-slate-600">
          {language === 'es'
            ? 'Escribe el nombre o número de un Pokémon para comparar estadísticas, tipos y habilidades.'
            : 'Type a Pokémon name or number to compare stats, types, and abilities.'}
        </p>
      )}
    </motion.div>
  )
}
