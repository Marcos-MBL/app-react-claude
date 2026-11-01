# Manual de Usuario — Buscador de Películas Agéntico

Esta guía explica, en lenguaje sencillo, qué podés hacer **hoy** con la
aplicación. Está escrita a partir del código real de la app (no del documento
de especificación `SPEC.md`, que describe funciones futuras todavía no
construidas). Si buscás una Watchlist o la opción de compartir tu lista de
películas, mirá la sección "Próximamente" al final: todavía no existen.

## 1. Buscar una película

1. Al abrir la aplicación vas a ver un título ("Buscador de Películas") y,
   debajo, una barra de búsqueda con un ícono de lupa.
2. Escribí el título (o parte del título) de la película que querés
   encontrar, por ejemplo "batman".
3. Hacé clic en el botón **Buscar** (o apretá Enter). Mientras la búsqueda
   está en curso, el botón cambia su texto a "Buscando…" y queda deshabilitado
   para evitar envíos duplicados.
4. Los resultados aparecen debajo como una cuadrícula de tarjetas, cada una
   con el póster, el título y el año de la película.
5. Si la película no tiene póster disponible, la tarjeta muestra el texto
   "Sin póster" en su lugar — esto es normal, no es un error.
6. Si no se encuentra ninguna película con ese título, la cuadrícula
   simplemente queda vacía (no se muestra ningún mensaje de error, porque
   "no hay resultados" no se considera una falla).

> **Nota:** la búsqueda consulta siempre la primera página de resultados de
> OMDb. Si tu búsqueda tiene muchísimos resultados, no hay botón para pasar a
> la página siguiente — esa función no está implementada todavía.

## 2. Ver el detalle de una película

1. Hacé clic en cualquier tarjeta de la cuadrícula de resultados.
2. La pantalla cambia a una vista de detalle con:
   - El póster en grande.
   - El título y el año.
   - La sinopsis completa ("Plot") de la película.
3. Arriba de todo hay un enlace **"← Volver a resultados"** que te devuelve
   a la cuadrícula de búsqueda, conservando los resultados que ya tenías.
4. Debajo de la sinopsis vas a encontrar la sección **"Mi apunte"**, que es
   el editor de notas explicado en la siguiente sección.

## 3. Escribir y guardar una nota sobre la película

Cada película tiene un espacio para que escribas tu propia nota personal
(por ejemplo, por qué querés verla, o qué te pareció). Es texto enriquecido:
podés usar negrita, títulos, listas, bloques de código y líneas separadoras.

**Importante:** el editor no muestra una barra de botones de formato (no hay
un botón "B" para negrita ni un menú de títulos). Para aplicar formato hay dos
formas:

- **Atajos de teclado estándar**, como `Ctrl/Cmd + B` para negrita o
  `Ctrl/Cmd + I` para itálica.
- **Escribiendo el formato tipo Markdown**, que el editor convierte
  automáticamente mientras escribís. Por ejemplo:
  - Escribir `# ` al inicio de una línea y seguir escribiendo crea un título
    grande (también existen `## ` y `### ` para títulos más chicos).
  - Rodear una palabra con `**así**` la pone en negrita.
  - Escribir `- ` al inicio de una línea crea una lista con viñetas.
  - Escribir `` ``` `` crea un bloque de código.
  - Escribir `---` en una línea sola crea una línea separadora horizontal.

Para guardar tu nota:

1. Escribí el texto en el recuadro de "Mi apunte".
2. Hacé clic en el botón **"Guardar Apunte"**.
3. Si todo sale bien, vas a ver un pequeño aviso verde ("Apunte guardado.")
   en la esquina superior derecha de la pantalla.
4. Si volvés más adelante al detalle de esa misma película, tu nota se carga
   automáticamente — mientras se está buscando, el editor muestra el texto
   "Buscando apunte guardado…" por un instante.
5. Solo existe **una nota por película**: si escribís y guardás de nuevo, se
   actualiza la nota anterior, no se crea una nota adicional.

## 4. Qué pasa si algo falla

La aplicación está pensada para seguir funcionando aunque algo no esté
disponible, en vez de romperse por completo:

- **Si falta configurar la API key de OMDb** (variable `VITE_OMDB_API_KEY`):
  al intentar buscar una película o abrir su detalle, vas a ver un mensaje de
  error claro (tanto en un aviso rojo en la pantalla como en una notificación
  emergente) indicando que falta la API key y que hay que crear un archivo
  `.env` en la raíz del proyecto. Esto es una tarea para quien instala o
  desarrolla la app, no algo que un usuario final pueda resolver desde la
  interfaz.
- **Si la base de datos local no puede inicializarse** (por ejemplo, porque
  no hay conexión a internet para descargar el motor de SQLite la primera
  vez, o el navegador bloqueó el script): el editor de notas sigue
  funcionando para escribir texto con normalidad, pero aparece un aviso
  color ámbar que dice *"No se pudo conectar con la base de datos local: podés
  escribir, pero el apunte no se guardará hasta recargar la página."* Si en
  ese estado intentás guardar, aparece una notificación de error indicando
  que el apunte no se guardó. Es decir: nunca perdés la posibilidad de
  escribir, pero sí podés perder lo que escribiste si no se pudo persistir y
  recargás la página sin que se resuelva el problema.
- **Si falla la búsqueda por un problema de red o de la API de OMDb**: se
  muestra un mensaje de error (en rojo, debajo de la barra de búsqueda, y
  como notificación emergente) con el detalle devuelto por OMDb, y la lista
  de resultados se vacía.

## 5. Próximamente (todavía NO implementado)

El documento de especificación del proyecto (`SPEC.md`) describe funciones
adicionales que forman parte de la visión del producto pero que, a la fecha
de este manual, **no existen en la aplicación**:

- **Watchlist ("Películas por Ver")**: una lista persistente donde guardar
  películas para verlas más adelante, independiente de la nota. Hoy no hay
  ningún botón de "Agregar a Watchlist" ni una pantalla que liste películas
  guardadas aparte del historial de búsqueda.
- **Compartir la Watchlist**: la posibilidad de compartir esa lista
  públicamente (y dejar de compartirla). Al no existir todavía la Watchlist,
  tampoco existe esta función.

Si estás leyendo este manual y no encontrás estas opciones en la app, no es
un error: todavía no se construyeron.
