// Tests de integración — Sistema de Códigos de Acceso
const request = require('supertest');
const express = require('express');
const codesRoutes = require('../routes/codes');

// ── Mock del middleware de auth ───────────────────────────────
jest.mock('../middleware/auth', () => (req, res, next) => {
  if (req.headers.authorization === 'Bearer valid-token') {
    req.user = { id: 'user-123', email: 'user@test.com' };
    req.token = 'valid-token';
    req.supabase = req._mockDb;
    return next();
  }
  if (req.headers.authorization === 'Bearer admin-token') {
    req.user = { id: 'admin-123', email: 'admin@test.com' };
    req.token = 'admin-token';
    req.supabase = req._mockDb;
    return next();
  }
  return res.status(401).json({ error: 'Token no proporcionado' });
});

// ── Helpers para construir mocks de Supabase ─────────────────

// Crea un mock de cliente Supabase que devuelve la data dada
function mockDb(overrides = {}) {
  const chain = {
    select:    jest.fn().mockReturnThis(),
    eq:        jest.fn().mockReturnThis(),
    order:     jest.fn().mockReturnThis(),
    limit:     jest.fn().mockReturnThis(),
    insert:    jest.fn().mockReturnThis(),
    update:    jest.fn().mockReturnThis(),
    single:    jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockReturnThis(),
    ...overrides,
  };
  return {
    from: jest.fn().mockReturnValue(chain),
    _chain: chain,
  };
}

// Inyecta el mock DB en cada request via middleware
function makeApp(db) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req._mockDb = db; next(); });
  app.use('/api/codes', codesRoutes);
  return app;
}

// ════════════════════════════════════════════════════════════
// POST /api/codes/redeem
// ════════════════════════════════════════════════════════════

