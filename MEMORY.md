# OPTIMA-CV
## Core Memory Ledger

### The Platform
OPTIMA-CV is a dual-interface Human Resources & Career Optimization ecosystem tailored for LATAM logic.

### Architectural Nuances
- **Backend**: Express + Node.js instance (via `backend/src`). Relies heavily on **Supabase** acting natively as PostgreSQL (using v2 JS SDK). It integrates AI heavily via `claude-haiku` and `claude-sonnet` integrations via Anthropic (`claudeService.js`).
- **Frontend**: Vite + React + TailwindCSS (via `frontend/src`). Using local context, `sessionStorage` strict caching protocols, and PhosphorIcons for visual integrity.
- **Data Layers**: Database relies primarily on `profiles`, `cv_results`, `job_checks`, and `saved_jobs`.

### Most Recent Capabilities
1. **CV Generator (CVDesdeCero)**: A wizard that pulls previously completed fields or parses existing PDF resumes to formulate a 100% compliant Harvard-Style resume tailored for LATAM rules (Anti-hallucination protected).
2. **Gerente de Búsqueda (Proyecto Laboral)**: 6 pivotal steps (Mi Perfil, Autoconocimiento, Recursos, etc). Includes real-time percentage progression (Must be >=50% or >=100% to unlock capabilities like document building or infographic generation).
3. **LinkedIn Pro Magic**: Connects User Job Aspirations context into the AI's analysis when feeding the user's LinkedIn profile PDF for tailored enhancement output.
4. **Infografías (ReporteLaboral)**: HTML-to-PDF pipeline on the frontend relying on a strict Tailwind A4 grid to bypass backend rendering challenges, creating high-impact corporate executive snapshots.

### Crucial Directives
- **Performance**: Always use `sessionStorage` caching protocols to avoid latency on tab switches spanning between `ProyectoLaboral.jsx` and `CVDesdeCero.jsx`.
- **Identity Enforcement**: `extractProfile` forces identity (Name/LastName) comparison from CV-PDF to existing Profile-User to prevent unauthorized scraping of 3rd party CVs.
- **Language Lock**: CVs parsed are rendered outputing in the same language. BUT data like 'country' is mapped into LATAM standard formats.

*Log automatically updated by Gemini (Antigravity).*
