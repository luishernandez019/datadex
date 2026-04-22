'use client'

import { useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { usePokemonStore } from '@/store/pokemonStore'
import { usePokemonList } from '@/hooks/usePokemonList'
import { usePokemonPageDetails } from '@/hooks/usePokemonDetail'
import { useAllPokemonLoader } from '@/hooks/useAllPokemonLoader'
import { getSpriteUrl } from '@/lib/api'
import TypeBadge from './TypeBadge'
import Pagination from './Pagination'
import LoadingSpinner from './LoadingSpinner'
import { TYPE_COLORS } from '@/types/pokemon'
import { T, GEN_RANGES, TYPE_NAMES_ES } from '@/lib/translations'
import type { Pokemon, SortField } from '@/types/pokemon'

const POKEMON_TYPES = [
  'fire','water','grass','electric','psychic','ice','dragon',
  'dark','fairy','normal','fighting','flying','poison','ground',
  'rock','bug','ghost','steel',
]

const STAT_COLORS: Record<string, string> = {
  hp:               '#FF5959',
  attack:           '#F5AC78',
  defense:          '#FAE078',
  'special-attack': '#9DB7F5',
  'special-defense':'#A7DB8D',
  speed:            '#FA92B2',
}

const STAT_FIELDS = new Set<SortField>(['hp','attack','defense','special-attack','special-defense','speed','total'])

function getStat(p: Pokemon, name: string) {
  return p.stats.find((s) => s.stat.name === name)?.base_stat ?? 0
}
function getTotal(p: Pokemon) {
  return p.stats.reduce((s, st) => s + st.base_stat, 0)
}
function primaryColor(p: Pokemon) {
  return TYPE_COLORS[p.types[0]?.type.name ?? 'normal'] ?? '#A8A878'
}

function SortBtn({ field, active, order }: { field: SortField; active: SortField; order: 'asc' | 'desc' }) {
  const isActive = field === active
  return (
    <span className={`ml-1 text-[9px] transition-opacity ${isActive ? 'opacity-100' : 'opacity-25'}`}>
      {isActive ? (order === 'asc' ? '▲' : '▼') : '⇅'}
    </span>
  )
}

function SkeletonRow() {
  return (
    <tr className="border-b border-white/[0.04]">
      <td className="px-3 py-3"><div className="w-12 h-12 rounded-xl skeleton" /></td>
      <td className="px-3 py-3"><div className="h-3 w-10 rounded skeleton" /></td>
      <td className="px-3 py-3"><div className="h-4 w-28 rounded skeleton" /></td>
      <td className="px-3 py-3">
        <div className="flex gap-1">
          <div className="h-5 w-14 rounded-full skeleton" />
          <div className="h-5 w-14 rounded-full skeleton" />
        </div>
      </td>
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-3 py-3"><div className="h-4 w-8 rounded skeleton mx-auto" /></td>
      ))}
    </tr>
  )
}

function StatNum({ value, stat }: { value: number; stat: string }) {
  const color = STAT_COLORS[stat] ?? '#9DB7F5'
  const max   = stat === 'hp' ? 255 : 190
  const opacity = 0.5 + Math.min(value / max, 1) / 2
  return (
    <td className="px-2 py-0 text-center w-14">
      <span className="font-bold text-sm tabular-nums" style={{ color, opacity }}>{value}</span>
    </td>
  )
}

