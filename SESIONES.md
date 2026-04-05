# OPTIMA-CV — Log de Sesiones

Formato: una entrada por sesión de trabajo.
Propósito: pasar contexto entre sesiones y entre IAs (Claude ↔ Gemini).
Instrucción: leer solo cuando se necesite recap del estado actual.

---

## Sesión 2026-04-04 · Claude (Antigravity)

### Contexto de partida
- Sesión anterior (Claude) había dejado `ProyectoLaboral.jsx` funcional con 6 pilares
- `/cv-desde-cero` existía pero con problemas: el análisis mostraba 15% aunque el CV tenía experiencia/educación → bug en el mapeo de datos extraídos
- El backend `/api/cv/extract-profile` solo extraía datos personales básicos (nombre, ciudad, pais, idiomas, educación), no experiencias ni habilidades
- Problema resuelto en sesión anterior: `.env.local` apuntando a `localhost:3001` en lugar de producción (Railway)

### Qué se hizo

**`backend/src/controllers/cvController.js` — `extractProfile`**
- Expandido el prompt de Claude Haiku (`max_tokens` 800 → 1500) para extraer también:
  - `experiencias` (últimas 4): empresa, cargo, fecha_inicio, fecha_fin, descripcion
  - `habilidades` (hasta 12): en idioma original del CV
  - `cargo_actual`: título profesional más reciente, en idioma original
  - `resumen`: perfil/objetivo si existe al inicio del CV, en idioma original
- **Regla de idioma**: el contenido de resumen, descripciones y habilidades se mantiene en el idioma original del CV (inglés, francés, etc). Solo el campo `pais` va en español
- **Validación de identidad en backend**: tras extraer el CV, compara nombre1/apellido1 extraídos vs el perfil registrado en Supabase (`profiles`)
  - Si no coincide → devuelve `mismatch: true` en el JSON de respuesta (no un error 400) para que el frontend gestione el flujo de confirmación

**`frontend/src/pages/CVDesdeCero.jsx`** (reescrito completo)
- **Validación de identidad (ownership)**: si el backend devuelve `mismatch: true`, se guarda en `cvPending` y se muestra un banner rojo con botón "Confirmar que es mi CV →". El usuario puede forzar la aplicación, igual que en `ProyectoLaboral.jsx`
- **Mapeo completo de datos extraídos**: `aplicarDatos()` mapea experiencias, educacion, habilidades, idiomas, cargo_actual y resumen al estado del wizard. El email del registro NO se sobreescribe
- **Fix del algoritmo de análisis** (`analizarCalidad()`):
  - Antes: corría sobre un objeto con `experiencias: []` y `educacion: []` vacíos → siempre daba score bajo
  - Ahora: corre sobre el objeto merged completo → score real (ej. CV con 3 exp + edu + habilidades → 70-85%)
  - Lógica de pesos: encabezado 20pts, resumen 20pts, experiencia 30pts (escala: 1→12, 2→22, 3+→30), educacion 15pts, habilidades 15pts (escala: 3→10, 6+→15)
- **Panel lateral de análisis** (no fullscreen): componente `PanelAnalisis` que aparece en columna derecha sticky (desktop) cuando el usuario sube un CV. Se puede cerrar con X. Antes era una pantalla completa que interrumpía el wizard
- **% de llenado del wizard**: segunda barra de progreso bajo la barra de pasos. Evalúa 11 campos críticos → 0-100%. Color: azul < 50%, ámbar 50-80%, verde ≥ 80%
- **Habilidades del CV vs estándar**: las habilidades extraídas del CV que no están en la lista predefinida se muestran en sección separada "Del CV:", eliminables con X. Existe también campo libre para agregar habilidades personalizadas
- **Confirmación y guardado en BD**: `confirmarYGuardar()` ahora guarda además `job_search_profile.cv_datos_originales: { datos, generado_en }` en Supabase junto con el CV generado en Storage. Limpia `cv_borrador` al confirmar

**`frontend/src/pages/CVDesdeCero.jsx` — ajustes UX adicionales**
- Eliminado banner amarillo "Tu progreso no se guardará. Suscríbete..." para todos los usuarios
- **Mismatch banner rediseñado**: eliminado botón "Confirmar que es mi CV" (ya no se puede forzar). Ahora tiene:
  - Texto legal: "No se puede subir información de terceros sin su previa autorización. Para mayor información lee Términos & Condiciones y Privacidad de Datos"
  - Botón "Cargar otro CV" que limpia el estado y abre el file picker
- **Validación de identidad doble capa**: además del check en backend, el frontend compara los nombres extraídos del CV contra `datos.nombre`/`datos.apellido` pre-cargados del perfil. Funciona aunque el backend no esté actualizado
- **PanelAnalisis — nuevo copy**:
  - Subtítulo: "Análisis bajo altos estándares internacionales y expertos mentores de carrera."
  - Nota de privacidad: "Esta es información privada y solo tuya. Nuestras recomendaciones son parte del proceso, pero tú debes aprobar los cambios."
  - Mensaje al llegar a 100%: "Revisa cada sección para incluir actualizaciones, indicadores de gestión o información relevante. Después de esto, te generaremos una CV optimizada."

