# Política de delegación

Este documento define qué tareas hace el modelo de Antigravity y cuáles se delegan a Qwen Code. Lo lee el modelo al empezar cada sesión.

## Principio

Antigravity decide, planea y revisa. Qwen ejecuta trabajo repetitivo y acotado. Ningún modelo lanza al otro de forma automática: el lanzamiento lo hace la persona.

## Qué hace Antigravity (no se delega)

- Arquitectura y decisiones que afectan varios módulos.
- Depuración de errores que cruzan más de dos archivos o cuya causa no está clara.
- Cambios en el estado global del store, la persistencia (localStorage), el router o el service worker.
- Cualquier cambio en datos clínicos o en la lógica de dosis, interacciones CYP450, QT o switching. Estos cambios requieren revisión humana antes de aplicarse.
- Revisión final de cualquier cambio delegado.

## Qué se delega a Qwen

- Funciones puras, acotadas a un archivo, con entrada y salida claras.
- Pruebas unitarias para funciones que ya existen y funcionan.
- Traducciones ES/EN de cadenas ya definidas, sin cambiar significado.
- Formato, nombres, comentarios JSDoc y limpieza de código sin cambio de comportamiento.
- Conversiones de estructura de datos (por ejemplo, de una lista a un objeto indexado) cuando el criterio esté escrito.
- Plantillas repetitivas de vistas, siempre con un ejemplo existente como referencia.

## Límites de tamaño

- Máximo 3 archivos por tarea. Si necesita más, se divide.
- Máximo 150 líneas modificadas por tarea.
- Si una tarea requiere leer más de 4 archivos para entenderla, Antigravity la reescribe más acotada antes de delegarla.

## Modelo a usar

- `qwen3.6-flash`: traducciones, formato, JSDoc, limpieza.
- `qwen3.7-plus`: funciones puras y pruebas unitarias.
- `qwen3.8-max`: solo cuando la tarea requiera razonamiento de varios pasos y Antigravity lo justifique por escrito.

## Plantilla de tarea para Qwen

Antigravity debe escribir cada tarea con este formato:

```
OBJETIVO: (una frase)
MODELO: (flash / plus / max, con justificación si es max)
ARCHIVOS PERMITIDOS: (rutas exactas)
NO TOCAR: (archivos y funciones)
CAMBIO ESPERADO: (qué debe quedar diferente)
CRITERIO DE ÉXITO: (cómo se verifica)
FORMATO DE RESPUESTA: lista de archivos cambiados y resumen en menos de 15 líneas. No hacer búsquedas en la web. No leer archivos fuera de la lista.
```

## Revisión de resultados

Al recibir la respuesta de Qwen, Antigravity:

1. Verifica que solo tocó los archivos permitidos.
2. Revisa el diff contra el criterio de éxito.
3. Si hay error, escribe una tarea nueva y acotada solo para la corrección.
4. Registra al final una línea: tarea, modelo, resultado (OK / corregido / descartado) y número de rondas.

## Registro

Cada tarea delegada se anota en `DELEGACION_LOG.md`:

| Fecha | Tarea | Modelo | Archivos | Rondas | Resultado |
|---|---|---|---|---|---|

Revisar el registro cada semana. Si una categoría acumula más de 2 descartes, moverla a "Qué hace Antigravity".

## Lo que nunca se delega

- Datos clínicos, dosis, interacciones, guías y disclaimers legales.
- Cualquier cambio que afecte la exportación de PDF o la persistencia de datos del usuario.
- Secretos, claves o configuración de despliegue.
