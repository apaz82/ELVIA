# Documentación de Gobierno y Casos de Uso — Simulador de Entrevistas

Este documento detalla la gobernanza técnica y funcional del **Simódulo de Entrevistas (Entrevista & interviewRouter)** de la plataforma ELVIA.

---

## 🧩 Formato B: Ficha de Módulo — Simulador de Entrevistas

| Campo | Respuesta |
| :--- | :--- |
| **Módulo** | Simulador y Evaluador de Entrevistas con Inteligencia Artificial. |
| **Responsabilidad** | **Qué resuelve**: Simulación interactiva por voz y texto de entrevistas de trabajo personalizadas (HR, Hiring Manager o Headhunter) con locución neuronal (TTS) y dictado inteligente (STT), y generación de evaluación estructurada final en 4 pilares con puntuación sobre 100.<br>**Qué NO resuelve**: Agendamiento de entrevistas reales con reclutadores humanos externos. |
| **Usuarios** | Roles: `user` (Candidatos / Colaboradores con cuenta premium o progreso al 100%). |
| **Casos de uso incluidos** | `UC-CAN-ENT-001`, `UC-CAN-ENT-002`, `UC-CAN-ENT-003`. |
| **Datos que toca** | `saved_jobs` (lectura de vacantes pre-guardadas y actualización de metadatos de la entrevista). |
| **Endpoints** | `POST /api/interview/preguntas` (Generación de preguntas), `POST /api/interview/evaluar` (Evaluación semántica). |
| **Reglas de negocio** | 1. La respuesta del candidato debe poseer un mínimo de 30 caracteres para considerarse válida; de lo contrario, el sistema alerta de respuesta corta y sugiere expandir antes de avanzar.<br>2. **TTS Neuronal Exclusivo**: El sistema silencia de forma proactiva la voz robótica del navegador si no cuenta con voces de alta calidad (*Natural* de Edge o *Google* de Chrome) para mantener una experiencia premium.<br>3. **Auto-Prefill desde Pipeline**: Al hacer clic en "Preparar Entrevista" desde un puesto en el Pipeline, los datos de empresa y cargo se pre-cargan automáticamente mediante `sessionStorage`. |
| **Dependencias** | Web Speech API (TTS & STT nativo del navegador), DeepSeek V3 (Inferencia evaluativa). |
| **Riesgos** | Pérdida de conectividad o denegación de accesos al micrófono por bloqueos de privacidad del navegador. |
| **Definition of Done** | - Las evaluaciones estructuradas se dividen y exponen de forma clara en 4 secciones: *Presentación Personal, Casos y Logros, Habilidades Técnicas y Cierre*.<br>- La calificación final se vincula dinámicamente como metadato al puesto correspondiente en el Pipeline. |

---

## 📄 Formato A: Casos de Uso del Simulador

### 1. UC-CAN-ENT-001: Configuración de Simulación Adaptada (B2B/B2C Prefill)
* **ID**: `UC-CAN-ENT-001`
* **Nombre**: Configuración de simulación de entrevista y pre-llenado desde Pipeline.
* **Actor principal**: `user` (Candidato).
* **Actores secundarios**: Supabase DB.
* **Objetivo**: Parametrizar la simulación para que el LLM formule preguntas altamente personalizadas basadas en el cargo, empresa y rol del entrevistador.
* **Precondiciones**: Acceso premium activo.
* **Flujo principal**:
  1. El Candidato ingresa a `/entrevista`.
  2. Si proviene de un puesto específico en el Pipeline, los datos de Empresa, Cargo y Descripción se auto-cargan silenciosamente desde `sessionStorage` (`entrevista_prefill`).
  3. De forma alternativa, el Candidato selecciona una vacante de su panel de "Vacantes guardadas" o rellena los campos de forma manual.
  4. Selecciona el tipo de Entrevistador:
     * *HR*: Preguntas de cultura, fit y motivación.
     * *Hiring Manager*: Enfoque técnico y resolución de casos.
     * *Headhunter*: Logros comerciales y propuesta de valor única.
  5. Configura el número de preguntas (5, 7 o 10) y el tipo de feedback (Al final o Por pregunta).
  6. Presiona "Comenzar entrevista" para invocar a `/api/interview/preguntas`.
  7. El backend procesa con DeepSeek V3 y devuelve las preguntas estructuradas en tipo Técnica o Soft Skill.
* **Datos usados**: `empresa`, `cargo`, `entrevistador`, `descripcion`, `numPreguntas`.
* **Pruebas mínimas**: Lanzar simulación con cargo "Líder de Producto" en "Telefónica" y verificar que las preguntas generadas integren el contexto de telecomunicaciones y estrategia ágil.

---

### 2. UC-CAN-ENT-002: Simulación Interactiva por Voz o Texto (Speech-to-Text)
* **ID**: `UC-CAN-ENT-002`
* **Nombre**: Simulación interactiva con interacción por voz nativa.
* **Actor principal**: `user`.
* **Actores secundarios**: Web Speech API.
* **Objetivo**: Simular de forma realista el ritmo conversacional de una entrevista real mediante locución y dictado inteligente.
* **Precondiciones**: Permiso de micrófono concedido en el navegador.
* **Flujo principal**:
  1. El sistema despliega la "Sala de Entrevista" y el avatar de ELVIA.
  2. Mediante SpeechSynthesis (TTS), ELVIA formula la primera pregunta utilizando la voz neuronal de alta calidad detectada.
  3. El Candidato hace clic en el icono del micrófono para iniciar SpeechRecognition (STT).
  4. El sistema detiene automáticamente cualquier locución del bot, abre el micrófono y transcribe en tiempo real la voz del candidato en el cuadro de texto.
  5. El Candidato revisa la transcripción, realiza correcciones manuales y presiona "Siguiente".
