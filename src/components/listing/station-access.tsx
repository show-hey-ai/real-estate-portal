import { Footprints, Train } from 'lucide-react'

export interface StationAccessItem {
  label: string
  walkMinutes: number | null
}

const MAX_SCALE_MINUTES = 20

function tone(minutes: number) {
  if (minutes <= 5) return 'bg-[#2f7d57]'
  if (minutes <= 10) return 'bg-[#274d7d]'
  return 'bg-[#c98a2b]'
}

const unit: Record<string, (minutes: number) => string> = {
  ja: (minutes) => `徒歩${minutes}分`,
  en: (minutes) => `${minutes} min walk`,
  'zh-TW': (minutes) => `步行${minutes}分鐘`,
  'zh-CN': (minutes) => `步行${minutes}分钟`,
}

interface StationAccessProps {
  locale: string
  stations: StationAccessItem[]
}

/** Nearest stations with a bar for walking time (green ≤5 min, blue ≤10, amber beyond). */
export function StationAccess({ locale, stations }: StationAccessProps) {
  const walk = unit[locale] ?? unit.en
  return <ul className="mt-2 w-full max-w-sm space-y-2 sm:w-80" data-testid="station-access">
    {stations.map((station, index) => <li key={index} className="text-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-1.5 text-[#1b293a]"><Train aria-hidden="true" className="h-4 w-4 shrink-0 text-[#274d7d]" /><span className="truncate">{station.label}</span></span>
        {station.walkMinutes !== null && <span className="flex shrink-0 items-center gap-1 font-semibold tabular-nums text-[#1b293a]"><Footprints aria-hidden="true" className="h-3.5 w-3.5 text-[#536274]" />{walk(station.walkMinutes)}</span>}
      </div>
      {station.walkMinutes !== null && <div className="ml-5.5 mt-1 h-1.5 overflow-hidden rounded-full bg-[#e6edf4]" aria-hidden="true"><div className={`h-full rounded-full ${tone(station.walkMinutes)}`} style={{ width: `${Math.min(100, Math.max(6, (station.walkMinutes / MAX_SCALE_MINUTES) * 100))}%` }} /></div>}
    </li>)}
  </ul>
}
