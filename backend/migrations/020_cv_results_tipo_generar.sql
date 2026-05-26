-- Migration 020: Agregar 'generar' al CHECK constraint de cv_results.tipo
-- cvGenerarController guarda tipo='generar' (antes 'desde_cero').
-- Este script busca y elimina cualquier CHECK sobre la columna tipo,
-- luego re-crea el constraint con el valor nuevo incluido.

BEGIN;

DO $$
DECLARE
  v_constraint text;
BEGIN
  SELECT conname INTO v_constraint
  FROM pg_constraint
  WHERE conrelid = 'public.cv_results'::regclass
    AND contype   = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%tipo%';

  IF v_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.cv_results DROP CONSTRAINT %I', v_constraint);
    RAISE NOTICE 'Dropped old tipo constraint: %', v_constraint;
  END IF;
END;
$$;

-- Asegurar que el constraint con el nombre canónico no exista antes de añadirlo
ALTER TABLE public.cv_results
  DROP CONSTRAINT IF EXISTS cv_results_tipo_check;

ALTER TABLE public.cv_results
  ADD CONSTRAINT cv_results_tipo_check
  CHECK (tipo IN ('original', 'optimize', 'match', 'generar'));

COMMENT ON CONSTRAINT cv_results_tipo_check ON public.cv_results IS
  'Valores válidos para tipo: original (upload), optimize (ATS), match (vacante), generar (desde formulario)';

COMMIT;
