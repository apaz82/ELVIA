# Documentación de Gobierno y Casos de Uso — Módulo B2B Onboarding & Bienvenida

Este documento detalla la gobernanza técnica y funcional del **Módulo de Onboarding y Bienvenida Corporativa B2B (BienvenidaOnboarding & RegistroEmpresa)** de la plataforma ELVIA.

---

## 🧩 Formato B: Ficha de Módulo — B2B Onboarding

| Campo | Respuesta |
| :--- | :--- |
| **Módulo** | Onboarding y Bienvenida Corporativa B2B. |
| **Responsabilidad** | **Qué resuelve**: Captura y validación de accesos de nuevos colaboradores corporativos de forma branded, ofreciendo un flujo de bienvenida inmersivo con diseño Apple-style y ambientación lúdica de preparación mental antes de iniciar el proyecto de autoconocimiento.<br>**Qué NO resuelve**: Creación manual de perfiles de candidatos externos al tenant corporativo, o reseteo de contraseñas de terceros. |
| **Usuarios** | Roles: `user` (Colaboradores B2B recién autorizados). |
| **Casos de uso incluidos** | `UC-B2B-ONB-001`, `UC-B2B-ONB-002`. |
| **Datos que toca** | `company_allowlist` (lectura/actualización), `profiles` (creación inicial de cuenta), `companies` (lectura de branding). |
| **Endpoints** | `GET /api/company/registration/:slug`, `POST /api/company/registration/:slug`. |
| **Reglas de negocio** | 1. Si la empresa tiene habilitado `require_allowlist`, solo se permitirá el registro si el email del colaborador está pre-aprobado en `company_allowlist` con estado `'pending'`. <br>2. Al activarse la cuenta, el registro correspondiente en `company_allowlist` debe actualizar su estatus a `'activated'`, guardando el timestamp y la ID del usuario creado. <br>3. Los colaboradores B2B están exentos de verificar correo por inbox si su dominio coincide con el corporativo pre-aprobado. |
| **Dependencias** | HTML5 Canvas (Ambient Canvas dinámico), Supabase Auth. |
| **Riesgos** | Registro malicioso mediante suplantación de identidad o secuestro de cuentas de prueba. |
| **Definition of Done** | - El Canvas de ambiente renderiza de forma fluida a 60 FPS sin bloquear la CPU.<br>- El script `allowlist_mario.js` pre-aprueba de forma aislada las cuentas de demo en los tenants de Telefónica. |

---

## 📄 Formato A: Casos de Uso de Onboarding B2B

### 1. UC-B2B-ONB-001: Registro Autorizado por Dominio y Allowlist
* **ID**: `UC-B2B-ONB-001`
* **Nombre**: Auto-registro de colaborador corporativo con control de dominio y allowlist.
* **Actor principal**: `user` (Colaborador corporativo).
* **Actores secundarios**: Supabase Auth, Base de datos.
* **Objetivo**: Asegurar que solo colaboradores válidos de la empresa asociada puedan registrarse bajo el programa co-branded.
* **Precondiciones**: La empresa cuenta con un tenant activo en ELVIA y ha configurado dominio (`allowed_email_domain`) o lista autorizada (`require_allowlist`).
* **Flujo principal**:
  1. El Colaborador ingresa a la página branded de registro (ej: `/empresas/telefonica/registro`).
  2. El sistema carga dinámicamente los estilos y configuraciones de Telefónica llamando a `/api/company/registration/telefonica`.
  3. El Colaborador rellena el formulario de registro con su correo corporativo (ej: `mario.bahamonde@telefonica.com`).
  4. Al hacer clic en "Registrarme", el backend valida que el dominio del correo coincida exactamente con `@telefonica.com`.
  5. Adicionalmente, comprueba que el email figure en `company_allowlist` en estado `pending`.
  6. Si pasa los controles, el backend registra la cuenta en Supabase Auth, marca el correo en `company_allowlist` como `activated` y vincula el `company_id` del colaborador a su perfil en `profiles`.
  7. El Colaborador es redirigido automáticamente a la pantalla de Bienvenida Corporativa.
* **Flujos alternos**:
  * *Correo no pre-aprobado*: El backend rechaza el registro devolviendo: *"Tu correo no está en la lista aprobada del programa. Contacta a tu área de RRHH para que te incluyan."*
  * *El correo ya existe (B2C)*: Si el usuario ya tenía una cuenta B2C, el backend rechaza el enlace automático sin autenticación previa para evitar secuestro de cuentas ajenas (petición de seguridad crítica Audit P0), recomendando iniciar sesión.
* **Datos usados**: `email`, `nombre`, `apellido`, `password`.
* **Permisos**: Ninguno (Público autenticado post-validación).
* **Resultado esperado**: Colaborador registrado y asignado al tenant corporativo.
* **Criterios de aceptación**: 
  * Se bloquean registros externos con código HTTP `403 Forbidden`.
  * Consentimiento explícito de términos de privacidad guardado con fecha y versión exacta (`pii_consent_at`).
