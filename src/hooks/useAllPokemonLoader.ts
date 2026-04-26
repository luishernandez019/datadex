import { useQueries } from '@tanstack/react-query'
import { useMemo, useEffect, useRef, useState } from 'react'
import { fetchPokemon } from '@/lib/api'
import { usePokemonCacheStore } from '@/store/pokemonCacheStore'
import type { Pokemon } from '@/types/pokemon'

const CHUNK_SIZE = 50

export function useAllPokemonLoader(allIds: number[], enabled: boolean) {
  const setPokemonCacheBatch = usePokemonCacheStore((s) => s.setPokemonCacheBatch)
  const pokemonCache = usePokemonCacheStore((s) => s.pokemonCache)
  const processedRef = useRef<Set<number>>(new Set())
  const [chunkIndex, setChunkIndex] = useState(0)

  // Snapshot of uncached IDs at the moment loading was enabled — never changes
  // while loading so the query list stays stable.
  const uncachedIds = useMemo(() => {
    if (!enabled) return []
    return allIds.filter((id) => !pokemonCache[id])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]) // intentionally omit pokemonCache so it doesn't recompute on every cache write

  const totalChunks = Math.ceil(uncachedIds.length / CHUNK_SIZE)

  const currentChunkIds = useMemo(
    () => uncachedIds.slice(chunkIndex * CHUNK_SIZE, (chunkIndex + 1) * CHUNK_SIZE),
    [uncachedIds, chunkIndex],
  )

  const queries = useQueries({
    queries: currentChunkIds.map((id) => ({
      queryKey: ['pokemon', id],
      queryFn: () => fetchPokemon(id),
      staleTime: Infinity,
    })),
  })

  const successCount = queries.filter((q) => q.isSuccess).length
  const chunkDone = currentChunkIds.length === 0 || queries.every((q) => !q.isLoading)

  useEffect(() => {
    const fresh = queries
      .filter((q) => q.data)
      .map((q) => q.data as Pokemon)
      .filter((p) => !processedRef.current.has(p.id))

    if (fresh.length > 0) {
      fresh.forEach((p) => processedRef.current.add(p.id))
      setPokemonCacheBatch(fresh)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successCount, setPokemonCacheBatch])

  useEffect(() => {
    if (chunkDone && chunkIndex < totalChunks - 1) {
      setChunkIndex((i) => i + 1)
    }
  }, [chunkDone, chunkIndex, totalChunks])

  const cachedTotal = processedRef.current.size
  const isDone = totalChunks === 0 || (chunkIndex >= totalChunks - 1 && chunkDone)

  return {
    total: uncachedIds.length,
    loaded: cachedTotal,
    isDone,
  }
}
