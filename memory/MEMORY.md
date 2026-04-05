# OPTIMA-CV · MEMORY

## Última Actualización: 2026-04-05
**Foco**: Recalibración Onboarding (100%) y Persistencia de CVs.

### Resumen del Último Trabajo
- **Autoconocimiento 100%**: Se ajustó la lógica de progreso a 5 secciones (Aspiraciones, Hard, Soft, Power Skills, Compañías) con requisitos mínimos (3 skills, 2 compañías).
- **Persistencia de CV**: Se aseguró que tanto los CVs subidos en el onboarding como los creados en el wizard se guarden como `tipo: original` para ser accesibles en la pestaña "CV Inicial" de Mis CVs.
- **Desbloqueo de Features**: Se verificó que el progreso al 100% libera las secciones protegidas (Mis CVs y Gerente de Búsqueda).

### Pendientes Críticos
1. **Seguridad**:
   - Reemplazar `Math.random()` por `crypto` en `backend/src/routes/company.js`.
   - Implementar Rate Limiter en endpoints públicos de B2B.
   - Habilitar RLS en `cv_results` y eliminar el fallback `supabaseAdmin`.
2. **Pricing**: Conectar `valorOptima` en `ProyectoLaboral.jsx` con los precios reales del perfil del usuario según su país.
3. **UX**: Implementar notificaciones tipo "Toast" para reemplazar los `window.alert` en el guardado de datos.

### Archivos Clave Modificados
- `frontend/src/utils/progresoLaboral.js` (Lógica de progreso)
- `frontend/src/pages/ProyectoLaboral.jsx` (UI y labels de requisitos)
- `backend/src/controllers/cvController.js` (Persistencia de CV subido)
- `backend/src/controllers/cvGenerarController.js` (Persistencia de CV creado)
