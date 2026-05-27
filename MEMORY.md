# OPTIMA-CV (ELVIA)
## Core Memory Ledger

### The Platform
OPTIMA-CV (ELVIA) is a dual-interface Human Resources & Career Optimization ecosystem tailored for LATAM logic.

### Architectural Nuances
- **Backend**: Express + Node.js (via `backend/src`). Relies on **Supabase** (v2 JS SDK). AI heavy via `claude-sonnet-4-6` (creative/writing) and `claude-haiku-4-5` (extraction/fast response).
- **Frontend**: Vite + React + TailwindCSS. Using local context, `sessionStorage` strict caching, and PhosphorIcons.
- **Data Layers**: `profiles`, `cv_results`, `job_checks`, `saved_jobs`, `administrators`, `linkedin_analyses`, and `waitlist_leads` (referral engine tracking).

### Compensaciones Tab — Arquitectura de Datos (2026-05-27)
- **Estado split**: `lp` (columnas directas de `profiles`) + `d` (JSONB `perfil` via `up()`)
- **`lp.prestaciones`**: array de strings con prestaciones activas (checkboxes)
- **`lp.prestaciones_detalle`**: objeto key→value con el monto/días/% de cada prestación
- **`PRESTACIONES_POR_PAIS['México']`**: `['IMSS','INFONAVIT','Días de vacaciones','Aguinaldo','Prima vacacional','Seguro de gastos médicos','Seguro de vida','Vales de despensa','Vales de gasolina','Otros vales','Fondo de ahorro','Auto de empresa','Car allowance','Viáticos','PTU','AFORE']`
- **`MEXICO_DETALLE`**: config de tipo/label/default por prestación. Tipos: `'dias'`, `'pct'`, `'monto'`, `'selector'`
- **Días de vacaciones**: campo especial sin checkbox, siempre visible, stored en `lp.prestaciones_detalle['Días de vacaciones']` (default `'12'`). Reemplazó a la sección standalone.
- **Vales de gasolina / Otros vales / PTU**: ahora son checkboxes en el grid igual que Vales de despensa, almacenados en `lp.prestaciones_detalle`. Eliminadas las secciones standalone.
- **Fondo de ahorro**: el % va en `lp.prestaciones_detalle['Fondo de ahorro']`, el monto mensual en `d.fondo_ahorro_monto`. En el panel anualizado se suma **directo sin ×12**.
- **AFORE**: al final de la lista México (antes era 3ra posición).
- **Expectativa de prestaciones**: opciones `'Prestaciones superiores'` / `'Prestaciones similares'` / `'Abierto a prestaciones inferiores'` (quitado "a la ley").

