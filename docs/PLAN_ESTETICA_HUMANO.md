# Plan de migración estética: antidepresivos → sistema "humano"

Versión 1.1 (decisiones cerradas, §11) · 2026-10-17

Especificación maestra (valores, componentes, lista negra, contrato de integración):
`antipsicoticos-v3/docs/PLAN_UNIFICACION_ESTETICA.md`. Este documento dice **qué cambia aquí,
en qué archivo y en qué orden**. Si algo choca, gana la especificación maestra.

Alcance: sólo apariencia. No toca `src/lib/switchingMatrix.js`, `src/data/**`, textos clínicos ni
lógica (AGENTS.md, regla 1). Según la tabla de autonomía de AGENTS.md, es "feature nueva de UI":
cada PR requiere confirmación del diseño con capturas.

---

## 1. Diagnóstico

### 1.1 Lo que ya está alineado (y no hay que tocar)
- Base cálida (crema `#F9F7F2`), radios de 10–24 px y tema con `data-theme` en `<html>`.
- Fuentes locales en `public/assets/fonts/` y CSP con `font-src 'self'`: es el modelo que la Fase 0
  de antipsicóticos copiará.
- Rejilla de espaciado de 8 pt (`--space-1` … `--space-8`): se propone como token común.
- Arranque sin parpadeo (`public/theme-bootstrap.js`) y soporte de `data-reduced-motion`, `data-compact`
  y tamaño de letra: funciones que antipsicóticos no tiene y que se conservan.
- Casi todo el CSS consume tokens (`--shadow-sm`, `--color-stroke`, `--color-primary`…). Por eso el
  grueso de la migración se resuelve **redefiniendo tokens**, no reescribiendo reglas.

### 1.2 Lo que separa a esta app del sistema común

| Señal | Hoy | Dónde | Objetivo |
| --- | --- | --- | --- |
| Sombras desplazadas | `--shadow-sm/md/lg/xl/premium` = `3–10px 3–10px 0 var(--color-stroke)` + 28 literales | `variables.css` (6), `playful.css` (12), `_buttons.css`, `_cards.css`, `_chips.css`, `layout.css` | Sombras difusas índigo |
| Trazo duro | `border: 2px solid var(--color-stroke)` y `--color-border-hard` | 37 reglas; header, logo, dock, botones, tarjetas, toasts | 1 px `--border-subtle` |
| Mayúsculas | 28 `text-transform: uppercase` | `quiz.css` (13), `layout.css` (3: nav, etc.), `_tabs.css` (2), `_chips.css` (2), `playful.css` (2), `_buttons.css`, `_risk-profile.css`, `_settings.css`, `_typography.css`, `_detail-header.css`, `_field-box.css`, `_recent.css` | Ninguna |
| Pesos | 800/900 en logo, títulos y navegación activa | `layout.css` | 600 |
| Primario | Azul acero `hsl(210 50% 40%)` | `variables.css` | Índigo `#3D4A8F` |
| Secundario | Terracota `hsl(8 50% 50%)`, uso decorativo | `variables.css`, `detailView.js`, `ajusteView.js`, `reset.css`, `playful.css` | Ver §3.3 (no es riesgo) |
| Fuentes | Montserrat + DM Sans | `public/assets/fonts/fonts.css` | Poppins + Inter (locales) |
| Fondo oscuro | Marrón cálido `#1A1610` | `variables.css`, `theme-bootstrap.js` | Índigo-tinta `#191A2B` |
| Emojis | 162 en JS (`app.js` 48, `quizView.js` 55, `drugNormalization.js` 18, `detailView.js` 10, …) | `drugEmoji()`, toasts, quiz | SVG de trazo o nada |
| Estilos en línea | 370 `style="…"` (`detailView.js` 83, `app.js` 59, `interactView.js` 44, `comboView.js` 38, `ajusteView.js` 36) | vistas | Clases (tendencia a la baja) |
| Animaciones "playful" | Rebote de toasts, emoji flotante, presión "hacia abajo-derecha", celebraciones | `playful.css` (909 líneas) | Microinteracciones sobrias |
| Foco | 5 `outline: none` | `layout.css` (dock), otros | `:focus-visible` común |
| `theme-color` | `#F9F7F2` / `#1A1610` | `index.html`, `theme-bootstrap.js` | `#FBF1EC` / `#191A2B` |
| Clave de tema | `pwa_antidep_2026::v0 → state.ui.theme` | `theme-bootstrap.js`, store | Además, `localStorage["theme"]` |