* **Eventos de auditoría**: Registro en `tenant_audit_log` con acción `user_invited_allowlist_completed`.
* **Pruebas mínimas**: Intentar registrarse con correo inválido o ajeno al allowlist y verificar la respuesta controlada de error.

---

### 2. UC-B2B-ONB-002: Inmersión en Bienvenida Corporativa
* **ID**: `UC-B2B-ONB-002`
* **Nombre**: Visualización de pantalla inmersiva de Bienvenida.
* **Actor principal**: `user`.
* **Actores secundarios**: Frontend Component Canvas.
* **Objetivo**: Proporcionar al colaborador una interfaz ejecutiva y relajante para prepararse mentalmente antes de iniciar el programa de autoconocimiento.
* **Precondiciones**: Registro exitoso.
* **Flujo principal**:
  1. El Colaborador visualiza una interfaz minimalista y Premium de Bienvenida con un fondo oscuro de alta fidelidad y un Canvas interactivo de partículas en suspensión (`AmbientCanvas`).
  2. El sistema despliega un mensaje motivacional de gran tamaño enfocado en la importancia del tiempo de calidad: *"El tiempo que te tomes no importa — lo que importa es conocerte"*.
  3. Muestra una grilla con recomendaciones claras para maximizar la sesión (Lugar tranquilo, música relajante, datos laborales disponibles).
  4. Al hacer clic en "Comenzar mi proceso", el Colaborador es redirigido al Módulo de Proyecto Laboral.
* **Datos usados**: Ninguno (Interfaz estática).
* **Resultado esperado**: Renderizado animado sin interrupciones con co-branding.
* **Pruebas mínimas**: Acceder a `/bienvenida` y validar el render fluido de las partículas en canvas y la redirección exitosa.

---

## 🔒 Formato D: Reglas de Seguridad (Onboarding)

### 1. SEC-B2B-ONB-001: Bloqueo de Relink Silencioso (Defensa P0)
* **Declaración**: Si un colaborador intenta registrarse en un programa corporativo con un email que ya existe en el sistema Supabase Auth, el registro abierto jamás vinculará la cuenta de forma silenciosa al tenant corporativo. Debe denegarse el registro abierto y redirigirse al flujo de inicio de sesión o recuperación controlada de RRHH.
* **Motivo**: Evitar ataques de secuestro de cuentas donde un atacante registra un correo existente para forzar la vinculación y extracción de contexto o roles.
* **Implementación**: Validación explícita en `POST /api/company/registration/:slug` que intercepta fallos de duplicados de Supabase Auth y responde con el código de error `EMAIL_EXISTS`.
* **Estado**: Verificado.

---

## 💾 Formato F: Especificaciones de Tabla

### 1. Script de Soporte y Reset Aislado B2B: `allowlist_mario.js`
* **Propósito**: Script automatizado de soporte técnico en testing para restaurar de forma aislada el ambiente de pruebas. Permite borrar registros residuales del colaborador demo `mario.bahamonde@telefonica.com` y pre-aprobar la cuenta limpia bajo el tenant de Telefónica para pruebas de onboarding de extremo a extremo sin contaminar logs generales.
* **Acción**:
  1. Borrar usuario en Supabase Auth con email `mario.bahamonde@telefonica.com`.
  2. Borrar registro correspondiente en `company_allowlist` y `profiles`.
  3. Insertar entrada en `company_allowlist` con estado `'pending'` asociada al `company_id` de Telefónica.

---

## 🤖 Formato G: Interacción con IA en Onboarding
* **Caso**: Extracción automatizada de información de perfiles desde el currículum del candidato durante la primera carga de onboarding.
* **Proveedor/Modelo**: DeepSeek V3.
* **Redacción Previa**: Se eliminan del buffer de entrada metadatos del sistema y PII redundante de contacto antes del parseo NLP.
* **Salida Esperada**: Estructura JSON con las secciones: *Habilidades Técnicas, Trayectoria, Aspiraciones*.
* **Fallback**: Si falla la IA, la aplicación permite al usuario rellenar los datos de onboarding de forma manual con ayuda guiada interactiva.

---

## ⚠️ Formato H: Registro de Riesgos (Onboarding B2B)

| ID | Riesgo | Severidad | Impacto | Probabilidad | Mitigación | Dueño | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RSK-ONB-01** | Abandono del onboarding debido a preguntas demasiado largas. | Media | UX | Alta | División de las preguntas del proyecto laboral en 5 bloques dinámicos independientes con guardado automático continuo. | UX Lead | Mitigado |
| **RSK-ONB-02** | Registro fraudulento de emails utilizando dominios corporativos ficticios. | Alta | Seguridad | Baja | Validación estricta del SPF/DKIM y allowlist controlado directamente por el administrador de RRHH corporativo. | DevOps | Cerrado |
