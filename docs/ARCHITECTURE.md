# Arquitectura de persistencia: SQLite (sql.js) y localStorage

Este documento explica cómo se relacionan SQLite y `localStorage` en el
Buscador de Películas Agéntico, basándose exclusivamente en la implementación
real en `src/db/database.ts`, `src/hooks/useMovieDetail.ts` y
`src/components/MovieNoteEditor.tsx`.

## Resumen en una frase

**No hay dos bases de datos.** Hay un único motor de base de datos real
(sql.js, SQLite compilado a WebAssembly) que vive en memoria en el navegador;
`localStorage` no es una base de datos paralela ni una caché sincronizada, es
simplemente el único lugar donde ese motor puede guardar su archivo binario,
porque el navegador no expone un filesystem.

## Piezas involucradas

- **sql.js**: build de SQLite a WASM. Se carga como `<script>` global desde
  el CDN oficial (`https://sql.js.org/dist/sql-wasm.js`, referenciado en
  `index.html`) y se expone en `window.initSqlJs`. No se importa como módulo
  ESM porque el paquete npm está empaquetado como UMD/emscripten y Vite no lo
  interopera de forma fiable como `import` por defecto.
- **`databaseInstance`** (`src/db/database.ts`): variable en memoria del
  módulo que cachea la instancia de `Database` de sql.js ya inicializada,
  para no reconstruirla en cada llamada.
- **`localStorage['buscador-peliculas-db']`**: una única clave que contiene
  el binario completo de la base SQLite, codificado en base64 (texto, porque
  `localStorage` solo almacena strings).

## Flujo de arranque → lectura → escritura → persistencia

```mermaid
flowchart TD
    A[Componente React se monta<br/>MovieNoteEditor] --> B[await initDatabase()]
    B --> C{¿databaseInstance<br/>ya existe en memoria?}
    C -->|Sí| Z[Devuelve la instancia cacheada]
    C -->|No| D[Cargar script sql.js<br/>window.initSqlJs]
    D --> E{¿Script disponible<br/>e inicialización OK?}
    E -->|No| N[Devuelve null<br/>sin lanzar excepción]
    E -->|Sí| F[loadDatabase():<br/>leer clave 'buscador-peliculas-db'<br/>de localStorage]
    F --> G{¿Hay datos<br/>guardados?}
    G -->|Sí| H[base64ToBytes<br/>new SQL.Database(bytes)]
    G -->|No| I[new SQL.Database()<br/>base vacía]
    H --> J[createSchema:<br/>CREATE TABLE IF NOT EXISTS movie_notes<br/>+ índice único en imdb_id]
    I --> J
    J --> Z

    Z --> K[getMovieNoteByImdbId(db, imdbID)<br/>SELECT ... WHERE imdb_id = ?]
    K --> L[Editor TipTap se puebla<br/>con el contenido existente]

    L --> M[Usuario edita y hace clic<br/>en 'Guardar Apunte']
    M --> O[saveMovieNote(db, note):<br/>INSERT ... ON CONFLICT(imdb_id)<br/>DO UPDATE]
    O --> P[saveDatabase(db):<br/>db.export() -> Uint8Array]
    P --> Q[bytesToBase64]
    Q --> R[localStorage.setItem<br/>'buscador-peliculas-db', base64]
```

### Paso a paso

1. **Arranque (`initDatabase`)**: se llama de forma perezosa, no al cargar la
   app, sino cuando un componente la necesita (ver más abajo). Si
   `databaseInstance` ya existe, se reutiliza directamente — no hay
   recarga desde `localStorage` en cada llamada, solo en la primera.
2. **Primera carga**: si no hay instancia en memoria, se espera a que
   `window.initSqlJs` esté disponible (el `<script>` de `index.html` ya
   debe haberse ejecutado) y se inicializa el runtime WASM. Luego
   `loadDatabase()` lee la clave `buscador-peliculas-db` de `localStorage`:
   - Si existe, `base64ToBytes` la decodifica y se reconstruye un
     `SQL.Database(bytes)` con esos datos.
   - Si no existe (primera visita), se crea un `SQL.Database()` vacío.
3. **Esquema**: en ambos casos se ejecuta `createSchema`, que corre
   `CREATE TABLE IF NOT EXISTS movie_notes (...)` y un índice único en
   `imdb_id`. Es idempotente, así que no importa si la tabla ya existía
   dentro del binario restaurado.
4. **Lectura (`getMovieNoteByImdbId`)**: un `SELECT ... WHERE imdb_id = ?`
   puro contra la instancia en memoria. No toca `localStorage` en absoluto;
   lee directamente de la estructura SQLite ya cargada en RAM.
