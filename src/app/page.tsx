'use client'

import { motion } from 'framer-motion'
import PokemonTable from '@/components/PokemonTable'
import { usePokemonStore } from '@/store/pokemonStore'
import { T, TYPE_NAMES_ES } from '@/lib/translations'

const TYPE_ICONS: [string, string][] = [
  ['🔥', 'fire'], ['💧', 'water'], ['🌿', 'grass'], ['⚡', 'electric'],
  ['❄️', 'ice'], ['👊', 'fighting'], ['☠️', 'poison'], ['🌍', 'ground'],
  ['🦋', 'bug'], ['🔮', 'psychic'], ['🐉', 'dragon'], ['🌙', 'dark'],
  ['✨', 'fairy'], ['🗿', 'rock'], ['👻', 'ghost'], ['💨', 'flying'],
  ['⚙️', 'steel'], ['⬜', 'normal'],
]

export default function HomePage() {
  const language = usePokemonStore((s) => s.language)
  const t = T[language]

  return (
    <div className="min-h-screen dot-grid">
      {/* Decorative background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #ef4444, transparent 70%)' }} />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #3b82f6, transparent 70%)' }} />
        {/* Large pokeball watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-[0.015] pokeball-spin">
          <PokeballBg />
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center mb-10"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5, type: 'spring' }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-bold mb-5 tracking-wider uppercase"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            1,302 Pokémon
          </motion.div>

          <h1 className="font-pixel text-3xl sm:text-4xl md:text-5xl mb-4 leading-tight">
            <span style={{ color: '#ef4444', textShadow: '0 0 40px rgba(239,68,68,0.4)' }}>DATA</span>
            <span className="text-white">DEX</span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto leading-relaxed mb-6">
            {t.heroSubtitle}{' '}
            <span className="text-white font-bold">{t.heroGenerations}</span>.{' '}
            {t.heroHint}
          </p>

          {/* Type chips */}
          <div className="flex flex-wrap justify-center gap-1.5 max-w-2xl mx-auto mb-8">
            {TYPE_ICONS.map(([icon, slug]) => {
              const label = language === 'es' ? TYPE_NAMES_ES[slug] ?? slug : slug.charAt(0).toUpperCase() + slug.slice(1)
              return (
                <span key={slug} className="px-2.5 py-1 text-xs rounded-full border border-white/5 bg-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200 transition-all cursor-default">
                  {icon} {label}
                </span>
              )
            })}
          </div>

          {/* Divider pokeball */}
          <div className="flex items-center gap-3 max-w-sm mx-auto opacity-30">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-red-500" />
            <svg viewBox="0 0 40 40" className="w-5 h-5 flex-shrink-0">
              <path d="M 2 20 A 18 18 0 0 1 38 20" fill="#ef4444" />
              <path d="M 2 20 A 18 18 0 0 0 38 20" fill="#f1f5f9" />
              <rect x="2" y="18" width="36" height="4" fill="#0f172a" />
              <circle cx="20" cy="20" r="5" fill="#0f172a" />
              <circle cx="20" cy="20" r="3" fill="#f1f5f9" />
            </svg>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-red-500" />
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <PokemonTable />
        </motion.div>
      </div>
    </div>
  )
}

function PokeballBg() {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="100" cy="100" r="98" fill="none" stroke="white" strokeWidth="4" />
      <path d="M 4 100 A 96 96 0 0 1 196 100" fill="white" fillOpacity="0.5" />
      <rect x="4" y="96" width="192" height="8" fill="white" />
      <circle cx="100" cy="100" r="24" fill="none" stroke="white" strokeWidth="4" />
      <circle cx="100" cy="100" r="12" fill="white" />
    </svg>
  )
}
