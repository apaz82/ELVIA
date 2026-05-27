# Documentación de Gobierno y Casos de Uso — Portal de Acceso B2B, Autenticación MFA y Registro Co-Branded

Este documento detalla la gobernanza técnica y funcional del **Portal de Acceso B2B, Autenticación MFA y Registro Co-Branded (LoginHR.jsx, RegistroEmpresa.jsx y TenantContext.jsx)** de la plataforma ELVIA.

---

## 🧩 Formato B: Ficha de Módulo — Portal de Acceso B2B & MFA

| Campo | Respuesta |
| :--- | :--- |
| **Módulo** | Portal de Acceso B2B, Autenticación Multi-Factor (MFA) y Registro Co-Branded. |
| **Responsabilidad** | **Qué resuelve**: Autenticación segura de administradores de empresas (`company_admin`), enrolamiento y validación obligatoria de MFA TOTP (Google Authenticator/Authy) en tenants regulados, bloqueo de inicio de sesión de roles candidatas (`user`) en el portal HR, aislamiento cross-tenant (bloqueo de accesos cruzados entre empresas) y auto-registro co-branded de empleados por slug corporativo permitiendo la vinculación de cuentas existentes sin duplicidades.<br>**Qué NO resuelve**: Restablecimiento manual de llaves MFA (gestionado por el Superadmin desde el CRM de soporte), ni creación de tenants (gestionado por Superadmin). |
| **Usuarios** | Roles: `company_admin`, `super_admin`, `user` (para auto-registro B2B inicial). |
| **Casos de uso incluidos** | `UC-B2B-ATH-001`, `UC-B2B-ATH-002`, `UC-B2B-ATH-003`. |
| **Datos que toca** | `profiles.role`, `profiles.company_id`, `companies` (lectura de configuraciones de seguridad `require_mfa`, domain restrictions, etc.), `supabase.auth.factors` (metadatos MFA Supabase). |
| **Endpoints** | `POST /api/company/registration/:slug` (registro/vinculación de cuentas), consultas Supabase de AAL (Authenticator Assurance Level) y factores TOTP en frontend. |
| **Reglas de negocio** | 1. **Doble Factor Obligatorio (MFA Enforcement)**: Si el tenant posee `require_mfa = true`, el sistema bloquea el redireccionamiento a `/empresa-admin` hasta que el administrador complete el reto MFA, elevando el token de sesión a nivel de seguridad `aal2`.<br>2. **Rechazo de Candidato (Candidate Rejection Gate)**: Si un usuario con rol `user` intenta loguearse en la ruta `/empresas/:slug/hr`, el sistema deniega el acceso, borra la sesión local (`logout`) y lo redirige al landing de candidato con un mensaje de advertencia.<br>3. **Aislamiento Cruzado (Cross-Tenant Lock)**: Un `company_admin` con un `company_id` asignado tiene prohibido ingresar al portal HR de cualquier otro slug corporativo, forzando la desconexión del usuario. |
| **Dependencias** | Supabase Auth MFA APIs (`supabase.auth.mfa`), Turnstile captcha de Cloudflare (`@marsidev/react-turnstile`), `TenantContext` para renderizado dinámico de temas de color de marca y Phosphor Icons. |
| **Riesgos** | Pérdida del dispositivo autenticador (MFA Lockout) por parte del administrador corporativo. |
| **Definition of Done** | - El flujo de MFA realiza la transición limpia de estados (`enroll` con código QR, `verify` con token numérico) persistiendo la sesión de forma encriptada.<br>- El enlace de cuentas preexistentes (`linked`) se ejecuta en el backend bajo una única transacción de base de datos Postgres sin duplicados en Supabase Auth. |

---

## 📄 Formato A: Casos de Uso de Acceso, MFA y Registro B2B

### 1. UC-B2B-ATH-001: Autenticación de Administrador B2B con Desafío MFA TOTP
* **ID**: `UC-B2B-ATH-001`
* **Nombre**: Login de HR Admin con enrolamiento y verificación obligatoria de MFA TOTP.
* **Actor principal**: `company_admin`.
* **Actores secundarios**: Supabase Auth (Servidor de MFA).
* **Objetivo**: Asegurar el acceso administrativo a los portales corporativos mediante un segundo factor de autenticación física, protegiendo las bases de datos de empleados.
* **Precondiciones**: Cuenta administrativa pre-aprobada en el sistema. El tenant requiere MFA (`tenant.require_mfa = true`).
* **Flujo principal**:
  1. El Administrador de RRHH ingresa a `/empresas/:slug/hr`.
  2. El sistema recupera el contexto co-branded (colores primarios/secundarios y logos de la compañía) y renderiza el formulario de inicio de sesión.
  3. El Administrador introduce correo y contraseña y presiona "Acceder".
  4. El sistema inicia sesión; el backend detecta el nivel actual `aal1` (Assurance Level 1) e identifica la política de MFA requerida.
  5. **Sub-flujo A: Primer Ingreso (Enrolamiento MFA)**:
     1. El sistema detecta que el usuario no tiene factores MFA registrados.
     2. Despliega la pantalla de enrolamiento presentando un código QR dinámico generado por la API de TOTP de Supabase.
     3. El usuario escanea el QR en su aplicación móvil (ej: Google Authenticator).
     4. Introduce el código de 6 dígitos resultante en la pantalla y presiona "Activar autenticador".
     5. El sistema valida el código mediante `challengeAndVerify`. Al ser correcto, el factor queda marcado como verificado y la sesión asciende a nivel `aal2`.
  6. **Sub-flujo B: Ingresos Posteriores (Verificación MFA)**:
     1. El sistema detecta factores ya verificados y despliega la pantalla de reto de 6 dígitos.
     2. El usuario introduce su token numérico activo.
     3. El sistema valida mediante `supabase.auth.mfa.verify`. Al ser válido, la sesión se eleva a nivel `aal2`.
  7. Al completarse exitosamente la verificación a nivel `aal2`, el sistema redirige al usuario al panel de administración `/empresa-admin`.
