import { MovieGrid } from './components/MovieGrid'
import { SearchBar } from './features/search/SearchBar'
import { useMovieSearch } from './features/search/useMovieSearch'

function App() {
  const { query, results, totalResults, loading, error, hasSearched, search } =
    useMovieSearch()

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <h1 className="text-2xl font-semibold">Buscador de Películas</h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <SearchBar onSearch={search} loading={loading} />

        <div className="mt-6">
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          {!error && hasSearched && !loading && results.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No se encontraron resultados para «{query}».
            </p>
          )}

          {!error && results.length > 0 && (
            <>
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                {totalResults} resultado{totalResults === 1 ? '' : 's'} para «{query}»
              </p>
              <MovieGrid movies={results} />
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
