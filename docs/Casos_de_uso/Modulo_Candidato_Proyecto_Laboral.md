# Documentación de Gobierno y Casos de Uso — Proyecto Laboral & Autoconocimiento

Este documento detalla la gobernanza técnica y funcional del **Módulo de Proyecto Laboral & Autoconocimiento (ReporteLaboral, ProyectoLaboral & Infografias)** de la plataforma ELVIA.

---

## 🧩 Formato B: Ficha de Módulo — Proyecto Laboral

| Campo | Respuesta |
| :--- | :--- |
| **Módulo** | Proyecto Laboral & Infografía de Autoconocimiento. |
| **Responsabilidad** | **Qué resuelve**: Formulario estructurado para definir los 5 pilares estratégicos de la transición laboral, y renderizador visual Apple-style (Atlas Ejecutivo) que plasma en una infografía descargable en PDF la oferta de valor, el cuadrante Ikigai, el mapa de ritmo semanal de disponibilidad, competencias seleccionadas y recursos activos.<br>**Qué NO resuelve**: Modificación directa del currículum Harvard (se enfoca únicamente en el reporte visual estratégico complementario). |
| **Usuarios** | Roles: `user` (Candidatos / Colaboradores). |
| **Casos de uso incluidos** | `UC-CAN-PL-001`, `UC-CAN-PL-002`, `UC-CAN-PL-003`. |
| **Datos que toca** | `profiles.job_search_profile` (datos de pilares), `cv_results` (contenido JSON de la infografía generada). |
| **Endpoints** | `GET /api/company/infografias/:id`, `POST /api/company/infografias/generate` (o enrutamiento a Supabase). |
| **Reglas de negocio** | 1. La infografía de autoconocimiento debe abrirse obligatoriamente en una nueva pestaña (`_blank`) para evitar que el usuario pierda su sesión y flujo de trabajo principal en la plataforma.<br>2. Se aplica un límite estricto de 10 generaciones máximas de infografías por demo para optimizar costes de LLM/renderizado.<br>3. El cuadrante Ikigai se renderiza dinámicamente mediante SVG nativo con colores pastel armoniosos y tipografía premium. |
| **Dependencias** | `html2pdf.js` (Exportación local a PDF), Google Fonts (Carga de fuentes de diseño *Bricolage Grotesque* e *Inter Tight*). |
| **Riesgos** | Tiempos de carga elevados en la conversión a PDF en dispositivos móviles. |
| **Definition of Done** | - El reporte en PDF se descarga de forma limpia a una sola página en tamaño carta sin cortes de texto.<br>- El heatmap de ritmo semanal se dibuja de forma responsiva con colores alternados según bloque AM/PM. |

---

## 📄 Formato A: Casos de Uso de Proyecto Laboral

### 1. UC-CAN-PL-001: Completar los 5 Pilares de Proyecto de Carrera
* **ID**: `UC-CAN-PL-001`
* **Nombre**: Completar Pilares de Carrera.
* **Actor principal**: `user`.
* **Actores secundarios**: Supabase DB.
* **Objetivo**: Guiar al candidato a través de 5 secciones estratégicas de autoconocimiento y planificación de carrera.
* **Precondiciones**: Sesión activa de usuario.
* **Flujo principal**:
  1. El Candidato ingresa a `/proyecto-laboral`.
  2. Rellena o actualiza de forma progresiva las siguientes 5 pestañas interactivas:
     * *Mi Perfil*: Cargo deseado, expectativa salarial y años de experiencia.
     * *Autoconocimiento*: Habilidades técnicas (Hard), interpersonales (Soft) y metodológicas (Power), más 5 empresas de sus sueños.
     * *Oferta de Valor*: Redacción de su oferta comercial y los 4 pilares de su Ikigai.
     * *Semana Laboral*: Mapa de calor con disponibilidad AM y PM de Lunes a Viernes para el plan de búsqueda.
     * *Recursos Activos*: Herramientas de apoyo (Laptop, Internet de alta velocidad, etc.).
  3. El sistema guarda automáticamente el progreso en Supabase en el objeto `profiles.job_search_profile`.
  4. La barra de progreso general en la cabecera se actualiza de forma visual.
