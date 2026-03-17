// Servicio de integración con Jooble API
// Documentación: https://jooble.org/api/about
//
// searchJobs({ title, location, country }):
//   - Construye el payload para la API de Jooble
//   - POST a https://jooble.org/api/{JOOBLE_API_KEY}
//   - Filtra y normaliza la respuesta
//   - Retorna: array de { title, company, location, date, url, snippet }
