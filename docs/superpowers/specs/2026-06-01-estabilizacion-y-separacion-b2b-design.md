# Spec — Estabilización y Separación B2B de ELVIA®

**Fecha:** 2026-06-01
**Autor:** Alejandro Paz + Claude (Opus 4.7)
**Estado:** Borrador para revisión
**Versión:** 1.0
**Horizonte:** 8 semanas
**Cliente activo durante ejecución:** Telefónica (3 usuarios en pruebas)

---

## 1. Contexto y motivación

ELVIA® nació como producto B2C para acompañamiento en transición laboral. Tras un pivote estratégico en mayo 2026, la plataforma se adaptó aceleradamente a un modelo B2B con Telefónica como primer cliente. Esa adaptación, hecha bajo presión de tiempo, produjo deuda técnica acumulada:

- **Monolitos en frontend:** `ProyectoLaboral.jsx` (3,566 líneas), `CVDesdeCero.jsx` (2,000), `Onboarding.jsx` (1,297).
- **Cobertura de tests cercana a cero:** 2 archivos de test en todo el repositorio (`chat.test.js`, `codes.test.js`).
- **Sin pipeline CI/CD:** deploys directos a producción desde rama `main`, sin gates de calidad.
- **Sin staging environment formal:** validación se hace en producción con usuarios reales.
- **Sin alertas operativas:** Sentry está configurado pero sin reglas de alerta a operador humano.
- **Sin observabilidad de costos IA por tenant:** riesgo de gasto descontrolado.
- **Código B2C y B2B entremezclado:** un solo bundle sirve a ambos segmentos, con `if (tenant.type === ...)` esparcidos.
- **Bus factor = 1:** sin documentación de arquitectura que permita a otro desarrollador entrar al proyecto.

El **riesgo dominante** no es técnico aislado: es **reputacional y legal** ante el primer cliente B2B real. Un incidente que cruce datos entre tenants, o una caída prolongada sin detección, compromete la venta a futuros clientes y la relación con Telefónica.

Este documento define el plan de 8 semanas para llevar el producto a un estado **vendible a múltiples clientes B2B con confianza**, manteniendo Telefónica operativo durante toda la transición.

**Fuera de alcance de este spec:** levantamiento del producto B2C en `app.elvia.lat` (será cubierto en un spec posterior, una vez B2B esté estable). Construcción del sitio comercial `apaztalentsearch.com` (decisión posterior).

---

## 2. Objetivos y criterios de éxito

### 2.1 Objetivos

1. **Aislamiento real entre tenants B2B**, verificable por tests automatizados.
2. **Red de seguridad operativa**: CI/CD, tests críticos, monitoreo activo con alertas.
3. **Separación arquitectónica B2B / B2C / Universidades** mediante monorepo con `packages/core` compartido y `apps/*` independientes.
4. **Migración a infraestructura Supabase profesional**: nueva organización, proyectos prod + staging.
5. **Documentación viva**: ADRs, runbooks, onboarding técnico para futuros colaboradores.
6. **Onboarding de nuevo cliente B2B reproducible en ≤ 1 día** desde el runbook.

### 2.2 Criterios de éxito (verificables al final de las 8 semanas)

- [ ] CI ejecuta lint + tests + build en cada PR; merge a `main` bloqueado si falla.
- [ ] Suite de tests E2E con Playwright cubre los 5 flujos críticos (definidos en §6.1).
- [ ] Tests de aislamiento multi-tenant pasan: usuario de Tenant A nunca puede leer datos de Tenant B.
- [ ] Telefónica corre en `empresas.elvia.lat` apuntando a Supabase `elvia-b2b-prod` (proyecto nuevo).
- [ ] Sentry envía alertas a WhatsApp/email del operador en errores P1.
- [ ] Dashboard de costos IA muestra gasto por tenant en últimos 24h / 7d / 30d.
- [ ] `ProyectoLaboral.jsx`, `CVDesdeCero.jsx` y `Onboarding.jsx` reducidos a ≤ 500 líneas cada uno, con submódulos extraídos.
- [ ] Repositorio reorganizado: `packages/core/`, `packages/shared-ui/`, `apps/b2b/`, `backend/` con responsabilidades claras.
- [ ] Runbook documentado: cómo provisionar un nuevo cliente B2B paso a paso.
- [ ] Al menos 3 ADRs publicados (multi-tenancy, separación monorepo, estrategia DB).
- [ ] Branch protection activo en `main`; PR reviews obligatorios.

