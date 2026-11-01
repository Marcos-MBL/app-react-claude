import { useActionState } from 'react'
import toast from 'react-hot-toast'
import { searchMovies } from '../service/omdb'
import type { MovieSearchResult } from '../types'

interface SearchState {
  movies: MovieSearchResult[]
  error: string | null
  hasSearched: boolean
}

const initialState: SearchState = { movies: [], error: null, hasSearched: false }

/**
 * Encapsula la búsqueda como una React Action: `searchAction` se conecta
 * directamente al `action` de un `<form>` y React deriva `isPending`
 * automáticamente (sin try/catch/finally manual ni estado de loading propio).
 */
export const useMovies = () => {
  const [state, searchAction, isPending] = useActionState(
    async (previousState: SearchState, formData: FormData): Promise<SearchState> => {
      const title = String(formData.get('title') ?? '').trim()
      if (!title) return previousState

      try {
        const { results } = await searchMovies(title)
        return { movies: results, error: null, hasSearched: true }
      } catch (err) {
        // OMDb puede fallar por red o por falta de API key; normalizamos a un mensaje legible para la UI
        const message = err instanceof Error ? err.message : 'Error inesperado al buscar películas.'
        toast.error(message)
        return { movies: [], error: message, hasSearched: true }
      }
    },
    initialState,
  )

  return { movies: state.movies, error: state.error, hasSearched: state.hasSearched, isPending, searchAction }
}
