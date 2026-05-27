# Refactor CV Inicial — Bitácora de fases y rollback

> Inicio: 2026-05-26
> Branch: `main`
> Objetivo: Unificar la creación de CV bajo el concepto **CV Inicial** en un único tab dentro de Autoconocimiento, con dos puntos de entrada (upload + desde cero) que convergen en data estructurada, vista previa Harvard y versionado por fecha.

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
| 3b | Reestructurar pilares: renombrar (Competencias/Gastos/Optimizador de CV), nuevos weights, PilarOptimizadorCV, botón Mis Documentos gated al 100% | 🔄 En curso | — |
| 4 | Path A: upload → extractProfile → optimización por sección → wizard pre-llenado | ⏸️ Pendiente | — |
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
