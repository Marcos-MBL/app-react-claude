export interface MovieSearchResult {
  Title: string
  Year: string
  imdbID: string
  Type: string
  Poster: string
}

export interface MovieRating {
  Source: string
  Value: string
}

export interface MovieDetail {
  Title: string
  Year: string
  Rated: string
  Released: string
  Runtime: string
  Genre: string
  Director: string
  Writer: string
  Actors: string
  Plot: string
  Language: string
  Country: string
  Awards: string
  Poster: string
  Ratings: MovieRating[]
  Metascore: string
  imdbRating: string
  imdbVotes: string
  imdbID: string
  Type: string
  BoxOffice: string
}

export type NoteImportance = 'low' | 'medium' | 'high'

/**
 * Nota enriquecida de una película, persistida como columna TEXT en SQLite.
 * `content` guarda el documento JSON de TipTap (`editor.getJSON()`); se tipa
 * como `unknown` porque su forma es recursiva y se valida al montar el editor.
 */
export interface MovieNote {
  id: string
  imdbID: string
  content: unknown
  importance: NoteImportance
  createdAt: string
  updatedAt: string
}

export type Theme = 'light' | 'dark'

export interface WatchlistItem {
  imdbID: string
  title: string
  poster: string
  addedAt: string
  watched: boolean
}
