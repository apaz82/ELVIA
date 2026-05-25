// useSectorLabels — hook que devuelve el copy del sector del tenant actual.
// Uso:
//   const L = useSectorLabels()
//   <h1>{L.adminPanelTitle}</h1>          // "Panel HR" | "Panel de Empleabilidad" | ...
//   <button>{L.inviteMember}</button>     // "Invitar colaborador" | "Invitar estudiante" | ...

import { useTenant } from '../context/TenantContext'
import { getSectorLabels } from '../constants/sectorLabels'

export function useSectorLabels() {
  const { tenant } = useTenant()
  return getSectorLabels(tenant?.sector || 'corporate')
}
