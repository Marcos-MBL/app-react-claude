# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Idioma y Comunicación
- **Idioma del Agente** Responder y explicar siempre en Español.
- **Documentación:** Comentarios de funciones complejos siempre en Español (JSDoc).
- **Código:** Nombres de variables, funciones y archivos estrictamente en Inglés.

## Patrones de Código
- **Componentes:** Usar siempre `const ComponentName = () => { ... }`(Arrow Functions).
- **Tipado:** No usar jamás `any`. Si un tipo es desconocido, usar `unknown` o definir la interfaz en `src/types/index.ts` primero.
- **Tailwind:** Mantener las clases en orden lógico (Layout -> Spacing -> Typography -> Colors).

## Comandos

```bash
npm run dev       # servidor de desarrollo (Vite)
npm run build     # type-check (tsc -b) + build de producción
npm run lint      # ESLint sobre todo el repo
npm run preview   # sirve el build de producción localmente
```

No hay configurado un test runner todavía (no hay `test` script ni librería de testing instalada).

### Variable de entorno requerida

La app llama directamente a la API de OMDb desde el cliente y necesita una API key:

```bash
cp .env.example .env
# editar .env y setear VITE_OMDB_API_KEY=<tu key>
```

Sin esa variable, `src/lib/omdb.ts` lanza un error explícito (`assertApiKey`) antes de hacer cualquier request.

## Arquitectura

Esta es la app "Buscador de Películas Agéntico" descrita en `SPEC.md`: una app tipo note-taking enfocada en películas — buscar en OMDb, ver detalle, y llevar una Watchlist personal con notas en rich text (TipTap) por película.

**Estado actual del código**: solo está implementado el flujo de búsqueda (`App.tsx` → `SearchBar` → `useMovieSearch` → `lib/omdb.ts` → `MovieGrid`/`MovieCard`). Las carpetas `src/features/movie-detail/`, `src/features/notes/`, `src/features/watchlist/` y `src/hooks/` existen pero están vacías — son el espacio reservado para el resto de la funcionalidad descrita en `SPEC.md` (detalle de película, gestión de notas enriquecidas, y compartir la watchlist).

**Organización por features**: el código de dominio vive bajo `src/features/<nombre>/` (hook de estado + componentes de esa feature juntos, ver `src/features/search/`), mientras que `src/components/` contiene componentes de presentación reutilizables entre features (`MovieCard`, `MovieGrid`). `src/lib/` contiene clientes de APIs externas sin estado de React (`omdb.ts`). `src/types/` contiene los tipos de dominio compartidos (`movie.ts`).

**Patrón por feature**: un hook custom (`useMovieSearch`) encapsula el estado y las llamadas a `lib/`, y expone un objeto de estado + funciones; el componente (`SearchBar`) es controlado y solo dispara callbacks (`onSearch`). `App.tsx` conecta el hook de la feature con los componentes de presentación.

**Cliente OMDb** (`src/lib/omdb.ts`): expone `searchMovies(title, page)` y `getMovieById(imdbID)`. La API de OMDb devuelve `Response: 'True' | 'False'` con un campo `Error` en vez de status HTTP de error; el cliente normaliza esto lanzando excepciones (excepto el caso "Movie not found!" en búsquedas, que se trata como resultado vacío, no como error).

**Persistencia (planeada, aún no implementada)**: según `SPEC.md`, la Watchlist y las notas se persistirán en SQLite con SQL puro (no hay ORM ni cliente SQLite instalado todavía).

**Editor de notas (planeado, aún no implementado)**: TipTap (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/pm`) ya está en `package.json` para implementar notas en rich text con: negrita/itálica, 3 niveles de heading + texto normal, código en línea + bloques de código, listas con viñetas, y líneas separadoras horizontales.

**Styling**: TailwindCSS v4 vía `@tailwindcss/vite` (sin `tailwind.config.js` — configuración en `src/index.css`). Los componentes existentes soportan dark mode con variantes `dark:` de Tailwind.

**TypeScript**: proyecto configurado manualmente (no con `create-vite` por defecto) con project references (`tsconfig.json` → `tsconfig.app.json` + `tsconfig.node.json`), `verbatimModuleSyntax` activado (los imports de solo-tipo deben usar `import type`), y `noUnusedLocals`/`noUnusedParameters` estrictos.
