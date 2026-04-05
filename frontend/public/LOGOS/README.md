# Logos ELVIA — Guía de Uso

## Versiones Disponibles

### SVG Vectoriales (Recomendado para web)

#### Con Google Fonts (Orbitron)
- **`elvia-logo-dark.svg`** — Logo horizontal, fondo azul oscuro, texto blanco
  - Uso: Headers, hero sections, dark themes
  - Escala: infinita, se ve igual en cualquier resolución

- **`elvia-logo-light.svg`** — Logo horizontal, fondo transparente, texto negro  
  - Uso: Sobre fondos claros, impresión, documentos
  - Escalable a cualquier tamaño

- **`elvia-favicon.svg`** — Ícono E cuadrado, fondo azul oscuro
  - Uso: Favicon moderno, app icons
  - 512×512 (escala a cualquier tamaño)

#### Self-Contained (Sin dependencias externas)
- **`elvia-logo-dark-paths.svg`** — Logo con texto convertido a paths (Arial Black)
  - No necesita descargar fuentes
  - Se ve igual sin conexión a internet
  - Más pesado que versión con Google Fonts (~2.5KB vs ~1.5KB)

- **`elvia-favicon-paths.svg`** — Favicon con texto en paths
  - Totalmente self-contained
  - Funciona en cualquier contexto (email, PDF, offline)

### PNGs Optimizados

#### Para Web (1200px de ancho)
- `elvia-logo-dark-web.png` — 1200×669px, ~660KB
- `elvia-logo-light-web.png` — 1200×669px, ~650KB
- Usar para: `<img>` tags, backgrounds grandes
- Más rápido que SVG para raster backgrounds

#### Favicons (Tamaños estándar)
- `elvia-favicon-512x512.png` — PWA, splash screens
- `elvia-favicon-192x192.png` — Android
- `elvia-favicon-180x180.png` — iPhone
- `elvia-favicon-64x64.png` — Desktop
- `elvia-favicon-32x32.png` — Browser tab
- `elvia-favicon.ico` — Multi-resolución (16/32/48)
- `apple-touch-icon.png` — iOS home screen

## Configuración en HTML

### Head Completo
```html
<!-- Favicon -->
<link rel="icon" href="/LOGOS/elvia-favicon.ico" sizes="any">
<link rel="icon" href="/LOGOS/elvia-favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/LOGOS/apple-touch-icon.png">

<!-- PWA -->
<link rel="icon" href="/LOGOS/elvia-favicon-192x192.png" sizes="192x192">
```

### Logo en Header
```html
<!-- Versión SVG (recomendado) -->
<img src="/LOGOS/elvia-logo-light.svg" alt="ELVIA" class="logo">

<!-- Versión PNG fallback (si no funciona SVG) -->
<picture>
  <source srcset="/LOGOS/elvia-logo-light.svg" type="image/svg+xml">
  <img src="/LOGOS/elvia-logo-light-web.png" alt="ELVIA">
</picture>

<!-- Self-contained (sin conexión a internet) -->
<img src="/LOGOS/elvia-logo-dark-paths.svg" alt="ELVIA">
```

## Guía de Selección

| Caso de Uso | Recomendado | Por qué |
|---|---|---|
| Logo en web (header) | `elvia-logo-light.svg` | Escalable, ligero, se ve perfecto |
| Favicon en navegador | `elvia-favicon.svg` | Vectorial, se ve igual a cualquier tamaño |
| Android app icon | `elvia-favicon-192x192.png` | Tamaño específico, optimizado |
| Email/PDF | `elvia-logo-dark-paths.svg` | Self-contained, sin dependencias |
| Background grande | `elvia-logo-dark-web.png` | PNG raster, más rápido que SVG |
| Offline/Export | `*-paths.svg` | Sin Google Fonts, funciona sin internet |

## Notas Técnicas

### Google Fonts (Orbitron)
- ✅ Aspecto idéntico al diseño original
- ✅ Archivo SVG más ligero (~1.5KB)
- ⚠️ Requiere conexión a fonts.googleapis.com
- ✅ Funciona en navegadores modernos

### Paths (Arial Black)
- ✅ Self-contained, sin dependencias
- ✅ Funciona en cualquier contexto
- ⚠️ Tipografía ligeramente diferente (Arial vs Orbitron)
- ⚠️ Archivo más pesado (~2.5KB)

## Tamaños y Optimización

| Archivo | Tamaño | Notas |
|---|---|---|
| elvia-logo-dark.svg | 2.7KB | Google Fonts, recomendado |
| elvia-logo-light.svg | 1.9KB | Google Fonts, recomendado |
| elvia-favicon.svg | 2.5KB | Google Fonts |
| elvia-logo-dark-paths.svg | 2.5KB | Self-contained |
| elvia-favicon-paths.svg | 1.8KB | Self-contained |
| elvia-logo-dark-web.png | 677KB | Optimizado, 1200×669 |
| elvia-logo-light-web.png | 666KB | Optimizado, 1200×669 |
| elvia-favicon-512x512.png | 263KB | Retina quality |
| elvia-favicon-32x32.png | 1.5KB | Browser tab |

## Cambios Realizados

1. **SVG Vectoriales** — Escalables a cualquier resolución
2. **Elimina fondos no escalables** — Los originales tenían fondos baked
3. **Favicon cuadrada correcta** — 512×512 en lugar de landscape
4. **Versiones offline** — Paths SVG sin dependencias
5. **Optimización web** — PNGs para web a 1200px
6. **Apple/Android icons** — Tamaños estándar listos

