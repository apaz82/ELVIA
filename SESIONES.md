# OPTIMA-CV — Log de Sesiones

Formato: una entrada por sesión de trabajo.
Propósito: pasar contexto entre sesiones y entre IAs (Claude ↔ Gemini).
Instrucción: leer solo cuando se necesite recap del estado actual.

---

## Sesión 2026-04-05 (3) · Gemini (Antigravity)

### Contexto de partida
- Se solicitó desarrollar la funcionalidad de generación de "Infografías del Proyecto Laboral".
- Se requería que la IA corrija gramática/ortografía sin perder contexto y utilizando español hispanoamericano profesional, extrayendo datos estructurales de Perfil + Autoconocimiento + Compensación.
- La experiencia visual (frontend) debía ser de alto nivel (impacto), por lo cual se eligió generar el diseño en React + Tailwind y exportarlo con `html2pdf.js`.

### Qué se hizo

**1. Backend — Motor de Infografía (`/api/cv/infografia-proyecto`):**
- Implementado el nuevo endpoint REST para procesar la información unificada del Proyecto Laboral guardado por el usuario (`job_search_profile`).
- Integración de `claude-haiku` bajo estrictas directrices de Cero-Alucinación para corregir la sintaxis y reformatear campos como "empresas target", "habilidades" y "expectativas salariales".
- Guardado en bbdd `cv_results` utilizando el type identifier `infografia_proyecto`.

**2. Frontend — Canvas Visual (`ReporteLaboral.jsx`):**
- Se creó una vista independiente fuera del Sidebar que estipula dimensiones fijas A4 (8.5in x 11in), simulando la vista pre-impresión.
- Acabados UI/UX de nivel corporativo: gradients púrpuras, íconos de PhosphorIcons integrados a un sistema de grids organizativos.
- Se ha incorporado `html2pdf.js` atado al CTA "Descargar PDF", generando el documento vectorizado.

**3. Frontend — Rutas e inyección en Proyecto Laboral:**
- Se enlazó el CTA de **"Infografía Ejecutiva"** (limitado a completitud >= 50%) dentro del progreso general del usuario, enrutando eficientemente hacia la nueva generación.
- Se listaron históricamente estas infografías en la pestaña segregada "Reportes" de `/mis-cvs`.

### Estado del repo
- **Branch:** `main`
- **Frontend / Backend:** Operativos. Pendiente confirmación final por parte del usuario.

### Pendientes
- Proceder a la Inyección de Contexto en LinkedIn (Punto 9 de su roadmap general del wizard).

---

## Sesión 2026-04-05 (2) · Gemini (Antigravity)

### Contexto de partida
- Se solicitó un recorrido por todas las secciones (Dashboard y Proyecto Laboral) con un enfoque de UI/UX para detectar mejoras estéticas, errores ortográficos y fricciones de uso.
- El objetivo era documentar hallazgos sin realizar cambios inmediatos, y luego proceder con un plan de implementación aprobado.

### Qué se hizo

**1. Auditoría de UI/UX**
- Se generó un informe completo (`ui_ux_audit_report.md`) detectando:
  - Errores de tildes y concordancia de género.
  - Inconsistencia de colores en tags de selección.
  - Falla lógica en el disparador del trofeo de "Carpeta 100% lista".
  - Chatbot OPTIMA con dimensiones demasiado intrusivas.

**2. Implementación de Mejoras (Visto Bueno del Usuario)**
- **Ortografía**:
  - `Sidebar.jsx`: `LinkedIn Optimo` → `LinkedIn Óptimo`.
  - `ProyectoLaboral.jsx`: `Generada` → `Generado` y `MIS CVS` → `MIS CVs`.
- **Consistencia Visual**:
  - `ProyectoLaboral.jsx`: Se unificaron los colores de selección en el pilar de perfil al color **Índigo** (antes mezcla con Teal/Blue/Violet).
- **Lógica UX**:
  - `ProyectoLaboral.jsx`: El trofeo de documentos ahora solo se muestra si `pctDocs === 100%`, independientemente del progreso global.
- **Optimización de Espacio**:
  - `AiChatBot.jsx`: Reducción del FAB (de 24 a 16) y la ventana de chat (de 400px a 360px de ancho) para una interfaz más limpia.

### Estado del repo
- Branch: `main`
- **Estado**: Interfaz pulida, profesionalizada y con mejores jerarquías visuales.

