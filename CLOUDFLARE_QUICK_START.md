# ⚡ Cloudflare Pages - Inicio Rápido

## 3 Pasos para Desplegar

### 1️⃣ Configura Credenciales en GitHub (2 min)

**En GitHub Repository Settings:**

```
Settings → Secrets and variables → Actions
```

Crea 2 secretos:

| Nombre | Valor |
|--------|-------|
| `CLOUDFLARE_API_TOKEN` | Tu API token de Cloudflare |
| `CLOUDFLARE_ACCOUNT_ID` | Tu Account ID de Cloudflare |

**Cómo obtenerlos:**
- API Token: https://dash.cloudflare.com/profile/api-tokens
- Account ID: https://dash.cloudflare.com (esquina superior derecha)

---

### 2️⃣ Haz Push a Main (1 min)

```bash
git add .
git commit -m "chore: Cloudflare Pages deployment setup

- Add wrangler.toml configuration
- Add package.json with build scripts
- Add GitHub Actions workflow for Cloudflare Pages
- Update _redirects for Cloudflare compatibility
- Add comprehensive deployment guide"

git push origin main
```

---

### 3️⃣ Verifica el Despliegue (5 min)

**En GitHub:**
1. Ve a **Actions** en tu repositorio
2. Busca el workflow "Deploy to Cloudflare Pages"
3. Espera a que termine (verde ✅)

**Accede a tu sitio:**
```
https://antidepresivos.pages.dev
```

---

## 🎯 Verificación Rápida

Después del despliegue, verifica:

```bash
# En tu navegador
https://antidepresivos.pages.dev

# Prueba estas rutas (no deben dar 404):
https://antidepresivos.pages.dev/
https://antidepresivos.pages.dev/fichas
https://antidepresivos.pages.dev/quiz
https://antidepresivos.pages.com/creditos
```

Si todas cargan correctamente → ✅ **Despliegue exitoso**

---

## 📱 Prueba PWA (Opcional)

1. Abre en Chrome/Edge: https://antidepresivos.pages.dev
2. Click en el ícono "+" en la barra de direcciones
3. "Instalar aplicación"
4. Úsala offline (el Service Worker lo permite)

---

## 🔗 Dominio Personalizado (Opcional)

Si tienes un dominio (`antidepresivos.com`):

1. **En Cloudflare Dashboard:**
   - Pages → Proyecto → Settings
   - Custom domain → Añade tu dominio
   - Sigue instrucciones de DNS

2. **Actualiza wrangler.toml:**
   ```toml
   [env.production]
   routes = [
     { pattern = "antidepresivos.com/*", zone_name = "antidepresivos.com" }
   ]
   ```

3. **Push y listo:**
   ```bash
   git push origin main
   ```

---

## 📖 Documentación Completa

Para más detalles, ver: [`CLOUDFLARE_DEPLOYMENT_GUIDE.md`](./CLOUDFLARE_DEPLOYMENT_GUIDE.md)

---

## ✅ Checklist de 5 Minutos

- [ ] Copié API Token de Cloudflare
- [ ] Copié Account ID
- [ ] Añadí 2 secrets en GitHub
- [ ] Hice push a main
- [ ] Workflow ejecutándose en GitHub Actions
- [ ] Sitio accesible en antidepresivos.pages.dev
- [ ] Navegación SPA funciona sin 404s

**¿Completaste todo? 🎉 ¡Está listo para producción!**

---

**Tiempo total:** ~8 minutos ⏱️
