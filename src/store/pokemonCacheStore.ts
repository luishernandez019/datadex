import { create } from 'zustand'
import type { Pokemon, PokemonStats } from '@/types/pokemon'

interface PokemonCacheStore {
  pokemonCache: Record<number, Pokemon>
  statsCache: Record<number, PokemonStats>
  setPokemonCache: (id: number, pokemon: Pokemon) => void
  setPokemonCacheBatch: (pokemon: Pokemon[]) => void
  setStatsCache: (stats: PokemonStats[]) => void
}

export const usePokemonCacheStore = create<PokemonCacheStore>((set) => ({
  pokemonCache: {},
  statsCache: {},

  setPokemonCache: (id, pokemon) =>
    set((s) => {
      const next = Object.assign({}, s.pokemonCache)
      next[id] = pokemon
      return { pokemonCache: next }
    }),

  setPokemonCacheBatch: (list) =>
    set((s) => {
      const next = Object.assign({}, s.pokemonCache)
      list.forEach((p) => { next[p.id] = p })
      return { pokemonCache: next }
    }),

  setStatsCache: (list) =>
    set(() => {
      const next: Record<number, PokemonStats> = {}
      list.forEach((p) => { next[p.id] = p })
      return { statsCache: next }
    }),
}))
