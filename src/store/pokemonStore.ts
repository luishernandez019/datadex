import { create } from 'zustand'
import type { SortField, SortOrder } from '@/types/pokemon'
import type { Lang } from '@/lib/translations'

interface PokemonStore {
  sortField: SortField
  sortOrder: SortOrder
  searchQuery: string
  typeFilter: string
  generationFilter: number | null
  currentPage: number
  itemsPerPage: number
  language: Lang
  loadAllStats: boolean

  setSortField: (field: SortField) => void
  setSortOrder: (order: SortOrder) => void
  toggleSort: (field: SortField, defaultOrder?: SortOrder) => void
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
  sortField: 'id',
  sortOrder: 'asc',
  searchQuery: '',
  typeFilter: '',
  generationFilter: null,
  currentPage: 1,
  itemsPerPage: 20,
  language: 'en',
  loadAllStats: false,

  setSortField: (field) => set({ sortField: field }),
  setSortOrder: (order) => set({ sortOrder: order }),

  toggleSort: (field, defaultOrder: SortOrder = 'asc') =>
    set((s) => {
      if (s.sortField === field) return { sortOrder: s.sortOrder === 'asc' ? 'desc' : 'asc' }
      return { sortField: field, sortOrder: defaultOrder }
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

export function hydrateLanguage() {
  usePokemonStore.setState({ language: readLang() })
}
