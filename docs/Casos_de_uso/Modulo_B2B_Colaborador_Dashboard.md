# Documentación de Gobierno y Casos de Uso — Dashboard de Colaborador B2B (V2)

Este documento detalla la gobernanza técnica y funcional del **Dashboard de Colaborador B2B V2 (Ecosistema de Carrera & Bienestar Emocional)** de la plataforma ELVIA.

---

## 🧩 Formato B: Ficha de Módulo — Dashboard de Colaborador B2B

| Campo | Respuesta |
| :--- | :--- |
| **Módulo** | Dashboard Ejecutivo B2B & Bienestar Emocional del Colaborador (V2). |
| **Responsabilidad** | **Qué resuelve**: Panel unificado de control de carrera para colaboradores corporativos. Permite ver el progreso estratégico de autoconocimiento, evaluar la salud mental durante la transición de carrera y medir la compatibilidad (Match) de su currículum frente al mercado.<br>**Qué NO resuelve**: Modificación directa del perfil corporativo de la empresa, descarga o alteración de bases de datos colectivas. |
| **Usuarios** | Roles: `user` (Colaborador B2B / Candidato). |
| **Casos de uso incluidos** | `UC-B2B-EMP-001`, `UC-B2B-EMP-002`. |
| **Datos que toca** | `profiles.bienestar_data` (JSONB), `cv_results` (lectura de historial de match), `saved_jobs` (lectura de estatus de postulaciones). |
| **Endpoints** | Lecturas/Escrituras directas mediante Supabase Client (`authService` y llamadas a base de datos de Supabase). |
| **Reglas de negocio** | 1. Ocultar de manera estricta los créditos de IA para usuarios vinculados a un tenant corporativo B2B.<br>2. Habilitar la infografía de autoconocimiento en formato Harvard solo cuando el Grado de Autoconocimiento sea superior al 70%. |
| **Dependencias** | Supabase JS SDK, Lucide/Phosphor Icons, `@phosphor-icons/react`. |
| **Riesgos** | Fatiga del usuario por completar encuestas emocionales continuas o desinterés en el autoconocimiento. |
| **Definition of Done** | - El Gauge circular de Match renderiza a 85% por defecto si no existen análisis previos.<br>- Los check-ins diarios se almacenan y muestran cromáticamente con colores armónicos y accesibles. |

---

## 📄 Formato A: Casos de Uso del Colaborador B2B

### 1. UC-B2B-EMP-001: Consulta de Dashboard Ejecutivo y Status de Autoconocimiento
* **ID**: `UC-B2B-EMP-001`
* **Nombre**: Visualización de Dashboard Ejecutivo B2B y Progreso de Autoconocimiento.
* **Actor principal**: `user` (Colaborador B2B).
* **Actores secundarios**: Supabase DB.
* **Objetivo**: Proveer al colaborador una visión 360° de su avance en el programa de transición laboral, destacando el co-branding institucional de su empresa.
* **Precondiciones**: Usuario autenticado y vinculado a un tenant activo (ej: Telefónica).
* **Flujo principal**:
  1. El Colaborador inicia sesión o accede a la ruta `/dashboard`.
  2. El sistema detecta su contexto de tenant y carga la cabecera branded: *"operado por ELVIA · [Nombre de Empresa] Corporativo"* con el logo oficial de la empresa.
  3. El sistema calcula en tiempo real el **Grado de Autoconocimiento** sumando los puntos acumulados en sus 5 Pilares Estratégicos (Mi Perfil, Autoconocimiento, Oferta de Valor, Semana Laboral, Recursos Activos).
  4. Muestra un Dial circular SVG Premium de Match indicando su compatibilidad promedio contra vacantes objetivo (o un indicador simulado al 85% de target si aún no tiene análisis).
  5. Habilita una campana con notificaciones ejecutivas personalizadas según los pilares que le falte completar.
* **Flujos alternos**:
  * *Usuario sin tenant (B2C)*: El sistema renderiza la cabecera estándar de ELVIA Pro, habilita la visualización de créditos de IA restantes y oculta las referencias del tenant corporativo.
