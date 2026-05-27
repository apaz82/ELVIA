# Documentación de Gobierno y Casos de Uso — Creador de CV Harvard-Style (CVDesdeCero)

Este documento detalla la gobernanza técnica y funcional del **Creador de CV Harvard-Style (CVDesdeCero, CVOptimizer & cvController)** de la plataforma ELVIA.

---

## 🧩 Formato B: Ficha de Módulo — CVDesdeCero & CV Harvard

| Campo | Respuesta |
| :--- | :--- |
| **Módulo** | Creador y Optimizador de CV Harvard-Style (CVDesdeCero). |
| **Responsabilidad** | **Qué resuelve**: Asistente de creación de CV por pasos, importación/extracción inteligente de perfiles mediante NLP, evaluación interactiva de calidad bajo estándares Harvard/Google (fórmula STAR) y generación final del currículum optimizado exportable en PDF/Word.<br>**Qué NO resuelve**: Almacenamiento o exportación de formatos visuales creativos complejos (se ciñe estrictamente al formato sobrio, monocromático y de alta tasa de éxito de Harvard Business School). |
| **Usuarios** | Roles: `user` (Candidatos B2C / Colaboradores B2B). |
| **Casos de uso incluidos** | `UC-CAN-CV-001`, `UC-CAN-CV-002`, `UC-CAN-CV-003`. |
| **Datos que toca** | `profiles.job_search_profile.cv_borrador` (borrador temporal auto-guardado), `profiles.cv_path` (enlace al Storage), `cv_results` (registro histórico de generaciones). |
| **Endpoints** | `POST /api/cv/extract`, `POST /api/cv/generate`, `POST /api/cv/optimize-summary`. |
| **Reglas de negocio** | 1. Si un usuario intenta subir un currículum ajeno a su perfil (discrepancia de nombres), se activa una bandera de alerta de identidad (`mismatch: true`) para evitar el raspado o robo de identidad de currículos de terceros.<br>2. El sistema aplica un guardado automático local en `sessionStorage` y remoto en Supabase cada 2 segundos.<br>3. El análisis de calidad clasifica el currículum de forma interactiva en *Excelente/Bueno/Incompleto* con un Score numérico sobre 100. |
| **Dependencias** | DeepSeek V3 (Inferencia y Optimización NLP), Supabase Storage (Almacenamiento de archivos `.txt`), Librería de render de PDF en backend. |
| **Riesgos** | Sobrecarga de costes por peticiones masivas a los servicios de Inteligencia Artificial. |
| **Definition of Done** | - Pasa el doble check de identidad de extracción (Backend + Frontend).<br>- La optimización del resumen profesional compara diferencias semánticas resaltando palabras nuevas en negrita. |

---

## 📄 Formato A: Casos de Uso de Creador de CV

### 1. UC-CAN-CV-001: Creación de Currículum e Importación NLP
* **ID**: `UC-CAN-CV-001`
* **Nombre**: Creación de Currículum desde cero e Importación/Extracción NLP.
* **Actor principal**: `user` (Candidato).
* **Actores secundarios**: DeepSeek V3 (Parser NLP), Supabase Storage.
* **Objetivo**: Permitir al usuario rellenar los datos de su CV de forma interactiva, o acelerarlo arrastrando su CV existente para que el motor extraiga la información estructurada.
* **Precondiciones**: Sesión activa de usuario.
* **Flujo principal**:
  1. El Candidato ingresa a la ruta `/cv-desde-cero`.
  2. El sistema comprueba si ya existe un currículum previo; si es así, avisa con un banner de confirmación antes de sobreescribir.
  3. El Candidato arrastra un archivo local `.pdf` o `.docx` en la zona de carga de archivos.
  4. El frontend envía el binario en un payload multipart al endpoint `/api/cv/extract`.
  5. El backend parsea el texto, invoca a DeepSeek V3 y extrae una estructura JSON válida (Nombre, correo, teléfono, experiencias con fecha, educación, habilidades e idiomas).
  6. El backend e hilos de frontend realizan la verificación cruzada de identidad normalizada de los nombres.
  7. El formulario se pre-llena de forma instantánea con todos sus datos estructurados y el Candidato avanza por el Wizard de 6 pasos.
