# Current Project State

## Environment Status
- **Date**: 2026-05-03
- **Branch**: `main`
- **Frontend**: Local Dev running (`localhost:5177`) / Production Verified
- **Backend API**: `localhost:5000` / `localhost:3001` (pointing to Supabase/Railway).

## Current Active Phases

### Front-End (React + Tailwind)
- **Keyword NLP (CV vs Job)**: Implemented 3rd tab with critical/complementary keyword pills (Present/Absent).
- **LinkedIn Pro**: Added analysis history (last 10) with ability to restore results; score badges (Excelente/Urgente) added.
- **ELVIA Chat**: Implemented contextual tips based on the current route (6 specific tip sets).
- **Interview Evaluation**: UI now displays structured feedback in 4 sections (Presentación, Casos, Habilidades, Cierre).
- **Admin Dashboard**: Fully functional with Recharts and CRM features.

### Back-End (Express + Supabase SDK)
- **LinkedIn History**: Added `linkedin_analyses` table and persistence logic.
- **NLP keyword extraction**: Updated `matchCVtoJob` prompt to extract structured keyword metadata.
- **Structured Evaluations**: Updated `evaluarEntrevista` to return 4-section structured JSON.
- **Admin Infrastructure**: Dedicated `administrators` table and RLS policies active.

## Imminent Next Steps (Roadmap)
1. **Interview Prefill logic**:
   - Verify `sessionStorage` prefill from Pipeline to Entrevista.
2. **Technical Debt & Security**:
   - Missing Rate Limiter on API registration routes.
   - Removing internal debug stack traces in PROD backend JSON responses.
3. **Bot Protection**: Implement Honeypot and submission constraints on the survey and registration forms.

*Managed by Gemini (Antigravity).*


