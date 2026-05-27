# Documentación de Gobierno y Casos de Uso — Waitlist & Sistema de Referidos

Este documento detalla la gobernanza técnica y funcional del **Módulo de Lista de Espera & Motor de Referidos (Waitlist & Referral Engine)** de la plataforma ELVIA.

---

## 🧩 Formato B: Ficha de Módulo — Waitlist & Referidos

| Campo | Respuesta |
| :--- | :--- |
| **Módulo** | Lista de Espera & Motor de Referidos Virales (Waitlist). |
| **Responsabilidad** | **Qué resuelve**: Captura de leads B2C de alta calidad interesados en la plataforma, asignación de código de referidos único (`UC-WT-001`), validación de códigos de invitación (`UC-WT-002`), contador de visualizaciones de landing page y envío de notificaciones de bienvenida branded.<br>**Qué NO resuelve**: Creación de cuentas o perfiles de candidatos en la base de datos Supabase Auth (se mantiene como una lista de leads externa pre-onboarding). |
| **Usuarios** | Roles: Público (Candidatos anónimos en lista de espera), `super_admin` (Auditor de leads). |
| **Casos de uso incluidos** | `UC-WT-001`, `UC-WT-002`, `UC-WT-003`. |
| **Datos que toca** | `waitlist_leads` (Inserción y lectura paginada). |
| **Endpoints** | `GET /api/waitlist` (Listar leads), `POST /api/waitlist` (Registrar lead), `GET /api/waitlist/check-code/:code` (Validar código), `POST /api/waitlist/track` (Incrementar vistas). |
| **Reglas de negocio** | 1. **Rate Limiting Estricto**: Máximo 5 registros de lista de espera por hora por IP para prevenir ataques de denegación de servicio (DDoS) o spam.<br>2. **Código Único Determinístico**: El código de referidos se genera uniendo las primeras 3 letras del nombre con un string aleatorio de 4 caracteres en mayúscula (ej: `CAR-4X8F`).<br>3. **Whitelist de Situación**: Se valida estrictamente en backend que la situación laboral del candidato coincida con los 3 valores aprobados. |
| **Dependencias** | Resend (Emails de bienvenida a lista de espera), Supabase pg_rpc (Contador views). |
| **Riesgos** | Spam de registros falsos o inyección de dominios de email temporales. |
| **Definition of Done** | - El email de bienvenida se envía de forma asíncrona sin bloquear la respuesta HTTP 201 en backend.<br>- El código de referido validado devuelve `{ valid: true }` o `{ valid: false }` según corresponda. |

---

## 📄 Formato A: Casos de Uso de Lista de Espera

### 1. UC-WT-001: Registro en Waitlist y Asignación de Código de Referido
* **ID**: `UC-WT-001`
* **Nombre**: Registro en Waitlist y generación de código viral de referido.
* **Actor principal**: Candidato anónimo.
* **Actores secundarios**: Supabase Admin SDK, Resend Service.
* **Objetivo**: Capturar un nuevo prospecto B2C e incentivar la viralidad mediante un enlace exclusivo de recomendación.
* **Precondiciones**: Formulario de Landing de Lista de Espera completado.
* **Flujo principal**:
  1. El Candidato ingresa sus datos (Nombre, Apellido, Indicativo, Teléfono, País, Email, Situación laboral, y Aceptación de Políticas).
  2. Presiona "Unirme a la lista de espera".
  3. El backend valida el formato de correo mediante regex y bloquea errores tipográficos obvios (ej: terminados en `.con` en vez de `.com`).
  4. Valida que el email no esté duplicado en la tabla `waitlist_leads`.
  5. Genera un código de referidos determinístico de 8 dígitos (ej: `MAR-T5X8`).
  6. Inserta el registro en la base de datos mediante el bypass admin.
  7. El backend prepara un enlace viral branded: `https://elvia.lat/waitlist?ref=MAR-T5X8`.
  8. Llama de forma asíncrona a `sendWelcomeWaitlistEmail` para notificar al usuario.
  9. Devuelve respuesta HTTP 201 con el código de referido y el link para compartir.
* **Flujos alternos**:
  * *Correo duplicado*: El backend responde de inmediato con HTTP 400 y mensaje controlado: *"Este correo electrónico ya está registrado en la lista de espera"*.
* **Datos usados**: `nombre`, `apellido`, `telefono`, `pais`, `email`, `situacion`, `referred_by`.
* **Pruebas mínimas**: Intentar registrarse dos veces con el mismo correo y validar el disparo del bloqueo controlado por duplicidad.

---

### 2. UC-WT-002: Validación de Código de Referido en Registro
* **ID**: `UC-WT-002`
* **Nombre**: Validación de código de referido / invitación en onboarding.
* **Actor principal**: Candidato en registro.
* **Actores secundarios**: Supabase DB.
* **Objetivo**: Verificar que un código de referido proporcionado por el usuario en la URL o formulario existe y es válido en el sistema.
* **Precondiciones**: Código introducido en los parámetros de consulta.
* **Flujo principal**:
  1. El frontend extrae el código del parámetro de consulta (ej: `?ref=CODE`).
  2. Llama al endpoint `/api/waitlist/check-code/:code`.
  3. El backend realiza una consulta exacta en `waitlist_leads` buscando el `referral_code`.
  4. Si existe, responde `{ valid: true }`.
  5. El frontend visualiza el código como válido de forma interactiva y lo asocia al payload de registro.
* **Flujos alternos**:
  * *Código inexistente*: Si no hay coincidencias, devuelve HTTP 404 `{ valid: false }` y el frontend alerta al usuario.
* **Pruebas mínimas**: Consultar el endpoint con un código aleatorio inválido y confirmar la respuesta `{ valid: false }`.

---

## 🔒 Formato D: Reglas de Seguridad (Waitlist)

### 1. SEC-WT-001: Rate Limiting por IP Anti-Spam
* **Declaración**: El endpoint `POST /api/waitlist` debe contar con un límite estricto de máximo 5 peticiones por hora por dirección IP.
* **Motivo**: Prevenir que competidores o bots bombardeen el portal con miles de correos falsos, saturando el saldo de emails del servicio Resend y corrompiendo la base de datos de marketing con leads basura.
* **Implementación**: Middleware `express-rate-limit` configurado por IP de cliente.
* **Estado**: Verificado.

---

## 💾 Formato F: Especificaciones de Tabla

### 1. Tabla: `waitlist_leads`
* **Propósito**: Registro centralizado de prospectos B2C e incentivos de referidos.
* **Campos**:
  * `id` (UUID, PK)
  * `nombre` (TEXT, 2-100 chars)
  * `apellido` (TEXT, 2-100 chars)
  * `email` (TEXT, Unique)
  * `telefono` (TEXT, nullable)
  * `pais` (TEXT)
  * `situacion` (TEXT)
  * `origen` (TEXT)
  * `referral_code` (TEXT, Unique)
  * `referred_by` (TEXT, nullable, FK -> `waitlist_leads.referral_code`)
  * `created_at` (TIMESTAMP)
