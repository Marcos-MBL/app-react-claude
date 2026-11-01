import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Añade los matchers de @testing-library/jest-dom (toBeInTheDocument, toHaveAttribute, etc.)
// a los `expect` de Vitest antes de ejecutar cualquier test.
import '@testing-library/jest-dom/vitest'

// Como usamos `globals: false`, React Testing Library no detecta automáticamente
// los hooks del test runner para desmontar el DOM entre tests; lo hacemos manual.
afterEach(() => {
  cleanup()
})
