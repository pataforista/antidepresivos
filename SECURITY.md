# 🔐 Política de Seguridad

## Versiones soportadas

| Versión | Soportada | Notas |
|---------|:---------:|-------|
| `master` (última) | ✅ | Recibe parches de seguridad |
| `develop` | ⚠️ | Solo para pruebas internas |
| Releases anteriores | ❌ | Actualizar a la última versión |

> **Antidepresivos 2026** es una herramienta de apoyo clínico. Aunque no procesa datos de pacientes, un fallo de seguridad podría comprometer la integridad del contenido médico o la confianza de los profesionales que la usan.

---

## 🚨 Cómo reportar una vulnerabilidad

**NO abras un issue público.** Usa nuestro canal privado:

**Único canal**: email a `seguridad@drcelada.com`
   - Asunto: `[SECURITY] Antidepresivos — <resumen>`
   - Cifrado (opcional): PGP disponible bajo petición

### Qué incluir en el reporte

- Descripción del problema y **impacto potencial**
- Pasos para reproducirlo (PoC si es posible)
- Versión / commit afectado
- ¿Es explotable en producción (`antidepresivos.drcelada.com`)?
- Cualquier mitigación que ya conozcas

---

## ⏱️ SLA de respuesta

| Fase | Plazo |
|------|-------|
| Acuse de recibo | ≤ 48 h |
| Evaluación inicial + severidad (CVSS) | ≤ 5 días |
| Plan de mitigación comunicado | ≤ 10 días |
| Parche para severidad **crítica** | ≤ 15 días |
| Divulgación pública coordinada | Tras el parche, con crédito si lo deseas |

---

## 🎯 Alcance (in-scope)

- Frontend en `antidepresivos.drcelada.com`
- Lógica de `switchingMatrix` y cálculos clínicos
- Pipeline CI/CD y configuración de Cloudflare
- Dependencias declaradas en `package.json`

## 🚫 Fuera de alcance (out-of-scope)

- Ataques de denegación de servicio volumétricos
- Ingeniería social contra el equipo
- Vulnerabilidades en navegadores o en Cloudflare (repórtalas al proveedor)
- Ausencia de cabeceras de seguridad sin PoC demostrable
- Reportes automáticos de scanners sin validación manual

---

## 🧯 Clasificación de severidad

| Severidad | Ejemplo en este proyecto |
|-----------|--------------------------|
| 🔴 **Crítica** | Manipulación remota de dosis mostradas o de `switchingMatrix` |
| 🟠 **Alta** | XSS que permite inyectar contenido clínico falso |
| 🟡 **Media** | Fuga de información de desarrollo (rutas internas, versiones) |
| 🟢 **Baja** | Best practices faltantes sin impacto real demostrable |

---

## 🛡️ Prácticas de seguridad del proyecto

- **Secretos**: solo en GitHub Actions Secrets y Cloudflare. Nunca en repo ni en prompts de IA.
- **Dependencias**: auditadas con `npm audit` en cada release; Dependabot activo para `devDependencies`.
- **Contenido clínico**: cualquier cambio pasa por revisión N3 (ver `docs/GOVERNANCE.md §3.3`).
- **CI**: bloquea merge si `npm run lint` o `npm test` fallan.
- **Sin datos de pacientes**: la app es editorial; cualquier PR que introduzca telemetría con PII será rechazado.
- **Cabeceras**: `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy` configuradas en Cloudflare.

---

## 🙏 Reconocimientos

Agradecemos a quienes reportan vulnerabilidades de forma responsable. Con tu permiso, te acreditaremos en el `CHANGELOG.md` tras el parche.

---

**Contacto de seguridad**: Dr. Celada — `seguridad@drcelada.com`
**Última revisión**: 2026-03-25
**Próxima revisión**: 2026-09-25
