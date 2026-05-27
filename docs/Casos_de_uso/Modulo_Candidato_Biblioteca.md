# Documentación de Gobierno y Casos de Uso — Biblioteca de Recursos de Carrera

Este documento detalla la gobernanza técnica y funcional de la **Biblioteca de Recursos de Carrera (Biblioteca.jsx)** de la plataforma ELVIA.

---

## 🧩 Formato B: Ficha de Módulo — Biblioteca de Recursos

| Campo | Respuesta |
| :--- | :--- |
| **Módulo** | Biblioteca de Recursos & Infografías de Carrera. |
| **Responsabilidad** | **Qué resuelve**: Proporcionar a los candidatos un centro de conocimiento centralizado y estructurado con artículos especializados (Entrevistas, LinkedIn, CV, Networking) e infografías de alta resolución (Anatomía del CV, Funcionamiento ATS) para optimizar su búsqueda de empleo de manera autónoma e interactiva.<br>**Qué NO resuelve**: Creación de contenido dinámico al vuelo mediante IA (los artículos e infografías son estáticos, curados y validados por consultores humanos de outplacement). |
| **Usuarios** | Roles: `user` (Candidato / Colaborador B2B). |
| **Casos de uso incluidos** | `UC-CAN-BIB-001`, `UC-CAN-BIB-002`. |
| **Datos que toca** | `ARTICULOS` (constante local estructurada en frontend), `INFOGRAFIAS` (recursos visuales locales en carpeta pública). |
| **Endpoints** | No consume endpoints REST de escritura directa; consulta localmente mediante JSON estructurado. Valida la autorización con `useAuth().featuresDesbloqueadas`. |
| **Reglas de negocio** | 1. **Puerta de Acceso (Unlock Gate)**: El módulo completo se renderiza bloqueado con `FeatureLocked` si la propiedad `featuresDesbloqueadas` del contexto de autenticación es falsa (requiere plan de pago B2C o habilitación corporativa B2B).<br>2. **Interactividad Cromática**: Cada categoría de artículo posee una firma de color estricta (Entrevistas: Azul, LinkedIn: Teal, CV: Púrpura, Networking: Ámbar) para consistencia visual con el resto del ecosistema.<br>3. **Seguridad de Descarga**: Las infografías expuestas deben descargarse directamente en formato PNG/PDF local con nomenclatura unificada de ELVIA para co-branding empresarial. |
| **Dependencias** | Phosphor Icons (`@phosphor-icons/react`), context `AuthContext` (`useAuth`), componente `FeatureLocked` y `HelpBadge` para micro-tutoriales. |
| **Riesgos** | Sobrecarga de carga visual en dispositivos móviles al abrir infografías grandes o descargar archivos masivos en redes inestables. |
| **Definition of Done** | - El buscador local filtra instantáneamente por coincidencia parcial en título, descripción y etiquetas (tags) en menos de 100ms.<br>- El modal del artículo cuenta con scroll independiente y renderiza adecuadamente listas ordenadas, viñetas y cajas Pro-Tip. |

---

## 📄 Formato A: Casos de Uso de Biblioteca de Recursos

### 1. UC-CAN-BIB-001: Búsqueda y Lectura de Artículos de Carrera
* **ID**: `UC-CAN-BIB-001`
* **Nombre**: Consulta, búsqueda interactiva y lectura de artículos especializados de outplacement.
* **Actor principal**: `user` (Candidato / Colaborador).
* **Actores secundarios**: Ninguno.
* **Objetivo**: Permitir al candidato encontrar rápidamente guías accionables y plantillas para resolver problemas específicos en sus procesos de selección (ej: responder preguntas trampa o negociar salarios).
* **Precondiciones**: El usuario posee acceso desbloqueado a los recursos (`featuresDesbloqueadas` activo).
* **Flujo principal**:
  1. El Candidato ingresa a la sección de "Biblioteca".
  2. El sistema renderiza la cuadrícula de artículos ordenados por fecha de publicación.
  3. El usuario escribe palabras clave en la barra de búsqueda (ej: "STAR" o "negociación").
  4. El sistema filtra en tiempo real en frontend los artículos que contengan las palabras clave en su título, etiquetas o descripción.
  5. El usuario hace clic en las "píldoras de categoría" (Todos, Entrevistas, LinkedIn, CV, Networking) para filtrar adicionalmente.
  6. El usuario hace clic sobre una tarjeta de artículo.
  7. El sistema abre un modal flotante renderizando el contenido estructurado: introducción en cursiva destacada, subhacheados, listas ordenadas con enumeración, listas de viñetas con viñetas de marca y cajas contextuales "Pro Tip" con fondo destacado y Phosphor Icons.
  8. El usuario finaliza la lectura y cierra el modal mediante el botón de cierre o haciendo clic en el exterior.
* **Flujos alternos**:
  * *Sin resultados*: Si el término ingresado en el buscador no arroja coincidencias, el sistema oculta la cuadrícula y muestra un estado vacío (Empty State) premium con Phosphor Icon de libro abierto difuminado y sugerencias de búsqueda.
