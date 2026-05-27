# Documentación de Gobierno y Casos de Uso — Mentor Experto 1-a-1

Este documento detalla la gobernanza técnica y funcional del **Módulo Mentor Experto 1-a-1 (Expertos.jsx)** de la plataforma ELVIA.

---

## 🧩 Formato B: Ficha de Módulo — Mentor Experto

| Campo | Respuesta |
| :--- | :--- |
| **Módulo** | Mentor Experto 1-a-1 & Videocoach Humano. |
| **Responsabilidad** | **Qué resuelve**: Ofrecer una ventanilla de agendamiento confidencial para asesorías especializadas de 1 hora con consultores seniors de outplacement (preparación de entrevistas STAR, análisis estratégico de cartas de ofertas salariales y planes de transición laboral). Incorpora una interfaz inmersiva mediante bucles de video real de coaches (`Optima video mentor 0.mp4`) y la lectura explícita de políticas de privacidad internacionales.<br>**Qué NO resuelve**: Resolver disputas legales laborales, impartir asesoría jurídica o tributaria, ni mediar directamente entre el candidato y su empleador anterior o futuro. |
| **Usuarios** | Roles: `user` (Candidato / Colaborador B2B con accesos desbloqueados). |
| **Casos de uso incluidos** | `UC-CAN-MEN-001`, `UC-CAN-MEN-002`. |
| **Datos que toca** | Selección del tipo de asesoría, descripción del requerimiento de carrera, aceptación de términos y envío mediante cliente de correo electrónico o backend. |
| **Endpoints** | Enlace transaccional cliente: `mailto:expertos@elvia.lat?subject=...&body=...` (vía `window.open` con codificación URI robusta) y validaciones en frontend del campo `featuresDesbloqueadas`. |
| **Reglas de negocio** | 1. **Límites de Entrada (Validation Rules)**: El botón de envío está bloqueado hasta que el usuario elija un servicio válido y redacte al menos **20 caracteres** con el detalle del requerimiento.<br>2. **Sello de Confidencialidad**: Los mentores asignados deben contar con acuerdos NDA firmados previamente en el sistema interno de ELVIA.<br>3. **Restricción de Alcance**: Mapeo estricto del alcance en la interfaz: se detallan de forma clara e inequívoca las temáticas cubiertas y las temáticas explícitamente fuera de alcance. |
| **Dependencias** | Assets de video (`/Optima video mentor 0.mp4`), póster estático (`/mentor_hero_human.png`), logos transparentes corporativos, y Phosphor Icons. |
| **Riesgos** | Candidatos compartiendo contraseñas de empresa o información altamente protegida por error en el formulario libre. (Mitigación: inclusión de alerta de advertencia en fondo ámbar antes del envío). |
| **Definition of Done** | - La reproducción de video incluye propiedades responsivas nativas (`playsInline`, `webkit-playsinline`, `muted`, `autoPlay`, `loop`) para asegurar compatibilidad total en dispositivos móviles iOS y Android.<br>- El modal de políticas de privacidad se abre con scroll adaptativo independiente y requiere confirmación del usuario para proceder. |

---

## 📄 Formato A: Casos de Uso de Mentor Experto