describe('POST /api/codes/redeem', () => {

  it('401 sin token', async () => {
    const app = makeApp(mockDb());
    const res = await request(app).post('/api/codes/redeem').send({ code: 'TEST123' });
    expect(res.status).toBe(401);
  });

  it('400 si no se envía código', async () => {
    const db = mockDb();
    const app = makeApp(db);
    const res = await request(app)
      .post('/api/codes/redeem')
      .set('Authorization', 'Bearer valid-token')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Código requerido');
  });

  it('404 si el código no existe', async () => {
    const db = mockDb();
    // Primera consulta (buscar código) devuelve null
    db._chain.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

    const app = makeApp(db);
    const res = await request(app)
      .post('/api/codes/redeem')
      .set('Authorization', 'Bearer valid-token')
      .send({ code: 'NOEXISTE' });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('CODIGO_NO_ENCONTRADO');
  });

  it('400 si el código está inactivo', async () => {
    const db = mockDb();
    db._chain.maybeSingle.mockResolvedValueOnce({
      data: { id: 'code-1', plan: 'mensual', max_uses: 5, uses_count: 0, expires_at: null, is_active: false },
      error: null,
    });

    const app = makeApp(db);
    const res = await request(app)
      .post('/api/codes/redeem')
      .set('Authorization', 'Bearer valid-token')
      .send({ code: 'INACTIVO' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('CODIGO_INACTIVO');
  });

  it('400 si el código está vencido', async () => {
    const db = mockDb();
    db._chain.maybeSingle.mockResolvedValueOnce({
      data: {
        id: 'code-1', plan: 'mensual', max_uses: 5, uses_count: 0,
        expires_at: new Date(Date.now() - 86400000).toISOString(), // ayer
        is_active: true,
      },
      error: null,
    });

    const app = makeApp(db);
    const res = await request(app)
      .post('/api/codes/redeem')
      .set('Authorization', 'Bearer valid-token')
      .send({ code: 'VENCIDO' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('CODIGO_VENCIDO');
  });

  it('400 si el código agotó sus usos', async () => {
    const db = mockDb();
    db._chain.maybeSingle.mockResolvedValueOnce({
      data: { id: 'code-1', plan: 'mensual', max_uses: 3, uses_count: 3, expires_at: null, is_active: true },
      error: null,
    });

    const app = makeApp(db);
    const res = await request(app)
      .post('/api/codes/redeem')
      .set('Authorization', 'Bearer valid-token')
      .send({ code: 'AGOTADO' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('CODIGO_AGOTADO');
  });

  it('400 si el usuario ya canjeó ese código', async () => {
    const db = mockDb();
    // Código válido
    db._chain.maybeSingle
      .mockResolvedValueOnce({
        data: { id: 'code-1', plan: 'mensual', max_uses: 10, uses_count: 1, expires_at: null, is_active: true },
        error: null,
      })
      // Redención existente (ya canjeado)
      .mockResolvedValueOnce({ data: { id: 'redemp-99' }, error: null });

    const app = makeApp(db);
    const res = await request(app)
      .post('/api/codes/redeem')
      .set('Authorization', 'Bearer valid-token')
      .send({ code: 'YACANJEADO' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('YA_CANJEADO');
  });

  it('200 y aplica el plan correctamente (mensual → 30 días)', async () => {
    const db = mockDb();
    // 1. Código válido
    db._chain.maybeSingle
      .mockResolvedValueOnce({
        data: { id: 'code-1', plan: 'mensual', max_uses: 10, uses_count: 0, expires_at: null, is_active: true },
        error: null,
      })
      // 2. Sin redención previa
      .mockResolvedValueOnce({ data: null, error: null });

    // 3. Insert en code_redemptions → ok
    db._chain.insert.mockResolvedValueOnce({ error: null });
    // 4. Update profiles → ok
    db._chain.update.mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) });

    const app = makeApp(db);
    const res = await request(app)
      .post('/api/codes/redeem')
      .set('Authorization', 'Bearer valid-token')
      .send({ code: 'BETA2025' });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.plan).toBe('mensual');
    expect(res.body.expiresAt).toBeDefined();

    // Verificar que la fecha de expiración es ~30 días desde ahora
    const expDate = new Date(res.body.expiresAt);
    const diffDias = Math.round((expDate - Date.now()) / (1000 * 60 * 60 * 24));
    expect(diffDias).toBe(30);
  });

  it('200 plan semanal → 7 días de expiración', async () => {
    const db = mockDb();
    db._chain.maybeSingle
      .mockResolvedValueOnce({
        data: { id: 'code-2', plan: 'semanal', max_uses: 5, uses_count: 0, expires_at: null, is_active: true },
        error: null,
      })
      .mockResolvedValueOnce({ data: null, error: null });

    db._chain.insert.mockResolvedValueOnce({ error: null });
    db._chain.update.mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) });

    const app = makeApp(db);
    const res = await request(app)
      .post('/api/codes/redeem')
      .set('Authorization', 'Bearer valid-token')
      .send({ code: 'SEMANA1' });

    expect(res.status).toBe(200);
    expect(res.body.plan).toBe('semanal');

    const diffDias = Math.round((new Date(res.body.expiresAt) - Date.now()) / (1000 * 60 * 60 * 24));
    expect(diffDias).toBe(7);
  });

  it('200 plan trimestral → 90 días de expiración', async () => {
    const db = mockDb();
    db._chain.maybeSingle
      .mockResolvedValueOnce({
        data: { id: 'code-3', plan: 'trimestral', max_uses: 2, uses_count: 0, expires_at: null, is_active: true },
        error: null,
      })
      .mockResolvedValueOnce({ data: null, error: null });

    db._chain.insert.mockResolvedValueOnce({ error: null });
    db._chain.update.mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) });

    const app = makeApp(db);
    const res = await request(app)
      .post('/api/codes/redeem')
      .set('Authorization', 'Bearer valid-token')
      .send({ code: 'TRIM90' });

    expect(res.status).toBe(200);
    expect(res.body.plan).toBe('trimestral');

    const diffDias = Math.round((new Date(res.body.expiresAt) - Date.now()) / (1000 * 60 * 60 * 24));
    expect(diffDias).toBe(90);
  });

  it('normaliza el código a mayúsculas', async () => {
    const db = mockDb();
    db._chain.maybeSingle
      .mockResolvedValueOnce({
        data: { id: 'code-1', plan: 'mensual', max_uses: 5, uses_count: 0, expires_at: null, is_active: true },
        error: null,
      })
      .mockResolvedValueOnce({ data: null, error: null });

    db._chain.insert.mockResolvedValueOnce({ error: null });
    db._chain.update.mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) });

    const app = makeApp(db);
    // Enviado en minúsculas
    await request(app)
      .post('/api/codes/redeem')
      .set('Authorization', 'Bearer valid-token')
      .send({ code: 'beta2025' });

    // Verificar que se consultó con mayúsculas
    const eqCalls = db._chain.eq.mock.calls;
    const codeCall = eqCalls.find(([field]) => field === 'code');
    expect(codeCall?.[1]).toBe('BETA2025');
  });
});

