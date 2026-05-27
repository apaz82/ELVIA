# Documentación de Gobierno y Casos de Uso — CV vs Vacante (NLP Keyword Analysis)

Este documento detalla la gobernanza técnica y funcional del **Módulo CV vs Vacante (CVvsJob & JobMatches)** de la plataforma ELVIA.

---

## 🧩 Formato B: Ficha de Módulo — CV vs Vacante

| Campo | Respuesta |
| :--- | :--- |
| **Módulo** | CV vs Vacante (NLP Keyword Analysis). |
| **Responsabilidad** | **Qué resuelve**: Comparación semántica e inteligente de un currículum (guardado o subido) frente a la descripción de una vacante de empleo, cálculo de puntuación de compatibilidad ATS, desglose de fortalezas/brechas detalladas, categorización visual de palabras clave críticas y complementarias (Pills de colores) y sincronización con el Pipeline.<br>**Qué NO resuelve**: Envío directo de postulaciones a las bolsas de trabajo externas o portales de empleo de las compañías. |
| **Usuarios** | Roles: `user` (Candidato). |
| **Casos de uso incluidos** | `UC-CAN-NLP-001`, `UC-CAN-NLP-002`, `UC-CAN-NLP-003`. |
| **Datos que toca** | `cv_results` (lectura de CV inicial y escritura de CV adaptado/análisis), `saved_jobs` (creación de postulaciones), `job_checks` (persistencia del score de compatibilidad). |
| **Endpoints** | `POST /api/jobs/fetch-url` (Scraping de descripción de empleo), `POST /api/jobs/match` (Inferencia NLP del Match). |
| **Reglas de negocio** | 1. Si el usuario no está registrado, se le permite realizar un pre-análisis "ciego", pero se bloquea la visualización de los resultados detallados tras una simulación animada (`showAuthWall`) para potenciar el registro orgánico.<br>2. Las palabras clave se clasifican estrictamente en: *Críticas* (exigidas por ATS) y *Complementarias* (habilidades de apoyo), y se subdividen de forma visual en *Presentes* (Color verde) o *Ausentes/Para agregar* (Color rojo/ámbar). |
| **Dependencias** | DeepSeek V3 (Inferencia NLP), Supabase DB & Auth. |
| **Riesgos** | Tiempos de respuesta lentos por parsing web de URLs de empleo externas. |
| **Definition of Done** | - El desglose dimensional de compatibilidad cubre de forma correcta las 4 dimensiones críticas: *Hard Skills, Soft Skills, Experiencia, Formato ATS*.<br>- La vacante se puede guardar en el Pipeline en menos de 1s con vinculación del Score NLP. |

---

## 📄 Formato A: Casos de Uso de CV vs Vacante

### 1. UC-CAN-NLP-001: Medir Compatibilidad de CV frente a Vacante
* **ID**: `UC-CAN-NLP-001`
* **Nombre**: Análisis y Score de Compatibilidad CV vs Vacante.
* **Actor principal**: `user` (Candidato).
* **Actores secundarios**: DeepSeek V3 (Servicio de Match).
* **Objetivo**: Evaluar la compatibilidad del CV con una vacante del mercado, identificando el % de encaje y las brechas principales.
* **Precondiciones**: Sesión iniciada y descripción de vacante pegada o cargada vía URL.
* **Flujo principal**:
  1. El Candidato selecciona su CV guardado, sube un archivo nuevo o pega el texto directamente.
  2. Elige el método de entrada de vacante: Pegar texto o Pegar Link (ej: link de LinkedIn Jobs).
  3. Si es Link, presiona "Cargar" para invocar a `/api/jobs/fetch-url` y extraer de forma limpia la descripción textual de la vacante.
  4. Presiona "Analizar compatibilidad".
  5. El sistema envía los datos al motor de inferencia.
  6. Muestra un Score global de match y habilita tres pestañas:
     * *CV Adaptado*: Versión optimizada con las keywords críticas insertadas de forma natural.
     * *Análisis*: Gráfica de barras de dimensiones, lista de Fortalezas, y lista colapsable de Brechas con sugerencias para solucionarlas.
     * *Keywords*: Desglose clasificado de palabras clave.
* **Flujos alternos**:
  * *Usuario anónimo (Muro de Registro)*: Si el usuario no tiene sesión activa, el sistema simula el procesamiento durante 3.5s y despliega el muro de registro: *"¡Análisis finalizado! Regístrate gratis para ver tus resultados detallados."*
* **Datos usados**: `tailoredCV`, `matchScore`, `dimensiones`, `analisis`.
* **Pruebas mínimas**: Analizar una vacante de prueba y validar que las fortalezas y brechas se rendericen; verificar que al hacer clic en una brecha se despliegue la caja de ayuda contextual de color ámbar.

---

### 2. UC-CAN-NLP-002: Clasificación de Palabras Clave Críticas y Complementarias
* **ID**: `UC-CAN-NLP-002`
* **Nombre**: Visualización de Keywords categorizadas y Pills de colores.
* **Actor principal**: `user`.
* **Actores secundarios**: Ninguno.
* **Objetivo**: Proveer un mapa visual inmediato de las habilidades técnicas exigidas por el ATS que el candidato ya posee frente a las que le faltan.
* **Precondiciones**: Análisis de compatibilidad completado con éxito.
* **Flujo principal**:
  1. El Candidato ingresa a la pestaña "Keywords".
  2. El sistema renderiza dos secciones bien delimitadas por separadores visuales:
     * **Keywords Críticas**: Competencias obligatorias exigidas por el algoritmo ATS.
     * **Skills Complementarias**: Habilidades accesorias sugeridas.
  3. Dentro de cada sección, las palabras clave se desglosan en:
     * **✓ Presentes en tu CV**: Renderizadas como pastillas (Pills) de color verde suave (`bg-emerald-50 text-emerald-700`).
     * **✗ Faltan en tu CV / Para agregar**: Pastillas de color rojo suave (`bg-red-50 text-red-600`) para críticas, y ámbar suave (`bg-amber-50 text-amber-700`) para complementarias.
  4. El candidato puede ver de inmediato cuáles palabras debe insertar de forma manual para saltar el filtro.
