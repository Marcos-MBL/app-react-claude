# Análisis de Seguridad — Integración con la API de OMDb

**Alcance:** este análisis cubre exclusivamente `src/service/omdb.ts`, el
único punto de integración con la API externa de OMDb, y cómo sus hooks
consumidores (`src/hooks/useMovies.ts`, `src/hooks/useMovieDetail.ts`)
manejan sus respuestas y errores. No cubre `src/db/database.ts` (SQLite
local) ni la carga del script de `sql.js` desde CDN en `index.html` —son
superficies distintas, documentadas aparte en `docs/ARCHITECTURE.md`.

**Contexto del sistema evaluado**, relevante para calibrar severidad: la app
no tiene backend propio, corre entera en el navegador del usuario, no
maneja datos sensibles de terceros (solo metadatos públicos de películas) y
usa una API key gratuita de OMDb. Esto modera varias severidades que, en un
sistema con backend propio o una key de pago, serían más altas.

## Resumen de hallazgos

| # | Hallazgo | Severidad | Evidencia |
|---|---|---|---|
| 1 | API key de OMDb expuesta en el bundle cliente | Baja (pasaría a Media/Alta con una key de pago o con límites explotables) | `src/service/omdb.ts:4,33,58` |
| 2 | API key viajando como query param en texto plano (sobre HTTPS) | Baja | `src/service/omdb.ts:33,58` |
| 3 | Sin timeout/cancelación en las llamadas `fetch` | Media (disponibilidad/UX, no confidencialidad) | `src/service/omdb.ts:38,62` |
| 4 | Sin manejo específico de cuota/rate-limit de OMDb | Baja-Media | `src/service/omdb.ts:38-51,62-70` |
| 5 | Casteo sin validación de runtime de la respuesta de detalle | Baja | `src/service/omdb.ts:69` |
| 6 | Mensajes de error de OMDb mostrados tal cual al usuario | Informativa (no es una vulnerabilidad) | `src/service/omdb.ts:45,66` |
| 7 | Parámetro de búsqueda sin sanitización manual | Informativa (no aplica como riesgo real) | `src/service/omdb.ts:34` |
| 8 | Uso correcto de HTTPS | Positivo (control ya presente) | `src/service/omdb.ts:3` |

---

## 1. Exposición de la API key en el bundle cliente

**Evidencia:**
```ts
// src/service/omdb.ts:3-4
const BASE_URL = 'https://www.omdbapi.com/'
const API_KEY = import.meta.env.VITE_OMDB_API_KEY
```
y su uso en `searchMovies` (línea 33) y `getMovieById` (línea 58):
```ts
url.searchParams.set('apikey', API_KEY)
```

**Por qué es un hallazgo:** Vite reemplaza `import.meta.env.VITE_*` por su
valor literal **en tiempo de build**, e incrusta ese valor en el JavaScript
que se sirve al navegador. Esto significa que `VITE_OMDB_API_KEY` **no es un
secreto en producción**: cualquier persona puede abrir las herramientas de
desarrollador del navegador, mirar el bundle servido o inspeccionar el
tráfico de red, y leer la key en texto plano. No hay forma de usar el
prefijo `VITE_` para mantener un valor oculto del cliente — por diseño, Vite
expone todo lo que empieza con ese prefijo al código que corre en el
navegador.

**Riesgo real en este proyecto:** bajo. La key es gratuita, de uso personal,
y no da acceso a datos sensibles ni a funcionalidad destructiva — en el peor
caso, alguien podría copiar la key y hacer sus propias búsquedas contra
OMDb, consumiendo la cuota diaria compartida (ver hallazgo 4).

**Por qué igual se documenta:** este es un patrón arquitectónico, no un bug
puntual. Si en el futuro este mismo cliente (`omdb.ts`) se reutiliza para
una API de pago, con límites de uso costosos, o con datos no públicos, la
exposición pasaría a ser un problema real de severidad alta (cualquiera
podría agotar la cuota pagada o acceder a datos que no debería).

**Recomendación:**
- Para esta app, tal como está (OMDb gratis, un solo usuario, sin backend):
  **no requiere corrección inmediata**, solo se debe mantener la key fuera
  del control de versiones (ya se cumple: `.env` está en `.gitignore`).
- Si se introduce una API key de pago o con límites explotables en el
  futuro, **no replicar este patrón**: mover la llamada a un backend propio
  (o a una función serverless) que guarde la key como variable de entorno
  del servidor y nunca la envíe al cliente.

## 2. API key como query param en texto plano

**Evidencia:** `src/service/omdb.ts:33` y `:58`,
`url.searchParams.set('apikey', API_KEY)`.

**Análisis:** el transporte va sobre HTTPS (ver hallazgo "Positivo" más
abajo), así que el valor no es interceptable en tránsito por un atacante en
la red. Sin embargo, pasar secretos por query string tiene un riesgo
conocido en términos generales: puede quedar registrado en logs de
servidores intermedios (proxies corporativos, CDNs, el propio servidor de
OMDb) con más facilidad que un header, y en una app de navegación tradicional
podría quedar en el historial del navegador. En este caso concreto el
request se hace vía `fetch()` desde JavaScript (no es una navegación de
página), por lo que no se guarda en el historial del navegador del usuario.

