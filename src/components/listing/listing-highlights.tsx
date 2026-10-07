import Link from 'next/link'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { CautionKey, HighlightKey, ListingHighlights } from '@/lib/listing-highlights'

/** Points to check that have a guide explaining them. */
const CAUTION_GUIDES: Partial<Record<CautionKey, string>> = {
  oldSeismic: 'japan-earthquake-standards-1981',
  checkSeismic: 'japan-earthquake-standards-1981',
  leasehold: 'leasehold-vs-freehold-tokyo',
}

type Labels<K extends string> = Record<K, string | ((minutes: number) => string)>

const copy: Record<string, { good: string; check: string; highlights: Labels<HighlightKey>; cautions: Labels<CautionKey> }> = {
  ja: {
    good: '物件のポイント', check: '確認したい点',
    highlights: { freehold: '所有権（土地も所有）', nearStation: (n) => `駅徒歩${n}分`, newSeismic: '新耐震基準', corner: '角部屋', topFloor: '最上階', renovated: 'リノベーション', renovationPlanned: 'リノベーション予定', pets: 'ペット可', autoLock: 'オートロック', deliveryBox: '宅配ボックス', sunny: '南向き系' },
    cautions: { noRebuild: '再建築不可', subleaseRequired: 'サブリース契約の承継が必要', oldSeismic: '旧耐震基準の可能性', checkSeismic: '耐震基準は要確認', noElevator: 'エレベーターなし', selfManaged: '自主管理', noAssociation: '管理組合未成立', noViewing: '内見不可', leasehold: '借地権', farFromStation: (n) => `駅徒歩${n}分` },
  },
  en: {
    good: 'Good points', check: 'Points to check',
    highlights: { freehold: 'Freehold (land included)', nearStation: (n) => `${n} min to station`, newSeismic: 'New earthquake standard', corner: 'Corner unit', topFloor: 'Top floor', renovated: 'Renovated', renovationPlanned: 'Renovation planned', pets: 'Pets allowed', autoLock: 'Auto-lock entrance', deliveryBox: 'Delivery lockers', sunny: 'South-facing' },
    cautions: { noRebuild: 'Cannot be rebuilt', subleaseRequired: 'Existing sublease must be taken over', oldSeismic: 'Likely pre-1981 earthquake standard', checkSeismic: 'Check the earthquake standard', noElevator: 'No elevator', selfManaged: 'Self-managed building', noAssociation: 'No owners association yet', noViewing: 'No viewing', leasehold: 'Leasehold', farFromStation: (n) => `${n} min walk to station` },
  },
  'zh-TW': {
    good: '物件優點', check: '需確認事項',
    highlights: { freehold: '所有權（永久產權）', nearStation: (n) => `步行${n}分鐘到站`, newSeismic: '新耐震基準', corner: '邊間', topFloor: '頂樓', renovated: '已翻新', renovationPlanned: '預定翻新', pets: '可養寵物', autoLock: '自動門禁', deliveryBox: '宅配箱', sunny: '朝南' },
    cautions: { noRebuild: '不可重建', subleaseRequired: '需承接包租契約', oldSeismic: '可能為舊耐震基準', checkSeismic: '需確認耐震基準', noElevator: '無電梯', selfManaged: '自主管理', noAssociation: '尚未成立管理組合', noViewing: '不可看房', leasehold: '借地權', farFromStation: (n) => `距車站步行${n}分鐘` },
  },
  'zh-CN': {
    good: '房源优点', check: '需确认事项',
    highlights: { freehold: '永久产权（土地所有权）', nearStation: (n) => `步行${n}分钟到站`, newSeismic: '新耐震标准', corner: '边户', topFloor: '顶层', renovated: '已翻新', renovationPlanned: '计划翻新', pets: '可养宠物', autoLock: '自动门禁', deliveryBox: '快递柜', sunny: '朝南' },
    cautions: { noRebuild: '不可重建', subleaseRequired: '需承接包租合同', oldSeismic: '可能为旧耐震标准', checkSeismic: '需确认耐震标准', noElevator: '无电梯', selfManaged: '自主管理', noAssociation: '尚未成立管理组合', noViewing: '不可看房', leasehold: '借地权', farFromStation: (n) => `距车站步行${n}分钟` },
  },
}

interface ListingHighlightChipsProps {
  locale: string
  result: ListingHighlights
}

function label<K extends string>(labels: Labels<K>, key: K, minutes: number | null): string {
  const value = labels[key]
  return typeof value === 'function' ? value(minutes ?? 0) : value
}

/** Green good points and amber points to check, shown under the price. */
export function ListingHighlightChips({ locale, result }: ListingHighlightChipsProps) {
  const text = copy[locale] ?? copy.en
  if (!result.highlights.length && !result.cautions.length) return null
  return <div className="mb-4 space-y-2" data-testid="listing-highlights">
    {result.highlights.length > 0 && <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-xs font-semibold text-[#3f5f39]">{text.good}</span>
      {result.highlights.map((key) => <span key={key} className="inline-flex items-center gap-1 rounded-md bg-[#edf3e7] px-2 py-1 text-xs font-semibold text-[#3f5f39]"><CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />{label(text.highlights, key, result.walkMinutes)}</span>)}
    </div>}
    {result.cautions.length > 0 && <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-xs font-semibold text-[#8a4b00]">{text.check}</span>
      {result.cautions.map((key) => {
        const chip = <><AlertTriangle aria-hidden="true" className="h-3.5 w-3.5" />{label(text.cautions, key, result.walkMinutes)}</>
        const className = 'inline-flex items-center gap-1 rounded-md bg-[#fff4e5] px-2 py-1 text-xs font-semibold text-[#8a4b00]'
        const guide = CAUTION_GUIDES[key]
        return guide ? <Link key={key} href={`/guides/${guide}`} className={`${className} underline-offset-2 hover:underline`}>{chip}</Link> : <span key={key} className={className}>{chip}</span>
      })}
    </div>}
  </div>
}
