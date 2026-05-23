# Auditoría de Arquitectura — ELVIA B2B Multi-Tenant
**Fecha:** 2026-05-18 (lunes 21:33 hora CDMX)
**Contexto:** Demo Tec de Monterrey **mañana martes 19/05**, demo Telefónica miércoles 20/05.
**Metodología:** 3 agentes en paralelo (arquitectura, seguridad, code-analyzer) leyendo backend, frontend, migrations y deployment.

---

## ⚠️ TL;DR — Decisión

**NO rehagas el proyecto. Refactorizá con disciplina en 3-4 semanas.**

El stack (React+Vite / Express+Node / Supabase / Claude+Gemini) es el correcto para B2B universitario en 2026. El problema no es la tecnología — es la **operación** (rate-limit per-tenant inexistente, RLS incompleto, observability sin scrubbing, cero validación con schema).

**PERO:** hay un bug crítico de seguridad que debe arreglarse **antes del demo del martes con Tec de Monterrey**.

---

## 🔥 Acción urgente — Antes del demo del martes

### 1. Habilitar RLS en `cv_results` (10 minutos — bloqueante)

La tabla `cv_results` guarda el texto completo de cada CV con PII (nombre, email, teléfono, historial). **Ninguna migración la protege con RLS.** La anon key del frontend puede leerla saltándose tu backend → violación LFPDPPP + posible FERPA si el Tec audita.

**Correr en Supabase Studio → SQL Editor:**

```sql
-- Migration 010: Enable RLS on cv_results (CRITICAL multi-tenant fix)

ALTER TABLE cv_results ENABLE ROW LEVEL SECURITY;

-- Política: el dueño del CV ve solo lo suyo
DROP POLICY IF EXISTS "user_own_cv_results" ON cv_results;
CREATE POLICY "user_own_cv_results" ON cv_results
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Verificación: loguearse como user A en /auth y consultar cv_results de user B
-- desde Supabase Studio con su JWT → debe devolver 0 filas.
```

**Después del fix, validar manualmente:**
1. Login como `andrea.santos@elvia.demo`
2. Abrir DevTools → Network, copiar el JWT (cookie `sb-*-auth-token`)
3. En Supabase Studio → SQL Editor, hacer `SELECT * FROM cv_results WHERE user_id != auth.uid() LIMIT 5;` con ese JWT — debe devolver 0 filas.

### 2. Sentry scrubbing PII (20 minutos)

Sentry está capturando errores con el texto completo del CV en scope. Si un error pasa durante `optimize` o `extractProfile`, fragmentos del CV llegan a Sentry como third-party processor sin DPA. Tec puede pedir esto en compliance review.

**`frontend/src/main.jsx`** (alrededor de la línea 21):

```js
Sentry.init({
  // ...config existente...
  beforeSend(event, hint) {
    // Scrub potential PII from extra/request data
    if (event.extra) delete event.extra;
    if (event.request?.data) delete event.request.data;
    if (event.user) {
      event.user = { id: event.user.id }; // solo id, sin email
    }
    return event;
  },
});
```

**`backend/src/app.js`** (donde está `Sentry.captureException`):

```js
Sentry.init({
  // ...config existente...
  beforeSend(event) {
    if (event.extra) delete event.extra;
    if (event.request?.data) delete event.request.data;
    return event;
  },
});
```

### 3. Auditoría manual rápida de `routes/company.js` (1 hora — antes del demo)

Este archivo usa `SUPABASE_SERVICE_ROLE_KEY` para TODAS las queries (línea 32) → RLS bypassed. La isolation depende solo de que cada endpoint compruebe `req.companyId === resource.company_id`.

**Buscar en `backend/src/routes/company.js`:**
- Cada `db.from('...').select(...)` que no termine en `.eq('company_id', req.companyId)` o equivalente.
- Especial atención a endpoints que reciben `userId`, `cvId`, `applicationId` por parámetro de URL.

