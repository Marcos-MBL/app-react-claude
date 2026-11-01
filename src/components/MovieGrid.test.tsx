import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { MovieSearchResult } from '../types'
import { MovieGrid } from './MovieGrid'

// Datos mockeados que simulan la forma de la respuesta `Search` de OMDb,
// sin golpear la red real.
const mockMovies: MovieSearchResult[] = [
  { Title: 'Batman Begins', Year: '2005', imdbID: 'tt0372784', Type: 'movie', Poster: 'N/A' },
  { Title: 'The Dark Knight', Year: '2008', imdbID: 'tt0468569', Type: 'movie', Poster: 'N/A' },
  { Title: 'Batman Returns', Year: '1992', imdbID: 'tt0103776', Type: 'movie', Poster: 'N/A' },
]

describe('MovieGrid', () => {
  it('renderiza una tarjeta por cada película recibida', () => {
    render(<MovieGrid movies={mockMovies} />)

    expect(screen.getAllByRole('button')).toHaveLength(mockMovies.length)
    expect(screen.getByText('Batman Begins')).toBeInTheDocument()
    expect(screen.getByText('The Dark Knight')).toBeInTheDocument()
    expect(screen.getByText('Batman Returns')).toBeInTheDocument()
  })

  it('no renderiza ninguna tarjeta cuando la lista de películas está vacía (edge case)', () => {
    render(<MovieGrid movies={[]} />)

    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })

  it('propaga la película seleccionada a través de onSelect', async () => {
    const user = userEvent.setup()
    const handleSelect = vi.fn()
    render(<MovieGrid movies={mockMovies} onSelect={handleSelect} />)

    await user.click(screen.getByText('The Dark Knight'))

    expect(handleSelect).toHaveBeenCalledWith(mockMovies[1])
  })
})
