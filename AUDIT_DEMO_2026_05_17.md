# AUDITORÍA COMPLETA ELVIA® — Pre-Demo
**Fecha:** 2026-05-17 | **Auditor:** Claude Code
**Contexto:** 2 días para demo universidad (Mar 19) · 3 días para pitch Telefónica (Mié 20)

---

## RESUMEN EJECUTIVO

| Criticidad | Bugs encontrados | Para mañana |
|-----------|-----------------|-------------|
| 🔴 CRÍTICOS (bloqueadores demo) | 3 | Todos |
| 🟠 ALTOS (visibles, afectan impresión) | 5 | Todos |
| 🟡 DISEÑO / TEXTO (cosméticos) | 6 | Selectivos |
| 🔵 TÉCNICOS / POST-DEMO | 4 | No |

**Total: 18 issues documentados.**

---

## 🔴 CRÍTICOS — SOLUCIONAR MAÑANA SÍ O SÍ

### BUG-001 — Panel HR vacío para super_admin (BLOCKER DEMO)

**Descripción:** Si `alejo.paz0982@gmail.com` tiene registro en la tabla `administrators` (super_admin B2C) Y también en `profiles` con `role='company_admin'`, el middleware `requireRole` detecta PRIMERO el super_admin y setea `req.companyId = null`. Todos los endpoints que filtran `.eq('company_id', req.companyId)` reciben `null` → Supabase devuelve vacío. El panel HR mostrará 0 personas, 0 métricas, 0 allowlist.

**Archivos:**
- `backend/src/middleware/requireAdmin.js:24-26` — chequea `administrators` primero
- `backend/src/middleware/requireAdmin.js:49` — `req.companyId = null` si es super_admin

**Reproducción:** Entrar a `/empresas/telefonica/hr` con `alejo.paz0982@gmail.com` → Panel HR con todo en 0.

**Fix mañana:** En `requireAdmin.js`, si es super_admin y hay `company_id` en su profile, usar ese `companyId` para las rutas de company_admin. O: verificar en Supabase Studio que `alejo.paz0982@gmail.com` esté SOLO en `profiles` con `role='company_admin'` y NO en `administrators` como super_admin. El super_admin para el demo puede ser otra cuenta separada.

**SQL de verificación:**
```sql
SELECT id, role FROM administrators WHERE email = 'alejo.paz0982@gmail.com';
SELECT id, role, company_id FROM profiles WHERE email_principal = 'alejo.paz0982@gmail.com';
```

---

### BUG-002 — Funnel del dashboard siempre muestra 0 en CVs, Matches y Empleados

**Descripción:** El endpoint `GET /api/company/users` solo retorna `id, email_principal, nombre1, apellido1, role, plan, suspended, usage_count`. NO retorna `cv_optimizer_count`, `cv_match_count`, `hired_at`, `hired_company`.

El `CompanyAdmin.jsx` (líneas 543–551) calcula:
- `conCV = users.filter(u => (u.cv_optimizer_count || 0) > 0).length` → **siempre 0**
- `conMatch = users.filter(u => (u.cv_match_count || 0) > 0).length` → **siempre 0**
- `empleados = users.filter(u => u.hired_at).length` → **siempre 0**
- `empleadosList` → **siempre vacío** (la sección "Outcomes del programa" no aparece)

En la demo de Telefónica con 5 usuarios "fully unlocked" (carmen, david, pablo = hired), esto debería mostrar 3 empleados contratados. En cambio mostrará cero. **Muy visible en la demo.**

**Archivo:** `backend/src/routes/company.js:362-376`

**Fix mañana:** Agregar los campos faltantes al SELECT:
```js
.select('id, email_principal, nombre1, apellido1, role, plan, suspended, usage_count, cv_optimizer_count, cv_match_count, hired_at, hired_company')
```

---

### BUG-003 — URL de invitación apunta a ruta inexistente `/admin-login`

**Descripción:** Cuando HR invita a un colaborador, el email contiene el link:
`${FRONTEND_URL}/admin-login?invite=...&slug=telefonica`

La ruta `/admin-login` NO EXISTE en el frontend. El catch-all (`path="*"`) redirige a `/` que muestra `LandingMuyPronto` (la página de "Próximamente").

**Archivo:** `backend/src/routes/company.js:604`

