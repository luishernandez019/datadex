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
  const isTeamPage = pathname === '/team'
  const isNaturesPage = pathname === '/natures'
  const isSubPage = isTeamPage || isNaturesPage

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const hamburgerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => { hydrateLanguage() }, [])

  // Cerrar menú al cambiar de ruta
  useEffect(() => { setMobileMenuOpen(false) }, [pathname])

  // Bloquear scroll del body cuando el menú está abierto
  useEffect(() => {
    if (mobileMenuOpen) {
      const original = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = original }
    }
  }, [mobileMenuOpen])

  const rightNav = (
    <RightNav
      language={language}
      isNaturesPage={isNaturesPage}
      isTeamPage={isTeamPage}
      mobileMenuOpen={mobileMenuOpen}
      setMobileMenuOpen={setMobileMenuOpen}
      hamburgerRef={hamburgerRef}
    />
  )

  const gens = Object.keys(GEN_LABELS).map(Number)

  return (
    <header className="sticky top-0 z-50 border-b border-white/5"
      style={{ background: 'rgba(10,15,30,0.97)', backdropFilter: 'blur(20px)' }}>
      <div className="h-1 w-full"
        style={{ background: 'linear-gradient(90deg, #991b1b, #ef4444, #fca5a5, #ef4444, #991b1b)' }} />

      {isDetailPage ? (
        /* Detail page — auto/1fr/auto on mobile (search flexes), centered grid on desktop */
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 grid items-center gap-2 sm:gap-4 grid-cols-[auto_1fr_auto] sm:grid-cols-[1fr_auto_1fr]">
          {/* Left: logo */}
          <Link href="/" aria-label="Datadex home"
            className="flex items-center gap-2.5 group justify-self-start flex-shrink-0"
            onClick={() => setGenerationFilter(null)}>
            <div className="w-9 h-9 transition-transform duration-500 ease-in-out group-hover:rotate-180">
              <PokeballSVG />
            </div>
            <span className="font-pixel text-[11px] text-red-400 hidden md:block tracking-wide">DATADEX</span>
          </Link>

          {/* Center: search (flexes on mobile) */}
          <NavSearch />

          {/* Right: nav links / hamburger */}
          <div className="justify-self-end flex-shrink-0">{rightNav}</div>
        </div>
      ) : isSubPage ? (
        /* Sub page (team / natures) — logo + spacer + nav links + lang toggle */
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center gap-2 sm:gap-4">
          <Link href="/" aria-label="Datadex home"
            className="flex items-center gap-2.5 group flex-shrink-0"
            onClick={() => setGenerationFilter(null)}>
            <div className="w-9 h-9 transition-transform duration-500 ease-in-out group-hover:rotate-180">
              <PokeballSVG />
            </div>
            <span className="font-pixel text-[11px] text-red-400 hidden sm:block tracking-wide">DATADEX</span>
          </Link>

          <div className="flex-1" />

          {rightNav}
        </div>
      ) : (
        /* Home page — flex with gen pills */
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center gap-2 sm:gap-4">
          <Link href="/" aria-label="Datadex home"
            className="flex items-center gap-2.5 group flex-shrink-0"
            onClick={() => setGenerationFilter(null)}>
            <div className="w-9 h-9 transition-transform duration-500 ease-in-out group-hover:rotate-180">
              <PokeballSVG />
            </div>
            <span className="font-pixel text-[11px] text-red-400 hidden md:block tracking-wide">DATADEX</span>
          </Link>

          <nav className="flex-1 min-w-0 overflow-x-auto scrollbar-hide flex items-center">
            <div className="flex items-center gap-1.5 min-w-max mx-auto px-1 sm:px-2">
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

          {rightNav}
        </div>
      )}

      {/* Mobile menu drawer (slides down from below the header) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <MobileMenu
            language={language}
            isNaturesPage={isNaturesPage}
            isTeamPage={isTeamPage}
            onClose={() => {
              setMobileMenuOpen(false)
              hamburgerRef.current?.focus()
            }}
          />
        )}
      </AnimatePresence>
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
    <div ref={containerRef} className="relative w-full min-w-0 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
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
        <button
          key={lang}
          onClick={() => setLanguage(lang)}
          aria-label={labels[lang]}
          aria-pressed={language === lang}
          className="px-2 sm:px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
          style={language === lang
            ? { background: '#dc2626', color: '#fff', cursor: 'pointer' }
            : { color: '#94a3b8', cursor: 'pointer' }
          }
        >
          {lang}
        </button>
      ))}
    </>
  )
}

function TeamLink({ language, isActive }: { language: string; isActive: boolean }) {
  return (
    <Link
      href="/team"
      aria-label={language === 'es' ? 'Abrir Team Builder' : 'Open Team Builder'}
      aria-current={isActive ? 'page' : undefined}
      title={language === 'es' ? 'Equipo' : 'Team'}
      className="inline-flex items-center justify-center gap-1.5 h-9 w-9 sm:w-auto sm:px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all hover:opacity-90 active:scale-95"
      style={
        isActive
          ? { background: '#6366f1', color: '#fff', boxShadow: '0 0 12px rgba(99,102,241,0.4)' }
          : { background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)' }
      }
    >
      <span aria-hidden="true">⚔️</span>
      <span className="hidden sm:inline">{language === 'es' ? 'Equipo' : 'Team'}</span>
    </Link>
  )
}

function NaturesLink({ language, isActive }: { language: string; isActive: boolean }) {
  return (
    <Link
      href="/natures"
      aria-label={language === 'es' ? 'Ver naturalezas' : 'View natures'}
      aria-current={isActive ? 'page' : undefined}
      title={language === 'es' ? 'Naturalezas' : 'Natures'}
      className="inline-flex items-center justify-center gap-1.5 h-9 w-9 sm:w-auto sm:px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all hover:opacity-90 active:scale-95"
      style={
        isActive
          ? { background: '#ec4899', color: '#fff', boxShadow: '0 0 12px rgba(236,72,153,0.4)' }
          : { background: 'rgba(236,72,153,0.12)', color: '#f472b6', border: '1px solid rgba(236,72,153,0.25)' }
      }
    >
      <span aria-hidden="true">🌱</span>
      <span className="hidden sm:inline">{language === 'es' ? 'Natur.' : 'Natures'}</span>
    </Link>
  )
}

// ─── Right nav: desktop inline links + mobile hamburger ─────────────────────

function RightNav({
  language,
  isNaturesPage,
  isTeamPage,
  mobileMenuOpen,
  setMobileMenuOpen,
  hamburgerRef,
}: {
  language: string
  isNaturesPage: boolean
  isTeamPage: boolean
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
  hamburgerRef: React.RefObject<HTMLButtonElement | null>
}) {
  const isES = language === 'es'
  return (
    <div className="flex items-center gap-2">
      {/* Desktop only — sm+ */}
      <div className="hidden sm:flex items-center gap-2">
        <NaturesLink language={language} isActive={isNaturesPage} />
        <TeamLink language={language} isActive={isTeamPage} />
        <div className="flex items-center gap-1 p-1 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <LangToggle />
        </div>
      </div>

      {/* Mobile only — hamburger */}
      <button
        ref={hamburgerRef}
        type="button"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label={isES ? 'Menú de navegación' : 'Navigation menu'}
        aria-expanded={mobileMenuOpen}
        aria-controls="mobile-nav-menu"
        className="sm:hidden inline-flex items-center justify-center h-9 w-9 rounded-lg transition-all active:scale-95 cursor-pointer"
        style={{
          background: mobileMenuOpen ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${mobileMenuOpen ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.1)'}`,
        }}
      >
        <span className="sr-only">{isES ? 'Abrir menú' : 'Open menu'}</span>
        <div className="relative w-5 h-4 flex flex-col justify-between" aria-hidden="true">
          <motion.span
            animate={{
              rotate: mobileMenuOpen ? 45 : 0,
              y: mobileMenuOpen ? 7 : 0,
            }}
            transition={{ duration: 0.2 }}
            className="block h-0.5 w-full rounded-full origin-center"
            style={{ background: mobileMenuOpen ? '#a5b4fc' : '#e2e8f0' }}
          />
          <motion.span
            animate={{ opacity: mobileMenuOpen ? 0 : 1, scaleX: mobileMenuOpen ? 0 : 1 }}
            transition={{ duration: 0.15 }}
            className="block h-0.5 w-full rounded-full"
            style={{ background: '#e2e8f0' }}
          />
          <motion.span
            animate={{
              rotate: mobileMenuOpen ? -45 : 0,
              y: mobileMenuOpen ? -7 : 0,
            }}
            transition={{ duration: 0.2 }}
            className="block h-0.5 w-full rounded-full origin-center"
            style={{ background: mobileMenuOpen ? '#a5b4fc' : '#e2e8f0' }}
          />
        </div>
      </button>
    </div>
  )
}

