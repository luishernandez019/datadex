'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { usePokemonStore, hydrateLanguage } from '@/store/pokemonStore'
import { usePokemonList } from '@/hooks/usePokemonList'
import { getSpriteUrl } from '@/lib/api'
import { GEN_LABELS } from '@/lib/translations'

export default function Navbar() {
  const { generationFilter, setGenerationFilter, language } = usePokemonStore()
  const pathname = usePathname()
  const isDetailPage = pathname.startsWith('/pokemon/')

  useEffect(() => { hydrateLanguage() }, [])

  const gens = Object.keys(GEN_LABELS).map(Number)

  return (
    <header className="sticky top-0 z-50 border-b border-white/5"
      style={{ background: 'rgba(10,15,30,0.97)', backdropFilter: 'blur(20px)' }}>
      <div className="h-1 w-full"
        style={{ background: 'linear-gradient(90deg, #991b1b, #ef4444, #fca5a5, #ef4444, #991b1b)' }} />

      {isDetailPage ? (
        /* Detail page — 3-column grid so the search is truly centered */
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 grid items-center gap-4"
          style={{ gridTemplateColumns: '1fr auto 1fr' }}>
          {/* Left: logo */}
          <Link href="/" className="flex items-center gap-2.5 group justify-self-start flex-shrink-0"
            onClick={() => setGenerationFilter(null)}>
            <motion.div className="w-9 h-9" whileHover={{ rotate: 180 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}>
              <PokeballSVG />
            </motion.div>
            <span className="font-pixel text-[11px] text-red-400 hidden sm:block tracking-wide">DATADEX</span>
          </Link>

          {/* Center: search */}
          <NavSearch />

          {/* Right: language toggle */}
          <div className="justify-self-end flex items-center gap-1 p-1 rounded-lg flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <LangToggle />
          </div>
        </div>
      ) : (
        /* Home page — flex with gen pills */
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0"
            onClick={() => setGenerationFilter(null)}>
            <motion.div className="w-9 h-9" whileHover={{ rotate: 180 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}>
              <PokeballSVG />
            </motion.div>
            <span className="font-pixel text-[11px] text-red-400 hidden sm:block tracking-wide">DATADEX</span>
          </Link>

          <nav className="flex-1 overflow-x-auto scrollbar-hide flex items-center">
            <div className="flex items-center gap-1.5 min-w-max mx-auto px-2">
              <GenPill
                label={language === 'es' ? 'Todos' : 'All'}
                active={generationFilter === null}
                onClick={() => setGenerationFilter(null)}
                accent="#dc2626"
              />
              {gens.map((gen) => (
                <GenPill
                  key={gen}
                  label={GEN_LABELS[gen]}
                  active={generationFilter === gen}
                  onClick={() => setGenerationFilter(generationFilter === gen ? null : gen)}
                  accent="#6366f1"
                />
              ))}
            </div>
          </nav>

          <div className="flex-shrink-0 flex items-center gap-1 p-1 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <LangToggle />
          </div>
        </div>
      )}
    </header>
  )
}

function NavSearch() {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()
  const language = usePokemonStore((s) => s.language)
  const { data: pokemonList } = usePokemonList()

  // Clear state on page change
  useEffect(() => {
    setQuery('')
    setOpen(false)
    setActiveIndex(-1)
  }, [pathname])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setActiveIndex(-1)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const suggestions = query.trim().length === 0 ? [] : (pokemonList ?? [])
    .filter((p) => {
      const q = query.trim().toLowerCase()
      return p.name.includes(q) || String(p.id).startsWith(q)
    })
    .sort((a, b) => {
      const q = query.trim().toLowerCase()
      const aStarts = a.name.startsWith(q) ? 0 : 1
      const bStarts = b.name.startsWith(q) ? 0 : 1
      return aStarts - bStarts || a.id - b.id
    })
    .slice(0, 8)

  const handleSelect = (id: number) => {
    setQuery('')
    setOpen(false)
    setActiveIndex(-1)
    router.push(`/pokemon/${id}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) {
      if (e.key === 'Enter') {
        const q = query.trim().toLowerCase()
        const match = pokemonList?.find((p) => p.name === q || String(p.id) === q)
        if (match) handleSelect(match.id)
      }
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
          handleSelect(suggestions[activeIndex].id)
        }
        break
      case 'Escape':
        setOpen(false)
        setActiveIndex(-1)
        break
    }
  }

  return (
    <div ref={containerRef} className="relative w-72 sm:w-80 md:w-96">
      <div className="relative group">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 text-sm pointer-events-none">
          🔍
        </span>
        <input
          type="text"
          role="searchbox"
          aria-label={language === 'es' ? 'Buscar Pokémon por nombre o número' : 'Search Pokémon by name or number'}
          aria-autocomplete="list"
          aria-expanded={open && suggestions.length > 0}
          aria-controls="navbar-search-suggestions"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(e.target.value.trim().length > 0)
            setActiveIndex(-1)
          }}
          onFocus={() => query.trim().length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={language === 'es' ? 'Buscar Pokémon...' : 'Search Pokémon...'}
          autoComplete="off"
          className="w-full pl-9 py-1.5 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none transition-colors"
          style={{
            paddingRight: query ? '2.25rem' : '1rem',
            background: 'rgba(30,41,59,0.8)',
            border: `1px solid ${open && suggestions.length > 0 ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`,
          }}
        />
        {query && (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault()
              setQuery('')
              setOpen(false)
              setActiveIndex(-1)
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-all text-sm leading-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <motion.ul
            id="navbar-search-suggestions"
            role="listbox"
            aria-label={language === 'es' ? 'Sugerencias de búsqueda' : 'Search suggestions'}
            initial={{ opacity: 0, y: -4, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -4, scaleY: 0.95 }}
            transition={{ duration: 0.12 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              zIndex: 60,
              background: '#0f172a',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '0.75rem',
              boxShadow: '0 16px 40px rgba(0,0,0,0.7)',
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
                    role="option"
                    aria-selected={i === activeIndex}
                    onMouseDown={(e) => { e.preventDefault(); handleSelect(entry.id) }}
                    onMouseEnter={() => setActiveIndex(i)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left cursor-pointer transition-colors"
                    style={{
                      background: isActive ? 'rgba(239,68,68,0.12)' : 'transparent',
                      border: `1px solid ${isActive ? 'rgba(239,68,68,0.28)' : 'transparent'}`,
                    }}
                  >
                    <img
                      src={getSpriteUrl(entry.id)}
                      alt={entry.name}
                      width={32}
                      height={32}
                      className="object-contain flex-shrink-0"
                      style={{ imageRendering: 'pixelated' }}
                    />
                    <span className="flex-1 text-sm font-semibold text-white capitalize truncate">
                      {entry.name.replace(/-/g, ' ')}
                    </span>
                    <span className="font-pixel text-[9px] flex-shrink-0"
                      style={{ color: isActive ? '#ef4444' : '#94a3b8' }}>
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
  )
}

function LangToggle() {
  const { language, setLanguage } = usePokemonStore()
  const labels: Record<string, string> = { en: 'Switch to English', es: 'Cambiar a español' }
  return (
    <>
      {(['en', 'es'] as const).map((lang) => (
        <motion.button
          key={lang}
          whileTap={{ scale: 0.92 }}
          onClick={() => setLanguage(lang)}
          aria-label={labels[lang]}
          aria-pressed={language === lang}
          className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all"
          style={language === lang
            ? { background: '#dc2626', color: '#fff', cursor: 'pointer' }
            : { color: '#94a3b8', cursor: 'pointer' }
          }
        >
          {lang}
        </motion.button>
      ))}
    </>
  )
}

function GenPill({ label, active, onClick, accent }: {
  label: string; active: boolean; onClick: () => void; accent: string
}) {
  return (
    <motion.button
      whileHover={{ opacity: 0.8 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      aria-pressed={active}
      className="px-2.5 py-1 rounded-full text-[10px] font-black whitespace-nowrap transition-all"
      style={active
        ? { background: accent, color: '#fff', boxShadow: `0 0 12px ${accent}55`, cursor: 'pointer' }
        : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', cursor: 'pointer' }
      }
    >
      {label}
    </motion.button>
  )
}

function PokeballSVG() {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-lg" aria-hidden="true">
      <circle cx="50" cy="50" r="48" fill="#1e293b" stroke="#334155" strokeWidth="2" />
      <path d="M 4 50 A 46 46 0 0 1 96 50" fill="#ef4444" />
      <path d="M 4 50 A 46 46 0 0 0 96 50" fill="#f1f5f9" />
      <rect x="4" y="46" width="92" height="8" fill="#0f172a" />
      <circle cx="50" cy="50" r="14" fill="#0f172a" stroke="#334155" strokeWidth="2" />
      <circle cx="50" cy="50" r="9" fill="#f1f5f9" />
      <circle cx="50" cy="50" r="4" fill="#60a5fa" />
      <circle cx="45" cy="45" r="2" fill="rgba(255,255,255,0.6)" />
    </svg>
  )
}
