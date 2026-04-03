# Cambios Backend Requeridos — Auditoría Base de Datos

**Prioridad:** 🔴 CRÍTICA — Implementar antes de producción

---

## 1. CVController — Validación de Tamaño de CV

**Archivo:** `/backend/src/controllers/cvController.js`

**Problema:** No hay validación de tamaño de archivo. Un CV de 500MB colapsa Claude API.

**Ubicación actual (línea ~17):**
```javascript
const optimize = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo' });
    }

    const db = req.supabase;
    const cvText = await parseCV(req.file.buffer, req.file.mimetype);
    // ... resto del código
```

**Cambio requerido:**
```javascript
const optimize = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo' });
    }

    // 🔴 AGREGAR VALIDACIÓN DE TAMAÑO
    const MAX_CV_SIZE = 50 * 1024 * 1024; // 50MB
    if (req.file.size > MAX_CV_SIZE) {
      return res.status(413).json({
        error: 'El archivo es demasiado grande. Máximo 50MB permitido.',
        maxSize: MAX_CV_SIZE,
        receivedSize: req.file.size
      });
    }

    const db = req.supabase;
    const cvText = await parseCV(req.file.buffer, req.file.mimetype);

    // Validar también que el texto no sea extremadamente largo
    const MAX_TEXT_LENGTH = 50000; // 50KB characters
    if (cvText.length > MAX_TEXT_LENGTH) {
      return res.status(413).json({
        error: 'El CV contiene demasiado texto. Máximo 50,000 caracteres.',
        maxChars: MAX_TEXT_LENGTH,
        receivedChars: cvText.length
      });
    }
    // ... resto del código
```

**Aplica también a:** `matchToJob` (línea ~85)

---

## 2. Admin Routes — Sanitización de Error Messages

**Archivo:** `/backend/src/routes/admin.js`

**Problema:** Error messages revelan detalles internos (stack trace, SQL).

**Ubicación actual (línea ~209):**
```javascript
if (deleteError) {
  console.error('[Admin] Error eliminando usuario:', deleteError.message);
  // ...
  return res.status(500).json({ error: deleteError.message });  // ❌ MAL
}
```

**Cambio requerido:**
```javascript
if (deleteError) {
  console.error('[Admin] Error eliminando usuario:', deleteError.message);
  // Log detallado en servidor
  console.error('[Admin] Full error:', deleteError);
  // Respuesta genérica al cliente
  return res.status(500).json({
    error: 'Error al eliminar usuario. Contacta a soporte.',
    errorCode: 'DELETE_USER_FAILED'
  });
}
```

**Otras ubicaciones con el mismo problema:**
- Línea 215: `res.status(500).json({ error: 'Error inesperado durante la eliminación' });` ✅ (ya sanitizado)
- Línea 250: `res.status(500).json({ error: 'Error actualizando configuración' });` ✅ (ya sanitizado)

---

## 3. Admin Routes — Hash de Emails en Audit Log

**Archivo:** `/backend/src/routes/admin.js`

**Problema:** GDPR — Emails guardados en texto plano en `deletion_audit_log`.

**Ubicación actual (línea ~186):**
```javascript
const { error: auditError } = await supabaseAdmin
  .from('deletion_audit_log')
  .insert({
    deleted_user_id: targetId,
    deleted_user_email: targetUser.email,  // ❌ Texto plano
    admin_id: req.user.id,
    admin_email: profile.email_principal,   // ❌ Texto plano
    status: 'completed',
    completed_at: new Date().toISOString(),
  });
```

**Cambio requerido:**
```javascript
// Agregar al inicio del archivo
const crypto = require('crypto');

// En el controlador
const { error: auditError } = await supabaseAdmin
  .from('deletion_audit_log')
  .insert({
    deleted_user_id: targetId,
    // ✅ Hash SHA256 en lugar de email plano
    deleted_user_email_hash: crypto
      .createHash('sha256')
      .update(targetUser.email)
      .digest('hex'),
    // ✅ Guardar solo el dominio del email para auditoría
    deleted_user_email_domain: targetUser.email.split('@')[1],
    admin_id: req.user.id,
    admin_email: profile.email_principal,  // OK — interno, pero considerar hash aquí también
    status: 'completed',
    completed_at: new Date().toISOString(),
  });
```