* **Datos usados**: `keywords.criticas.presentes`, `keywords.criticas.ausentes`, `keywords.complementarias.presentes`, `keywords.complementarias.ausentes`.
* **Pruebas mínimas**: Validar visualmente que las Pills se dividan correctamente por color y correspondan a las habilidades reales extraídas de la vacante.

---

### 3. UC-CAN-NLP-003: Guardado Directo al Pipeline de Postulaciones
* **ID**: `UC-CAN-NLP-003`
* **Nombre**: Guardar vacante analizada directamente en el Pipeline.
* **Actor principal**: `user`.
* **Actores secundarios**: Supabase DB.
* **Objetivo**: Añadir la vacante al CRM personal de postulaciones vinculando el Score de compatibilidad y los datos de la empresa de forma automática.
* **Precondiciones**: Análisis completado y usuario con sesión iniciada.
* **Flujo principal**:
  1. En la parte inferior del resultado del análisis, el Candidato hace clic en "+ Guardar vacante en Pipeline".
  2. El sistema despliega un mini-formulario pre-llenado con el nombre de la empresa y la posición provistos por la vacante.
  3. El Candidato selecciona la etapa actual del proceso (ej: `'Descubierto'`, `'Apliqué'`, `'En entrevistas'`).
  4. Presiona "Guardar".
  5. El backend realiza la inserción en la tabla `saved_jobs` y, a su vez, guarda en `job_checks` el Score NLP y la lista de fortalezas.
  6. La interfaz se actualiza mostrando: *"✓ Vacante guardada en tu Pipeline"*.
* **Datos usados**: `company`, `title`, `matchScore`, `fortalezas`, `estado`.
* **Resultado esperado**: Postulación creada y asociada de forma cruzada con las métricas NLP.
* **Pruebas mínimas**: Guardar una vacante en etapa "Apliqué" y navegar a `/pipeline` para validar que figure de inmediato con el Score correcto en la columna correspondiente.

---

## 🔒 Formato D: Reglas de Seguridad (CV vs Vacante)

### 1. SEC-NLP-001: Aislamiento Multitenant en Consulta de Vacantes
* **Declaración**: Las postulaciones y chequeos NLP guardados en `saved_jobs` y `job_checks` están restringidos bajo políticas RLS estrictas en Postgres. Ningún usuario externo, administrador de RRHH corporativo o tercero ajeno a la cuenta podrá consultar el listado de empresas a las que postula el candidato.
* **Motivo**: Mantener el sigilo absoluto del candidato en procesos de transición laboral externa frente a su empresa actual.
* **Implementación**: 
  ```sql
  ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "user_owns_saved_jobs" ON saved_jobs 
    FOR ALL USING (auth.uid() = user_id);
  ```
* **Estado**: Verificado.

---

## 💾 Formato F: Especificaciones de Tabla

### 1. Tabla: `job_checks`
* **Propósito**: Relación de compatibilidad NLP cruzada entre el CV y una postulación del Pipeline.
* **Campos**:
  * `id` (UUID, PK)
  * `job_key` (UUID, FK -> `saved_jobs.id`, Cascade)
  * `user_id` (UUID, FK -> `profiles.id`, Cascade)
  * `score` (INTEGER, Score de match NLP obtenido)
  * `motivos` (TEXT[], lista de fortalezas o justificaciones)
  * `created_at` (TIMESTAMP)

---

## 🤖 Formato G: Interacción con IA en CV vs Vacante
* **Caso**: Análisis NLP cruzado y generación de currículum adaptado (Tailored CV).
* **Proveedor/Modelo**: DeepSeek V3.
* **Datos Enviados**: Texto del CV, texto de la vacante. (Mitigación: se eliminan datos de PII de contacto antes del envío).
* **Prompt Base**: *"Eres un analizador de compatibilidad ATS experto. Compara detalladamente el siguiente CV contra la vacante provista. Genera como salida un objeto JSON estructurado con el matchScore (0 a 100), desglose de dimensiones, fortalezas, brechas específicas y el listado de keywords clasificadas por críticas/complementarias y presentes/ausentes..."*
* **Fallback**: Si falla el LLM, el sistema realiza una coincidencia sintáctica simple por frecuencia de términos locales y advierte al usuario que está en modo básico de contingencia.

---

## ⚠️ Formato H: Registro de Riesgos (CV vs Vacante)

| ID | Riesgo | Severidad | Impacto | Probabilidad | Mitigación | Dueño | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RSK-NLP-01** | Bloqueo por scraping al intentar cargar URLs de LinkedIn Jobs en `/api/jobs/fetch-url`. | Media | UX | Alta | Captura elegante de excepciones, inyección de User-Agent real y despliegue inmediato de advertencia sugiriendo el pegado manual si se detecta bloqueo HTTP 429/403. | DevOps | Mitigado |
| **RSK-NLP-02** | Detección incorrecta o alucinada de habilidades debido a modismos del LLM. | Media | Calidad | Baja | Forzar en el prompt de DeepSeek V3 la coincidencia exacta de términos sustantivos en lugar de traducciones libres o conceptuales. | LLM Engineer | Cerrado |
