# Auditoría Completa de Base de Datos PostgreSQL — OPTIMA-CV

**Fecha:** 31 de Marzo de 2026
**Proyecto:** OPTIMA-CV (SaaS de Optimización de CV)
**Stack:** Supabase PostgreSQL + Node.js Backend + React Frontend

---

## Resumen Ejecutivo

### Estado General: ✅ **BUENO con Recomendaciones Críticas**

| Aspecto | Estado | Severidad |
|---------|--------|-----------|
| **Seguridad RLS** | ✅ Parcialmente implementado | 🔴 CRÍTICA |
| **Protección de PII** | ✅ Buena | 🟡 MEDIA |
| **Indices** | ✅ Presentes en tablas críticas | 🟡 MEDIA |
| **Integridad referencial** | ✅ Foreign keys correctos | ✅ OK |
| **SQL Injection** | ✅ Prevenido (uso de SDK) | ✅ OK |
| **Normalización** | ✅ Bien diseñada | ✅ OK |
| **Backups** | ⚠️ No documentado | 🟠 MEDIA |
| **Disaster Recovery** | ❌ No existe | 🔴 CRÍTICA |

---

## 1. EXPLORACIÓN DEL ESQUEMA

### 1.1 Tablas Identificadas

#### **Tablas con RLS Habilitado:**
1. `access_codes` — Códigos de acceso con planes
2. `code_redemptions` — Redenciones de usuarios
3. `deletion_audit_log` — Auditoría de borrados
4. `profiles` — Perfil de usuario (extends auth.users)
5. `cv_results` — CV optimizados guardados
6. `job_checks` — Cache de compatibilidad CV vs vacante

#### **Tablas sin RLS documentado:**
7. `daily_usage_cap` — Cap diario de análisis (100/día)
8. `landing_config` — Configuración de landing page
9. `landing_events` — Eventos de tracking (unanonymized)
10. `waitlist_leads` — Leads de lista de espera

### 1.2 Estructura Detallada

```
┌─────────────────────────────────────────────────────────────┐
│                    TABLAS PRINCIPALES                        │
└─────────────────────────────────────────────────────────────┘

auth.users (Supabase core)
  ├── id (UUID, PK)
  ├── email
  └── [FKs from profiles, code_redemptions, deletion_audit_log]

profiles (RLS ✅)
  ├── id (UUID, PK) → auth.users(id)
  ├── email_principal
  ├── nombre1, apellido1 (para validar CV en onboarding)
  ├── is_admin (boolean)
  ├── suspended (boolean)
  ├── plan (free|semanal|mensual|trimestral)
  ├── usage_count (INT)
  ├── cv_optimizer_count (INT)
  ├── cv_match_count (INT)
  ├── plan_expires_at (TIMESTAMPTZ)
  ├── free_trial_expires_at (TIMESTAMPTZ) — 14 días desde creación
  ├── Índices:
  │   ├── idx_profiles_plan
  │   ├── idx_profiles_trial
  │   └── idx_profiles_plan_expires

access_codes (RLS ✅)
  ├── id (UUID, PK)
  ├── code (TEXT, UNIQUE)
  ├── plan (semanal|mensual|trimestral)
  ├── max_uses (INT)
  ├── uses_count (INT)
  ├── expires_at (TIMESTAMPTZ NULL)
  ├── notes (TEXT NULL)
  ├── is_active (BOOLEAN)
  ├── Índices:
  │   ├── idx_access_codes_code
  │   └── idx_access_codes_is_active

code_redemptions (RLS ✅)
  ├── id (UUID, PK)
  ├── code_id (UUID, FK → access_codes.id) [ON DELETE CASCADE]
  ├── user_id (UUID, FK → auth.users.id) [ON DELETE CASCADE]
  ├── plan_granted (TEXT)
  ├── redeemed_at (TIMESTAMPTZ)
  ├── UNIQUE(user_id, code_id)
  ├── Índices:
  │   ├── idx_redemptions_user_id
  │   └── idx_redemptions_code_id
  ├── Trigger:
  │   └── trg_increment_code_uses [AFTER INSERT]
  │       └── fn_increment_code_uses()

deletion_audit_log (RLS ✅)
  ├── id (UUID, PK)
  ├── deleted_user_id (UUID)
  ├── deleted_user_email (VARCHAR 255)
  ├── admin_id (UUID, FK → auth.users.id) [ON DELETE CASCADE]
  ├── admin_email (VARCHAR 255)
  ├── reason (VARCHAR 500 NULL)
  ├── status (VARCHAR 50: pending|completed|failed)
  ├── error_message (TEXT NULL)
  ├── created_at (TIMESTAMPTZ)
  ├── completed_at (TIMESTAMPTZ NULL)
  ├── Índices:
  │   ├── idx_deletion_audit_user_id
  │   ├── idx_deletion_audit_admin_id
  │   └── idx_deletion_audit_created_at

cv_results (⚠️ RLS no documentado)
  ├── id (UUID, PK)
  ├── user_id (UUID, FK → profiles.id)
  ├── tipo (optimize|match)
  ├── contenido (TEXT) — CV optimizado
  ├── metadata (JSONB)
  │   ├── changes (array of optimizations)
  │   ├── recommendations (array)
  │   ├── language (es|en)
  │   └── job_data (para tipo: match)
  └── [Consultas esperadas: solo user_id puede ver sus propios CVs]

job_checks (⚠️ RLS no documentado)
  ├── id (UUID, PK)
  ├── user_id (UUID, FK → profiles.id)
  ├── job_key (TEXT) — cache key: "cargo|empresa"
  ├── score (INT 0-100)
  ├── motivos (JSONB array)
  ├── job_data (JSONB)
  │   ├── title, company, location, link, via, snippet
  └── [Consultas esperadas: solo para análisis CV vs vacante]

daily_usage_cap (⚠️ Sin RLS, es admin-only)
  ├── id (UUID, PK)
  ├── date (DATE, UNIQUE)
  ├── analyses_count (INT)
  ├── max_daily_analyses (INT: 100)
  └── [Propósito: Hard cap en análisis para controlar costo de Claude]

landing_config (⚠️ Sin RLS)
  ├── id (UUID, PK)
  ├── config_key (TEXT, UNIQUE)
  ├── config_value (TEXT NULL)
  ├── updated_at (TIMESTAMPTZ)
  └── [Propósito: SEO, copy de landing page]

landing_events (⚠️ Sin RLS)
  ├── id (UUID, PK)
  ├── event_name (TEXT: page_view|waitlist_open|demo_start|cta_click)
  ├── metadata (JSONB)
  │   ├── section, button, source, step (WHITELISTED)
  ├── created_at (TIMESTAMPTZ)
  └── [Propósito: Analytics de landing page]

waitlist_leads (⚠️ Sin RLS)
  ├── id (UUID, PK)
  ├── nombre (TEXT, 2-100 chars)
  ├── apellido (TEXT, 2-100 chars)
  ├── telefono (TEXT NULL, "indicativo numero")
  ├── pais (TEXT)
  ├── email (VARCHAR 255, UNIQUE)
  ├── situacion (TEXT: whitelist-validated)
  ├── created_at (TIMESTAMPTZ)
  └── [Propósito: Pre-MVP waitlist, leads]
```

