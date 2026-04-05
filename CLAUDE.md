# ELVIA® — Ecosistema Integral de Acompañamiento en Transición Laboral

## 🚀 Misión y Propósito
ELVIA® es el **copiloto estratégico de clase mundial** diseñado para democratizar el acceso a mentoría de carrera de elite. No es solo una factoría de CVs; es un sistema de acompañamiento humano y tecnológico que cuida a la persona mientras potencia su perfil profesional.

- **Alcance**: Cualquier profesional en transición de carrera (actual o planeada).
- **Democratización**: Desde recién egresados hasta perfiles Senior/C-Level. El valor no depende del seniority.
- **Impacto**: Resultados de alto impacto con un costo razonable y justo.
- **Promesa #1**: La **Confidencialidad y Seguridad** de la información son nuestra prioridad absoluta.

## 🌍 Localización y Tono
- **Mercado Inicial**: Hispanoamérica (LATAM + USA Hispano).
- **Lenguaje**: Texto **neutro pero cercano**, eliminando el bias y la frialdad corporativa.

## 🏗 Arquitectura del Sistema (Fase 1: Búsqueda)

### 1. Centro de Control y Onboarding
- **Gerente de Búsqueda**: 6 pilares estratégicos (Perfil, Autoconocimiento, Aspiraciones, LinkedIn® Pro, Mercado y Estrategia).
- **Factoría Harvard Standard**: Generación de CVs ATS-Friendly con protección de identidad.
- **Bienestar Corporativo**: Módulo de salud mental y soporte emocional.

### 2. Inteligencia de Valor (Bot Elite)
- **Más que un Chatbot**: El bot de ELVIA® debe **agregar valor real**, analizando contexto, sugiriendo palabras clave y actuando como un mentor activo, no solo respondiendo preguntas.

## 🔮 Roadmap y Escalabilidad (Fase 2+)
- **B2C y B2B**: Plataforma diseñada para escalar a modelos corporativos y de consumo masivo.
- **Los Primeros 90 Días**: Expansión del ecosistema para acompañar al usuario en su **onboarding y éxito** en el nuevo empleo.
- **Omnicanalidad**: Expansión a **WhatsApp, Telegram y Mobile App**.
- **Infraestructura de Mercado**: Extensiones para **Chrome** para capturar información de vacantes directamente desde portales de empleo.

## 🛡️ Seguridad y Robustez Técnica

### Protección de Datos
- **MFA & RLS**: Seguridad a nivel de fila en Supabase y tokens sincronizados.
- **PII Shield**: Cero almacenamiento de datos personales en analítica de telemetría.
- **SSRF & XSS Guard**: Sanitización con `DOMPurify` y whitelists de dominios.

### Estabilidad de Operación
- **AI Hard Cap**: Límites diarios en Claude API para control de presupuesto y prevención de abuso.
- **Paginación & Locks**: `.range()` sistemático en backend y `sessionStorage` para estados críticos (Password Recovery).

## 🛠 Stack Técnico
- **Frontend**: Vite + React + Tailwind CSS (UX/UI de clase mundial).
- **Backend**: Node.js + Express (Netlify/Railway).
- **Persistencia**: Supabase (PostgreSQL + Storage + Auth).
- **IA Engine**: Claude 3 (Haiku/Sonnet).
- **PDF Engine**: `pdf-lib` (Client-side rendering).

## ⚙️ Reglas de Desarrollo (Manual de Estilo)

### Shell & CLI (Windows PowerShell)
- **Chaining**: NUNCA usar `&&`. Siempre usar `;` para comandos secuenciales.
  - Correcto: `git add . ; git commit -m "..."`

### Branding y Calidad
- **Propiedad Intelectual**: Siempre usar `LinkedIn® Pro` y `ELVIA®`.
- **Sello de Mentoría**: Todo entregable debe llevar el sello de validación de mentores expertos.
- **Accesibilidad**: Diseño inclusivo con tipografía *Plus Jakarta Sans* y altos contrastes.

### Gestión de Datos
- **Privacidad**: Comparar siempre la identidad del CV subido con el perfil del usuario (`extractProfile`).
- **Caching**: Priorizar `sessionStorage` para mantener la fluidez entre tabs del Proyecto Laboral.
