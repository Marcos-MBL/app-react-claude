import { useFormStatus } from 'react-dom'

interface SearchBarProps {
  action: (formData: FormData) => void
}

/**
 * Botón de envío desacoplado del padre: lee el estado `pending` del
 * formulario con `useFormStatus`, sin necesitar un prop `loading`.
 */
const SubmitButton = () => {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="shrink-0 px-6 py-3 text-sm font-semibold rounded-full bg-indigo-600 text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
    >
      {pending ? 'Buscando…' : 'Buscar'}
    </button>
  )
}

/**
 * Barra de búsqueda conectada a una React Action: no maneja estado propio,
 * delega el envío del formulario a `action`.
 */
export const SearchBar = ({ action }: SearchBarProps) => {
  return (
    <form action={action} className="flex w-full max-w-2xl mx-auto gap-3">
      <div className="relative flex-1">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 dark:text-gray-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          type="text"
          name="title"
          required
          placeholder="Buscar películas por título…"
          className="w-full py-3 pl-11 pr-4 text-sm rounded-full border border-gray-300 bg-white text-gray-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
        />
      </div>
      <SubmitButton />
    </form>
  )
}
