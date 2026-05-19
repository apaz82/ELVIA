-- Migration 009: Seed tenant Tecnológico de Monterrey
-- Correr en Supabase Studio → SQL Editor
-- Idempotente: ON CONFLICT (slug) DO UPDATE

INSERT INTO companies (
  name, slug, sector, country, plan, is_active,
  logo_url, primary_color, secondary_color, accent_color,
  hero_title, hero_subtitle, welcome_message,
  contact_email, support_email,
  allowed_email_domain, require_invite, require_allowlist,
  show_pricing, data_region
)
VALUES (
  'Tecnológico de Monterrey',
  'tec-monterrey',
  'university',
  'MX',
  'university',
  true,
  '/LOGOS/tecnologico-de-monterrey-blue.svg',
  '#003865',
  '#C8A951',
  '#4A90C4',
  'Tu carrera profesional empieza aquí',
  'Programa de empleabilidad para egresados del Tecnológico de Monterrey — operado por ELVIA®.',
  'Bienvenido al Programa de Empleabilidad del Tec. Tu perfil, avances y documentos son estrictamente confidenciales; tu institución solo recibe métricas agregadas y anónimas del programa.',
  'empleabilidad@tec.mx',
  'soporte@elvia.lat',
  NULL,
  false,
  false,
  false,
  'us-east-1'
)
ON CONFLICT (slug) DO UPDATE SET
  name             = EXCLUDED.name,
  sector           = EXCLUDED.sector,
  country          = EXCLUDED.country,
  plan             = EXCLUDED.plan,
  is_active        = EXCLUDED.is_active,
  logo_url         = EXCLUDED.logo_url,
  primary_color    = EXCLUDED.primary_color,
  secondary_color  = EXCLUDED.secondary_color,
  accent_color     = EXCLUDED.accent_color,
  hero_title       = EXCLUDED.hero_title,
  hero_subtitle    = EXCLUDED.hero_subtitle,
  welcome_message  = EXCLUDED.welcome_message,
  contact_email    = EXCLUDED.contact_email,
  support_email    = EXCLUDED.support_email,
  allowed_email_domain = EXCLUDED.allowed_email_domain,
  require_invite   = EXCLUDED.require_invite,
  require_allowlist = EXCLUDED.require_allowlist,
  show_pricing     = EXCLUDED.show_pricing,
  data_region      = EXCLUDED.data_region;

-- FIN MIGRATION 009
