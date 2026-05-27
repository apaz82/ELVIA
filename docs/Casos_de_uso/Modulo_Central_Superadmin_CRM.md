# Documentación de Gobierno y Casos de Uso — Portal Superadmin & CRM de Marketing

Este documento detalla la gobernanza técnica y funcional del **Portal Superadmin, CRM y Analytics (Admin & elvia_knowledge)** de la plataforma ELVIA.

---

## 🧩 Formato B: Ficha de Módulo — Superadmin Portal

| Campo | Respuesta |
| :--- | :--- |
| **Módulo** | Portal Superadmin & CRM de Analíticas (Admin Dashboard). |
| **Responsabilidad** | **Qué resuelve**: Panel de control global del ecosistema para administradores generales. Permite monitorear la salud e integraciones del sistema en tiempo real (`UC-ADM-001`), dar de alta y configurar tenants B2B mediante un asistente multitenant (`UC-ADM-002`), eliminar usuarios bajo protocolo OTP de alta seguridad (`UC-ADM-003`), cargar documentos PDF/TXT a la base de conocimiento de la IA vectorizada (`elvia_knowledge`), y auditar logs.<br>**Qué NO resuelve**: Edición de configuraciones a nivel de base de datos Postgres física. |
| **Usuarios** | Roles: `super_admin` (`Superadmin@elvia.lat`). |
| **Casos de uso incluidos** | `UC-ADM-001`, `UC-ADM-002`, `UC-ADM-003`, `UC-ADM-004`. |
| **Datos que toca** | `companies`, `profiles`, `deletion_audit_log`, `elvia_knowledge`, `knowledge_logs`, `tenant_audit_log`. |
| **Endpoints** | `GET /api/admin/system-status`, `POST /api/admin/tenants`, `DELETE /api/admin/users/:id`, `POST /api/admin/users/delete-otp-request/:id`, `POST /api/admin/knowledge/upload`, `GET /api/admin/audit-log`. |
| **Reglas de negocio** | 1. **MFA y Rol Mandatorio**: Todos los endpoints exigen de forma obligatoria rol `super_admin` verificado mediante middleware `requireRole('super_admin')`.<br>2. **Borrado Protegido (OTP)**: Para eliminar permanentemente una cuenta de usuario, el superadmin debe solicitar un token OTP de un solo uso que se envía de forma encriptada a su correo, confirmando la acción antes de ejecutar el borrado en cascada.<br>3. **Paginación de Auditorías**: Toda consulta de auditoría debe paginarse de forma obligatoria (máximo 100 registros) para evitar saturación de base de datos. |
| **Dependencias** | Supabase Admin Client (Supabase Service Role Key bypass), Resend (Envío de OTPs e emails de bienvenida a HR), `pdf-parse` (Extraer texto de PDFs para base de conocimiento de IA). |
| **Riesgos** | Compromiso de credenciales de Superadmin o destrucción de cuentas por error operativo. |
| **Definition of Done** | - El sistema registra en `deletion_audit_log` el hash SHA-256 del correo del usuario borrado para cumplimiento GDPR.<br>- El asistente de creación de tenants completa la transacción insertando la compañía, creando el usuario HR y enviando el correo branded en una sola llamada. |

---

## 📄 Formato A: Casos de Uso de Superadmin

### 1. UC-ADM-001: Chequeo de Salud del Sistema (Integraciones)
* **ID**: `UC-ADM-001`
* **Nombre**: Chequeo de Salud de Integraciones Externas.
* **Actor principal**: `super_admin`.
* **Actores secundarios**: Supabase Auth/DB, Anthropic/DeepSeek API, Resend API, Sentry.
* **Objetivo**: Monitorear en tiempo real la disponibilidad y latencia de todas las APIs e integraciones terceras críticas que operan en el ecosistema.
* **Precondiciones**: Sesión activa con privilegios de super_admin.
* **Flujo principal**:
  1. El Superadmin ingresa a la pestaña "Estado del Sistema".
  2. El frontend realiza una llamada a `/api/admin/system-status`.
  3. El backend ejecuta pruebas de ping o lectura rápida en base de datos.
  4. Valida la presencia activa de las variables de entorno de DeepSeek/Anthropic y Resend.
  5. Mide la latencia de respuesta en milisegundos.
  6. Devuelve un mapa con el estatus individual de cada recurso (`'active'`, `'configured'`, `'inactive'`, `'error'`).
  7. El frontend renderiza un listado cromático visual de salud con widgets descriptivos.
* **Datos usados**: Configuración y estatus del sistema.
* **Pruebas mínimas**: Consultar el endpoint y validar que el widget de base de datos muestre `'active'` indicando la latencia exacta de respuesta (ej: `Latency: 28ms`).

---

### 2. UC-ADM-002: Alta Transaccional de Tenant B2B (Multi-tenant Wizard)
* **ID**: `UC-ADM-002`
* **Nombre**: Creación transaccional de nueva empresa y administrador HR.
* **Actor principal**: `super_admin`.
* **Actores secundarios**: Supabase Auth Admin, Resend Service.
* **Objetivo**: Configurar de extremo a extremo una nueva corporación en el portal en una sola llamada transaccional, automatizando el onboarding del partner.
* **Precondiciones**: Formulario de tenant rellenado (Nombre de empresa, slug único, dominio corporativo permitido, y datos del HR Admin).
* **Flujo principal**:
  1. El Superadmin ingresa al Wizard de Creación de Tenants.
  2. Ingresa el slug deseado; el sistema llama a `/api/admin/tenants/check-slug/:slug` para pre-validar en tiempo real la disponibilidad.
  3. Rellena los datos de branding (colores hexadecimales, co-branding modo, logo) y presiona "Crear Tenant".
  4. El backend inicia la transacción en base de datos:
     * Inserta la empresa en la tabla `companies`.
     * Crea un usuario auth para el HR Admin con una contraseña segura temporal.
     * Inserta el perfil correspondiente en `profiles` con rol `'company_admin'` y el `company_id` asignado.
     * Genera un enlace de recuperación de contraseña de Supabase (`recovery` link).
  5. El backend invoca a `resendService` y envía un email branded de bienvenida al HR Admin con el link para setear su contraseña y el acceso a su portal.
  6. Devuelve respuesta de éxito y el Superadmin visualiza la empresa en la lista de corporaciones.