* **Datos usados**: `job_search_profile`.
* **Pruebas mínimas**: Completar todas las pestañas y comprobar que la barra de progreso general alcance el 100%.

---

### 2. UC-CAN-PL-002: Generación y Descarga de Infografía Apple-Style
* **ID**: `UC-CAN-PL-002`
* **Nombre**: Visualización y descarga de Infografía de Autoconocimiento.
* **Actor principal**: `user`.
* **Actores secundarios**: `html2pdf.js`.
* **Objetivo**: Renderizar un reporte de alta fidelidad estética y tipografía premium con el resumen estratégico del candidato y permitir su exportación instantánea en PDF.
* **Precondiciones**: El candidato tiene un Grado de Autoconocimiento superior al 70%.
* **Flujo principal**:
  1. El Candidato hace clic en "Ver Infografía".
  2. El sistema abre la ruta `/reporte-laboral/:id` en una **nueva pestaña** (`_blank`).
  3. Carga dinámicamente las fuentes premium de Google.
  4. Renderiza las secciones en una plantilla sobria con color de fondo hueso (`#F5F1E6`), texto oscuro (`#0E0D0A`), acentos en azafrán (`#D97706`) y diagramas Venn de Ikigai SVG interactivos.
  5. El Candidato revisa la infografía y presiona "Descargar Infografía".
  6. La librería `html2pdf.js` procesa el contenedor en formato Letter (8.5" x 11") de forma local, omitiendo la barra de acciones e iconos de ayuda gracias a estilos de impresión, y guarda el archivo `.pdf` en su ordenador.
* **Datos usados**: Objeto de infografía de la tabla `cv_results`.
* **Resultado esperado**: Descarga de PDF de alta calidad en una página limpia.
* **Pruebas mínimas**: Hacer clic en descargar y verificar que el PDF resultante mantenga la alineación ejecutiva, colores pastel del diagrama Venn y no tenga desbordamientos.

---

### 3. UC-CAN-PL-003: Control de Límite de Generación (Backend Limit)
* **ID**: `UC-CAN-PL-003`
* **Nombre**: Aplicación y control de límites de generación de infografía.
* **Actor principal**: `user` / Sistema.
* **Actores secundarios**: `cvController.js` en backend.
* **Objetivo**: Impedir el consumo masivo e innecesario de créditos e inferencia LLM en cuentas demostrativas limitando la generación a 10 infografías por cuenta.
* **Precondiciones**: Intento de generación de nueva infografía.
* **Flujo principal**:
  1. El Candidato hace clic en "Generar Reporte de Autoconocimiento".
  2. El backend en NodeJS intercepta la solicitud y cuenta las infografías del usuario guardadas en `cv_results` con tipo `'infografia'` o equivalentes.
  3. Si el contador es mayor o igual a 10, el backend rechaza la generación devolviendo un error HTTP `403 Forbidden` con mensaje descriptivo.
  4. El frontend intercepta el error y despliega un modal amigable indicando que ha alcanzado el límite de 10 generaciones de demostración.
* **Flujos alternos**:
  * *Usuario Premium B2B/B2C*: Si el usuario posee un plan de pago o B2B ilimitado corporativo, el backend omite la regla de límite y procesa la solicitud con normalidad.
* **Permisos**: Validación por backend.
* **Pruebas mínimas**: Simular en base de datos un usuario con 10 registros en `cv_results` e intentar generar un nuevo reporte. Validar el mensaje de error controlado.

---

## 🔒 Formato D: Reglas de Seguridad (Proyecto Laboral)