El commit `7dff497` ya parchó un caso. Eso significa que el patrón está mal de origen, no que ya está bien.

### 4. NO arreglar antes del demo (postponer 1-2 semanas)

- `dailyCap` global → per-tenant (requiere modificar RPC de Postgres).
- Repository pattern y router de IA (cambio estructural).
- Borrado de código muerto, consolidación de migrations.

---

## 📊 Veredicto del stack

**Viable como MVP, NO production-grade para 5+ universidades.**

| Capa | Aguanta hasta | Rompe cuando… |
|------|---------------|---------------|
| Railway 1 instancia (`railway.json`), sin clustering | ~200 usuarios concurrentes | 500 alumnos optimizando CV un lunes 10am → cola en event loop (Claude tarda 6-15s y bloquea) |
| Supabase RLS con subqueries correlacionadas en `profiles` (`004_b2b_tables.sql:167`) | 10K perfiles | 100K+ perfiles + joins en dashboards HR → policies se evalúan por fila → varios segundos |
| Bundle frontend (4 librerías PDF: pdf-lib + html2pdf + jspdf + html2canvas) | LCP ~3s con red lenta | Red de campus universitario lenta → first paint malo |
| `dailyCap` GLOBAL (`backend/src/middleware/dailyCap.js:16`) | **Ya está roto hoy** | Un alumno de Tec agota el budget de Claude API de Telefónica = DoS económico cross-tenant |

**Qué falla primero:** la operación, no el stack. Stack no necesita cambio; la configuración operacional sí.

---

## 🛡️ Top hallazgos de seguridad (por gravedad)

### 🔴 CRITICAL

| ID | Hallazgo | Archivo:Línea | Impacto |
|----|----------|---------------|---------|
| C-1 | `cv_results` SIN RLS — anon key del frontend puede leer CVs de cualquier tenant | (ninguna migration la protege) | Leak PII LFPDPPP/FERPA. **Bloqueante deal Tec.** |
| C-2 | `dailyCap` global, no per-tenant | `backend/src/middleware/dailyCap.js:16` | Alumno de Tec agota budget Claude de Telefónica |
| C-3 | `routes/company.js` usa `SUPABASE_SERVICE_ROLE_KEY` para TODAS las queries B2B → RLS bypassed en 1,033 líneas | `backend/src/routes/company.js:32` | Isolation depende solo de checks JS manuales. Commit `7dff497` ya parchó un caso = el modelo está mal |
| C-4 | `listUsers({ perPage: 200 })` para resolver email duplicado, falla silenciosa con >200 users | `backend/src/routes/company.js:272` | Bug de escala + posible leak en logs |

### 🟠 HIGH

| ID | Hallazgo | Archivo:Línea | Impacto |
|----|----------|---------------|---------|
| H-1 | `cvGenerarController` hace fallback a `supabaseAdmin` si insert falla — convierte error RLS en bypass silencioso | `backend/src/controllers/cvGenerarController.js:201` | Si RLS está mal configurado, se escribe igual con service_role |
| H-2 | `chatRateLimit` usa `Map` en memoria → se reinicia con cada deploy, no es per-tenant | `backend/src/middleware/chatRateLimit.js:6` | Alumno abusa Claude API entre reinicios |
| H-3 | Sentry sin `beforeSend` scrubbing → CVs completos pueden llegar a Sentry | `frontend/src/main.jsx:21`, `backend/src/app.js:115` | PII en third-party processor sin DPA |
| H-4 | Policy `public_read_company_branding` permite a anon enumerar TODAS las empresas activas con name, contact_email, allowed_email_domain, features | `backend/migrations/007_tenant_branding.sql:65-67` | Competidores pueden enumerar tu lista de clientes |
| H-5 | `rateLimiter.js` saltea rate limit para `isPaidPlan`, pero `planContext` no mapea `plan: 'pro'` (Tec) → mapeo inconsistente puede romperse | `backend/src/middleware/rateLimiter.js:25`, `planContext.js:66` | Cambio futuro en mapeo = B2B salta TODOS los rate limits |

