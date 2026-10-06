import Link from 'next/link'
import { ArrowRight, Building2, House, Landmark, Map, MapPin, TrendingUp } from 'lucide-react'
import { getMarketplaceCopy } from '@/lib/marketplace-copy'
import { getPortalHomeCopy, getPortalPropertyTypes } from '@/lib/portal-copy'
import { translateCityName } from '@/lib/translate-fields'

const purposeIcons = { investment: TrendingUp, residential: House, land: Map }
const tones = ['bg-[#e8f1fb] text-[#274d7d]', 'bg-[#fcece8] text-[#aa5746]', 'bg-[#edf3e7] text-[#557447]']

export function MarketShortcuts({ locale, wards }: { locale: string; wards: readonly string[] }) {
  const copy = getMarketplaceCopy(locale)
  const home = getPortalHomeCopy(locale)
  const types = getPortalPropertyTypes(locale)
  const shortcuts = [
    ...home.categories.map(([value, label], index) => ({
      href: `/listings?category=${value}`, label, Icon: purposeIcons[value], tone: tones[index],
    })),
    ...(['区分マンション', '戸建', '一棟マンション'] as const).map((value, index) => ({
      href: `/listings?${new URLSearchParams({ type: value })}`,
      label: types.find((type) => type.value === value)!.label,
      Icon: index === 1 ? House : index === 2 ? Landmark : Building2,
      tone: tones[index],
    })),
  ]
  const priorityWards = ['港区', '新宿区', '渋谷区', '中央区', '世田谷区', '品川区']
  const areas = [...priorityWards.filter((ward) => wards.includes(ward)), ...wards.filter((ward) => !priorityWards.includes(ward))].slice(0, 6)
  return <div className="space-y-9" data-testid="market-shortcuts">
    <section aria-labelledby="purpose-shortcuts-title">
      <div className="flex items-center justify-between gap-4">
        <h2 id="purpose-shortcuts-title" className="text-lg font-semibold md:text-xl">{home.categoryTitle}</h2>
        <Link href="/listings" className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-[#274d7d]">{copy.all}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-6 sm:gap-x-5">
        {shortcuts.map(({ href, label, Icon, tone }) => <Link key={href} href={href} prefetch={false} className="group flex flex-col items-center gap-3 text-center text-sm font-medium">
          <span className={`flex h-20 w-20 items-center justify-center rounded-full transition-transform group-hover:-translate-y-1 md:h-24 md:w-24 ${tone}`}><Icon aria-hidden="true" strokeWidth={1.5} className="h-9 w-9 md:h-11 md:w-11" /></span>
          <span className="max-w-[150px] leading-5">{label}</span>
        </Link>)}
      </div>
    </section>
    {areas.length > 0 && <section aria-labelledby="area-shortcuts-title">
      <div className="flex items-center justify-between gap-4"><h2 id="area-shortcuts-title" className="text-lg font-semibold md:text-xl">{copy.areaTitle}</h2><Link href="/listings" className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-[#274d7d]">{copy.all}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></div>
      <div className="mt-3 flex flex-wrap gap-2 md:gap-3">
        {areas.map((ward) => <Link key={ward} href={`/listings?${new URLSearchParams({ ward })}`} prefetch={false} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#dbe2e9] bg-white px-4 text-sm transition-colors hover:border-[#274d7d] hover:bg-[#f1f6fb]"><MapPin aria-hidden="true" className="h-4 w-4 text-[#57769b]" />{translateCityName(ward, locale) || ward}</Link>)}
      </div>
    </section>}
  </div>
}
