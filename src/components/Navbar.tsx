'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { usePokemonStore, hydrateLanguage } from '@/store/pokemonStore'
import { GEN_LABELS, T } from '@/lib/translations'

export default function Navbar() {
  const { generationFilter, setGenerationFilter, language, setLanguage } = usePokemonStore()
  const t = T[language]

  // Hydrate language from localStorage on first client render
  useEffect(() => { hydrateLanguage() }, [])

  const gens = Object.keys(GEN_LABELS).map(Number)

  return (
    <header className="sticky top-0 z-50 border-b border-white/5"
      style={{ background: 'rgba(10,15,30,0.97)', backdropFilter: 'blur(20px)' }}>
      {/* Red top stripe */}
      <div className="h-1 w-full"
        style={{ background: 'linear-gradient(90deg, #991b1b, #ef4444, #fca5a5, #ef4444, #991b1b)' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0"
          onClick={() => setGenerationFilter(null)}>
          <motion.div className="w-9 h-9" whileHover={{ rotate: 180 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}>
            <PokeballSVG />
          </motion.div>
          <span className="font-pixel text-[11px] text-red-400 hidden sm:block tracking-wide">DATADEX</span>
        </Link>

        {/* Generation pills — scrollable */}
        <nav className="flex-1 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-1.5 min-w-max pr-2">
            {/* "All" pill */}
            <GenPill
              label={language === 'es' ? 'Todos' : 'All'}
              active={generationFilter === null}
              onClick={() => setGenerationFilter(null)}
              accent="#ef4444"
            />

            {/* Individual gens */}
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

        {/* Language toggle */}
        <div className="flex-shrink-0 flex items-center gap-1 p-1 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {(['en', 'es'] as const).map((lang) => (
            <motion.button
              key={lang}
              whileTap={{ scale: 0.92 }}
              onClick={() => setLanguage(lang)}
              className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all"
              style={language === lang
                ? { background: '#ef4444', color: '#fff' }
                : { color: '#475569' }
              }
            >
              {lang}
            </motion.button>
          ))}
        </div>
      </div>
    </header>
  )
}

function GenPill({
  label, active, onClick, accent,
}: {
  label: string
  active: boolean
  onClick: () => void
  accent: string
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="px-2.5 py-1 rounded-full text-[10px] font-black whitespace-nowrap transition-all"
      style={
        active
          ? { background: accent, color: '#fff', boxShadow: `0 0 12px ${accent}55` }
          : {
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#64748b',
            }
      }
    >
      {label}
    </motion.button>
  )
}

function PokeballSVG() {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-lg">
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