Lectura: es una migración de **tokens primero, componentes después**. La identidad Neo Bauhaus vive
en ~10 tokens; cambiándolos desaparece la mitad del trazo duro sin tocar una regla.

---

## 2. Estrategia

1. **Copia de tokens comunes.** `public/shared/humano-tokens.css` (copia exacta de antipsicóticos con
   su versión). Se enlaza en `index.html` **después** de `variables.css`.
2. **Capa de alias** `src/styles/humano-alias.css`, cargada justo después de los tokens comunes:
   redefine los nombres propios de esta app (`--color-*`, `--shadow-*`, `--font-*`) apuntando a los
   comunes. Ninguna regla de componente cambia en este paso.
3. **Capa de componentes** `src/styles/humano.css`, cargada **al final** (después de `quiz.css`, antes de
   `print.css`): ajustes que los tokens no alcanzan (literales, mayúsculas, pesos, blobs).
4. **Limpieza en origen** (fases tardías): cuando la capa de componentes esté estable, mover cada ajuste a
   su archivo original y borrar la regla duplicada. Así no queda una cascada de tres capas como la que
   antipsicóticos arrastra.

Orden de carga final en `index.html`:

```
fonts.css → reset.css → variables.css → shared/humano-tokens.css → humano-alias.css
→ layout.css → components.css → playful.css → quiz.css → humano.css → print.css (media=print)
```

---

## 3. Mapa de tokens (alias)

### 3.1 Color y superficie

```css
/* src/styles/humano-alias.css */
:root, [data-theme="light"] {
  /* Primario: índigo. Se conservan los componentes h/s/l porque 11 reglas usan
     hsla(var(--color-primary-h) …) para halos y anillos. #3D4A8F ≈ hsl(230 40% 40%). */
  --color-primary-h: 230; --color-primary-s: 40%; --color-primary-l: 40%;
  /* --color-primary, --color-primary-dark y --color-primary-light NO se redefinen aquí:
     humano-tokens.css ya los define por tema con los mismos nombres. */
  --color-primary-container: var(--h-indigo-soft);
  --color-on-primary-container: var(--h-indigo-deep);

  --color-bg: var(--bg-app);
  --color-surface: var(--bg-surface);
  --color-surface-raised: var(--bg-elevated);
  --color-surface-container-lowest: var(--bg-surface);
  --color-surface-container-low: var(--bg-app);
  --color-surface-container: var(--bg-hover);
  --color-surface-container-high: var(--border-subtle);
  --color-surface-translucent: var(--glass-bg);
  --color-border: var(--glass-border);
  --color-border-strong: var(--border-subtle);
  --color-border-hard: var(--border-subtle);   /* desaparece el trazo duro */
  --color-stroke: var(--border-subtle);

  --color-text-main: var(--text-main);
  --color-text-muted: var(--text-muted);
  --color-text-dim: var(--text-muted);         /* #9A8078 no llega a AA: se unifica */

  --color-danger: var(--h-raspberry);
  --color-success: var(--h-mint);
  --color-warning: var(--h-amber);
}
[data-theme="dark"] {
  --color-primary-h: 231; --color-primary-s: 67%; --color-primary-l: 80%;
  --color-danger: var(--ritual-red);
  --color-on-primary-container: var(--accent);
  /* Las asignaciones a var(--bg-*), var(--text-*) no hace falta repetirlas: se resuelven
     en cada elemento y ya toman el valor oscuro de humano-tokens.css. */
}
```

Trampa de especificidad: `:root` y `[data-theme="dark"]` pesan lo mismo (0,1,0). Como este archivo se
carga después de los tokens, cualquier variable con **valor literal** puesta en el bloque `:root` de los
alias pisaría también al tema oscuro. Regla: en el bloque `:root` de alias sólo van `var(--token-común)`
o valores que de verdad son iguales en ambos temas; todo literal dependiente del tema va en su bloque
`[data-theme]`. El botón sólido en oscuro usa `--h-btn`, nunca `--color-primary` (que es tono de texto).

Nota de contraste: `--color-text-dim` hoy es `#9A8078` (≈ 3.3:1 sobre crema). Se fusiona con
`--text-muted`. Revisar en el PR los textos que lo usan: alguno puede quedar más oscuro de lo esperado,
que es el efecto buscado.

