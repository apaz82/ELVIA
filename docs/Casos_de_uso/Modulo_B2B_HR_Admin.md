# Documentación de Gobierno y Casos de Uso — Módulo B2B HR Admin

Este documento detalla de forma exhaustiva la gobernanza técnica y funcional del **Módulo de Administración B2B (HR Admin)** de la plataforma ELVIA, estructurado según las plantillas del plan de gobierno.

---

## 🧩 Formato B: Ficha de Módulo — B2B HR Admin

| Campo | Respuesta |
| :--- | :--- |
| **Módulo** | Módulo de Administración Corporativa B2B (HR Admin Portal). |
| **Responsabilidad** | **Qué resuelve**: Autogestión para directores de RRHH, permitiendo autorizar colaboradores, invitar candidatos B2B, ver analíticas consolidadas y verificar métricas de adopción bajo co-branding.<br>**Qué NO resuelve**: Modificación global de configuraciones del tenant (reservado a Superadmin), acceso a contenido confidencial de los candidatos (CVs o conversaciones con el chatbot). |
| **Usuarios** | Roles: `company_admin`, `super_admin`. |
| **Casos de uso incluidos** | `UC-B2B-001`, `UC-B2B-002`, `UC-B2B-003`, `UC-B2B-004`. |
| **Datos que toca** | `company_allowlist`, `company_invitations`, `profiles` (campos de lectura agregada de adopción/uso), `companies` (perfil del tenant). |
| **Endpoints** | `GET /api/company/profile`, `GET /api/company/users`, `GET /api/company/invitations`, `GET /api/company/dashboard`, `GET /api/company/allowlist`, `POST /api/company/allowlist/bulk`, `POST /api/company/invitations`, `PATCH /api/company/allowlist/:id`. |
| **Reglas de negocio** | 1. El acceso está restringido únicamente a usuarios con `profile.role = 'company_admin'` y `requireMFA`. <br>2. Se prohíbe exponer PII sensible del candidato (CVs, mensajes) al HR Admin. <br>3. Las invitaciones expiran en un período de 1 hora. |
| **Dependencias** | Supabase SDK (Base de datos en Railway), Resend (Servicio de emails branded). |
| **Riesgos** | Escalación de privilegios de usuario regular a admin corporativo. (Mitigación: validación estricta en base de datos vía RLS y validación de rol en backend mediante middleware custom). |
| **Definition of Done** | - Pasa validación estricta de MFA en producción.<br>- Toda acción administrativa sensible genera una entrada en `tenant_audit_log`. |

---

## 📄 Formato A: Casos de Uso del Módulo B2B

### 1. UC-B2B-001: Carga Masiva de Colaboradores Aprobados (CSV Bulk Upload)
* **ID**: `UC-B2B-001`
* **Nombre**: Carga masiva de allowlist vía CSV.
* **Actor principal**: `company_admin` (Director de RRHH).
* **Actores secundarios**: Base de datos de Supabase, Parser CSV del Frontend.
* **Objetivo**: Habilitar a un conjunto de colaboradores de la empresa para que puedan auto-registrarse e iniciar sesión de forma aislada en el portal corporativo.
* **Precondiciones**: El HR Admin ha iniciado sesión con MFA activa, posee permisos de `company_admin` en su perfil y tiene un archivo `.csv` válido con la columna requerida `email`.
* **Flujo principal**:
  1. El HR Admin hace clic en "Cargar CSV" en la sección de Personas.
  2. El sistema despliega un modal interactivo con la opción de descargar la plantilla CSV y un área de arrastre de archivos.
  3. El HR Admin selecciona su archivo local.
  4. El parser en frontend procesa el archivo fila por fila en milisegundos, verifica que contenga la columna `email` y valida el formato del correo mediante regex.
  5. El sistema muestra una vista previa en tiempo real de las primeras 50 filas válidas y el recuento total de correos.
  6. El HR Admin puede indicar una cohorte por defecto (ej: `telefonica-2026-05`).
  7. El HR Admin confirma la acción y hace clic en "Cargar entradas".
  8. El sistema envía las filas en un payload JSON al endpoint `/api/company/allowlist/bulk`.
  9. El backend realiza un `UPSERT` en la tabla `company_allowlist` asociándolas al `company_id` del administrador.
  10. El sistema cierra el modal, muestra una notificación toast de éxito con el resumen de registros agregados y refresca el listado de personas.