**Fix mañana:** Cambiar la URL a la ruta de registro del candidato:
```js
const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/empresas/${company.slug}/registro`
```
(Nota: el sistema de invitación actual no valida tokens, es solo informativo. La URL correcta es el formulario de registro.)

---

## 🟠 ALTOS — SOLUCIONAR MAÑANA

### BUG-004 — Endpoint `dashboard` usa `cv_optimizer_count` pero profiles pueden tenerla en 0

**Descripción:** El endpoint `GET /api/company/dashboard` (línea 744) sí consulta `cv_optimizer_count` y `cv_match_count` de profiles para calcular `cvOptimizerUse`. Este valor llega al KPI "CVs generados" en CompanyAdmin.

El bug: si el seed cargó los profiles de los 10 demos sin actualizar esos contadores (el seed los crea directamente en Supabase sin pasar por la API que los incrementa), los valores serán 0 en la DB. El KPI "CVs generados" también aparecerá como 0.

**Verificación rápida en Supabase Studio:**
```sql
SELECT email_principal, cv_optimizer_count, cv_match_count, usage_count, hired_at
FROM profiles WHERE cohort = 'telefonica-2026-05';
```

**Fix mañana (si los counters están en 0):** Actualizar manualmente los counters de los demos "fully unlocked" para que el dashboard muestre datos reales:
```sql
UPDATE profiles SET
  cv_optimizer_count = 3, cv_match_count = 5, usage_count = 47,
  hired_at = '2026-04-15', hired_company = 'Vodafone España'
WHERE email_principal = 'carmen.iglesias@elvia.demo';

UPDATE profiles SET
  cv_optimizer_count = 4, cv_match_count = 8, usage_count = 63,
  hired_at = '2026-04-20', hired_company = 'AWS'
WHERE email_principal = 'david.ruiz@elvia.demo';

UPDATE profiles SET
  cv_optimizer_count = 2, cv_match_count = 4, usage_count = 38,
  hired_at = '2026-05-01', hired_company = 'Glovo'
WHERE email_principal = 'pablo.martinez@elvia.demo';

UPDATE profiles SET
  cv_optimizer_count = 2, cv_match_count = 3, usage_count = 22
WHERE email_principal = 'laura.fernandez@elvia.demo';

UPDATE profiles SET
  cv_optimizer_count = 1, cv_match_count = 2, usage_count = 18
WHERE email_principal = 'javier.gomez@elvia.demo';

UPDATE profiles SET
  cv_optimizer_count = 1, cv_match_count = 1, usage_count = 12