* **Datos usados**: `perfil`, `jpData` (Career Project Data).
* **Permisos**: Rol `user` o `company_admin`.
* **Resultado esperado**: Renderizado responsivo del dashboard con cabecera premium y barra de progreso de autoconocimiento.
* **Criterios de aceptación**: Hilos de carga en menos de 1.5s; el gauge circular se adapta perfectamente a dispositivos móviles.
* **Eventos de auditoría**: Registro básico de sesión en logs.
* **Pruebas mínimas**: Iniciar sesión con cuenta demo pre-aprobada y validar que el co-branding del partner aparezca al 100% y se oculten los créditos de IA.

---

### 2. UC-B2B-EMP-002: Registro y Monitoreo de Bienestar de Búsqueda
* **ID**: `UC-B2B-EMP-002`
* **Nombre**: Evaluación y registro de estado de ánimo diario y radar semanal.
* **Actor principal**: `user`.
* **Actores secundarios**: Supabase DB.
* **Objetivo**: Ofrecer un espacio seguro y estructurado para registrar la salud mental durante la búsqueda de empleo, proporcionando micro-interacciones interactivas.
* **Precondiciones**: Sesión activa de usuario.
* **Flujo principal**:
  1. En el panel lateral "Soporte Emocional", el colaborador visualiza el **Micro-Calendario Cromático** de los últimos 14 días.
  2. Hace clic en "Check-in diario".
  3. El sistema despliega un selector amigable con 7 emociones codificadas por colores armónicos (Confiado, Motivado, Tranquilo, Cansado, Ansioso, Frustrado, Triste) asociadas a iconos dinámicos de Phosphor.
  4. El usuario selecciona su emoción del día.
  5. El sistema guarda la emoción en el objeto `bienestar_data.checkins` indexada por la fecha actual (`YYYY-MM-DD`).
  6. El micro-calendario se actualiza de inmediato pintando la burbuja del día de hoy con el color correspondiente (ej: verde suave para *Confiado*, azul pastel para *Motivado*).
* **Flujos alternos**:
  * *Registro de Radar Semanal*: El usuario hace clic en "Evaluar mi semana" y califica de 1 a 5 mediante barras interactivas sus 5 ejes críticos de salud mental: Energía, Confianza, Enfoque, Ansiedad y Resiliencia. El sistema calcula y grafica el radar en tiempo real.
* **Datos usados**: `bienestar_data.checkins`, `bienestar_data.radar`.
* **Permisos**: Propietario de la cuenta (`auth.uid() = id`).
* **Resultado esperado**: Persistencia inmediata en el campo `bienestar_data` del perfil de Supabase.
* **Criterios de aceptación**: Las emociones están estandarizadas para evitar inyecciones de strings libres en base de datos.
* **Riesgos**: Exposición involuntaria de estados de vulnerabilidad emocional a la empresa. (Mitigación: **Regla estricta no negociable**: RRHH jamás tiene acceso a datos de bienestar individuales, solo a métricas agregadas anónimas de participación).
* **Pruebas mínimas**: Realizar el check-in diario en la interfaz y validar que persista al recargar la página.

---

## 🔒 Formato D: Reglas de Seguridad (Colaborador B2B)

### 1. SEC-B2B-EMP-001: Anonimato Absoluto en Bienestar y CVs
* **Declaración**: Ningún dato de bienestar emocional (`bienestar_data`), currículos generados (`cv_results`) o conversaciones con ELVIA Chat podrá ser leído, exportado o visualizado por los administradores de RRHH de la empresa contratante.
* **Motivo**: Proteger la privacidad y salud mental del colaborador frente a represalias, y cumplir estrictamente con normativas GDPR y de protección de datos personales.
* **Implementación**: Las políticas RLS de Supabase en `cv_results`, `saved_jobs` y `profiles` restringen las lecturas a nivel de fila exclusivamente a `auth.uid() = user_id`. Los dashboards B2B de RRHH consumen únicamente endpoints agregados (`/api/company/dashboard`) desarrollados en NodeJS que aplican funciones de conteo anónimo.
* **Prueba**: Intentar consultar un registro de `cv_results` perteneciente a un colaborador utilizando el JWT del HR Admin. El sistema debe denegar el acceso.
* **Estado**: Verificado.