---

## 3. Decisiones arquitectónicas (tomadas en sesión 2026-05-31 / 2026-06-01)

### ADR-001 — Estrategia de evolución: refactor incremental, no rewrite

**Decisión:** refactorizar el código actual aplicando disciplina arquitectónica progresiva, no reescribir desde cero.

**Razones:**
- Cliente real (Telefónica) en pruebas activas; un rewrite de 4-8 meses pierde momentum comercial.
- "Second-system effect" (J. Spolsky): rewrites del mismo dominio mientras aún se aprende del negocio replican errores previos con stack distinto.
- Stack actual (React + Vite + Supabase + Express + Railway/Netlify) es moderno y adecuado a la escala objetivo.
- El problema no es el stack, es la **organización del código y la disciplina de proceso**.

### ADR-002 — Multi-tenancy: shared code + isolated data planes

**Decisión:** una sola base de código fuente, múltiples deploys independientes, bases de datos físicamente separadas por segmento.

**Patrón:** *Shared infrastructure, isolated data planes*.

**Lo que se comparte:**
- Repositorio único (monorepo).
- `packages/core/`: motor de negocio (Factoría CV, IA clients, Supabase client, lógica de análisis).
- `packages/shared-ui/`: componentes UI reutilizables.
- Backend Node.js: un solo servicio, multi-tenant por header `X-Tenant-Type` o subdominio.
- Pipeline CI/CD.

**Lo que se aísla:**
- Bundles desplegados: `apps/b2b/` → `empresas.elvia.lat`, `apps/b2c/` → `app.elvia.lat` (fase 2), `apps/universidades/` → `universidades.elvia.lat` (futuro).
- Bases de datos Supabase (una por segmento).
- Storage buckets (uno por segmento).
- Tablas `auth.users` (separadas por DB).
- Branding, narrativa, navegación.

### ADR-003 — Estrategia de bases de datos: híbrido por segmento

**Decisión:** tres proyectos Supabase de producción + tres de staging, en una nueva organización empresarial.

| Proyecto | Audiencia | RLS principal | Estado al final del sprint |
|---|---|---|---|
| `elvia-b2b-prod` | Telefónica + futuros B2B | `company_id` | Migrado y activo |
| `elvia-b2b-staging` | Pruebas internas B2B | `company_id` | Activo |
| `elvia-b2c-prod` | Candidatos retail | `user_id` | Creado vacío, sin tráfico |
| `elvia-b2c-staging` | Pruebas B2C | `user_id` | Creado vacío |
| `elvia-uni-prod` | Universidades | `institution_id` | No se crea aún |
| `elvia-uni-staging` | Pruebas universidades | `institution_id` | No se crea aún |

**Razones:**
- Argumento de venta sólido a CIOs B2B: "tus datos viven en infraestructura aislada".
- Cumplimiento legal: GDPR / Ley LATAM tratan distinto datos corporativos vs individuales.
- Blast radius acotado: incidente en un segmento no afecta a otros.
- Reversible: consolidar dos DBs es factible; separar una DB con datos mezclados es pesadilla.

**Costo estimado:** $25 USD/mes por proyecto Pro × 2 prod activos durante este sprint = $50 USD/mes. Staging en plan Free.

### ADR-004 — Mantener Supabase, no migrar a Firebase

**Decisión:** continuar con Supabase como backend-as-a-service.