### 3.2 Sombra, forma y tipografía

| Token propio | Hoy | Alias |
| --- | --- | --- |
| `--shadow-sm` | `3px 3px 0 stroke` | `var(--shadow-neo-sm)` |
| `--shadow-md` | `5px 5px 0 stroke` | `var(--shadow-neo-md)` |
| `--shadow-lg` | `7px 7px 0 stroke` | `var(--shadow-neo-lg)` |
| `--shadow-xl` | `10px 10px 0 stroke` | `var(--shadow-neo-xl)` |
| `--shadow-premium` | `4px 6px 0 stroke` | `var(--shadow-neo-md)` |
| `--shadow-glass` | `3px 3px 0 rgba(…)` | `var(--shadow-neo-sm)` |
| `--shadow-dock` | difusa (ya correcta) | `0 -8px 24px rgba(46,56,112,.06), var(--shadow-neo-md)` |
| `--shadow-glow` | halo terracota | halo índigo `0 0 14px -2px color-mix(in srgb, var(--h-indigo) 28%, transparent)` |
| `--radius-sm/md/lg/xl/2xl` | 10/14/18/20/24 | 12/14/20/22/28 (inputs/botones/tarjetas/paneles/modales) |
| `--font-headers` | Montserrat | `var(--font-display)` |
| `--font-body`, `--font-sans` | DM Sans | `var(--font-base)` |
| `--transition-spring` | overshoot 1.56 | `240ms cubic-bezier(.2,0,0,1)` (sin rebote) |

### 3.3 Semántica de los colores propios

Antes de aliasar, cada color con carga semántica se clasifica (maestra §6):

| Color propio | Uso real encontrado | Destino |
| --- | --- | --- |
| `--color-secondary` (terracota) | Etiqueta "EMA" en `detailView.js:204`; borde de `field-box` en `ajusteView.js:119`; scrollbar (`reset.css`); halo en `playful.css:304` | Etiqueta EMA → `--accent`; borde de ajuste → `--h-amber` (es precaución); scrollbar → `--border-subtle` / `--text-muted`; halo → índigo. **No** a frambuesa |
| `--color-danger` | 21 usos (chips, alertas, interacciones) | `--ritual-red` |
| `--color-warning` (mostaza `#C47A00`) | precauciones | `--h-amber`, texto `#7A4310` sobre fondo ámbar suave |
| `--color-accent-mustard/pink/cyan/emerald` | 8 usos heredados | Revisar uno por uno; decorativos → índigo/rosa; estado → menta/ámbar |
| `.clinical-chip--success/warning/danger/neutral/primary` | chips clínicos | menta / ámbar / frambuesa / `--text-muted` / índigo, fondo al 10–14 % |

---

## 4. Componentes, archivo por archivo

Cada fila dice qué queda en `humano.css` (capa final). Entre paréntesis, el equivalente de referencia en
antipsicóticos.

### 4.1 Shell — `layout.css`
| Selector | Cambio |
| --- | --- |
| `.header` | Fondo `--glass-bg` + `backdrop-filter: saturate(140%) blur(10px)`; `border-bottom: 1px solid var(--glass-border)`; sin `box-shadow` (`.m3-header`) |
| `.header__logo` | Sin borde ni sombra; fondo primario (oscuro `--h-btn`); peso 600; hover sin desplazamiento diagonal |
| `.header__title` | `--font-display` 600; primera letra frambuesa (`::first-letter`, rosa en oscuro) |
| `.header__nav` | Borde 1 px `--border-subtle`, radio 14 px, fondo `--bg-elevated` |
| `.nav-gooey__blob` | Sin sombra; radio 12 px |
| `.nav-gooey__link` | Sin mayúsculas, sin tracking, peso 600 (activo 600, no 800) |
| `.floating-dock` | Fondo `--glass-bg` + blur 12 px; borde 1 px `--glass-border`; radio 22 px; sombra `--shadow-dock` (`.m3-bottom-nav`) |
| `.dock-nav-item__indicator` (activo) | Fondo `--accent-soft`, ícono `--accent`, sin borde ni sombra desplazada (`.sheet-nav-item.active`) |
| `.dock-nav-item` | Quitar `outline: none`; foco por la regla común |
| `.dock-separator` | 1 px |
| `.gatekeeper`, `.gatekeeper__card` | Velo índigo `rgba(42,45,69,.45)` + blur 10 px; tarjeta radio 28 px, cabecera con blobs (`#disclaimer-backdrop`, `.modal-header`) |
| `.evidence-container` | `border-left` 4 px → fondo `--accent-soft`, radio 16 px (`.disclaimer-lead`) |