### 🟡 MEDIUM

- `profiles` sin políticas INSERT/UPDATE → usuario puede actualizar su propio `company_id` o `role` vía anon key (`004_b2b_tables.sql`).
- `dailyCap.js:9` — si RPC `increment_daily_cap` lanza error, hace `return next()` → graceful degradation desactiva el cap.
- `auditAdmin.js:18` loguea `admin_email` y `user-agent` completo — si Sentry captura, va a tercero.
- `app.js:50` — CORS permite requests sin `origin` (Postman, curl). No crítico si auth está bien.

---

## 🗂️ Inconsistencias estructurales (vibe-coding evidence)

1. **Dos migrations con número `009`**: `009_company_allowlist.sql` Y `009_seed_tec_monterrey.sql`. Cualquier tracker de migrations las trata como conflicto.
2. **Cinco fuentes de migrations SQL coexistiendo**:
   - `backend/migrations/001..009`
   - `DB_MIGRATION_SQL.sql` (raíz, 319 líneas)
   - `supabase/migrations/20260503_linkedin_analyses.sql`
   - `backend/supabase/migrations/`
   - `scripts/`
3. **Tabla `companies` definida en dos migrations diferentes**:
   - `004_b2b_tables.sql:12` la ALTER (asume existe)
   - `007_tenant_branding.sql:7` la CREATE IF NOT EXISTS con schema mínimo + ALTER
   - Frágil al orden de ejecución.
4. **`claudeService.js:974` re-exporta funciones de DeepSeek desde el módulo Claude**. Los controllers piensan que llaman a Claude y en realidad llaman a DeepSeek.
5. **`geminiService.js` no usa Gemini** — solo hace text-search en Supabase. Nombre engañoso.
6. **`jobsController.js` y `emailController.js` son comentarios de 7 líneas**. La lógica vive en `routes/jobs.js` (404 LOC) y `routes/email.js` (525 LOC). Patrón roto vs `cv`, `chat`, `interview`, `linkedin` que sí separan.
7. **`frontend/src/services/jobService.js` son 5 líneas de TODO**. Mientras tanto **47 lugares en componentes** llaman `supabase.from(` directo — acoplamiento componente↔DB.
8. **`pages/Onboarding.jsx` (1,297 LOC) huérfana** — la página viva es `BienvenidaOnboarding.jsx`. La ruta `/onboarding` redirige a `/bienvenida` en `App.jsx:262`. 1,297 líneas que nadie usa.
9. **`Landing.jsx` (1,507 LOC) + `Landing2.jsx` (1,269 LOC)** post-pivote B2B ya no son la entrada principal (la entrada es `LandingMuyPronto.jsx`). 2,776 líneas legacy B2C en hot path.
10. **Cero validación con schema** — no hay zod/joi/yup/express-validator en `package.json`. Validación a mano con `if (!body.x) return 400`.
11. **156 ocurrencias de `res.status().json()` inline** en routes (`admin.js`, `company.js`, `jobs.js`, `email.js`) vs `try/catch + next(err)` en controllers (`cv`, `chat`, `interview`, `linkedin`).
12. **App.jsx** tiene 3 listas de rutas paralelas (`RUTAS_FULL`, `RUTAS_SIN_GUARD`, `RUTAS_PUBLICAS`, `RUTAS_APP`, `RUTAS_GATED`) que se solapan, más 4 guards (`PublicRoute`, `OnboardingGuard`, `PrivateRoute`, `BienvenidaRoute`) y un "bloqueo nuclear" comentado en `App.jsx:190`. Patrón inventado iteración a iteración.
13. **Patrones de error response distintos**: `{ error }`, `{ error, mensaje }`, `{ error, errorCode }`, `{ error, code }`. Sin envelope unificado, el frontend adivina.
14. **`AuthContext.jsx`** (304 líneas) provee 20+ valores en su `value` → cualquier cambio en `planInfo` re-renderea todo el árbol que use `useAuth()`. Hay 50 páginas.
15. **3 librerías PDF + 4 providers IA** sin abstracción común.

