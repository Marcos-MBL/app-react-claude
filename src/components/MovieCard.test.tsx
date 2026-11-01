import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { MovieSearchResult } from '../types'
import { MovieCard } from './MovieCard'

const mockMovie: MovieSearchResult = {
  Title: 'Batman Begins',
  Year: '2005',
  imdbID: 'tt0372784',
  Type: 'movie',
  Poster: 'https://example.com/batman.jpg',
}

describe('MovieCard', () => {
  it('renderiza el título, el año y el póster de la película', () => {
    render(<MovieCard movie={mockMovie} />)

    expect(screen.getByText('Batman Begins')).toBeInTheDocument()
    expect(screen.getByText('2005')).toBeInTheDocument()

    const image = screen.getByRole('img', { name: 'Póster de Batman Begins' })
    expect(image).toHaveAttribute('src', mockMovie.Poster)
  })

  it('muestra un placeholder cuando el póster es "N/A" (edge case)', () => {
    render(<MovieCard movie={{ ...mockMovie, Poster: 'N/A' }} />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('Sin póster')).toBeInTheDocument()
  })

  it('invoca onClick con la película al hacer click en la tarjeta', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<MovieCard movie={mockMovie} onClick={handleClick} />)

    await user.click(screen.getByRole('button'))

    expect(handleClick).toHaveBeenCalledWith(mockMovie)
  })
})
