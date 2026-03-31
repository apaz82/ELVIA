# OPTIMA-CV — Reporte de Auditorías
**Fecha:** 2026-03-30 | **Para leer en camino**

---

## TL;DR — Lo que más importa hoy

1. 🔴 **Rotar tus API keys** — están en el repo git (Anthropic, Supabase, Resend)
2. 🔴 **El admin de waitlist es público** — cualquiera puede leer todos tus leads
3. 🟠 **ipapi.co revienta con 1,000 visitas/día** — hay que quitarlo antes de cualquier campaña
4. 🟠 **Resend se corta en el lead #100 del día** — no en el 3,000 del mes
5. 🟡 **El formulario tiene UX rota en mobile** — 8 campos, grid de 2 cols en iPhone

---

## AUDITORÍA 1 — SEGURIDAD
*15 hallazgos | 4 Críticos · 5 Altos · 4 Medios · 2 Bajos*

### 🔴 Críticos

**[CRIT-1] Keys reales en el repositorio**
El `backend/.env` tiene claves de producción activas. Si alguien accedió al repo alguna vez, tiene acceso total a tu DB y puede gastar en tu cuenta de Anthropic.
- Acción: Ir a Supabase, Anthropic, Resend, Jooble, SerpAPI → regenerar todas las keys
- Verificar si fue commiteado: `git log --all --full-history -- backend/.env`

**[CRIT-2] GET /api/waitlist sin autenticación**
El endpoint que creamos para el admin dashboard está completamente abierto. Cualquier persona que sepa la URL de tu backend puede descargar nombre, email, teléfono y país de todos tus leads.
- Archivo: `backend/src/routes/waitlist.js:7`
- Fix: agregar middleware de auth + verificar `is_admin`

**[CRIT-3] eventRoutes no importado en app.js**
El servidor puede estar crasheando silenciosamente al arrancar.
- Archivo: `backend/src/app.js:89`
- Fix: agregar `const eventRoutes = require('./routes/events')`

**[CRIT-4] SSRF en fetch-url**
Un usuario puede ordenarle a tu servidor que haga requests a URLs internas (metadatos de Railway, endpoints privados).
- Archivo: `backend/src/routes/jobs.js:24`
- Fix: whitelist de dominios permitidos (linkedin.com, indeed.com, etc.)

### 🟠 Altos

| # | Problema | Archivo | Fix |
|---|----------|---------|-----|
| H1 | XSS con snippet de Jooble renderizado como HTML | JobMatches.jsx:506 | DOMPurify |
| H2 | /api/events/track sin auth, acepta cualquier dato | routes/events.js:15 | Whitelist de event names |
| H3 | Health check expone que service_role_key está activa | app.js:59 | Simplificar a `{ status: 'ok' }` |
| H4 | OTP en memoria — se pierde en cada restart de Railway | otpService.js:7 | Migrar a tabla Supabase |

### 🟡 Medios / Bajos

- Email del lead se guarda en tabla de analytics (PII) → quitarlo
- `nombre` del usuario se interpola directo en HTML del email → escapeHtml()
- Un GET a `/api/events/track` en la landing genera 404 silencioso en cada visita → eliminar

---

## AUDITORÍA 2 — UX/UI
*32 hallazgos | 4 Críticos · 10 Altos · 10 Medios · 8 Bajos*

### 🔴 Críticos (pre-lanzamiento)

**[C1] Contraste de inputs no pasa accesibilidad**
Los campos del formulario tienen fondo `bg-white/5` y placeholder `white/20` — ratio de contraste 2.5:1 cuando WCAG requiere 4.5:1. Usuarios con baja visión no leen los campos.
- Fix: `bg-gray-900/50` + `placeholder-gray-400`

**[C2] Sin validación visual en el formulario**
Los errores solo aparecen al enviar. No hay feedback mientras el usuario escribe.
- Fix: validación en tiempo real para email, mínimo 2 chars en nombre

**[C3] El H1 del hero no dice qué hace el producto**
"Tu carrera, Acompañada por OPTIMA" es aspiracional pero no explica qué resuelve. El subtítulo es mejor que el título.
- Fix sugerido: "Supera los filtros ATS en 60 segundos"

**[C4] Promesas de 8 features, solo 2 están listas**
El bento grid muestra Pipeline, Biblioteca, LinkedIn Optimo, etc. — que no existen. Un usuario que pague puede decepcionar.
- Fix: agregar badge "Próximamente" en features no disponibles

### 🟠 Altos (impactan conversión)

**[A1] 8 campos en el formulario**
La industria recomienda máximo 5. Abandono estimado: 35-50% en mobile.
- Fix: unir "Nombre completo", teléfono opcional, detectar país por IP (ya funciona)

**[A2] Grid de 2 columnas en mobile**
En iPhone (375px) cada input tiene ~160px de ancho. Muy estrecho, muy mala experiencia.
- Fix: `grid-cols-1 md:grid-cols-2`

