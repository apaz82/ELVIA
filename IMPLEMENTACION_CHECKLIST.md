# Checklist de Implementación — Auditoría BD OPTIMA-CV

**Estado:** 🔴 NO INICIADO
**Responsable:** [Asignar]
**Fecha de inicio:** [Completar]
**Fecha de entrega estimada:** [Semana 1-2]

---

## 🔴 SEMANA 1 — ITEMS CRÍTICOS (6-8 horas)

### Base de Datos (2-3 horas)

- [ ] **Backup de BD producción**
  - Fecha: ___________
  - Verificado: [ ]

- [ ] **Ejecutar DB_MIGRATION_SQL.sql en STAGING**
  - Pasos: 1-10 del archivo
  - Ejecutado: [ ]

- [ ] **Verificar índices creados**
  - Ejecutado: [ ]

- [ ] **Verificar RLS habilitado**
  - Ejecutado: [ ]

- [ ] **Verificar RLS policies creadas**
  - Verificado: [ ]

### Backend (3-4 horas)

- [ ] **CVController — Agregar validación de tamaño**
  - Archivo: `/backend/src/controllers/cvController.js`
  - MAX_CV_SIZE = 50MB
  - Completado: [ ]
  - Testeado: [ ]

- [ ] **CVController — Validar jobText size**
  - Archivo: `/backend/src/routes/jobs.js`
  - MAX_JOB_TEXT = 10KB
  - Completado: [ ]

- [ ] **Admin Routes — Sanitizar error messages**
  - Archivo: `/backend/src/routes/admin.js`
  - Remover deleteError.message
  - Completado: [ ]

- [ ] **Admin Routes — Hashear emails en audit log**
  - Archivo: `/backend/src/routes/admin.js`
  - Agregar: crypto.createHash('sha256')
  - Completado: [ ]

- [ ] **Waitlist Routes — Corregir RPC call**
  - Archivo: `/backend/src/routes/waitlist.js`
  - Mejorar error handling
  - Completado: [ ]

### Testing (1 hora)

- [ ] **Test en staging — RLS no rompe queries**
  - Subir CV: [ ]
  - CV Optimizer funciona: [ ]
  - CV vs Job funciona: [ ]

- [ ] **Test en staging — Validación de tamaño**
  - Archivo > 50MB rechazado: [ ]
  - Archivo normal aceptado: [ ]

---

## 🟠 SEMANA 2-3 — ITEMS ALTOS (4-6 horas)

### Backend (2-3 horas)

- [ ] **Crear middleware requireAdmin**
  - Archivo: `/backend/src/middleware/requireAdmin.js`
  - Completado: [ ]

- [ ] **planContext — Actualizar plan expirado en DB**
  - Archivo: `/backend/src/middleware/planContext.js`
  - Completado: [ ]

- [ ] **Email Routes — Rate limit persistente**
  - Archivo: `/backend/src/routes/email.js`
  - Redis o memory-store
  - Completado: [ ]

- [ ] **Jobs Routes — Validar content-type**
  - Archivo: `/backend/src/routes/jobs.js`
  - Completado: [ ]

### Testing (1-2 horas)

- [ ] **Test requireAdmin middleware**
  - No admin → 403: [ ]
  - Admin → acceso: [ ]

- [ ] **Test rate limit persistente**
  - 5+ requests → 429: [ ]
  - Timeout → funciona: [ ]

---

## 🟡 MES 1 — ITEMS MEDIOS (8-12 horas)

### Compliance (3-4 horas)

- [ ] **Crear GDPR data export endpoint**
  - Formato: JSON/CSV
  - Completado: [ ]

- [ ] **Documentar data retention policy**
  - Documento creado: [ ]

- [ ] **Setup disaster recovery plan**
  - RTO: 4 horas, RPO: 1 hora
  - Documento creado: [ ]

### Performance (2-3 horas)

- [ ] **Crear materialized views**
  - user_stats
  - access_codes_summary
  - Completado: [ ]

- [ ] **Telemetría de queries lentas**
  - Log queries > 500ms
  - Completado: [ ]

### Documentación (2-3 horas)

- [ ] **Actualizar arquitectura docs**
  - RLS, índices, cambios backend
  - Completado: [ ]

- [ ] **Crear runbook DR**
  - Pasos de restore
  - Completado: [ ]

---

## 🧪 TESTING GENERAL

### Pre-Producción

- [ ] **Staging Testing**
  - Database changes: [ ]
  - Backend changes: [ ]
  - Integration tests: [ ]
  - Manual testing: [ ]
  - Performance testing: [ ]

- [ ] **Code Review**
  - Security: [ ]
  - Performance: [ ]
  - Best practices: [ ]

- [ ] **QA Signoff**
  - Features funcionan: [ ]
  - No regressions: [ ]
  - Security tests: [ ]

### Producción Deployment

- [ ] **Pre-Deployment**
  - Backup BD: [ ]
  - Rollback plan: [ ]
  - Team briefing: [ ]
  - Alertas: [ ]

- [ ] **Deployment**
  - SQL en producción: [ ]
  - Backend deploy: [ ]
  - Logs sin errores: [ ]
  - Login funciona: [ ]
  - Upload CV funciona: [ ]

- [ ] **Post-Deployment**
  - Monitor 24 horas: [ ]
  - No errores RLS: [ ]
  - Performance OK: [ ]
  - Usuarios reportan OK: [ ]

---

## 📊 TRACKER DE PROGRESO

**SEMANA 1 Status:**
- [ ] No iniciado
- [ ] 25% completado
- [ ] 50% completado
- [ ] 75% completado
- [ ] 100% completado

**SEMANA 2-3 Status:**
- [ ] No iniciado
- [ ] 25% completado
- [ ] 50% completado
- [ ] 75% completado
- [ ] 100% completado

**MES 1 Status:**
- [ ] No iniciado
- [ ] 25% completado
- [ ] 50% completado
- [ ] 75% completado
- [ ] 100% completado

---

## 🐛 BUGS ENCONTRADOS

| ID | Descripción | Severidad | Status |
|-------|------------|-----------|--------|
| BUG-1 | | [ ] CRÍTICA | [ ] Abierto |
| BUG-2 | | [ ] ALTA | [ ] Abierto |

---

## 📞 CONTACTOS PRINCIPALES

| Rol | Nombre | Email |
|-----|--------|-------|
| Tech Lead | | |
| DevOps | | |
| Backend | | |
| QA | | |

---

## ✅ FIRMAS

**Implementación por:** _________________________ Fecha: _______

**Revisado por:** _________________________ Fecha: _______

**Aprobado para producción:** _________________________ Fecha: _______

**Deployado:** _________________________ Fecha: _______

---

**Documento creado:** 31 de Marzo de 2026
