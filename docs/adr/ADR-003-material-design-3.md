# ADR-003 — Material Design 3 como sistema de diseño

- **Fecha**: 2026-03-25
- **Estado**: Aceptado
- **Decisores**: Dr. Celada, Lead Developer

## Contexto

Se necesitaba un sistema de diseño que cumpliera:
- Aspecto **profesional y clínico** (uso médico real)
- **Accesibilidad** AA garantizada (WCAG 2.1)
- **Modernidad** visual (2024-2026)
- Curva de aprendizaje baja para futuros contribuidores
- Coherencia con la naturaleza "app nativa" (PWA instalable)

## Decisión

Adoptar **Material Design 3 (Material You)** como base, con tokens CSS propios y componentes custom. **No** se usa una librería M3 (Material Web, MDUI, etc.) — los componentes están implementados a mano en `src/styles/components.css`.

## Justificación

- **Reconocible** para profesionales familiarizados con apps modernas.
- **Accesible por defecto**: contraste, foco, tamaños táctiles ya resueltos.
- **Documentación abundante**: futuros devs pueden aprender de la fuente oficial.
- **Control total**: implementar a mano permite adaptar M3 al contexto clínico sin luchar contra una librería.

## Alternativas consideradas

| Alternativa | Por qué se descartó |
|-------------|---------------------|
| Tailwind CSS | Rápido pero exige disciplina para no romper coherencia visual |
| Bootstrap 5 | Aspecto genérico, poco alineado con 2024+ |
| Sistema propio desde cero | Costoso, reinventar la rueda de accesibilidad |
| Ant Design / MUI | Pesados, dependientes de React (el proyecto es vanilla) |
| Material Web (oficial) | Menos flexible, curva de adopción alta |

## Consecuencias

### ✅ Positivas
- Base sólida y reconocible.
- Accesibilidad y patrones de interacción ya validados.
- Coherencia visual mantenida por diseño.

### ⚠️ Negativas / Riesgos
- **Implementación manual**: cada componente nuevo hay que construirlo.
- **Playfulness limitado**: M3 es neutro; hay que añadir capa "playful".
- **Carga de mantenimiento**: si M3 evoluciona, no hay upgrade automático.

## Notas de implementación

- Tokens en `src/styles/variables.css` (12 colores, 5 sombras, 4 radii, 4 transiciones, 8 espaciados).
- Componentes en `src/styles/components.css` (1226 líneas).
- Playfulness añadido estratégicamente en el módulo quiz (`quiz.css`) sin comprometer profesionalidad clínica.

## Referencias

- `src/styles/variables.css`
- `src/styles/components.css`