---

## 🗑️ Código muerto / huérfano (borrar después del demo)

- `APP-HR-CVS/{` (0 bytes)
- `APP-HR-CVS/{,-` (0 bytes)
- `APP-HR-CVS/La` (0 bytes)
- Basura de PowerShell con `&&` mal escapado (¡tu CLAUDE.md lo prohíbe!).
- `APP-HR-CVS/test-06a..06e-*.png` (5 screenshots fuera de `scratch/`).
- `frontend/src/pages/Onboarding.jsx` (1,297 LOC, no importado en App.jsx).
- `backend/src/controllers/jobsController.js` y `emailController.js` (placeholders de 7 LOC).
- `backend/add_column.js`, `check-profiles.js`, `check-vectors.js`, `check_leads.js`, `check_schema.js`, `list-models.js`, `test-embed.js`, `test-gemini.js`, `test-raw-gemini.js`, `test_email.js` — scripts sueltos en raíz de backend.
- `DB_MIGRATION_SQL.sql` raíz (redundante con `backend/migrations/`).
- 16 markdowns de "auditoría" en raíz sin índice (`AUDIT_DEMO_2026_05_17.md`, `AUDITORIA_BASE_DATOS.md`, `BACKEND_FIXES_REQUIRED.md`, etc.).
- `frontend/src/pages/Landing.jsx` (1,507 LOC), `Landing2.jsx` (1,269 LOC) — 2,776 líneas legacy.

**Total estimado de código muerto: ~4,500 LOC + 5 archivos basura + 16 markdowns + 5 fuentes paralelas de migrations.**

---

## 📅 Plan de refactor (4 semanas, sin rewrite)

### Semana 1 — Parar la sangría (esta semana, post-demos)

| Día | Tarea | Tiempo |
|-----|-------|--------|
| **Lun 18 (HOY antes del demo)** | Migration 010: RLS en `cv_results` | 10 min |
| **Lun 18** | Sentry `beforeSend` scrubbing (frontend + backend) | 20 min |
| **Mar 19 antes demo Tec** | Audit manual `routes/company.js` por `.eq('company_id', ...)` faltantes | 1 hora |
| **Mié 20 antes demo Telefónica** | RPC `increment_daily_cap` con `p_company_id` + middleware lo pasa | 30 min |
| **Jue 21** | Auditar `profiles` con políticas INSERT/UPDATE faltantes | 30 min |
| **Vie 22** | Borrar archivos basura raíz + scripts sueltos backend | 20 min |

### Semana 2 — Capa de datos

7. **Repository pattern backend**: extraer `db.from('profiles')`, `db.from('companies')`, `db.from('cv_results')`, `db.from('allowlist')` a `backend/src/repositories/*.repository.js`. Forzar que toda escritura pase por ahí + logging de tenant context automático = base del audit log que vas a necesitar para el DPA del Tec.
8. **Cliente HTTP unificado frontend**: empujar los 47 `supabase.from(` directos a `services/` (repository por dominio: `profileRepository`, `cvRepository`, `companyRepository`).

### Semana 3 — Capa de IA + state

9. **Router IA unificado**: `backend/src/services/ai/index.js` con `routeTask({ task, payload, tenant })`. Termina con el hack de `claudeService.js:974` re-exportando DeepSeek.
10. **Split `AuthContext`** (304 LOC, 20 valores) en 3 contexts: `Auth` (sesión), `Profile` (datos usuario), `Plan` (gating). Hoy cada token refresh re-renderea todo.
11. **Renombrar `geminiService.js` → `knowledgeBaseService.js`** (lo que hace en realidad).
12. **Mover lógica de `routes/jobs.js` y `routes/email.js` a controllers** + borrar placeholders.

