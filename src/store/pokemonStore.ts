import { create } from 'zustand'
import type { Pokemon, SortField, SortOrder } from '@/types/pokemon'
import type { Lang } from '@/lib/translations'

interface PokemonStore {
  pokemonCache: Record<number, Pokemon>
  sortField: SortField
  sortOrder: SortOrder
  searchQuery: string
  typeFilter: string
  generationFilter: number | null  // 1-9, null = all
  currentPage: number
  itemsPerPage: number
  language: Lang
  loadAllStats: boolean            // triggers background full-load when stat sort is active

  setPokemonCache: (id: number, pokemon: Pokemon) => void
  setPokemonCacheBatch: (pokemon: Pokemon[]) => void
  setSortField: (field: SortField) => void
  setSortOrder: (order: SortOrder) => void
  toggleSort: (field: SortField) => void
  setSearchQuery: (query: string) => void
  setTypeFilter: (type: string) => void
  setGenerationFilter: (gen: number | null) => void
  setCurrentPage: (page: number) => void
  setLanguage: (lang: Lang) => void
  setLoadAllStats: (v: boolean) => void
}

function readLang(): Lang {
  if (typeof window === 'undefined') return 'en'
  return (localStorage.getItem('pokedex-lang') as Lang) ?? 'en'
}

export const usePokemonStore = create<PokemonStore>((set) => ({
  pokemonCache: {},
  sortField: 'id',
  sortOrder: 'asc',
  searchQuery: '',
  typeFilter: '',
  generationFilter: null,
  currentPage: 1,
  itemsPerPage: 20,
  language: 'en',   // initialised client-side in Navbar to avoid SSR mismatch
  loadAllStats: false,

  setPokemonCache: (id, pokemon) =>
    set((s) => ({ pokemonCache: { ...s.pokemonCache, [id]: pokemon } })),

  setPokemonCacheBatch: (list) =>
    set((s) => {
      const next = { ...s.pokemonCache }
      list.forEach((p) => { next[p.id] = p })
      return { pokemonCache: next }
    }),

  setSortField: (field) => set({ sortField: field }),
  setSortOrder: (order) => set({ sortOrder: order }),

  toggleSort: (field) =>
    set((s) => {
      if (s.sortField === field) return { sortOrder: s.sortOrder === 'asc' ? 'desc' : 'asc' }
      return { sortField: field, sortOrder: 'asc' }
    }),

  setSearchQuery: (query) => set({ searchQuery: query, currentPage: 1 }),
  setTypeFilter:  (type)  => set({ typeFilter: type,   currentPage: 1 }),
  setGenerationFilter: (gen) => set({ generationFilter: gen, currentPage: 1 }),
  setCurrentPage: (page)  => set({ currentPage: page }),

  setLanguage: (lang) => {
    if (typeof window !== 'undefined') localStorage.setItem('pokedex-lang', lang)
    set({ language: lang })
  },

  setLoadAllStats: (v) => set({ loadAllStats: v }),
}))

// Hydrate language from localStorage once on client
export function hydrateLanguage() {
  usePokemonStore.setState({ language: readLang() })
}
