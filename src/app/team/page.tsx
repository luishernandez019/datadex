import type { Metadata } from 'next'
import TeamBuilderClient from './TeamBuilderClient'

export const metadata: Metadata = {
  title: 'Team Builder — Datadex',
  description: 'Build your Pokémon team of 6 and analyze type coverage, weaknesses, and strengths.',
}

export default function TeamPage() {
  return <TeamBuilderClient />
}