**Razones (resumen — desarrollado en sesión):**
- Modelo de datos relacional (PostgreSQL) calza con el dominio (companies, users, cv_results, events, pipeline) con JOINs naturales.
- RLS de Postgres es más expresivo que Firebase Security Rules para aislamiento multi-tenant complejo.
- Bajo vendor lock-in: `pg_dump` exporta a cualquier Postgres estándar.
- Costo predecible (planes fijos) vs Firestore (paga por operación, riesgo de factura sorpresa).
- Migrations versionadas en `supabase/migrations/` ya están en uso.

### ADR-005 — Estrategia de dominios

**Decisión:**

| Dominio | Rol | Fase |
|---|---|---|
| `apaztalentsearch.com` | Sitio comercial / vitrina (cuando se construya) | Posterior, fuera de este sprint |
| `empresas.elvia.lat` | App B2B (Telefónica + futuros) | Activo al final del sprint |
| `app.elvia.lat` | App B2C (candidatos retail) | Fase 2, spec posterior |
| `universidades.elvia.lat` | App universidades | Futuro |

**Subdominios actuales (Telefónica) se redirigen a `empresas.elvia.lat`** durante semana 6.

### ADR-006 — Modelo de Claude por tipo de tarea

**Decisión:** asignar modelo según costo-de-error vs costo-de-ejecución.

| Categoría | Modelo |
|---|---|
| Decisiones arquitectónicas, refactor de monolitos, migración de datos críticos | **Opus 4.7** |
| Generación de tests, CI/CD, migraciones SQL, componentes UI, documentación estructurada | **Sonnet 4.6** |
| Configuración mecánica, fixes triviales, code review automatizado de baja complejidad | **Haiku 4.5** |

Distribución estimada del sprint: 30% Opus, 55% Sonnet, 15% Haiku.

---

## 4. Arquitectura objetivo

### 4.1 Estructura del repositorio (al final del sprint)

```
elvia-platform/                       (monorepo)
├── packages/
│   ├── core/                         (motor de negocio compartido)
│   │   ├── factoria-cv/              (Factoría Harvard, generación CV)
│   │   ├── cv-vs-job/                (análisis de matching)
│   │   ├── linkedin-pro/             (análisis y reporte LinkedIn)
│   │   ├── entrevista/               (simulador de entrevistas)
│   │   ├── ia-clients/               (Claude, DeepSeek, OpenAI)
│   │   ├── supabase-client/          (cliente con multi-tenant header)
│   │   ├── pdf-engine/               (pdf-lib wrapper)
│   │   └── analytics/                (useTrackEvent + adapters)
│   ├── shared-ui/                    (componentes UI reutilizables)
│   │   ├── Button, Modal, Card, etc.
│   │   ├── ChatWidget/
│   │   └── ReporteCompensacion/
│   └── tenant-config/                (configuración por tipo de tenant)
│       ├── b2b.config.ts
│       ├── b2c.config.ts
│       └── universidades.config.ts
│
├── apps/
│   ├── b2b/                          → deploy: empresas.elvia.lat
│   │   ├── pages/
│   │   │   ├── LoginEmpresa.jsx
│   │   │   ├── LoginHR.jsx
│   │   │   ├── ActivarCuenta.jsx
│   │   │   ├── CompanyAdmin.jsx
│   │   │   ├── HRDashboard.jsx
│   │   │   ├── Pipeline.jsx
│   │   │   ├── ProyectoLaboral/      (descompuesto en módulos)
│   │   │   ├── MisCVs.jsx
│   │   │   ├── CVvsJob.jsx
│   │   │   ├── LinkedinPro.jsx
│   │   │   ├── Entrevista.jsx
│   │   │   └── ...
│   │   ├── App.jsx
│   │   └── vite.config.js
│   │
│   └── (apps/b2c y apps/universidades se crean en specs posteriores)
│
├── backend/                          (Node.js + Express, multi-tenant)
│   ├── src/
│   │   ├── routes/
│   │   ├── middleware/
│   │   │   └── tenantResolver.js     (lee subdominio → setea tenant context)
│   │   ├── services/
│   │   ├── lib/
│   │   └── tests/
│   ├── supabase/
│   │   └── migrations/               (versionadas, aplicadas por CI)
│   └── package.json
│
├── docs/
│   ├── superpowers/specs/            (este documento y futuros)
│   ├── adr/                          (Architecture Decision Records)
│   ├── runbooks/
│   │   ├── onboarding-cliente-b2b.md
│   │   ├── incident-response.md
│   │   └── release-process.md
│   └── architecture/
│       ├── overview.md
│       └── multi-tenancy.md
│
├── .github/
│   └── workflows/
│       ├── ci.yml                    (lint + test + build en PR)
│       ├── deploy-b2b.yml            (deploy a empresas.elvia.lat)
│       ├── deploy-backend.yml
│       └── e2e-smoke.yml             (smoke tests post-deploy)
│
├── package.json                      (workspaces)
└── README.md
```