**`backend/src/controllers/cvGenerarController.js`** (reescrito — fix 3 bugs críticos)
- **Bug 1 — `SISTEMA_BASE` no definido**: el código original hacía `require('../services/claudeService').SISTEMA_BASE` pero esa variable **no se exporta** en claudeService → crash inmediato. Fix: prompt del sistema inline en el controller
- **Bug 2 — destructuring incorrecto**: `parsearRespuestaOptimize` devuelve `{ optimizedCV, changes, recommendations }` pero el código desestructuraba `{ cvText, cambios, recomendaciones }` → `cvText` siempre `undefined`. Fix: parse manual con regex directamente sobre `response.content[0].text`
- **Bug 3 — `supabase.raw()` inexistente**: Supabase JS v2 no tiene `.raw()`. Fix: lectura previa del perfil + suma manual antes del `update()`
- **Cambio de modelo**: Sonnet → Haiku para generación desde datos estructurados (más rápido, económico; no necesita nivel creativo de Sonnet)
- **Debug temporal**: el catch ahora devuelve `detalle` y `stack` en la respuesta 500 para facilitar diagnóstico. Remover antes de producción

### Estado del proyecto (snapshot 2026-04-04)

**Frontend — páginas existentes (26 archivos en `/pages`):**
`Admin`, `Auth`, `Biblioteca`, `Bienestar`, `BienvenidaOnboarding`, `CVDesdeCero`, `CVOptimizer`, `CVvsJob`, `Dashboard`, `Entrevista`, `Expertos`, `Infografias`, `JobMatches`, `Landing`, `Landing2`, `LinkedinOptima`, `MiPlan`, `MisCVs`, `MisVacantes`, `Onboarding`, `Perfil`, `Pipeline`, `Pricing`, `Privacidad`, `ProyectoLaboral`, `ResetPassword`

**Backend — módulos B2B (`company.js`, 655 líneas):**
- Registro público por slug de empresa (`GET/POST /api/company/registration/:slug`)
- CRUD usuarios bajo `company_admin`
- Sistema de invitaciones con email
- Dashboard con estadísticas de adopción
- Reporte de costos (planes + mentoría) con exportación

**`ProyectoLaboral.jsx` — estado completo:**
- 6 pilares: Perfil, Autoconocimiento, Recursos, Semana, Oferta, Documentos
- Mi Perfil → 3 sub-tabs: Datos Personales / Compensación / Aspiraciones
- Upload CV con extracción IA + validación de nombre vs registro
- Formulario de compensación completo: salario, prestaciones por país, bono/variable con cálculo automático
- Auto-save con debounce 1.5s

### Pendientes conocidos (no resueltos)
Ver `REPORTE_AUDITORIAS.md` para listado completo. Críticos:
- Rotar API keys (Anthropic, Supabase service_role, Resend, Jooble, SerpAPI)
- Proteger `GET /api/waitlist` con auth + check is_admin
- Agregar `require('./routes/events')` en app.js (crash al arrancar sin él)
- SSRF en `/api/jobs/fetch-url` → whitelist de dominios
- Paginación en `GET /api/waitlist` (sin límite puede devolver 25 MB)

### Estado del repo
- Branch: `main`
- Dev: frontend en `localhost:5177`, backend en `localhost:3001`
- Deploy: Netlify (frontend) + Railway (backend) + Supabase (DB)
- Archivos modificados esta sesión: `backend/src/controllers/cvController.js`, `frontend/src/pages/CVDesdeCero.jsx`

---

## Sesión 2026-03-29/30 · Claude

### Contexto de partida
- Proyecto venía de sesión con Gemini (ver `task gemini 290326` en raíz)
- Landing en modo waitlist activa, Admin con 6 tabs funcionando
- Deploy: Netlify (frontend) + Railway (backend) + Supabase (DB)

### Qué se hizo

**Landing.jsx**
- Trust badges: se movieron bajo el mockup. Fix de superposición con widget flotante (wrapper `div.relative.pb-16`)
- Nav: botón "Únete a la Lista de Espera" ahora scrollea al form del hero (`#waitlist-form`), no al bottom
- País + Teléfono: se creó catálogo `PAISES` (17 países, campo `ipName` en inglés para mapear ipapi.co correctamente). Se separó teléfono en select de indicativo + input de número
- IP detection fix: bug donde "Mexico" (inglés de ipapi) no matcheaba "México" (español del select)
- Form state: se agregó campo `indicativo`

**Landing2.jsx**
- Solo se tocó el simulador: auto-typing animation al entrar en viewport, `demoTypingDone` state, glow/bounce naranja en botón al terminar
- Botón "Revelar mis errores ocultos" → "Volver" (cierra overlay, no navega)
- Todo lo demás igual (es versión de testing interno, no pública)

**Admin.jsx — WaitlistTab**
- Fetch cambiado: de `db.from('waitlist_leads')` (anon key, bloqueado por RLS) → `fetch('/api/waitlist')` (usa service role en backend)
- Dashboard mejorado: KPIs, barras de últimos 7 días, breakdown por situación, top países, buscador, exportar CSV, email clicable

**backend/routes/waitlist.js**
- Nuevo `GET /api/waitlist` para que Admin lea leads (usa supabaseAdmin, bypasa RLS)
- `POST /` actualizado: acepta `indicativo`, combina `indicativo + telefono` antes de guardar

### Pendientes detectados (auditorías)
Ver `REPORTE_AUDITORIAS.md` para detalle completo.

### Estado del repo
- Branch: `main`
- Último commit: `6ae812f` — feat(waitlist): fix admin data fetch, improve dashboard, and refine landing forms
- Archivos modificados no commiteados: `backend/src/app.js`, `backend/src/routes/admin.js`

---