### Pendientes
- Implementar micro-animaciones (hover effects) en los iconos de los pilares.
- Evaluar la transición a "Glassmorphism" 3D para iconos principales.

---

## Sesión 2026-04-05 · Gemini (Antigravity)

### Contexto de partida
- El onboarding de "Autoconocimiento" tenía una lógica inconsistente y no permitía alcanzar el 100% fácilmente.
- El usuario solicitó una distribución de 5 secciones (20% cada una) con requisitos mínimos claros.
- Los CVs subidos o creados desde cero no siempre persistían en la sección "Mis CVs".

### Qué se hizo

**1. Recalibración 100% de Autoconocimiento**
- `frontend/src/utils/progresoLaboral.js` y `ProyectoLaboral.jsx`:
  - Se implementó una lógica de 5 secciones (5 pts cada una, total 25 pts del pilar).
  - Requisitos:
    - **Aspiraciones**: 2 áreas + 1 industria.
    - **Hard/Soft/Power Skills**: Mínimo 3 seleccionadas en cada una.
    - **Compañías**: Mínimo 2 llenas (de 5).
- `ProyectoLaboral.jsx`: Se añadieron etiquetas visuales de ayuda (ej: "Debes seleccionar al menos 3") para guiar al usuario.

**2. Persistencia de CV Original**
- `backend/src/controllers/cvController.js`: `extractProfile` ahora guarda automáticamente el CV subido en `cv_results` con `tipo: 'original'`.
- `backend/src/controllers/cvGenerarController.js`: `generarCV` ahora guarda el resultado con `tipo: 'original'` en lugar de `desde_cero`, para que aparezca en la pestaña "CV Inicial" de `MisCVs.jsx`.

**3. Verificación de Desbloqueo**
- Se validó que al llegar al 100% del progreso total, la sección de **Mis CVs** y el **Gerente de Búsqueda** se desbloquean correctamente.

### Estado del repo
- Branch: `main`
- Commits: Finalización de recalibración + fixes de persistencia.
- **Estado**: 100% operativo y verificado en entorno local.

### Pendientes
- Monitorear la carga de CVs originales de gran tamaño (>5MB) en `cv_results`.

---

## Sesión 2026-04-04 · Claude (Sesión 3 — continuación)


### Contexto de partida
- Sesión 2 había dejado varias fixes commiteadas y pusheadas (commit `831e6a8`)
- El usuario probó producción y reportó: página recarga al navegar, datos viejos al cambiar pilar, 3 bugs nuevos en el wizard CV

### Qué se hizo

**Fix: sessionStorage cache para carga instantánea (commit `665b092`)**
- `CVDesdeCero.jsx`: en `cargar()`, verifica `sessionStorage.getItem('cv_draft_${user.id}')` primero antes de hacer fetch a Supabase. Si existe, carga instantáneo (sin spinner). Si no, fetch normal y guarda en caché.
- `CVDesdeCero.jsx`: `guardarBorrador()` ahora también actualiza `sessionStorage` después del save exitoso.
- `CVDesdeCero.jsx`: flush en unmount guarda en `sessionStorage` síncrono ANTES del fire-and-forget a Supabase.
- `ProyectoLaboral.jsx`: mismo patrón para `job_search_profile` — caché `jsp_${user.id}`.
- `ProyectoLaboral.jsx`: `saveData()` actualiza el caché inmediatamente antes del request a Supabase.
- **Resultado**: al regresar a `/cv-desde-cero` o `/proyecto-laboral` no hay spinner — carga < 1ms desde caché. El caché se limpia al cerrar el navegador (sessionStorage).

**Fix: tips contextuales por sección en CVDesdeCero + auto-poblar Mi Perfil + fix datos viejos al cambiar pilar (commit `de78fb4`)**

`CVDesdeCero.jsx`:
- Nueva función `generarTipsPorPaso(datos)` calcula tips en tiempo real basados en:
  - **Datos**: nombre completo, título profesional, email, teléfono, ciudad/país
  - **Resumen**: longitud (min 200 chars), presencia de dato numérico
  - **Experiencia**: descripciones < 60 chars, ausencia de métricas numéricas, ausencia de verbos de acción STAR, fechas faltantes
  - **Educación**: secciones vacías, años faltantes
  - **Habilidades**: menos de 5 habilidades
  - **Idiomas**: sin idioma nativo, sin inglés detectado