### 4.2 Flujo de request (ejemplo: candidato Telefónica abre su Pipeline)

```
1. Usuario abre empresas.elvia.lat/pipeline
2. Netlify sirve bundle de apps/b2b
3. App.jsx detecta subdominio → carga tenant-config/b2b.config.ts
4. Supabase client (packages/core/supabase-client) se inicializa apuntando a
   elvia-b2b-prod
5. Usuario autentica → JWT contiene company_id de Telefónica
6. Página Pipeline llama a backend con header X-Tenant-Type: b2b
7. Backend middleware tenantResolver valida tenant + JWT
8. Query a Supabase con RLS → solo devuelve rows con company_id = Telefónica
9. UI renderiza
```

### 4.3 Aislamiento garantizado por capas

| Capa | Mecanismo de aislamiento |
|---|---|
| DNS / red | Subdominios separados (`empresas.` vs `app.`) |
| Bundle frontend | Builds independientes por `apps/*` |
| Auth | `auth.users` en DBs físicamente separadas |
| Datos | Postgres RLS + `company_id` dentro de cada DB B2B |
| Storage | Buckets separados por proyecto Supabase |
| Backend | Middleware `tenantResolver` valida coherencia tenant ↔ JWT ↔ DB |
| Tests | Suite específica de aislamiento (§6.2) |

---

## 5. Plan de ejecución por semana

### Semana 1 — CI/CD + Tests críticos (red de seguridad parte 1)

**Modelo recomendado:** Sonnet 4.6 (90%) + Haiku 4.5 (10%).

**Entregables:**
- `.github/workflows/ci.yml` con lint (ESLint), build (`vite build`), tests unitarios (Jest) por cada PR.
- Branch protection activado en `main` y `dev`: requiere CI verde + 1 review.
- Setup de Playwright en `tests/e2e/`.
- Primer test E2E del flujo más crítico: HR Telefónica invita candidato → email recibido → activación → primer login → ve Gerente de Búsqueda con datos correctos.
- Configuración de `npm run test`, `npm run e2e`, `npm run lint` documentada en README.

**Criterios de aceptación:**
- Un PR con código que falla lint o tests no puede mergearse.
- E2E smoke test corre en < 3 minutos y pasa de forma estable 5 veces seguidas.

### Semana 2 — Monitoreo + Costos IA (red de seguridad parte 2)

**Modelo recomendado:** Sonnet 4.6 (70%) + Haiku 4.5 (30%).

**Entregables:**
- Sentry reglas de alerta: error rate > 1% en 5min, error P1 (auth, pago, IA failure) inmediato → notificación a WhatsApp (vía webhook a número operador) y email.
- UptimeRobot o Better Stack: monitoreo de `empresas.elvia.lat` y backend cada 1 min, alerta si > 2 fails consecutivos.
- Logs estructurados en backend (Pino o Winston): cada request tiene `tenant_id`, `user_id`, `request_id`, `duration_ms`, `model_used`, `tokens_in`, `tokens_out`, `cost_usd`.
- Tabla `ia_usage_log` en Supabase: registra cada llamada a Claude/DeepSeek/OpenAI con tenant, modelo, tokens, costo estimado.
- Dashboard interno (página admin `/admin/costos`) que muestra: gasto IA por tenant últimas 24h / 7d / 30d, top 10 usuarios por costo, modelo más usado.