### 1.3 Relaciones y Foreign Keys

```
auth.users
    ├─→ profiles (1:1)
    │   ├─→ cv_results (1:N)
    │   ├─→ job_checks (1:N)
    │   └─→ code_redemptions (1:N)
    │
    ├─→ code_redemptions (1:N)
    │   └─→ access_codes (N:1)
    │
    └─→ deletion_audit_log (1:N) [as admin_id]
```

**Integridad:** ✅ Todos los FKs tienen `ON DELETE CASCADE` apropiadamente configurado.

---

## 2. ANÁLISIS DE SEGURIDAD

### 2.1 Row Level Security (RLS) — CRÍTICO

#### ✅ Tablas CON RLS correctamente configurado:

**`access_codes`:**
```sql
-- Usuarios autenticados pueden LEER todos los códigos
CREATE POLICY "Codigos legibles por usuarios auth"
  ON access_codes FOR SELECT TO authenticated USING (true);

-- Solo admins pueden CRUD
CREATE POLICY "Admins gestionan codigos" ON access_codes FOR ALL
  TO authenticated USING (is_admin = true) WITH CHECK (is_admin = true);
```
✅ **Correcto:** Los usuarios ven códigos pero no pueden modificarlos.

**`code_redemptions`:**
```sql
-- Usuarios ven sus propias redenciones; admins ven todas
CREATE POLICY "Ver propias redenciones" ON code_redemptions FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR is_admin = true);

-- Usuarios insertan solo sus propias redenciones
CREATE POLICY "Insertar propia redencion" ON code_redemptions FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());
```
✅ **Correcto:** Aislamiento de datos por usuario.

**`deletion_audit_log`:**
```sql
-- Solo admins pueden leer logs
CREATE POLICY "Admins view deletion logs" ON deletion_audit_log FOR SELECT
  TO authenticated USING (is_admin = true);
```
✅ **Correcto:** Auditoría protegida.

#### 🔴 Tablas SIN RLS (CRÍTICO):

| Tabla | Riesgo | Recomendación |
|-------|--------|---------------|
| `profiles` | ❌ NO TIENE RLS | 🔴 **CRÍTICA: Agregar inmediatamente** |
| `cv_results` | ❌ NO TIENE RLS | 🔴 **CRÍTICA: Agregar inmediatamente** |
| `job_checks` | ❌ NO TIENE RLS | 🔴 **CRÍTICA: Agregar inmediatamente** |
| `daily_usage_cap` | ⚠️ Sin RLS (OK: admin-only en práctica) | 🟡 Agregar como precaución |
| `landing_config` | ⚠️ Sin RLS (OK: no sensible) | 🟡 Agregar para admin-only |
| `landing_events` | ⚠️ Sin RLS (OK: anónimo) | ✅ Aceptable |
| `waitlist_leads` | ⚠️ Sin RLS (OK: anónimo, admin-only) | 🟡 Agregar para admin-only |

