import type { HospitalityCategory } from '@/lib/hospitality-copy'

export const HOSPITALITY_USE_TYPES = [
  '民泊',
  '簡易宿所',
  'ホテル',
  '旅館',
  '社宅・マンスリー',
  '開発用地',
  '要調査',
] as const

export type HospitalityUseType = (typeof HOSPITALITY_USE_TYPES)[number]

export interface HospitalityAssessment {
  potential_score: number | null
  recommended_use: HospitalityUseType | null
  conversion_reason: string | null
  primary_risks: string[]
  buyer_persona: string | null
}

interface StationLike {
  walk_minutes?: number | null
}

interface HospitalityCandidateInput {
  propertyType: string | null
  zoning?: string | null
  currentStatus?: string | null
  descriptionJa?: string | null
  features?: string[] | null
  warnings?: string[] | null
  evidence?: { raw_text?: string | null }[] | null
  buildingArea?: number | null
  landArea?: number | null
  floorCount?: number | null
  builtYear?: number | null
  structure?: string | null
  stations?: StationLike[] | null
  assessment?: Partial<HospitalityAssessment> | null
}

export interface PreparedHospitalityCandidate {
  category: HospitalityCategory
  assessment: HospitalityAssessment
  features: string[]
  warnings: string[]
  adminNotes: string
}

function isGeneratedHospitalityLine(item: string): boolean {
  return /^(宿泊転用理由|想定用途|想定買主):/u.test(item)
    || /^(用途地域で旅館業・住宅宿泊事業|検査済証、用途変更、消防設備|検査済証、確認済証、図面|保健所・消防の事前相談|建築可能規模、接道|旧耐震の可能性|木造3階建て|接道、道路種別|戸建転用は検査済証)/u.test(item)
}

function toSourceText(input: HospitalityCandidateInput): string {
  return [
    input.propertyType,
    input.zoning,
    input.currentStatus,
    input.structure,
    input.descriptionJa,
    ...(input.features || []).filter((item) => !isGeneratedHospitalityLine(item)),
    ...(input.warnings || []).filter((item) => !isGeneratedHospitalityLine(item)),
    ...(input.evidence || []).map((item) => item.raw_text || ''),
  ]
    .filter(Boolean)
    .join(' ')
}

