# 🎨 Guía de Implementación — Elementos Playful

**Archivo de referencia**: `src/styles/playful.css`
**Fecha de creación**: 2026-03-25
**Objetivo**: Documentar cómo usar las nuevas clases y animaciones playful en componentes

---

## 📚 Tabla de Contenidos

1. [Toast Notifications](#toast-notifications)
2. [Button Ripple Effects](#button-ripple-effects)
3. [Emoji Floating Elements](#emoji-floating-elements)
4. [Animaciones de Entrada](#animaciones-de-entrada)
5. [Micro-animaciones Existentes](#micro-animaciones-existentes)
6. [Ejemplos Prácticos](#ejemplos-prácticos)

---

## 🔔 Toast Notifications

### Clases Disponibles
- `toast` - Base
- `toast--success` - ✅ Con emoji de éxito
- `toast--error` - ❌ Con emoji de error
- `toast--warning` - ⚠️ Con emoji de advertencia
- `toast--info` - ℹ️ Con emoji de información

### HTML Ejemplo
```html
<div class="toast toast--success">
  ¡Drogas comparadas exitosamente!
</div>

<div class="toast toast--error">
  No se pudo guardar la comparación
</div>

<div class="toast toast--warning">
  Esta droga tiene contraindicaciones
</div>

<div class="toast toast--info">
  Presiona aquí para más información
</div>
```

### Animación
- **Entrada**: Slide in desde la derecha (400ms)
- **Emoji**: Bounce si success, shake si error, jiggle si warning, pulse si info
- **Duración total**: ~500-600ms

### Uso en JavaScript
```javascript
// Crear toast con clase apropiada
const toast = document.createElement('div');
toast.className = 'toast toast--success';
toast.textContent = '¡Drogas agregadas a comparación!';
document.body.appendChild(toast);

// Toast se auto-destruye (implementar en app.js)
setTimeout(() => toast.remove(), 3000);
```

---

## 🌊 Button Ripple Effects

### Clases Soportadas
Automáticamente soportan ripple en click:
- `.btn` - Todos los botones
- `.chip` - Chips / Pills
- `.dock-nav-item` - Navegación flotante

### HTML Ejemplo
```html
<button class="btn btn--primary">
  Comparar Drogas
</button>

<div class="chip chip--active">
  SSRI
</div>
```

### Animación
- **Trigger**: Click (evento `active`)
- **Efecto**: Onda concéntrica que se expande desde el punto de click
- **Duración**: 600ms (cubic-bezier)
- **Rango**: Hasta 300px de diámetro

### CSS Interno
```css
.btn::after {
    animation: ripple 0.6s ease-out;
}

@keyframes ripple {
    to {
        width: 300px;
        height: 300px;
        opacity: 0;
    }
}
```

---

## 🧪 Emoji Floating Elements

### Clase: `.card-drug__emoji`

### HTML Ejemplo
```html
<div class="card-drug">
    <div class="card-drug__header">
        <div class="card-drug__emoji">💊</div>
        <h3 class="card-drug__name">Sertraline</h3>
    </div>
</div>
```

### Emojis Sugeridos para Farmacología
| Emoji | Significado | Uso |
|-------|------------|-----|
| 💊 | Droga/Píldora | Inicio de card, general |
| 🧠 | Cerebro | Efecto en SNC |
| ❤️ | Corazón | Efectos cardiovasculares |
| 😴 | Sueño | Sedación |
| ⚠️ | Advertencia | Efectos adversos |
| 🔬 | Laboratorio | Mecanismo científico |
| 📊 | Gráfico | Datos/comparación |
| ✨ | Brillo | Eficacia/estrellas |
| 🎯 | Diana | Selectividad |
| 🛡️ | Escudo | Protección/seguridad |

### Animación
```css
.card-drug__emoji {
    animation: emojiFloat 2s ease-in-out infinite;
}

@keyframes emojiFloat {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-4px) rotate(2deg); }
}
```

---

## 🚀 Animaciones de Entrada

### Disponibles

#### 1. Badge Pop In
```css
.badge { animation: badgePopIn 0.4s; }
```
**Uso**: Badges que aparecen dinámicamente

#### 2. Chip Activate
```css
.chip--active { animation: chipActivate 0.3s; }
```
**Uso**: Cuando un chip pasa a estado activo

#### 3. Tab Activate
```css
.tab-btn--active { animation: tabActivate 0.3s; }
```
**Uso**: Cuando una pestaña se activa

#### 4. Modal Slide In
```css
.modal { animation: modalSlideIn 0.4s; }
```
**Uso**: Aparición de modales/bottom sheets

#### 5. Skeleton Shimmer Enhanced
```css
.skeleton { animation: skeleton-shimmer-enhanced 2s infinite; }
```
**Uso**: Loaders más atractivos

---

## 📋 Micro-animaciones Existentes

### Icon Bounce (Dock Navigation)
```css
.dock-nav-item:hover .dock-nav-item__icon {
    animation: iconBounce 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
```
**Trigger**: Hover en dock items
**Duración**: 400ms
**Efecto**: Icono sube y escala

### Card Glow Pulse (Card Hover)
```css
.card--hoverable:hover::before {
    animation: glowPulse 1.5s ease-in-out infinite;
}
```
**Trigger**: Hover en cards
**Duración**: 1.5s infinita
**Efecto**: Destello suave alrededor del cursor

### Search Focus Pulse
```css
.search-hero__input:focus {
    animation: searchFocusPulse 0.4s ease-out;
}
```
**Trigger**: Focus en input de búsqueda
**Duración**: 400ms
**Efecto**: Pulso de sombra expansivo

### Field Box Glow
```css
.field-box:hover {
    animation: fieldBoxGlow 0.3s ease-out forwards;
}
```
**Trigger**: Hover en field boxes
**Duración**: 300ms
**Efecto**: Glow sutile de color secundario

### Comparison Activate
```css
.card-drug__compare-btn.active {
    animation: compareActivate 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
```
**Trigger**: Click en botón de comparación
**Duración**: 500ms
**Efecto**: Scale + rotate festivo

---

## 💻 Ejemplos Prácticos

### Ejemplo 1: Agregar Toast de Éxito

```javascript
// En tu código de manejo de comparación
function addDrugToComparison(drug) {
    // Lógica de comparación...

    // Mostrar toast playful
    const toast = document.createElement('div');
    toast.className = 'toast toast--success';
    toast.textContent = `✨ "${drug.name}" agregado a comparación`;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3500);
}
```

### Ejemplo 2: Mejorar Drug Card con Emoji

```html
<!-- ANTES -->
<div class="card card--hoverable">
    <h3 class="card-drug__name">Sertraline</h3>
</div>

<!-- DESPUÉS -->
<div class="card card--hoverable">
    <div class="card-drug__header">
        <div class="card-drug__emoji">💊</div>
        <h3 class="card-drug__name">Sertraline</h3>
        <button class="card-drug__compare-btn">+</button>
    </div>
</div>
```

### Ejemplo 3: Animar Entrada de Chips

```html
<div class="clinical-chips-row">
    <span class="clinical-chip clinical-chip--success">SSRI</span>
    <span class="clinical-chip clinical-chip--warning">Sedation</span>
    <span class="clinical-chip clinical-chip--danger">QT Prolongation</span>
</div>
```

Los chips entrarán con animación escalonada automáticamente.

### Ejemplo 4: Mejorar Skeleton Loader

```html
<!-- Skeleton loader que parece más "vivo" -->
<div class="skeleton-card">
    <div class="skeleton skeleton-line--title"></div>
    <div class="skeleton skeleton-line--sub"></div>
    <div class="skeleton skeleton-line"></div>
</div>
```

---

## ⚡ Performance Tips

1. **Reducir Motion en Usuarios que lo Prefieren**
   ```css
   @media (prefers-reduced-motion: reduce) {
       * { animation-duration: 0.01ms !important; }
   }
   ```
   ✅ Ya incluido en `playful.css`

2. **Usar `will-change` para Animaciones Constantes**
   ```css
   .floating-element {
       will-change: transform;
   }
   ```

3. **Limitar Animaciones Simultáneas**
   - No animar más de 3 elementos a la vez
   - Usar `animation-delay` para escalonar (ver clinical-chips)

4. **GPU Acceleration**
   - `transform` y `opacity` usan GPU
   - Evitar animar `width`, `height`, `left`, `top`

---

## 🔗 Integración en app.js

### Paso 1: Importar Funciones de Toast
```javascript
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3500);
}
```

### Paso 2: Llamar en Eventos Importantes
```javascript
// En handleDrugSelection
showToast(`🎉 "${drugName}" seleccionado`, 'success');

// En handleError
showToast('❌ Error al cargar datos', 'error');

// En handleComparison
showToast('✨ Comparación lista', 'success');
```

### Paso 3: Agregar Emojis en Renderers
```javascript
// En badgeRenderers.js, fieldRenderers.js
// Agregar emojis según contexto del badge/field
```

---

## 📊 Checklist de Implementación

### Fase 1: Estilos (✅ HECHO)
- [x] Crear `playful.css`
- [x] Incluir en `index.html`
- [x] Documentar clases

### Fase 2: Toast Notifications
- [ ] Implementar `showToast()` en `app.js`
- [ ] Reemplazar alerts genéricos con toasts playful
- [ ] Probar en: comparación, filtros, búsqueda

### Fase 3: Emoji Enhancements
- [ ] Agregar emojis en drug cards
- [ ] Agregar emojis en badges clínicos
- [ ] Mapeo drug-type → emoji

### Fase 4: Polish
- [ ] Revisar animaciones en mobile
- [ ] Probar dark mode
- [ ] Validar accesibilidad (reduced motion)

---

## 🎯 Próximas Mejoras (Tier 2-3)

Después de implementar estos, considerar:

1. **Confetti Effect** - Al agregar drogas a comparar
2. **Mascota Quiz** - Apariciones sutiles en vistas principales
3. **Sonidos Microtonales** - Feedback auditivo opcional
4. **Gradientes Dinámicos** - Basados en selecciones
5. **Easter Eggs** - Click en logo, combinaciones especiales

---

**Autor**: Claude AI
**Fecha**: 2026-03-25
**Estado**: Guía v1.0 — Implementación Tier 1 completa