**Nota:** La BD migration SQL agregará las columnas hash. Backend ya es compatible.

---

## 4. Code Middleware — Crear Middleware reutilizable `requireAdmin`

**Archivo:** `/backend/src/middleware/requireAdmin.js` (NUEVO)

**Problema:** Se repite la verificación `is_admin` en casi todas las rutas admin.

**Crear nuevo archivo:**
```javascript
// Middleware para verificar que el usuario es admin
const requireAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const db = req.supabase;

  try {
    const { data: profile, error } = await db
      .from('profiles')
      .select('is_admin')
      .eq('id', req.user.id)
      .single();

    if (error || !profile?.is_admin) {
      return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador.' });
    }

    // Adjuntar perfil al request
    req.adminProfile = profile;
    next();
  } catch (err) {
    console.error('[requireAdmin] Error:', err);
    res.status(500).json({ error: 'Error verificando permisos' });
  }
};

module.exports = requireAdmin;
```

**Uso en rutas admin:**
```javascript
// admin.js
const requireAdmin = require('../middleware/requireAdmin');

// Antes:
router.get('/system-status', auth, async (req, res) => {
  const { data: profile } = await req.supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', req.user.id)
    .single();

  if (!profile?.is_admin) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }
  // ...

// Después:
router.get('/system-status', auth, requireAdmin, async (req, res) => {
  // req.adminProfile.is_admin garantizado ✅
  // ... resto del código
```

---

## 5. planContext Middleware — Actualizar plan expirado en DB

**Archivo:** `/backend/src/middleware/planContext.js`

**Problema (línea ~58-62):** Plan expirado solo se degrada en memoria, no en BD.

**Ubicación actual:**
```javascript
// Plan semanal expirado → degradar en memoria (no toca la DB)
let plan = data.plan || 'free';
if (plan === 'semanal' && data.plan_expires_at && new Date(data.plan_expires_at) < new Date()) {
  plan = 'free';  // ❌ Solo en memoria
}
```

**Cambio requerido:**
```javascript
// Plan semanal expirado → actualizar en BD también
let plan = data.plan || 'free';
if (plan === 'semanal' && data.plan_expires_at && new Date(data.plan_expires_at) < new Date()) {
  plan = 'free';
  // ✅ Actualizar en DB para mantener sincronía
  await db
    .from('profiles')
    .update({ plan: 'free' })
    .eq('id', userId)
    .catch(err => console.error('[planContext] Error degrading plan:', err));
}
```

---

## 6. Email Routes — Rate Limit Persistente

**Archivo:** `/backend/src/routes/email.js`

**Problema (línea ~11-31):** Rate limit en memoria no funciona en multi-instancia.

**Ubicación actual:**
```javascript
// Problema: Map en memoria no persiste entre servidores
const emailRateMap = new Map();
const emailRateLimit = (req, res, next) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const maxReqs = 3;

  const entry = emailRateMap.get(ip) || { count: 0, firstRequest: now };
  // ... in-memory logic
```

**Recomendación:** Usar `express-rate-limit` con store Redis o memcached:

```javascript
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

// Crear cliente Redis (usar variable de entorno)
const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

const emailLimiter = rateLimit({
  store: new RedisStore({
    client: client,
    prefix: 'email-rate-limit:',
  }),
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 3, // máx 3 requests
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0].trim()
      || req.socket.remoteAddress
      || 'unknown';
  },
  handler: (req, res) => {
    res.status(429).json({ error: 'Demasiados intentos. Intenta de nuevo en 10 minutos.' });
  }
});

// Uso:
router.post('/send', auth, emailLimiter, async (req, res) => {
  // ... resto del código
```

**Alternativa sin Redis:** Usar `memory-store` (no es para producción):
```javascript
const MemoryStore = require('rate-limit-memory-store');

const emailLimiter = rateLimit({
  store: new MemoryStore(),
  // ... resto igual
});
```

