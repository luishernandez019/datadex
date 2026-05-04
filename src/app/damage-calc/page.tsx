import type { Metadata } from 'next'
import DamageCalcClient from './DamageCalcClient'

export const metadata: Metadata = {
  title: 'Damage Calculator — Datadex',
  description: 'Calculate Pokémon battle damage with full IV/EV control, natures, weather, terrain, and all Gen 9 battle conditions.',
}

export default function DamageCalcPage() {
  return <DamageCalcClient />
}
