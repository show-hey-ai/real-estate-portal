import { defaultLocale, locales, type Locale } from '@/i18n/config'

type LocalizedCopy<T> = Record<Locale, T>

function normalizeLocale(locale: string | null | undefined): Locale {
  if (locale && locales.includes(locale as Locale)) {
    return locale as Locale
  }

  return defaultLocale
}

export const HOSPITALITY_CATEGORY_VALUES = [
  'EXISTING_HOTEL',
  'LICENSED_PROPERTY',
  'RENOVATION_TARGET',
  'NEW_BUILD_LAND',
  'CONVERSION_CANDIDATE',
] as const

export type HospitalityCategory = (typeof HOSPITALITY_CATEGORY_VALUES)[number]

const hospitalityCategoryOptions: LocalizedCopy<{ value: HospitalityCategory; label: string; desc: string }[]> = {
  ja: [
    { value: 'EXISTING_HOTEL', label: '既存ホテル・旅館買収', desc: '営業中・許可・設備が完備' },
    { value: 'LICENSED_PROPERTY', label: '既存営業権付き', desc: '旅館業/簡易宿所/民泊許可を承継' },
    { value: 'RENOVATION_TARGET', label: 'リフォーム再生対象', desc: '宿泊施設前提の改修・リブランディング' },
    { value: 'NEW_BUILD_LAND', label: '新築前提宿泊用地', desc: '土地から旅館業/簡易宿所を設計' },
    { value: 'CONVERSION_CANDIDATE', label: '転用候補（要審査）', desc: '用途地域・検査済証等を購入前確認' },
  ],
  en: [
    { value: 'EXISTING_HOTEL', label: 'Existing hotel / ryokan acquisition', desc: 'Operating, licensed, equipment in place' },
    { value: 'LICENSED_PROPERTY', label: 'Licensed property (license transfer)', desc: 'Hotel / simple lodging / minpaku license inheritance' },
    { value: 'RENOVATION_TARGET', label: 'Renovation candidate', desc: 'Lodging-ready building for refurb & rebrand' },
    { value: 'NEW_BUILD_LAND', label: 'New-build hospitality land', desc: 'Land-up design for hotel or simple lodging' },
    { value: 'CONVERSION_CANDIDATE', label: 'Conversion candidate (review required)', desc: 'Zoning, inspection cert, fire code verified pre-purchase' },
  ],
  'zh-TW': [
    { value: 'EXISTING_HOTEL', label: '既有飯店・旅館收購', desc: '營運中、持有許可、設備完備' },
    { value: 'LICENSED_PROPERTY', label: '附既有營業權物件', desc: '旅館業／簡易宿所／民宿許可承接' },
    { value: 'RENOVATION_TARGET', label: '改裝再生候選', desc: '住宿前提的整修與品牌再造' },
    { value: 'NEW_BUILD_LAND', label: '新建前提住宿用地', desc: '從土地設計旅館或簡易宿所' },
    { value: 'CONVERSION_CANDIDATE', label: '轉用候選（需審查）', desc: '用途地域、檢查濟證、消防購買前確認' },
  ],
  'zh-CN': [
    { value: 'EXISTING_HOTEL', label: '既有酒店・旅馆收购', desc: '营业中、持有许可、设备完备' },
    { value: 'LICENSED_PROPERTY', label: '附既有营业权物件', desc: '旅馆业／简易住宿／民宿许可承接' },
    { value: 'RENOVATION_TARGET', label: '改造再生候选', desc: '住宿前提的翻新与品牌再造' },
    { value: 'NEW_BUILD_LAND', label: '新建前提住宿用地', desc: '从土地设计酒店或简易住宿' },
    { value: 'CONVERSION_CANDIDATE', label: '转用候选（需审查）', desc: '用途地域、检查济证、消防购买前确认' },
  ],
}

