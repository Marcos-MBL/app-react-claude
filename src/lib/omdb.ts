import type { MovieDetail, MovieSearchResult } from '../types/movie'

const BASE_URL = 'https://www.omdbapi.com/'
const API_KEY = import.meta.env.VITE_OMDB_API_KEY

interface OmdbSearchResponse {
  Search?: MovieSearchResult[]
  totalResults?: string
  Response: 'True' | 'False'
  Error?: string
}

interface OmdbDetailResponse extends Partial<MovieDetail> {
  Response: 'True' | 'False'
  Error?: string
}

function assertApiKey() {
  if (!API_KEY) {
    throw new Error(
      'Falta VITE_OMDB_API_KEY. Copia .env.example a .env y añade tu API key de OMDb.',
    )
  }
}

export async function searchMovies(
  title: string,
  page = 1,
): Promise<{ results: MovieSearchResult[]; totalResults: number }> {
  assertApiKey()

  const url = new URL(BASE_URL)
  url.searchParams.set('apikey', API_KEY)
  url.searchParams.set('s', title)
  url.searchParams.set('type', 'movie')
  url.searchParams.set('page', String(page))

  const response = await fetch(url)
  const data: OmdbSearchResponse = await response.json()

  if (data.Response === 'False') {
    if (data.Error === 'Movie not found!') {
      return { results: [], totalResults: 0 }
    }
    throw new Error(data.Error ?? 'Error al buscar películas en OMDb.')
  }

  return {
    results: data.Search ?? [],
    totalResults: Number(data.totalResults ?? 0),
  }
}

export async function getMovieById(imdbID: string): Promise<MovieDetail> {
  assertApiKey()

  const url = new URL(BASE_URL)
  url.searchParams.set('apikey', API_KEY)
  url.searchParams.set('i', imdbID)
  url.searchParams.set('plot', 'full')

  const response = await fetch(url)
  const data: OmdbDetailResponse = await response.json()

  if (data.Response === 'False') {
    throw new Error(data.Error ?? 'Error al obtener el detalle de la película.')
  }

  return data as MovieDetail
}
