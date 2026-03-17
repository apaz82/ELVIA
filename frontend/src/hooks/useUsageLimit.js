// Hook para controlar el límite freemium
// Consulta el usage_count del usuario actual en Supabase
// Retorna: { usageCount, hasReachedLimit, remainingUses }
// Si el usuario no está autenticado, usa localStorage como contador temporal
// Al llegar al límite, muestra modal de conversión a pago