const propertyTypeOptions: LocalizedCopy<{ value: string; label: string }[]> = {
  ja: [
    { value: '一棟マンション', label: '一棟マンション・簡易宿所候補' },
    { value: '一棟アパート', label: '一棟アパート・民泊候補' },
    { value: '一棟ビル', label: '一棟ビル・ホテル転用候補' },
    { value: '戸建', label: '戸建・小規模宿泊候補' },
    { value: '店舗・事務所', label: '店舗/事務所・転用候補' },
    { value: '土地', label: 'ホテル開発用地' },
    { value: '区分マンション', label: '区分・運用検討' },
  ],
  en: [
    { value: '一棟マンション', label: 'Whole apartment building / lodging conversion' },
    { value: '一棟アパート', label: 'Apartment building / minpaku candidate' },
    { value: '一棟ビル', label: 'Whole building / hotel conversion' },
    { value: '戸建', label: 'House / small lodging candidate' },
    { value: '店舗・事務所', label: 'Commercial / conversion candidate' },
    { value: '土地', label: 'Hotel development land' },
    { value: '区分マンション', label: 'Unit / operation review' },
  ],
  'zh-TW': [
    { value: '一棟マンション', label: '整棟大樓 / 簡易宿所候選' },
    { value: '一棟アパート', label: '整棟公寓 / 民宿候選' },
    { value: '一棟ビル', label: '整棟商業樓 / 飯店轉用候選' },
    { value: '戸建', label: '獨棟 / 小型住宿候選' },
    { value: '店舗・事務所', label: '店鋪辦公 / 轉用候選' },
    { value: '土地', label: '飯店開發用地' },
    { value: '区分マンション', label: '區分物件 / 營運檢討' },
  ],
  'zh-CN': [
    { value: '一棟マンション', label: '整栋大楼 / 简易住宿候选' },
    { value: '一棟アパート', label: '整栋公寓 / 民宿候选' },
    { value: '一棟ビル', label: '整栋商业楼 / 酒店转用候选' },
    { value: '戸建', label: '独栋 / 小型住宿候选' },
    { value: '店舗・事務所', label: '店铺办公 / 转用候选' },
    { value: '土地', label: '酒店开发用地' },
    { value: '区分マンション', label: '区分物件 / 运营评估' },
  ],
}