**Riesgo real:** bajo, y redundante con el hallazgo 1 — la key ya es pública
en el bundle, así que verla además en un log de red no agrega exposición
nueva.

**Recomendación:** no requiere acción para esta integración puntual con
OMDb (la propia API de OMDb exige el parámetro `apikey` en la query string,
no ofrece alternativa por header). Si se diseña una integración nueva con
otra API que sí soporte autenticación por header, preferir el header sobre
la query string.

## 3. Ausencia de timeout o cancelación en los `fetch`

**Evidencia:**
```ts
// src/service/omdb.ts:38 (searchMovies) y :62 (getMovieById)
const response = await fetch(url)
```
Ninguna de las dos llamadas usa `AbortController`, ni ningún mecanismo de
timeout.

**Análisis:** si la API de OMDb no responde (cuelgue de red, servidor lento,
proxy intermedio que no cierra la conexión), la promesa de `fetch` puede
quedar pendiente indefinidamente. Los hooks que consumen esto
(`useMovies.ts`, `useMovieDetail.ts`) dejan `isLoading` en `true` mientras
esperan, así que la interfaz queda mostrando "Buscando…" o "Cargando
película…" sin límite de tiempo y sin que el usuario tenga manera de
cancelar la espera más que recargar la página.

**Riesgo real:** es un problema de **disponibilidad/experiencia de
usuario**, no de confidencialidad ni integridad de datos — no hay fuga de
información ni posibilidad de manipular datos. Se clasifica como severidad
media porque, aunque no es un riesgo de seguridad clásico, sí puede dejar la
app "colgada" sin ningún mensaje de error ante una falla de red parcial.

**Recomendación:** agregar un `AbortController` con un timeout razonable
(por ejemplo, 8-10 segundos) en ambas funciones, y mapear el abort a un
mensaje de error que ya existe en el flujo actual (los hooks ya saben
mostrar `err.message` vía `toast.error` y el estado `error`), por ejemplo:
"La búsqueda tardó demasiado, probá de nuevo."

## 4. Sin manejo específico de cuota/rate-limit de OMDb

**Evidencia:** el bloque de manejo de errores en ambas funciones
(`src/service/omdb.ts:41-46` y `:65-67`) trata cualquier
`Response: 'False'` de la misma manera genérica:
```ts
if (data.Response === 'False') {
  if (data.Error === 'Movie not found!') {
    return { results: [], totalResults: 0 }
  }
  throw new Error(data.Error ?? 'Error al buscar películas en OMDb.')
}
```
No hay ninguna rama que distinga un error de cuota excedida (el plan
gratuito de OMDb limita a 1000 requests/día) de un error de red, de API key
inválida, o de cualquier otro fallo. Tampoco hay ningún tipo de caché de
resultados ni debounce de búsquedas repetidas que reduzca el consumo de
cuota (la búsqueda sí se dispara solo al enviar el formulario, no en cada
tecla — `src/components/SearchBar.tsx` usa `onSubmit`, no `onChange` — lo
cual ya mitiga parcialmente el consumo innecesario).

**Riesgo real:** bajo-medio. No es un riesgo de seguridad en sentido
estricto, sino de **resiliencia operativa**: si se agota la cuota diaria,
toda búsqueda y todo detalle de película dejan de funcionar durante el resto
del día, y el usuario solo ve el mensaje genérico que OMDb devuelva (p.ej.
"Request limit reached!"), sin que la app distinga ese caso ni sugiera una
acción distinta (como esperar o verificar la key).

**Recomendación:** si se vuelve un problema recurrente, agregar un `cache`
simple en memoria (por ejemplo, un `Map` por `título+página` o por
`imdbID`) para no repetir requests idénticos durante la misma sesión, y
opcionalmente detectar el mensaje de cuota excedida de OMDb para mostrar un
mensaje más específico que el genérico actual. No es urgente para el uso de
un solo usuario.

## 5. Casteo sin validación de runtime en `getMovieById`

**Evidencia:** `src/service/omdb.ts:69`, `return data as MovieDetail`.

**Análisis:** cuando `Response === 'True'`, el código asume que el resto
del objeto `data` tiene exactamente la forma de `MovieDetail` (definida en
`src/types/index.ts`) y lo castea directamente, sin verificar en runtime que
los campos esperados realmente estén presentes. Si OMDb cambiara el formato
de respuesta, o devolviera un campo faltante en algún caso límite, TypeScript
no lo detectaría (el casteo con `as` desactiva la verificación) y el dato
"incorrecto" fluiría sin aviso hasta la UI.

