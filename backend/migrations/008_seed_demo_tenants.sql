-- Migration 008: Seed demo tenants (Telefonica + Universidad Innova).
-- Estos tenants se usaran en los demos del 19 y 20 de mayo.
-- Idempotente: si los tenants ya existen, solo actualiza campos de branding.

-- 1. Telefonica — demo del miercoles 20 mayo

INSERT INTO companies (
  name, slug, sector, country, plan, is_active,
  logo_url, primary_color, secondary_color, accent_color,
  hero_title, hero_subtitle, welcome_message,
  contact_email, support_email,
  allowed_email_domain, require_invite,
  show_pricing, data_region
)
VALUES (
  'Telefónica',
  'telefonica',
  'corporate',
  'ES',
  'enterprise',
  true,
  '/LOGOS/LOGOTELEFONICAAZUL.webp',
  '#019DF4',  -- Telefonica vivid blue (oficial)
  '#0B2A6B',  -- Telefonica deep blue
  '#5BC2E7',  -- Telefonica light cyan
  'Tu próximo capítulo profesional',
  'Programa de transición y desarrollo de carrera para colaboradores de Telefónica — operado por ELVIA®.',
  'Bienvenido al programa exclusivo de Telefónica × ELVIA. Tu información es estrictamente confidencial; tu organización solo recibe métricas agregadas y anónimas del programa.',
  'rrhh@telefonica.com',
  'soporte@elvia.lat',
  NULL,  -- demo-friendly: cualquier email; en produccion poner 'telefonica.com'
  false,
  false,
  'eu-west-1'
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
  show_pricing     = EXCLUDED.show_pricing,
  data_region      = EXCLUDED.data_region;

-- 2. Universidad demo — demo del martes 19 mayo. Nombre generico.

INSERT INTO companies (
  name, slug, sector, country, plan, is_active,
  logo_url,
  primary_color, secondary_color, accent_color,
  hero_title, hero_subtitle, welcome_message,
  contact_email, support_email,
  allowed_email_domain, require_invite,
  show_pricing, data_region
)
VALUES (
  'Universidad Innova',
  'universidad-innova',
  'university',
  'MX',
  'university',
  true,
  '/LOGOS/universidad-innova.svg',
  '#7C2D12',
  '#1C1917',
  '#FB923C',
  'De la universidad al primer empleo',
  'Programa de empleabilidad para egresados de Universidad Innova — operado por ELVIA®.',
  'Bienvenido al programa de empleabilidad. Te acompañaremos en tu transición de la vida universitaria al mercado laboral con mentores, herramientas IA y métricas de progreso.',
  'empleabilidad@universidad-innova.edu',
  'soporte@elvia.lat',
  'universidad-innova.edu',
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
  show_pricing     = EXCLUDED.show_pricing,
  data_region      = EXCLUDED.data_region;

-- FIN MIGRATION 008