const homeCopy = {
  ja: {
    heroTitle: '日本の宿泊業物件を、取得判断から開業まで',
    heroDescription:
      'Ziyou Hospitalityは、外国人投資家のホテル・旅館・民泊対応物件取得に特化した東京の宅建業者です。物件探しだけでなく、用途地域・消防・建築・保健所の購入前診断、売買仲介、許認可準備、開業PMまで一気通貫で支援します。',
    primaryCta: '宿泊業物件を探す',
    secondaryCta: '購入前診断を相談',
    searchTitle: '宿泊事業として買える物件を探す',
    searchDescription: 'エリア、駅、価格、建物規模から候補を絞り込みます。',
    proof: [
      { value: 'Hotel / Ryokan / Minpaku', label: '宿泊用途に特化' },
      { value: 'Zoning / Fire / Hokenjo', label: '購入前に論点を確認' },
      { value: 'EN / JA / 中文', label: '外国人投資家対応' },
    ],
    assetTitle: '掲載対象は、宿泊事業に転用・運営できる可能性がある物件です',
    assetDescription:
      'ホテル・旅館の既存運営物件だけでなく、民泊対応の一棟物件、簡易宿所への転用候補、観光地の開発用地まで、取得前に実務リスクを見ます。',
    assetPaths: [
      { title: 'ホテル・旅館', desc: '営業中資産、改装前提、オペレーター引継ぎ' },
      { title: '民泊対応一棟', desc: '戸建、一棟アパート、駅近の小規模運用候補' },
      { title: '転用候補', desc: '店舗・事務所・住宅から宿泊用途への転用検討' },
      { title: '開発用地', desc: 'ホテル、簡易宿所、観光地向け小規模開発' },
    ],
    reviewTitle: '物件を見る基準を、宿泊業の許認可基準に変える',
    reviewDescription:
      '利回りや駅距離だけでは判断しません。買ったあとに宿泊営業ができるかを、購入前に分解して確認します。',
    checks: [
      { title: '用途地域', desc: '旅館業・民泊が成立する地域か' },
      { title: '消防', desc: '設備・避難・改修コストの初期確認' },
      { title: '建築', desc: '用途変更、階段、避難、構造の論点' },
      { title: '保健所', desc: '旅館業・簡易宿所・住宅宿泊事業の見通し' },
    ],
    processTitle: '購入前の確認から開業準備まで支援します',
    process: [
      { step: '01', title: '物件候補を探す', desc: 'エリア、規模、予算、宿泊用途で候補を整理' },
      { step: '02', title: '購入前に確認する', desc: '許認可・消防・建築の主要リスクを確認' },
      { step: '03', title: '購入を進める', desc: '売買条件、DD、契約、決済まで仲介' },
      { step: '04', title: '開業を準備する', desc: '行政書士・建築士・施工・運営体制を調整' },
    ],
  },
  en: {
    heroTitle: 'Japan hospitality property, from acquisition decision to opening day',
    heroDescription:
      'Ziyou Hospitality is a Tokyo-licensed brokerage focused on hotels, ryokan, and minpaku-ready buildings for foreign investors. We support sourcing, pre-purchase feasibility, brokerage, licensing preparation, and opening PM in one engagement.',
    primaryCta: 'Browse hospitality assets',
    secondaryCta: 'Request pre-purchase review',
    searchTitle: 'Search assets that can become lodging businesses',
    searchDescription: 'Filter candidates by location, station access, budget, and building scale.',
    proof: [
      { value: 'Hotel / Ryokan / Minpaku', label: 'Hospitality-only focus' },
      { value: 'Zoning / Fire / Hokenjo', label: 'Feasibility before purchase' },
      { value: 'EN / JA / 中文', label: 'Foreign investor desk' },
    ],
    assetTitle: 'Every listing is framed around hospitality acquisition potential',
    assetDescription:
      'We look beyond ordinary income property. Operating hotels, minpaku-ready buildings, conversion candidates, and tourism land are reviewed through licensing, fire, building, and operator realities.',
    assetPaths: [
      { title: 'Hotels & ryokan', desc: 'Operating assets, renovation plays, operator handover' },
      { title: 'Minpaku-ready buildings', desc: 'Houses, small buildings, station-side lodging candidates' },
      { title: 'Conversion candidates', desc: 'Commercial, office, or residential assets with lodging potential' },
      { title: 'Development land', desc: 'Hotel, simple lodging, and destination development sites' },
    ],
    reviewTitle: 'A property portal built around licensing reality',
    reviewDescription:
      'Yield and station distance are not enough. Before purchase, we break down whether the building can actually operate as lodging.',
    checks: [
      { title: 'Zoning', desc: 'Whether lodging use is possible in the district' },
      { title: 'Fire code', desc: 'Equipment, egress, and retrofit cost signals' },
      { title: 'Building code', desc: 'Use change, stairs, exits, and structure issues' },
      { title: 'Hokenjo', desc: 'Hotel, simple lodging, or minpaku license path' },
    ],
    processTitle: 'Support from pre-purchase review to opening preparation',
    process: [
      { step: '01', title: 'Source', desc: 'Filter by area, scale, budget, and hospitality use' },
      { step: '02', title: 'Diagnose', desc: 'Check licensing, fire, and building-code risks' },
      { step: '03', title: 'Acquire', desc: 'Broker negotiation, due diligence, contract, and closing' },
      { step: '04', title: 'Open', desc: 'Coordinate licensing, design, contractors, and operator setup' },
    ],
  },
  'zh-TW': {
    heroTitle: '日本住宿業物件，從取得判斷到開業',
    heroDescription:
      '自由不動產是東京持牌仲介，專注服務外國投資者取得飯店、旅館、民宿向物件。我們提供物件搜尋、購買前可行性診斷、買賣仲介、許可準備與開業PM。',
    primaryCta: '瀏覽住宿業物件',
    secondaryCta: '諮詢購買前診斷',
    searchTitle: '搜尋可作為住宿事業的物件',
    searchDescription: '依地區、車站、預算與建物規模篩選候選物件。',
    proof: [
      { value: 'Hotel / Ryokan / Minpaku', label: '專注住宿用途' },
      { value: 'Zoning / Fire / Hokenjo', label: '購買前確認可行性' },
      { value: 'EN / JA / 中文', label: '外國投資者服務' },
    ],
    assetTitle: '每個物件都以住宿業取得潛力來呈現',
    assetDescription:
      '不只看一般收益。我們從許可、消防、建築與營運角度，評估飯店、民宿整棟、轉用候選與觀光地用地。',
    assetPaths: [
      { title: '飯店・旅館', desc: '營運中資產、翻新、營運交接' },
      { title: '民宿整棟', desc: '獨棟、小型整棟、車站周邊候選' },
      { title: '轉用候選', desc: '店鋪、辦公、住宅轉住宿用途' },
      { title: '開發用地', desc: '飯店、簡易宿所、觀光地開發' },
    ],
    reviewTitle: '以許可現實為核心的物件平台',
    reviewDescription: '投報率與距離車站不夠。我們在購買前拆解是否真的能作為住宿業營運。',
    checks: [
      { title: '用途地域', desc: '所在地是否能作住宿用途' },
      { title: '消防', desc: '設備、避難與改修成本初步確認' },
      { title: '建築', desc: '用途變更、樓梯、出口、結構問題' },
      { title: '保健所', desc: '旅館業、簡易宿所、民宿許可路徑' },
    ],
    processTitle: '從購買前確認到開業準備的支援',
    process: [
      { step: '01', title: '篩選', desc: '依區域、規模、預算與住宿用途篩選' },
      { step: '02', title: '診斷', desc: '確認許可、消防與建築風險' },
      { step: '03', title: '取得', desc: '條件談判、DD、契約與交割' },
      { step: '04', title: '開業', desc: '協調許可、設計、施工與營運體制' },
    ],
  },
  'zh-CN': {
    heroTitle: '日本住宿业物件，从取得判断到开业',
    heroDescription:
      '自由不动产是东京持牌中介，专注服务外国投资者取得酒店、旅馆、民宿向物件。我们提供物件搜索、购买前可行性诊断、买卖仲介、许可准备与开业PM。',
    primaryCta: '浏览住宿业物件',
    secondaryCta: '咨询购买前诊断',
    searchTitle: '搜索可作为住宿事业的物件',
    searchDescription: '按区域、车站、预算与建筑规模筛选候选物件。',
    proof: [
      { value: 'Hotel / Ryokan / Minpaku', label: '专注住宿用途' },
      { value: 'Zoning / Fire / Hokenjo', label: '购买前确认可行性' },
      { value: 'EN / JA / 中文', label: '外国投资者服务' },
    ],
    assetTitle: '每个物件都以住宿业取得潜力来呈现',
    assetDescription:
      '不只看一般收益。我们从许可、消防、建筑与运营角度，评估酒店、民宿整栋、转用候选与观光地用地。',
    assetPaths: [
      { title: '酒店・旅馆', desc: '运营中资产、翻新、运营交接' },
      { title: '民宿整栋', desc: '独栋、小型整栋、车站周边候选' },
      { title: '转用候选', desc: '店铺、办公、住宅转住宿用途' },
      { title: '开发用地', desc: '酒店、简易住宿、观光地开发' },
    ],
    reviewTitle: '以许可现实为核心的物件平台',
    reviewDescription: '收益率与距离车站不够。我们在购买前拆解是否真的能作为住宿业运营。',
    checks: [
      { title: '用途地域', desc: '所在地是否能做住宿用途' },
      { title: '消防', desc: '设备、避难与改修成本初步确认' },
      { title: '建筑', desc: '用途变更、楼梯、出口、结构问题' },
      { title: '保健所', desc: '旅馆业、简易住宿、民宿许可路径' },
    ],
    processTitle: '从购买前确认到开业准备的支持',
    process: [
      { step: '01', title: '筛选', desc: '按区域、规模、预算与住宿用途筛选' },
      { step: '02', title: '诊断', desc: '确认许可、消防与建筑风险' },
      { step: '03', title: '取得', desc: '条件谈判、DD、合同与交割' },
      { step: '04', title: '开业', desc: '协调许可、设计、施工与运营体制' },
    ],
  },
} as const

