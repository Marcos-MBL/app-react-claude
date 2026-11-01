import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getMovieById } from '../service/omdb'
import type { MovieDetail } from '../types'

/**
 * Carga el detalle completo de una película desde OMDb cada vez que cambia
 * `imdbID`.
 */
export const useMovieDetail = (imdbID: string) => {
  const [movie, setMovie] = useState<MovieDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadDetail = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const detail = await getMovieById(imdbID)
        if (isMounted) setMovie(detail)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al cargar el detalle de la película.'
        if (isMounted) {
          setError(message)
          toast.error(message)
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadDetail()

    return () => {
      isMounted = false
    }
  }, [imdbID])

  return { movie, isLoading, error }
}
