# Refactor CV Inicial — Bitácora de fases y rollback

> Inicio: 2026-05-26 · Última revisión: 2026-05-27
> Branch: `main`
> Objetivo: Unificar la creación de CV bajo el concepto **CV Inicial** en un único tab dentro de Autoconocimiento, con dos puntos de entrada (upload + desde cero) que convergen en data estructurada, vista previa Harvard y versionado por fecha.
>
> **Nota (2026-05-27):** Las Fases 4a, 4b y 4c del refactor de CV Inicial ya están completamente implementadas e integradas. Se realizó un fix crítico de migración de `fusionarResumen` a DeepSeek V3 para solucionar un error 500. Las Fases 5 y 6 siguen pendientes.

---

## Principios de seguridad del refactor

1. **1 commit = 1 fase** → cada fase es revertible con `git revert <hash>` sin afectar otras.
2. **Nada se borra** → archivos, rutas y endpoints permanecen accesibles aunque ocultos en UI.
3. **Sin migrations destructivas en BD** → solo metadata adicional en columnas JSON existentes.
4. **Página Optimizer queda dormida** → ruta `/cv-optimizer` sigue funcional por URL directa, código intacto.

---

## Estado de las fases

| Fase | Descripción | Estado | Commit |
|------|-------------|--------|--------|
| 0 | Ocultar Optimizer de navegación + redirigir CTAs a `/cv-desde-cero` | ✅ Completado | `026102b` |
| 1 | Crear `CVHarvardPreview.jsx` (componente presentacional puro) | ✅ Completado | `bd9cf7f` |
| 2 | Añadir paso 7 "Vista Previa" en wizard CVDesdeCero | ✅ Completado | `bd9cf7f` |
| 3 | Pantalla selección en `/cv-desde-cero` (2 cards: upload/desde cero) | ✅ Completado | `90922db` |
| 3b | Reestructurar pilares: renombrar (Competencias/Gastos/Optimizador de CV), nuevos weights, PilarOptimizadorCV, botón Mis Documentos gated al 100% | ✅ Completado | `25e8672` |
| 3c | Sequential lock progresivo + quitar upload CV de Mi Perfil + fix modal hardcoded | ✅ Completado | `c682ed8` |
| fix | Fix build: declaración duplicada `isLocked` en grid de pilares | ✅ Completado | `0899929` |
| 4a | Path A: modos upload/scratch separados, modal cancelar, pre-llenado desde Gerente | ✅ Completado | `784fc0d` |
| 4b | Path A: Fusión resumen CV + Mi Oferta de Valor (3 cajas + botón Fusionar con ELVIA®) | ✅ Completado | `cc5686f` |
| 4c | Contexto del Gerente → optimizarResumen + optimizarDescripcionExp (ambos paths) | ✅ Completado | `9ed5bac` |
| 4d | Habilitar documentos al 100% y desbloqueo total al Confirmar CV | ✅ Completado | `feat` |
| 5 | Versionado en MisCVs (badge CV Inicial / CV Modificada fecha) | ⏸️ Pendiente | — |
| 6 | Puntaje visible (inicial+final en Path A, solo final en Path B) | ⏸️ Pendiente | — |

---

## Fase 0 — Ocultar Optimizer de navegación

**Qué cambia (visible al usuario):**
- Sidebar: link "CV Optimizer" oculto del menú HERRAMIENTAS
- Dashboard: 3 CTAs ("Optimizar CV", notificación, MetricCard) redirigen a `/cv-desde-cero` con label "Crear mi CV"
- ProyectoLaboral DOCS_LIST: item "CV optimizado con ELVIA" → "CV Inicial con ELVIA" apuntando a `/cv-desde-cero`
- MisCVs EmptyStates: ambos CTAs vacíos redirigen a `/cv-desde-cero`

**Qué NO cambia (preservado para rollback):**
- Archivo `frontend/src/pages/CVOptimizer.jsx` intacto
- Ruta `/cv-optimizer` en `App.jsx` activa
- Lazy import en `App.jsx` intacto
- `RUTAS_APP` y `RUTAS_GATED` incluyen `/cv-optimizer`
- Endpoint backend `POST /api/cv/optimize` intacto
- Datos históricos `tipo: 'optimize'` siguen visibles en MisCVs

**Rollback Fase 0:**
```bash
git revert <hash_fase_0>
```
O manualmente:
1. `frontend/src/components/common/Sidebar.jsx` → descomentar línea `{ to: '/cv-optimizer', ... }`
2. `frontend/src/pages/Dashboard.jsx` → revertir 3 CTAs: `/cv-desde-cero` → `/cv-optimizer`, labels "Crear mi CV" → "Optimizar CV"
3. `frontend/src/pages/ProyectoLaboral.jsx` → revertir item `cv` del DOCS_LIST
4. `frontend/src/pages/MisCVs.jsx` → revertir 2 EmptyState (líneas 263, 349)

---