* **Datos usados**: Constante estructurada local `ARTICULOS`.
* **Permisos**: Cuenta activa con plan elegible.
* **Resultado esperado**: Renderizado y filtrado inmediato con transiciones visuales fluidas.
* **Criterios de aceptación**: El tiempo de respuesta de filtrado debe ser inferior a 150ms y el modal debe tener perfecta legibilidad en pantallas pequeñas (responsive modal margins).
* **Pruebas mínimas**: Escribir un tag (ej: "SSI") y verificar que solo aparezcan artículos correspondientes al ecosistema de LinkedIn.

---

### 2. UC-CAN-BIB-002: Visualización y Descarga de Infografías Premium
* **ID**: `UC-CAN-BIB-002`
* **Nombre**: Visualización en alta definición y descarga de infografías de referencia rápida.
* **Actor principal**: `user`.
* **Actores secundarios**: Ninguno.
* **Objetivo**: Facilitar al candidato mapas visuales sintéticos de gran valor (ej: anatomía del CV o funcionamiento de un ATS) listos para archivar o imprimir.
* **Precondiciones**: Acceso desbloqueado al módulo.
* **Flujo principal**:
  1. El Candidato se desplaza a la sección inferior de "Infografías".
  2. El sistema muestra tarjetas con previsualizaciones de las imágenes e información descriptiva.
  3. El usuario pasa el cursor sobre una tarjeta; el sistema activa una transición de escala de imagen (zoom suave del 2%) y despliega un overlay interactivo de "Ver completa".
  4. El usuario hace clic en "Ver completa" o en el botón correspondiente.
  5. El sistema despliega un modal oscuro premium con el fondo desenfocado (`backdrop-blur-sm` al 70% de opacidad) que presenta la infografía a tamaño completo.
  6. El usuario hace clic en "Descargar" en la tarjeta.
  7. El sistema inicia la descarga directa del archivo PNG/PDF de alta resolución local utilizando el atributo `download` del navegador.
* **Flujos alternos**:
  * *Clic en fondo oscuro*: Al hacer clic en cualquier área del fondo del modal oscuro, este se cierra de inmediato sin fricción para el usuario.
* **Datos usados**: Constante `INFOGRAFIAS`, archivos de imagen de la carpeta pública (`/info_cv.png`, `/info_ats.png`).
* **Pruebas mínimas**: Hacer clic en "Descargar" y validar que el archivo PNG se transfiera al disco local con el nombre y extensión correspondientes.

---

## 📊 Formato C: Inventario de Datos (Biblioteca)

| Dato | Clasificación | Origen | Ubicación | Quién accede | Retención | Cifrado | ¿Se envía a IA? | ¿Se registra en logs? | Borrado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Contenido de Artículos** | Público / Interno | Redactado por mentores | Constantes frontend | Todos | Permanente | No requerido | No | No | No aplica |
| **Rutas de Infografías** | Público | Assets del servidor | Carpeta pública | Todos | Permanente | No requerido | No | No | No aplica |
| **Búsquedas de Usuario** | Interno / Privado | Inputs de teclado | Memoria volátil React | Solamente el usuario local | Solo durante la sesión activa | No requerido (volátil) | No | No | Al cerrar la pestaña |

---

## 🔒 Formato D: Reglas de Seguridad (Biblioteca)

### 1. SEC-BIB-001: Protección de Contenido Premium (Auth Gate)
* **Declaración**: Ningún usuario sin suscripción activa o tenant corporativo B2B habilitado podrá saltarse la pantalla de bloqueo para acceder a las guías prácticas y descargas de infografías.
* **Motivo**: Prevenir la piratería o uso no autorizado de materiales propietarios y altamente valorados del programa de outplacement de ELVIA.
* **Implementación**:
  * Control del renderizado en React basado en el estado `featuresDesbloqueadas` suministrado por el `AuthContext`.
  * Si es falso, se intercepta la visualización antes del montaje del componente principal y se sustituye por `FeatureLocked` con ilustración decorativa de candado y Phosphor Icons.
* **Prueba**: Intentar ingresar directamente a la pestaña de Biblioteca editando variables locales de estado en consola. Validar que la interfaz se mantenga protegida y no se expongan las constantes de datos del archivo.
* **Estado**: Verificado.

---

## ⚠️ Formato H: Registro de Riesgos (Biblioteca)

| ID | Riesgo | Severidad | Impacto | Probabilidad | Mitigación | Dueño | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RSK-BIB-01** | Robo de propiedad intelectual y redistribución externa de infografías en redes sociales. | Media | Negocio | Alta | Inyección de marcas de agua transparentes de ELVIA y co-branding dinámico en las esquinas de los assets antes de la exportación a producción. | Diseñador UX | Mitigado |
| **RSK-BIB-02** | Lentitud en la carga de imágenes gigantescas de infografías en móviles. | Baja | UX | Media | Optimización de las imágenes originales usando formatos comprimidos de última generación (WebP / AVIF) con tamaños responsivos. | Frontend Lead | En Progreso |