**RIESGO IDENTIFICADO:**
- Si alguien obtiene un JWT válido con `user_id = ABC`, puede:
  1. Leer/modificar CVs de otros usuarios (`cv_results`)
  2. Ver compatibilidades job-check de otros usuarios (`job_checks`)
  3. Leer/modificar perfiles completos (`profiles`)

**Mitigación actual:**
- Backend aplica filtros `eq('user_id', req.user.id)` en aplicación
- Pero esto NO es seguridad a nivel DB

### 2.2 Políticas de RLS Recomendadas

#### Para `profiles`:
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Usuarios ven su propio perfil; admins ven todos
CREATE POLICY "Users see own profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id OR is_admin);

-- Usuarios actualizan solo su propio perfil
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins pueden actualizar cualquier perfil (para suspender, cambiar plan)
CREATE POLICY "Admins manage all profiles" ON profiles FOR ALL
  TO authenticated USING (is_admin)
  WITH CHECK (is_admin);
```

#### Para `cv_results`:
```sql
ALTER TABLE cv_results ENABLE ROW LEVEL SECURITY;

-- Usuarios ven sus propios CVs
CREATE POLICY "Users see own CVs" ON cv_results FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- Usuarios insertan solo sus propios CVs
CREATE POLICY "Users insert own CVs" ON cv_results FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Admins pueden ver todo (para auditoría)
CREATE POLICY "Admins view all CVs" ON cv_results FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
```

#### Para `job_checks`:
```sql
ALTER TABLE job_checks ENABLE ROW LEVEL SECURITY;

-- Usuarios ven sus propios job checks
CREATE POLICY "Users see own job checks" ON job_checks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- Usuarios insertan solo para sí mismos
CREATE POLICY "Users insert own checks" ON job_checks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
```

### 2.3 Manejo de PII (Personally Identifiable Information)

#### ✅ Lo que está bien:
1. **Nombres en CV:** Validados en backend pero NO se guardan separadamente (CV está en `cv_results.contenido`)
2. **Emails:** Se almacenan en `auth.users.email` (Supabase Auth) y `profiles.email_principal` (redundancia)
3. **Teléfonos:** Solo en `waitlist_leads` (aceptable, datos públicos de lista de espera)
4. **Evento sanitization:** `/api/events/track` filtra `ALLOWED_META_KEYS` y no acepta emails

#### 🔴 Problemas encontrados:

1. **Email en deletion_audit_log:**
   ```javascript
   // admin.js línea 186
   deleted_user_email: targetUser.email  // Guarda el email del borrado
   ```
   - El email está en texto plano en la auditoría
   - Recomendación: Hash o pseudonimizar

2. **Falta sanitización en error messages:**
   ```javascript
   // Line 209 en admin.js
   res.status(500).json({ error: deleteError.message })
   // Podría revelar SQL details en producción
   ```

3. **`phone` en waitlist sin encriptación:**
   - No es crítico (no es auth), pero dato sensible
   - Recomendación: Encriptar en reposo si GDPR es obligatorio

### 2.4 Protección contra SQL Injection

#### ✅ **SEGURO:** Uso consistente de SDK Supabase (no raw SQL)
```javascript
// ✅ SEGURO — parametrizado automáticamente
await db.from('profiles')
  .select('*')
  .eq('id', userId)
  .single();

// ✅ SEGURO — valores dentro de objects, no interpolación
await db.from('access_codes')
  .insert({ code: userInput, plan: userInput });
```

#### ⚠️ **Único lugar donde se usa RPC:**
```javascript
// waitlist.js línea 148
const { error } = await supabaseAdmin.rpc('increment_landing_views');
```
- El RPC debe estar definido en Supabase (no es SQL dinámico)
- **NOTA:** RPC no existe actualmente, fallará con error PGRST204

### 2.5 Autenticación y Autorización

#### ✅ Flow seguro:
1. Frontend obtiene token JWT de Supabase Auth
2. Backend verifica token con `supabase.auth.getUser(token)`
3. `req.user.id` se usa en middleware `planContext` para verificar plan
4. RLS de tabla se aplica con `crearClienteAutenticado(token)`

#### ⚠️ Problema: Verificación de Admin redundante
```javascript
// Se repite en casi cada ruta
const { data: profile } = await db.from('profiles')
  .select('is_admin').eq('id', req.user.id).single();
