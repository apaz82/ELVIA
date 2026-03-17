// Controlador de vacantes
//
// getSimilar(req, res):
//   1. Lee title, location, country desde query params
//   2. Llama a joobleService.searchJobs({ title, location, country })
//   3. Formatea y filtra los resultados (elimina duplicados, ordena por fecha)
//   4. Responde con array de vacantes { title, company, location, date, url }
