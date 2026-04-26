import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { usePokemonCacheStore } from '@/store/pokemonCacheStore'
import type { PokemonStats } from '@/types/pokemon'

/**
 * Fetches pre-built /pokemon-stats.json (generated at build time by scripts/fetch-pokemon-stats.mjs).
 * Returns null when the file doesn't exist (e.g. local dev without running prebuild),
 * allowing PokemonTable to fall back to the chunk loader.
 */
export function useAllPokemonStats(enabled: boolean) {
  const setStatsCache = usePokemonCacheStore((s) => s.setStatsCache)

  const query = useQuery<PokemonStats[] | null>({
    queryKey: ['pokemon-stats-prebuilt'],
    queryFn: async () => {
      const res = await fetch('/pokemon-stats.json')
      if (!res.ok) return null
      return res.json()
    },
    enabled,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  })

  useEffect(() => {
    if (query.data) setStatsCache(query.data)
  }, [query.data, setStatsCache])

  return {
    hasPrebuilt: query.isSuccess && query.data !== null,
    isLoading: query.isLoading,
    isDone: query.isSuccess,
  }
}