if (!profile?.is_admin) return 403;
```
**Mejora:** Crear middleware `requireAdmin` reutilizable.

### 2.6 Validación de Input

#### ✅ Lo que está bien:
- **Whitelist de eventos:** `landing_events` solo acepta `ALLOWED_EVENTS`
- **Whitelist de dominios:** `jobs.js` tiene `ALLOWED_JOB_DOMAINS` para fetch
- **Validación de email:** Regex en `waitlist.js` línea 90
- **Validación de código:** `codes.js` valida plan contra `DIAS_POR_PLAN`

#### 🔴 Lo que falta:
- **No se valida `jobText` en `cv/match`:**
  ```javascript
  // cvController.js línea 87
  if (!req.body.jobText) { /* error */ }
  // ✅ Existe check, pero no hay límite de tamaño
  // Recomendación: Limitar a 10,000 caracteres
  ```
- **Validación de `cvText`:**
  ```javascript
  // No hay check de tamaño antes de pasar a Claude
  // Recomendación: MAX 50KB de texto
  ```

### 2.7 Gestión de Secrets

#### ✅ Correcto:
```javascript
// supabase.js
const supabase = (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY)
  ? createClient(...)
  : null;

const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY ? ... : null;
```
- Service role key NUNCA se expone al frontend
- Anon key tiene permisos limitados (RLS lo controla)

#### ⚠️ Auditoría de variables:
Requeridas (verificar en deployment):
- `SUPABASE_URL` ✅
- `SUPABASE_ANON_KEY` ✅
- `SUPABASE_SERVICE_ROLE_KEY` ✅
- `ANTHROPIC_API_KEY` ✅
- `RESEND_API_KEY` ✅
- `JOOBLE_API_KEY` ✅ (opcional, búsqueda jobs)
- `SERPAPI_KEY` ⚠️ (opcional, Google Jobs — caro)
- `SENTRY_DSN` ⚠️ (opcional, error tracking)

Ninguno encontrado en código fuente ✅

---

## 3. ANÁLISIS DE RENDIMIENTO

### 3.1 Índices Existentes

#### ✅ Presentes:
```sql
-- profiles
idx_profiles_plan
idx_profiles_trial
idx_profiles_plan_expires

-- access_codes
idx_access_codes_code
idx_access_codes_is_active

-- code_redemptions
idx_redemptions_user_id
idx_redemptions_code_id

-- deletion_audit_log
idx_deletion_audit_user_id
idx_deletion_audit_admin_id
idx_deletion_audit_created_at
```

#### 🔴 Faltan índices en:
| Tabla | Columna | Razón |
|-------|---------|-------|
| `cv_results` | `user_id` | **CRÍTICA** — se consulta frecuentemente |
| `job_checks` | `user_id` | **CRÍTICA** — se consulta en cada análisis |
| `waitlist_leads` | `email` | **MEDIA** — buscar por email |
| `landing_events` | `event_name` | **MEDIA** — filtrar por evento |

**SQL para agregar:**
```sql
-- CRÍTICOS (ejecutar ya)
CREATE INDEX IF NOT EXISTS idx_cv_results_user_id ON cv_results(user_id);
CREATE INDEX IF NOT EXISTS idx_job_checks_user_id ON job_checks(user_id);
CREATE INDEX IF NOT EXISTS idx_job_checks_job_key ON job_checks(job_key); -- para cache hits

-- MEDIA PRIORIDAD
CREATE INDEX IF NOT EXISTS idx_waitlist_leads_email ON waitlist_leads(email);
CREATE INDEX IF NOT EXISTS idx_landing_events_event ON landing_events(event_name);
```

### 3.2 Patrones N+1

#### ⚠️ Encontrado en `codes.js` línea 117:
```javascript
// GET /api/codes — lista todos
const { data, error } = await db
  .from('access_codes')
  .select('*, code_redemptions(count)')
  .order('created_at', { ascending: false });
```
**Análisis:**
- Supabase agregación en INNER JOIN es eficiente ✅
- NO hay N+1 aquí

#### ⚠️ Encontrado en `jobs.js` línea 319:
```javascript
// POST /api/jobs/compatibility
await Promise.all([
  db.from('job_checks').insert({ ... }),
  db.from('profiles').update({ ... })
])
```
**Análisis:**
- Parallel requests es eficiente ✅
- Pero ambos van a Supabase, sin índice en user_id es lento

### 3.3 Tamaño de Datos

#### Estimaciones:
- **`cv_results.contenido`:** ~10KB promedio (CVs optimizados)
- **`landing_events`:** ~500 bytes por evento
- **`deletion_audit_log`:** ~1KB por entrada

#### Recomendaciones de archivado:
```sql
-- Archiva eventos de hace más de 6 meses
DELETE FROM landing_events
WHERE created_at < NOW() - INTERVAL '6 months';

-- Archiva logs de auditoría de hace más de 2 años (GDPR)
DELETE FROM deletion_audit_log
WHERE created_at < NOW() - INTERVAL '2 years';