WHERE email_principal = 'sofia.lopez@elvia.demo';
```

---

### BUG-005 — Botones "Iniciar sesión" / "Ya tengo cuenta" llevan a `/auth` genérico sin branding

**Descripción:** En `LandingEmpresa.jsx` los botones de header y hero:
- "Iniciar sesión" (línea 116) → navega a `/auth`
- "Ya tengo cuenta" (línea 173) → navega a `/auth`

Cuando el candidato de Telefónica hace click, aterriza en la página de Auth genérica de ELVIA sin logo de Telefónica. Al autenticarse, el TenantContext lo resolverá por `company_id`, pero durante el login ve ELVIA puro. Esto puede generar confusión o parecer poco profesional en un demo.

**Archivo:** `frontend/src/pages/LandingEmpresa.jsx:116-121` y `173-178`

**Workaround para demo:** Asegurarse de que en la demo se use siempre el flujo directo: desde la landing → "Activar mi cuenta" → registro completo → success → login. No tocar el botón "Iniciar sesión" durante la presentación.

**Fix real (baja prioridad):** La página `/auth` podría leer el `last_slug` de sessionStorage y mostrar logo del tenant. O agregar un `?slug=telefonica` en la URL y leerlo en Auth.

---

### BUG-006 — Flash de "Programa no disponible" al cargar LandingEmpresa

**Descripción:** Al entrar a `/empresas/telefonica`, hay un render tick donde:
- `loading = false` (estado inicial del context)
- `tenant.id = null` (DEFAULT_TENANT)
- `slug = 'telefonica'`
→ `noEncontrado = true` → muestra brevemente el error "Programa no disponible"

Luego el useEffect detecta el urlSlug, setea `loading = true`, fetch, y muestra el contenido correcto. Dura ~100-300ms pero es visible si no hay caché.

**Archivo:** `frontend/src/pages/LandingEmpresa.jsx:18` y `frontend/src/context/TenantContext.jsx:75-76`

**Fix rápido:** Inicializar `loading = true` cuando hay un `urlSlug` detectado, o agregar condición extra:
```js
const noEncontrado = !loading && tenant?.id === null && slug && tenant?.slug !== slug
```

---

### BUG-007 — InviteModal etiqueta "Email corporativo" confunde en outplacement

**Descripción:** El modal de invitación individual en CompanyAdmin.jsx (línea 77) muestra:
- Label: `"Email corporativo"`
- Placeholder: `"maria@empresa.com"`

Pero Telefónica usa correos personales para outplacement. Si el HR director de Telefónica ve "Email corporativo", puede dudar si debe poner el correo `@telefonica.es` o el personal del colaborador. La respuesta correcta es el personal, pero el label lo contradice.

**Archivo:** `frontend/src/pages/CompanyAdmin.jsx:77`

**Fix mañana (5 minutos):** Cambiar label a "Email del colaborador" y placeholder a "nombre@gmail.com" o genérico.

---

### BUG-008 — Turnstile importado pero no renderizado en RegistroEmpresa

**Descripción:** `RegistroEmpresa.jsx:8` importa `{ Turnstile } from '@marsidev/react-turnstile'` pero el componente nunca aparece en el JSX. El formulario de registro B2B no tiene protección CAPTCHA.

**Impacto:** Vulnerabilidad de seguridad menor (permite bots registrarse si conocen el slug). Para la demo no afecta el flujo pero si Telefónica pregunta por seguridad del registro, es un punto débil.

**Archivo:** `frontend/src/pages/RegistroEmpresa.jsx:8`

**Workaround demo:** No mencionar esto proactivamente.

---

## 🟡 DISEÑO Y TEXTO — REVISAR SI HAY TIEMPO

### BUG-009 — "LGPD" en panel de RegistroEmpresa es ley brasileña, inapropiado para España

**Descripción:** El panel lateral del formulario de registro (línea 415) muestra hardcodeado:
`"SOC2 Type II en proceso · GDPR · LGPD · Cifrado en tránsito y en reposo · Backups diarios."`

LGPD (Lei Geral de Proteção de Dados) es legislación brasileña. Para Telefónica España aplica GDPR y LOPDGDD (España). Para un pitch a Telefónica (empresa global con base legal española), mencionar LGPD podría generar confusión o parecer un copy-paste genérico.

**Archivo:** `frontend/src/pages/RegistroEmpresa.jsx:415` y `frontend/src/pages/LoginHR.jsx:254`

**Fix rápido:** Cambiar a `"GDPR · CCPA · Cifrado en tránsito y en reposo"` que es más seguro/global.

---

### BUG-010 — Badge de "Invitaciones" en tabs muestra total, no solo pendientes

**Descripción:** El tab "Invitaciones" en CompanyAdmin.jsx (línea 523-530) muestra el badge con `invitations.length` (total de invitaciones). El endpoint devuelve TODAS las invitaciones sin filtro de status. Si hay 5 invitaciones, 3 aceptadas y 2 pendientes, el badge dice "5" cuando debería decir "2".

**Archivo:** `frontend/src/pages/CompanyAdmin.jsx:523-530`

**Fix:** `invitations.filter(i => i.status === 'pending').length`

---

### BUG-011 — Revocar acceso en allowlist sin confirmación de diálogo

**Descripción:** En la tabla de personas (CompanyAdmin, Personas tab), el botón "Revocar" ejecuta la acción directamente sin pedir confirmación. Un click accidental durante la demo podría revocar el acceso a un colaborador en vivo.

**Archivo:** `frontend/src/pages/CompanyAdmin.jsx:889-895`

**Fix rápido:** Agregar `window.confirm()` antes de la llamada.

---

### BUG-012 — CSS duplicado en header de CompanyAdmin

**Descripción:** `className="bg-white border-b border-gray-100 sticky top-0 z-30 backdrop-blur-xl bg-white/90"`
Tiene `bg-white` y `bg-white/90`. Tailwind solo aplica el segundo, el primero es ignorado. No visual issue pero es código sucio.

**Archivo:** `frontend/src/pages/CompanyAdmin.jsx:463`

---

### BUG-013 — TenantContext puede mostrar ELVIA branding en /bienvenida para B2B users (race condition)

**Descripción:** Cuando un candidato B2B (fresh user) hace login y va a `/bienvenida`, el TenantContext usa Prioridad 2 (usuario autenticado con `company_id`). Pero si `perfil` aún no cargó (AuthContext también es async), TenantContext cae al DEFAULT_TENANT (ELVIA B2C). El candidato ve logo de ELVIA por 1-2 segundos antes de que aparezca Telefónica.

No es crítico porque eventualmente carga, pero en un demo puede ser notable.

**Archivo:** `frontend/src/context/TenantContext.jsx:122-155`

---

### BUG-014 — `ProyectoLaboral` inyecta Google Fonts en runtime (posible fallo de CSP)

**Descripción:** `ProyectoLaboral.jsx:22-29` inyecta dinámicamente un `<link>` a `fonts.googleapis.com`. Si la CSP del Netlify no permite `style-src fonts.googleapis.com` y `font-src fonts.gstatic.com`, la fuente Plus Jakarta Sans no carga y el Gerente de Búsqueda se ve con font genérica.

Verificar que el `netlify.toml` tenga esas fuentes en la CSP.

---

## 🔵 TÉCNICO / POST-DEMO

### BUG-015 — `POST /api/company/costs/export` es simulado (TODO sin implementar)

**Archivo:** `backend/src/routes/company.js:836-840`
El endpoint de exportar costos tiene un `// TODO` donde debería enviar el email. Retorna `ok: true` pero no envía nada. No está expuesto en el UI actual de CompanyAdmin, así que no afecta el demo.

