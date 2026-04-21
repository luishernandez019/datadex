'use client'

import { motion } from 'framer-motion'
import { useAbilityDetail } from '@/hooks/useAbilityDetail'
import { usePokemonStore } from '@/store/pokemonStore'
import { T } from '@/lib/translations'

interface AbilityCardProps {
  name: string
  isHidden: boolean
  index: number
  typeColor: string
  delay?: number
}

export default function AbilityCard({ name, isHidden, index, typeColor, delay = 0 }: AbilityCardProps) {
  const language = usePokemonStore((s) => s.language)
  const t = T[language]

  const { data, isLoading } = useAbilityDetail(name)

  // Localised ability name (falls back to English, then to the raw slug)
  const localName =
    data?.names.find((n) => n.language.name === language)?.name ??
    data?.names.find((n) => n.language.name === 'en')?.name ??
    name.replace(/-/g, ' ')

  // PokéAPI only provides effect_entries in English; Spanish text lives in flavor_text_entries
  const description = language === 'es'
    ? (data?.flavor_text_entries.find((e) => e.language.name === 'es')?.flavor_text ??
       data?.effect_entries.find((e) => e.language.name === 'en')?.short_effect ??
       data?.flavor_text_entries.find((e) => e.language.name === 'en')?.flavor_text)
    : (data?.effect_entries.find((e) => e.language.name === 'en')?.short_effect ??
       data?.flavor_text_entries.find((e) => e.language.name === 'en')?.flavor_text)

  const ABILITY_ICONS = ['①', '②', '③']

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="p-4 rounded-2xl"
      style={{
        background: 'rgba(15,23,42,0.9)',
        border: `1px solid ${isHidden ? '#a78bfa33' : 'rgba(255,255,255,0.07)'}`,
      }}
    >
      <div className="flex items-start gap-4">
        {/* Index icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0 mt-0.5"
          style={{ background: `${typeColor}22`, border: `1px solid ${typeColor}44`, color: typeColor }}
        >
          {ABILITY_ICONS[index] ?? index + 1}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name + hidden badge */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-black text-white text-base capitalize">
              {isLoading ? name.replace(/-/g, ' ') : localName}
            </h3>
            {isHidden && (
              <span
                className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)' }}
              >
                {t.hiddenAbility}
              </span>
            )}
          </div>

          {/* Description */}
          {isLoading ? (
            <div className="space-y-1.5 mt-2">
              <div className="h-3 rounded skeleton w-full" />
              <div className="h-3 rounded skeleton w-4/5" />
            </div>
          ) : description ? (
            <p className="text-slate-400 text-sm leading-relaxed">
              {description}
            </p>
          ) : (
            <p className="text-slate-600 text-sm italic">{t.noDescription}</p>
          )}
        </div>
      </div>
    </motion.div>
  )
}