**Riesgo real:** bajo. No es explotable por un atacante (OMDb no es
adversarial en este contexto, es la fuente de datos que la propia app elige
consultar) y React escapa automáticamente cualquier texto al renderizarlo en
JSX, así que no habilita XSS. Es, en el peor caso, una causa de bugs de
UI (campos `undefined` mostrados como texto vacío) más que un problema de
seguridad.

**Recomendación:** opcional, prioridad baja. Si se quiere mayor robustez,
agregar una validación mínima (por ejemplo, comprobar que `data.Title` y
`data.imdbID` existan) antes de castear, en vez de confiar ciegamente en la
forma del objeto.

## 6. Mensajes de error de OMDb mostrados directamente al usuario

**Evidencia:** `throw new Error(data.Error ?? '...')` en
`src/service/omdb.ts:45` y `:66`; estos mensajes se muestran sin modificar
vía `toast.error(message)` en `useMovies.ts` y `useMovieDetail.ts`.

**Análisis:** se evaluó si esto podía filtrar información sensible (rutas de
servidor, stack traces, detalles de infraestructura). **No es el caso**: los
mensajes de error documentados de OMDb son genéricos y orientados a usuario
final ("Movie not found!", "Invalid API key!", "Incorrect IMDb ID."),
no contienen información interna ni de infraestructura.

**Riesgo real:** ninguno significativo. Como nota menor, un mensaje como
"Invalid API key!" confirma a quien inspeccione la app que la key
configurada no es válida — pero dado que la key ya es visible en el bundle
(hallazgo 1), esto no agrega una exposición nueva.

**Recomendación:** no requiere cambios.

## 7. Parámetro de búsqueda sin sanitización manual

**Evidencia:** `src/service/omdb.ts:34`,
`url.searchParams.set('s', title)`, con `title` viniendo directo del input
de `SearchBar.tsx` (solo se le aplica `.trim()` en `useMovies.ts:12`).

**Análisis:** se evaluó explícitamente si la falta de sanitización
constituye un riesgo real, dado el contexto:
- **No es una query SQL**: el valor nunca llega a `src/db/database.ts` ni se
  concatena en una sentencia SQL. La persistencia local usa parámetros
  posicionados (`?`) con `sql.js`, no el texto de búsqueda.
- **No es HTML renderizado sin escapar**: React escapa automáticamente el
  contenido de texto en JSX; el valor de búsqueda no se inyecta en el DOM
  como HTML crudo (no hay `dangerouslySetInnerHTML` en el flujo de
  búsqueda).
- **No es una URL construida por concatenación de strings**: se usa la API
  `URLSearchParams` (`url.searchParams.set(...)`), que aplica
  URL-encoding automáticamente a cualquier caracter especial, evitando
  inyección de parámetros adicionales en la URL final.

**Riesgo real:** ninguno identificado en este flujo. La ausencia de
sanitización manual no es un hallazgo explotable aquí porque el mecanismo
usado (`URLSearchParams`) ya neutraliza el único vector relevante
(inyección en la URL), y no hay segundo consumidor (SQL, DOM crudo) del
mismo valor.

**Recomendación:** no requiere cambios. Vale la pena mantener el uso de
`URLSearchParams` (en vez de concatenar strings a mano) si se agregan nuevos
parámetros a futuro, precisamente para conservar esta protección implícita.

## 8. Uso correcto de HTTPS (control positivo)

**Evidencia:** `src/service/omdb.ts:3`,
`const BASE_URL = 'https://www.omdbapi.com/'`.

**Análisis:** la URL base está hardcodeada con esquema `https://`, no hay
ninguna ruta del código que construya una URL `http://` hacia OMDb, y no hay
contenido mixto (mixed content) posible porque no se referencia ningún
recurso de OMDb por HTTP. Esto protege la confidencialidad e integridad del
tráfico en tránsito (incluyendo la API key del hallazgo 1 mientras viaja por
la red).

**Conclusión:** correcto tal como está, no requiere ninguna acción.

---

## Fuera de alcance (mencionado solo para dejar constancia)

La carga del motor `sql.js` desde un CDN externo sin Subresource Integrity
(`index.html`, `<script src="https://sql.js.org/dist/sql-wasm.js">`) es una
superficie de seguridad real, pero no corresponde a la integración con OMDb
que es el objeto de este documento. Si se solicita, merece su propio
análisis de seguridad centrado en `src/db/database.ts` e `index.html`.

## Conclusión general

Para el contexto actual del proyecto (app de un solo usuario, sin backend
propio, sin datos sensibles de terceros, API key gratuita de OMDb), **no se
identificaron vulnerabilidades de severidad alta**. El hallazgo más
relevante para actuar es la ausencia de timeout en los `fetch` (hallazgo 3),
por motivos de robustez más que de seguridad estricta. La exposición de la
API key (hallazgos 1 y 2) es un patrón esperado e inevitable en una
arquitectura 100% cliente con Vite, aceptable mientras la key siga siendo
gratuita y de bajo riesgo — pero no debe repetirse sin un backend
intermediario si en el futuro se integra una API con costo o datos
sensibles.
