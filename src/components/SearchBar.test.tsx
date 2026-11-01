import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SearchBar } from './SearchBar'

describe('SearchBar', () => {
  it('invoca la action con un FormData que contiene el título buscado', async () => {
    const user = userEvent.setup()
    const mockAction = vi.fn()
    render(<SearchBar action={mockAction} />)

    await user.type(screen.getByPlaceholderText('Buscar películas por título…'), 'Batman')
    await user.click(screen.getByRole('button', { name: /buscar/i }))

    expect(mockAction).toHaveBeenCalledTimes(1)
    const formData = mockAction.mock.calls[0]?.[0] as FormData
    expect(formData.get('title')).toBe('Batman')
  })

  it('no dispara la action si el input está vacío (edge case, campo required)', async () => {
    const user = userEvent.setup()
    const mockAction = vi.fn()
    render(<SearchBar action={mockAction} />)

    await user.click(screen.getByRole('button', { name: /buscar/i }))

    expect(mockAction).not.toHaveBeenCalled()
  })
})