5. **Escritura (`saveMovieNote`)**: un `INSERT ... ON CONFLICT(imdb_id) DO
   UPDATE` (upsert) con parámetros posicionales, también contra la
   instancia en memoria. Inmediatamente después, **siempre** llama a
   `saveDatabase(db)`.
6. **Persistencia (`saveDatabase`)**: exporta el estado *completo* de la base
   con `db.export()` (devuelve un `Uint8Array` con el binario SQLite
   entero), lo codifica a base64 con `bytesToBase64`, y sobrescribe por
   completo la clave `buscador-peliculas-db` en `localStorage`.

### Dónde entra React en este ciclo

- **`MovieNoteEditor.tsx`**: en su `useEffect` de montaje (dependiente de
  `imdbID` y `editor`), llama a `await initDatabase()` y, si devuelve una
  instancia válida, hace `getMovieNoteByImdbId` y carga el resultado en el
  editor TipTap vía `editor.commands.setContent(...)`. Si `initDatabase`
  devuelve `null`, marca `isDbAvailable = false` y lo comunica en la UI,
  pero **no bloquea** el uso del editor — el usuario puede seguir
  escribiendo, solo que no se guardará.
- El botón **"Guardar Apunte"** (`handleSave`) vuelve a llamar a
  `await initDatabase()` (reutiliza la instancia cacheada si ya existe) y,
  si hay base disponible, construye el objeto `MovieNote` y llama a
  `saveMovieNote(db, noteToSave)`, que internamente dispara el
  `saveDatabase` descrito arriba.
- **`useMovieDetail.ts`** no interviene en esta persistencia: solo llama a
  `getMovieById` (OMDb, vía `src/service/omdb.ts`) para traer los datos
  públicos de la película. Es un flujo totalmente separado del de notas —
  solo comparten el mismo `imdbID`.

### Resiliencia

`initDatabase` está diseñado para **no lanzar excepciones**: si el
`<script>` de sql.js no cargó (CDN caído, sin red, bloqueado por el
navegador) o la inicialización del WASM falla, devuelve `null` y lo
registra con `console.error`. El resto de la app sigue funcionando sin
persistencia — el mismo patrón de robustez que usa `src/service/omdb.ts`
para fallos de red en las búsquedas.

## Aclarando el malentendido: "SQLite y localStorage son dos bases sincronizadas"

Esta idea es **incorrecta** y conviene descartarla explícitamente:

- **No existen dos fuentes de datos.** `localStorage` no tiene su propio
  esquema, ni sus propias filas, ni nada que se pueda consultar con lógica
  de negocio. Contiene un único valor: un blob de texto base64 que es el
  volcado binario completo (`db.export()`) de la base SQLite.
- **No hay sincronización incremental.** No existe ningún mecanismo que
  compare el estado de SQLite con el de `localStorage` y propague solo los
  cambios. Cada llamada a `saveMovieNote` reescribe el 100% del binario de
  la base en `localStorage`, sin importar que solo haya cambiado una fila.
- **La relación es motor ↔ mecanismo de guardado, no dato ↔ dato.** SQLite
  (vía sql.js) es el único motor de consultas: todas las lecturas (`SELECT`)
  y escrituras (`INSERT ... ON CONFLICT`) se hacen con SQL puro contra la
  instancia en memoria. `localStorage` nunca se consulta con SQL ni se lee
  fila por fila — solo se usa como "disco": `setItem` para guardar el
  snapshot y `getItem` para restaurarlo al arrancar.
- **La dirección del flujo es siempre la misma**: RAM (SQLite) → export →
  `localStorage`, y al arrancar, `localStorage` → import → RAM (SQLite).
  Nunca hay un flujo donde se escribe primero en `localStorage` y después se
  refleja en SQLite, ni un proceso en segundo plano que los mantenga
  "sincronizados" entre sí.
- **Consecuencia práctica**: si se borra la clave `buscador-peliculas-db` de
  `localStorage` manualmente, no se "desincroniza" nada — simplemente se
  pierde el único respaldo del binario, y la próxima vez que `initDatabase`
  no encuentre nada en `loadDatabase()`, creará una base nueva y vacía.

## Resumen de responsabilidades

| Pieza | Rol | Qué NO hace |
|---|---|---|
| sql.js (SQLite/WASM) | Motor de datos: esquema, SQL, consultas, upserts | No persiste nada por sí mismo entre recargas de página |
| `databaseInstance` (memoria) | Cachea la instancia activa durante la sesión del navegador | No sobrevive a un refresh de la página |
| `localStorage['buscador-peliculas-db']` | Único mecanismo de persistencia en disco del binario de SQLite | No es consultable con SQL, no tiene filas propias, no se sincroniza incrementalmente |