**Criterios de aceptación:**
- Apagar manualmente el backend produce alerta en WhatsApp en < 2 minutos.
- Tirar un error P1 desde código de prueba produce alerta inmediata.
- Dashboard de costos refleja gasto real del día previo.

### Semana 3 — Extracción de `packages/core` (parte 1)

**Modelo recomendado:** Opus 4.7 (70%) + Sonnet 4.6 (30%).

**Entregables:**
- Configurar workspaces de npm/pnpm en raíz.
- Mover a `packages/core/`:
  - `factoria-cv/` (extraída de `CVDesdeCero` y servicios backend asociados).
  - `ia-clients/` (Claude, DeepSeek, OpenAI clients que hoy están en `backend/src/services/` y duplicados en frontend).
  - `supabase-client/` (factory que toma tenant config y devuelve cliente configurado).
- Actualizar imports en todo el código que consume estos módulos.
- Tests de los módulos extraídos (cobertura mínima 60% en `packages/core/factoria-cv/`).

**Criterios de aceptación:**
- Build de la app B2B sigue funcionando idéntico al estado anterior.
- Tests E2E de Semana 1 siguen pasando.
- No hay duplicación de código IA cliente entre frontend y backend.

### Semana 4 — Descomposición de monolitos + `packages/core` (parte 2)

**Modelo recomendado:** Opus 4.7 (80%) + Sonnet 4.6 (20%).

**Entregables:**
- `ProyectoLaboral.jsx` (3,566 líneas) descompuesto:
  - 1 orquestador (`ProyectoLaboral.jsx` ~ 300 líneas) que maneja navegación entre pilares y estado global.
  - 6 módulos de pilar (uno por cada uno de los 6 pilares estratégicos), cada uno < 500 líneas.
  - Hooks compartidos extraídos: `useProgresoLaboral`, `usePilarSave`.
- `CVDesdeCero.jsx` (2,000 líneas) descompuesto en wizard de pasos: cada paso un componente, orquestador ~ 200 líneas.
- `Onboarding.jsx` (1,297 líneas) descompuesto similar.
- Mover componentes UI reutilizables a `packages/shared-ui/` (Button, Modal, Card, ChatWidget, ReporteCompensacion, etc.).
- Tests unitarios para cada submódulo extraído.

**Criterios de aceptación:**
- Ningún archivo en `apps/b2b/pages/` supera 800 líneas.
- Ningún archivo en `packages/core/` supera 500 líneas.
- Cobertura de tests en módulos refactorizados ≥ 70%.
- E2E smoke tests siguen verdes.

### Semana 5 — Nueva organización Supabase + Proyecto `elvia-b2b-prod`

**Modelo recomendado:** Opus 4.7 (60%) + Sonnet 4.6 (40%).

**Entregables:**
- Nueva organización Supabase creada con cuenta empresarial.
- Proyectos provisionados: `elvia-b2b-prod`, `elvia-b2b-staging`, `elvia-b2c-prod`, `elvia-b2c-staging` (los últimos dos vacíos, sin tráfico).
- Schema de `elvia-b2b-prod` migrado: tablas, RLS policies, triggers, functions, storage buckets, auth providers.
- Script de export desde Supabase actual → import a `elvia-b2b-prod`, ejecutado en `elvia-b2b-staging` primero como rehearsal.
- Tabla `ia_usage_log` añadida al schema nuevo.
- Tests de aislamiento multi-tenant (ver §6.2) ejecutándose contra staging.

**Criterios de aceptación:**
- Migración rehearsal en staging completa sin errores.
- Tests de aislamiento pasan en staging.
- Los 3 usuarios Telefónica + tenant `telefonica` están presentes en staging con datos íntegros.
- Plan de rollback documentado (regresar DNS al Supabase original si la migración prod falla).

