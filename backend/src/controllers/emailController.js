// Controlador de email
//
// sendCV(req, res):
//   1. Lee el resultado del CV desde Supabase por cvId
//   2. Genera el archivo en el formato solicitado (pdf o word)
//   3. Llama a resendService.sendCVEmail(to, attachment)
//   4. Responde con confirmación de envío
