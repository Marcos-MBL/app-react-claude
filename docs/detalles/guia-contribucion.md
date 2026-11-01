# Guía de Contribución — Buscador de Películas Agéntico

Esta guía está pensada para una persona desarrolladora que se suma al
proyecto por primera vez. Describe el estado **real** del código (verificado
leyendo `package.json`, `src/`, `tsconfig.app.json` y `eslint.config.js`), no
el estado aspiracional de `SPEC.md`.

## 1. Clonar y levantar el proyecto

### 1.1. Requisitos

- Node.js y npm instalados (el proyecto usa Vite 8 + TypeScript 6).
- Una API key gratuita de OMDb.

### 1.2. Pasos

```bash
git clone <url-del-repo>
cd buscador-peliculas
npm install
```

### 1.3. Variable de entorno obligatoria

La app necesita una API key de OMDb para que la búsqueda y el detalle de
películas funcionen. Creá un archivo `.env` en la raíz del proyecto (al
mismo nivel que `package.json`) con el siguiente contenido:

```
VITE_OMDB_API_KEY=tu_api_key_aqui
```

- La key se obtiene gratis en <https://www.omdbapi.com/apikey.aspx>.
- `.env` está en `.gitignore`: nunca se commitea, cada persona usa la suya.
- Al día de esta guía no hay un `.env.example` versionado en el repo; si vas
  a crear uno, debe quedar limitado a `VITE_OMDB_API_KEY=` sin un valor real.
- **Sin esta variable, el cliente de OMDb (`src/service/omdb.ts`) lanza un
  error explícito** antes de hacer cualquier request (función
  `assertApiKey`). Ese error se propaga a la interfaz como una notificación
  y un mensaje en pantalla — no falla en silencio.

### 1.4. Levantar el servidor de desarrollo

```bash
npm run dev
```

Esto inicia Vite en modo desarrollo. `index.html` carga además, vía
`<script>` global, el motor `sql.js` (SQLite compilado a WebAssembly) desde
`https://sql.js.org/dist/sql-wasm.js` — necesitás conexión a internet la
primera vez para que el editor de notas pueda persistir datos (ver
`docs/ARCHITECTURE.md` para el detalle completo de esa persistencia).

## 2. Comandos disponibles (reales, de `package.json`)

```bash
npm run dev       # servidor de desarrollo (Vite)
npm run build     # type-check (tsc -b) + build de producción (vite build)
npm run lint      # ESLint sobre todo el repo (eslint .)
npm run preview   # sirve el build de producción generado por "build"
```

Puntos a tener en cuenta:

- **No existe un script `npm run typecheck` separado.** El type-check ocurre
  como parte de `npm run build`, que ejecuta `tsc -b` (con project
  references: `tsconfig.json` → `tsconfig.app.json` + `tsconfig.node.json`)
  antes de invocar `vite build`. Si solo querés validar tipos sin generar el
  build, podés correr `npx tsc -b --noEmit` manualmente.
- **No hay test runner configurado.** No existe script `test` en
  `package.json`, ni Jest, Vitest, Testing Library ni ningún framework de
  testing en las dependencias. No inventes comandos de test en PRs ni en
  CI: hoy no hay forma de "correr los tests" porque no hay tests.
- `npm run lint` corre ESLint sobre **todo** el repo (no solo `src/`), con la
  configuración de `eslint.config.js`: `@eslint/js` recomendado,
  `typescript-eslint` recomendado, `eslint-plugin-react-hooks` y
  `eslint-plugin-react-refresh`.

## 3. Antes de abrir un PR

Como no hay CI documentado en este repo, correlo localmente:

```bash
npm run lint
npm run build   # valida tipos (tsc -b) y que el build de producción no rompa
```

Un PR no debería introducir errores nuevos de ESLint ni de tipos. Al momento
de escribir esta guía, ambos comandos pasan limpios sobre el código
existente.

## 4. Convenciones de código (de `CLAUDE.md`, con verificación en el código real)

- **Componentes como arrow function**: `const ComponentName = () => { ... }`.
  La mayoría del código sigue esto (`Layout`, `MovieDetail`,
  `MovieNoteEditor`, `SearchBar`), **pero `MovieCard` y `MovieGrid` hoy están
  escritos como `function MovieCard(...)` / `function MovieGrid(...)`** —una
  inconsistencia preexistente respecto a la convención declarada. No la
  repliques en código nuevo: cualquier componente nuevo debe usar arrow
  function. Si tocás `MovieCard.tsx` o `MovieGrid.tsx` por otro motivo,
  considerá corregir la forma a arrow function en el mismo cambio.