* **Flujos alternos**:
  * *Falta columna "email" en header*: El sistema detiene el proceso y muestra un error de validación en rojo indicando "Falta columna email en el header".
  * *Correos con formato inválido o duplicados*: El modal detalla una lista de advertencia indicando la línea exacta y el correo fallido, omitiendo esas filas y permitiendo cargar solo las filas correctas.
* **Datos usados**: `email`, `nombre`, `apellido`, `cohort`, `area`, `cargo_actual`.
* **Permisos**: Rol `company_admin` verificado + pertenencia activa en el mismo `company_id`.
* **Resultado esperado**: Los registros se guardan en la tabla `company_allowlist` con estado `pending`.
* **Criterios de aceptación**: 
  * Se bloquean correos que no correspondan al dominio permitido (si aplica).
  * No se procesan archivos de más de 5,000 registros para evitar timeouts.
* **Eventos de auditoría**: Registro en `tenant_audit_log` con acción `allowlist_bulk_upload`, indicando cantidad de filas y ID del administrador.
* **Riesgos**: Exposición accidental de correos personales por error en el CSV. (Mitigación: validación estricta y previsualización obligatoria antes de presionar enviar).
* **Pruebas mínimas**: Subir plantilla CSV correcta con 5 filas; subir CSV con errores sintácticos y verificar listado de errores en modal.

---

### 2. UC-B2B-002: Invitación Individual de Colaborador (Single Invite)
* **ID**: `UC-B2B-002`
* **Nombre**: Invitar colaborador individual de forma branded.
* **Actor principal**: `company_admin`.
* **Actores secundarios**: Resend (API de emails), Supabase Auth.
* **Objetivo**: Invitar de manera formal e individual a un candidato o colaborador con link de activación directo.
* **Precondiciones**: Sesión administrativa activa.
* **Flujo principal**:
  1. El HR Admin hace clic en "Invitar uno" en la sección de Personas.
  2. Rellena los campos obligatorios: Correo y Nombre. Opcional: Cohorte y Cargo.
  3. Hace clic en "Enviar invitación".
  4. El backend intercepta la solicitud y valida que el correo no esté registrado previamente como administrador de otra compañía o superadmin (evita degradación accidental de roles).
  5. Crea el usuario en Supabase Auth de forma inactiva y genera un link de recuperación branded (`recovery` link).
  6. Inserta el registro en `company_invitations` con estado `pending` y `expires_at` a 1 hora.
  7. Invoca a `resendService` para enviar un email premium branded con los colores y logos del tenant (ej: Telefónica) y el botón de "Activar mi cuenta".
  8. El listado se actualiza mostrando la invitación en estado "Pendiente".
* **Flujos alternos**:
  * *El usuario ya está activado*: Si el correo ya existía en la base de datos y estaba activo, devuelve código `ALREADY_ACTIVATED` impidiendo reinvitar y sugiriendo inicio directo.
  * *Conflicto de Tenant (Cross-tenant)*: Si el usuario ya está vinculado a otro programa corporativo, se rechaza la invitación para evitar secuestro de datos.
* **Datos usados**: `email`, `nombre`, `cohort`, `company_id`.
* **Permisos**: `company_admin`.
* **Resultado esperado**: Registro creado, email enviado.
* **Criterios de aceptación**: El link generado debe redirigir al dominio branded específico de activación (ej: `/empresas/telefonica/activar`).
* **Eventos de auditoría**: Registro en `tenant_audit_log` con acción `user_invited`.
* **Riesgos**: Fallo en el envío de emails por rebote de dominio corporativo.
* **Pruebas mínimas**: Invitar a un correo de pruebas y validar llegada de correo formateado con colores de la compañía.

---

## 🔒 Formato D: Reglas de Seguridad (B2B Admin)

### 1. SEC-B2B-001: Control de Acceso por Rol y Tenant
* **Declaración**: Solo usuarios autenticados con rol `company_admin` y un `company_id` válido coincidente con el del recurso pueden consultar los endpoints `/api/company/*`.
* **Motivo**: Evitar que administradores de una compañía consulten métricas o inviten colaboradores en el tenant de otra compañía competidora.
* **Implementación**: Middleware `requireTenantContext` en backend que extrae el `company_id` del token JWT verificado y lo adjunta en `req.companyId`. Toda consulta de Supabase posterior se filtra explícitamente mediante `.eq('company_id', req.companyId)`.
* **Prueba**: Intentar consultar `/api/company/users` con un JWT perteneciente a otra compañía. Deberá responder `403 Forbidden`.
* **Estado**: Verificado.