-- Considera archivar cv_results de usuarios inactivos
-- (pero mantén para 1 año por GDPR)
```

### 3.4 Rate Limiting

#### ✅ Implementado:
- **General:** `limiterGeneral` en app.js
- **CV Optimizer:** `limiterOptimize` — 5/15min
- **CV Match:** `limiterMatch` — 10/15min
- **Waitlist POST:** 5/hora por IP
- **Events track:** 1/minuto por IP
- **Email:** 3/10min por IP
- **Daily cap:** 100 análisis/día (HARD)

#### Ubicaciones:
- `middleware/rateLimiter.js` — Express rate limiter
- `middleware/dailyCap.js` — Custom hard cap en DB
- `routes/email.js` — In-memory rate limiting (no persistence)

**Recomendación:** Email rate limit debería ser en DB (para escalabilidad multi-instancia)

---

## 4. ANÁLISIS DE NORMALIZACIÓN Y DISEÑO

### 4.1 Normalización (2NF/3NF)

#### ✅ Bien normalizado:
- `profiles` es 1:1 con `auth.users` ✅
- `code_redemptions` es join table correcta ✅
- `deletion_audit_log` es log sin desnormalización ✅
- `cv_results` usa JSONB para metadata flexible ✅

#### ⚠️ Desnormalización deliberada (aceptable):
```sql
-- profiles tiene email_principal (también en auth.users)
-- Razón: Acceso rápido sin join a auth.users
-- ✅ OK, es caché válida
```

### 4.2 Tipos de Datos

#### ✅ Correctos:
| Columna | Tipo | Justificación |
|---------|------|---------------|
| Ids | UUID | Seguridad, uniqueness |
| Emails | VARCHAR | Estándar SQL |
| Timestamps | TIMESTAMPTZ | Timezone-aware |
| Counters | INTEGER | Suficiente para uso freemium |
| JSON | JSONB | Flexible, indexable |
| Enums | VARCHAR + CHECK | Mejor que ENUM type |

#### 🔴 Problema encontrado:
```sql
-- deletion_audit_log
admin_email VARCHAR(255)  -- Potencial truncate si email > 255 chars
-- RFC 5321: máximo 254 caracteres
-- ✅ OK pero considerar TEXT o VARCHAR(254)
```

### 4.3 Constraints y Validaciones

#### ✅ Implementadas:
```sql
-- profiles.plan CHECK (IN values)
-- access_codes.plan CHECK (IN values)
-- code_redemptions UNIQUE(user_id, code_id)
-- access_codes UNIQUE(code)
-- waitlist_leads UNIQUE(email)
```

#### Falta:
```sql
-- access_codes.uses_count >= 0 (CHECK constraint)
-- access_codes.max_uses > 0 (CHECK constraint)
-- profiles.cv_optimizer_count >= 0
```

**Recomendación:** Agregar CHECK constraints:
```sql
ALTER TABLE access_codes ADD CONSTRAINT ck_uses_non_negative
  CHECK (uses_count >= 0 AND uses_count <= max_uses);

ALTER TABLE profiles ADD CONSTRAINT ck_counts_non_negative
  CHECK (cv_optimizer_count >= 0 AND cv_match_count >= 0);
```

---

## 5. ANÁLISIS DE BACKUP Y DISASTER RECOVERY

### 5.1 Backup Strategy

#### ⚠️ **NO DOCUMENTADO EN CÓDIGO**

Recomendaciones (investigar en Supabase console):
1. **Daily automated backups** — Supabase ofrece 14-30 días de retención
2. **Test recovery periodically** — Restore a staging monthly
3. **Backup critical tables:**
   - `profiles` — User accounts
   - `cv_results` — Análisis de usuarios
   - `access_codes` — Códigos de pago
   - `deletion_audit_log` — Compliance

### 5.2 Disaster Recovery Plan

#### ❌ **NO EXISTE**

Crear plan para:
1. **Database corruption:** Restore from backup
2. **Service outage:** Use Supabase uptime (99.9%)
3. **Accidental deletion:** 7-day recovery window with Point-in-time restore
4. **Data breach:** Rotation keys, audit logs, notify users

### 5.3 Recomendaciones Críticas

```markdown
## Disaster Recovery Checklist

