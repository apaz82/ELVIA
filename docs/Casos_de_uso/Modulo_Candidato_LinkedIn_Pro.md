# Documentación de Gobierno y Casos de Uso — LinkedIn Pro & Auditor de Perfil

Este documento detalla la gobernanza técnica y funcional del **Módulo LinkedIn Pro & Auditor de Perfil (LinkedinPro & linkedinRouter)** de la plataforma ELVIA.

---

## 🧩 Formato B: Ficha de Módulo — LinkedIn Pro

| Campo | Respuesta |
| :--- | :--- |
| **Módulo** | LinkedIn Pro & Auditor de Perfil. |
| **Responsabilidad** | **Qué resuelve**: Importación automatizada del perfil de LinkedIn (mediante PDF de LinkedIn o Pegado Mágico textual), análisis interactivo en 5 secciones críticas (Titular, Extracto, Experiencia, Habilidades, Educación), clasificación del Score general (Excelente, Bueno, Regular, Urgente), sugerencias directas de redacción ejecutiva y restauración del historial de análisis anteriores.<br>**Qué NO resuelve**: Modificación directa del perfil en la web oficial de LinkedIn (está fuera de la API pública cerrada y requiere cambios manuales del candidato). |
| **Usuarios** | Roles: `user` (Candidatos / Colaboradores). |
| **Casos de uso incluidos** | `UC-CAN-LKD-001`, `UC-CAN-LKD-002`, `UC-CAN-LKD-003`. |
| **Datos que toca** | `linkedin_analyses` (Lectura y escritura del historial). |
| **Endpoints** | `POST /api/linkedin/extraer-pdf` (Carga y parseo), `POST /api/linkedin/extraer-texto` (Pegado Mágico), `POST /api/linkedin/analizar` (Inferencia NLP), `GET /api/linkedin/historial` (Recuperación). |
| **Reglas de negocio** | 1. **Bloqueo de Progreso (Progress-based Unlock)**: Solo se permite acceder al módulo a usuarios B2C con plan de pago, o aquellos B2B/B2C que hayan alcanzado el **100%** de su Grado de Autoconocimiento (completando los 5 pilares).<br>2. Se guarda y persiste un historial limitado de los últimos 10 análisis por usuario en la base de datos.<br>3. El prompt de análisis cruza dinámicamente el perfil del usuario con su `contextoLaboral` (Career Project Data) para garantizar máxima coherencia. |
| **Dependencias** | DeepSeek V3 (Análisis semántico), Supabase DB & Auth. |
| **Riesgos** | Intentar parsear PDFs maliciosos o archivos PDF corruptos subidos por los usuarios. |
| **Definition of Done** | - El historial muestra la fecha, campos analizados y permite restaurar la vista completa de resultados con un solo clic.<br>- Las sugerencias de redacción se muestran entrecomilladas con un diseño premium y Phosphor Icons (`Sparkle`). |

---

## 📄 Formato A: Casos de Uso de LinkedIn Pro

### 1. UC-CAN-LKD-001: Carga y Decodificación de Perfil (PDF / Pegado Mágico)
* **ID**: `UC-CAN-LKD-001`
* **Nombre**: Importación y decodificación express de perfil de LinkedIn.
* **Actor principal**: `user` (Candidato).
* **Actores secundarios**: DeepSeek V3 (Extractor).
* **Objetivo**: Acelerar el proceso de auditoría abstrayendo al usuario de transcribir sección por sección su perfil de LinkedIn.
* **Precondiciones**: El candidato ha desbloqueado el módulo por progreso (100% Autoconocimiento) o suscripción activa.
* **Flujo principal**:
  1. El Candidato ingresa a la pestaña "Carga PDF".
  2. Sube el PDF exportado de LinkedIn (*LinkedIn -> Perfil -> Más -> Guardar en PDF*).
  3. El sistema llama a `/api/linkedin/extraer-pdf` y el backend extrae el texto del PDF.
  4. Envía el contenido a DeepSeek V3 con un esquema de salida que mapea las 5 secciones.
  5. El formulario del Paso Manual se activa pre-llenado con todos los datos decodificados.
* **Flujos alternos**:
  * *Pegado Mágico*: El candidato selecciona la pestaña "Pegado Mágico", hace Ctrl+A en su LinkedIn web, lo pega en el área de texto y la IA limpia todo el código web y publicidad sobrante, estructurando las secciones de inmediato.
* **Datos usados**: Archivo PDF o string blob.
* **Pruebas mínimas**: Pegar un perfil raw con texto residual de la web y verificar que se complete el formulario manual de 5 campos perfectamente estructurado.

---

### 2. UC-CAN-LKD-002: Auditoría de Perfil y Sugerencias de Redacción
* **ID**: `UC-CAN-LKD-002`
* **Nombre**: Auditoría del perfil con Inteligencia Artificial.
* **Actor principal**: `user`.
* **Actores secundarios**: DeepSeek V3.
* **Objetivo**: Obtener una calificación ATS y recomendaciones concretas para optimizar la visibilidad del perfil ante reclutadores.
* **Precondiciones**: Formulario de secciones rellenado.
* **Flujo principal**:
  1. El Candidato presiona "Lanzar Inteligencia Optima".
  2. El backend procesa el perfil cruzando los datos con su `contextoLaboral` (ej: sector deseado).
  3. El sistema despliega el Score global en un ScoreRing premium con color de prioridad (Verde, Azul, Ámbar, Rojo).
  4. Muestra un "Top de 3 acciones prioritarias" para mejorar de inmediato.
  5. Desglosa los resultados por cada sección cargada, detallando:
     * *Diagnóstico*: Análisis situacional de la sección.
     * *Fortalezas*: Puntos fuertes actuales.
     * *Qué mejorar*: Errores detectados.
     * *Sugerencia de redacción*: Un ejemplo textual optimizado por la IA listo para copiar y pegar.