### 1. UC-CAN-MEN-001: Solicitud de Mentoría Especializada
* **ID**: `UC-CAN-MEN-001`
* **Nombre**: Solicitud de sesión 1-a-1 de mentoría de carrera.
* **Actor principal**: `user` (Candidato / Colaborador).
* **Actores secundarios**: Consultor Senior (Mentor).
* **Objetivo**: Conectar al candidato con un experto humano que revise su caso particular (ej: practicar preguntas STAR para una entrevista inminente).
* **Precondiciones**: Suscripción de pago o acceso corporativo habilitado.
* **Flujo principal**:
  1. El Candidato ingresa a la pestaña "Mentor Experto 1-a-1".
  2. El sistema reproduce automáticamente un bucle de video en alta calidad del videocoach humano con una marca de agua translúcida de la marca ELVIA en la parte superior izquierda.
  3. El usuario visualiza la tarjeta de aviso de confidencialidad en color ámbar.
  4. El usuario selecciona uno de los 5 tipos de asesoría en el menú desplegable:
     * Asesoría de Entrevista
     * Asesoría de Carta Oferta
     * Revisión de CV y Posicionamiento
     * Análisis de Vacante Objetivo
     * Estrategia de Transición Laboral
  5. El usuario describe en detalle su situación actual y metas en el campo de texto.
  6. El sistema contabiliza dinámicamente el número de caracteres ingresados en tiempo real. Al superar los 20 caracteres mínimos, habilita el botón de envío y despliega una marca de verificación verde.
  7. El usuario presiona "Agendar mi sesión de mentoría →".
  8. El sistema abre el cliente de correo predeterminado del usuario con el destinatario `expertos@elvia.lat`, asunto estructurado y cuerpo con la descripción codificada.
  9. El sistema actualiza el estado local de la interfaz mostrando temporalmente el banner: *"¡Solicitud enviada! Te contactamos pronto"*.
* **Flujos alternos**:
  * *Sin cliente de correo configurado*: Si el cliente de correo local falla, el usuario copia el texto y lo envía manualmente a la dirección que se expone claramente en pantalla.
* **Datos usados**: Selección del servicio, texto de requerimiento del candidato.
* **Criterios de aceptación**: El contador de caracteres debe ser responsivo y el botón de envío debe activarse instantáneamente al alcanzar el carácter número 20.
* **Pruebas mínimas**: Seleccionar "Asesoría de Carta Oferta", escribir 10 caracteres y comprobar que el botón se mantenga en modo deshabilitado. Escribir 10 caracteres adicionales y validar su activación inmediata.

---

### 2. UC-CAN-MEN-002: Lectura de Política de Privacidad y Tratamiento de Datos
* **ID**: `UC-CAN-MEN-002`
* **Nombre**: Visualización y validación de la Política de Privacidad y NDA de Mentoría.
* **Actor principal**: `user`.
* **Actores secundarios**: Ninguno.
* **Objetivo**: Garantizar el cumplimiento legal e informar exhaustivamente al usuario sobre sus derechos ARCO, límites del consejo profesional y la estricta confidencialidad antes de compartir información sensible de carrera.
* **Precondiciones**: Acceso activo al módulo.
* **Flujo principal**:
  1. El Candidato hace clic sobre el enlace *"Leer política completa de privacidad y protección de datos"* al pie del formulario.
  2. El sistema despliega un modal centrado con fondo oscuro y efecto `backdrop-blur-sm`.
  3. El sistema renderiza los 6 puntos clave de protección de datos:
     1. Datos recopilados de forma voluntaria.
     2. Finalidad exclusiva del tratamiento de la información de carrera.
     3. Confidencialidad absoluta y acuerdo de no divulgación (NDA).
     4. Bases legales sustentadas en GDPR (Europa) y LFPDPPP (México/LATAM).
     5. Derechos del usuario para acceso, rectificación, cancelación y oposición (ARCO).
     6. Alcance y limitaciones explícitas del servicio de mentoría.
  4. El usuario lee las políticas.
  5. El usuario presiona el botón "Entendido, continuar" o el icono de cierre.
  6. El sistema cierra el modal devolviendo el foco de navegación al formulario.
* **Datos usados**: Contenido textual estático de la política de privacidad.
* **Resultado esperado**: Presentación ágil de la política de privacidad con perfecta respuesta de scroll.
* **Pruebas mínimas**: Hacer clic en el enlace, validar el montaje del modal de forma instantánea y verificar que los enlaces de correo (`privacidad@elvia.lat`) sean clicables.

---

## 📊 Formato C: Inventario de Datos (Mentoría 1-a-1)