function uniq(items: string[]): string[] {
  const seen = new Set<string>()

  return items
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => {
      const key = item.replace(/\s+/g, '')
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

function clampScore(score: number | null | undefined): number {
  if (typeof score !== 'number' || Number.isNaN(score)) return 3
  return Math.min(5, Math.max(1, Math.round(score)))
}

function hasCleanBuildingHistorySignal(text: string): boolean {
  return /(検査済証|確認済証|確認申請図面|竣工図|消防設備.*書類|図面.*現況.*一致|現況.*図面.*一致)/u.test(text)
}

function hasHospitalityAdjacentUseSignal(text: string): boolean {
  return /(元寮|社員寮|寄宿舎|共同住宅|シェアハウス|簡易宿泊所|簡易宿所|下宿)/u.test(text)
}

function hasWeakRoadSignal(text: string): boolean {
  return /(再建築不可|接道.*(不足|なし|弱い|不明|2m未満)|43条|但し書き|ただし書き|私道.*(権利|不明)|セットバック未了|道路種別.*不明)/u.test(text)
}

function isPre1981(input: HospitalityCandidateInput): boolean {
  return typeof input.builtYear === 'number' && input.builtYear <= 1981
}

function isThreeStoryWooden(input: HospitalityCandidateInput): boolean {
  return (input.structure || '').includes('木造') && typeof input.floorCount === 'number' && input.floorCount >= 3
}

export function classifyHospitalityCategory(input: HospitalityCandidateInput): HospitalityCategory {
  const text = toSourceText(input)

  if (/(営業中|運営中|稼働中).*(ホテル|旅館|簡易宿所|民泊)|((ホテル|旅館|簡易宿所).*(営業中|運営中|稼働中))/u.test(text)) {
    return 'EXISTING_HOTEL'
  }

  if (/(旅館業|簡易宿所|住宅宿泊事業|民泊).*(許可|届出|営業権|運営可|用途)|((許可|届出|営業権).*(旅館業|簡易宿所|住宅宿泊事業|民泊))/u.test(text)) {
    return 'LICENSED_PROPERTY'
  }

  if (input.propertyType === '土地') {
    return 'NEW_BUILD_LAND'
  }

  if (/(空室|空家|空き家|要改装|要リフォーム|リノベ|改修|築古|スケルトン)/u.test(text)) {
    return 'RENOVATION_TARGET'
  }

  return 'CONVERSION_CANDIDATE'
}

function inferRecommendedUse(input: HospitalityCandidateInput, category: HospitalityCategory): HospitalityUseType {
  const text = toSourceText(input)

  if (/旅館/u.test(text)) return '旅館'
  if (/ホテル/u.test(text)) return 'ホテル'
  if (/簡易宿所/u.test(text)) return '簡易宿所'
  if (/民泊|住宅宿泊事業/u.test(text)) return '民泊'
  if (category === 'NEW_BUILD_LAND') return '開発用地'
  if (hasHospitalityAdjacentUseSignal(text)) return '簡易宿所'

  switch (input.propertyType) {
    case '一棟ビル':
      return input.buildingArea && input.buildingArea >= 300 ? 'ホテル' : '簡易宿所'
    case '一棟マンション':
    case '店舗・事務所':
      return '簡易宿所'
    case '一棟アパート':
    case '戸建':
      return '民泊'
    case '土地':
      return '開発用地'
    default:
      return '要調査'
  }
}

function inferPotentialScore(input: HospitalityCandidateInput, category: HospitalityCategory): number {
  const text = toSourceText(input)
  let score = category === 'EXISTING_HOTEL' || category === 'LICENSED_PROPERTY' ? 4 : 2

  if (['一棟マンション', '一棟アパート', '一棟ビル', '土地'].includes(input.propertyType || '')) {
    score += 1
  }

  if (input.propertyType === '戸建') {
    score += hasCleanBuildingHistorySignal(text) ? 1 : -1
  }

  if (hasHospitalityAdjacentUseSignal(text)) {
    score += 1
  }

  if (hasCleanBuildingHistorySignal(text)) {
    score += 1
  }

  if (/(商業地域|近隣商業|準住居|第一種住居|第二種住居|準工業)/u.test(input.zoning || '')) {
    score += 1
  }

  if (/(第一種低層|第二種低層|第一種中高層|第二種中高層|田園住居|工業専用|工業地域)/u.test(input.zoning || '')) {
    score -= 2
  }

  if ((input.stations || []).some((station) => typeof station.walk_minutes === 'number' && station.walk_minutes <= 8)) {
    score += 1
  }

  if ((input.buildingArea && input.buildingArea >= 100) || (input.landArea && input.landArea >= 60)) {
    score += 1
  }

  if (/(居住中|賃貸中|オーナーチェンジ|満室)/u.test(input.currentStatus || text)) {
    score -= 1
  }

  if (isPre1981(input)) {
    score -= 2
  }

  if (isThreeStoryWooden(input)) {
    score -= 2
  }

  if (hasWeakRoadSignal(text)) {
    score -= 2
  }

  return clampScore(score)
}

function inferConversionReason(input: HospitalityCandidateInput, recommendedUse: HospitalityUseType): string {
  switch (input.propertyType) {
    case '一棟ビル':
      return `一棟で建物全体の用途・動線・客室構成を検討でき、${recommendedUse}への転用余地を見やすい。`
    case '一棟マンション':
      return `共同住宅全体を取得する前提のため、区分よりも宿泊用途の設計・管理方針を統一しやすい。`
    case '一棟アパート':
      return `小規模な一棟運用として、民泊・簡易宿所の収支検討に乗せやすい。`
    case '戸建':
      return `独立した小規模物件として、民泊や一棟貸し宿泊の候補になりやすい。`
    case '土地':
      return `既存建物の制約を受けず、宿泊用途を前提に設計・許認可ルートを組み立てられる。`
    case '店舗・事務所':
      return `住宅以外の用途から宿泊用途への転用候補として、立地と用途地域次第で検討余地がある。`
    default:
      return `宿泊事業化の可否を、用途地域・建築・消防・保健所の購入前診断で確認する候補。`
  }
}

function inferBuyerPersona(input: HospitalityCandidateInput, recommendedUse: HospitalityUseType): string {
  switch (recommendedUse) {
    case 'ホテル':
    case '旅館':
      return 'ホテル・旅館運営会社、インバウンド宿泊事業者、宿泊業へ参入したい海外投資家'
    case '簡易宿所':
      return '簡易宿所運営者、小規模ホテル事業者、一棟収益から宿泊転用を狙う海外投資家'
    case '民泊':
      return '民泊運営会社、小規模宿泊運営者、自己利用兼投資を考える海外投資家'
    case '開発用地':
      return 'ホテル開発事業者、簡易宿所開発を狙う投資家、土地から事業を組める事業者'
    default:
      return input.propertyType
        ? `${input.propertyType}を宿泊事業として検討できる投資家`
        : '宿泊事業向け不動産を探す投資家'
  }
}

function inferPrimaryRisks(input: HospitalityCandidateInput): string[] {
  const text = toSourceText(input)
  const risks = [
    '用途地域で旅館業・住宅宿泊事業の可否を購入前に確認する必要があります。',
    '検査済証、確認済証、図面、現況一致、用途変更、消防設備、避難経路を確認する必要があります。',
    '保健所・消防の事前相談で、想定する宿泊用途の成立性を確認する必要があります。',
  ]

  if (/(居住中|賃貸中|オーナーチェンジ|満室)/u.test(`${input.currentStatus || ''} ${text}`)) {
    risks.push('既存賃貸借、明渡し時期、宿泊用途への切替タイミングを確認する必要があります。')
  }

  if (isPre1981(input)) {
    risks.push('旧耐震の可能性があるため、耐震・構造の説明リスクを確認する必要があります。')
  }

  if (isThreeStoryWooden(input)) {
    risks.push('木造3階建ては竪穴区画、階段、避難、消防設備の論点が重くなります。')
  }

  if (hasWeakRoadSignal(text)) {
    risks.push('接道、道路種別、私道権利、再建築可否を購入前に確認する必要があります。')
  }

  if (input.propertyType === '戸建' && !hasCleanBuildingHistorySignal(text)) {
    risks.push('戸建転用は検査済証・確認図面・増改築履歴が弱いと用途変更で詰まりやすいです。')
  }

  if (input.propertyType === '土地') {
    risks.push('建築可能規模、接道、容積消化、旅館業用途での設計成立性を確認する必要があります。')
  }

  return risks
}

export function prepareHospitalityCandidate(input: HospitalityCandidateInput): PreparedHospitalityCandidate {
  const category = classifyHospitalityCategory(input)
  const recommendedUse = input.assessment?.recommended_use || inferRecommendedUse(input, category)
  const assessment: HospitalityAssessment = {
    potential_score: clampScore(input.assessment?.potential_score ?? inferPotentialScore(input, category)),
    recommended_use: recommendedUse,
    conversion_reason:
      input.assessment?.conversion_reason?.trim() || inferConversionReason(input, recommendedUse),
    primary_risks: uniq([
      ...(input.assessment?.primary_risks || []),
      ...inferPrimaryRisks(input),
    ]).slice(0, 5),
    buyer_persona:
      input.assessment?.buyer_persona?.trim() || inferBuyerPersona(input, recommendedUse),
  }

  const features = uniq([
    `宿泊転用理由: ${assessment.conversion_reason}`,
    `想定用途: ${assessment.recommended_use}`,
    `想定買主: ${assessment.buyer_persona}`,
    ...(input.features || []),
  ]).slice(0, 10)

  const warnings = uniq([...(input.warnings || []), ...assessment.primary_risks]).slice(0, 8)

  const adminNotes = [
    '【宿泊転用候補メモ】',
    `スコア: ${assessment.potential_score}/5`,
    `想定用途: ${assessment.recommended_use}`,
    `候補理由: ${assessment.conversion_reason}`,
    `想定買主: ${assessment.buyer_persona}`,
    '購入前論点:',
    ...assessment.primary_risks.map((risk) => `- ${risk}`),
  ].join('\n')

  return {
    category,
    assessment,
    features,
    warnings,
    adminNotes,
  }
}
