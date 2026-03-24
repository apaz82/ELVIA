# OPTIMA-CV — CLAUDE.md

## Descripción del producto
SaaS de optimización de CV para profesionales en transición laboral en LATAM.
Mercados: México, Colombia, Argentina, USA hispanohablante.

## Páginas del MVP

### Página 1 — CV Optimizer
- Upload de CV (PDF o Word)
- Análisis con Claude API
- Salida: CV optimizada en formato Harvard
- Detalle de optimizaciones realizadas
- Recomendaciones sin bias
- Selección de idioma de salida (default: idioma del CV)
- Descarga en Word o PDF
- Campo de email para reenvío

### Página 2 — CV vs Vacante
- Upload de CV (o usar la del paso 1)
- Campo para pegar link o descripción de vacante
- Detección automática de idioma
- CV optimizada para la vacante específica
- % de accuracy / match
- Selección de idioma de salida
- Descarga en Word o PDF
- Campo de email para reenvío

### Página 3 — Vacantes Similares
- Basado en la vacante analizada en Página 2
- Detecta cargo, ubicación y país
- Busca vacantes similares via Jooble API
- Presenta resultados con link directo

### Página 4 — Auth y Admin
- Registro e inicio de sesión
- Panel de administrador
- Control de uso freemium (2 análisis gratis)

## Modelo de negocio
- Páginas 1 y 2: 2 usos gratuitos, luego pago
- Registro requerido para guardar historial

## Stack técnico
- Frontend: React + Tailwind CSS
- Backend: Node.js + Express
- Base de datos: Supabase (PostgreSQL)
- Auth: Supabase Auth
- IA: Claude API (claude-sonnet-4-6)
- Vacantes: Jooble API (gratis)
- PDF: pdf-lib
- Word: docx
- Email: Resend (gratis hasta 3000/mes)
- Deploy: Netlify (frontend) + Railway (backend)

## Reglas de desarrollo
- Planifica antes de codear — siempre
- Sin bias en análisis de CV
- No inventar información — solo optimizar lo que existe
- Mejores prácticas del mercado laboral
- Mobile-first
- Comentarios en español
- Código limpio y modular

## Principios de análisis de CV
- Solo optimizar información existente, nunca inventar
- Formato Harvard estándar
- Lenguaje de impacto con verbos de acción
- Cuantificar logros cuando los datos estén presentes
- Sin discriminación por edad, género, origen

## Variables de entorno necesarias
ANTHROPIC_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
JOOBLE_API_KEY=
RESEND_API_KEY=