### Semana 6 — Migración a producción + switch DNS

**Modelo recomendado:** Opus 4.7 (70%) + Sonnet 4.6 (30%).

**Entregables:**
- Ventana de mantenimiento coordinada con stakeholder Telefónica (idealmente fin de semana).
- Migración prod ejecutada: dump de DB actual → restore en `elvia-b2b-prod`.
- Verificación post-migración: counts de tablas críticas, login de los 3 usuarios Telefónica, generación de un CV de prueba.
- Switch DNS: `empresas.elvia.lat` apunta al nuevo deploy de `apps/b2b` (Netlify) con env vars apuntando a `elvia-b2b-prod`.
- Backend reconfigurado: env vars de Railway apuntan a `elvia-b2b-prod`.
- Supabase original queda en read-only durante 2 semanas como respaldo.
- Smoke test post-switch ejecutado: los 5 flujos críticos pasan en producción.

**Criterios de aceptación:**
- Telefónica accede a `empresas.elvia.lat`, autentica, opera normalmente.
- Cero pérdida de datos (verificado por comparación de checksums por tabla crítica).
- Tiempo de downtime durante el switch < 30 min.
- Plan de rollback ensayado: si algo falla, DNS regresa al estado anterior en < 10 min.

### Semana 7 — Documentación: ADRs, arquitectura, runbooks

**Modelo recomendado:** Sonnet 4.6 (90%) + Opus 4.7 (10%).

**Entregables:**
- `docs/adr/`: al menos 6 ADRs publicados (los 6 listados en §3 + cualquier decisión adicional surgida durante el sprint).
- `docs/architecture/overview.md`: diagrama y narrativa de la arquitectura actual.
- `docs/architecture/multi-tenancy.md`: cómo funciona el aislamiento en cada capa.
- `docs/runbooks/onboarding-cliente-b2b.md`: paso a paso para provisionar un nuevo cliente B2B (crear tenant, branding, allowlist, HR account, invitaciones).
- `docs/runbooks/incident-response.md`: qué hacer si Sentry alerta, si DB cae, si IA falla.
- `docs/runbooks/release-process.md`: flujo `dev` → `main` con gates.
- README raíz actualizado: estructura del repo, cómo correr local, cómo correr tests, cómo desplegar.

**Criterios de aceptación:**
- Un desarrollador externo puede leer la documentación y levantar el proyecto local en < 1 hora.
- Runbook de onboarding probado: un cliente B2B ficticio es provisionado en ≤ 1 día siguiendo los pasos.

### Semana 8 — Hardening final + buffer

**Modelo recomendado:** Sonnet 4.6 (60%) + Opus 4.7 (20%) + Haiku 4.5 (20%).

**Entregables:**
- Resolver issues abiertos durante las 7 semanas previas (buffer para imprevistos).
- Revisión de seguridad: search de secretos en código, validación de headers de seguridad, rate limiting verificado.
- Aplicar todas las correcciones del check de OWASP Top 10.
- Limpieza de archivos legacy de la raíz (`add_column.js`, `check-profiles.js`, `check-vectors.js`, scripts varios) → mover a `scripts/legacy/` o eliminar.
- Auditoría final ejecutada por subagente `code-reviewer` sobre el repo completo.
- Retro de sprint: documentar qué funcionó, qué no, qué queda pendiente para el spec de B2C.

**Criterios de aceptación:**
- Auditoría de seguridad sin findings de severidad alta.
- Todos los criterios de éxito de §2.2 marcados como completados.
- Repo limpio, sin archivos huérfanos en raíz.

---

## 6. Tests críticos

### 6.1 Tests E2E de flujos críticos (Playwright)