* **Flujos alternos**:
  * *Mismatch de identidad de currículum*: Si el nombre extraído del archivo difiere sustancialmente del nombre de la cuenta (`profiles.nombre1`), el sistema despliega un banner crítico detallando: *"¡Atención! Detectamos que el CV pertenece a otra persona"* (Defensa contra scraping y robo de identidad).
* **Datos usados**: Archivo binario (PDF/Word), `nombre`, `apellido`, `email`, `experiencias`, `educacion`, `habilidades`, `idiomas`.
* **Permisos**: Rol `user` o `company_admin`.
* **Resultado esperado**: Datos estructurados cargados en el formulario del Wizard.
* **Eventos de auditoría**: Registro en `tenant_audit_log` con acción `cv_profile_extraction`.
* **Pruebas mínimas**: Cargar PDF del perfil y verificar pre-llenado total del Wizard. Cargar PDF ajeno y verificar disparo de mismatch.

---

### 2. UC-CAN-CV-002: Optimización del Resumen Profesional con IA
* **ID**: `UC-CAN-CV-002`
* **Nombre**: Optimización de resumen profesional mediante LLM.
* **Actor principal**: `user`.
* **Actores secundarios**: DeepSeek V3.
* **Objetivo**: Tomar un borrador informal de perfil y transformarlo en un resumen ejecutivo potente alineado con la fórmula STAR e HBS.
* **Precondiciones**: El Candidato ha escrito al menos 20 caracteres en el cuadro de texto de Resumen.
* **Flujo principal**:
  1. El Candidato se posiciona en el Paso 2 (Resumen Profesional).
  2. Hace clic en "Optimizar con IA" (Sparkle / Magic Wand Icon).
  3. El frontend llama al endpoint `/api/cv/optimize-summary` enviando el texto raw.
  4. El LLM reescribe el perfil bajo directrices específicas (años de experiencia, competencias core, logros numéricos e impacto, estilo sobrio).
  5. El frontend recibe el texto y renderiza un cuadro comparativo dinámico (**Diff visual**) donde se marcan en negrita las palabras nuevas sugeridas por la IA.
  6. El Candidato revisa, ajusta si es necesario y hace clic en "Aplicar cambios".
* **Datos usados**: `resumen`.
* **Resultado esperado**: Resumen profesional optimizado y guardado en el borrador de datos.
* **Criterios de aceptación**: El Diff visual debe ser limpio, rápido y destacar las palabras añadidas de forma cromática.
* **Pruebas mínimas**: Optimizar un resumen corto de 30 palabras y validar que el resultado sea formal, contenga logros teóricos y se resalte con Diff en pantalla.

---

### 3. UC-CAN-CV-003: Análisis de Calidad en Tiempo Real (Harvard Scoring)
* **ID**: `UC-CAN-CV-003`
* **Nombre**: Análisis y Score interactivo de calidad del CV en tiempo real.
* **Actor principal**: `user`.
* **Actores secundarios**: Módulo de análisis del Frontend.
* **Objetivo**: Medir la robustez del CV del usuario frente a filtros ATS e incorporar métricas directas STAR de gestión durante su edición.
* **Precondiciones**: Edición activa en el Wizard.
* **Flujo principal**:
  1. A medida que el usuario escribe, el frontend evalúa la calidad asignando hasta 100 puntos en 6 pilares:
     * *Encabezado (18 pts)*: Completitud de datos y teléfono con indicativo.
     * *Resumen (20 pts)*: Largo y datos cuantificables.
     * *Experiencia (30 pts)*: Mínimo de roles, uso de verbos de acción y números.
     * *Educación (15 pts)*: Formación completa.
     * *Habilidades (10 pts)*: Cantidad ideal paraATS (mínimo 5).
     * *Idiomas (7 pts)*: ATS pre-filtrado de idiomas con nivel CEFR.
  2. Despliega un panel lateral derecho interactivo con un anillo circular de Score cromático (Verde para Excelente, Ámbar para Bueno, Rojo para Incompleto).
  3. Muestra una lista dinámica de recomendaciones en tiempo real: *"Cuantifica al menos un logro con números (ej: Incrementé ventas 18%)"*, *"Empieza cada logro con un verbo de acción: Lideré, Implementé..."*.
  4. El Score se actualiza automáticamente al solucionar las advertencias.
