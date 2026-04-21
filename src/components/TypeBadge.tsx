'use client'

import { TYPE_COLORS } from '@/types/pokemon'
import { usePokemonStore } from '@/store/pokemonStore'
import { TYPE_NAMES_ES } from '@/lib/translations'

const TYPE_ICONS: Record<string, string> = {
  fire: '🔥', water: '💧', grass: '🌿', electric: '⚡', psychic: '🔮',
  ice: '❄️', dragon: '🐉', dark: '🌑', fairy: '✨', normal: '⬜',
  fighting: '👊', poison: '☠️', ground: '🌍', flying: '💨', bug: '🐛',
  rock: '🪨', ghost: '👻', steel: '⚙️',
}

interface TypeBadgeProps {
  type: string
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

export default function TypeBadge({ type, size = 'md', showIcon = false }: TypeBadgeProps) {
  const language = usePokemonStore((s) => s.language)
  const color = TYPE_COLORS[type] ?? '#A8A878'
  const icon  = TYPE_ICONS[type] ?? ''
  const label = language === 'es' ? (TYPE_NAMES_ES[type] ?? type) : type

  const sizes = {
    sm: 'px-2 py-0.5 text-[9px] gap-0.5',
    md: 'px-3 py-1 text-[10px] gap-1',
    lg: 'px-4 py-1.5 text-xs gap-1',
  }

  return (
    <span
      className={`inline-flex items-center justify-center font-black uppercase tracking-wider rounded-full ${sizes[size]}`}
      style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}55` }}
    >
      {(showIcon || size === 'lg') && <span className="text-[10px]">{icon}</span>}
      {label}
    </span>
  )
}
