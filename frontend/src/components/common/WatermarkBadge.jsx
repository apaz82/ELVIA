// Badge informativo que aparece junto a botones de descarga en plan gratuito
import { Stamp } from '@phosphor-icons/react'

export default function WatermarkBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full font-medium">
      <Stamp size={12} weight="fill" />
      Incluye marca de agua
    </span>
  )
}