**[A3] El sorteo PRO está enterrado**
El mayor incentivo de conversión ("gana una Cuenta PRO Mensual, sorteo 8 de Abril") está en `text-xs` dentro del formulario oscuro. Nadie lo ve.
- Fix: card destacada arriba del form con borde naranja

**[A4] Simulador termina en auth wall**
El usuario hace el esfuerzo de ver la demo y se bloquea antes de ver el resultado. Oportunidad perdida.
- Fix: mostrar resultado parcial, CTA suave abajo

**[A5] Después de registrarse, no hay siguiente paso**
El mensaje de éxito no dice qué pasará ni invita a compartir. Referral loop perdido.

**[A6] Sin footer con links legales**
No hay Términos ni Privacidad accesibles desde la landing. El link a privacidad está escondido en el checkbox.

### 🟡 Medios notables

- Labels de inputs sin `htmlFor` — lectores de pantalla no los conectan
- Avatar del hero muy grande en mobile
- Admin: KPIs en orden incorrecto (Administradores > CVs optimizados)
- Admin: tabla de waitlist sin filtros por país o situación

---

## AUDITORÍA 3 — ESCALABILIDAD
*12 riesgos identificados*

### Si mañana se registran muchas personas:

| Personas | Qué se rompe | Cuándo |
|----------|-------------|--------|
| 1,001 visitas/día | ipapi.co devuelve error, detección de país falla | Al instante |
| Lead #101 del día | Resend para de enviar emails de bienvenida | Al instante |
| 50 análisis simultáneos | Node.js single-process se atasca, timeouts | Pico de uso |
| 5,000 leads en DB | Admin carga 2.5 MB de JSON, tarda 3-5 segundos | Gradual |
| Sin cap en Claude | Un bot puede generarte una factura de cientos de dólares | Cualquier día |

### 🔴 Los 3 fixes gratis que hay que hacer antes de cualquier campaña

**1. Quitar ipapi.co del frontend** (`Landing.jsx:262`)
Límite: 1,000 requests/día. Con 1,001 visitas, la detección de país falla para todos.
```js
// Reemplazar por:
const lang = navigator.language || 'es-CO'
```

**2. Agregar paginación al admin de waitlist** (`waitlist.js:12`)
Sin esto, con 50K leads el admin carga 25 MB de JSON y congela el navegador.
```js
.select('*').range(0, 49).order('created_at', { ascending: false })
```

**3. Hard cap diario en llamadas a Claude**
Sin límite, un ataque de fuerza bruta puede generar $500+ en un día.
- Contador en Supabase: si se superan N análisis/día, devolver error controlado

### Costos para escalar

| Etapa | Usuarios | Costo extra/mes | Qué comprar |
|-------|----------|-----------------|-------------|
| Ahora | 0-500 | $0 | Solo código |
| Creciendo | 500-5K | ~$45 | Resend Pro ($20) + posible Supabase Pro ($25) |
| Escalando | 5K-50K | ~$150 | Redis + cola de emails + Cloudflare Pages |

### Otros riesgos a tener en cuenta

- **Resend:** el límite real es **100 emails/DÍA** (no 3,000/mes como parece)
- **3-4 requests por visita** a la landing solo para analytics — hay que consolidar
- **Race condition** en el contador de visitas — datos incorrectos desde día 1
- **Sin compresión HTTP** en el backend — todo el JSON viaja 3x más pesado
- **Rate limiter en memoria** — si Railway escala a 2 instancias, no se comparte

---

## Plan de acción priorizado

### Esta semana (CRÍTICO — antes de publicar)
- [ ] Rotar todas las API keys
- [ ] Proteger `GET /api/waitlist` con auth
- [ ] Quitar ipapi.co, reemplazar con navigator.language
- [ ] Agregar `require('./routes/events')` en app.js
- [ ] Agregar paginación al fetch de waitlist en admin
- [ ] Hard cap diario en Claude API

### Antes del lanzamiento (ALTO — UX)
- [ ] Contraste de inputs del formulario
- [ ] Formulario: 8 campos → 5 campos
- [ ] Mobile: `grid-cols-2` → `grid-cols-1 md:grid-cols-2`
- [ ] Reescribir H1 del hero
- [ ] Mover texto del sorteo PRO arriba del form
- [ ] Marcar features "Próximamente" en bento grid
- [ ] Footer con links legales

### Post-lanzamiento (MEDIO — cuando empiece a crecer)
- [ ] Resend Pro ($20/mes) cuando se acerquen a 100 leads/día
- [ ] Simulador sin auth wall
- [ ] Compresión HTTP en Express
- [ ] Mensaje de éxito con botón de compartir

---

*Reporte generado el 2026-03-30 | OPTIMA-CV pre-lanzamiento*
