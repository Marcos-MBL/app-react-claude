import { useCallback, useState } from 'react'
import { searchMovies } from '../../lib/omdb'
import type { MovieSearchResult } from '../../types/movie'

interface MovieSearchState {
  query: string
  results: MovieSearchResult[]
  totalResults: number
  loading: boolean
  error: string | null
  hasSearched: boolean
}

export function useMovieSearch() {
  const [state, setState] = useState<MovieSearchState>({
    query: '',
    results: [],
    totalResults: 0,
    loading: false,
    error: null,
    hasSearched: false,
  })

  const search = useCallback(async (title: string) => {
    const trimmed = title.trim()
    if (!trimmed) return

    setState((prev) => ({
      ...prev,
      query: trimmed,
      loading: true,
      error: null,
      hasSearched: true,
    }))

    try {
      const { results, totalResults } = await searchMovies(trimmed)
      setState((prev) => ({ ...prev, results, totalResults, loading: false }))
    } catch (err) {
      setState((prev) => ({
        ...prev,
        results: [],
        totalResults: 0,
        loading: false,
        error: err instanceof Error ? err.message : 'Error inesperado al buscar.',
      }))
    }
  }, [])

  return { ...state, search }
}