### 4.2 Componentes — `src/styles/components/`
| Archivo | Cambio |
| --- | --- |
| `_buttons.css` | `.btn`: sin borde, sin mayúsculas, peso 600, radio 14 px, halo primario; `:active` → `translateY(0)` + `--shadow-press`. `.btn--primary` oscuro → `--h-btn`. `.btn--outline` → botón secundario (superficie + borde 1 px). `.btn--ghost` → fantasma (`--accent-soft`). Quitar `4px 6px 0` y `3px 4px 0` de los hover |
| `_cards.css` | `.card`, `.glass-effect`: borde 1 px `--glass-border`, radio 20 px, `--shadow-neo-sm` → `-md` en hover, **sin** `5px 8px 0`. `.card--spotlight::before` se conserva si es halo difuso; `.card--tonal` → `--bg-elevated` |
| `_chips.css` | Píldora 999 px; sin mayúsculas; `.chip--active` → `--accent-soft` + borde acento 35 %; chips clínicos según §3.3 |
| `_tabs.css` | Sin mayúsculas; activa con texto `--accent` y subrayado 2 px redondeado (en oscuro `--ritual-red` sólo si la pestaña es de riesgo; si no, `--accent`) |
| `_home-hero.css`, `_search-hero.css` | Hero con `--hero-gradient`, radio 28 px y dos blobs (maestra §3.5). Buscador blanco, borde 1 px transparente, `--shadow-neo-sm`; foco con anillo índigo 12 % |
| `_bottom-sheet.css` | Radio `28px 28px 0 0`; sombra `0 -18px 44px rgba(46,56,112,.14)` (oscuro negro 45 %); asa `--text-muted` 35 %; velo índigo |
| `_drug-card.css` | Tarjeta estándar; quitar el emoji (§5); el nombre en `--font-display` 600 |
| `_detail-header.css`, `_field-box.css`, `_recent.css`, `_risk-profile.css`, `_settings.css`, `_typography.css` | Quitar mayúsculas de etiquetas (11–13 px, 600, `--text-muted`); `.risk-label` igual. Las barras de riesgo conservan su color semántico |
| `_monograph.css` | 3 bordes ≥ 2 px → 1 px; citas con fondo `--accent-soft` en vez de barra gruesa |
| `_pwa-banner.css` | Toast/banner estándar: radio 16 px, `--shadow-neo-lg`, sin `position: fixed` chillón (maestra §5) |
| `_fab.css` | Botón primario circular con halo; sin trazo |
| `_skeleton.css`, `_scrollbar.css` | Colores a `--bg-hover` / `--border-subtle` |

### 4.3 `playful.css` (909 líneas)
Es el archivo con más identidad propia. Se trata por bloques:

| Bloque | Decisión |
| --- | --- |
| Toasts (`.toast`, `--success/error/warning/info`) | Toast común: sin borde de 2 px, radio 16 px, `--shadow-neo-lg`; barra izquierda de 4 px sólo para error/aviso; ícono SVG en `.toast__icon` en vez de emoji |
| `toastBounce/Shake/Jiggle/Pulse` | Fuera; una entrada única de 200 ms (opacidad + 8 px) |
| `.card-drug__emoji`, `emojiFloat` | Fuera (ver §5) |
| Presión de botón "abajo-derecha" | `translateY(1px)` |
| `.card--hoverable::after` (barra lateral de color) | Fuera; el hover lo da la sombra |
| `badgePopIn`, `chipActivate`, `compareActivate`, `tabActivate`, `iconBounce`, `searchFocusPulse`, `fieldBoxGlow` | Fuera o reducidas a transición de color de 120 ms |
| `riskFillIn`, `skeleton-shimmer` | Se conservan (informativas) sin overshoot |
| `modalSlideIn` | Se conserva, curva `cubic-bezier(.2,0,0,1)` |
| Todo el archivo | Bajo `@media (prefers-reduced-motion: reduce)` y `[data-reduced-motion]` nada se anima |

Recomendación: tras la migración, `playful.css` debería quedar por debajo de 200 líneas; si no, es
señal de que se está conservando ornamento.