const listingsCopy = {
  ja: {
    title: '宿泊業向け物件一覧',
    intro:
      'ホテル・旅館・民泊対応物件、簡易宿所への転用候補、観光地の開発用地を検索できます。掲載物件は、取得前診断と組み合わせて検討する前提の候補リストです。',
    resultPrefix: '公開中の候補',
    filtersTitle: '取得条件',
    filtersDescription: '宿泊用途・エリア・価格・建物規模で絞り込み',
  },
  en: {
    title: 'Hospitality Property Listings',
    intro:
      'Search hotels, ryokan, minpaku-ready buildings, conversion candidates, and tourism development sites. Listings are framed as acquisition candidates to be reviewed with pre-purchase feasibility.',
    resultPrefix: 'Published candidates',
    filtersTitle: 'Acquisition criteria',
    filtersDescription: 'Filter by lodging use, location, budget, and building scale',
  },
  'zh-TW': {
    title: '住宿業物件列表',
    intro:
      '搜尋飯店、旅館、民宿整棟、轉用候選與觀光地開發用地。掲載物件皆以購買前可行性診斷為前提進行檢討。',
    resultPrefix: '公開候選',
    filtersTitle: '取得條件',
    filtersDescription: '依住宿用途、地區、預算與建物規模篩選',
  },
  'zh-CN': {
    title: '住宿业物件列表',
    intro:
      '搜索酒店、旅馆、民宿整栋、转用候选与观光地开发用地。掲載物件皆以购买前可行性诊断为前提进行评估。',
    resultPrefix: '公开候选',
    filtersTitle: '取得条件',
    filtersDescription: '按住宿用途、地区、预算与建筑规模筛选',
  },
} as const

