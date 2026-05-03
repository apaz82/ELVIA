# OPTIMA-CV (ELVIA)
## Core Memory Ledger

### The Platform
OPTIMA-CV (ELVIA) is a dual-interface Human Resources & Career Optimization ecosystem tailored for LATAM logic.

### Architectural Nuances
- **Backend**: Express + Node.js (via `backend/src`). Relies on **Supabase** (v2 JS SDK). AI heavy via `claude-sonnet-4-6` (creative/writing) and `claude-haiku-4-5` (extraction/fast response).
- **Frontend**: Vite + React + TailwindCSS. Using local context, `sessionStorage` strict caching, and PhosphorIcons.
- **Data Layers**: `profiles`, `cv_results`, `job_checks`, `saved_jobs`, `administrators`, `linkedin_analyses`, and `waitlist_leads` (referral engine tracking).

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

### Crucial Directives
- **Performance**: Always use `sessionStorage` caching (e.g., `vacante_prefill`, `entrevista_prefill`).
- **Security**: Admin restricted to `administrators` table. Superadmin: `Superadmin@elvia.lat`.
- **Identity Enforcement**: `extractProfile` prevents unauthorized scraping of 3rd party CVs by matching name/email.
- **Shell Consistency**: **Windows PowerShell**. Use `;` for chain-commands.

*Log automatically updated by Antigravity on 2026-05-03 13:25.*