### 4.4 `quiz.css` (923 líneas)
- 13 mayúsculas: categorías, etiquetas de respuesta, encabezados de repaso → ninguna.
- Opciones de respuesta: como `.guru-option` de antipsicóticos (radio 14 px, borde 1 px, hover acento suave).
- Retroalimentación: como `.guru-feedback.is-correct/.is-wrong` (menta 12 % / frambuesa 8 %).
- Pantalla de resultado: estrellas `★` en `--h-amber` con `aria-label` ("4 de 5"); el emoji grande
  (`quiz-result-emoji`) se sustituye por un ícono SVG (decisión D3).

---

## 5. Emojis (162) y estilos en línea (370)

### 5.1 Emojis
| Origen | Cantidad | Acción |
| --- | --- | --- |
| `drugEmoji(clase_terapeutica)` en `drugNormalization.js` (18) y su uso en `detailView.js:36` y `app.js` | 18 + usos | Eliminar (decisión AD1, §11). El campo clínico no se toca |
| `quizView.js` (55) | 55 | Estrellas se quedan (son texto) con `aria-label`; emojis de resultado y de categoría → SVG (D3) |
| Toasts y botones en `app.js` (48) | 48 | Fuera de botones/pestañas/títulos; en toasts → ícono SVG |
| Resto (`detailView`, `switchView`, `modalInfo`, `comboView`, `gatekeeperDisclaimer`, `settingsPanel`, `guiasView`, `coffeePopup`, `ajusteView`) | 41 | Uno por uno; si el emoji es la única señal de estado, se reemplaza por punto de estado (`.status-dot--*`) + texto |

Precaución (AGENTS.md regla 5): antes de borrar clases como `card-drug__emoji`, buscar referencias
dinámicas en JS y HTML.

### 5.2 Estilos en línea
No se persiguen todos. Se migran sólo los que llevan **color, radio, sombra, borde o mayúsculas**
(son los que contradicen el sistema), empezando por `detailView.js` (83). Ejemplo del patrón:

```js
// antes (detailView.js:204)
<div class="text-xs" style="font-weight:800; color:var(--color-secondary); text-transform:uppercase; letter-spacing:0.07em; …">EMA</div>
// después
<div class="label-eyebrow">EMA</div>   /* .label-eyebrow en humano.css: 12 px, 600, --accent */
```

---

## 6. Tema y arranque

1. `theme-bootstrap.js`: colores del meta a `#FBF1EC` / `#191A2B`.
2. Leer **primero** `localStorage["theme"]` (clave común del dominio) y, si no existe, la clave actual
   del store. Al cambiar tema en `settingsPanel.js`, escribir ambas. Así, al integrarse, la preferencia
   viaja entre apps sin migración de datos.
3. Si no hay preferencia guardada, seguir `prefers-color-scheme` (hoy el valor por defecto es `light`).
4. `index.html`: dos `<meta name="theme-color">` con `media` para el primer pintado.
5. `manifest.webmanifest`: `theme_color` y `background_color` a `#FBF1EC`.

## 7. Fuentes

- Sustituir los 14 `woff2` actuales (DM Sans, Montserrat) por los de Poppins/Inter/JetBrains Mono que
  publique la Fase 0 de antipsicóticos (mismos archivos, misma ruta relativa `assets/fonts/`).
- Actualizar `fonts.css`, los `preload` de `index.html` y el precache de `src/sw.js`.
- Quitar `download_fonts.cjs` / `download_fonts.py` o actualizarlos a las nuevas familias.

---

## 8. Secuencia de PR

Cada PR es independiente, revisable en una sentada y con capturas.

| PR | Contenido | Riesgo | Validación extra |
| --- | --- | --- | --- |
| A1 | `shared/humano-tokens.css` + `humano-alias.css` (§3) + test de contraste | Medio: cambia todo el color | Matriz de capturas completa; revisar §3.3 vista por vista |
| A2 | Fuentes (§7) | Bajo | Offline: abrir sin red tras primera carga |
| A3 | Shell: header, nav, dock, gatekeeper (§4.1) + tema (§6) | Medio | 390 px con el dock; teclado en el dock |
| A4 | Componentes base: botones, tarjetas, chips, pestañas, hero, hoja (§4.2) | Medio | Todas las vistas en ambos temas |
| A5 | `playful.css` (§4.3) | Bajo | `prefers-reduced-motion` |
| A6 | Quiz (§4.4) | Bajo | Recorrer un quiz completo |
| A7 | Emojis y estilos en línea con color (§5) | Medio: toca JS de vistas | `npm test`, lint; buscar referencias dinámicas |
| A8 | Limpieza en origen: mover reglas de `humano.css` a sus archivos y borrar lo muerto | Bajo si A1–A7 están estables | Diff visual nulo |

