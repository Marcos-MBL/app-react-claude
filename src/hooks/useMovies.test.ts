import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useMovies } from './useMovies'

// `useMovies` internamente llama a `toast.error` en el camino de error; no
// necesitamos verificar la UI del toast aquí, así que lo mockeamos para que
// el test se enfoque solo en el estado que expone el hook.
vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn() },
}))

const buildFormData = (title: string) => {
  const formData = new FormData()
  formData.set('title', title)
  return formData
}

describe('useMovies', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('actualiza movies con los resultados de OMDb cuando la búsqueda es exitosa (camino feliz)', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => ({
        Response: 'True',
        Search: [
          { Title: 'Batman Begins', Year: '2005', imdbID: 'tt0372784', Type: 'movie', Poster: 'N/A' },
          { Title: 'The Dark Knight', Year: '2008', imdbID: 'tt0468569', Type: 'movie', Poster: 'N/A' },
        ],
        totalResults: '2',
      }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const { result } = renderHook(() => useMovies())

    await act(async () => {
      result.current.searchAction(buildFormData('Batman'))
    })

    await waitFor(() => expect(result.current.hasSearched).toBe(true))

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(result.current.movies).toHaveLength(2)
    expect(result.current.movies[0]?.Title).toBe('Batman Begins')
    expect(result.current.error).toBeNull()
    expect(result.current.isPending).toBe(false)
  })

  it('expone un error legible cuando OMDb responde con Response: "False" (edge case)', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => ({
        Response: 'False',
        Error: 'Invalid API key!',
      }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const { result } = renderHook(() => useMovies())

    await act(async () => {
      result.current.searchAction(buildFormData('Batman'))
    })

    await waitFor(() => expect(result.current.hasSearched).toBe(true))

    expect(result.current.movies).toHaveLength(0)
    expect(result.current.error).toBe('Invalid API key!')
  })
})
