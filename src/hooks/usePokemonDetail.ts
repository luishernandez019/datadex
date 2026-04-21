import { useQuery, useQueries } from '@tanstack/react-query'
import { fetchPokemon } from '@/lib/api'
import { usePokemonStore } from '@/store/pokemonStore'
import { useEffect, useRef } from 'react'
import type { Pokemon } from '@/types/pokemon'

export function usePokemonDetail(id: number | string) {
  const setPokemonCache = usePokemonStore((s) => s.setPokemonCache)

  const query = useQuery({
    queryKey: ['pokemon', id],
    queryFn: () => fetchPokemon(id),
    enabled: !!id,
  })

  useEffect(() => {
    if (query.data) {
      setPokemonCache(query.data.id, query.data)
    }
  }, [query.data, setPokemonCache])

  return query
}

export function usePokemonPageDetails(ids: number[]) {
  const setPokemonCacheBatch = usePokemonStore((s) => s.setPokemonCacheBatch)
  // Track which IDs we've already pushed into the cache to avoid re-triggering on every render
  const processedRef = useRef<Set<number>>(new Set())

  const queries = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['pokemon', id],
      queryFn: () => fetchPokemon(id),
      enabled: !!id,
      staleTime: Infinity,
    })),
  })

  // Use a stable primitive (count of successful queries) as the dependency
  // so the effect only fires when a new query actually resolves, not on every render
  const successCount = queries.filter((q) => q.isSuccess).length

  useEffect(() => {
    const newPokemon = queries
      .filter((q) => q.data)
      .map((q) => q.data as Pokemon)
      .filter((p) => !processedRef.current.has(p.id))

    if (newPokemon.length > 0) {
      newPokemon.forEach((p) => processedRef.current.add(p.id))
      setPokemonCacheBatch(newPokemon)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successCount, setPokemonCacheBatch])

  return queries
}