const cardCopy = {
  ja: {
    candidate: '宿泊業取得候補',
    review: '購入前診断対象',
    license: '許認可確認',
    opening: '開業PM相談可',
    yield: '想定利回り',
    area: '建物面積',
  },
  en: {
    candidate: 'Hospitality acquisition candidate',
    review: 'Pre-purchase review',
    license: 'License path check',
    opening: 'Opening PM available',
    yield: 'Gross yield',
    area: 'Building area',
  },
  'zh-TW': {
    candidate: '住宿業取得候選',
    review: '購買前診斷',
    license: '許可路徑確認',
    opening: '開業PM諮詢',
    yield: '表面投報率',
    area: '建物面積',
  },
  'zh-CN': {
    candidate: '住宿业取得候选',
    review: '购买前诊断',
    license: '许可路径确认',
    opening: '开业PM咨询',
    yield: '表面收益率',
    area: '建筑面积',
  },
} as const

export function getHospitalityPropertyTypeOptions(locale: string) {
  return propertyTypeOptions[normalizeLocale(locale)]
}

export function getHospitalityCategoryOptions(
  locale: string,
): { value: HospitalityCategory; label: string; desc: string }[] {
  return hospitalityCategoryOptions[normalizeLocale(locale)]
}

export function getHospitalityCategoryLabel(
  category: string | null | undefined,
  locale: string,
): string | null {
  if (!category) return null
  const options = hospitalityCategoryOptions[normalizeLocale(locale)]
  return options.find((option) => option.value === category)?.label ?? null
}

export function getHospitalityHomeCopy(locale: string) {
  return homeCopy[normalizeLocale(locale)]
}

export function getHospitalityListingsCopy(locale: string) {
  return listingsCopy[normalizeLocale(locale)]
}

export function getHospitalityCardCopy(locale: string) {
  return cardCopy[normalizeLocale(locale)]
}