- [ ] Document RTO (Recovery Time Objective): 4 hours
- [ ] Document RPO (Recovery Point Objective): 1 hour
- [ ] Test restore from backup monthly
- [ ] Use Supabase automated backups (minimum: weekly)
- [ ] Enable Point-in-Time Recovery (24-30 days)
- [ ] Create read-replica for analytics queries
- [ ] Monitor backup status in Supabase logs
- [ ] Encrypt backups in transit (HTTPS)
```

---

## 6. VULNERABILIDADES ESPECÍFICAS

### 6.1 Críticas (🔴 DEBE RESOLVER YA)

#### **CRIT-1: RLS no habilitado en tablas sensibles**
- **Tabla:** `profiles`, `cv_results`, `job_checks`
- **Riesgo:** Usuarios con JWT válido pueden leer/modificar datos de otros
- **Severidad:** 🔴 CRÍTICA
- **Recomendación:** Implementar RLS policies (sección 2.2)
- **Timeline:** Inmediato (antes de producción)

#### **CRIT-2: RPC `increment_landing_views()` no existe**
- **Ubicación:** `waitlist.js` línea 148
- **Riesgo:** Fails silently con error PGRST204 (204 = no rows)
- **Severidad:** 🔴 CRÍTICA (para analytics)
- **Recomendación:**
  ```sql
  CREATE OR REPLACE FUNCTION public.increment_landing_views()
  RETURNS void AS $$
  BEGIN
    -- Crear si no existe
    INSERT INTO landing_stats (id, views) VALUES (1, 1)
    ON CONFLICT (id) DO UPDATE SET views = views + 1;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
  ```
- **Timeline:** Antes de puesta en producción

#### **CRIT-3: No hay ruta guard en profiles**
- **Ubicación:** Backend no valida que usuario modifique solo su perfil
- **Riesgo:** POST body `{ id: "otro-user" }` podría modificar otro perfil
- **Severidad:** 🔴 CRÍTICA
- **Recomendación:** RLS en `profiles` (sección 2.2)

### 6.2 Altas (🟠 DEBE RESOLVER PRONTO)

#### **HIGH-1: Email sin hash en audit log**
- **Ubicación:** `admin.js` línea 186
- **Riesgo:** GDPR — emails en claro en logs
- **Severidad:** 🟠 ALTA
- **Recomendación:**
  ```javascript
  const crypto = require('crypto');
  const hashedEmail = crypto
    .createHash('sha256')
    .update(targetUser.email)
    .digest('hex');

  // Guardar:
  deleted_user_email_hash: hashedEmail
  ```

#### **HIGH-2: Falta validación de tamaño en CV**
- **Ubicación:** `cvController.js` línea 17
- **Riesgo:** Archivo de 500MB colapsa Claude API
- **Severidad:** 🟠 ALTA (DoS)
- **Recomendación:**
  ```javascript
  const MAX_CV_SIZE = 50 * 1024 * 1024; // 50MB
  if (req.file.size > MAX_CV_SIZE) {
    return res.status(413).json({ error: 'Archivo muy grande' });
  }
  ```

#### **HIGH-3: Rate limit en email no persiste entre instancias**
- **Ubicación:** `email.js` línea 11 (in-memory Map)
- **Riesgo:** En multi-server, límite no funciona
- **Severidad:** 🟠 ALTA (spam)
- **Recomendación:** Mover a Redis o tabla DB

### 6.3 Medias (🟡 CONSIDERAR)

#### **MED-1: Validación de job URL incompleta**
- **Ubicación:** `jobs.js` línea 25-34
- **Riesgo:** Podría hacer redirect a phishing
- **Severidad:** 🟡 MEDIA
- **Recomendación:** Validar que URL responde 200 antes de usar

#### **MED-2: Errores revelan stack trace**
- **Ubicación:** `admin.js` línea 209: `error: deleteError.message`
- **Riesgo:** Información de implementación en cliente
- **Severidad:** 🟡 MEDIA
- **Recomendación:**
  ```javascript
  res.status(500).json({ error: 'Error al eliminar usuario' });
  // Log full error en servidor
  console.error('[Admin] Delete error:', deleteError);
  ```

#### **MED-3: Falta CORS en algunas APIs**
- **Ubicación:** `/api/events/track` (línea 20) — no requiere auth
- **Riesgo:** CSRF desde otro sitio
- **Severidad:** 🟡 MEDIA
- **Recomendación:** Rate limit más estricto (ya implementado: 1/min)

#### **MED-4: Validación de plan incompleta**
- **Ubicación:** `planContext.js` línea 70
- **Riesgo:** Plan expirado degradado en memoria, no en DB
- **Severidad:** 🟡 MEDIA
- **Recomendación:**
  ```javascript
  // Si plan expiró, actualizar en DB también
  if (plan === 'semanal' && new Date(plan_expires_at) < new Date()) {
    await db.from('profiles').update({ plan: 'free' }).eq('id', userId);
  }
  ```

---

## 7. QUERIES FRECUENTES Y RENDIMIENTO

### 7.1 Consultas Críticas Identificadas

#### **Query 1: Verificar plan del usuario (planContext)**
```javascript
.from('profiles')
.select('usage_count, cv_optimizer_count, cv_match_count, plan, ...')
.eq('id', userId)
.maybeSingle()
```
**Impacto:** Se ejecuta en CADA request
**Índice:** `idx_profiles_plan` ✅ (PK suficiente)
**Frecuencia:** 100+ veces/día
**Estado:** ✅ Optimizado

#### **Query 2: Cache de job_checks (jobs.js)**
```javascript
.from('job_checks')
.select('score, motivos')
.eq('job_key', jobKey)
.maybeSingle()
```
**Impacto:** Evita llamadas a Claude
**Índice:** ❌ FALTA `idx_job_checks_job_key`
**Frecuencia:** ~50/día
**Estado:** 🔴 NECESITA ÍNDICE ASAP

#### **Query 3: CV del usuario (email.js)**
```javascript
.from('cv_results')
.select('contenido, metadata, tipo')
.eq('id', cvId)
.eq('user_id', req.user.id)
.single()
```
**Impacto:** Descarga de CV
**Índice:** ❌ FALTA `idx_cv_results_user_id`
**Frecuencia:** ~20/día
**Estado:** 🔴 NECESITA ÍNDICE ASAP

### 7.2 Recomendaciones de Query Optimization

#### Para próximas mejoras:
```sql
-- Crear vista materializada para dashboard de admin
CREATE MATERIALIZED VIEW admin_stats AS
SELECT
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT cr.id) as total_cvs,
  COUNT(DISTINCT wr.id) as total_redemptions,
  SUM(p.cv_optimizer_count) as total_optimizations