* **Datos usados**: Campos de las 5 secciones, `contextoLaboral`.
* **Criterios de aceptación**: Toda sugerencia de redacción debe ajustarse estrictamente a los límites de caracteres de LinkedIn (Headline: 220, About: 2,600).
* **Pruebas mínimas**: Analizar un titular corto (ej: "Líder de Producto") y validar que la IA recomiende incluir palabras clave (SaaS, LATAM, años de exp) en la sección "Qué mejorar" y ofrezca una sugerencia de redacción de menos de 220 caracteres.

---

### 3. UC-CAN-LKD-003: Consulta e Historial de Auditorías
* **ID**: `UC-CAN-LKD-003`
* **Nombre**: Guardado y restauración de auditorías desde el Historial.
* **Actor principal**: `user`.
* **Actores secundarios**: Supabase DB.
* **Objetivo**: Evitar que el usuario pierda sus sugerencias de redacción anteriores, permitiendo restaurarlas al instante.
* **Precondiciones**: El candidato ha realizado al menos una auditoría previamente.
* **Flujo principal**:
  1. Al cargar el módulo, el sistema busca en `linkedin_analyses` los últimos 10 análisis del usuario.
  2. Muestra un panel superior "Historial de análisis" con un contador dinámico.
  3. Al hacer clic en desplegar, lista los análisis indicando la fecha, la puntuación obtenida y los campos analizados.
  4. El Candidato presiona "Ver" sobre una entrada.
  5. El sistema restaura en pantalla la vista completa de resultados y sugerencias de redacción tal y como se obtuvieron en esa fecha, sin volver a consumir tokens de IA.
* **Datos usados**: Listado de la tabla `linkedin_analyses`.
* **Pruebas mínimas**: Realizar un análisis, recargar la página, desplegar el historial y hacer clic en ver. Comprobar que los diagnósticos y sugerencias de redacción se rendericen de forma idéntica en pantalla de forma instantánea.

---

## 🔒 Formato D: Reglas de Seguridad (LinkedIn Pro)

### 1. SEC-LKD-001: Bloqueo de Acceso Progresivo (Progress-based Gate)
* **Declaración**: Solo se permite acceder a la suite de LinkedIn Pro si el usuario tiene una suscripción de pago activa, o si ha completado el **100%** de su Grado de Autoconocimiento.
* **Motivo**: Incentivar el completado del autoconocimiento (IKIGAI, habilidades, empresas objetivo) garantizando que cuando la IA optimice su perfil LinkedIn, lo haga con datos estratégicos reales del candidato.
* **Implementación**: 
  * Verificación en frontend mediante:
    ```javascript
    const proyectoPct = calcularProgreso(jpData, perfil);
    const isUnlocked = isPaidPlan || proyectoPct >= 100;
    ```
  * Si es falso, se renderiza la vista bloqueada `FeatureLocked`.
* **Estado**: Verificado.

---

## 💾 Formato F: Especificaciones de Tabla

### 1. Tabla: `linkedin_analyses`
* **Propósito**: Persistencia del historial de optimizaciones de LinkedIn.
* **Campos**:
  * `id` (UUID, PK)
  * `user_id` (UUID, FK -> `profiles.id`, Cascade)
  * `puntaje_global` (INTEGER)
  * `resumen_global` (TEXT)
  * `top_acciones` (TEXT[])
  * `secciones` (JSONB: `{ titular: { puntaje, diagnostico, fortalezas[], mejoras[], ejemplo }, extracto: ... }`)
  * `campos_analizados` (TEXT[], ej: `['titular', 'extracto']`)
  * `created_at` (TIMESTAMP)
* **RLS/Políticas**: Solo el propietario (`auth.uid() = user_id`) posee permisos de lectura y escritura.

---

## 🤖 Formato G: Interacción con IA en LinkedIn Pro
* **Caso**: Auditoría analítica y reescritura de secciones de perfil.
* **Proveedor/Modelo**: DeepSeek V3.
* **Prompt Base**: *"Eres un Headhunter senior internacional. Analiza el siguiente perfil LinkedIn del candidato considerando su meta de cargo. Califica el titular, extracto y trayectoria en una escala de 0 a 100. Entrega una crítica estructurada y reescribe las secciones bajo estándares premium ejecutivos..."*
* **Validación Posterior**: El backend NodeJS valida que el JSON devuelto por el LLM posea el esquema exacto de secciones e integre las sugerencias de redacción de longitud permitida por LinkedIn antes de almacenarlo en la base de datos.

---

## ⚠️ Formato H: Registro de Riesgos (LinkedIn Pro)

| ID | Riesgo | Severidad | Impacto | Probabilidad | Mitigación | Dueño | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RSK-LKD-01** | El usuario sube un PDF que no es el exportado por LinkedIn. | Media | UX | Alta | Captura elegante de errores de parseo web en NodeJS y alerta clara al usuario sugiriendo el Pegado Mágico. | Frontend Lead | Mitigado |
| **RSK-LKD-02** | Exceso de coste por pegados de texto gigantescos (>20,000 caracteres). | Media | Coste | Media | Aplicación de limitación estricta de `maxLength` por campo de texto y sanitización del payload del Pegado Mágico. | Backend Lead | Cerrado |
