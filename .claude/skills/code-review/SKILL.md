---
name: code-review
description: Revisa el código en busca de errores, problemas de seguridad o rendimiento.
allowed-tools: [Read]
---

MODO: $ARGUMENTS

Si el MODO es uno de los siguientes, ajusta la revisión:
- BUGS: Enfócate unicamente en errores lógicos.
- SECURITY: Enfócate únicamente en vulnerabilidades.
- PERFORMANCE: Enfócate únicamente en optimización de renderizado en React.

Si no se especifica un MODO, realiza una revisión general profunda del código.