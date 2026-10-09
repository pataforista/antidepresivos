/**
 * Banner de "Nueva versión disponible".
 *
 * Implementación del flujo de update de ADR-006 §Notas de implementación.
 *
 * Reglas críticas:
 * - NUNCA auto-reload. Solo tras click explícito del usuario.
 * - El SW en "waiting" se activa solo cuando el usuario pulsa "Actualizar"
 *   (SKIP_WAITING) o cuando cierra todas las pestañas del scope (default).
 * - El banner se re-muestra en cada carga si el SW sigue esperando.
 */

const BANNER_ID = 'pwa-update-banner'

/**
 * Crea e inyecta el banner en el DOM (si no existe).
 * @returns {HTMLElement}
 */
function createBanner() {
  const existing = document.getElementById(BANNER_ID)
  if (existing) return existing

  const banner = document.createElement('div')
  banner.id = BANNER_ID
  banner.className = 'pwa-update-banner'
  banner.setAttribute('role', 'status')
  banner.setAttribute('aria-live', 'polite')

  banner.innerHTML = `
    <span class="pwa-update-banner__message">
      Nueva versión disponible
    </span>
    <div class="pwa-update-banner__actions">
      <button
        type="button"
        class="pwa-update-banner__btn pwa-update-banner__btn--ghost"
        data-action="dismiss"
      >
        Más tarde
      </button>
      <button
        type="button"
        class="pwa-update-banner__btn pwa-update-banner__btn--primary"
        data-action="update"
      >
        Actualizar
      </button>
    </div>
  `

  document.body.appendChild(banner)
  return banner
}

/**
 * Elimina el banner del DOM.
 */
function removeBanner() {
  const banner = document.getElementById(BANNER_ID)
  if (banner) banner.remove()
}

/**
 * Muestra el banner y gestiona las acciones del usuario.
 * @param {ServiceWorkerRegistration} registration
 */
function showBanner(registration) {
  const banner = createBanner()

  const onUpdate = () => {
    const waiting = registration.waiting
    if (waiting) {
      waiting.postMessage({ type: 'SKIP_WAITING' })
    }
    // El reload se dispara desde 'controllerchange' (ver registerUpdateHandler)
  }

  const onDismiss = () => {
    removeBanner()
    // El SW sigue en waiting. Se activará cuando el usuario cierre todas
    // las pestañas del scope. Comportamiento documentado en ADR-006.
  }

  banner.addEventListener('click', (e) => {
    const action = e.target.closest('[data-action]')?.dataset.action
    if (action === 'update') onUpdate()
    if (action === 'dismiss') onDismiss()
  })
}

/**
 * Registra el handler de update en la registration existente.
 * Llama a esto desde el bloque `updatefound` de tu registro de SW.
 * @param {ServiceWorkerRegistration} registration
 */
export function registerUpdateHandler(registration) {
  // Caso 1: la registration ya tiene un SW en waiting (recarga tras dismiss)
  if (registration.waiting && navigator.serviceWorker.controller) {
    showBanner(registration)
  }

  // Caso 2: un nuevo SW se instala durante esta sesión
  registration.addEventListener('updatefound', () => {
    const newWorker = registration.installing
    if (!newWorker) return

    newWorker.addEventListener('statechange', () => {
      if (
        newWorker.state === 'installed' &&
        navigator.serviceWorker.controller
      ) {
        // Hay un controller (no es la primera instalación) → banner
        showBanner(registration)
      }
    })
  })
}

/**
 * Escucha el cambio de controller y recarga la página.
 * Debe llamarse UNA vez, al arrancar la app.
 * Guard contra bucles de reload.
 */
export function listenForControllerChange() {
  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return
    refreshing = true
    window.location.reload()
  })
}
