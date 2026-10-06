# Arquitectura del Proyecto "Antidepresivos"

Este documento describe la estructura técnica y lógica del proyecto, el flujo de datos y cómo interactúan las distintas piezas.

## Visión General

El proyecto es una **Herramienta de Soporte Clínico** para profesionales de salud mental. Está compuesta por tres grandes bloques:
1. **Los Datos Crudos (`DATASET_PSICOFARMACOLOGIA/`)**: La fuente de verdad (CSV) que contiene la información médica.
2. **Scripts de Compilación y Validación**: Herramientas que procesan los CSV y los convierten en JSON estáticos.
3. **La Aplicación Web (`appantidepresivos/.../web_app/public/`)**: Una Single Page Application (SPA) y Progressive Web App (PWA) construida en Vanilla JavaScript y CSS (sin frameworks como React o Vue) que consume los JSON generados.

---

## 1. Estructura de Directorios

```text
/
├── DATASET_PSICOFARMACOLOGIA/  # Fuente de verdad (Datos Crudos)
│   ├── antidepresivos/         # Archivos CSV de los fármacos por familia (ISRS, IMAO, etc.)
│   ├── guias_clinicas/         # Archivos CSV de protocolos y guías (APA, NICE, CANMAT)
│   ├── validator/              # Validadores de datos
│   └── normalize.js            # Script que compila los CSV en JSON
├── appantidepresivos/.../web_app/
│   └── public/                 # CÓDIGO FUENTE DE LA APP Y DISTRIBUCIÓN
│       ├── data/               # Datasets JSON compilados (listos para ser leídos por la app)
│       ├── assets/             # Fuentes, íconos y otros estáticos (Maskable icons, woff2)
│       ├── src/                # Código fuente de la SPA
│       │   ├── core/           # Lógica central (Store, Router, i18n)
│       │   ├── ui/             # Componentes de la interfaz
│       │   └── styles/         # CSS modularizado (Material Design 3)
│       ├── index.html          # Punto de entrada y Shell de la PWA
│       ├── sw.js               # Service Worker para funcionamiento Offline
│       └── manifest.webmanifest# Manifiesto de PWA para instalación
├── scripts/                    # Utilidades de desarrollo (ej. generadores de iconos)
└── .github/                    # Workflows de CI/CD para GitHub Actions
```

---

## 2. Flujo de Datos (Cómo se comunican las piezas)

El proyecto utiliza un enfoque **"Build-time Data"** (Datos en tiempo de compilación). No hay una base de datos relacional (SQL) ni un backend (Node/Python) respondiendo en tiempo real a la aplicación.

### Paso 1: Edición Clínica
La información farmacéutica (dosis, perfiles de riesgo, vidas medias) y guías clínicas se editan en crudo utilizando los archivos `.csv` en `DATASET_PSICOFARMACOLOGIA`.

### Paso 2: Normalización
Se ejecuta un script (ej. `normalize.js` o `csv_to_dataset.js`) que:
- Parsea los CSV.
- Valida la integridad de la información médica.
- Cruza referencias.
- Genera archivos JSON ultrarrápidos y optimizados y los deposita en `public/data/` (ej. `dataset.antidepresivos.v1.0.0.json`, `guias_clinicas.json`).

### Paso 3: Consumo en la App
Cuando un usuario abre la aplicación en el navegador:
1. El archivo `index.html` carga los scripts Vanilla JS.
2. `src/core/dataLoader.js` hace `fetch()` asíncrono a los JSON estáticos locales (`/data/...`).
3. Los datos cargados se inyectan en `src/core/store.js` (un gestor de estado global primitivo basado en patrón publicador/suscriptor).
4. Las vistas (`src/ui/`) se suscriben a los cambios de estado y actualizan dinámicamente el DOM utilizando plantillas literales de JavaScript (Template Literals).

### Paso 4: Offline (PWA)
El `sw.js` (Service Worker) intercepta las peticiones de red. En el primer acceso, cachea todo el código (HTML, CSS, JS) y todos los datos JSON (a través del arreglo `CORE_ASSETS`). En futuras visitas, la app responde 100% offline, cargando al instante desde la caché local del dispositivo.

---

## 3. Información Disponible (Los Datos)

Actualmente, el sistema gestiona:
- **Monografías de Antidepresivos**: Familias, nombres genéricos, riesgos metabólicos/cardíacos/abstinencia, semivida, perlas clínicas.
- **Protocolos de Cambio (Switching)**: Una matriz relacional para cambiar de un antidepresivo a otro (Tapering cruzado, "wash-out", dosis puente).
- **Guías Clínicas**: Algoritmos de tratamiento internacionales (APA, NICE, CANMAT, WFSBP) curados para Depresión, Ansiedad, TOC, etc.
- **Diccionario Multi-idioma**: Archivos de localización (`locales.json`) para servir la interfaz en Español e Inglés sin latencia.

---

## 4. Diseño e UI (Sistema Estético)

La interfaz utiliza una mezcla arquitectónica llamada **"Neo Bauhaus + Naive"** o **"Material Design Playful"**.
- **No se usan frameworks CSS** externos (ni Bootstrap ni Tailwind), sino archivos propios basados en variables (`src/styles/variables.css`).
- Uso intensivo de **Microinteracciones** ("Haptic feedback" en dispositivos móviles), animaciones (`animate-fade-in`), y modo claro/oscuro que alterna variables instantáneamente.

## 5. Despliegue (Infraestructura)
El proyecto es estático. Todo el directorio `public/` se sincroniza y publica globalmente mediante **Cloudflare Pages**, lo cual proporciona un CDN (Content Delivery Network) global sin costo de servidor, garantizando alta velocidad de respuesta y HTTPS automático.
