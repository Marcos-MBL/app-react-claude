import { useMovieDetail } from '../hooks/useMovieDetail'
import { MovieNoteEditor } from './MovieNoteEditor'

interface MovieDetailProps {
  imdbID: string
  onBack: () => void
}

/**
 * Vista de detalle de una película: datos básicos de OMDb (póster, título,
 * sinopsis) y, debajo, el editor de notas (`MovieNoteEditor`) asociado a
 * ese `imdbID`.
 */
export const MovieDetail = ({ imdbID, onBack }: MovieDetailProps) => {
  const { movie, isLoading, error } = useMovieDetail(imdbID)

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={onBack}
        className="self-start text-sm font-medium text-indigo-600 dark:text-indigo-400"
      >
        ← Volver a resultados
      </button>

      {isLoading && <p className="text-sm text-gray-500 dark:text-gray-400">Cargando película…</p>}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {movie && (
        <div className="flex flex-col gap-6 sm:flex-row">
          <img
            src={movie.Poster}
            alt={`Póster de ${movie.Title}`}
            className="w-full max-w-xs rounded-lg object-cover"
          />
          <div className="flex flex-1 flex-col gap-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {movie.Title} <span className="text-gray-400 dark:text-gray-500">({movie.Year})</span>
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">{movie.Plot}</p>
          </div>
        </div>
      )}

      {movie && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Mi apunte</h3>
          <MovieNoteEditor imdbID={movie.imdbID} />
        </div>
      )}
    </div>
  )
}