### Semana 4 — Defender

13. **Zod en boundaries** de las 6 routes más grandes (`/cv/optimize`, `/company/registration`, `/company/allowlist`, `/admin/*`). Empezar por las que reciben JSON complejo.
14. **Playwright E2E** con 5 tests cubriendo:
    - Registro por slug + verificación de allowlist
    - Login HR de empresa A no puede ver datos de empresa B
    - CV optimize con rate limit per-tenant
    - Upload allowlist bulk CSV
    - Mismatch de company_id en token vs URL → 403
15. **Consolidar las 5 fuentes de migrations** en una sola (`backend/migrations/` con numeración estricta) + Supabase CLI o tracker simple.

### Mes 2+ — Si el negocio crece a 10+ tenants

- Separar backend en 2 servicios: `api-user` (CV optimize/match — stateless, escala horizontal en Railway) y `api-admin` (HR dashboard, allowlist, billing — separación de blast radius).
- Cache Redis para queries de RLS pesadas.
- Migrar policies `auth.uid() IN (SELECT...)` a function `SECURITY DEFINER` cacheable.

---

## 🎯 Resumen ejecutivo (para el board)

> "El stack es correcto. El producto está validado con demos reales (Telefónica, Tec). La deuda técnica es localizada: 60% cosmética (basura, código muerto, naming inconsistente) + 40% estructural (capa de datos sin abstracción, sin schema validation, RLS incompleto). Un sprint de seguridad + 3 sprints de refactor en 4 semanas dejan el repo defendible para 5-10 tenants. Rewrite costaría 3 meses y perderíamos a Telefónica."

---

## 📂 Archivos clave revisados

### Backend
- `backend/src/app.js` — entry, Sentry handler
- `backend/src/lib/supabase.js` — cliente service_role vs anon
- `backend/src/routes/company.js` (1,033 LOC) — uso de service_role
- `backend/src/routes/admin.js` (503 LOC)
- `backend/src/routes/jobs.js` (404 LOC, lógica que debería estar en controller)
- `backend/src/routes/email.js` (525 LOC, idem)
- `backend/src/controllers/cvController.js`
- `backend/src/controllers/cvGenerarController.js:201` — fallback service_role
- `backend/src/middleware/auth.js`, `requireAdmin.js`, `planContext.js`, `dailyCap.js`, `chatRateLimit.js`, `rateLimiter.js`, `auditAdmin.js`
- `backend/src/services/claudeService.js:974` — re-export DeepSeek
- `backend/src/services/geminiService.js` — mal nombrado
- `backend/src/services/deepseekService.js`

### Frontend
- `frontend/src/App.jsx` — guards y rutas paralelas
- `frontend/src/main.jsx:21` — Sentry sin scrubbing
- `frontend/src/context/AuthContext.jsx` (304 LOC, 20 valores)
- `frontend/src/context/TenantContext.jsx`
- `frontend/src/services/jobService.js` (5 LOC TODO)
- `frontend/vite.config.js` — `manualChunks`

### DB Migrations
- `backend/migrations/004_b2b_tables.sql:167` — policies con subquery correlacionada
- `backend/migrations/007_tenant_branding.sql:65-67` — public read companies
- `backend/migrations/009_company_allowlist.sql` Y `009_seed_tec_monterrey.sql` — colisión
- `DB_MIGRATION_SQL.sql` (raíz) — fuente paralela
- `supabase/migrations/20260503_linkedin_analyses.sql` — cuarta fuente
- `backend/supabase/migrations/` — quinta fuente

### Deployment
- `railway.json` — 1 instancia, sin scaling
- `nixpacks.toml`
- `netlify.toml`, `frontend/netlify.toml`

---

**Próxima sesión:** abrir este documento y comenzar por la migration 010 antes del demo Tec.
