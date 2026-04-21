import { useQuery } from '@tanstack/react-query'
import { fetchPokemonSpecies, fetchEvolutionChain, getEvolutionChainIdFromUrl } from '@/lib/api'

export function usePokemonSpecies(id: number | string) {
  return useQuery({
    queryKey: ['pokemon-species', id],
    queryFn: () => fetchPokemonSpecies(id),
    enabled: !!id,
    staleTime: Infinity,
  })
}

export function useEvolutionChain(speciesUrl: string | undefined) {
  return useQuery({
    queryKey: ['evolution-chain', speciesUrl],
    queryFn: async () => {
      if (!speciesUrl) throw new Error('No species URL')
      const species = await fetchPokemonSpecies(
        speciesUrl.split('/').filter(Boolean).pop()!
      )
      const chainId = getEvolutionChainIdFromUrl(species.evolution_chain.url)
      return fetchEvolutionChain(chainId)
    },
    enabled: !!speciesUrl,
    staleTime: Infinity,
  })
}

export function useEvolutionChainById(chainId: number | undefined) {
  return useQuery({
    queryKey: ['evolution-chain-id', chainId],
    queryFn: () => fetchEvolutionChain(chainId!),
    enabled: !!chainId,
    staleTime: Infinity,
  })
}
