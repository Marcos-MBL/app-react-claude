import type { Database, InitSqlJsStatic } from 'sql.js'
import type { MovieNote, NoteImportance } from '../types'

// `sql.js` se carga como <script> global en index.html (window.initSqlJs) en vez
// de importarse como módulo ESM: el paquete npm está empaquetado como
// UMD/emscripten y Vite no lo interopera de forma fiable como import por defecto.
declare global {
  interface Window {
    initSqlJs?: InitSqlJsStatic
  }
}

// URL del CDN oficial de sql.js: sirve el binario WASM que initSqlJs necesita
// cargar de forma asíncrona antes de poder crear cualquier Database.
const SQL_WASM_CDN_URL = 'https://sql.js.org/dist/'
const DB_STORAGE_KEY = 'buscador-peliculas-db'

let databaseInstance: Database | null = null

/**
 * Convierte los bytes exportados de sql.js a un string base64 para poder
 * guardarlos en localStorage (el navegador no tiene acceso a disco).
 */
const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

/**
 * Hace el proceso inverso a `bytesToBase64`: reconstruye el Uint8Array
 * original a partir del string base64 guardado en localStorage.
 */
const base64ToBytes = (base64Data: string): Uint8Array => {
  const binary = atob(base64Data)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

/**
 * Crea la tabla `movie_notes` si todavía no existe. `content` guarda el
 * documento JSON de TipTap serializado como texto (columna TEXT). El índice
 * único en `imdb_id` garantiza una sola nota por película y habilita el
 * upsert de `saveMovieNote` (ON CONFLICT).
 */
const createSchema = (db: Database): void => {
  db.run(`
    CREATE TABLE IF NOT EXISTS movie_notes (
      id TEXT PRIMARY KEY,
      imdb_id TEXT NOT NULL,
      content TEXT NOT NULL,
      importance TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `)
  db.run(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_movie_notes_imdb_id ON movie_notes (imdb_id);
  `)
}

/**
 * Lee el archivo de base de datos persistido en localStorage (si existe) y
 * lo devuelve como bytes, listos para reconstruir una instancia de sql.js.
 */
export const loadDatabase = (): Uint8Array | null => {
  const base64Data = localStorage.getItem(DB_STORAGE_KEY)
  if (!base64Data) {
    return null
  }
  return base64ToBytes(base64Data)
}

/**
 * Exporta el estado actual de la base de datos y lo persiste en
 * localStorage codificado en base64.
 */
export const saveDatabase = (db: Database): void => {
  const exportedBytes = db.export()
  localStorage.setItem(DB_STORAGE_KEY, bytesToBase64(exportedBytes))
}

/**
 * Inicializa el motor sql.js (WASM, cargado como global desde el <script>
 * de index.html) y devuelve una instancia de Database lista para usar:
 * restaura los datos persistidos en localStorage si existen, o crea una
 * base nueva con el esquema base. Reutiliza la misma instancia en llamadas
 * posteriores.
 *
 * Es resistente a fallos a propósito: si el script de sql.js no llegó a
 * cargar (CDN caído, sin red, bloqueado por el navegador) o la
 * inicialización del WASM falla, devuelve `null` en vez de lanzar, para que
 * el resto de la app pueda seguir funcionando sin persistencia.
 */
export const initDatabase = async (): Promise<Database | null> => {
  if (databaseInstance) {
    return databaseInstance
  }

  const initSqlJs = window.initSqlJs
  if (!initSqlJs) {
    console.error(
      'sql.js no está disponible: revisa que el <script> de sql-wasm.js en index.html se haya cargado.',
    )
    return null
  }

  try {
    const SQL = await initSqlJs({
      locateFile: (file) => `${SQL_WASM_CDN_URL}${file}`,
    })

    const persistedBytes = loadDatabase()
    databaseInstance = persistedBytes ? new SQL.Database(persistedBytes) : new SQL.Database()

    createSchema(databaseInstance)

    return databaseInstance
  } catch (err) {
    console.error('No se pudo inicializar la base de datos SQLite.', err)
    return null
  }
}

/**
 * Guarda una nota de película con SQL puro (INSERT INTO movie_notes). Si ya
 * existe una nota para esa `imdb_id`, la actualiza en vez de duplicarla
 * (upsert vía ON CONFLICT). `content` se serializa a JSON antes de
 * insertarse porque la columna es de tipo TEXT.
 */
export const saveMovieNote = (db: Database, note: MovieNote): void => {
  db.run(
    `INSERT INTO movie_notes (id, imdb_id, content, importance, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(imdb_id) DO UPDATE SET
       content = excluded.content,
       importance = excluded.importance,
       updated_at = excluded.updated_at`,
    [
      note.id,
      note.imdbID,
      JSON.stringify(note.content),
      note.importance,
      note.createdAt,
      note.updatedAt,
    ],
  )

  saveDatabase(db)
}

/**
 * Busca con SQL puro (SELECT) la nota guardada para una película dada.
 * Devuelve `null` si todavía no tiene ninguna nota asociada.
 */
export const getMovieNoteByImdbId = (db: Database, imdbID: string): MovieNote | null => {
  const statement = db.prepare('SELECT * FROM movie_notes WHERE imdb_id = ? LIMIT 1')
  statement.bind([imdbID])

  const hasRow = statement.step()
  const row = hasRow ? statement.getAsObject() : null
  statement.free()

  if (!row) {
    return null
  }

  return {
    id: String(row.id),
    imdbID: String(row.imdb_id),
    content: JSON.parse(String(row.content)),
    importance: String(row.importance) as NoteImportance,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}
