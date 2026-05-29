# OPTIMA-CV · MEMORY

## Última Actualización: 2026-05-29 (Sesión 4)
**Foco**: Corrección del error PGRST204 (Pipeline / saved_jobs) y reparación de columnas fantasma en la sección de Entrevistas.

### Resumen del Último Trabajo
- **Alineación de Schema en `saved_jobs`**: Diagnóstico y corrección del error `PGRST204` (Bad Request) que ocurría al guardar vacantes en el Pipeline. El código intentaba hacer INSERT en columnas inexistentes (`titulo`, `empresa`, `descripcion`). Se removieron estas columnas del INSERT en `CVvsJob.jsx` ya que la base de datos almacena toda esa información de forma segura estructurada dentro de la columna JSONB `job_data`.
- **Reparación del Daño Colateral en `Entrevista.jsx`**: Se detectó y corrigió un error heredado donde la sección de simulación de entrevistas consultaba y dependía de las columnas inexistentes `titulo` y `empresa` de `saved_jobs`. Se re-escribió el SELECT y la lógica de `seleccionarVacante` para que lean de forma segura desde `job_data?.title` y `job_data?.company` respectivamente.
- **Persistencia de Conocimiento (KI)**: Se creó la entrada de memoria persistente en el sistema global (`knowledge/saved-jobs-schema/`) para prevenir regresiones de schema en el futuro.

### Archivos Clave Modificados
- `frontend/src/pages/CVvsJob.jsx` (Limpieza y alineación de INSERT en saved_jobs)
- `frontend/src/pages/Entrevista.jsx` (Alineación de SELECT y lectura segura de job_data para título y empresa)

---

## Historial de Actualizaciones

### Sesión 3 (2026-05-24)
**Foco**: Rediseño de Infografía Autoconocimiento, Límites de Generación, Rebranding global a "Mis documentos" y Rediseño de Dashboard Ejecutivo.

### Resumen del Trabajo
- **Rediseño Autoconocimiento Apple Style**: Total remodelación de `ReporteLaboral.jsx` con comillas Hero premium para la oferta de valor, cuadrícula interactiva 2x2 para IKIGAI, tags elegantes para cultura y plan semanal, omitiendo placeholders vacíos.
- **Límite de Generación y Usabilidad**: Integración de un límite estricto de 10 generaciones en `cvController.js` para flujos de demostración, permitiendo descarga infinita de infografías existentes. Enlace directo `_blank` en `ProyectoLaboral.jsx` para abrir el reporte visual sin salir de la plataforma.
- **Rebranding "Mis documentos"**: Se renombraron de manera coherente todas las referencias a "Mis CVs" por "Mis documentos" en el menú, panels de acción, vistas de optimización y listado.
- **Dashboard Ejecutivo V2 Premium (Opción A)**: Re-diseño total de `Dashboard.jsx` para el entorno B2B, posicionando "Status Autoconocimiento" como Hero en la parte superior, ocultando créditos, reemplazando el gráfico de líneas por un dial circular SVG concéntrico de Match Promedio a 85%, e integrando un nuevo y espectacular bloque de Bienestar Emocional (micro-calendario de check-ins diarios + radar semanal de 5 ejes) con enlaces directos a la sección.
- **Saneamiento del Historial (Bugfix)**: Filtrado estricto en la base de datos y en la lógica del cliente (`CVOptimizer.jsx`) para excluir filas JSON que comiencen con '{', garantizando que en el optimizador de CV solo se listen CVs estándar Harvard libres de distorsiones visuales.


### Sesión 2 (2026-04-05)
**Foco**: Auditoría y Refinamiento UI/UX (Pulido Final).

### Resumen del Último Trabajo
- **Autoconocimiento 100%**: Se ajustó la lógica de progreso a 5 secciones (Aspiraciones, Hard, Soft, Power Skills, Compañías) con requisitos mínimos (3 skills, 2 compañías).
- **Persistencia de CV**: Se aseguró que tanto los CVs subidos en el onboarding como los creados en el wizard se guarden como `tipo: original` para ser accesibles en la pestaña "CV Inicial" de Mis CVs.
- **Auditoría UI/UX Finalizada**: Se corrigieron errores ortográficos en Sidebar y Proyecto Laboral, se unificaron colores de tags a Índigo, se ajustó la lógica del trofeo de documentos y se redujo el tamaño del Chatbot para ser menos intrusivo.
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
