import type { ReactNode } from 'react'
import { Toaster } from 'react-hot-toast'

interface LayoutProps {
  children: ReactNode
}

/**
 * Envoltorio general de la app: header con el título y contenedor
 * centrado para el contenido principal.
 */
export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <Toaster position="top-right" />

      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <h1 className="text-2xl font-semibold">Buscador de Películas</h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  )
}
