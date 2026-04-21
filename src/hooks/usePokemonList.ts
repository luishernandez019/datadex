import { useQuery } from '@tanstack/react-query'
import { fetchPokemonList, getPokemonIdFromUrl } from '@/lib/api'

export interface PokemonListEntry {
  id: number
  name: string
  url: string
}

export function usePokemonList() {
  return useQuery({
    queryKey: ['pokemon-list'],
    queryFn: async (): Promise<PokemonListEntry[]> => {
      const data = await fetchPokemonList(1302, 0)
      return data.results.map((r) => ({
        id: getPokemonIdFromUrl(r.url),
        name: r.name,
        url: r.url,
      }))
    },
    staleTime: Infinity,
  })
}
