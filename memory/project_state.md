# OPTIMA-CV · Project State

## Última Actualización: 2026-05-29 (Sesión 4)
**Estado de Entrega**: Fase de Onboarding, Límites B2B, Rebranding global de documentos, Dashboard Ejecutivo V2, y Corrección / Alineación de Schema para Pipeline y Entrevistas (100%).

---

## 1. Flujo de Onboarding (Gerente de Carrera)

### Pilares y Requisitos (Lógica en `progresoLaboral.js`):
1.  **Perfil (20%)**: Datos personales + Compensación + 2 Áreas aspiracionales + 1 Industria.
2.  **Autoconocimiento (25%)**:
    *   **Aspiraciones** (5 pts): 2 áreas + 1 industria.
    *   **Hard Skills** (5 pts): Mínimo 3.
    *   **Soft Skills** (5 pts): Mínimo 3.
    *   **Power Skills** (5 pts): Mínimo 3.
    *   **Compañías Objetivo** (5 pts): Mínimo 2 llenas.
3.  **Recursos (15%)**: Mínimo 3 recursos adicionales + Suscripción activa.
4.  **Horario (20%)**: Al menos 1 bloque de tiempo definido.
5.  **Oferta de Valor (20%)**: Pitch corto y Pitch largo con ≥ 200 caracteres de calidad.

**Desbloqueo**:
- Al alcanzar 100%, se habilitan los ítems del menú `LockedNavItem` en `Sidebar.jsx`.

---

## 2. Persistencia de CVs e Infografías (`original` vs `optimize` vs `match`)

- **CV Original (Inicial)**:
  *   **Subida**: El endpoint `/api/cv/extract-profile` guarda el CV en `cv_results` con `tipo: original`.
  *   **Creación**: El generador desde cero guarda el resultado con `tipo: original`.
  *   **Vista**: Se muestran en la pestaña "CV Inicial" de `MisCVs.jsx` (Renombrado global a "Mis documentos").
- **CV Optimizado**: Generado en la sección "Optimizar CV" (`tipo: optimize`).
- **CV vs Vacante**: Resultado del ajuste a una vacante específica (`tipo: match`).
- **Infografía de Autoconocimiento**: Generado en la sección "Proyecto Laboral" (`tipo: optimize` and `metadata.subtipo: infografia_proyecto`). Cuenta con un límite estricto de 10 generaciones en el backend.

---

## 3. Pendientes Técnicos con Código Sugerido

### 3.1 Seguridad en `company.js`
Reemplazar `Math.random()` con `crypto` para IDs más seguros:
```js
// backend/src/routes/company.js
const crypto = require('crypto');
const safeId = crypto.randomBytes(16).toString('hex');
```

### 3.2 Sincronización de Precios en `ProyectoLaboral.jsx`
Conectar los precios según el perfil del usuario:
```js
const PRECIOS = {
  MXN: { semanal: 99, mensual: 299, trim_total: 699, anual: 2499 },
  USD: { semanal: 5, mensual: 15, trim_total: 35, anual: 125 },
  // ...otros países
}
const valorOptima = PRECIOS[perfil.moneda]?.[perfil.plan] || 0;
```

---

## 4. Estado de la Infraestructura
- **Base de Datos**: Supabase (Tablas Críticas: `profiles`, `job_search_profile`, `cv_results`, `job_checks`, `saved_jobs`).
- **Esquema de la Tabla `saved_jobs` (Pipeline/Entrevistas)**:
  * **id** (uuid)
  * **user_id** (uuid)
  * **job_key** (text)
  * **job_data** (jsonb) — Contiene los metadatos de la vacante (`title`, `company`, `description`, `link`, etc.)
  * **liked** (boolean)
  * **estado** (text)
  * **created_at** (timestamptz)
  * **notas** (text)
  * **etapas_fechas** (jsonb)
  * **contacto** (jsonb)
  * **company_id** (uuid)
  * *Nota de Desarrollo*: Las columnas directas `titulo`, `empresa` y `descripcion` **no existen** en la base de datos de Supabase. Cualquier inserción o selección debe interactuar únicamente con los campos reales, mapeando título y empresa desde el objeto `job_data` (`job_data.title`, `job_data.company`).
- **Servicios Externos**: Anthropic (Haiku 4.5/Sonnet 3.7), Resend (Emails), Jooble (Buscador de empleos).
- **Frontend**: Vite + React + Tailwind + Phosphor Icons.
- **Backend**: Express + Supabase SDK.