**Recomendación:** Para producción, usar Redis (escalable).

---

## 7. Jobs Routes — Validar URL antes de fetch

**Archivo:** `/backend/src/routes/jobs.js`

**Problema (línea ~44-106):** Fetcha URL sin validar respuesta.

**Ubicación actual:**
```javascript
try {
  const response = await fetch(url, { headers: {...} });

  if (!response.ok) {
    if (response.status === 403) {
      return res.status(403).json({ error: '...' });
    }
    return res.status(400).json({ error: `No se pudo acceder a la URL (Error ${response.status})` });
  }

  const html = await response.text();
  // ... procesamiento
```

**Cambio recomendado:**
```javascript
try {
  // ✅ Validar que la respuesta sea HTML/text
  const response = await fetch(url, { headers: {...} });

  if (!response.ok) {
    if (response.status === 403) {
      return res.status(403).json({ error: '...' });
    }
    return res.status(400).json({ error: `No se pudo acceder a la URL (Error ${response.status})` });
  }

  // ✅ Validar content-type
  const contentType = response.headers.get('content-type');
  if (!contentType || (!contentType.includes('text/html') && !contentType.includes('text/plain'))) {
    return res.status(400).json({
      error: 'La URL no devuelve HTML válido. Por favor pega la descripción manualmente.'
    });
  }

  // ✅ Validar tamaño de respuesta (no descargar 500MB)
  const contentLength = response.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB
    return res.status(413).json({
      error: 'La página es demasiado grande. Por favor pega la descripción manualmente.'
    });
  }

  const html = await response.text();
```

---

## 8. WaitList Routes — Corregir RPC call

**Archivo:** `/backend/src/routes/waitlist.js`

**Problema (línea ~148):** RPC no existe y falla silenciosamente.

**Ubicación actual:**
```javascript
router.post('/track', trackLimiter, async (req, res, next) => {
  try {
    // TODO: Crear RPC en Supabase: CREATE FUNCTION increment_landing_views() ...
    const { error } = await supabaseAdmin.rpc('increment_landing_views');

    if (error && error.code !== 'PGRST204') throw error; // Ignora 204

    return res.status(200).json({ success: true });
```

**Cambio requerido:**
```javascript
router.post('/track', trackLimiter, async (req, res, next) => {
  try {
    // RPC debe ser creado en DB (ver DB_MIGRATION_SQL.sql)
    const { error } = await supabaseAdmin.rpc('increment_landing_views');

    if (error) {
      // Log el error pero no falles (analytics no es crítico)
      console.warn('[Analytics] RPC error:', error.message);
      // Continuar de todos modos
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    // Silent fail para no romper UX
    console.error('[Analytics] Track error:', error);
    res.status(200).json({ success: false });
  }
});
```

---

## 9. Jobs Routes — Limitar tamaño de jobText

**Archivo:** `/backend/src/routes/jobs.js`

**Problema (línea ~257-328):** No hay validación de tamaño en `jobText`.

**Ubicación actual:**
```javascript
router.post('/compatibility', auth, planContext, checkCvMatchLimit, async (req, res) => {
  const { cvText, jobTitle, jobCompany, jobSnippet, jobLink, jobLocation, jobVia } = req.body;
  if (!cvText || !jobTitle) {
    return res.status(400).json({ error: 'Faltan datos' });
  }
```

**Cambio requerido:**
```javascript
router.post('/compatibility', auth, planContext, checkCvMatchLimit, async (req, res) => {
  const { cvText, jobTitle, jobCompany, jobSnippet, jobLink, jobLocation, jobVia } = req.body;

  // ✅ Validación de datos
  if (!cvText || !jobTitle) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  // ✅ Limitar tamaño
  const MAX_CV_TEXT = 50000;
  const MAX_JOB_TEXT = 10000;

  if (cvText.length > MAX_CV_TEXT) {
    return res.status(413).json({
      error: 'El CV es demasiado largo para analizar',
      maxChars: MAX_CV_TEXT
    });
  }

  if ((jobSnippet || '').length > MAX_JOB_TEXT) {
    return res.status(413).json({
      error: 'La descripción de la vacante es demasiado larga',
      maxChars: MAX_JOB_TEXT
    });
  }

  // ... resto del código
```