| # | Flujo | Pasos clave |
|---|---|---|
| 1 | Login B2B candidato | Login con `andrea.santos@elvia.demo` → ve Bienvenida → navega a Gerente |
| 2 | Invitación HR → activación | HR invita email nuevo → mail llega → link `/activar` → crea password → login |
| 3 | Generación de CV (Factoría Harvard) | Login → CV desde Cero → completar wizard → genera PDF descargable |
| 4 | CV vs Job análisis completo | Login → CVvsJob → pegar descripción → análisis devuelve score y sugerencias |
| 5 | Admin Telefónica aislamiento | Login `hr.telefonica@elvia.demo` → CohortTab → ve solo usuarios Telefónica |

### 6.2 Tests de aislamiento multi-tenant (Jest + Supertest)

| # | Caso | Resultado esperado |
|---|---|---|
| 1 | Usuario de Tenant A intenta leer `cv_results` con `company_id` de Tenant B | 403 / array vacío por RLS |
| 2 | HR de Tenant A intenta invitar a su propio dominio | OK |
| 3 | HR de Tenant A intenta invitar candidato y asignarle `company_id` de Tenant B | 400 con error claro |
| 4 | Storage: usuario A intenta leer archivo en bucket de tenant B | 403 |
| 5 | API admin: HR de A no puede llamar endpoints admin de B | 403 |
| 6 | JWT manipulado con `company_id` cambiado | Middleware rechaza la request |

### 6.3 Tests unitarios

- Cobertura mínima objetivo al final del sprint: **60% en `packages/core/`**, **40% en `apps/b2b/`**.
- Énfasis en lógica de negocio (factoría CV, CVvsJob scoring, IA clients con mocks).

---

## 7. Riesgos identificados y mitigación

| # | Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|---|
| R1 | Migración Supabase pierde datos de Telefónica | Baja | Alto | Rehearsal en staging primero, checksums por tabla, 2 semanas de respaldo en la DB original. |
| R2 | Refactor de `ProyectoLaboral.jsx` rompe funcionalidad sutil | Media | Alto | E2E smoke tests cubren los flujos clave; cualquier regresión los rompe. Tests manuales con Telefónica antes de mergear. |
| R3 | Telefónica reporta incidente durante refactor | Media | Medio | Mantener `main` siempre desplegable; el refactor vive en `dev` hasta validar; rollback a último tag estable disponible. |
| R4 | Stack de monorepo (workspaces) introduce complejidad de builds | Media | Bajo | Empezar con setup mínimo (pnpm workspaces o npm workspaces); no introducir Turborepo/Nx en este sprint. |
| R5 | Costos IA explotan durante tests E2E que generan CVs | Alta | Bajo | Mocks de Claude/DeepSeek en tests E2E (responses canned), llamadas reales solo en suites etiquetadas `@expensive`. |
| R6 | Cliente Telefónica pide nueva feature urgente durante sprint | Alta | Medio | Política: features nuevas van en `feat/*` ramas separadas, no bloquean el sprint; se priorizan en buffer de semana 8 o se difieren post-sprint. |
| R7 | Operador (Alejandro) se enferma o no puede operar 1+ semana | Baja | Alto | Documentación (semana 7) permite a contractor temporal continuar; runbooks contemplan operaciones críticas. |
| R8 | Subir versión major de dependencias (React, Vite, Supabase SDK) durante refactor | Baja | Medio | No upgrades de versión major durante el sprint. Listar en backlog post-sprint. |
| R9 | DNS switch falla y `empresas.elvia.lat` queda inaccesible | Baja | Alto | TTL bajado a 60s 24h antes del switch; rollback DNS documentado y ensayado; ventana coordinada con stakeholder. |

---

## 8. Decisiones diferidas (intencionalmente fuera de scope)

Las siguientes decisiones NO se toman en este sprint para no diluir el foco. Cada una merece su propio spec en el momento adecuado:

