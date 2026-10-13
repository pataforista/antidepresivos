# Actualización de Hashes SRI (Subresource Integrity)

**Ámbito:** Librerías externas cargadas vía CDN en `index.html`.  
**Origen:** [ADR-001](adr/ADR-001-cdn-vs-bundle.md), Issue #1 de [BACKLOG_ISSUES.md](BACKLOG_ISSUES.md).

---

## 1. Librerías Actuales y Hashes Fijados

| Librería | Versión | URL Exacta | Hash SRI (SHA-384) |
|---|---|---|---|
| **Chart.js** | `4.4.0` | `https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js` | `sha384-e6nUZLBkQ86NJ6TVVKAeSaK8jWa3NhkYWZFomE39AvDbQWeie9PlQqM3pmYW5d1g` |
| **ZingTouch** | `1.0.6` | `https://cdn.jsdelivr.net/npm/zingtouch@1.0.6/dist/zingtouch.min.js` | `sha384-E3Fcl5P7FtKlKfVaN2rpNCL9VQ4f7rTIai05xf/I4X7RjqtbQgaMARztc11NLBMU` |
| **html2pdf.js** | `0.10.1` | `https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js` | `sha384-Yv5O+t3uE3hunW8uyrbpPW3iw6/5/Y7HitWJBLgqfMoA36NogMmy+8wWZMpn3HWc` |

---

## 2. Procedimiento para Actualizar o Bumpear una Librería

Cuando se requiera actualizar la versión de una librería CDN:

1. **Nunca usar `latest` ni rangos (`^`, `~`)**. Fijar la versión semántica exacta.
2. Descargar el archivo o calcular el hash SHA-384 en base64 directamente con Node.js o `curl` + `openssl`:

### Opción A — Con `curl` + `openssl`:
```bash
curl -sL "<URL_DE_LA_LIBRERIA>" | openssl dgst -sha384 -binary | openssl base64 -A
```

### Opción B — Con Node.js:
```javascript
const crypto = require('crypto');
const https = require('https');

function getSRI(url) {
  https.get(url, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      return getSRI(res.headers.location);
    }
    const hash = crypto.createHash('sha384');
    res.on('data', chunk => hash.update(chunk));
    res.on('end', () => console.log('sha384-' + hash.digest('base64')));
  });
}

getSRI('https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js');
```

3. Actualizar la etiqueta `<script>` en `index.html`:
```html
<script 
  src="https://cdn.jsdelivr.net/npm/chart.js@<NUEVA_VERSION>/dist/chart.umd.min.js" 
  integrity="sha384-<NUEVO_HASH>" 
  crossorigin="anonymous"
></script>
```

4. **Invalidar la caché del Service Worker si aplica**:  
   Si se actualiza la versión de Chart.js o html2pdf, bumpear la constante `CDN_VERSION` en `src/sw.js` (ej. de `'v1'` a `'v2'`) para asegurar que clientes con Service Worker activo descarguen la nueva versión.

5. Verificar en DevTools:
   - Pestaña **Console**: cero errores de `Failed to find a valid digest in the 'integrity' attribute`.
   - Pestaña **Network**: la librería devuelve status 200/304 o carga desde Service Worker.
