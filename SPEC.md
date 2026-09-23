# Especificación Técnica: Buscador de Películas Agéntico

## 1. Descripción del Proyecto
Vamos a construir una aplicación web tipo "Note Taking" pero enfocada en películas. Los usuarios podrán buscar películas usando una API externa, ver detalles y gestionar una lista personal de "Películas por Ver" (Watchlist). Una "película" en la lista será simplemente una pieza de texto enriquecido (usando TipTap) para añadir notas personales sobre por qué queremos verla.

## 2. Flujo del Usuario y Funcionalidad
En detalle, los usuarios podrán:
- Buscar películas por título usando la API de OMDb.
- Visualizar una cuadrícula de resultados (Póster, Título, Año).
- Ver detalles profundos de una película (Sinopsis, Reparto, Puntuación).
- Agregar películas a una Watchlist personal.
- **Gestionar Notas**: Crear, ver, actualizar y borrar notas enriquecidas sobre cada película de su lista.
- **Compartir**: Compartir su Watchlist públicamente (y también detener el uso compartido).

## 3. Stack Tecnológico
Construiremos la app usando:
- **Framework**: React.js con Vite y TypeScript (Configurado manualmente).
- **Styling**: TailwindCSS.
- **Editor de Texto**: El editor de notas enriquecido se implementará usando la librería **TipTap**.
- **API Externa**: OMDb API (Requiere API Key).

## 4. Persistencia de Datos
Los datos (Watchlist y Notas) se almacenarán como JSON en una base de datos **SQLite**. Usaremos un cliente SQLite nativo (o configurado vía MCP más adelante) con sentencias SQL puras.

## 5. Formateo de Texto Enriquecido
Proporcionaremos formato de texto enriquecido básico para las notas:
- Negrita, Itálica.
- 3 niveles de encabezado + Texto normal.
- Código en línea + Fragmentos de código.
- Listas con viñetas.
- Líneas separadoras horizontales.

---
*Este documento sirve como la fundación técnica para el desarrollo del proyecto por parte del agente Claude Code.*