* **Flujos alternos**:
  * *Slug duplicado*: Se rechaza la solicitud de inmediato con error `409 Conflict`.
* **Datos usados**: Metadatos de la compañía y del administrador.
* **Resultado esperado**: Empresa creada, administrador HR notificado.
* **Eventos de auditoría**: Registro en `tenant_audit_log` con acción `tenant_created`.
* **Pruebas mínimas**: Crear una empresa de prueba y validar que se envíe el correo de bienvenida con el enlace de recuperación y que el perfil se inserte con el rol `company_admin` exacto.

---

### 3. UC-ADM-003: Eliminación Segura de Cuentas mediante OTP y GDPR Compliance
* **ID**: `UC-ADM-003`
* **Nombre**: Eliminación permanente de usuarios protegida por OTP.
* **Actor principal**: `super_admin`.
* **Actores secundarios**: Supabase Auth Admin, Resend Service.
* **Objetivo**: Eliminar permanentemente una cuenta a petición del usuario protegiendo al sistema de destrucciones accidentales mediante una doble confirmación por token.
* **Precondiciones**: Solicitud formal de borrado por parte del titular.
* **Flujo principal**:
  1. El Superadmin localiza al usuario en el CRM y hace clic en "Eliminar cuenta".
  2. El sistema llama a `/api/admin/users/delete-otp-request/:id`.
  3. El backend genera un código OTP criptográfico seguro de un solo uso asociado a la ID del superadmin y lo persiste en caché por 10 minutos.
  4. Envía el código al email del superadmin mediante Resend: *"Código OTP de confirmación para eliminar la cuenta de [Email de usuario]"*.
  5. El sistema despliega un modal en el frontend solicitando el código recibido.
  6. El Superadmin ingresa el código OTP y confirma la acción.
  7. El backend valida el OTP; si es correcto:
     * Calcula el hash SHA-256 del correo del usuario objetivo para trazabilidad.
     * Inserta la auditoría en `deletion_audit_log` con estado `'completed'`.
     * Invoca al cliente admin de Supabase para borrar permanentemente al usuario de `auth.users` (borrado en cascada RLS activo).
  8. El modal se cierra y el usuario desaparece de la base de datos de forma limpia.
* **Datos usados**: `deleted_user_email_hash`, `admin_email`, `otp`.
* **Pruebas mínimas**: Intentar eliminar un usuario con un OTP inválido y validar el rechazo controlled HTTP 403. Ingresar OTP correcto y verificar el registro de hash SHA-256 en la tabla de auditoría.

---

## 🔒 Formato D: Reglas de Seguridad (Superadmin)

### 1. SEC-ADM-001: Restricción Absoluta de Endpoints por Rol
* **Declaración**: Ningún endpoint bajo la ruta `/api/admin/*` podrá responder a solicitudes de tokens con rol diferente a `super_admin`.
* **Motivo**: Prevenir escalaciones de privilegios de directores corporativos o usuarios regulares que intenten manipular logs generales o eliminar cuentas ajenas.
* **Implementación**: Middleware `requireRole('super_admin')` en backend.
* **Estado**: Verificado.

---

## 💾 Formato F: Especificaciones de Tabla

### 1. Tabla: `deletion_audit_log`
* **Propósito**: Trazabilidad legal de la eliminación permanente de cuentas para cumplimiento de normativas internacionales de privacidad (GDPR / LFPDPPP).
* **Campos**:
  * `id` (UUID, PK)
  * `deleted_user_id` (UUID)
  * `deleted_user_email_hash` (TEXT, Hash SHA-256 del email borrado)
  * `deleted_user_email_domain` (TEXT, Dominio del email)
  * `admin_id` (UUID, FK -> `profiles.id`)
  * `admin_email` (TEXT)
  * `status` (TEXT: `'pending'`, `'completed'`, `'failed'`)
  * `completed_at` (TIMESTAMP)
* **RLS**: Protegida estrictamente. Lecturas solo permitidas a Superadmin.

---

## ⚠️ Formato H: Registro de Riesgos (Superadmin Portal)

| ID | Riesgo | Severidad | Impacto | Probabilidad | Mitigación | Dueño | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RSK-ADM-01** | Destrucción involuntaria de cuentas administrativas por errores tipográficos en CRM. | Alta | Operacional | Media | Exigencia obligatoria de token OTP criptográfico por email antes de borrar cualquier registro. | Security Lead | Mitigado |
| **RSK-ADM-02** | Fuga del token de bypass de Supabase (`SUPABASE_SERVICE_ROLE_KEY`). | Crítica | Seguridad | Baja | Alojamiento exclusivo de claves en variables de entorno seguras de Railway (encriptadas en reposo y tránsito), prohibiendo su inclusión en commits. | DevOps | Cerrado |
