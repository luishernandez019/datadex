'use client'

import { motion } from 'framer-motion'
import { STAT_COLORS } from '@/types/pokemon'
import { usePokemonStore } from '@/store/pokemonStore'
import { T } from '@/lib/translations'

interface StatBarProps {
  statName: string
  value: number
  maxValue?: number
  delay?: number
}

export default function StatBar({ statName, value, maxValue = 255, delay = 0 }: StatBarProps) {
  const language = usePokemonStore((s) => s.language)
  const color = STAT_COLORS[statName] ?? '#9DB7F5'
  const label = T[language].statLabels[statName] ?? statName
  const pct = Math.min((value / maxValue) * 100, 100)

  const tier =
    value >= 150 ? { text: 'GOD', bg: '#22c55e' } :
    value >= 110 ? { text: 'HIGH', bg: '#84cc16' } :
    value >= 80  ? { text: 'GOOD', bg: '#eab308' } :
    value >= 50  ? { text: 'AVG',  bg: '#f97316' } :
                   { text: 'LOW',  bg: '#ef4444' }

  return (
    <div className="flex items-center gap-3 group">
      {/* Label */}
      <div className="w-16 text-right flex-shrink-0">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{label}</span>
      </div>

      {/* Value */}
      <div className="w-9 text-right flex-shrink-0">
        <motion.span
          className="text-sm font-black tabular-nums"
          style={{ color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.2 }}
        >
          {value}
        </motion.span>
      </div>

      {/* Bar track */}
      <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          className="h-full rounded-full relative"
          style={{ background: `linear-gradient(90deg, ${color}cc, ${color})` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, delay, ease: [0.34, 1.56, 0.64, 1] }}
        >
          {/* Shine overlay */}
          <div className="absolute inset-0 rounded-full"
            style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 60%)' }} />
        </motion.div>
      </div>

      {/* Tier badge */}
      <div className="w-10 flex-shrink-0">
        <motion.span
          className="text-[8px] font-black px-1.5 py-0.5 rounded tracking-wider"
          style={{ background: `${tier.bg}22`, color: tier.bg, border: `1px solid ${tier.bg}44` }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay + 0.8 }}
        >
          {tier.text}
        </motion.span>
      </div>
    </div>
  )
}
