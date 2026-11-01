import { useEffect, useState } from 'react'
import type { Theme } from '../types'

const STORAGE_KEY = 'theme'

const getInitialTheme = (): Theme => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') {
    return stored
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Gestiona el tema claro/oscuro de la app: lo inicializa desde `localStorage`
 * (o la preferencia del sistema si no hay valor guardado) y sincroniza la
 * clase `dark` en `<html>` para que las variantes `dark:` de Tailwind reaccionen.
 */
export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }

  return { theme, toggleTheme }
}