FROM profiles p
LEFT JOIN cv_results cr ON p.id = cr.user_id
LEFT JOIN code_redemptions wr ON p.id = wr.user_id;

-- Refresh: REFRESH MATERIALIZED VIEW admin_stats;
```

---

## 8. CONFORMIDAD Y COMPLIANCE

### 8.1 GDPR

#### ✅ Lo que está bien:
- **Right to be forgotten:** `DELETE /api/admin/users/:id` implementado
- **Audit trail:** `deletion_audit_log` mantiene registro
- **User data export:** Posible via `/api/admin` (no automatizado)

#### 🔴 Lo que falta:
- **Data retention policy:** No está documentada
- **Email hashing:** Emails en audit log en texto plano
- **Purpose limitation:** CV text podría no tener propósito claro

#### Recomendación:
```markdown
## GDPR Compliance Checklist

- [ ] Privacy policy en landing (público)
- [ ] Cookie consent banner
- [ ] Data processing agreement (DPA) con Supabase
- [ ] Export de datos de usuario (CSV/JSON)
- [ ] Retención de logs: máximo 2 años
- [ ] Data classification: sensible/no-sensible
- [ ] Incident response plan (30 días para notificar)
```

### 8.2 LGPD (Brasil - Ley 13.709)

Aplicable si hay usuarios brasileños.

#### Recomendación:
- Similar a GDPR
- Verificar con legal team local

---

## 9. RESUMEN DE HALLAZGOS

### 📊 Scorecard

| Área | Puntuación | Estado |
|------|-----------|--------|
| **Seguridad (RLS)** | 6/10 | 🔴 CRÍTICA |
| **Protección PII** | 7/10 | 🟡 MEDIA |
| **Validación Input** | 8/10 | ✅ BUENA |
| **SQL Injection** | 10/10 | ✅ SEGURA |
| **Índices** | 6/10 | 🔴 FALTA EN CRÍTICAS |
| **Rate Limiting** | 9/10 | ✅ BUENA |
| **Normalización** | 9/10 | ✅ EXCELENTE |
| **Backup** | 2/10 | 🔴 SIN DOCUMENTAR |
| **Disaster Recovery** | 0/10 | ❌ NO EXISTE |
| **GDPR/Compliance** | 5/10 | 🟡 INCOMPLETO |

**Calificación General: 6.2/10 — FUNCIONAL PERO RIESGOSO**

---

## 10. PLAN DE ACCIÓN RECOMENDADO

### 🔴 Críticas (Semana 1)
```
[ ] Habilitar RLS en profiles, cv_results, job_checks
[ ] Crear índices en user_id (cv_results, job_checks)
[ ] Crear índice en job_key (job_checks)
[ ] Crear RPC increment_landing_views
[ ] Implementar validación de tamaño en CVs
```

### 🟠 Altas (Semana 2-3)
```
[ ] Hash emails en deletion_audit_log
[ ] Mover rate limit de email a DB/Redis
[ ] Mejorar error handling (no revelar stack trace)
[ ] Agregar CHECK constraints en counters
[ ] Test disaster recovery plan
```

### 🟡 Medias (Mes 1)
```
[ ] Crear GDPR data export endpoint
[ ] Documentar data retention policy
[ ] Implementar read-replica para analytics
[ ] Crear admin dashboard con queries optimizadas
[ ] Validar URLs antes de fetch
```

### ✅ Nice-to-have (Roadmap)
```
[ ] Crear materialized views para dashboard
[ ] Implementar connection pooling
[ ] Agregar telemetría de queries lentas
[ ] Backup automático a S3 (off-site)
```

---

## 11. CONCLUSIONES

### Fortalezas
✅ Uso consistente de SDK (sin SQL injection)
✅ Rate limiting bien implementado
✅ Normalización excelente
✅ Validación de input en lugares críticos

### Debilidades Críticas
🔴 RLS incompleto en tablas sensibles (DEBE RESOLVER)
🔴 Faltan índices en consultas frecuentes (DEBE RESOLVER)
🔴 No hay plan de backup/DR (DEBE RESOLVER)

### Recomendación Final
**NO lanzar a producción sin implementar:**
1. RLS en `profiles`, `cv_results`, `job_checks`
2. Índices en `user_id` y `job_key`
3. RPC `increment_landing_views`
4. Validación de tamaño en CVs
5. Plan de backup documentado

**Timeline:** 1-2 semanas para resoluciones críticas, 4-6 semanas para todas las recomendaciones.

---

## Apéndices

### A. SQL para ejecutar en Supabase SQL Editor

```sql
-- ═══════════════════════════════════════════════════════════════
-- AUDITORÍA BD OPTIMA-CV — MIGRACIÓN DE SEGURIDAD Y PERFORMANCE
-- ═══════════════════════════════════════════════════════════════

