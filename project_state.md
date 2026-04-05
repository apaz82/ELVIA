# Current Project State

## Environment Status
- **Date**: 2026-04-05
- **Branch**: `main`
- **Frontend**: Local Dev running (`localhost:5177`)
- **Backend API**: `localhost:5000` / `localhost:3001` (dependent on strict env variables pointing to Railway or local DB).

## Current Active Phases

### Front-End (React + Tailwind)
- The CV Builder (`CVDesdeCero`) is fully stable with identity checks.
- Career Planner (`ProyectoLaboral`) is fully stable. Contains 6 pillars and active sessionStorage validations.
- `html2pdf.js` was integrated allowing 100% frontend rendering control over Executive Resumes avoiding backend `puppeteer` memory headaches.

### Back-End (Express + Supabase SDK)
- Claude Haiku is now the primary parser for data modeling (Infographics & CV extraction).
- Claude Sonnet is reserved only for computationally creative processes.
- All documents produced are stored under `cv_results` with distinct identifiers (`optimize`, `original`, `infografia_proyecto`).

## Imminent Next Steps (Roadmap)
1. **LinkedIn Magic Import & Context Logic**:
   - Needs to be tested to ensure the AI utilizes the `contextoLaboral` (Career Data from `Gerente de Búsqueda`) injected from `AuthContext.jpData`.
   - The UX flow in `/linkedin-pro` is ready. Backend logic `analizarPerfil` should inject these bounds securely limiting bias.
2. Review remaining **Technical Debt**:
   - `crypto.randomBytes` instead of `Math.random` (backend).
   - Missing Rate Limiter on API registration routes.
   - Removing internal debug stack traces in PROD backend JSON responses.

*Managed by Gemini (Antigravity).*
