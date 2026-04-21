import { useQueries } from '@tanstack/react-query'
import { useMemo, useEffect, useRef, useState } from 'react'
import { fetchPokemon } from '@/lib/api'
import { usePokemonStore } from '@/store/pokemonStore'
import type { Pokemon } from '@/types/pokemon'

const CHUNK_SIZE = 50

/**
 * Loads all pokemon in background chunks of CHUNK_SIZE.
 * Only activates when `enabled` is true.
 * Results are stored in the Zustand pokemonCache.
 */
export function useAllPokemonLoader(allIds: number[], enabled: boolean) {
  const setPokemonCacheBatch = usePokemonStore((s) => s.setPokemonCacheBatch)
  const pokemonCache = usePokemonStore((s) => s.pokemonCache)
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

  // Stable primitive: number of successful queries in current chunk
  const successCount = queries.filter((q) => q.isSuccess).length
  const chunkDone = currentChunkIds.length === 0 || queries.every((q) => !q.isLoading)

  // Cache newly loaded pokemon — fires only when successCount increases
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

  // Advance to next chunk when current one finishes
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
