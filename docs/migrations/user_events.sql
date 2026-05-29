-- Tabla de eventos de usuario para tracking de actividad
-- Correr en Supabase Studio → SQL Editor

CREATE TABLE IF NOT EXISTS user_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  event         text NOT NULL,          -- 'page_view' | 'feature_used' | 'pilar_saved' | 'doc_generated'
  feature       text,                   -- 'linkedin_pro' | 'entrevista' | 'cvvsjob' | 'cv_optimizer' | etc.
  page          text,                   -- ruta de la página
  metadata      jsonb DEFAULT '{}',     -- datos extra (pilar, subtipo, score, etc.)
  created_at    timestamptz DEFAULT now()
);

-- Índices para queries del admin
CREATE INDEX IF NOT EXISTS idx_user_events_user_id    ON user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_created_at ON user_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_events_feature    ON user_events(feature);

-- RLS: cada usuario solo puede insertar sus propios eventos
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios insertan sus eventos"
  ON user_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- El admin (anon key con service role desde backend) puede leer todo
CREATE POLICY "admin lee todos los eventos"
  ON user_events FOR SELECT
  TO authenticated
  USING (true);