### BUG-016 — `GET /api/company/costs` usa tablas `company_plans` y `mentor_packages` no verificadas

Si estas tablas no existen en la DB, el endpoint devuelve 500. No está expuesto en el UI del demo actual, pero si se prueba puede tirar error.

### BUG-017 — `POST /api/company/users` crea user sin confirmar email (email_confirm: false)

**Archivo:** `backend/src/routes/company.js:398`
El endpoint de crear usuario desde el panel (no el de registro público) crea el usuario sin confirmar el email. A diferencia del registro público B2B (`email_confirm: true`). El usuario no podría loguearse hasta confirmar. Este endpoint no está expuesto en CompanyAdmin UI actualmente.

### BUG-018 — Validación de identidad de CV muy estricta (ya documentado en BACKEND_FIXES_REQUIRED.md)

Ver BACKEND_FIXES_REQUIRED.md bug #10. Candidato con nombre "Carmen Iglesias" pero CV guardado como "María Carmen" podría ser rechazado falsamente.

---

## FLUJOS PROBADOS POR CÓDIGO (sin ejecutar browser)

| Flujo | Estado | Notas |
|-------|--------|-------|
| `/empresas/telefonica` — Landing | ⚠️ | Flash breve de error (BUG-006), luego OK |
| `/empresas/telefonica/registro` — Signup | ✅ | Funciona. Turnstile ausente (BUG-008) |
| `/empresas/telefonica/hr` — LoginHR | ⚠️ | Funciona SI no eres super_admin (BUG-001) |
| `/empresa-admin` — Panel HR Resumen | 🔴 | Funnel muestra 0s (BUG-002, BUG-004) |
| `/empresa-admin` Personas tab | ⚠️ | Allowlist carga OK, revocar sin confirm (BUG-011) |
| `/empresa-admin` Invitaciones tab | ⚠️ | Funciona, badge malo (BUG-010), URL email 404 (BUG-003) |
| `/empresa-admin` Configuración tab | ✅ | Muestra info estática OK |
| `/bienvenida` — Onboarding B2B | ⚠️ | Puede mostrar ELVIA branding 1-2s (BUG-013) |
| `/proyecto-laboral` — Gerente de Búsqueda | ✅ | No tocado en este sprint, debería OK |
| `/dashboard` — Dashboard candidato | ⚠️ | Contadores pueden estar en 0 (BUG-004) |

---

## PLAN DE ATAQUE — MAÑANA LUNES 18 MAYO

### Sesión AM (2h máx) — CRÍTICOS + ALTOS

**Orden de ejecución:**

1. **[15 min] Verificar y fix BUG-001**
   - Correr SQL de verificación en Supabase Studio
   - Si alejo está en `administrators`: decidir si se elimina el registro o si se modifica el middleware para que cuando sea super_admin use su `company_id` del profile
   - **Opción segura para demo**: Crear cuenta separada `hr.telefonica@elvia.demo` como company_admin puro, sin registro en `administrators`

2. **[20 min] Fix BUG-002** — Agregar campos faltantes al SELECT de `/api/company/users`
   ```js
   .select('id, email_principal, nombre1, apellido1, role, plan, suspended, usage_count, cv_optimizer_count, cv_match_count, hired_at, hired_company')
   ```

3. **[10 min] Fix BUG-004** — Actualizar contadores de los demo profiles con SQL (ver arriba)

