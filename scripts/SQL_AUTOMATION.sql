-- ═══════════════════════════════════════════════════════════════════════════
-- ELVIA ADMIN: AUTOMATIZACIÓN DE NOTIFICACIONES DE SUSCRIPCIÓN (pg_cron)
-- ═══════════════════════════════════════════════════════════════════════════
-- Ejecutar en Supabase (SQL Editor)
-- Requiere: Extensión 'pg_cron'

CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.check_expiring_subscriptions()
RETURNS void AS $$
BEGIN
  -- Lógica: Buscar planes no-gratuitos que vencen en 3 días o 1 día
  FOR r IN 
    SELECT id, email_principal, plan, plan_expires_at 
    FROM public.profiles 
    WHERE plan != 'free' 
      AND suspended = false
      AND (
        plan_expires_at::date = (NOW() + INTERVAL '3 days')::date OR
        plan_expires_at::date = (NOW() + INTERVAL '1 day')::date
      )
  LOOP
    -- Aquí dispara el callback a Resend o similar vía Edge Function
    -- PERFORM net.http_post(...)
    RAISE NOTICE 'ALERTA: El plan % de % vence pronto', r.plan, r.email_principal;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Programar cada medianoche
SELECT cron.schedule(
  'notificador-vencimiento-diario',
  '0 0 * * *',
  'SELECT public.check_expiring_subscriptions()'
);