export default function PokemonTable() {
  const {
    sortField, sortOrder, searchQuery, typeFilter, generationFilter,
    currentPage, itemsPerPage, pokemonCache,
    toggleSort, setSearchQuery, setTypeFilter, setCurrentPage,
    language, loadAllStats, setLoadAllStats,
  } = usePokemonStore()

  const t = T[language]
  const router = useRouter()

  const columns: { key: SortField; label: string }[] = [
    { key: 'id',              label: t.colId    },
    { key: 'name',            label: t.colName  },
    { key: 'type',            label: t.colType  },
    { key: 'hp',              label: t.statLabels['hp']              ?? 'HP'     },
    { key: 'attack',          label: t.statLabels['attack']          ?? 'ATK'    },
    { key: 'defense',         label: t.statLabels['defense']         ?? 'DEF'    },
    { key: 'special-attack',  label: t.statLabels['special-attack']  ?? 'SP.ATK' },
    { key: 'special-defense', label: t.statLabels['special-defense'] ?? 'SP.DEF' },
    { key: 'speed',           label: t.statLabels['speed']           ?? 'SPD'    },
    { key: 'total',           label: t.colTotal },
  ]

  const { data: allPokemon, isLoading: listLoading } = usePokemonList()

  // Filtered + sorted list
  const filtered = useMemo(() => {
    if (!allPokemon) return []
    let list = [...allPokemon]

    // Generation filter
    if (generationFilter !== null) {
      const [min, max] = GEN_RANGES[generationFilter] ?? [1, 9999]
      list = list.filter((p) => p.id >= min && p.id <= max)
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter((p) => p.name.includes(q) || String(p.id).startsWith(q))
    }

    // Type filter
    if (typeFilter) {
      list = list.filter((p) => {
        const c = pokemonCache[p.id]
        return !c || c.types.some((t) => t.type.name === typeFilter)
      })
    }

    // Sort
    list.sort((a, b) => {
      const ac = pokemonCache[a.id]
      const bc = pokemonCache[b.id]

      if (sortField === 'id') return sortOrder === 'asc' ? a.id - b.id : b.id - a.id
      if (sortField === 'name') {
        const cmp = a.name.localeCompare(b.name)
        return sortOrder === 'asc' ? cmp : -cmp
      }

      // Cache-dependent sorts: uncached pokemon go to the end
      if (!ac && !bc) return a.id - b.id
      if (!ac) return 1
      if (!bc) return -1

      let av: number | string, bv: number | string
      if (sortField === 'type') {
        av = ac.types[0]?.type.name ?? ''
        bv = bc.types[0]?.type.name ?? ''
        const cmp = (av as string).localeCompare(bv as string)
        return sortOrder === 'asc' ? cmp : -cmp
      }
      av = sortField === 'total' ? getTotal(ac) : getStat(ac, sortField)
      bv = sortField === 'total' ? getTotal(bc) : getStat(bc, sortField)
      return sortOrder === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
    })

    return list
  }, [allPokemon, searchQuery, typeFilter, generationFilter, sortField, sortOrder, pokemonCache])

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const pageItems  = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const pageIds    = pageItems.map((p) => p.id)

  usePokemonPageDetails(pageIds)
  const isPageLoading = pageIds.some((id) => !pokemonCache[id])

  // Background full-stats loader — only runs when loadAllStats is true
  const allIds = useMemo(() => allPokemon?.map((p) => p.id) ?? [], [allPokemon])
  const { total: loaderTotal, loaded: loaderLoaded, isDone: loaderDone } =
    useAllPokemonLoader(allIds, loadAllStats)

  const handleSort = useCallback(
    (field: SortField) => {
      toggleSort(field)
      setCurrentPage(1)
      // Activate background loader when user sorts by a stat field
      if (STAT_FIELDS.has(field) && !loadAllStats) setLoadAllStats(true)
    },
    [toggleSort, setCurrentPage, loadAllStats, setLoadAllStats],
  )

  const cachedCount = Object.keys(pokemonCache).length

  if (listLoading) return <LoadingSpinner size={80} text={t.loadingPokedex} />

  return (
    <div className="space-y-4">
      {/* ── Filter bar ── */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm select-none">🔍</span>
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none transition-all"
            style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}
            onFocus={(e) => (e.target.style.borderColor = 'rgba(239,68,68,0.5)')}
            onBlur={(e)  => (e.target.style.borderColor = 'rgba(255,255,255,0.07)')}
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl text-sm text-white focus:outline-none cursor-pointer capitalize"
          style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <option value="">{t.allTypes}</option>
          {POKEMON_TYPES.map((tp) => (
            <option key={tp} value={tp} className="capitalize bg-slate-900">
              {language === 'es' ? TYPE_NAMES_ES[tp] ?? tp : tp.charAt(0).toUpperCase() + tp.slice(1)}
            </option>
          ))}
        </select>

        <span className="text-slate-600 text-sm tabular-nums">
          <span className="text-slate-300 font-bold">{filtered.length}</span> Pokémon
        </span>
      </div>

      {/* ── Stats loading banner ── */}
      <AnimatePresence>
        {loadAllStats && !loaderDone && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)' }}
          >
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent flex-shrink-0" />
            <span className="text-indigo-300">
              {t.loadingStats(loaderLoaded + cachedCount - (allIds.length - loaderTotal), allIds.length)}
            </span>
            {/* Progress bar */}
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(99,102,241,0.2)' }}>
              <motion.div className="h-full rounded-full bg-indigo-400"
                animate={{ width: `${((loaderLoaded / loaderTotal) * 100).toFixed(1)}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-indigo-500 text-xs tabular-nums flex-shrink-0">
              {Math.round((loaderLoaded / loaderTotal) * 100)}%
            </span>
          </motion.div>
        )}
        {loadAllStats && loaderDone && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs text-green-400"
            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
          >
            <span>✓</span> {t.statsReady}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Table ── */}
      <div className="w-full overflow-x-auto rounded-2xl"
        style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>
        <table className="w-full min-w-[960px]">
          <thead>
            <tr style={{ background: 'rgba(30,41,59,0.9)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <th className="px-4 py-4 text-left w-16">
                <span className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">IMG</span>
              </th>
              {columns.map((col) => (
                <th key={col.key} onClick={() => handleSort(col.key)}
                  className="px-3 py-4 text-left text-[10px] uppercase tracking-widest font-bold cursor-pointer hover:text-slate-200 select-none transition-colors whitespace-nowrap"
                  style={{ color: sortField === col.key ? '#f87171' : '#475569' }}
                >
                  {col.label}
                  <SortBtn field={col.key} active={sortField} order={sortOrder} />
                  {/* Indicator that this stat sort needs data loading */}
                  {STAT_FIELDS.has(col.key) && !loadAllStats && (
                    <span className="ml-1 text-indigo-500 text-[8px]">↻</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {isPageLoading
                ? Array.from({ length: itemsPerPage }).map((_, i) => <SkeletonRow key={i} />)
                : pageItems.map((entry, idx) => {
                    const pokemon = pokemonCache[entry.id]
                    const accent  = pokemon ? primaryColor(pokemon) : '#475569'
                    const total   = pokemon ? getTotal(pokemon) : null

                    return (
                      <motion.tr
                        key={entry.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.18, delay: idx * 0.025 }}
                        onClick={() => router.push(`/pokemon/${entry.id}`)}
                        className="group cursor-pointer transition-all duration-150"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                        onMouseEnter={(e) => {
                          const el = e.currentTarget as HTMLElement
                          el.style.background = `${accent}12`
                          el.style.borderLeft = `3px solid ${accent}88`
                        }}
                        onMouseLeave={(e) => {
                          const el = e.currentTarget as HTMLElement
                          el.style.background = ''
                          el.style.borderLeft = ''
                        }}
                      >
                        {/* Sprite */}
                        <td className="px-3 py-2 w-16">
                          <div className="w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-200"
                            style={{ background: `${accent}18` }}>
                            <img src={getSpriteUrl(entry.id)} alt={entry.name}
                              width={48} height={48}
                              className="object-contain w-12 h-12 group-hover:scale-110 transition-transform duration-300"
                              style={{ imageRendering: 'pixelated' }}
                            />
                          </div>
                        </td>

                        {/* ID */}
                        <td className="px-3 py-2">
                          <span className="font-pixel text-[9px] text-slate-600 tabular-nums">
                            {String(entry.id).padStart(3, '0')}
                          </span>
                        </td>

                        {/* Name */}
                        <td className="px-3 py-2 min-w-36">
                          <span className="font-bold text-sm text-white capitalize group-hover:text-red-300 transition-colors">
                            {entry.name.replace(/-/g, ' ')}
                          </span>
                        </td>

                        {/* Type */}
                        <td className="px-3 py-2 min-w-28">
                          <div className="flex gap-1 flex-wrap">
                            {pokemon
                              ? pokemon.types.map((t) => <TypeBadge key={t.type.name} type={t.type.name} size="sm" />)
                              : <span className="text-slate-700 text-xs">—</span>}
                          </div>
                        </td>

                        {/* Stats */}
                        {pokemon ? (
                          <>
                            <StatNum value={getStat(pokemon, 'hp')}             stat="hp" />
                            <StatNum value={getStat(pokemon, 'attack')}          stat="attack" />
                            <StatNum value={getStat(pokemon, 'defense')}         stat="defense" />
                            <StatNum value={getStat(pokemon, 'special-attack')}  stat="special-attack" />
                            <StatNum value={getStat(pokemon, 'special-defense')} stat="special-defense" />
                            <StatNum value={getStat(pokemon, 'speed')}           stat="speed" />
                            <td className="px-2 py-0 text-center w-16">
                              <span className="font-black text-sm tabular-nums" style={{ color: '#c084fc' }}>{total}</span>
                            </td>
                          </>
                        ) : (
                          Array.from({ length: 7 }).map((_, i) => (
                            <td key={i} className="px-2 py-0 text-center">
                              <span className="text-slate-700 text-xs">—</span>
                            </td>
                          ))
                        )}
                      </motion.tr>
                    )
                  })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  )
}