4. **[10 min] Fix BUG-003** — Corregir URL de invitación en company.js

5. **[10 min] Fix BUG-007** — Cambiar label "Email corporativo" → "Email del colaborador"

6. **[15 min] Fix BUG-009** — Cambiar "LGPD" → "CCPA" en textos de compliance

7. **[10 min] Fix BUG-010** — Filtrar invitaciones pendientes en badge

8. **[5 min] Fix BUG-011** — Agregar confirm antes de revocar

9. **[15 min] Test manual completo del flujo HR demo**
   - Login como HR → ver panel con datos reales → invitar uno → cargar CSV → revisar funnel

### Sesión PM — BOT HR-AWARE (objetivo del domingo que quedó pendiente)
   - Según memoria, esto estaba programado para hoy dom 17 pero quedó pendiente
   - Si hay tiempo después de los fixes, iniciar el bot HR con contexto del dashboard

---

## CREDENCIALES DE DEMO (ya verificadas en código/seed)

| Cuenta | Password | Estado | Uso en demo |
|--------|----------|--------|-------------|
| `andrea.santos@elvia.demo` | `DemoElvia2026!` | FRESH | Mostrar onboarding desde cero |
| `sofia.lopez@elvia.demo` | `DemoElvia2026!` | IN_PROGRESS | Mostrar progreso parcial |
| `david.ruiz@elvia.demo` | `DemoElvia2026!` | FULLY UNLOCKED | Mostrar todas las features |
| `carmen.iglesias@elvia.demo` | `DemoElvia2026!` | HIRED (Vodafone) | Outcomes |
| `alejo.paz0982@gmail.com` | (tu contraseña real) | COMPANY_ADMIN | Panel HR |

**URLs críticas para el demo:**
- Landing Telefónica: `/empresas/telefonica`
- Registro candidato: `/empresas/telefonica/registro`
- Login HR: `/empresas/telefonica/hr`
- Panel HR: `/empresa-admin`

---

## HALLAZGOS ADICIONALES — TESTING EN VIVO (Browser) — 17 Mayo

> Testing realizado con `npx agent-browser` contra producción (Netlify + Railway + Supabase).
> Usuario: `david.ruiz@elvia.demo` (FULLY UNLOCKED) y `andrea.santos@elvia.demo` (FRESH).

---

### BUG-NEW-05 🔴 CRÍTICO — Race condition: RUTAS_GATED redirigen a /proyecto-laboral

**Síntoma:** Navegación directa por URL a `/dashboard`, `/pipeline`, `/biblioteca`, `/cv-vs-job`, `/jobs`, `/mis-vacantes`, `/entrevista` redirige siempre a `/proyecto-laboral`, incluso con usuario fully-unlocked. Lo mismo ocurre al hacer click en el sidebar antes de que cargue `jpData`.

**Causa raíz (`AuthContext.jsx` líneas 90-102):**
```js
// getSession().then() — fire-and-forget sin await:
fetchPerfil(session.user.id, session.user.email)  // async, NO awaited
fetchJpData(session.user.id)                       // async, NO awaited
setLoading(false)  // ← se dispara ANTES de que terminen los fetches
```
Cuando `OnboardingGuard` evalúa con `loading=false` pero `jpLoaded=false`, el useMemo de `progresoLaboral` retorna 0 → `featuresDesbloqueadas=false` → redirect.

**Archivos afectados:**
- `frontend/src/context/AuthContext.jsx` — `setLoading(false)` prematuro
- `frontend/src/App.jsx` — `OnboardingGuard` no espera `jpLoaded`/`perfilCargado`
- `frontend/src/pages/ProyectoLaboral.jsx` — no llama `refreshJpData()` al cargar datos, AuthContext queda stale

**Fix requerido:**
1. `App.jsx` OnboardingGuard línea 98: cambiar `if (loading) return null` → `if (loading || !jpLoaded || !perfilCargado) return null`
2. `ProyectoLaboral.jsx`: añadir `refreshJpData()` después de cargar `job_search_profile` de Supabase (para sincronizar AuthContext cuando el usuario ya tiene datos completos)

**Impacto en demo:** BLOQUEANTE. Cualquier navegación directa a herramienta falla. El flujo de demo de david.ruiz funciona SÓLO si se navega desde /proyecto-laboral vía sidebar sin recargar. Un F5 en cualquier herramienta rompe el demo.

---

### BUG-NEW-07 🟠 ALTO — Fresh users (andrea.santos) bypassean /bienvenida

