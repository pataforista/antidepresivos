# 🚀 Guía de Despliegue en Cloudflare Pages

## Descripción General

Este documento proporciona instrucciones completas para desplegar la aplicación **Antidepresivos** en **Cloudflare Pages**.

**Estado del Proyecto:**
- ✅ SPA estática (Single Page Application)
- ✅ PWA (Progressive Web App)
- ✅ Sin dependencias complejas
- ✅ Optimizado para Cloudflare Pages

---

## 📋 Requisitos Previos

1. **Cuenta de Cloudflare**
   - Acceso a Cloudflare Dashboard
   - Dominio conectado a Cloudflare (opcional, puede usar `*.pages.dev`)

2. **Git & GitHub**
   - Repositorio en GitHub
   - Acceso a configurar secrets en GitHub

3. **Node.js & npm**
   - Node.js 18+ instalado localmente
   - npm 8+ para gestionar dependencias

---

## 🔧 Configuración Inicial

### Paso 1: Obtener Credenciales de Cloudflare

1. Ve a **Cloudflare Dashboard** → **My Profile** → **API Tokens**
2. Crea un nuevo token con estos permisos:
   - `Account.Pages:Edit` (para desplegar)
   - `Account.Cloudflare Pages:Edit`

   **O usa un token existente con permisos amplios**

3. Copia el token (lo necesitarás en el Paso 3)

4. Obtén tu **Account ID**:
   - Dashboard → Overview → En la esquina derecha, busca "Account ID"
   - Cópialo

### Paso 2: Configurar Variables en GitHub

1. Ve a tu repositorio en GitHub
2. Navega a **Settings** → **Secrets and variables** → **Actions**
3. Crea 2 secretos:

   ```
   CLOUDFLARE_API_TOKEN = <tu_token_api>
   CLOUDFLARE_ACCOUNT_ID = <tu_account_id>
   ```

### Paso 3: Vincular Dominio (Opcional)

Si tienes un dominio personalizado:

1. En Cloudflare Dashboard → Pages
2. Selecciona tu proyecto "antidepresivos"
3. Settings → Custom domain
4. Agrega tu dominio
5. Configura los registros DNS según Cloudflare indique

---

## 📦 Estructura de Archivos

```
antidepresivos/
├── wrangler.toml              ← Configuración de Cloudflare
├── package.json               ← Dependencias y scripts
├── .github/
│   └── workflows/
│       ├── deploy.yml         ← GitHub Pages (antiguo)
│       └── deploy-cloudflare.yml  ← Cloudflare Pages (nuevo)
└── appantidepresivos/
    └── antidepresivos/
        └── web_app/
            └── public/        ← Directorio raíz de despliegue
                ├── index.html
                ├── _redirects
                ├── sw.js      ← Service Worker
                ├── manifest.webmanifest
                ├── assets/
                ├── src/
                └── data/
```

---

## 🚀 Despliegue Automático

### Opción A: GitHub Actions (Recomendado)

El workflow `deploy-cloudflare.yml` automatiza todo:

1. **Trigger:** Cualquier push a la rama `main`
2. **Pasos:**
   - Descarga el código
   - Instala dependencias (`npm ci`)
   - Construye la app (`npm run build`)
   - Despliega a Cloudflare Pages
   - Comenta en PRs con enlace de preview

**Para activar:**
```bash
git push origin main
```

Luego verifica en GitHub Actions que el workflow se ejecute exitosamente.

---

## 💻 Despliegue Manual Local

Si necesitas desplegar manualmente desde tu computadora:

### 1. Instalar Wrangler CLI

```bash
npm install -g wrangler
# o con npx (sin instalación global)
npx wrangler --version
```

### 2. Autenticarse con Cloudflare

```bash
wrangler login
```

Esto abrirá tu navegador para autorizar el acceso.

### 3. Desplegar

```bash
npm run deploy
```

O directamente:

```bash
npx wrangler pages deploy appantidepresivos/antidepresivos/web_app/public \
  --project-name=antidepresivos \
  --branch=main
```

### 4. Verificar Despliegue

- Abre: `https://antidepresivos.pages.dev`
- O tu dominio personalizado si lo configuraste

---

## ⚙️ Configuración Avanzada

### wrangler.toml

El archivo `wrangler.toml` contiene:

```toml
[build]
cwd = "./"
command = "npm run build"

[env.production]
name = "antidepresivos-prod"
```

**Personaliza según tu dominio:**

```toml
[env.production]
routes = [
  { pattern = "tudominio.com/*", zone_name = "tudominio.com" },
  { pattern = "www.tudominio.com/*", zone_name = "tudominio.com" }
]
```

### _redirects (SPA)

