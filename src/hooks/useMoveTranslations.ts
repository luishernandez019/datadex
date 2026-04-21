import { useQueries } from '@tanstack/react-query'
import { fetchMoveDetail } from '@/lib/api'
import type { Lang } from '@/lib/translations'

/**
 * Batch-fetches Spanish names for a list of moves.
 * When language is 'en', returns a map of formatted English names immediately
 * without any network requests.
 *
 * Returns: Map<apiSlug, localizedDisplayName>
 */
export function useMoveTranslations(slugs: string[], language: Lang): Map<string, string> {
  const shouldFetch = language === 'es'

  const queries = useQueries({
    queries: slugs.map((slug) => ({
      queryKey: ['move-detail', slug],
      queryFn: () => fetchMoveDetail(slug),
      enabled: shouldFetch,
      staleTime: Infinity,
    })),
  })

  const map = new Map<string, string>()

  slugs.forEach((slug, i) => {
    const fallback = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

    if (!shouldFetch) {
      map.set(slug, fallback)
      return
    }

    const data = queries[i]?.data
    const localName =
      data?.names.find((n) => n.language.name === 'es')?.name ??
      data?.names.find((n) => n.language.name === 'en')?.name ??
      fallback

    map.set(slug, localName)
  })

  return map
}
