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

# Beads Issue Tracking

This project uses [Beads (bd)](https://github.com/gastownhall/beads) for issue tracking.

## Core Rules

- Track ALL work in bd (never use markdown TODOs or comment-based task lists)
- Use `bd ready` to find available work
- Use `bd create` to track new issues/tasks/bugs
- Treat commit, push, and Dolt remote sync as policy-controlled handoff actions
- Run `bd prime` for complete workflow context (SSOT for operational commands)
- Default to conservative git authority: report status and proposed commands unless the user, orchestrator, or repository profile explicitly authorizes commit/sync/push

## Quick Reference

```bash
bd prime                              # Load complete workflow context (SSOT)
bd ready                              # Show issues ready to work (no blockers)
bd list --status=open                 # List all open issues
bd create "title" -t task -p 2        # Create new issue
bd update <id> --claim                # Claim work atomically
bd unclaim <id>                       # Release stuck issue (agent crashed)
bd close <id>                         # Mark complete
bd dep add <issue> <depends-on>       # Add dependency
bd dolt push                          # Sync with remote when authorized
```

## Workflow

1. Check for ready work: `bd ready`
2. Claim an issue atomically: `bd update <id> --claim`
3. Do the work
4. Mark complete: `bd close <id>`
5. Handoff: report changed files, validation, issue status, and any proposed commit/sync/push commands

## Issue Types

- `bug` - Something broken
- `feature` - New functionality
- `task` - Work item (tests, docs, refactoring)
- `epic` - Large feature with subtasks
- `chore` - Maintenance (dependencies, tooling)

## Priorities

- `0` - Critical (security, data loss, broken builds)
- `1` - High (major features, important bugs)
- `2` - Medium (default, nice-to-have)
- `3` - Low (polish, optimization)
- `4` - Backlog (future ideas)

## Context Loading

Run `bd prime` to get complete workflow documentation in AI-optimized format.
`bd prime` is the single source of truth for operational commands and session workflow.

For detailed docs: see AGENTS.md, the beads quickstart
(https://github.com/gastownhall/beads/blob/main/docs/getting-started/quickstart.md), or run `bd --help`

## Revisiones (Beads)
- Antes de crear una tarea, ejecuta `bd search "<palabras clave>"` (incluye cerradas).
  Si existe, actualizala o reabrela; no crees otra.
- Una revision del proyecto empieza con `bd ready` y `bd list --status=open`, no releyendo todo el codigo.
- Nunca pongas datos personales o sensibles en titulos ni descripciones de tareas.
- En Cacomixtle Hub, ROADMAP.md y PENDIENTES.md se mantienen como fuente de verdad arquitectonica (§0.1); bd gestiona el flujo operacional de agentes.