El archivo `_redirects` asegura que todas las rutas apunten a `index.html`:

```
/*    /index.html   200
```

Esto permite que React Router (o tu router) maneje la navegación del lado del cliente.

---

## 🔍 Verificación de Despliegue

### Checklist Post-Despliegue

- [ ] Sitio accesible en `https://antidepresivos.pages.dev`
- [ ] Homepage carga correctamente
- [ ] Navegación SPA funciona (no F404 al cambiar rutas)
- [ ] PWA manifest carga sin errores
- [ ] Service Worker registra correctamente
- [ ] Dark mode funciona
- [ ] Assets (CSS, JS) cargan correctamente
- [ ] Fuentes externas (Google Fonts) se cargan
- [ ] CDN externo (Chart.js, ZingTouch) funcionan
- [ ] Quiz y funcionalidades interactivas operan

### Comandos de Diagnóstico

```bash
# Ver logs del deployment
npx wrangler pages deployment list --project-name=antidepresivos

# Verificar configuración
npm run build

# Desarrollo local
npm run dev
# Abre http://localhost:8788
```

---

## 🛡️ Seguridad & Headers

Cloudflare Pages añade automáticamente headers de seguridad. Para personalizarlos:

1. Dashboard → Pages → Project → Settings → Builds & deployments
2. Environment variables personalizadas (opcional)

**CSP Actual (en index.html):**

```html
<meta http-equiv="Content-Security-Policy"
  content="default-src 'self';
           script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
           style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
           font-src 'self' https://fonts.gstatic.com;
           img-src 'self' data:;
           connect-src 'self';">
```

---

## 📊 Monitoreo

### Analytics en Cloudflare

1. Dashboard → Pages → Tu proyecto → Analytics
2. Visualiza:
   - Requests por día
   - Errores HTTP
   - Performance (latencia, etc.)

### Monitoreo Externo

Configura alertas en:
- **Uptime Robot** para monitored de disponibilidad
- **Better Uptime** para notificaciones de caídas
- **Sentry** para errores del lado del cliente

---

## 🔄 Actualizar Despliegue

### Con GitHub Actions

Simplemente haz push a `main`:

```bash
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main
```

El workflow se ejecutará automáticamente.

### Manualmente

```bash
npm run deploy
```

---

## 🐛 Troubleshooting

### Problema: "Project not found"

**Solución:** Asegúrate de que el nombre en GitHub secrets coincide con el proyecto en Cloudflare.

```bash
# Listar proyectos
npx wrangler pages project list
```

### Problema: SPA rutas dan 404

**Solución:** Verifica que `_redirects` esté en el directorio `public`:

```bash
ls appantidepresivos/antidepresivos/web_app/public/_redirects
```

### Problema: Assets no cargan (CSS, JS en 404)

**Solución:** Verifica rutas relativas en `index.html`:

```html
<!-- ❌ No funciona en SPA -->
<script src="/src/app.js"></script>

<!-- ✅ Correcto -->
<script src="./src/app.js"></script>
```

### Problema: GitHub Actions workflow falla

**Solución:** Verifica secrets:

```bash
# En GitHub Settings → Secrets
# Debe haber:
# - CLOUDFLARE_API_TOKEN
# - CLOUDFLARE_ACCOUNT_ID
```

---

## 📚 Scripts Disponibles

```bash
# Desarrollo local
npm run dev

# Construir para producción
npm run build

# Desplegar a Cloudflare
npm run deploy

# Desplegar a producción
npm run deploy:prod

# Lint (no configurado aún)
npm run lint

# Tests (no configurado aún)
npm run test
```

---

## 🎯 Próximos Pasos

1. **Configura secrets en GitHub** (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID)
2. **Haz push a main** para disparar el workflow
3. **Monitorea en GitHub Actions** que se complete exitosamente
4. **Accede a tu sitio** en `https://antidepresivos.pages.dev`
5. **Personaliza dominio** si tienes uno

---

## 📞 Soporte

Para problemas con:
- **Cloudflare Pages:** https://developers.cloudflare.com/pages/
- **Wrangler CLI:** https://developers.cloudflare.com/workers/wrangler/
- **Este proyecto:** Contacta al equipo de desarrollo

---

## ✅ Checklist de Despliegue Completado

- [x] `wrangler.toml` creado
- [x] `package.json` configurado
- [x] GitHub Actions workflow creado
- [x] `_redirects` actualizado
- [x] Documentación de despliegue completada
- [ ] Secrets configurados en GitHub (PENDIENTE - lo haces tú)
- [ ] Primer despliegue exitoso (PENDIENTE - lo haces tú)

---

**Última actualización:** 2026-03-26
**Versión:** 1.0.0
