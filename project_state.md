# Current Project State

## Environment Status
- **Date**: 2026-05-27
- **Branch**: `main`
- **Frontend**: Netlify (Production verified) / Local Dev `localhost:5178`
- **Backend API**: Railway (Production) `cv-optimizer-pro-production.up.railway.app` / Local `localhost:5000`
- **Last commits**: `adeafc1`, `6cd39ca`, `de2b085`, `b40a8e7`

## Current Active Phases

### Front-End (React + Tailwind)
- **Keyword NLP (CV vs Job)**: Implemented 3rd tab with critical/complementary keyword pills (Present/Absent).
- **LinkedIn Pro**: Added analysis history (last 10) with ability to restore results; score badges (Excelente/Urgente) added.
- **ELVIA Chat**: Implemented contextual tips based on the current route (6 specific tip sets).
- **Interview Evaluation**: UI now displays structured feedback in 4 sections (Presentación, Casos y Logros, Habilidades Técnicas, Cierre).
- **Admin Dashboard**: Fully functional with Recharts and CRM features.
- **Waitlist System**: Referral engine with unique code generation, validation, and viral incentives (5 refs = discount).
- **Compliance**: Cookie Policy page and Blur-effect Consent Banner with persistence logic.
- **Security UX**: Real-time password strength indicator and Turnstile integration in ResetPassword page.
- **Compensaciones Tab v2** _(2026-05-27)_:
  - Días de vacaciones → dentro del grid de prestaciones México (posición 3, sin checkbox, siempre visible), stored en `lp.prestaciones_detalle['Días de vacaciones']`
  - AFORE → movido al final de la lista México
  - Vales de gasolina, Otros vales, PTU → ahora son checkboxes en el grid igual que Vales de despensa, stored en `lp.prestaciones_detalle`
  - Eliminadas 3 secciones standalone (Días de vacaciones, Vales adicionales, PTU)
  - Panel Salario Anualizado: Fondo de ahorro suma monto directo (sin ×12), vales/car allowance ×12
  - Expectativa de prestaciones: labels abreviados (sin "a la ley")

### Pilar Competencias — Modelo de Skills (decisión histórica documentada 2026-05-27)
- Quedaron **2 categorías**: Hard Skills + Power Skills (originalmente eran 3: Hard + Soft + Power)
- Decisión: eliminar duplicación conceptual entre Soft y Power → renombrar Soft → Power, quitar Power original
- **Discrepancia nombre interno vs UI** (no se renombra BD, no destructivo):
  - `data.autoconocimiento.hard_skills` → UI: "Hard Skills"
  - `data.autoconocimiento.soft_skills` → UI: "Power Skills"
  - `data.autoconocimiento.power_skills` → oculto (`{false && ...}` línea ~1646), data muerta en BD
- Al leer skills del pilar usar `hard_skills` + `soft_skills`, etiquetar como "Hard" + "Power"
- En el CV final ambas se fusionan en sección unificada **"Competencias y Habilidades"**

### Back-End (Express + Supabase SDK)
- **LinkedIn History**: Added `linkedin_analyses` table and persistence logic.
- **NLP keyword extraction**: Updated `matchCVtoJob` prompt to extract structured keyword metadata.
- **Structured Evaluations**: Updated `evaluarEntrevista` to return 4-section structured JSON.
- **Admin Infrastructure**: Dedicated `administrators` table and RLS policies active.
- **Waitlist API**: Unique code generator, manual code validation endpoint, and email integration with Resend.
- **Recovery Infrastructure**: Domain whitelist for reset URLs, Resend verified sender (soporte@elvia.lat), and granular error codes for non-existent users.
- **Infografía Proyecto — Fallback e Habilitación** _(2026-05-27)_: `generarInfografiaProyecto` en `cvController.js` tolera `job_search_profile = null` usando `{}` como fallback. En el frontend, se habilitó la generación de la infografía ejecutiva de forma dinámica si el progreso general es ≥ 50% O si el pilar de **"Mi Oferta de Valor" está al 100%** (`porPilar.oferta === 100`).

## Refactor CV Inicial — Estado de fases
| Fase | Estado |
|------|--------|
| 0 — Ocultar Optimizer de navegación | ✅ `026102b` |
| 1 — CVHarvardPreview.jsx | ✅ `bd9cf7f` |
| 2 — Paso 7 "Vista Previa" en wizard | ✅ `bd9cf7f` |
| 3 — Pantalla selección en /cv-desde-cero | ✅ `90922db` |
| 3b — Reestructurar pilares | ✅ `25e8672` |
| 3c — Sequential lock + modal fix | ✅ `c682ed8` |
| 4a — Path A: modos upload/scratch separados, modal cancelar, pre-llenado desde Gerente | ✅ `784fc0d` |
| 4b — Path A: Fusión resumen CV + Mi Oferta de Valor (3 cajas + botón Fusionar con ELVIA®) | ✅ `cc5686f` |
| 4c — Contexto del Gerente → optimizarResumen + optimizarDescripcionExp (ambos paths) | ✅ `9ed5bac` |
| 4d — Habilitar documentos al 100% y desbloqueo total al Confirmar CV | ✅ `feat` |
| 5 — Versionado en MisCVs | ⏸️ Pendiente |
| 6 — Puntaje visible | ⏸️ Pendiente |

## Pendientes conocidos
- **Deuda técnica seguridad**: `Math.random()` en company.js → `crypto.randomBytes`; rate limiter en `POST /api/company/registration/:slug`; remover `detalle/stack` del catch de cvGenerarController.js en prod
- **Precio Optima**: `valorOptima` usa plan hardcodeado `'free'` (=$0), debe leer `perfil.plan` y mapear a precios reales
- **Refactor Fases 4-6**: Path A (upload→wizard), versionado MisCVs, puntaje visible

*Managed by Antigravity — Updated 2026-05-27.*