### 2. SEC-B2B-EMP-002: Ocultación de Créditos IA en B2B
* **Declaración**: Si el usuario pertenece a una cohorte B2B (`perfil.company_id IS NOT NULL`), la interfaz del Dashboard debe omitir de forma absoluta el recuento y compra de créditos IA.
* **Motivo**: Evitar confusión, ya que el coste de inferencia de IA en B2B está completamente cubierto de forma ilimitada por la corporación.
* **Implementación**: Render condicional en frontend utilizando la variable reactiva `isB2B` provista por el `TenantContext`.
* **Prueba**: Iniciar sesión como usuario B2B y verificar la ausencia de componentes de compra o contadores de saldo de créditos IA en el header y barra lateral.
* **Estado**: Verificado.

---

## 💾 Formato F: Especificaciones de Tabla

### 1. Extensión de Tabla: `profiles` (Columna `bienestar_data` JSONB)
* **Propósito**: Almacenar el historial cromático de check-ins diarios y las evaluaciones semanales de bienestar.
* **Estructura del Objeto JSONB**:
  ```json
  {
    "checkins": {
      "2026-05-26": {
        "emocion": "confiado",
        "timestamp": "2026-05-26T13:52:00Z"
      },
      "2026-05-25": {
        "emocion": "ansioso",
        "timestamp": "2026-05-25T11:30:00Z"
      }
    },
    "radar": {
      "semana_22_2026": {
        "energia": 4,
        "confianza": 5,
        "enfoque": 3,
        "ansiedad": 1,
        "resiliencia": 4,
        "evaluated_at": "2026-05-26T13:54:00Z"
      }
    }
  }
  ```
* **RLS/Políticas**: Solo el propietario (`id = auth.uid()`) posee permisos de lectura y escritura (`UPDATE`) sobre esta columna.

---

## 🤖 Formato G: Interacción con IA en Dashboard de Colaborador
* **Caso**: Generación de viñetas de experiencia profesional redactadas dinámicamente con estándar de acción Harvard.
* **Proveedor/Modelo**: DeepSeek V3.
* **Datos Enviados**: Historial laboral raw ingresado por el candidato.
* **PII Incluida**: Nombres de empresas previas y puestos. (Mitigación: se sanitizan datos personales antes del envío al LLM).
* **Prompt Base**: *"Eres un consultor de outplacement experto. Reescribe los siguientes logros profesionales bajo el formato STAR (Situación, Tarea, Acción, Resultado), utilizando verbos de acción fuertes y métricas cuantificables al inicio de cada viñeta, respetando estrictamente el formato de Harvard Business School..."*
* **Validación Posterior**: El sistema realiza un análisis sintáctico en NodeJS para comprobar que la salida del LLM no contenga placeholders genéricos y cumpla el formato markdown plano requerido.
* **Fallback**: Si falla la API de DeepSeek, la plataforma restaura el texto original del usuario y ofrece tips locales sin interrumpir el flujo.

---

## ⚠️ Formato H: Registro de Riesgos (Dashboard de Colaborador)

| ID | Riesgo | Severidad | Impacto | Probabilidad | Mitigación | Dueño | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RSK-EMP-01** | El usuario confunde el check-in emocional con un reporte obligatorio para RRHH. | Media | UX | Alta | Inclusión de un mensaje amigable con Phosphor Icon de candado detallando: *"Tus datos son 100% privados y encriptados, RRHH nunca los verá"*. | UX Lead | Mitigado |
| **RSK-EMP-02** | Fuga accidental de datos a LLMs al enviar currículos completos. | Alta | Privacidad | Baja | Sanitización y anonimización de emails, teléfonos y nombres antes de enviar al endpoint de DeepSeek V3. | DevSecOps | Mitigado |