- **Spec 2 — Levantamiento B2C en `app.elvia.lat`.** Se aborda una vez B2B esté estable y Telefónica firme contrato productivo.
- **Sitio comercial `apaztalentsearch.com`.** Decisión de tooling (Webflow vs código) y narrativa posterior.
- **Agentes autónomos de monitoreo / análisis.** Requieren la base de logs estructurados y métricas que se construye en Semana 2; se evalúan en spec posterior.
- **Migración a Turborepo / Nx.** Solo si la complejidad del monorepo lo justifica después del sprint.
- **SSO empresarial (SAML, OIDC).** Cuando un cliente B2B lo exija explícitamente.
- **Soporte multi-región (DBs en múltiples regiones).** Cuando un cliente o regulación lo exija.
- **Mobile app nativa.** Roadmap a 12+ meses.
- **Onboarding de universidades.** Cuando aterricen las decisiones contractuales.

---

## 9. Roles, modelos de Claude y operación

| Rol | Quién / qué | Responsabilidades |
|---|---|---|
| Product owner | Alejandro Paz | Decisiones de scope, priorización, comunicación con Telefónica. |
| Tech lead / desarrollador principal | Alejandro Paz + Claude (asistente) | Implementación de todas las semanas. |
| Revisión arquitectónica | Claude Opus 4.7 (este modelo) | Spec, ADRs, refactor de monolitos, decisiones críticas. |
| Implementación de patrones conocidos | Claude Sonnet 4.6 | CI/CD, tests, migraciones SQL, componentes UI. |
| Tareas mecánicas / config | Claude Haiku 4.5 | Setup de servicios, fixes simples, configuración. |
| Code review | Subagente `code-reviewer` (Sonnet) | Revisión sistemática de PRs antes de merge. |
| QA E2E | Subagente `e2e-runner` + Playwright | Ejecución de smoke tests pre-deploy. |
| Stakeholder Telefónica | Mario / Vanessa (contacto cliente) | Validación de cambios visibles, ventana de mantenimiento. |

**Política de commits:** todo el trabajo en `dev`; merge a `main` solo con instrucción explícita del operador. Esta regla se mantiene durante todo el sprint.

**Política de modelo en chat operativo:** sesiones de planificación y decisión → Opus. Sesiones de implementación rutinaria → Sonnet. Cambio explícito con `/model` al inicio de cada bloque de trabajo.

---

## 10. Métricas a trackear durante el sprint

| Métrica | Frecuencia | Objetivo final |
|---|---|---|
| Líneas en archivos top-10 más grandes | Semanal | Ningún archivo > 800 líneas |
| Cobertura de tests | Semanal | ≥ 60% en `packages/core/` |
| Tiempo de CI por PR | Por PR | < 5 min |
| Errores P1 en Sentry últimos 7d | Diario | 0 errores no atendidos > 2h |
| Uptime de `empresas.elvia.lat` | Continuo | ≥ 99.5% |
| Costo IA por tenant por día | Diario | Visible y dentro de presupuesto definido |
| Velocidad de provisión nuevo cliente B2B | Al final | ≤ 1 día siguiendo runbook |

---

## 11. Próximos pasos tras aprobar este spec

1. Operador revisa este documento y aprueba o solicita cambios.
2. Una vez aprobado, se invoca el skill `writing-plans` (próximo) para generar el plan de implementación detallado, con tareas accionables día a día por semana.
3. El plan se commitea en `docs/superpowers/plans/`.
4. Arranca ejecución en `dev` con la Semana 1.

---

## 12. Glosario rápido

- **B2B:** business-to-business. Telefónica y futuros clientes corporativos.
- **B2C:** business-to-consumer. Candidatos individuales que pagan por sí mismos.
- **Tenant:** cliente o segmento aislado dentro de la plataforma.
- **RLS:** Row-Level Security de Postgres. Reglas que filtran rows según el usuario autenticado.
- **Monorepo:** un solo repositorio con múltiples paquetes/apps.
- **ADR:** Architecture Decision Record. Documento corto que justifica una decisión técnica.
- **Runbook:** procedimiento operativo paso a paso para una tarea recurrente o de emergencia.
- **SLA:** Service Level Agreement. Compromiso medible de disponibilidad/latencia.
- **Blast radius:** alcance del daño que produce un incidente.

---

*Fin del spec — versión 1.0 — 2026-06-01*