// ─── Mobile menu drawer ──────────────────────────────────────────────────────

function MobileMenu({
  language,
  isNaturesPage,
  isTeamPage,
  onClose,
}: {
  language: string
  isNaturesPage: boolean
  isTeamPage: boolean
  onClose: () => void
}) {
  const isES = language === 'es'
  const panelRef = useRef<HTMLDivElement>(null)
  const firstLinkRef = useRef<HTMLAnchorElement>(null)

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Foco al primer link al abrir
  useEffect(() => {
    firstLinkRef.current?.focus()
  }, [])

  // Trampa de foco dentro del menú
  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const selector = 'a[href], button:not([disabled])'
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(selector))
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
  }, [])

  return (
    <>
      {/* Backdrop — solo cubre el área debajo del header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
        className="sm:hidden fixed inset-x-0 bottom-0 top-[60px] z-40"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        aria-hidden="true"
      />

      {/* Panel deslizante */}
      <motion.div
        ref={panelRef}
        id="mobile-nav-menu"
        role="dialog"
        aria-modal="true"
        aria-label={isES ? 'Menú de navegación' : 'Navigation menu'}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="sm:hidden absolute top-full inset-x-0 z-50 border-b border-white/10"
        style={{ background: 'rgba(10,15,30,0.99)', backdropFilter: 'blur(20px)' }}
      >
        <div className="max-w-7xl mx-auto px-3 py-3 flex flex-col gap-1.5">
          <Link
            ref={firstLinkRef}
            href="/natures"
            onClick={onClose}
            aria-current={isNaturesPage ? 'page' : undefined}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
            style={
              isNaturesPage
                ? { background: '#ec4899', color: '#fff', boxShadow: '0 0 16px rgba(236,72,153,0.35)' }
                : { background: 'rgba(236,72,153,0.1)', color: '#f472b6', border: '1px solid rgba(236,72,153,0.25)' }
            }
          >
            <span className="text-lg" aria-hidden="true">🌱</span>
            <span className="flex-1">{isES ? 'Naturalezas' : 'Natures'}</span>
            <span className="text-[10px] uppercase tracking-widest opacity-70">25</span>
          </Link>

          <Link
            href="/team"
            onClick={onClose}
            aria-current={isTeamPage ? 'page' : undefined}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
            style={
              isTeamPage
                ? { background: '#6366f1', color: '#fff', boxShadow: '0 0 16px rgba(99,102,241,0.35)' }
                : { background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)' }
            }
          >
            <span className="text-lg" aria-hidden="true">⚔️</span>
            <span className="flex-1">{isES ? 'Team Builder' : 'Team Builder'}</span>
            <span className="text-[10px] uppercase tracking-widest opacity-70">6</span>
          </Link>

          {/* Language section */}
          <div className="mt-2 pt-3 border-t border-white/5 flex items-center justify-between gap-3">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
              {isES ? 'Idioma' : 'Language'}
            </span>
            <div
              className="flex items-center gap-1 p-1 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <LangToggle />
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}

function GenPill({ label, active, onClick, accent }: {
  label: string; active: boolean; onClick: () => void; accent: string
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className="px-2.5 py-1 rounded-full text-[10px] font-black whitespace-nowrap transition-all hover:opacity-80 active:scale-95"
      style={active
        ? { background: accent, color: '#fff', boxShadow: `0 0 12px ${accent}55`, cursor: 'pointer' }
        : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', cursor: 'pointer' }
      }
    >
      {label}
    </button>
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