## 9. Verificación (cada PR)

- `npm run lint` (0 warnings), `npm test`, `npm run build` (AGENTS.md §Verificación).
- Test de contraste de tokens en verde.
- Capturas: {inicio, ficha de fármaco, comparador/combinación, switching, ajuste, quiz, hoja inferior,
  gatekeeper, toast} × {claro, oscuro} × {1280, 390 px}, junto a las equivalentes de antipsicóticos.
- Lista negra de la maestra (§5) sobre `src/styles/` sin regresiones; al cerrar A8, en 0.
- Impresión (`print.css`) sin cambios: comprobar que el PDF de pie (`pdfFooter`) sigue igual.
- Sección del PR con (a) qué cambió, (b) qué no cambió aunque parecía pedido, (c) qué no se pudo
  verificar (AGENTS.md).

## 10. Riesgos específicos de esta app

| Riesgo | Mitigación |
| --- | --- |
| 11 reglas construyen color con `hsla(var(--color-primary-h) …)`: si sólo se cambia `--color-primary`, los halos siguen azul acero | El alias redefine también `-h/-s/-l` (§3.1) |
| `--color-text-dim` unificado oscurece textos secundarios | Esperado; revisar jerarquía en ficha y comparador |
| El store persiste el tema en una clave propia | Doble lectura/escritura (§6), sin migración destructiva |
| `print.css` hereda tokens y puede cambiar el PDF | Validar impresión en A1 |
| Quitar animaciones elimina feedback que el usuario usa | Conservar las informativas (barra de riesgo, esqueleto, entrada de modal) |

## 11. Decisiones tomadas (2026-10-17)

Delegadas por el responsable del proyecto. Las comunes están justificadas en la maestra (§13).

| # | Decisión | Efecto aquí |
| --- | --- | --- |
| D2 (maestra) | Interfaz en índigo; el azul acero sobrevive sólo en el ícono de la app | `manifest.webmanifest` e íconos de `public/icons/` conservan su tono; ningún token de interfaz lo usa |
| D3 (maestra) | Emojis del quiz → íconos SVG; estrellas `★` se quedan con `aria-label` | `starsFor()` en `quizView.js` devuelve un nombre de ícono en vez de `emoji`; `.quiz-result-emoji` pasa a `.quiz-result-icon` |
| D4 (maestra) | La escala `--space-*` de esta app es la común | `variables.css` deja de definirla cuando los tokens comunes la traigan; mismos valores, sin cambio visual |
| AD1 | `drugEmoji(clase_terapeutica)` **se elimina**, no se reemplaza por un ícono por clase | Un ícono por clase terapéutica sería una taxonomía visual nueva que alguien debería validar clínicamente y mantener. La clase ya es un dato: si la ficha no la muestra como texto junto al nombre, se añade un chip neutro (`.clinical-chip--neutral`) con `item.clase_terapeutica` tal cual, sin transformar. La función se borra de `drugNormalization.js` sólo después de buscar todas sus referencias (AGENTS.md regla 5) |
| AD2 | Clave de tema: se lee y escribe `localStorage["theme"]` **además** del store; la clave del store no se borra | Migración no destructiva: si la integración se retrasa o revierte, nada se pierde. Se retira la doble escritura cuando la Fase 3 esté en producción |
| AD3 | `--color-text-dim` se fusiona con `--text-muted` | Corrige textos por debajo de AA (≈ 3.3:1); es una mejora de accesibilidad, no un gusto |
| AD4 | Animaciones: se conservan sólo las que informan (barra de riesgo, esqueleto, entrada de modal/hoja); el resto se elimina, no se "suaviza" | Código que no aporta información es mantenimiento puro; `playful.css` objetivo < 200 líneas |
| AD5 | Los PR de implementación usan ramas con prefijo `claude/` | Cumple la plantilla de PR del repo; esta rama de documentación (`ccr-…`) la asignó la sesión |