| Dato | Clasificación | Origen | Ubicación | Quién accede | Retención | Cifrado | ¿Se envía a IA? | ¿Se registra en logs? | Borrado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Nombre y Email** | Personal | Formulario de registro o cliente de correo | Base de datos de soporte / Email de soporte | Mentores seniors autorizados | Duración del programa de outplacement (ej: 12 meses) | Cifrado SSL/TLS de correo corporativo | No | No | A petición expresa (ejercitando derechos ARCO) |
| **Requerimientos de Mentoría** | Sensible | Entrada directa del candidato | Correo transaccional de entrada | Mentor senior asignado bajo NDA | 6 meses tras concluir la asesoría | Encriptación en reposo del proveedor de correo | No | No | Eliminación física al concluir el tiempo de retención |
| **Aceptación de Términos** | Interno | Clic de confirmación | Logs de auditoría de Supabase | Equipo de soporte legal | 5 años (término de prescripción legal) | Cifrado de base de datos | No | Sí | Anonimización total tras el periodo legal |

---

## 🔒 Formato D: Reglas de Seguridad (Mentoría 1-a-1)

### 1. SEC-MEN-001: Limitación de Responsabilidad Legal y de Salud Mental (Scope Restriction)
* **Declaración**: El servicio de mentoría se circunscribe a temas de recolocación y carrera. Quedan explícitamente excluidos los temas de demandas legales contra empleadores actuales/previos, conflictos sindicales y asesoramiento psicoterapéutico.
* **Motivo**: Prevenir demandas de terceros a la plataforma por mala praxis o intrusismo profesional en áreas médicas y del derecho.
* **Implementación**:
  * Cláusula explícita de "Fuera de alcance" en la tarjeta de presentación en la pantalla del héroe y en el punto 6 de la Política de Privacidad del Modal.
  * Los mentores son instruidos formalmente para suspender la sesión si el candidato intenta derivarla a asesoría jurídica o terapia, ofreciendo un protocolo de salida amable y seguro.
* **Prueba**: Simular una solicitud con contenido controversial y validar que el equipo técnico o el mentor filtre y rechace la sesión, notificando el motivo basado en el punto 6 de la política.
* **Estado**: Verificada.

---

## 🌐 Formato E: Contrato de Mailto Client (Mentoría)

### 1. Mailto Link: `expertos@elvia.lat`
* **Acceso**: `user` autenticado.
* **Autenticación**: Validación de tokens en frontend.
* **Input**:
  * `servicio` (String: Tipo de asesoría seleccionada).
  * `detalle` (String: Mínimo 20 caracteres del requerimiento).
* **Parámetros del enlace transaccional**:
  ```
  mailto:expertos@elvia.lat?subject=Solicitud de Mentoría — [servicio]&body=Tipo de asesoría: [servicio]%0A%0ADetalle del requerimiento:%0A[detalle]
  ```
* **Cifrado**: En tránsito a través del protocolo SMTP del cliente de correo nativo del usuario.

---

## ⚠️ Formato H: Registro de Riesgos (Mentoría 1-a-1)

| ID | Riesgo | Severidad | Impacto | Probabilidad | Mitigación | Dueño | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RSK-MEN-01** | El usuario comparte información bancaria o credenciales corporativas en la descripción del formulario. | Media | Seguridad | Media | Inclusión de una etiqueta de advertencia parpadeante o color ámbar al pie del formulario que detalla: *"No compartas contraseñas ni datos bancarios"* | DevOps Lead | Mitigado |
| **RSK-MEN-02** | Incompatibilidad de reproducción del video loop `Optima video mentor 0.mp4` en navegadores antiguos o móviles con ahorro de batería. | Baja | UX | Media | Configuración de una imagen de respaldo `/mentor_hero_human.png` de alta definición mediante el atributo `poster` de la etiqueta `<video>` de HTML5 para renderizar el fondo estático en caso de fallo de reproducción. | UI Lead | Mitigado |
