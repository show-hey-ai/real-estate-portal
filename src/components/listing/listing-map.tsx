import { ExternalLink, MapPin } from 'lucide-react'

const copy = {
  ja: { title: '周辺地図', open: 'Google マップで開く', note: '地図は公開住所の位置です。建物の正確な位置は現地や資料でご確認ください。' },
  en: { title: 'Location map', open: 'Open in Google Maps', note: 'The map shows the published address. Confirm the exact building position on site or in the documents.' },
  'zh-TW': { title: '周邊地圖', open: '在 Google 地圖開啟', note: '地圖顯示公開地址的位置，建物的確切位置請以現場或資料確認。' },
  'zh-CN': { title: '周边地图', open: '在 Google 地图打开', note: '地图显示公开地址的位置，建筑的确切位置请以现场或资料确认。' },
} as const

const MAP_LANGUAGE: Record<string, string> = { ja: 'ja', en: 'en', 'zh-TW': 'zh-TW', 'zh-CN': 'zh-CN' }

interface ListingMapProps {
  locale: string
  /** Only the approved public address; private addresses must never be passed here. */
  publicAddress: string
}

export function ListingMap({ locale, publicAddress }: ListingMapProps) {
  const text = copy[locale as keyof typeof copy] ?? copy.en
  const query = encodeURIComponent(publicAddress.startsWith('東京都') ? publicAddress : `東京都${publicAddress}`)
  const embed = `https://maps.google.com/maps?q=${query}&z=15&hl=${MAP_LANGUAGE[locale] ?? 'en'}&output=embed`
  return <section className="mt-6 overflow-hidden rounded-xl border border-[#dbe2e9] bg-white" aria-labelledby="listing-map-title" data-testid="listing-map">
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4">
      <h2 id="listing-map-title" className="flex items-center gap-2 text-lg font-semibold"><MapPin aria-hidden="true" className="h-5 w-5 text-primary" />{text.title}</h2>
      <a href={`https://www.google.com/maps/search/?api=1&query=${query}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-[#274d7d] hover:underline">{text.open}<ExternalLink aria-hidden="true" className="h-3.5 w-3.5" /></a>
    </div>
    <iframe title={text.title} src={embed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="mt-3 h-72 w-full border-0 md:h-80" />
    <p className="px-4 py-3 text-xs leading-5 text-muted-foreground">{text.note}</p>
  </section>
}
