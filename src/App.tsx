import { useState } from 'react'
import { Layout } from './components/Layout'
import { MovieDetail } from './components/MovieDetail'
import { MovieGrid } from './components/MovieGrid'
import { SearchBar } from './components/SearchBar'
import { useMovies } from './hooks/useMovies'

const App = () => {
  const { movies, error, hasSearched, searchAction } = useMovies()
  const [selectedImdbID, setSelectedImdbID] = useState<string | null>(null)

  if (selectedImdbID) {
    return (
      <Layout>
        <MovieDetail imdbID={selectedImdbID} onBack={() => setSelectedImdbID(null)} />
      </Layout>
    )
  }

  return (
    <Layout>
      <SearchBar action={searchAction} />

      <div className="mt-6">
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {!error && movies.length > 0 && (
          <MovieGrid movies={movies} onSelect={(movie) => setSelectedImdbID(movie.imdbID)} />
        )}

        {!error && hasSearched && movies.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No se encontraron películas para esa búsqueda.
          </p>
        )}
      </div>
    </Layout>
  )
}

export default App
