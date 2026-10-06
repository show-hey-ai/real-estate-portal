import { ExternalLink, ShieldAlert } from 'lucide-react'
import { hazardMapUrl, type LatLng } from '@/lib/geocode'

const TOKYO_RISK_URL = 'https://www.funenka.metro.tokyo.lg.jp/area-hazard-level/regional-risk-level/'

const copy = {
  ja: { title: '災害リスクを確認する', intro: '購入前に、物件の場所の洪水・土砂災害・高潮・津波のリスクと、地震時の地域の危険度を公的な地図で確認できます。', hazard: '重ねるハザードマップ（国土地理院）', hazardNote: (located: boolean) => (located ? 'この物件の位置を中心に開きます' : '住所を入力して確認できます'), tokyo: '地震に関する地域危険度（東京都）', tokyoNote: '町丁目ごとの建物倒壊・火災の危険度', note: '外部の公的サイトが開きます。重要事項説明でも水害ハザードマップ上の位置が説明されます。' },
  en: { title: 'Check natural hazard risk', intro: 'Before buying, check flood, landslide, storm-surge and tsunami risk at the property, and the area\'s earthquake risk rank, on official maps.', hazard: 'Hazard Map Portal (GSI, Japanese government)', hazardNote: (located: boolean) => (located ? 'Opens centred on this property' : 'Search the address on the map'), tokyo: 'Earthquake risk by area (Tokyo Metropolitan Government)', tokyoNote: 'Building-collapse and fire risk ranks by district', note: 'Official sites open in a new tab (Japanese). The formal disclosure before the contract also shows the property on the flood hazard map.' },
  'zh-TW': { title: '確認災害風險', intro: '購買前，可在官方地圖上確認物件位置的洪水、土石災害、高潮與海嘯風險，以及地區的地震危險度。', hazard: '重疊災害地圖（國土地理院）', hazardNote: (located: boolean) => (located ? '以此物件位置為中心開啟' : '可在地圖上搜尋地址'), tokyo: '地震地區危險度（東京都）', tokyoNote: '各町丁目的建物倒塌與火災危險度', note: '將開啟外部官方網站（日文）。簽約前的重要事項說明也會說明物件在水災災害地圖上的位置。' },
  'zh-CN': { title: '确认灾害风险', intro: '购买前，可在官方地图上确认房源位置的洪水、山体滑坡、风暴潮与海啸风险，以及地区的地震危险度。', hazard: '叠加灾害地图（国土地理院）', hazardNote: (located: boolean) => (located ? '以此房源位置为中心打开' : '可在地图上搜索地址'), tokyo: '地震地区危险度（东京都）', tokyoNote: '各町丁目的建筑倒塌与火灾危险度', note: '将打开外部官方网站（日文）。签约前的重要事项说明也会说明房源在水灾灾害地图上的位置。' },
} as const

interface HazardLinksProps {
  locale: string
  point: LatLng | null
}

export function HazardLinks({ locale, point }: HazardLinksProps) {
  const text = copy[locale as keyof typeof copy] ?? copy.en
  const links = [
    { href: hazardMapUrl(point), label: text.hazard, note: text.hazardNote(point !== null) },
    { href: TOKYO_RISK_URL, label: text.tokyo, note: text.tokyoNote },
  ]
  return <section className="mt-6 rounded-xl border border-[#dbe2e9] bg-white p-4 md:p-6" aria-labelledby="hazard-links-title" data-testid="hazard-links">
    <h2 id="hazard-links-title" className="flex items-center gap-2 text-lg font-semibold"><ShieldAlert aria-hidden="true" className="h-5 w-5 text-primary" />{text.title}</h2>
    <p className="mt-2 text-sm leading-6 text-[#536274]">{text.intro}</p>
    <div className="mt-4 grid gap-3 md:grid-cols-2">
      {links.map((link) => <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-start justify-between gap-3 rounded-lg border border-[#dbe2e9] bg-[#f8fafc] p-4 transition hover:border-[#274d7d]/40 hover:bg-white">
        <span><span className="block text-sm font-semibold text-[#274d7d]">{link.label}</span><span className="mt-1 block text-xs text-[#536274]">{link.note}</span></span>
        <ExternalLink aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#274d7d]" />
      </a>)}
    </div>
    <p className="mt-3 text-xs leading-5 text-[#536274]">{text.note}</p>
  </section>
}