## Fase 1 — `CVHarvardPreview.jsx`

**Plan:** Nuevo componente presentacional en `frontend/src/components/cv/CVHarvardPreview.jsx`. Recibe `datos` (estado del wizard) y renderiza CV formato Harvard ATS-friendly (Times/Georgia, B/N, secciones limpias). Scrollable en contenedor tipo hoja A4, sin salir de la pantalla.

**Rollback:** `git revert <hash>` o `rm` del archivo. Cero impacto en código existente.

---

## Fase 2 — Paso 7 "Vista Previa" en wizard

**Plan:** Añadir `{ id: 'preview', label: 'Vista Previa', icon: '👁️' }` al array `PASOS` de `CVDesdeCero.jsx`. Cuando el paso activo es `preview`, renderizar `<CVHarvardPreview />` con botones "Volver a editar" / "Generar CV".

**Rollback:** `git revert <hash>` — el paso 7 desaparece y vuelve el flujo actual (generar directo desde paso 6).

---

## Fase 3 — Tab "Mi CV Inicial" en Autoconocimiento

**Plan:** Nuevo tab dentro de la sección Autoconocimiento (ProyectoLaboral.jsx) con UI de selección: "Subir mi CV" / "Empezar de cero". Path B reutiliza `/cv-desde-cero`. Path A queda con loader "próximamente" hasta Fase 4.

**Rollback:** `git revert <hash>` — el tab nuevo desaparece, los demás tabs intactos.

---

## Fase 3b — Reestructurar pilares

**Commit**: `25e8672`

**Qué cambia:**
- `PILARES` array: 6 pilares en nuevo orden con nuevos labels e ícono
  - `perfil` → "Mi Perfil" (20pts, indigo)
  - `autoconocimiento` → "Competencias" (20pts, violet)
  - `recursos` → "Gastos" (10pts, blue)
  - `semana` → "Horario semanal" (10pts, teal)
  - `oferta` → "Mi oferta de valor" (30pts, rose) — badge ★ Clave para tu CV
  - `documentos` → "Optimizador de CV" (10pts, amber)
- `progresoLaboral.js`: pesos rebalanceados; Oferta 5 ítems × 6pts = 30, Semana 10, Gastos 10, Optimizer 10pts si `data.optimizer.cv_generado === true`
- `calcularPorPilar()`: `documentos` = `data.optimizer.cv_generado ? 100 : 0`
- `PilarOptimizadorCV` component nuevo (reemplaza `PilarDocumentos`)
- Botón transversal "Mis Documentos": habilitado solo al 100% global, enlaza a `/mis-cvs`
- Subtítulos de pilar y hero legend actualizados

**Rollback:** `git revert 25e8672`

---

## Fase 3c — Sequential lock + Modal fix + CV de Mi Perfil

**Commit**: `c682ed8`

**Qué cambia:**
- **Sequential lock** en grid de pilares: `isLocked = pilarIndex > 0 && prevPct < 100 && pp === 0`
  - Pilares con `pp > 0` (ya iniciados) siguen accesibles aunque el anterior no esté al 100%
  - Tooltip dinámico: "Completa [pilar anterior] primero (X% completado)"
  - Ícono candado en cards bloqueadas
- **CV upload quitado de Mi Perfil**: sección envuelta en `{false && <div...>}` para preservar código de rollback
- **Modal pilar incompleto fix**: `handleSelectPilar` ahora guarda `pilarLabel` en el estado modal; el texto ya no está hardcodeado a "Mi oferta de valor"

**Rollback:** `git revert c682ed8` — o quitar `false &&` de la sección CV en Mi Perfil para restaurarla sin revertir el commit completo.

---

## Fase 4 — Path A integrado (mayor riesgo)

**Plan:** Upload → loading → extractProfile sobre PDF → cálculo puntaje inicial → optimización IA por sección (resumen + cada experiencia) → wizard CVDesdeCero pre-llenado con toggle "Ver original" en cada campo optimizado → preview → generar.

Requiere flag interno en `CVDesdeCero` para distinguir "modo upload" vs "modo desde cero" (mostrar/ocultar toggle "Ver original").

**Rollback:** `git revert <hash>` — Path A vuelve a estado "próximamente", el wizard pierde el flag y vuelve al comportamiento de Fase 3.

---

## Fase 5 — Versionado en MisCVs

**Plan:**
- Filtro de pestaña "CV Inicial" amplía: `c.tipo === 'original' || c.metadata?.es_cv_inicial === true`
- Badge visual "CV Inicial" (primer generate) vs "CV Modificada — [fecha]" (siguientes generates)
- Backend `cvGenerarController.js`: detectar si existe ya un CV Inicial del usuario para asignar correctamente `es_cv_inicial` o `es_cv_modificada` + `fecha_modificacion`

**Rollback:** `git revert <hash>` — los badges desaparecen, filtros vuelven a `tipo === 'original'` (los CVs con `es_cv_inicial` en metadata siguen en BD pero quedan en tab "CV Optimizado" hasta re-aplicar).

