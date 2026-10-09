# Estrategia Offline-First — Antidepresivos 2026

Implementación del [ADR-006](../adr/ADR-006-offline-first.md).

## Tabla de cachés

| Recurso | Estrategia | Cache name | TTL | Max entries |
|---------|-----------|------------|-----|-------------|
| App shell (HTML/CSS/JS) | Precache | `workbox-precache-v2` | Invalidación por build | N/A |
| Navegación HTML | NetworkFirst (3s) | `pages-v1` | Revalidación por visita | N/A |
| Chart.js, html2pdf (CDN) | CacheFirst | `cdn-v1` | 365 días | 20 |
| Datos clínicos (.csv, .json) | NetworkFirst (3s) | `clinical-data-v1` | 7 días | 50 |
| Imágenes, fuentes | StaleWhileRevalidate | `assets-v1` | 30 días | 60 |

## Cómo testear offline

1. `npm run build && npm run preview`
2. Abrir `http://localhost:4173`
3. DevTools → Application → Service Workers → verificar SW activo
4. DevTools → Network → activar "Offline"
5. Recargar → todo debe funcionar excepto contenido clínico nuevo

## Cómo forzar un update del SW

- DevTools → Application → Service Workers → botón "Unregister"
- O cerrar TODAS las pestañas del scope (activación automática)

## Bumping de versiones de caché

Si cambias las librerías CDN en `index.html`, actualiza `CDN_VERSION` en `src/sw.js`
para invalidar el cache antiguo en todos los usuarios.

## Flujo de actualización

La app usa `registerType: 'prompt'` (ver ADR-006). Nunca se auto-recarga.

1. Un nuevo SW se instala en background.
2. Al completar la instalación, si ya hay un SW controlando la página, pasa a estado `waiting`.
3. La app detecta `waiting` vía `registerUpdateHandler` y muestra un banner:
   > "Nueva versión disponible [Más tarde] [Actualizar]"
4. Comportamiento según acción:
   - **Actualizar**: `postMessage({ type: 'SKIP_WAITING' })` → el SW se activa → `controllerchange` → reload.
   - **Más tarde**: el banner se oculta. El SW se activa cuando el usuario cierra todas las pestañas del scope.
   - **Sin acción**: el banner se re-muestra en la siguiente carga si el SW sigue en `waiting`.

## Cómo testear el flujo de update

1. Abrir el preview deployment, verificar que el SW está activo.
2. Hacer un cambio trivial (`git commit --allow-empty -m "test: bump"`).
3. Pushear a la misma rama del PR.
4. Esperar a que Cloudflare Pages redeploye.
5. Recargar la app con `Ctrl+R` (soft reload, no `Ctrl+Shift+R`).
6. El banner debería aparecer en ~5–10 segundos.
7. Pulsar "Actualizar" → verificar que la app recarga y el SW nuevo está activo.

## Instalabilidad de la PWA

La app es instalable como PWA en:

| Plataforma | Mecanismo | Requisitos |
|------------|-----------|-----------|
| Android (Chrome) | Banner "Instalar app" | Manifest + SW + HTTPS + iconos `any` + `maskable` |
| iOS (Safari) | "Añadir a pantalla de inicio" (manual) | `apple-touch-icon` + `apple-mobile-web-app-capable` |
| Desktop (Chrome/Edge) | Icono "Instalar" en barra de URL | Igual que Android |

### Iconos

- `favicon.svg` — fuente vectorial (editable en Figma/Inkscape).
- `icon-192.png`, `icon-512.png` — iconos `any` para Android.
- `icon-maskable-512.png` — icono `maskable` (con padding 20%, resistente al recorte de Android).
- `apple-touch-icon.png` (180×180) — icono para iOS.

### Cómo verificar la instalabilidad

1. Chrome DevTools → **Application → Manifest** → comprobar que carga sin errores.
2. Chrome DevTools → **Application → Manifest → Installability** → debe decir "Installable".
3. Lighthouse → PWA audit → verde en "installable".
