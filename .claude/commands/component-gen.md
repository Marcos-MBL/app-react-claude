---
description: Genera un componente de React 19 siguiendo los estándares de arquitectura del proyecto.
---

# Generador de Componentes React

Usa esta plantilla para crear un nuevo componente en la carpeta `src/components/`.

## Parámetros.
Nombre del Componente: $ARGUMENTS

## Instrucciones de Generación
1. **Estructura de Archivo:** Crea un archivo llamado `$ARGUMENTS.tsx`.
2. **Sintaxis Moderna:** Utiliza `arrow functions` y exportación nombrada.
3. **Tipado:** Define una interfaz `Props` especifica para el componente.
4. **Estilos:** Aplica clases de Tailwind CSS v4 sigueindo un diseño "Mobile First".
5. **Documentación:** Incluye un comentario breve en la parte superiro explicando el propósito del componente.

## Plantilla Base
```tsx
import React from 'react';

interface Props{
    // Definir props aquí
}

export const $ARGUMENTS: React.FC<Props> = ({}) => {
    return (
        <div className="p-4 🔳bg-slate-900 ◽️text-white rounded-lg">
            {/* Contenido de $ARGUMENTS */}
        </div>
    );
};