### 1. SEC-PL-001: Sanitización de Historial de Currículos (Aislamiento de Infografías)
* **Declaración**: Se prohíbe de forma estricta que los reportes o infografías de autoconocimiento (formateados internamente en JSON con la firma `'{'`) contaminen el historial de currículos Harvard-Style optimizados del usuario.
* **Motivo**: Prevenir que el historial de CVs del usuario (destinado a exportación y postulaciones) se llene de archivos corruptos o ilegibles en formato JSON.
* **Implementación**: Filtro estricto client-side y database-side en las consultas de `CVOptimizer.jsx` y `cvController.js` que excluye de forma activa cualquier registro de `cv_results` cuyo contenido de texto inicie con la llave `'{'`.
* **Prueba**: Generar una infografía de autoconocimiento y luego navegar a la pestaña "Mis documentos / Mis CVs". La infografía no debe figurar en la lista del historial de CVs optimizados.
* **Estado**: Verificado.

---

## 💾 Formato F: Especificaciones de Tabla

### 1. Objeto `profiles.job_search_profile` (Base de Datos)
* **Propósito**: Estructura JSONB que almacena el progreso de autoconocimiento en Supabase.
* **Estructura del Objeto**:
  ```json
  {
    "perfil": {
      "nombre1": "Carlos",
      "apellido1": "Ruiz",
      "nombre_cargo": "Product Manager",
      "experiencia_anios": 8,
      "salario_monto": 85000,
      "moneda": "MXN",
      "equipo_personas": 12,
      "ciudad": "CDMX",
      "pais": "México"
    },
    "autoconocimiento": {
      "hard_skills": ["Product Strategy", "SQL", "A/B Testing"],
      "soft_skills": ["Liderazgo", "Negociación"],
      "power_skills": ["Gestión de Proyectos"],
      "top5empresas": ["Telefónica", "Google", "MercadoLibre"]
    },
    "oferta": {
      "oferta_valor": "Líder de producto digital con 8 años...",
      "cultura": ["Ágil", "Horizontal"],
      "ikigai_amas": "Amo resolver problemas de usuarios...",
      "ikigai_bueno": "Destaco en análisis de métricas...",
      "ikigai_necesita": "El mundo necesita mejores experiencias...",
      "ikigai_pagar": "Me pagarían por liderar equipos..."
    },
    "semana": {
      "bloques": {
        "lunes_am": true,
        "lunes_pm": false,
        "martes_am": true,
        "martes_pm": true
      }
    },
    "recursos": {
      "recursos": [
        { "nombre": "Laptop de trabajo", "tengo": true },
        { "nombre": "Internet estable", "tengo": true }
      ]
    }
  }
  ```

---

## 🤖 Formato G: Interacción con IA en Infografía de Autoconocimiento
* **Caso**: Generación semántica de la Oferta de Valor e Ikigai corporativo basándose en la trayectoria del candidato.
* **Proveedor/Modelo**: DeepSeek V3.
* **Datos Enviados**: Perfil crudo del usuario (Hard skills, aspiraciones, pasiones).
* **Validación Posterior**: El backend comprueba que la salida del LLM esté estructurada en formato JSON puro y legible antes de insertarse en la base de datos, evitando corrupciones sintácticas.

---

## ⚠️ Formato H: Registro de Riesgos (Proyecto Laboral)

| ID | Riesgo | Severidad | Impacto | Probabilidad | Mitigación | Dueño | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RSK-PL-01** | Lentitud extrema al generar PDF locales en navegadores móviles. | Media | UX | Media | Optimización de escala html2canvas y compresión de imágenes vectoriales SVG. | Frontend Lead | Mitigado |
| **RSK-PL-02** | Exceder la cuota límite de 10 reportes de forma maliciosa eliminando cookies de navegador. | Baja | Seguridad | Alta | Control de cuota alojado estrictamente en servidor (Backend count sobre base de datos persistida), ignorando datos locales de cliente. | Backend Lead | Cerrado |
