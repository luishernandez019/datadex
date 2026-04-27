'use client'

import { use, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { usePokemonDetail } from '@/hooks/usePokemonDetail'
import { usePokemonSpecies, useEvolutionChainById } from '@/hooks/usePokemonSpecies'
import { useMoveTranslations } from '@/hooks/useMoveTranslations'
import { getEvolutionChainIdFromUrl, getOfficialArtworkUrl, getShinyArtworkUrl, fetchMoveDetail } from '@/lib/api'
import { usePokemonStore } from '@/store/pokemonStore'
import TypeBadge from '@/components/TypeBadge'
import StatBar from '@/components/StatBar'
import AbilityCard from '@/components/AbilityCard'
import EvolutionChain from '@/components/EvolutionChain'
import PokemonComparison from '@/components/PokemonComparison'
import TypeMatchup from '@/components/TypeMatchup'
import LoadingSpinner from '@/components/LoadingSpinner'
import { TYPE_COLORS } from '@/types/pokemon'
import type { MoveDetail } from '@/types/pokemon'
import { T } from '@/lib/translations'

interface Props {
  params: Promise<{ id: string }>
}

const STAT_ORDER = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed']

export default function PokemonDetailClient({ params }: Props) {
  const { id } = use(params)
  const [showShiny, setShowShiny] = useState(false)
  const [shinyAnimation, setShinyAnimation] = useState(false)
  const [activeTab, setActiveTab] = useState<'stats' | 'moves' | 'abilities'>('stats')
  const [moveSearch, setMoveSearch] = useState('')
  const [selectedMove, setSelectedMove] = useState<string | null>(null)

  const language = usePokemonStore((s) => s.language)
  const t = T[language]

  const { data: pokemon, isLoading } = usePokemonDetail(id)
  const { data: species, isLoading: isSpeciesLoading } = usePokemonSpecies(id)

  const evoChainId = species ? getEvolutionChainIdFromUrl(species.evolution_chain.url) : undefined
  const { data: evolutionChain, isLoading: isChainLoading } = useEvolutionChainById(evoChainId)
  const isEvoLoading = isSpeciesLoading || isChainLoading

  const levelMoves = pokemon?.moves
    .filter((m) => m.version_group_details.some((d) => d.move_learn_method.name === 'level-up'))
    .sort((a, b) => {
      const al = a.version_group_details.find((d) => d.move_learn_method.name === 'level-up')?.level_learned_at ?? 0
      const bl = b.version_group_details.find((d) => d.move_learn_method.name === 'level-up')?.level_learned_at ?? 0
      return al - bl
    }) ?? []

  const filteredMoves = pokemon?.moves
    .filter((m) => m.move.name.includes(moveSearch.toLowerCase()))
    .slice(0, 80) ?? []

  const moveSlugsToTranslate = moveSearch
    ? filteredMoves.map((m) => m.move.name)
    : levelMoves.map((m) => m.move.name)

  const moveNames = useMoveTranslations(moveSlugsToTranslate, language)

  useEffect(() => { setSelectedMove(null) }, [activeTab, moveSearch])

  const { data: moveDetail, isLoading: moveDetailLoading } = useQuery({
    queryKey: ['move', selectedMove],
    queryFn: () => fetchMoveDetail(selectedMove!),
    enabled: !!selectedMove,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size={80} text={t.loadingPokemon} />
      </div>
    )
  }
  if (!pokemon) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-5xl">😢</p>
          <p className="text-white font-black text-xl">Pokémon not found</p>
          <Link href="/" className="text-red-400 hover:text-red-300 text-sm">{t.backToPokedex}</Link>
        </div>
      </div>
    )
  }

  const primaryType   = pokemon.types[0]?.type.name ?? 'normal'
  const secondaryType = pokemon.types[1]?.type.name
  const typeColor     = TYPE_COLORS[primaryType]  ?? '#A8A878'
  const typeColor2    = secondaryType ? (TYPE_COLORS[secondaryType] ?? typeColor) : typeColor

  const description = (
    species?.flavor_text_entries.find((e) => e.language.name === language)?.flavor_text ??
    species?.flavor_text_entries.find((e) => e.language.name === 'en')?.flavor_text
  )?.replace(/\f|\n/g, ' ')

  const genus = (
    species?.genera.find((g) => g.language.name === language)?.genus ??
    species?.genera.find((g) => g.language.name === 'en')?.genus ?? ''
  )

  const total      = pokemon.stats.reduce((s, st) => s + st.base_stat, 0)
  const artworkUrl = showShiny ? getShinyArtworkUrl(pokemon.id) : getOfficialArtworkUrl(pokemon.id)

  const tabs = [
    { id: 'stats'     as const, icon: '📊', label: t.stats     },
    { id: 'abilities' as const, icon: '🎯', label: t.abilities },
    { id: 'moves'     as const, icon: '⚡', label: t.moves     },
  ]

  const genLabel = species?.generation.name
    .replace('generation-', 'Gen ')
    .toUpperCase()

  return (
    <div className="min-h-screen" style={{ background: '#0a0f1e' }}>
      {/* ── Hero ── */}
      <div className="relative overflow-hidden" style={{ minHeight: 480 }}>
        <div className="absolute inset-0" style={{
          background: `
            radial-gradient(ellipse 80% 100% at 70% 0%, ${typeColor}30 0%, transparent 60%),
            radial-gradient(ellipse 60% 80% at 30% 100%, ${typeColor2}18 0%, transparent 60%),
            linear-gradient(180deg, #0d1526 0%, #0a0f1e 100%)
          `,
        }} />
        <div className="absolute right-0 top-0 w-[600px] h-[600px] rounded-full -translate-y-1/3 translate-x-1/3 opacity-10"
          style={{ background: `radial-gradient(circle, ${typeColor}, transparent 70%)` }} aria-hidden="true" />
        <div className="absolute right-16 top-16 opacity-5" aria-hidden="true">
          <svg viewBox="0 0 200 200" className="w-72 h-72" aria-hidden="true">
            <circle cx="100" cy="100" r="98" fill="none" stroke="white" strokeWidth="5" />
            <path d="M 4 100 A 96 96 0 0 1 196 100" fill="white" fillOpacity="0.5" />
            <rect x="4" y="96" width="192" height="8" fill="white" />
            <circle cx="100" cy="100" r="24" fill="none" stroke="white" strokeWidth="5" />
            <circle cx="100" cy="100" r="12" fill="white" />
          </svg>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-0">
          {/* Back + nav */}
          <div className="flex items-center justify-between mb-4">
            <Link href="/">
              <motion.div whileHover={{ x: -4 }}
                className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold">
                {t.backToPokedex}
              </motion.div>
            </Link>
            <div className="flex gap-2">
              {pokemon.id > 1 && (
                <Link href={`/pokemon/${pokemon.id - 1}`}
                  aria-label={`Previous Pokémon — #${String(pokemon.id - 1).padStart(3, '0')}`}>
                  <motion.span whileHover={{ scale: 1.05 }}
                    className="px-3 py-1.5 rounded-lg text-slate-500 hover:text-white text-xs transition-colors cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
                    aria-hidden="true">
                    ← #{String(pokemon.id - 1).padStart(3, '0')}
                  </motion.span>
                </Link>
              )}
              <Link href={`/pokemon/${pokemon.id + 1}`}
                aria-label={`Next Pokémon — #${String(pokemon.id + 1).padStart(3, '0')}`}>
                <motion.span whileHover={{ scale: 1.05 }}
                  className="px-3 py-1.5 rounded-lg text-slate-500 hover:text-white text-xs transition-colors cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
                  aria-hidden="true">
                  #{String(pokemon.id + 1).padStart(3, '0')} →
                </motion.span>
              </Link>
            </div>
          </div>

          {/* Main hero layout */}
          <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-end">
            {/* Artwork */}
            <div className="relative flex-shrink-0 self-center lg:self-end">
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-52 h-12 rounded-full blur-2xl opacity-40"
                style={{ background: typeColor }} />

              <div aria-hidden="true"><ShinySparkles active={shinyAnimation} /></div>

              <motion.div animate={{ y: [0, -16, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
                <motion.div
                  className="relative"
                  animate={shinyAnimation ? { scale: [1, 1.09, 0.96, 1] } : { scale: 1 }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                >
                  <AnimatePresence>
                    {shinyAnimation && (
                      <motion.div
                        className="absolute inset-0 pointer-events-none z-10"
                        style={{ borderRadius: '50%', background: 'radial-gradient(circle, rgba(253,224,71,0.65) 0%, transparent 65%)' }}
                        initial={{ opacity: 0, scale: 0.4 }}
                        animate={{ opacity: [0, 1, 0], scale: [0.4, 1.3, 2] }}
                        exit={{}}
                        transition={{ duration: 0.55, ease: 'easeOut' }}
                      />
                    )}
                  </AnimatePresence>
                  <Image
                    src={artworkUrl}
                    alt={`${pokemon.name.replace(/-/g, ' ')} official artwork`}
                    width={300}
                    height={300}
                    className="object-contain drop-shadow-2xl"
                    style={{ filter: `drop-shadow(0 20px 40px ${typeColor}55)` }}
                    priority
                  />
                </motion.div>
              </motion.div>

              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const next = !showShiny
                  setShowShiny(next)
                  if (next) {
                    setShinyAnimation(true)
                    setTimeout(() => setShinyAnimation(false), 1400)
                  }
                }}
                aria-label={showShiny ? 'Showing shiny variant — click to show normal' : 'Show shiny variant'}
                aria-pressed={showShiny}
                className="absolute bottom-4 right-0 px-3 py-1.5 rounded-full text-[11px] font-bold cursor-pointer transition-all"
                style={showShiny
                  ? { background: 'rgba(250,204,21,0.2)', border: '1px solid rgba(250,204,21,0.5)', color: '#fde047' }
                  : { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }
                }
              >
                ✨ {showShiny ? t.shiny : t.normal}
              </motion.button>
            </div>

            {/* Info */}
            <div className="flex-1 pb-8">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="font-pixel text-xs" style={{ color: typeColor }}>
                  #{String(pokemon.id).padStart(3, '0')}
                </span>
                {species?.is_legendary && <Badge color="#fbbf24">⭐ {t.legendary}</Badge>}
                {species?.is_mythical  && <Badge color="#a78bfa">✨ {t.mythical}</Badge>}
                {species?.is_baby      && <Badge color="#fb7185">🍼 {t.baby}</Badge>}
              </div>

              <h1 className="font-black capitalize mb-1 leading-none text-white"
                style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)' }}>
                {pokemon.name.replace(/-/g, ' ')}
              </h1>
              {genus && <p className="text-slate-500 text-sm italic mb-4">{genus}</p>}

              <div className="flex gap-2 mb-5 flex-wrap">
                {pokemon.types.map((tp) => <TypeBadge key={tp.type.name} type={tp.type.name} size="lg" />)}
              </div>

              {description && (
                <div className="max-w-xl mb-6 p-4 rounded-2xl text-sm leading-relaxed text-slate-300"
                  style={{ background: `${typeColor}0f`, border: `1px solid ${typeColor}25` }}>
                  {description}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {[
                  { label: t.height,     value: `${(pokemon.height / 10).toFixed(1)} m` },
                  { label: t.weight,     value: `${(pokemon.weight / 10).toFixed(1)} kg` },
                  { label: t.baseXP,     value: String(pokemon.base_experience ?? '?') },
                  { label: t.generation, value: genLabel ?? '?' },
                  { label: t.habitat,    value: species?.habitat?.name ?? (language === 'es' ? 'Desconocido' : 'Unknown') },
                  { label: t.catchRate,  value: species ? `${Math.round((species.capture_rate / 255) * 100)}%` : '?' },
                ].map(({ label, value }) => (
                  <div key={label} className="px-3 py-2 rounded-xl text-center"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <p className="text-slate-600 text-[9px] uppercase tracking-wider mb-0.5">{label}</p>
                    <p className="text-white font-bold text-xs capitalize">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 p-1 rounded-2xl w-fit"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {tabs.map((tab) => {
            const active = activeTab === tab.id
            return (
              <motion.button key={tab.id} onClick={() => setActiveTab(tab.id)}
                whileHover={{ scale: active ? 1 : 1.03 }} whileTap={{ scale: 0.97 }}
                className="px-5 py-2 rounded-xl font-bold text-sm cursor-pointer transition-all"
                style={active
                  ? { background: typeColor, color: '#fff', boxShadow: `0 4px 20px ${typeColor}55` }
                  : { color: '#64748b' }
                }>
                {tab.icon} {tab.label}
              </motion.button>
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>

            {/* ── Stats ── */}
            {activeTab === 'stats' && (
              <div className="rounded-2xl p-6 space-y-4"
                style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-black text-white text-xl">{t.stats}</h2>
                  <div className="px-4 py-1.5 rounded-full font-black text-sm"
                    style={{ background: `${typeColor}20`, color: typeColor, border: `1px solid ${typeColor}40` }}>
                    {t.total}: {total}
                  </div>
                </div>
                {STAT_ORDER.map((statName, i) => {
                  const s = pokemon.stats.find((x) => x.stat.name === statName)
                  if (!s) return null
                  return <StatBar key={statName} statName={statName} value={s.base_stat} delay={i * 0.1} />
                })}
              </div>
            )}

            {/* ── Abilities ── */}
            {activeTab === 'abilities' && (
              <div className="space-y-3">
                <h2 className="font-black text-white text-xl mb-4">{t.abilities}</h2>
                {pokemon.abilities.map((a, i) => (
                  <AbilityCard
                    key={a.ability.name}
                    name={a.ability.name}
                    isHidden={a.is_hidden}
                    index={i}
                    typeColor={typeColor}
                    delay={i * 0.1}
                  />
                ))}
              </div>
            )}

            {/* ── Moves ── */}
            {activeTab === 'moves' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <h2 className="font-black text-white text-xl">
                    {t.moves} <span className="text-slate-600 font-normal text-base">({pokemon.moves.length})</span>
                  </h2>
                  <input type="text" placeholder={t.searchMoves}
                    value={moveSearch} onChange={(e) => setMoveSearch(e.target.value)}
                    className="px-4 py-2 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none w-48"
                    style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}
                  />
                </div>

                {/* Move detail popup */}
                <AnimatePresence>
                  {selectedMove && (
                    <MoveDetailCard
                      slug={selectedMove}
                      displayName={moveNames.get(selectedMove) ?? selectedMove.replace(/-/g, ' ')}
                      detail={moveDetail}
                      isLoading={moveDetailLoading}
                      onClose={() => setSelectedMove(null)}
                      language={language}
                      typeColor={typeColor}
                    />
                  )}
                </AnimatePresence>

                {!moveSearch ? (
                  <div>
                    <p className="text-slate-600 text-xs uppercase tracking-widest mb-3 font-bold">{t.learnedByLevelUp}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {levelMoves.map((m, i) => {
                        const lvl = m.version_group_details.find((d) => d.move_learn_method.name === 'level-up')?.level_learned_at ?? 0
                        const displayName = moveNames.get(m.move.name) ?? m.move.name.replace(/-/g, ' ')
                        const isSelected = selectedMove === m.move.name
                        return (
                          <motion.div key={m.move.name}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            transition={{ delay: Math.min(i * 0.015, 0.5) }}
                            onClick={() => setSelectedMove(isSelected ? null : m.move.name)}
                            className="flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-colors"
                            style={{
                              background: isSelected ? `${typeColor}18` : 'rgba(15,23,42,0.9)',
                              border: isSelected ? `1px solid ${typeColor}55` : '1px solid rgba(255,255,255,0.06)',
                            }}>
                            <span className={`text-xs font-semibold capitalize truncate mr-2 ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                              {displayName}
                            </span>
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full whitespace-nowrap"
                              style={{ background: `${typeColor}20`, color: typeColor }}>
                              {lvl === 0 ? '—' : `Lv${lvl}`}
                            </span>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {filteredMoves.map((m) => {
                      const isSelected = selectedMove === m.move.name
                      return (
                        <div key={m.move.name}
                          onClick={() => setSelectedMove(isSelected ? null : m.move.name)}
                          className="px-3 py-2 rounded-xl cursor-pointer transition-colors"
                          style={{
                            background: isSelected ? `${typeColor}18` : 'rgba(15,23,42,0.9)',
                            border: isSelected ? `1px solid ${typeColor}55` : '1px solid rgba(255,255,255,0.06)',
                          }}>
                          <span className={`text-xs capitalize ${isSelected ? 'text-white font-semibold' : 'text-slate-300'}`}>
                            {moveNames.get(m.move.name) ?? m.move.name.replace(/-/g, ' ')}
                          </span>
                        </div>
                      )
                    })}
                    {filteredMoves.length === 0 && (
                      <p className="col-span-full text-center text-slate-600 py-8">
                        {language === 'es' ? 'No se encontraron movimientos.' : 'No moves found.'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* ── Type Matchups ── */}
        <TypeMatchup types={pokemon.types} typeColor={typeColor} />

        {/* ── Evolution Chain ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-2xl p-6"
          style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="font-black text-white text-xl mb-6 flex items-center gap-2">
            <span style={{ color: typeColor }}>🔄</span>{' '}
            {language === 'es' ? 'Cadena Evolutiva' : 'Evolution Chain'}
          </h2>
          {isEvoLoading
            ? <div className="flex justify-center py-4"><LoadingSpinner size={40} text="Loading..." /></div>
            : evolutionChain
              ? <EvolutionChain chain={evolutionChain} currentPokemonId={pokemon.id} />
              : <p className="text-slate-600 text-sm text-center py-4 italic">{t.noEvolution}</p>
          }
        </motion.div>

        {/* ── Comparison ── */}
        <PokemonComparison pokemon={pokemon} typeColor={typeColor} />
      </div>
    </div>
  )
}

function MoveDetailCard({
  slug, displayName, detail, isLoading, onClose, language, typeColor,
}: {
  slug: string
  displayName: string
  detail: MoveDetail | undefined
  isLoading: boolean
  onClose: () => void
  language: string
  typeColor: string
}) {
  const moveTypeColor = detail ? (TYPE_COLORS[detail.type.name] ?? '#A8A878') : typeColor

  const description = (() => {
    if (!detail) return ''
    const lang = language === 'es' ? 'es' : 'en'
    const flavor =
      detail.flavor_text_entries.filter((e) => e.language.name === lang).at(-1)?.flavor_text ??
      detail.flavor_text_entries.filter((e) => e.language.name === 'en').at(-1)?.flavor_text
    const shortFx =
      detail.effect_entries.find((e) => e.language.name === lang)?.short_effect ??
      detail.effect_entries.find((e) => e.language.name === 'en')?.short_effect
    return (flavor ?? shortFx ?? '')
      .replace(/\f|\n/g, ' ')
      .replace(/\$effect_chance/g, String(detail.effect_chance ?? ''))
  })()

  const dcLabel: Record<string, string> = {
    physical: language === 'es' ? 'Físico' : 'Physical',
    special:  language === 'es' ? 'Especial' : 'Special',
    status:   language === 'es' ? 'Estado' : 'Status',
  }

  const stats = detail ? [
    { label: language === 'es' ? 'Poder'     : 'Power',    value: detail.power    ?? '—' },
    { label: language === 'es' ? 'Precisión' : 'Accuracy', value: detail.accuracy != null ? `${detail.accuracy}%` : '—' },
    { label: 'PP',                                          value: detail.pp       ?? '—' },
  ] : []

  return (
    <motion.div
      key={slug}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18 }}
      className="rounded-2xl p-4"
      style={{ background: `${moveTypeColor}0e`, border: `1px solid ${moveTypeColor}40` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-white font-black text-sm capitalize">{displayName}</span>
          {detail && (
            <>
              <TypeBadge type={detail.type.name} size="sm" />
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold capitalize"
                style={{ background: 'rgba(255,255,255,0.07)', color: '#94a3b8' }}>
                {dcLabel[detail.damage_class.name] ?? detail.damage_class.name}
              </span>
            </>
          )}
        </div>
        <button onClick={onClose} aria-label="Close move detail"
          className="text-slate-500 hover:text-white transition-colors leading-none flex-shrink-0 text-base">
          ✕
        </button>
      </div>

      {isLoading && (
        <p className="text-slate-500 text-xs">{language === 'es' ? 'Cargando...' : 'Loading...'}</p>
      )}

      {detail && (
        <>
          {/* Power / Accuracy / PP */}
          {stats.some((s) => s.value !== '—') && (
            <div className="flex gap-2 mb-3">
              {stats.map(({ label, value }) => (
                <div key={label} className="text-center px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wide mb-0.5">{label}</p>
                  <p className="text-white font-black text-sm tabular-nums">{value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Description */}
          {description && (
            <p className="text-slate-300 text-xs leading-relaxed">{description}</p>
          )}
        </>
      )}
    </motion.div>
  )
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-black"
      style={{ background: `${color}20`, border: `1px solid ${color}44`, color }}>
      {children}
    </span>
  )
}

const SPARKLE_POSITIONS = [
  { x: 140,  y: 0,    delay: 0,    size: 22 },
  { x: 99,   y: 99,   delay: 0.07, size: 16 },
  { x: 0,    y: 140,  delay: 0.12, size: 20 },
  { x: -99,  y: 99,   delay: 0.05, size: 14 },
  { x: -140, y: 0,    delay: 0.10, size: 24 },
  { x: -99,  y: -99,  delay: 0.14, size: 18 },
  { x: 0,    y: -140, delay: 0.03, size: 20 },
  { x: 99,   y: -99,  delay: 0.09, size: 16 },
  { x: 129,  y: 53,   delay: 0.06, size: 12 },
  { x: -53,  y: 129,  delay: 0.16, size: 14 },
  { x: -129, y: -53,  delay: 0.11, size: 12 },
  { x: 53,   y: -129, delay: 0.04, size: 15 },
]

function StarIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path
        d="M12 1 L13.5 10.5 L23 12 L13.5 13.5 L12 23 L10.5 13.5 L1 12 L10.5 10.5 Z"
        fill="#fde047"
        stroke="#fbbf24"
        strokeWidth="0.3"
      />
    </svg>
  )
}

function ShinySparkles({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && SPARKLE_POSITIONS.map((s, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: s.size,
            height: s.size,
            marginLeft: -s.size / 2,
            marginTop: -s.size / 2,
            pointerEvents: 'none',
            zIndex: 20,
          }}
          initial={{ scale: 0, opacity: 0, x: s.x * 0.4, y: s.y * 0.4 }}
          animate={{
            scale: [0, 1.4, 1, 0],
            opacity: [0, 1, 0.8, 0],
            x: [s.x * 0.4, s.x, s.x * 1.15],
            y: [s.y * 0.4, s.y, s.y * 1.15],
          }}
          exit={{}}
          transition={{ duration: 0.9, delay: s.delay, ease: 'easeOut' }}
        >
          <StarIcon size={s.size} />
        </motion.div>
      ))}
    </AnimatePresence>
  )
}