// ════════════════════════════════════════════════════════════
// POST /api/codes — crear código (admin)
// ════════════════════════════════════════════════════════════

describe('POST /api/codes', () => {

  it('401 sin token', async () => {
    const app = makeApp(mockDb());
    const res = await request(app).post('/api/codes').send({ code: 'TEST', plan: 'mensual' });
    expect(res.status).toBe(401);
  });

  it('403 si el usuario no es admin', async () => {
    const db = mockDb();
    // Perfil sin is_admin
    db._chain.maybeSingle.mockResolvedValueOnce({ data: { is_admin: false }, error: null });

    const app = makeApp(db);
    const res = await request(app)
      .post('/api/codes')
      .set('Authorization', 'Bearer valid-token')
      .send({ code: 'TEST', plan: 'mensual' });
    expect(res.status).toBe(403);
  });

  it('400 si falta code o plan', async () => {
    const db = mockDb();
    db._chain.maybeSingle.mockResolvedValueOnce({ data: { is_admin: true }, error: null });

    const app = makeApp(db);
    const res = await request(app)
      .post('/api/codes')
      .set('Authorization', 'Bearer admin-token')
      .send({ plan: 'mensual' }); // falta code
    expect(res.status).toBe(400);
  });

  it('400 si el plan no es válido', async () => {
    const db = mockDb();
    db._chain.maybeSingle.mockResolvedValueOnce({ data: { is_admin: true }, error: null });

    const app = makeApp(db);
    const res = await request(app)
      .post('/api/codes')
      .set('Authorization', 'Bearer admin-token')
      .send({ code: 'TEST', plan: 'gratis' }); // plan inválido
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Plan inválido/);
  });

  it('201 crea el código correctamente', async () => {
    const db = mockDb();
    db._chain.maybeSingle.mockResolvedValueOnce({ data: { is_admin: true }, error: null });

    const nuevoCode = { id: 'uuid-1', code: 'NUEVO123', plan: 'mensual', max_uses: 5, uses_count: 0, is_active: true };
    db._chain.single.mockResolvedValueOnce({ data: nuevoCode, error: null });

    const app = makeApp(db);
    const res = await request(app)
      .post('/api/codes')
      .set('Authorization', 'Bearer admin-token')
      .send({ code: 'nuevo123', plan: 'mensual', max_uses: 5 });

    expect(res.status).toBe(201);
    expect(res.body.code).toBe('NUEVO123');
  });
});

// ════════════════════════════════════════════════════════════
// DELETE /api/codes/:id — desactivar
// ════════════════════════════════════════════════════════════

describe('DELETE /api/codes/:id', () => {

  it('401 sin token', async () => {
    const app = makeApp(mockDb());
    const res = await request(app).delete('/api/codes/some-id');
    expect(res.status).toBe(401);
  });

  it('403 si no es admin', async () => {
    const db = mockDb();
    db._chain.maybeSingle.mockResolvedValueOnce({ data: { is_admin: false }, error: null });

    const app = makeApp(db);
    const res = await request(app)
      .delete('/api/codes/some-id')
      .set('Authorization', 'Bearer valid-token');
    expect(res.status).toBe(403);
  });

  it('200 desactiva el código', async () => {
    const db = mockDb();
    db._chain.maybeSingle.mockResolvedValueOnce({ data: { is_admin: true }, error: null });
    db._chain.update.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    const app = makeApp(db);
    const res = await request(app)
      .delete('/api/codes/code-uuid-123')
      .set('Authorization', 'Bearer admin-token');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