- **Prohibido `any`**: no hay ningún uso de `any` en `src/` actualmente
  (verificado por grep). Si un tipo es desconocido, usar `unknown` (así se
  tipa, por ejemplo, el campo `content: unknown` de `MovieNote` en
  `src/types/index.ts`, porque el documento JSON de TipTap es recursivo) o
  definir la interfaz en `src/types/index.ts` antes de crear archivos de
  tipos nuevos.
- **Orden de clases Tailwind**: Layout → Spacing → Typography → Colors (por
  ejemplo `flex flex-col gap-3 text-sm text-gray-900 dark:text-gray-100`).
- **SQL puro, sin ORM**: la capa de persistencia (`src/db/database.ts`) usa
  `db.run(...)` y `db.prepare(...)` de `sql.js` con SQL literal
  (`CREATE TABLE IF NOT EXISTS`, `INSERT ... ON CONFLICT ... DO UPDATE`,
  `SELECT ... WHERE`). No se agregó ni se debe agregar un ORM.
- **Idioma**: identificadores de código (variables, funciones, archivos,
  componentes) en inglés; comentarios de lógica compleja y JSDoc en español.
  Esto se cumple consistentemente en `src/db/database.ts` y
  `src/hooks/useMovieDetail.ts`, entre otros.
- **Tipado centralizado**: antes de crear un archivo de tipos nuevo, revisar
  `src/types/index.ts` — ahí viven `MovieSearchResult`, `MovieRating`,
  `MovieDetail`, `NoteImportance`, `MovieNote` y `WatchlistItem` (este último
  ya está definido como preparación para la Watchlist futura, aunque todavía
  no se usa en ningún componente — es deuda intencional del SPEC, no un
  error).

## 5. Estructura de carpetas real

```
src/
├── components/        # Componentes de presentación y de feature, mezclados
│   ├── Layout.tsx          # Header + contenedor general + <Toaster />
│   ├── SearchBar.tsx        # Input controlado, delega a onSearch
│   ├── MovieGrid.tsx        # Cuadrícula de MovieCard
│   ├── MovieCard.tsx        # Tarjeta individual de resultado
│   ├── MovieDetail.tsx      # Vista de detalle + incrusta MovieNoteEditor
│   └── MovieNoteEditor.tsx  # Editor TipTap + lectura/escritura en SQLite
├── hooks/              # Estado + llamadas a service/, por feature
│   ├── useMovies.ts         # Búsqueda (consume service/omdb.ts)
│   └── useMovieDetail.ts    # Detalle (consume service/omdb.ts)
├── service/            # Clientes de APIs externas, sin estado de React
│   └── omdb.ts              # searchMovies, getMovieById
├── db/                 # Persistencia local
│   └── database.ts          # sql.js + localStorage, SQL puro
├── types/
│   └── index.ts              # Tipos de dominio compartidos
├── App.tsx             # Conecta hooks con componentes de presentación
├── main.tsx
├── index.css           # Configuración de Tailwind v4 (sin tailwind.config.js)
└── vite-env.d.ts
```

Nota para quien venga de leer `CLAUDE.md`: ese archivo describe una
organización por `src/features/<nombre>/` (hook + componentes de esa
feature juntos). Esa carpeta **sigue existiendo** en el repo
(`src/features/movie-detail/`, `src/features/notes/`, `src/features/watchlist/`),
pero las tres están vacías — son el espacio reservado para funcionalidad
futura, tal como ya aclara `CLAUDE.md`. Lo que sí cambió es `src/features/search/`:
sus archivos (`SearchBar.tsx`, `useMovieSearch.ts`) fueron migrados a la
organización plana actual (`components/SearchBar.tsx`, `hooks/useMovies.ts`),
que es la que de verdad está en uso. Si vas a tocar `CLAUDE.md`, actualizá
esa sección para reflejar que `search` ya no vive en `features/`; mientras
tanto, seguí la estructura real descripta en esta guía para código nuevo.

## 6. Qué falta (no inventar funcionalidad)

`src/types/index.ts` ya define `WatchlistItem`, pero no hay Watchlist
persistente ni funcionalidad de "compartir" implementadas en ningún
componente, hook o endpoint. Si tu contribución toca esa área, es trabajo
nuevo sobre una base vacía, no una corrección de algo existente.
