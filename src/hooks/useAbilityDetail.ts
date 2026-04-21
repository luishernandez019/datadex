import { useQuery } from '@tanstack/react-query'
import { fetchAbility } from '@/lib/api'

export function useAbilityDetail(nameOrId: string | number) {
  return useQuery({
    queryKey: ['ability', nameOrId],
    queryFn: () => fetchAbility(nameOrId),
    enabled: !!nameOrId,
    staleTime: Infinity,
  })
}