### 2. SEC-B2B-002: Aislamiento de Datos por RLS
* **Declaración**: Toda tabla que contenga información de B2B (`company_invitations`, `company_allowlist`, `profiles`) debe tener RLS (Row Level Security) activo en Postgres.
* **Motivo**: Defensa a profundidad. Si el backend tuviese un bug o fuga de contexto, la base de datos misma rechazaría cualquier lectura cruzada basándose en las políticas de Postgres.
* **Implementación**:
  ```sql
  ALTER TABLE company_invitations ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "company_admin_view_own_invitations" ON company_invitations
    FOR SELECT USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));
  ```
* **Prueba**: Intentar consultar directamente la base de datos vía API REST de Supabase con token de usuario de otra empresa.
* **Estado**: Verificado.

---

## 🌐 Formato E: Contratos de Endpoints (B2B Admin)

### 1. GET /api/company/users
* **Acceso**: `company_admin`
* **Autenticación**: Bearer Token (Supabase JWT) + requireMFA.
* **Input**: Ninguno.
* **Output**:
  ```json
  {
    "users": [
      {
        "id": "u1-uuid...",
        "email_principal": "juan.perez@telefonica.com",
        "nombre1": "Juan",
        "apellido1": "Pérez",
        "role": "user",
        "plan": "pro",
        "suspended": false,
        "usage_count": 14
      }
    ]
  }
  ```
* **Errores**:
  * `401 Unauthorized` (Token expirado o ausente).
  * `403 Forbidden` (No es `company_admin`).
* **Datos Sensibles**: Exclusivamente metadatos básicos de perfil y volumen de uso agregados.
* **Auditoría**: Ninguna (Lectura simple).

---

## 💾 Formato F: Especificaciones de Tabla

### 1. Tabla: `company_allowlist`
* **Propósito**: Lista aprobada de emails corporativos autorizados para registrarse.
* **Campos**:
  * `id` (UUID, PK)
  * `company_id` (UUID, FK -> `companies.id`, Cascade)
  * `email` (TEXT, Unique por compañía)
  * `nombre` (TEXT, nullable)
  * `apellido` (TEXT, nullable)
  * `cohort` (TEXT, nullable)
  * `area` (TEXT, nullable)
  * `cargo_actual` (TEXT, nullable)
  * `status` (TEXT: `'pending'`, `'activated'`, `'revoked'`)
  * `created_at` (TIMESTAMP)
  * `activated_at` (TIMESTAMP, nullable)
* **RLS/Políticas**:
  * Lectura/Escritura reservada a `company_admin` cuyo `company_id` coincida.
* **Índices**: `idx_allowlist_company_email` en `(company_id, email)`.

---

## 🤖 Formato G: Interacción con IA en B2B (Gobernanza)
* **Caso**: Aunque el HR Admin no interactúa directamente con modelos de lenguaje, el módulo protege la confidencialidad técnica de las interacciones B2B.
* **Datos Enviados**: El backend prohíbe que el `company_admin` consulte prompts o respuestas que el usuario B2B haya enviado a la IA en módulos como CVOptimizer o Simulador de Entrevistas.
* **Proveedor/Modelo**: DeepSeek V3 (Inferencia corporativa aislada).
* **Anonimización previa**: No aplica en admin.
* **Criterio de Validación**: Toda analítica enviada a la vista de RRHH sobre el rendimiento de los colaboradores (ej: tasa de éxito en entrevistas) se calcula de forma abstracta e indirecta sin revelar datos textuales.

---

## ⚠️ Formato H: Registro de Riesgos (Módulo Admin)

| ID | Riesgo | Severidad | Impacto | Probabilidad | Mitigación | Dueño | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RSK-B2B-01** | Fuga de correos corporativos en carga masiva por intercepción de API. | Alta | Seguridad | Baja | Cifrado SSL/TLS 1.3 obligatorio. Validación estricta del JWT. | DevSecOps | Mitigado |
| **RSK-B2B-02** | Degradación accidental de rol de administrador al ser invitado como candidato. | Crítica | Operacional | Media | Pre-flight check en `POST /invitations` que bloquea invitaciones si el correo ya es admin o superadmin. | Backend Lead | Cerrado |
| **RSK-B2B-03** | Consumo excesivo de cuota de emails en invitaciones maliciosas masivas. | Media | Coste | Media | Aplicación de rate limiter en `/invitations` (máximo 100/hora por admin). | DevOps | Abierto |
