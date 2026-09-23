import { useState } from 'react'
import type { FormEvent } from 'react'

interface SearchBarProps {
  onSearch: (title: string) => void
  loading?: boolean
}

export function SearchBar({ onSearch, loading }: SearchBarProps) {
  const [value, setValue] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onSearch(value)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Buscar películas por título…"
        className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:focus:border-gray-500"
      />
      <button
        type="submit"
        disabled={loading || !value.trim()}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900"
      >
        {loading ? 'Buscando…' : 'Buscar'}
      </button>
    </form>
  )
}
