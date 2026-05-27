# Documentación de Gobierno y Casos de Uso — Ecosistema de Bienestar Emocional

Este documento detalla la gobernanza técnica y funcional del **Ecosistema de Bienestar Emocional (Bienestar.jsx)** de la plataforma ELVIA.

---

## 🧩 Formato B: Ficha de Módulo — Ecosistema de Bienestar

| Campo | Respuesta |
| :--- | :--- |
| **Módulo** | Ecosistema de Bienestar Emocional del Candidato. |
| **Responsabilidad** | **Qué resuelve**: Ofrecer herramientas interactivas y clínicas de autorregulación nerviosa, registro de estado de ánimo diario, autoevaluación multidimensional de bienestar y recursos de acompañamiento (lecturas y videos de meditación guiada) específicos para personas enfrentando transiciones laborales o desempleo.<br>**Qué NO resuelve**: Tratamiento o terapia psicológica formal, diagnóstico médico-psiquiátrico, ni canalización de emergencias psicológicas (se provee con un descargo claro detallando su carácter meramente orientativo). |
| **Usuarios** | Roles: `user` (Candidatos y Colaboradores B2B). |
| **Casos de uso incluidos** | `UC-CAN-BIE-001`, `UC-CAN-BIE-002`, `UC-CAN-BIE-003`. |
| **Datos que toca** | `profiles.bienestar_data` (Lectura y actualización del campo JSONB en Supabase). |
| **Endpoints** | Supabase direct call: `supabase.from('profiles').select('bienestar_data')` y `supabase.from('profiles').update({ bienestar_data: nuevo })`. |
| **Reglas de negocio** | 1. **Privacidad Absoluta (Zero-Leak Policy)**: Bajo ninguna circunstancia los administradores de RRHH de las empresas contratantes B2B pueden ver los estados de ánimo, notas de check-in, o radar de bienestar individual de sus empleados (Gobernado por `SEC-B2B-EMP-001`).<br>2. **Control de Acceso**: Módulo restringido a cuentas con planes activos o habilitación corporativa (mediante compuerta `featuresDesbloqueadas`).<br>3. **Reset Semanal de Radar**: La evaluación multidimensional del radar se agrupa por identificadores de semana (`semana_WW_YYYY`) y se reinicia semanalmente para fomentar el hábito del monitoreo progresivo. |
| **Dependencias** | Supabase Client SDK, Phosphor Icons (`@phosphor-icons/react`), Google Fonts (`Plus Jakarta Sans`), context `AuthContext`. |
| **Riesgos** | Almacenar notas textuales con datos excesivamente sensibles o de autolesión (Mitigación: deshabilitar búsquedas semánticas sobre esas notas y aplicar anonimización). |
| **Definition of Done** | - El anillo de progreso de respiración y la bola pulsante cambian de color e instrucciones en tiempo real según la secuencia exacta en milisegundos (ms).<br>- Los check-ins persisten en Supabase y el historial de 7 días renderiza cromáticamente de inmediato sin parpadeos. |

---

## 📄 Formato A: Casos de Uso de Bienestar Emocional

### 1. UC-CAN-BIE-001: Registro de Check-in Diario y Notas de Ánimo
* **ID**: `UC-CAN-BIE-001`
* **Nombre**: Check-in diario de estado emocional y notas de observación.
* **Actor principal**: `user` (Candidato / Colaborador).
* **Actores secundarios**: Supabase DB.
* **Objetivo**: Facilitar al usuario un espacio rápido, no estructurado y libre de juicios para registrar y observar su estabilidad emocional a lo largo de los días de búsqueda de empleo.
* **Precondiciones**: Usuario autenticado y con acceso habilitado al ecosistema de bienestar.
* **Flujo principal**:
  1. El Candidato ingresa a la pestaña "Check-in".
  2. El sistema muestra la pregunta *"¿Cómo te sientes hoy?"* junto con 7 botones correspondientes a emociones estandarizadas codificadas por colores (Confiado, Motivado, Tranquilo, Cansado, Ansioso, Frustrado, Triste).
  3. El usuario hace clic sobre su emoción predominante del día.
  4. El usuario escribe opcionalmente una frase descriptiva en la caja de comentarios (ej: "Un poco cansado tras la tercera entrevista técnica pero optimista").
  5. El usuario hace clic en "Guardar check-in".
  6. El sistema envía los datos a Supabase actualizando el campo `bienestar_data` del perfil del usuario.
  7. El botón cambia su estado a "Guardando..." y luego a "¡Registrado!" con un icono de marca de verificación verde.
  8. El módulo "Últimos 7 días" actualiza de inmediato su burbuja correspondiente pintándola con el color y el icono específico de la emoción elegida.
