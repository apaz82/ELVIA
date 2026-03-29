# 💰 Modelo de Costos de Infraestructura B2C (OPTIMA-CV)

Basado en la arquitectura actual detectada en el código (`Supabase`, `Anthropic`, `Resend`, [Jooble](file:///c:/Users/G15/Documents/Claude-Antigravity%20projects/APP-HR-CVS/backend/src/routes/jobs.js#85-111), `Netlify`, `Cloudflare`, `Node.js`), este es tu mapa financiero en fases.

La mayor ventaja tecnológica de tu stack es que es fuertemente de **pago por uso** y apalancado en capas gratuitas extremadamente generosas ("Serverless").

## 🟢 Fase 1: Lanzamiento / Validación (0 - 1,000 usuarios activos)
En esta fase, el objetivo es mantener la tasa de quema de dinero (*burn rate*) cercana a cero. Casi todas tus herramientas te sostendrán sin pagar mensualidades fijas.

| Herramienta / Servicio | Función en el sistema | Costo Actual Fase 1 | Límite del plan Gratuito |
| :--- | :--- | :--- | :--- |
| **Namecheap** | Dominio Web (`optimacv.cv`) | **$1.98 / año** | Primer año (luego ~$14.98/año) |
| **Cloudflare** | DNS, CDN Mundial y WAF | **$0 / mes** | Tráfico ilimitado, reglas básicas |
| **Netlify** | Frontend Hosting (React) | **$0 / mes** | 100 GB Bandwidth, 300 min build |
| **Backend Host** | Node.js Express (Render/Railway)* | **$0 - $7 / mes** | Capa gratis (se duerme) o $7 fijo base |
| **Supabase** | Base de Datos PostgreSQL + Auth | **$0 / mes** | 50,000 usuarios, 500 MB base de datos |
| **Resend** | Envíos de correos transaccionales | **$0 / mes** | 3,000 correos al mes (100 diarios) |
| **Anthropic (Claude)** | IA de Optimización y Chatbot | **~$2 - $5 / mes** | Pago por uso (~$0.01 por uso de IA) |
| **Jooble API** | Motor de búsqueda de Vacantes | **$0 / mes** | Plan partner (usualmente sin costo) |

> 🏷️ **Gasto Mensual Estimado (Fase 1):** **$5 a $15 USD mensuales.**

---

## 🟡 Fase 2: Escalamiento / Growth (5,000+ usuarios activos, monetizando)
Cuando tu producto es un éxito, rompes las capas gratuitas. Sin embargo, en la arquitectura SaaS moderna, *los costos de la Fase 2 siempre deben estar cubiertos por tu plan de pagos Pro*. Si estás en la Fase 2, significa que ya estás facturando.

| Herramienta / Servicio | Plan "Pro" a escalar | Costo Futuro Estimado | ¿Por qué y cuándo se paga? |
| :--- | :--- | :--- | :--- |
| **Supabase** | Plan Pro | **$25 / mes** | Lo pagarás al superar los 500MB en la base general (historial de chats, metadatos masivos, etc.) o si necesitas backups automáticos robustos diarios. |
| **Resend** | Plan Pro | **$20 / mes** | Cuando tu app encole más de 3,000 correos al mes, te subirán al plan pro que otorga hasta 50,000 correos (suficiente para años). |
| **Netlify** | Plan Pro | **$19 / mes** | Opcional. Útil cuando necesitas agregar más desarrolladores al mismo equipo o mayor prioridad de despliegue. |
| **Backend Host** | Escalamiento de Servidores | **~$20 a $40 / mes** | Cuando tienes miles de usuarios subiendo PDFs al mismo tiempo, Node requiere más memoria RAM y núcleos de CPU en producción. |
| **Anthropic (Claude)** | Pago por Inferencia | **~$50 a $150 / mes** | Escala linealmente. Si 5,000 usuarios usan la IA, la API te cobrará por volumen de tokens. Es tu mayor variable, pero altamente controlable mediante cachés y límites de suscripción. |

> 📊 **Costo Fijo Base (Fase 2):** **~$65 USD mensuales** (Supabase + Resend + Backend).
> 📈 **Costo Variable (IA):** Depende del tráfico premium (escalable con la facturación de tus usuarios).

---

## 🚀 Cómo mantener los costos de IA bajos:
Tu mayor riesgo de costos a futuro será el cerebro de la aplicación (Anthropic - Claude API). Un solo usuario estirando múltiples Prompts y subiendo CVs en texto gigante repetidas veces puede costarte unos centavos cada vez. 

1. **Monetiza los Prompts Pesados:** Como ya has hecho, es vital mantener funcionalidades como la 'Entrevista Mock' o el 'CV vs Job ilimitado' detrás del botón Premium.
2. **Usa Modelos Mixtos:** Usa el modelo más barato (Claude 3 Haiku) para análisis de texto rápido o chat trivial, y guarda los tokens caros (Claude 3.5 Sonnet / Opus) para la reconstrucción final del documento PDF de exportación.
3. **Guardado en Caché Vecctorial:** Para la Base de Conocimiento de RRHH, no mandes contextos de PDFs inmensos cada vez. Convierte el conocimiento a texto extraído desde tu servidor y pásale extractos a Claude.