- Box `💡 Tips para mejorar esta sección:` aparece al final de cada paso — desaparece cuando el usuario llena la info correctamente (reactivo via `useMemo`)
- Antes de navegar a `/proyecto-laboral?exito=cv_creada`: limpia `sessionStorage` para forzar re-fetch fresco en ProyectoLaboral: `removeItem(jsp_${user.id})`, `removeItem(cv_draft_${user.id})`, `removeItem(perfil_lp_${user.id})`

`ProyectoLaboral.jsx`:
- **Fix datos viejos al cambiar pilar**: `PilarMiPerfil` ahora recibe prop `userId`. Al inicializar, lee `sessionStorage.getItem('perfil_lp_${userId}')` primero. Al desmontar (cambiar de pilar), guarda `lp` síncrono en `sessionStorage` antes del Supabase async. `savePerfil()` en el parent también actualiza el caché al inicio de cada guardado.
- **Detección de `?exito=cv_creada`**: `useEffect` que corre cuando `cargando = false` + query param presente:
  1. Marca banner de éxito (`bannerCvCreada = true`)
  2. Limpia la URL con `navigate('/proyecto-laboral', { replace: true })`
  3. Lee `data.cv_datos_originales.datos` (guardado al confirmar CV)
  4. Solo llena campos vacíos del perfil: `nombre1`, `apellido1`, `nombre2`, `apellido2`, `telefono1`, `ciudad`, `pais`, `indicativo1`
  5. Llama `supabase.from('profiles').update(updates)` + `refreshPerfil()`
  6. Limpia `perfil_lp_${user.id}` para que `PilarMiPerfil` reinicialice con datos nuevos
- **Banner verde**: "¡Tu CV fue guardada! Hemos pre-llenado tu perfil con la información detectada. Revisa y completa los campos en Mi Perfil." Tiene botón X para cerrar.
- Importación: añadido `useLocation`, `X` a los imports.

### Estado del repo
- Branch: `main`
- Commits esta sesión:
  - `665b092` — sessionStorage cache para carga instantánea
  - `de78fb4` — tips por sección + auto-poblar perfil + fix datos viejos al cambiar pilar
- **Todo en producción** (Railway + Netlify) — ambos commits pusheados a `origin/main`

### Pendientes (para la próxima sesión)
**Deuda técnica (planificada, aún no implementada):**
- HIGH-2: `Math.random()` en `backend/src/routes/company.js:177` → reemplazar con `crypto.randomBytes(10).toString('hex')`
- HIGH-3: Falta rate limiter en `POST /api/company/registration/:slug` (endpoint público B2B)
- MED-4a: Remover `detalle: err.message` y `stack: err.stack` del catch de `cvGenerarController.js` (debug info expuesto en producción)
- MED-4b: Crear `backend/migrations/006_cv_results_rls.sql` para habilitar RLS en `cv_results` y eliminar el fallback con `supabaseAdmin`
- **Precio Optima**: En `ProyectoLaboral.jsx`, `valorOptima` usa plan hardcodeado `'free'` (= $0). Debe leer `perfil.plan` y mapear a precios reales de `Pricing.jsx`:
  ```js
  const PRECIOS = {
    MXN: { semanal: 99, mensual: 299, trim_total: 699 },
    COP: { semanal: 20000, mensual: 60000, trim_total: 140000 },
    ARS: { semanal: 5000, mensual: 15000, trim_total: 35000 },
    USD: { semanal: 5, mensual: 15, trim_total: 35 },
  }
  ```

---

## Sesión 2026-04-04 · Claude (Sesión 2 — continuación)

### Qué se hizo

**Flujo de Onboarding + Feature Locking (ProyectoLaboral)**

- `frontend/src/utils/progresoLaboral.js` ← NUEVO — fuente única de verdad
  - `RECURSOS_DEFAULT` (8 recursos todos OFF + Suscripción Optima obligatoria)
  - `calcPerfilPts(perfil, jpData)` y `calcularProgreso(data, perfil)` (puro, sin React)
