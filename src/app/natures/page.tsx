import type { Metadata } from 'next'
import NaturesClient from './NaturesClient'

export const metadata: Metadata = {
  title: 'Natures — Datadex',
  description: 'Explore all 25 Pokémon natures and the stats they boost or lower.',
}

export default function NaturesPage() {
  return <NaturesClient />
}