* **Flujos alternos**:
  * *Actualización de check-in*: Si el usuario realiza un check-in adicional el mismo día, el sistema detecta la llave de fecha (`YYYY-MM-DD`) duplicada, precarga el estado previamente guardado y permite sobreescribirlo de inmediato.
* **Datos usados**: `profiles.bienestar_data.checkins`.
* **Criterios de aceptación**: El check-in diario debe persistir y reflejar la actualización cromática en la burbuja en menos de 1.5s en condiciones normales de red.
* **Pruebas mínimas**: Registrar la emoción "Ansioso", recargar la pestaña y verificar que el día correspondiente en la fila de 7 días se muestre con fondo color ámbar e icono de cara nerviosa.

---

### 2. UC-CAN-BIE-002: Práctica de Respiración Guiada con Visualizador Dinámico
* **ID**: `UC-CAN-BIE-002`
* **Nombre**: Ejecución interactiva de ejercicios clínicos de respiración para calmar el sistema nervioso.
* **Actor principal**: `user`.
* **Actores secundarios**: Ninguno (Procesamiento puramente local en el navegador).
* **Objetivo**: Ofrecer una técnica inmediata de primeros auxilios emocionales para reducir la ansiedad aguda antes de una entrevista de trabajo o después de recibir un correo de rechazo.
* **Precondiciones**: Acceso activo al panel de bienestar.
* **Flujo principal**:
  1. El Candidato ingresa a la pestaña de "Respiración".
  2. El sistema presenta tres opciones de técnicas clínicas de respiración:
     * **4-7-8 — Anti-ansiedad** (Inhala 4s, sostiene 7s, exhala 8s).
     * **Box Breathing — Foco** (Inhala 4s, sostiene 4s, exhala 4s, pausa 4s).
     * **Coherencia Cardiaca — Pre-entrevista** (Inhala 5s, exhala 5s).
  3. El usuario selecciona la técnica adecuada. El sistema carga la descripción y la secuencia de tiempos.
  4. El usuario presiona el botón "Comenzar".
  5. El sistema inicia un temporizador visual basado en micro-intervalos de 100ms:
     * Renderiza un anillo circular SVG que se va completando progresivamente para reflejar el avance de la fase actual.
     * La bola central pulsa dinámicamente: se escala hacia arriba (zoom) en fase "Inhala", se reduce en "Exhala" y permanece estable en "Sostén" o "Pausa".
     * Muestra instrucciones en tiempo real (ej: *"Inhala por la nariz"*, *"Sostén la respiración"*, *"Exhala lentamente"*).
  6. El sistema pasa automáticamente de una fase a otra en bucle infinito hasta que el usuario presione "Detener".
* **Flujos alternos**:
  * *Cambio de técnica en ejecución*: Si el usuario hace clic en otra técnica durante la respiración activa, el sistema detiene inmediatamente el bucle, reinicia los temporizadores a cero y prepara la nueva técnica sin colisiones en pantalla.
* **Datos usados**: Constante estructurada local `RESPIRACIONES`.
* **Pruebas mínimas**: Seleccionar "Box Breathing", iniciar y validar visualmente que el indicador de texto cambie a "Pausa" en el cuarto ciclo y que el anillo circular SVG se dibuje sincronizadamente.

---

### 3. UC-CAN-BIE-003: Autoevaluación del Radar de Bienestar Semanal
* **ID**: `UC-CAN-BIE-003`
* **Nombre**: Registro multidimensional de las 5 dimensiones clave de salud laboral.
* **Actor principal**: `user`.
* **Actores secundarios**: Supabase DB.
* **Objetivo**: Ofrecer al candidato una herramienta analítica estructurada para medir y graficar semanalmente su energía mental, resiliencia y enfoque.
* **Precondiciones**: Sesión activa de usuario.
* **Flujo principal**:
  1. El Candidato selecciona la pestaña "Radar".
  2. El sistema detecta la semana actual del año (`semana_WW_YYYY`) y despliega los controles interactivos para los 5 ejes de autoevaluación: Energía, Confianza, Enfoque, Ansiedad y Resiliencia.
  3. El usuario califica del 1 al 5 cada uno de los ejes presionando botones del panel de escala interactiva.
  4. El sistema calcula en tiempo real el promedio de bienestar (promedio aritmético sobre 5 puntos) y lo renderiza de forma elegante y destacada.
  5. El usuario presiona "Guardar evaluación semanal".
  6. El sistema envía las respuestas a Supabase, registrándolas bajo el nodo de la semana correspondiente en el objeto `bienestar_data`.
  7. El sistema confirma el guardado visualmente transformando el botón en "Guardado" con marca de verificación.