---

## 10. CVController — Validar identidad de onboarding con lenidad

**Archivo:** `/backend/src/controllers/cvController.js`

**Problema (línea ~19-37):** La validación de nombre es muy estricta y puede ser falsa positiva.

**Ubicación actual:**
```javascript
// NUEVO: Validación de Identidad del Onboarding
const { data: profile } = await db.from('profiles').select('nombre1, apellido1').eq('id', req.user.id).single();
if (profile) {
  const cvTextNorm = cvText.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const n1 = profile.nombre1 ? profile.nombre1.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : '';
  const a1 = profile.apellido1 ? profile.apellido1.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : '';

  let faltan = false;
  const primerNombre = n1.split(' ')[0];
  const primerApellido = a1.split(' ')[0];

  if (primerNombre && !cvTextNorm.includes(primerNombre)) faltan = true;
  if (primerApellido && !cvTextNorm.includes(primerApellido)) faltan = true;

  if (faltan) {
    return res.status(400).json({ error: 'Este cv no concuerda con con la informaciòn del onboarding.' });
  }
}
```

**Recomendación:** Hacer la validación más flexible:
```javascript
// Validación OPCIONAL — no bloquea si no se verifica
if (profile && profile.nombre1 && profile.apellido1) {
  const cvTextNorm = cvText
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const n1 = profile.nombre1
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  const a1 = profile.apellido1
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  const primerNombre = n1.split(' ')[0];
  const primerApellido = a1.split(' ')[0];

  // ✅ Solo avisar, no bloquear
  const nombreEncontrado = primerNombre && cvTextNorm.includes(primerNombre);
  const apellidoEncontrado = primerApellido && cvTextNorm.includes(primerApellido);

  if (!nombreEncontrado || !apellidoEncontrado) {
    console.warn(`[Onboarding] Identity validation mismatch for user ${req.user.id}`);
    // Opción 1: Solo avisar (retornar warning en response)
    // Opción 2: Requerir confirmación del usuario
    // Opción 3: Log y continuar (sin bloquear)
  }
}
```

---

## Checklist de Implementación

```markdown
## Backend Fixes — Implementation Checklist

### 🔴 CRÍTICAS (Esta semana)
- [ ] CVController: Agregar validación de tamaño MAX_CV_SIZE (50MB)
- [ ] CVController: Agregar validación de tamaño de texto
- [ ] admin.js: Sanitizar error messages
- [ ] admin.js: Hashear emails en deletion_audit_log
- [ ] planContext: Actualizar plan expirado en DB
- [ ] waitlist.js: Corregir RPC call (agregar error handling)

### 🟠 ALTAS (Próxima semana)
- [ ] Crear middleware requireAdmin reutilizable
- [ ] email.js: Implementar Redis rate limiting
- [ ] jobs.js: Validar content-type y tamaño antes de fetch
- [ ] jobs.js: Limitar tamaño de jobText

### 🟡 MEDIAS (Cuando sea)
- [ ] CVController: Hacer validación de identidad menos estricta
- [ ] Agregar telemetría de queries lentas
- [ ] Crear tests para RLS policies

## Testing Requerido

- [ ] Test cada cambio en staging
- [ ] Verificar RLS no rompe queries existentes
- [ ] Load test con 100+ requests simultáneos
- [ ] Test de disaster recovery
```

---

## Variables de Entorno Requeridas

Verificar que existen en `.env`:

```bash
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# APIs externas
ANTHROPIC_API_KEY=
RESEND_API_KEY=
JOOBLE_API_KEY=

# Opcional (pero recomendado)
REDIS_HOST=localhost
REDIS_PORT=6379
SENTRY_DSN=
```

---

**Documentación completa:** Ver `/AUDITORIA_BASE_DATOS.md`
**SQL a ejecutar:** Ver `/DB_MIGRATION_SQL.sql`
**Resumen:** Ver `/DB_AUDIT_SUMMARY.md`
