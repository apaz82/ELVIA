-- RPC: increment_daily_cap
-- Hace check + insert + increment en una sola transacción (sin race condition).
-- Retorna: allowed (bool), current_count (int), max_count (int)
-- EJECUTAR en Supabase SQL Editor antes de deployar el fix de CRIT-3.

CREATE OR REPLACE FUNCTION increment_daily_cap(p_date date)
RETURNS TABLE (allowed boolean, current_count integer, max_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count  integer;
  v_max    integer;
BEGIN
  -- Crear registro del día si no existe
  INSERT INTO daily_usage_cap (date, analyses_count, max_daily_analyses)
  VALUES (p_date, 0, 100)
  ON CONFLICT (date) DO NOTHING;

  -- Intentar incremento atómico solo si no se alcanzó el cap
  UPDATE daily_usage_cap
  SET    analyses_count = analyses_count + 1
  WHERE  date = p_date
    AND  analyses_count < max_daily_analyses
  RETURNING analyses_count, max_daily_analyses INTO v_count, v_max;

  IF v_count IS NULL THEN
    -- No se actualizó ninguna fila: cap alcanzado
    SELECT analyses_count, max_daily_analyses
    INTO   v_count, v_max
    FROM   daily_usage_cap
    WHERE  date = p_date;

    RETURN QUERY SELECT false, v_count, v_max;
  ELSE
    RETURN QUERY SELECT true, v_count, v_max;
  END IF;
END;
$$;