* **Flujos alternos**:
  * *Código incorrecto*: El sistema muestra un mensaje de error en rojo: "Código incorrecto o expirado" y permite reintentar sin cerrar la sesión de primer nivel.
* **Datos usados**: `email`, `password`, `mfaCode`.
* **Criterios de aceptación**: Toda la secuencia de MFA debe ocurrir sin recargas completas de la página de React (single-page flow) y el input del código debe autocompletar solo valores numéricos de longitud exacta 6.
* **Pruebas mínimas**: Loguearse con cuenta HR demo y validar la aparición inmediata del código QR y su posterior validación exitosa.

---

### 2. UC-B2B-ATH-002: Bloqueo de Tenant Cruzado y Rechazo de Candidato
* **ID**: `UC-B2B-ATH-002`
* **Nombre**: Aislamiento cross-tenant y restricción de perfiles candidatos en Login HR.
* **Actor principal**: `user` o `company_admin` infractor.
* **Actores secundarios**: `AuthContext`, Supabase Auth.
* **Objetivo**: Neutralizar el acceso no autorizado de colaboradores a las herramientas de control y evitar fugas de datos entre diferentes empresas clientes.
* **Precondiciones**: Intento de inicio de sesión en un slug B2B específico.
* **Flujo principal (Rechazo de Rol Candidato)**:
  1. Un Colaborador regular (`role = 'user'`) intenta loguearse en `/empresas/telefonica/hr`.
  2. Introduce sus credenciales y presiona iniciar sesión.
  3. El sistema valida las credenciales básicas de Supabase Auth.
  4. El hook de efecto intercepta que el perfil de usuario tiene el rol `'user'`.
  5. El sistema activa un bloqueo: despliega un banner de advertencia naranja, destruye de inmediato el token de sesión activo ejecutando un `logout()` automático y restringe la navegación.
* **Flujo principal (Aislamiento Cross-Tenant)**:
  1. Un Administrador corporativo de la empresa "A" (`company_id = company_a_uuid`) intenta ingresar a `/empresas/empresa_b/hr`.
  2. El hook de autenticación cruza el ID del tenant asociado al slug del navegador (`company_b_uuid`) contra el `company_id` del perfil de usuario (`company_a_uuid`).
  3. Al detectar la incompatibilidad, el sistema muestra el error: *"Esta cuenta HR no pertenece al programa de [Empresa B]..."*, destruye la sesión y bloquea la navegación.
* **Pruebas mínimas**: Iniciar sesión como candidato regular en la ruta HR de Telefónica y verificar que el sistema cierre la sesión automáticamente e impida el acceso.

---

### 3. UC-B2B-ATH-003: Auto-Registro de Empleado por Slug y Enlace de Cuentas Existentes
* **ID**: `UC-B2B-ATH-003`
* **Nombre**: Auto-registro B2B por slug con validación de allowlist y enlace no destructivo.
* **Actor principal**: `user` (Colaborador).
* **Actores secundarios**: Supabase DB, NodeJS backend.
* **Objetivo**: Permitir a los colaboradores corporativos auto-registrarse de forma autónoma garantizando co-branding visual, validando su pertenencia en la lista aprobada y enlazando perfiles existentes si ya contaban con cuenta candidata en el sistema.
* **Precondiciones**: Registro en allowlist en estado `pending`.
* **Flujo principal**:
  1. El Colaborador ingresa a `/empresas/:slug/registro`.
  2. El sistema carga los logos y colores de marca asociados al slug.
  3. El usuario completa nombre, apellido, correo corporativo y contraseña de alta seguridad.
  4. Marca obligatoriamente la casilla de consentimiento y protección de datos.
  5. Envía la solicitud. El backend NodeJS intercepta el payload:
     * Verifica que el dominio coincida con el dominio del tenant, si aplica.
     * Comprueba que el correo electrónico exista en `company_allowlist` con estado `'pending'`.
  6. **Sub-flujo A (Nuevo Usuario)**:
     1. El backend crea el usuario en Supabase Auth, asigna su rol a `user`, vincula su `company_id` y actualiza la allowlist a `'activated'`.
     2. Muestra pantalla de éxito y redirige a la Bienvenida B2B.
  7. **Sub-flujo B (Vinculación / Link Account)**:
     1. El backend detecta que el email ya posee una cuenta B2C activa.
     2. En lugar de arrojar error de duplicados en la base de datos, actualiza el perfil del usuario asignándole el `company_id` del tenant corporativo y marca la allowlist como `'activated'`.
     3. Muestra la pantalla premium: *"Cuenta vinculada al programa"*, indicando que mantenga su contraseña original.
