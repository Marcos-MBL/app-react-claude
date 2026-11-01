import { useState } from 'react'
import type { MovieSearchResult } from '../types'

interface MovieCardProps {
  movie: MovieSearchResult
  onClick?: (movie: MovieSearchResult) => void
}

export const MovieCard = ({ movie, onClick }: MovieCardProps) => {
  const [imageFailed, setImageFailed] = useState(false)
  const hasPoster = movie.Poster && movie.Poster !== 'N/A' && !imageFailed

  return (
    <button
      type="button"
      onClick={() => onClick?.(movie)}
      className="group flex flex-col overflow-hidden rounded-lg border text-left shadow-md transition duration-200 hover:-translate-y-1 hover:shadow-lg border-gray-200 dark:border-gray-800"
    >
      <div className="aspect-2/3 w-full bg-gray-100 dark:bg-gray-900">
        {hasPoster ? (
          <img
            src={movie.Poster}
            alt={`Póster de ${movie.Title}`}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
            Sin póster
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 text-sm font-medium text-gray-900 transition-colors group-hover:text-indigo-600 dark:text-gray-100 dark:group-hover:text-indigo-400">
          {movie.Title}
        </h3>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{movie.Year}</p>
      </div>
    </button>
  )
}