* **Datos usados**: Datos en edición.
* **Pruebas mínimas**: Redactar una experiencia sin números y comprobar que se visualice la recomendación; agregar un número (ej: "15%") y validar que desaparezca la advertencia y suba el Score de inmediato.

---

## 🔒 Formato D: Reglas de Seguridad (Creador de CV)

### 1. SEC-CV-001: Validación Antiscraping por Mismatch de Identidad (Doble Capa)
* **Declaración**: Se prohíbe de forma absoluta que un usuario procese o extraiga de forma masiva currículos pertenecientes a otros profesionales con el fin de recopilar bases de datos o vulnerar la privacidad de terceros.
* **Motivo**: Proteger los datos de contacto y la trayectoria de profesionales, evitando campañas de spam o robo de identidad.
* **Implementación**: 
  * *Capa 1 (Backend)*: El endpoint de extracción compara el nombre del archivo y del texto parseado contra el perfil de Supabase. Si hay discrepancia, devuelve `mismatch: true`.
  * *Capa 2 (Frontend)*: Se normalizan los strings eliminando tildes y caracteres especiales, comparando las primeras palabras del nombre y apellido. Si no coinciden, se bloquea la importación silenciosa de datos y se muestra un modal crítico de advertencia.
* **Estado**: Verificado.

---

## 💾 Formato F: Especificaciones de Tabla

### 1. Tabla: `cv_results`
* **Propósito**: Almacenar el historial de currículos generados y optimizados por los usuarios, manteniendo la trazabilidad ATS.
* **Campos**:
  * `id` (UUID, PK)
  * `user_id` (UUID, FK -> `profiles.id`, Cascade)
  * `tipo` (TEXT: `'optimize'` | `'match'`)
  * `optimized_cv` (TEXT, contenido optimizado del currículum)
  * `metadata` (JSONB: `{ matchScore, changes, recommendations }`)
  * `company_id` (UUID, FK nullable -> `companies.id`, RLS enabled)
  * `created_at` (TIMESTAMP)
* **RLS/Políticas**:
  * Los usuarios candidatos solo pueden leer/escribir sus propios registros.
  * Los administradores de la empresa asociada no tienen acceso a la lectura ni exportación de esta tabla de forma individual.

---

## 🤖 Formato G: Interacción con IA en CVDesdeCero
* **Caso**: Generación de estructura y redacción del CV Harvard completo.
* **Proveedor/Modelo**: DeepSeek V3.
* **PII Incluida**: Trayectoria académica, datos personales, historial laboral. (Mitigación: se eliminan direcciones físicas precisas, DNI o datos financieros sensibles antes del envío).
* **Prompt Base**: *"Reescribe y formatea el siguiente perfil en el estándar oficial de Harvard Business School. La salida debe ser estrictamente en texto plano, ordenado de forma cronológica inversa, estructurando cada rol con la fórmula Google de logros (Logré X medido por Y al hacer Z)..."*
* **Validación Posterior**: Comprobación sintáctica para confirmar que no se han filtrado claves, prompts base o alucinaciones del modelo.
* **Fallback**: Si falla la llamada al LLM, la aplicación guarda la estructura manual del formulario en base de datos para que el usuario pueda exportarla de forma tradicional.

---

## ⚠️ Formato H: Registro de Riesgos (Creador de CV)

| ID | Riesgo | Severidad | Impacto | Probabilidad | Mitigación | Dueño | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RSK-CV-01** | Consumo excesivo de cuotas de tokens de DeepSeek V3 por ataques de bots. | Alta | Coste | Media | Implementación de Cloudflare Turnstile en registro y rate limiter en `/api/cv/*` (máximo 10 solicitudes de extracción al día por cuenta). | DevOps | Mitigado |
| **RSK-CV-02** | Alucinaciones del LLM que introducen certificaciones o universidades ficticias en el CV. | Crítica | Reputación | Baja | Los campos optimizados por IA se previsualizan de forma obligatoria en pantalla, requiriendo confirmación del usuario antes de guardarse en el perfil (`confirmarYGuardar`). | Product Lead | Cerrado |