**Síntoma:** `andrea.santos@elvia.demo` (nombre1=null, onboarding pendiente) debería redirigir a `/bienvenida` en el login. En cambio aterriza en `/proyecto-laboral`.

**Causa raíz:** Misma race condition que BUG-NEW-05. `BienvenidaRoute` depende de `onboardingPendiente` que depende de `perfilCargado`. Cuando `perfilCargado=false` (fetch aún en vuelo), `onboardingPendiente = !loading && perfilCargado && !!user && (!perfil || !perfil.nombre1)` → false, entonces `PublicRoute` redirige a `/dashboard` → `OnboardingGuard` redirige a `/proyecto-laboral`.

**Fix:** Mismo que BUG-NEW-05 — esperar `perfilCargado` en los guards.

**Impacto en demo:** El flujo de demo "fresh user entra y hace onboarding" está roto. No se puede mostrar el flujo de bienvenida.

---

### BUG-NEW-06 🔴 ALTO — Bienestar page crash (React Error Boundary)

**Síntoma:** Navegación a `/bienestar` activa el `ErrorBoundary` global. La página no carga, muestra el componente de error genérico.

**Causa raíz:** No determinada (requiere inspección de `Bienestar.jsx` y consola de browser). Posible error en render de componente — variable undefined en JSX, o API call con respuesta inesperada.

**Archivo afectado:** `frontend/src/pages/Bienestar.jsx`

**Fix requerido:** Inspeccionar Bienestar.jsx. Buscar posibles `undefined.property` en el render, errores en efectos, o import faltante.

**Impacto en demo:** Bienestar no es parte del flujo principal del demo Telefónica, pero si se menciona la plataforma como "integral" y el cliente navega, verá un crash.

---

### BUG-NEW-04 🟡 MEDIO — Vacantes: 0 resultados para búsquedas en España

**Síntoma:** Buscar "Gerente de Recursos Humanos" + "España" devuelve "No se encontraron vacantes". El endpoint `/api/jobs/similar` requiere token; sin él retorna `{"error":"Token no proporcionado"}`. Con token: 0 resultados para locación "España".

**Posible causa:** La API de Jooble puede tener cobertura limitada para España, o el campo `location` no acepta el país completo (requiere ciudad). El filtrado con DeepSeek puede ser demasiado estricto.

**Impacto en demo:** El demo es para Telefónica España. Si el cliente busca vacantes en España y no aparece nada, la feature pierde credibilidad. Considerar usar "Madrid" como ciudad demo, o pre-verificar qué locaciones devuelven resultados.

**Workaround para demo:** Probar con "Madrid" o "Barcelona" como locación, y con un cargo más genérico como "Gerente comercial".

---

### RESUMEN DE BUGS BROWSER (adicionales a los 18 estáticos)

| ID | Severidad | Descripción | Fix estimado |
|----|-----------|-------------|--------------|
| BUG-NEW-05 | 🔴 CRÍTICO | Race condition: RUTAS_GATED redirigen antes de jpLoaded | 20 min |
| BUG-NEW-07 | 🟠 ALTO | Fresh users bypassean /bienvenida por misma race | 5 min (mismo fix) |
| BUG-NEW-06 | 🔴 ALTO | Bienestar crash (ErrorBoundary) | 15-30 min (investigar) |
| BUG-NEW-04 | 🟡 MEDIO | Vacantes España = 0 resultados | Workaround (cambiar locación demo) |

---

### PLAN DE ATAQUE ACTUALIZADO (orden por impacto en demo)

**PRIORIDAD 1 — Fix inmediato (hoy, < 1 hora total)**

1. **[20 min] Fix BUG-NEW-05 + BUG-NEW-07** (un solo cambio en 2 archivos):
   - `App.jsx` OnboardingGuard: `if (loading || !jpLoaded || !perfilCargado) return null`
   - `ProyectoLaboral.jsx`: llamar `refreshJpData()` al finalizar carga inicial de datos
   - Verificar en browser que david.ruiz llega a /dashboard con F5, y andrea.santos va a /bienvenida

2. **[20 min] Fix BUG-NEW-06**: Inspeccionar y reparar Bienestar.jsx

3. **[10 min] Workaround BUG-NEW-04**: Documentar query de demo para Vacantes (Madrid/Barcelona)

---

*Documento actualizado con resultados de browser testing en vivo el 2026-05-17.*
*Bugs BUG-001 a BUG-018: auditoría estática. BUG-NEW-04 a BUG-NEW-07: browser testing.*
