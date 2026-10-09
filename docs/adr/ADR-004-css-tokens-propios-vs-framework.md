# ADR-004 — Tokens CSS propios vs framework de utilidades

- **Fecha**: 2026-10-04
- **Estado**: Aceptado
- **Decisores**: Lead Developer, Dr. Celada
- **Relacionado con**: [ADR-003](./ADR-003-material-design-3.md)

## Contexto

Tras decidir Material Design 3 como base (ADR-003) con implementación manual de componentes, quedaba una segunda decisión estructural: **¿cómo gestionar los design tokens y el layout?**

Concretamente:
- ¿Adoptar Tailwind CSS u otro framework de utilidades?
- ¿Usar CSS-in-JS (styled-components, Emotion)?
- ¿Escribir CSS plano organizado con variables CSS nativas?

El proyecto es **vanilla JS + Vite**, sin React ni frameworks de UI. Se despliega como PWA offline-first. El equipo es pequeño y la deuda de mantenimiento debe ser mínima.
Adicionalmente, la app tiene una dimensión clínica: los estilos deben ser **predecibles, auditables y estables**, porque pequeños errores de layout pueden afectar la lectura de contenido médico (contraste, jerarquía, foco).

## Decisión

Usar **variables CSS nativas (Custom Properties)** organizadas en archivos temáticos, sin framework de utilidades ni CSS-in-JS.

Estructura de estilos:
```text
src/styles/
├── reset.css (normalización)
├── variables.css (design tokens — 95 líneas)
├── components.css (1226 líneas, M3 implementado a mano)
├── layout.css (grid, responsive)
└── quiz.css (tema playful del módulo quiz)
```

Los tokens viven en `variables.css` como custom properties:
```css
:root {
  /* Colores (12 base + variantes) */
  --md-primary: #...;
  --md-on-primary: #...;
  /* ... */
  /* Elevación (5 niveles) */
  --md-elevation-1: 0 1px 2px rgba(0,0,0,.08);
  /* ... */
  /* Radii (4 valores) */
  --md-radius-sm: 4px;
  /* ... */
  /* Transiciones (4 timing functions) */
  --md-transition-emphasized: cubic-bezier(.2,0,0,1);
  /* ... */
  /* Espaciado (8pt grid — 8 valores) */
  --md-space-1: 8px;
  /* ... */
}
```

## Justificación

- **Cero dependencias adicionales**: no suma kB al bundle, no añade una superficie de supply chain más.
- **Theming trivial**: cambiar el tema = sobrescribir variables en un bloque `:root` o `[data-theme="..."]`. No hay que pelear con purga ni configuración.
- **Auditabilidad clínica**: los tokens son la fuente única de verdad. Un revisor puede leer variables.css en 2 minutos y validar contraste/accesibilidad.
- **CSS nativo = longevidad**: las custom properties son un estándar W3C estable desde 2015. No hay riesgo de "Tailwind v5 rompe la sintaxis".
- **Alineación con ADR-003**: ya decidimos escribir M3 a mano. Traer Tailwind ahora sería contradictorio: el framework no sabe de M3, habría que forzarlo con theme.extend y quedaría a medio camino.
- **Arquitectura vanilla coherente**: sin React, CSS-in-JS pierde sentido (está diseñado para componentización y scoping, que no necesitamos).

## Alternativas consideradas

| Alternativa | Por qué se descartó |
|-------------|---------------------|
| Tailwind CSS | Rápido para prototipar, pero genera HTML verboso y dificulta auditoría de accesibilidad. Requiere configuración theme duplicando tokens. Purge añade complejidad al build. Riesgo de "utility soup" en un proyecto clínico. |
| Bootstrap 5 | Aspecto genérico, difícil de alinear con M3 sin sobreescribir a fondo. Dependencia grande. |
| CSS-in-JS (styled-components, Emotion) | Diseñado para React/Vue. En vanilla JS añade runtime sin beneficio. Rompe con SSR/SSG si algún día se migra. |
| Sass/SCSS con variables | Las variables de Sass no son dinámicas en runtime (a diferencia de custom properties). Perdemos theming sin recompilar. |
| Open Props | Framework de tokens interesante, pero introduce dependencia y una curva de adopción no trivial. Custom properties nativas hacen lo mismo en 95 líneas. |
| UnoCSS / WindiCSS | Mismos problemas que Tailwind, con menos comunidad. |

## Consecuencias

### ✅ Positivas
- **Bundle mínimo**: 0 kB de framework CSS. Todo el peso es nuestro CSS, minificable y cacheable.
- **Theming y modo oscuro futuros**: trivial. Añadir `[data-theme="dark"]` con overrides de las custom properties es un PR de 20 líneas.
- **Accesibilidad auditable**: los tokens incluyen contraste AA por diseño (ver evaluación estética 2026-03-25).
- **Independencia tecnológica**: si mañana se migra a Web Components, Svelte o Lit, los estilos se conservan tal cual.
- **Contribución sencilla**: un nuevo dev solo necesita saber CSS. No hay que aprender "la forma Tailwind" ni "la forma MUI".

### ⚠️ Negativas / Riesgos
- Velocidad de escritura menor comparado con utilidades (`class="flex gap-2"` vs escribir 4 líneas de CSS).
- Riesgo de divergencia: sin un framework que imponga estructura, dos devs pueden inventar patrones distintos.
- Sin tree-shaking automático: CSS no usado se acumula si no se limpia manualmente.
- `components.css` de 1226 líneas ya es señal de que conviene modularizar antes de que crezca más.

## Mitigaciones

- [ ] Lint de CSS con Stylelint — `.stylelintrc.json` con `stylelint-config-standard` (ya integrado en `.lintstagedrc.json`).
- [ ] Regla social: todo valor nuevo (color, spacing, radius) debe entrar primero como token en `variables.css`. Prohibido hardcodear en `components.css`.
- [ ] Dividir `components.css` en módulos por familia (`buttons.css`, `cards.css`, `chips.css`, `sheet.css`, `dock.css`) cuando supere las 1500 líneas.
- [ ] Auditoría anual de tokens — detectar tokens huérfanos con purgecss en modo reporte (sin borrar) y decidir manualmente.
- [ ] Probar `@media (prefers-color-scheme)` en el próximo ciclo para adelantar dark mode sin coste.

## Referencias

- `src/styles/variables.css` — design tokens (95 líneas)
- `src/styles/components.css` — M3 implementado a mano (1226 líneas)
- Evaluación estética interna 2026-03-25, rama `claude/review-app-aesthetics-BpT5B`
- [ADR-003](./ADR-003-material-design-3.md) — Material Design 3 como base
- [Material Design 3 — Design Tokens](https://m3.material.io/foundations/design-tokens/overview)