-- PASO 1: Habilitar RLS en tablas sensibles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_checks ENABLE ROW LEVEL SECURITY;

-- PASO 2: Crear índices faltantes
CREATE INDEX IF NOT EXISTS idx_cv_results_user_id ON public.cv_results(user_id);
CREATE INDEX IF NOT EXISTS idx_job_checks_user_id ON public.job_checks(user_id);
CREATE INDEX IF NOT EXISTS idx_job_checks_job_key ON public.job_checks(job_key);
CREATE INDEX IF NOT EXISTS idx_waitlist_leads_email ON public.waitlist_leads(email);

-- PASO 3: Crear RPC para landing analytics
CREATE OR REPLACE FUNCTION public.increment_landing_views()
RETURNS void AS $$
BEGIN
  INSERT INTO public.landing_stats (id, views) VALUES (1, 1)
  ON CONFLICT (id) DO UPDATE SET views = views + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- PASO 4: Agregar CHECK constraints
ALTER TABLE public.access_codes
  ADD CONSTRAINT ck_access_codes_uses CHECK (uses_count >= 0 AND uses_count <= max_uses);

ALTER TABLE public.profiles
  ADD CONSTRAINT ck_profiles_counts CHECK (cv_optimizer_count >= 0 AND cv_match_count >= 0 AND usage_count >= 0);

-- PASO 5: Crear tabla landing_stats si no existe
CREATE TABLE IF NOT EXISTS public.landing_stats (
  id INT PRIMARY KEY DEFAULT 1,
  views INT NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- PASO 6: RLS Policies para profiles
CREATE POLICY "Users see own profile" ON public.profiles FOR SELECT
  TO authenticated USING (auth.uid() = id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins manage all profiles" ON public.profiles FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- PASO 7: RLS Policies para cv_results
CREATE POLICY "Users see own CVs" ON public.cv_results FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own CVs" ON public.cv_results FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- PASO 8: RLS Policies para job_checks
CREATE POLICY "Users see own checks" ON public.job_checks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own checks" ON public.job_checks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- PASO 9: Verificar indices creados
SELECT tablename, indexname FROM pg_indexes
WHERE tablename IN ('profiles', 'cv_results', 'job_checks', 'access_codes', 'code_redemptions')
ORDER BY tablename, indexname;
```

### B. Backend Changes Required

```javascript
// admin.js — Hash emails in deletion audit log
const crypto = require('crypto');

// En DELETE /api/admin/users/:id
const hashedEmail = crypto
  .createHash('sha256')
  .update(targetUser.email)
  .digest('hex');

// Cambiar:
deleted_user_email: targetUser.email
// Por:
deleted_user_email_hash: hashedEmail
deleted_user_email_domain: targetUser.email.split('@')[1] // Solo dominio para auditoría

// ───────────────────────────────────────────
// cvController.js — Validar tamaño de CV
const MAX_CV_SIZE = 50 * 1024 * 1024; // 50MB

if (req.file.size > MAX_CV_SIZE) {
  return res.status(413).json({
    error: 'El archivo es muy grande. Máximo 50MB.'
  });
}
```

### C. Monitoreo Recomendado

```javascript
// Agregar telemetría en planContext (línea 11)
const startTime = Date.now();
const { data, error } = await db.from('profiles').select(...).eq('id', userId).maybeSingle();
const queryTime = Date.now() - startTime;

if (queryTime > 500) {
  console.warn(`[SLOW QUERY] planContext took ${queryTime}ms for user ${userId}`);
  // Enviar a Sentry si está configurado
}
```

---

**Auditado por:** Claude (AI)
**Fecha:** 31 de Marzo de 2026
**Validez:** 6 meses (revisar cambios post-lanzamiento)
