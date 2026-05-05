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
      'Ziyou Hospitalityは、外国人投資家向けに日本のホテル・旅館・民泊向け物件を探し、紹介し、取得まで支援する東京の宅建業者です。ポータル掲載物件に加えて、希望条件に合わせた未公開候補の紹介、売買仲介、許認可準備、開業PMまで一気通貫で支援します。',
    primaryCta: '宿泊業物件を探す',
    secondaryCta: '希望条件を送る',
    searchTitle: '条件に合う宿泊業物件を探す',
    searchDescription: 'エリア、駅、価格、建物規模から公開候補を絞り込みます。',
    proof: [
      { value: 'Hotel / Ryokan / Minpaku', label: '宿泊用途に特化' },
      { value: 'Listed + Off-market', label: '公開・未公開候補を紹介' },
      { value: 'EN / JA / 中文', label: '外国人投資家対応' },
    ],
    assetTitle: '掲載対象は、宿泊業として取得・運営を検討できる候補物件です',
    assetDescription:
      '既存ホテル・旅館だけでなく、民泊対応の一棟物件、簡易宿所への転用候補、観光地の開発用地まで、投資家の予算・エリア・運営方針に合わせて候補を整理します。',
    assetPaths: [
      { title: 'ホテル・旅館', desc: '営業中資産、改装前提、オペレーター引継ぎ' },
      { title: '民泊対応一棟', desc: '戸建、一棟アパート、駅近の小規模運用候補' },
      { title: '転用候補', desc: '店舗・事務所・住宅から宿泊用途への転用検討' },
      { title: '開発用地', desc: 'ホテル、簡易宿所、観光地向け小規模開発' },
    ],
    reviewTitle: '紹介する前に、宿泊業としての成立性を見ます',
    reviewDescription:
      '投資家にとっての入口は物件探しです。ただし、私たちは利回りや駅距離だけで候補を出しません。宿泊用途・消防・建築・保健所の論点を踏まえて、進める価値のある候補を紹介します。',
    checks: [
      { title: '用途地域', desc: '旅館業・民泊が成立する地域か' },
      { title: '消防', desc: '設備・避難・改修コストの初期確認' },
      { title: '建築', desc: '用途変更、階段、避難、構造の論点' },
      { title: '保健所', desc: '旅館業・簡易宿所・住宅宿泊事業の見通し' },
    ],
    processTitle: '物件探しから取得・開業準備まで支援します',
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
      'Ziyou Hospitality is a Tokyo-licensed brokerage that helps foreign investors find, evaluate, and acquire hotel, ryokan, and minpaku-ready properties in Japan. Browse listed candidates or send us your target criteria, and we can introduce both public and off-market opportunities.',
    primaryCta: 'Browse hospitality assets',
    secondaryCta: 'Send your criteria',
    searchTitle: 'Search hospitality assets that fit your criteria',
    searchDescription: 'Filter public candidates by location, station access, budget, and building scale.',
    proof: [
      { value: 'Hotel / Ryokan / Minpaku', label: 'Hospitality-only focus' },
      { value: 'Listed + Off-market', label: 'Public and private sourcing' },
      { value: 'EN / JA / 中文', label: 'Foreign investor desk' },
    ],
    assetTitle: 'Every listing is framed around hospitality acquisition potential',
    assetDescription:
      'We look beyond ordinary income property. Operating hotels, minpaku-ready buildings, conversion candidates, and tourism land are organized around the investor’s budget, target area, operating plan, and acquisition path.',
    assetPaths: [
      { title: 'Hotels & ryokan', desc: 'Operating assets, renovation plays, operator handover' },
      { title: 'Minpaku-ready buildings', desc: 'Houses, small buildings, station-side lodging candidates' },
      { title: 'Conversion candidates', desc: 'Commercial, office, or residential assets with lodging potential' },
      { title: 'Development land', desc: 'Hotel, simple lodging, and destination development sites' },
    ],
    reviewTitle: 'Before we introduce a candidate, we look at whether it can work as hospitality',
    reviewDescription:
      'Investors usually start with property search. Our difference is what happens before a candidate is recommended: we check the practical lodging-use issues behind the price, operating assumptions, and station distance.',
    checks: [
      { title: 'Zoning', desc: 'Whether lodging use is possible in the district' },
      { title: 'Fire code', desc: 'Equipment, egress, and retrofit cost signals' },
      { title: 'Building code', desc: 'Use change, stairs, exits, and structure issues' },
      { title: 'Hokenjo', desc: 'Hotel, simple lodging, or minpaku license path' },
    ],
    processTitle: 'Support from property search to acquisition and opening preparation',
    process: [
      { step: '01', title: 'Source', desc: 'Filter by area, scale, budget, and hospitality use' },
      { step: '02', title: 'Shortlist', desc: 'Check licensing, fire, and building-code risks before recommendation' },
      { step: '03', title: 'Acquire', desc: 'Broker negotiation, due diligence, contract, and closing' },
      { step: '04', title: 'Open', desc: 'Coordinate licensing, design, contractors, and operator setup' },
    ],
  },
  'zh-TW': {
    heroTitle: '日本住宿業物件，從取得判斷到開業',
    heroDescription:
      '自由不動產是東京持牌仲介，協助外國投資者尋找、介紹並取得日本飯店、旅館、民宿向物件。您可以先瀏覽公開物件，也可以告訴我們希望地區與預算，我們會介紹公開與未公開候選。',
    primaryCta: '瀏覽住宿業物件',
    secondaryCta: '傳送希望條件',
    searchTitle: '搜尋符合條件的住宿業物件',
    searchDescription: '依地區、車站、預算與建物規模篩選公開候選物件。',
    proof: [
      { value: 'Hotel / Ryokan / Minpaku', label: '專注住宿用途' },
      { value: 'Listed + Off-market', label: '公開與未公開候選介紹' },
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
    reviewTitle: '介紹物件前，我們會先看住宿業成立性',
    reviewDescription: '投資者的入口通常是找物件。我們的差異在於推薦前會確認住宿用途、消防、建築與保健所等實務論點。',
    checks: [
      { title: '用途地域', desc: '所在地是否能作住宿用途' },
      { title: '消防', desc: '設備、避難與改修成本初步確認' },
      { title: '建築', desc: '用途變更、樓梯、出口、結構問題' },
      { title: '保健所', desc: '旅館業、簡易宿所、民宿許可路徑' },
    ],
    processTitle: '從物件搜尋到取得與開業準備的支援',
    process: [
      { step: '01', title: '篩選', desc: '依區域、規模、預算與住宿用途篩選' },
      { step: '02', title: '篩選候選', desc: '推薦前確認許可、消防與建築風險' },
      { step: '03', title: '取得', desc: '條件談判、DD、契約與交割' },
      { step: '04', title: '開業', desc: '協調許可、設計、施工與營運體制' },
    ],
  },
  'zh-CN': {
    heroTitle: '日本住宿业物件，从取得判断到开业',
    heroDescription:
      '自由不动产是东京持牌中介，协助外国投资者寻找、介绍并取得日本酒店、旅馆、民宿向物件。您可以先浏览公开物件，也可以告诉我们希望地区与预算，我们会介绍公开与未公开候选。',
    primaryCta: '浏览住宿业物件',
    secondaryCta: '发送希望条件',
    searchTitle: '搜索符合条件的住宿业物件',
    searchDescription: '按区域、车站、预算与建筑规模筛选公开候选物件。',
    proof: [
      { value: 'Hotel / Ryokan / Minpaku', label: '专注住宿用途' },
      { value: 'Listed + Off-market', label: '公开与未公开候选介绍' },
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
    reviewTitle: '介绍物件前，我们会先看住宿业成立性',
    reviewDescription: '投资者的入口通常是找物件。我们的差异在于推荐前会确认住宿用途、消防、建筑与保健所等实务论点。',
    checks: [
      { title: '用途地域', desc: '所在地是否能做住宿用途' },
      { title: '消防', desc: '设备、避难与改修成本初步确认' },
      { title: '建筑', desc: '用途变更、楼梯、出口、结构问题' },
      { title: '保健所', desc: '旅馆业、简易住宿、民宿许可路径' },
    ],
    processTitle: '从物件搜索到取得与开业准备的支持',
    process: [
      { step: '01', title: '筛选', desc: '按区域、规模、预算与住宿用途筛选' },
      { step: '02', title: '筛选候选', desc: '推荐前确认许可、消防与建筑风险' },
      { step: '03', title: '取得', desc: '条件谈判、DD、合同与交割' },
      { step: '04', title: '开业', desc: '协调许可、设计、施工与运营体制' },
    ],
  },
} as const

const listingsCopy = {
  ja: {
    title: '宿泊業向け物件一覧',
    intro:
      'ホテル・旅館・民泊対応物件、簡易宿所への転用候補、観光地の開発用地を検索できます。気になる物件があればそのまま相談できます。条件に合う未公開候補の紹介も可能です。',
    resultPrefix: '公開中の候補',
    filtersTitle: '取得条件',
    filtersDescription: '宿泊用途・エリア・価格・建物規模で絞り込み',
  },
  en: {
    title: 'Hospitality Property Listings',
    intro:
      'Search hotels, ryokan, minpaku-ready buildings, conversion candidates, and tourism development sites. If a listing fits your direction, ask us about it; we can also introduce off-market candidates that match your criteria.',
    resultPrefix: 'Published candidates',
    filtersTitle: 'Acquisition criteria',
    filtersDescription: 'Filter by lodging use, location, budget, and building scale',
  },
  'zh-TW': {
    title: '住宿業物件列表',
    intro:
      '搜尋飯店、旅館、民宿整棟、轉用候選與觀光地開發用地。如有感興趣的物件，可直接諮詢；我們也可以介紹符合條件的未公開候選。',
    resultPrefix: '公開候選',
    filtersTitle: '取得條件',
    filtersDescription: '依住宿用途、地區、預算與建物規模篩選',
  },
  'zh-CN': {
    title: '住宿业物件列表',
    intro:
      '搜索酒店、旅馆、民宿整栋、转用候选与观光地开发用地。如有感兴趣的物件，可直接咨询；我们也可以介绍符合条件的未公开候选。',
    resultPrefix: '公开候选',
    filtersTitle: '取得条件',
    filtersDescription: '按住宿用途、地区、预算与建筑规模筛选',
  },
} as const

const cardCopy = {
  ja: {
    candidate: '宿泊業取得候補',
    review: '宿泊用途確認',
    license: '許認可確認',
    opening: '開業PM相談可',
    yield: '想定利回り',
    area: '建物面積',
  },
  en: {
    candidate: 'Hospitality acquisition candidate',
    review: 'Hospitality-use check',
    license: 'License path check',
    opening: 'Opening PM available',
    yield: 'Return',
    area: 'Building area',
  },
  'zh-TW': {
    candidate: '住宿業取得候選',
    review: '住宿用途確認',
    license: '許可路徑確認',
    opening: '開業PM諮詢',
    yield: '表面投報率',
    area: '建物面積',
  },
  'zh-CN': {
    candidate: '住宿业取得候选',
    review: '住宿用途确认',
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