* **Datos usados**: `profiles.bienestar_data.radar`.
* **Resultado esperado**: Los datos persisten e impiden la duplicidad o sobreescritura caótica al mapear de forma inequívoca el código de la semana.
* **Pruebas mínimas**: Calificar con 5 los ejes y presionar guardar; verificar mediante recarga de página que el promedio global (ej: 5.0) persista en el extremo superior derecho.

---

## 📊 Formato C: Inventario de Datos (Bienestar)

| Dato | Clasificación | Origen | Ubicación | Quién accede | Retención | Cifrado | ¿Se envía a IA? | ¿Se registra en logs? | Borrado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Check-ins Emocionales** | Sensible | Entrada directa del candidato | `profiles.bienestar_data` | Exclusivamente el candidato propietario | Permanente o hasta eliminación de cuenta | Cifrado SSL/TLS en tránsito y en reposo (Supabase DB) | No | No | Al eliminar la cuenta del usuario |
| **Notas Personales** | Sensible / Crítico | Texto libre del candidato | `profiles.bienestar_data` | Exclusivamente el candidato propietario | Permanente o hasta eliminación de cuenta | Cifrado de base de datos Supabase | No | No | Eliminación inmediata a solicitud del usuario |
| **Métricas de Radar** | Sensible | Calificaciones semanales (1-5) | `profiles.bienestar_data` | Candidato. Para B2B: Procesamiento anónimo agrupado | Permanente | Encriptación en reposo DB | No | No | Anonimización total al revocar la cuenta |

---

## 🔒 Formato D: Reglas de Seguridad (Bienestar)

### 1. SEC-BIE-001: Aislamiento Total Corporativo (Zero B2B Visibility)
* **Declaración**: Los administradores de recursos humanos de las empresas patrocinadoras B2B jamás tendrán acceso a las notas, emociones de check-in, promedios de radar o historial de respiración de ningún empleado.
* **Motivo**: Prevenir discriminación, represalias, evaluación de desempeño sesgada o invasión a la privacidad del empleado durante sus procesos de recolocación laboral.
* **Implementación**:
  * Las políticas de seguridad de fila de base de datos (RLS) en Supabase impiden de forma absoluta a cualquier usuario ajeno al propietario leer los campos de `profiles.bienestar_data`.
  * La consulta SQL del dashboard de RRHH B2B se realiza mediante funciones PL/pgSQL restringidas que solo devuelven conteos globales consolidados y anónimos (ej: "34 colaboradores han completado check-ins esta semana") cuando el número de participantes es superior a 5 (para evitar desanominación en empresas pequeñas).
* **Prueba**: Intentar ejecutar un query de lectura sobre el campo `bienestar_data` de un perfil de tercero con un token JWT del administrador de la empresa. El motor de Supabase debe retornar un conjunto de resultados vacío.
* **Estado**: Verificada.

---

## 💾 Formato F: Especificaciones de Tabla

### 1. Extensión de Tabla: `profiles` (Campo `bienestar_data` JSONB)
* **Propósito**: Almacenamiento consolidado de los datos transaccionales e históricos del ecosistema de bienestar emocional del usuario.
* **Estructura JSONB Estandarizada**:
  ```json
  {
    "checkins": {
      "2026-05-26": {
        "emocion": "motivado",
        "nota": "Tuve una buena preparación con el Simulador de Entrevista.",
        "hora": "2026-05-26T14:40:00Z"
      }
    },
    "radar": {
      "semana_22_2026": {
        "energia": 4,
        "confianza": 5,
        "enfoque": 5,
        "ansiedad": 2,
        "resiliencia": 4,
        "evaluated_at": "2026-05-26T14:45:00Z"
      }
    }
  }
  ```
* **Políticas RLS aplicadas**:
  ```sql
  CREATE POLICY "Usuarios pueden actualizar su propio bienestar"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
  ```

---

## ⚠️ Formato H: Registro de Riesgos (Bienestar Emocional)

| ID | Riesgo | Severidad | Impacto | Probabilidad | Mitigación | Dueño | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RSK-BIE-01** | El usuario malinterpreta el módulo de bienestar como un sustituto de ayuda psiquiátrica o de intervención médica. | Alta | Reputacional | Media | Inclusión permanente en el pie de página de bienestar del descargo de responsabilidad: *"ELVIA proporciona herramientas informativas de auto-cuidado. Si te encuentras en una crisis severa de salud mental, por favor recurre a profesionales o líneas de atención médica de tu región."* | Legal Lead | Mitigado |
| **RSK-BIE-02** | Fuga accidental de datos a paneles consolidados B2B en empresas de tamaño micro (ej: 2 usuarios). | Alta | Privacidad | Baja | Si el total de colaboradores activos vinculados a un tenant corporativo B2B es menor a 5, el sistema deshabilita por completo las gráficas agregadas en el portal de HR Admin para impedir el perfilamiento. | Security Lead | Mitigado |