### Most Recent Capabilities
1. **CV Generator (CVDesdeCero)**: 100% compliant Harvard-Style resume wizard.
2. **Gerente de Búsqueda (Proyecto Laboral)**: 6 pillars with real-time progression and **document status badges** (Listo/Pendiente).
3. **Keyword NLP (CV vs Vacante)**: Analysis extracts **Critical & Complementary Keywords**, categorized by presence/absence in the CV, displayed as color-coded pills.
4. **LinkedIn Pro & History**: Full profile analysis with **Excellent/Good/Regular/Urgent** labels. Now includes a **persisted history** (last 10) to restore previous analyses.
5. **Contextual AI Mentoring (ELVIA Chat)**: Bot provides **route-specific tips** (e.g., CV tips on /cv-optimizer, interview tips on /entrevista).
6. **Structured Interview Evaluation**: Feedback split into 4 key sections: *Presentación Personal, Casos y Logros, Habilidades Técnicas, Cierre*.
7. **Top-Class Admin Dashboard**: B2C portal with CRM, Analytics (Recharts), and Marketing management.
8. **Waitlist & Referral Engine**: Automated referral code generation, viral incentive logic (5 referrals for discount), and real-time "Top Embajadores" ranking in Admin.
9. **Email Security & Deliverability**: DMARC implementation and friendly "Equipo ELVIA" sender profiles to prevent spam.
10. **Smart Geolocation**: Automatic IP-based country detection for onboarding and waitlist forms.
11. **Legal Compliance & Cookies**: Dedicated Cookie Policy page and high-end consent banner with localStorage persistence.
12. **Bulletproof Auth Recovery**: Implemented Turnstile bot protection, domain whitelisting (anti-phishing), and smart user detection (USER_NOT_FOUND) in recovery flow.
13. **Security Complexity UX**: Enforced password complexity (Uppercase, Number, Special) with real-time visual indicators in reset page.
14. **DeepSeek V3 Backend Migration**: Migrated core backend AI services (Chat, Resume Optimizer, Interview Simulator, CV vs Job Match, and CV Profile Extraction) from Anthropic Claude to DeepSeek V3 API, delivering ultra-stable and low-latency inference.
15. **B2B Co-branding Scaling**: Increased the Telefónica logo representation by 50% across all user and admin-facing B2B pages.
16. **B2B Fresh Environment Isolation**: Automated script (`allowlist_mario.js`) to reset Supabase and pre-approve test accounts under corporate tenants.
17. **B2B HR Admin Elevation**: Elevated permissions (`setup_hr_admin.js`) for `hr.telefonica@elvia.demo` to `company_admin`.
18. **Visual Infographic Redesign**: Overhauled the Autoconocimiento Infographic (`ReporteLaboral.jsx`) using a sober Apple-style aesthetic.
19. **Infographic Limits & Usability**: Enforced a 10-generation limit and updated the UI to open the visual report in a new tab (`_blank`).
20. **Rebranding to 'Mis documentos'**: Renamed 'Mis CVs' to 'Mis documentos' globally across components and views.
21. **Executive UX Dashboard V2 (B2B Premium & Wellbeing)**: Redesigned the main dashboard with B2B status, circular SVG Match gauge, and visual wellbeing support panel.
22. **CV History Sanitization**: Added strict database and client-side filters to prevent career project infographics from cluttering the optimized Harvard resume history.
23. **Compensaciones Tab v2 — Grid unificado (2026-05-27)**: Días de vacaciones, Vales de gasolina, Otros vales y PTU integrados al grid de prestaciones (mismo checkbox format que Vales de despensa). AFORE movido al final de la lista México. Panel anualizado: Fondo de ahorro suma el monto directo sin x12. Commits: `adeafc1`, `6cd39ca`.
24. **Infografía Proyecto — Fallback robusto (2026-05-27)**: `generarInfografiaProyecto` en `cvController.js` ya no rechaza con 400 cuando `job_search_profile` es `null`; usa `{}` como fallback para generar la infografía con los datos disponibles en columnas directas. Commit: `de2b085`.
25. **Pilar Competencias — Modelo 2 categorías (decisión sin fecha previa, documentada 2026-05-27)**: El pilar quedó con **Hard Skills + Power Skills** (eliminada la tercera categoría por duplicación conceptual con Soft Skills). Renombre solo en UI: la columna interna sigue siendo `soft_skills` pero se muestra como "Power Skills". El array `power_skills` (data original) queda oculto con `{false && ...}` en `ProyectoLaboral.jsx:1646` y la data muerta queda en BD para rollback. En el CV final ambas se fusionan en la sección **"Competencias y Habilidades"**.
26. **CV Inicial Fase 4b — Fusión de resumen (2026-05-27)**: Paso de Resumen en Path A (upload) muestra 3 cajas: A) resumen extraído del CV (read-only), B) Mi Oferta de Valor del Gerente (read-only), C) textarea editable. Botón ✨ Fusionar con ELVIA® llama a `POST /api/cv/fusionar-resumen`. Originalmente implementado en Claude, se migró a **DeepSeek V3** (temperature 0.2, bajo latencia) para corregir un error 500 originado por una discrepancia de importación/exportación en `deepseekService.js` / `claudeService.js`. Output: resumen ATS-optimizado con verbos de acción, sin alucinaciones. maxLength 1000, counter 3-colores (slate/amber/rose). Commit: `cc5686f`.
27. **CV Inicial Fase 4c — Contexto del Gerente a optimizarResumen + optimizarDescripcionExp (2026-05-27)**: `contextoGerente` (oferta_valor, hard_skills, soft_skills, niveles_cargo, areas, industria) se captura desde `jsp` al cargar CVDesdeCero y se envía como parámetro opcional a ambos endpoints. Se inyecta en el system prompt de DeepSeek como bloque CONTEXTO sin inventar datos. Aplica a **ambos paths** (upload Y desde cero). Si el Gerente está vacío, el bloque no se inyecta (retrocompatible). Commits: `9ed5bac`, `c0f7529`.

### Crucial Directives
- **Performance**: Always use `sessionStorage` caching (e.g., `vacante_prefill`, `entrevista_prefill`).
- **Security**: Admin restricted to `administrators` table. Superadmin: `Superadmin@elvia.lat`.
- **Identity Enforcement**: `extractProfile` prevents unauthorized scraping of 3rd party CVs by matching name/email.
- **Shell Consistency**: **Windows PowerShell**. Use `;` for chain-commands.

*Log automatically updated by Antigravity on 2026-05-27.*
