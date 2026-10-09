# AGENTS.md — Reglas para asistentes de IA

> Este proyecto es de uso clínico. Cualquier error puede afectar decisiones médicas.
> Lee `docs/GOVERNANCE.md` antes de continuar.

## 🚨 Reglas inquebrantables

1. **NUNCA toques** `src/lib/switchingMatrix.js`, `src/data/**/*.csv`, `src/data/**/*.json`, ni el contenido clínico sin confirmación humana explícita en el PR.
2. **NUNCA silencies errores**: prohibido `catch (e) {}`, `catch (e) { /* ignore */ }`, `.catch(() => {})`.
3. **NUNCA añadas un import sin verificar** que existe en `package.json` o en un archivo local del repo.
4. **NUNCA dejes** `TODO`, `FIXME`, `HACK`, `XXX` en código commiteado. Si necesitas dejarlo, abre un issue y enlázalo.
5. **NUNCA borres código "que parece no usarse"** sin buscar referencias dinámicas (strings en JS, clases en HTML, selects de CSS).
6. **NUNCA reescribas un archivo entero** cuando se te pide un cambio puntual. Diff mínimo.
7. **NUNCA digas "los tests pasan"** si no los has ejecutado. Si no puedes ejecutarlos, dilo explícitamente.
8. **NUNCA asumas** APIs de terceros. Si no estás 100% seguro de la firma, dilo y pregunta.

## ✅ Comportamiento esperado

- **Antes de escribir código**: leer los archivos relevantes, no asumir su contenido.
- **Antes de commitear**: ejecutar `npm run lint` y `npm test`. Si falla, arreglar o reportar, no commitear.
- **Si no estás seguro**: detente y pregunta. Un "no sé" vale más que una alucinación silenciosa.
- **Reportar honestamente**: al final del PR, listar (a) qué cambió, (b) qué NO cambió aunque parecía pedido, (c) qué no pudiste verificar.
- **Match del estilo existente**: si el código usa `const`, no metas `var`. Si usa JSDoc, no metas TypeScript. Si usa comillas simples, no metas dobles.

## 🎯 Alcance por tipo de tarea

| Tarea | Autonomía permitida |
|-------|---------------------|
| Bug fix pequeño (1 archivo, <50 líneas) | Autónomo con tests |
| Refactor local | Autónomo si no cambia comportamiento |
| Feature nueva UI | Requiere confirmación del diseño en el PR |
| Feature nueva lógica | PR separado + revisión N2 |
| Cambio clínico | **PROHIBIDO sin humano in the loop** |
| Infra / CI / secrets | **PROHIBIDO** sin Lead Developer |
| Migración estructural | PR separado + ADR previo |

## 🧪 Verificación obligatoria antes de "terminar"

Marca honestamente cada punto:

- [ ] Ejecuté `npm run lint` → 0 warnings
- [ ] Ejecuté `npm test` → verde
- [ ] Ejecuté `npm run build` → sin errores
- [ ] Verifiqué que los archivos que digo haber creado existen (`ls` o similar)
- [ ] Verifiqué que los imports nuevos resuelven a archivos reales
- [ ] Busqué si dejé `TODO`, `FIXME`, `catch {}` vacíos, `console.log` de debug
- [ ] Revisé el `git diff` completo antes de proponer el PR

Si algún punto no se puede marcar, **dilo en el PR**. Un PR honesto con "no pude verificar X" es mejor que uno que miente por omisión.