* **Datos usados**: `email`, `nombre`, `apellido`, `password`.
* **Eventos de auditoría**: Registro en logs administrativos con etiquetas `allowlist_link_success` o `user_registered_b2b`.
* **Pruebas mínimas**: Intentar auto-registrarse con un email ausente en la allowlist y verificar la respuesta de alerta en color ámbar.

---

## 🔒 Formato D: Reglas de Seguridad (Acceso y Auth B2B)

### 1. SEC-B2B-ATH-001: Exigencia de Sesión Multifactorial a Nivel de Base de Datos
* **Declaración**: Para toda tabla que contenga datos corporativos agregados o logs de administración B2B, las políticas de Supabase RLS exigirán que el nivel de autenticación del JWT sea obligatoriamente `aal2` si el tenant lo requiere.
* **Motivo**: Prevenir que un atacante que secuestre una contraseña de administrador (de nivel `aal1`) pueda consultar la base de datos si no cuenta con la llave física MFA.
* **Implementación**:
  ```sql
  CREATE POLICY "Solo accesos con MFA verificado pueden leer logs"
  ON tenant_audit_log FOR SELECT
  USING (
    (SELECT require_mfa FROM companies WHERE id = company_id) = false
    OR auth.jwt() ->> 'aal' = 'aal2'
  );
  ```
* **Estado**: Verificado.

---

## 💾 Formato F: Especificaciones de Tabla

### 1. Modificación de Tabla: `companies` (Parámetros de Seguridad y MFA)
* **Propósito**: Configuración de restricciones funcionales y de seguridad por cada tenant corporativo.
* **Columnas Críticas de Gobierno**:
  * `require_mfa` (BOOLEAN): Indica si los administradores de este tenant deben contar obligatoriamente con segundo factor verificado.
  * `allowed_email_domain` (VARCHAR): Dominio de correo exclusivo permitido para el auto-registro (ej: `telefonica.com`).
  * `require_allowlist` (BOOLEAN): Si es true, el auto-registro de colaboradores requiere comprobación estricta de la tabla `company_allowlist`.
  * `support_email` (VARCHAR) & `contact_email` (VARCHAR): Direcciones institucionales para incidencias de enrolamiento.

---

## 🌐 Formato E: Contratos de Endpoints (Registro B2B)

### 1. POST `/api/company/registration/:slug`
* **Acceso**: Público (Validación por Cloudflare Turnstile).
* **Input**:
  ```json
  {
    "email": "mario.bahamonde@telefonica.com",
    "password": "StrongPassword123!",
    "nombre": "Mario",
    "apellido": "Bahamonde"
  }
  ```
* **Output (Nuevo Registro)**:
  ```json
  {
    "success": true,
    "user_id": "u-uuid...",
    "linked": false
  }
  ```
* **Output (Vinculación de Cuenta Existente)**:
  ```json
  {
    "success": true,
    "user_id": "u-uuid...",
    "linked": true
  }
  ```
* **Errores**:
  * `400 Bad Request` (Password no cumple requisitos de fuerza).
  * `403 Forbidden` (El correo no se encuentra registrado en el allowlist del tenant).
  * `409 Conflict` (El correo ya está registrado con privilegios administrativos en otra empresa).

---

## ⚠️ Formato H: Registro de Riesgos (Acceso & MFA)

| ID | Riesgo | Severidad | Impacto | Probabilidad | Mitigación | Dueño | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RSK-ATH-01** | Bloqueo total de un administrador por pérdida de su token MFA (MFA Lockout). | Alta | Operación | Baja | Protocolo offline de validación de identidad para administradores B2B, permitiendo al Superadmin revocar el factor MFA en Supabase mediante una OTP protegida en el CRM central. | Superadmin | Mitigado |
| **RSK-ATH-02** | Evasión de validaciones de allowlist al registrarse por métodos alternativos (OAuth/Google). | Alta | Seguridad | Media | Bloqueo absoluto de inicios de sesión sociales en rutas B2B en Supabase Auth, forzando la autenticación por contraseña tradicional con validación sintáctica de correo en el endpoint. | Security Lead | Mitigado |