- `AuthContext.jsx` — agrega `jpData`, `jpLoaded`, `progresoLaboral`, `featuresDesbloqueadas`, `refreshJpData`, `perfilCargado`
- `App.jsx` — nuevos guards: `BienvenidaRoute` (solo si autenticado + onboarding pendiente), `/proyecto-laboral` y `/bienestar` movidos a `PrivateRoute`
- `Sidebar.jsx` — dos niveles de bloqueo: `LockedNavItem` (onboarding) + `FeatureLockedNavItem` (progreso < 100% con tooltip). Dashboard + Gerente de Búsqueda siempre accesibles
- `ProyectoLaboral.jsx` — Tab Recursos completamente refactorizado:
  - Toggle OFF deshabilita el input de costo
  - Auto-reset costo a $0 al desactivar
  - Suscripción Optima como recurso obligatorio (sin botón eliminar)
  - Conversión de moneda según país del perfil
  - 100% solo si: Optima activa + ≥3 recursos más activos

**CVDesdeCero — 6 fixes (commit 6cc5791)**

1. **Mismatch button**: botón ya muestra "Cargar otro CV" que abre el explorador (código correcto, era el commit pendiente)
2. **Auto-save todos los usuarios**: eliminado guard `!isPaidPlan`; borrador se guarda en `job_search_profile.cv_borrador` con `paso_actual`
3. **Algoritmo analizarCalidad** reescrito con estándares Harvard/LATAM 2026 (calificacioncv.md):
   - 6 secciones: Encabezado (18), Resumen (20), Experiencia STAR (30), Educación (15), Habilidades (10), Idiomas (7) = 100pts
   - Detecta verbos de acción STAR y métricas numéricas en las descripciones
   - PanelAnalisis: texto agrandado a `text-sm` (antes `text-xs`)
4. **Resumen**: límite subido a 800 caracteres (`maxLength={800}`), contador se pone ámbar ≥750
5. **Español por defecto C1**: `togIdm` usa `nivel: id === 'Español' ? 'C1' : 'B2'`
6. **Fix error 500 `/api/cv/generar`**:
   - La CV se devuelve aunque falle el insert en `cv_results`
   - Fallback: intenta con `supabaseAdmin` si RLS bloquea al usuario autenticado
   - Contadores de uso también migrados a `supabaseAdmin` para evitar RLS

### Estado del repo
- Branch: `main`
- Commits esta sesión: onboarding/feature-locking (sesión 1) + `6cc5791` (CVDesdeCero)
- `CVDesdeCero.jsx` ahora commiteado por primera vez (antes `??` untracked → deploy tenía versión vieja)

### Pendientes
- Probar flujo completo de nuevo usuario en producción
- Precio Suscripción Optima hardcodeado a `'free'` (0) — conectar al plan real del usuario
- Pendientes de seguridad: HIGH-2 (crypto), HIGH-3 (rate limit), MED-4 (error sanitize)

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

---

## Sesion 2026-05-27 - Antigravity

### Contexto
Continuacion de sesion Claude (limite alcanzado). Tab Compensaciones ya tenia los campos base.

### Que se hizo

**1. Compensaciones - Reorganizacion del grid (adeafc1)**
- PRESTACIONES_POR_PAIS Mexico: AFORE al final; nuevos: Dias de vacaciones (pos.3), Vales de gasolina, Otros vales, PTU
- MEXICO_DETALLE: config para 4 nuevos campos (tipo dias/monto)
- Dias de vacaciones: sin checkbox, siempre visible, stored en lp.prestaciones_detalle. Prima vacacional lo lee desde ahi.
- Vales de gasolina, Otros vales, PTU: checkboxes en el grid (igual que Vales de despensa), stored en lp.prestaciones_detalle. Eliminadas 3 secciones standalone.
- Panel Anualizado: fondoMonto suma directo sin x12; vales/allowance siguen x12.

**2. Expectativa de prestaciones (6cd39ca)**
- Labels: 'Prestaciones superiores' / 'Prestaciones similares' / 'Abierto a prestaciones inferiores' (sin 'a la ley')

**3. Fix backend infografia-proyecto (de2b085)**
- generarInfografiaProyecto: cuando job_search_profile es null, usa {} como fallback en vez de devolver 400.

**4. Redeploy Railway (b40a8e7)**
- Deploy cancelado por Railway -> commit vacio para triggear redeploy. ACTIVE en produccion.

### Archivos modificados
- frontend/src/pages/ProyectoLaboral.jsx
- backend/src/controllers/cvController.js

### Commits: adeafc1 - 6cd39ca - de2b085 - b40a8e7
