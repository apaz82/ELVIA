// Servicio de envío de emails via Resend
// Límite gratuito: 3000 emails/mes
//
// sendCVEmail(to, attachment):
//   - Usa el SDK de Resend con RESEND_API_KEY
//   - Envía email con el CV como adjunto (PDF o Word)
//   - From: noreply@cvoptimizerpro.com (dominio a configurar en Resend)
//   - Subject y body en el idioma del CV