* **Flujos alternos**:
  * *Permiso de Micrófono Denegado*: Si el navegador bloquea el micrófono, el sistema despliega un **Bypass Informativo** extremadamente detallado con pestañas animadas por navegador (Chrome, Safari, Firefox, Móvil) para guiar al usuario a activar el acceso de forma manual, permitiéndole escribir en el cuadro de texto mientras tanto.
  * *Respuesta Corta*: Si escribe menos de 30 caracteres, se bloquea el envío y se muestra una advertencia en ámbar recomendando expandir bajo método STAR.
* **Datos usados**: `inputRespuesta`.
* **Pruebas mínimas**: Grabar una respuesta de voz y comprobar que la transcripción se inserte de forma limpia; simular bloqueo de permisos y verificar la aparición del panel de ayuda cromático.

---

### 3. UC-CAN-ENT-003: Evaluación Final en 4 Pilares y Sync con Pipeline
* **ID**: `UC-CAN-ENT-003`
* **Nombre**: Evaluación final de la simulación y sincronización con el Pipeline.
* **Actor principal**: `user`.
* **Actores secundarios**: DeepSeek V3 (Evaluador), Supabase DB.
* **Objetivo**: Generar un reporte de fortalezas, áreas de mejora y calificación general de la entrevista, guardando el resultado en su CRM de postulaciones.
* **Precondiciones**: Última pregunta respondida.
* **Flujo principal**:
  1. El Candidato presiona "Finalizar entrevista".
  2. El sistema envía las preguntas y respuestas al endpoint de evaluación.
  3. DeepSeek V3 califica semánticamente las respuestas y estructura el resultado.
  4. El sistema redirige al paso de "Feedback" mostrando:
     * **Score Ring**: Puntuación global cromática.
     * **Evaluación en 4 Secciones**: Calificación individual y crítica textual en *Presentación Personal, Casos y Logros, Habilidades Técnicas y Cierre*.
  5. Si la entrevista se configuró asociada a una vacante guardada del Pipeline, el backend actualiza de inmediato la columna `metadata` del puesto en `saved_jobs` con el score y resumen del feedback.
  6. Se muestra un banner confirmando: *"✓ Vacante guardada en tu Pipeline con score de práctica"*.
* **Datos usados**: Objeto JSON de evaluación (`puntuacion`, `resumen`, `detalle`).
* **Pruebas mínimas**: Completar la entrevista, verificar la renderización del Score Ring dinámico en verde/ámbar/rojo y validar en el Pipeline que el puesto correspondiente muestre el icono de entrevista completada.

---

## 🔒 Formato D: Reglas de Seguridad (Simulador)

### 1. SEC-ENT-001: Control de Acceso Premium a Entrevistas (Features Wall)
* **Declaración**: Solo se permite procesar solicitudes de simulación y evaluación de entrevistas a usuarios con el flag `featuresDesbloqueadas = true` en su contexto de autenticación.
* **Motivo**: Proteger los costes de inferencia del LLM de accesos anónimos o no autorizados.
* **Implementación**: Validación server-side mediante el middleware de rol y plan, y renderizado del componente de bloqueo `ProGate` en frontend si es falso.
* **Estado**: Verificado.

---

## 💾 Formato F: Especificaciones de Tabla

### 1. Extensión de Tabla: `saved_jobs` (Estructura de metadatos de Entrevista)
* **Propósito**: Persistencia del score de práctica asociado a la postulación del Pipeline.
* **Campos en el Objeto `metadata` (JSONB)**:
  ```json
  {
    "entrevista": {
      "puntuacion": 88,
      "resumen": "Excelente estructuración de logros STAR. Debe reforzar el cierre comercial.",
      "fecha": "2026-05-26T13:56:00Z"
    }
  }
  ```

---

## 🤖 Formato G: Interacción con IA en Simulador de Entrevistas
* **Caso**: Generación de preguntas situacionales y evaluación semántica.
* **Proveedor/Modelo**: DeepSeek V3.
* **Datos Enviados**: Empresa, cargo, tipo de entrevistador, historial de preguntas/respuestas del usuario.
* **Prompt de Evaluación**: *"Actúa como un reclutador implacable de la industria. Evalúa las siguientes respuestas del candidato. Separa tu análisis estrictamente en 4 secciones: Presentacion Personal, Casos y Logros, Habilidades Tecnicas, Cierre. Califica cada sección de 1 a 5 estrellas y asigna un score global..."*
* **Fallback**: Si falla la API de evaluación, el sistema almacena las respuestas localmente en texto plano y ofrece un autodiagnóstico estático guiado sin coste de inferencia.

---

## ⚠️ Formato H: Registro de Riesgos (Simulador de Entrevistas)

| ID | Riesgo | Severidad | Impacto | Probabilidad | Mitigación | Dueño | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RSK-ENT-01** | El navegador bloquea la síntesis de voz (TTS) o no tiene voces en español de alta calidad. | Baja | UX | Media | Silenciamiento automático y persistencia en localStorage (`entrevista_muted`) para no forzar locuciones robóticas molestas. | Frontend Lead | Mitigado |
| **RSK-ENT-02** | Timeout de la API de evaluación al procesar 10 respuestas largas simultáneas. | Alta | Operacional | Baja | Configurar un timeout de socket de 30s en NodeJS e inyección de hilos de loading progresivo en frontend. | Backend Lead | Cerrado |