---

## Fase 6 — Puntaje visible

**Plan:** Mostrar puntaje calculado (lógica reusable del Optimizer actual):
- Path A: puntaje inicial tras extracción ("Tu CV está en X") y puntaje final en preview ("Tu CV optimizado: Y, +Δ pts")
- Path B: puntaje único en preview ("Tu CV Inicial: Y")
- Sin guardado en BD por ahora (solo display)

**Rollback:** `git revert <hash>` — desaparecen los puntajes, no afecta funcionalidad.

---

## Rollback total del refactor

Para revertir TODO el refactor en orden inverso:
```bash
git revert <hash_fase_6>
git revert <hash_fase_5>
git revert <hash_fase_4>
git revert <hash_fase_3>
git revert <hash_fase_2>
git revert <hash_fase_1>
git revert <hash_fase_0>
git push
```

O reset a un commit anterior al inicio del refactor (más drástico, perder commits intermedios).

---

## Reactivación futura del Optimizer

Para revivir la página Optimizer como producto visible:
1. `Sidebar.jsx`: descomentar línea del menú HERRAMIENTAS
2. Considerar feature flag `VITE_FEATURE_OPTIMIZER_LEGACY=true` para activación selectiva por tenant
3. La ruta, endpoint, datos históricos y código nunca se removieron — solo se restaura visibilidad UI

---

## Fase 4b — Fusión de Resumen (Path A)

**Commit**: `cc5686f` · **Fix**: `feat(cv-inicial): migrar fusionarResumen a DeepSeek V3`

**Qué cambia:**
- Paso de Resumen en Path A (upload) muestra 3 cajas:
  - **A. Resumen extraído del CV** (read-only, snapshot del PDF)
  - **B. Tu Oferta de Valor (Gerente)** (read-only, `jsp.oferta.oferta_valor`)
  - **C. Propuesta de Fusión con ELVIA®** (caja punteada en violeta con **visual diff highlighting** en verde esmeralda para identificar exactamente qué palabras estratégicas nuevas se agregaron antes de aplicar o descartar la fusión).
- Botón **✨ Fusionar con ELVIA®** llama a `POST /api/cv/fusionar-resumen`
- Modelo: DeepSeek V3 (migrado de Claude Sonnet 4.6 para estabilidad, velocidad y consistencia con la arquitectura del backend), temperature 0.2 (anti-alucinación máxima).
- maxLength 1000 chars; counter 3-colores: <800 slate, 800-899 amber, ≥900 rose
- Path B (desde cero) no cambia visualmente
- **Bug Fix**: Corrección de error 500 debido a que el controlador (`cvController.js`) importaba la función desde `deepseekService.js` pero esta había sido implementada originalmente en el servicio inactivo `claudeService.js` sin ser exportada. Se portó e implementó correctamente en `deepseekService.js` utilizando el cliente de DeepSeek V3.

**Rollback:** `git revert cc5686f` y revertir los commits subsecuentes de la fusión.

---

## Fase 4c — Contexto del Gerente en optimizaciones de IA (ambos paths)

**Commit**: `9ed5bac` · cleanup: `c0f7529`

**Qué cambia:**
- Nuevo estado `contextoGerente` en `CVDesdeCero.jsx` — se captura al cargar desde `jsp`:
  `{ oferta_valor, hard_skills, soft_skills, niveles_cargo, areas, industria }`
- Se inyecta como bloque CONTEXTO ESTRATÉGICO en el system prompt de DeepSeek cuando:
  - El usuario presiona "✨ Optimizar" en el resumen (`optimizarResumenIA`)
  - El usuario presiona "Mejorar con IA" en cada experiencia (`optimizarExpIA`)
- **Aplica a ambos paths** (upload Y desde cero) — la captura del contexto es independiente del modo
- Si el Gerente está vacío → `contextoGerente = null` → bloque NO se inyecta → retrocompatible
- Archivos modificados: `deepseekService.js`, `cvController.js`, `cvService.js`, `CVDesdeCero.jsx`

**Rollback:** `git revert 9ed5bac`

---

## Fase 4d — Desbloqueo de Plataforma al Guardar CV (Path A y B)

**Commit**: `feat(cv-inicial): autocompletar documentos y desbloquear todas las secciones`

**Qué cambia:**
- Al hacer clic en **"Confirmar y Finalizar"** en `CVDesdeCero.jsx`, se actualiza el perfil del usuario en Supabase inyectando `optimizer: { cv_generado: true }` dentro de `job_search_profile`.
- Esto hace que, tras la sincronización, el pilar **"Mis Documentos"** en Autoconocimiento figure al **100%**.
- Si el usuario completó la secuencia de autoconocimiento, esto eleva el progreso general al **100% (Estratega Completo)**.
- Activa de forma inmediata y dinámica `featuresDesbloqueadas = true` en toda la plataforma, desbloqueando el menú completo de navegación.

