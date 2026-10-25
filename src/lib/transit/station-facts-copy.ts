export interface StationFactsCopy {
  marketTitle: (station: string) => string
  marketNote: string
  count: string
  countValue: (count: number) => string
  priceRange: string
  priceMedian: string
  unitPrice: string
  layouts: string
  walk: string
  walkBuckets: [string, string, string]
  accessTitle: (station: string) => string
  stops: (count: number) => string
  accessNote: string
  faqTitle: string
  faqCountQ: (station: string) => string
  faqCountA: (count: number, range: string, median: string | null) => string
  faqAccessQ: (station: string) => string
  faqAccessA: (hubs: string) => string
  faqForeignQ: (station: string) => string
  faqForeignA: string
  faqUnlistedQ: string
  faqUnlistedA: string
  hubEntry: (hub: string, line: string, stops: number) => string
  join: string
}

const COPY: Record<string, StationFactsCopy> = {
  ja: {
    marketTitle: (station) => `${station}周辺の相場`,
    marketNote: '当サイトで公開中の物件の売出価格から計算した目安です。成約価格ではありません。',
    count: '公開中の物件', countValue: (count) => `${count}件`,
    priceRange: '価格帯', priceMedian: '価格の中央値', unitPrice: '1㎡あたりの価格（中央値）', layouts: '多い間取り',
    walk: '駅からの徒歩', walkBuckets: ['5分以内', '6〜10分', '10分超・不明'],
    accessTitle: (station) => `${station}から乗り換えなしで行ける主な駅`,
    stops: (count) => `${count}駅目`,
    accessNote: '各路線の停車駅で数えています。所要時間は列車の種類や時間帯で変わります。',
    faqTitle: 'よくある質問',
    faqCountQ: (station) => `${station}周辺で売り出し中の物件は何件ありますか？`,
    faqCountA: (count, range, median) => `当サイトでは${count}件を公開中です。価格は${range}${median ? `、中央値は${median}` : ''}です。物件は随時追加・更新しています。`,
    faqAccessQ: (station) => `${station}から乗り換えなしで行ける主な駅は？`,
    faqAccessA: (hubs) => `${hubs}です。`,
    faqForeignQ: (station) => `外国籍でも${station}周辺の物件を購入できますか？`,
    faqForeignA: 'はい。日本では外国籍の方も原則として不動産を購入・所有できます。海外にお住まいの場合も、送金・登記・税金の手続きまでご案内します。日本語・英語・中国語でご相談いただけます。',
    faqUnlistedQ: 'ここに載っていない物件も紹介してもらえますか？',
    faqUnlistedA: 'はい。広告できない物件や公開前の物件も、条件をいただければ個別にご紹介できます。登録は不要です。',
    hubEntry: (hub, line, stops) => `${hub}（${line}で${stops}駅目）`,
    join: '、',
  },
  en: {
    marketTitle: (station) => `Prices near ${station}`,
    marketNote: 'Worked out from the asking prices of properties listed on this site; not sale prices.',
    count: 'Listed now', countValue: (count) => `${count}`,
    priceRange: 'Price range', priceMedian: 'Median price', unitPrice: 'Median price per m²', layouts: 'Common layouts',
    walk: 'Walk from the station', walkBuckets: ['Up to 5 min', '6–10 min', 'Over 10 min or not stated'],
    accessTitle: (station) => `Major stations you can reach from ${station} without changing trains`,
    stops: (count) => `${count} ${count === 1 ? 'stop' : 'stops'}`,
    accessNote: 'Counted by the stations each line stops at. Journey times depend on the train type and time of day.',
    faqTitle: 'Frequently asked questions',
    faqCountQ: (station) => `How many properties are for sale near ${station}?`,
    faqCountA: (count, range, median) => `${count} ${count === 1 ? 'property is' : 'properties are'} listed on this site. Asking prices: ${range}${median ? ` (median ${median})` : ''}. Listings are added and updated regularly.`,
    faqAccessQ: (station) => `Which major stations can I reach from ${station} without changing trains?`,
    faqAccessA: (hubs) => `${hubs}.`,
    faqForeignQ: (station) => `Can foreigners buy property near ${station}?`,
    faqForeignA: 'Yes. In Japan, foreign nationals can in principle buy and own real estate. If you live abroad, we guide you through money transfer, registration and taxes, in English, Japanese or Chinese.',
    faqUnlistedQ: 'Can you introduce properties that are not listed here?',
    faqUnlistedA: 'Yes. Send your conditions and we can introduce, one to one, properties that cannot be advertised or are not yet public. No sign-up needed.',
    hubEntry: (hub, line, stops) => `${hub} (${stops} ${stops === 1 ? 'stop' : 'stops'} on the ${line})`,
    join: ', ',
  },
  'zh-TW': {
    marketTitle: (station) => `${station}周邊行情`,
    marketNote: '依本網站刊登中物件的售價計算的參考值，並非成交價。',
    count: '刊登中物件', countValue: (count) => `${count} 筆`,
    priceRange: '價格範圍', priceMedian: '價格中位數', unitPrice: '每平方公尺價格（中位數）', layouts: '常見格局',
    walk: '距車站步行', walkBuckets: ['5分鐘以內', '6〜10分鐘', '超過10分鐘／未標示'],
    accessTitle: (station) => `從${station}不必轉乘即可到達的主要車站`,
    stops: (count) => `${count}站`,
    accessNote: '依各路線的停靠站計算。所需時間依列車種類與時段而異。',
    faqTitle: '常見問題',
    faqCountQ: (station) => `${station}周邊有多少待售物件？`,
    faqCountA: (count, range, median) => `本網站目前刊登${count}筆物件。價格為${range}${median ? `，中位數為${median}` : ''}。物件會隨時新增與更新。`,
    faqAccessQ: (station) => `從${station}不必轉乘可以到達哪些主要車站？`,
    faqAccessA: (hubs) => `${hubs}。`,
    faqForeignQ: (station) => `外國人也能購買${station}周邊的物件嗎？`,
    faqForeignA: '可以。在日本，外國籍人士原則上也能購買並持有不動產。若您住在海外，我們也會協助匯款、登記與稅務手續，提供中文、日文、英文服務。',
    faqUnlistedQ: '網站上沒有的物件也能介紹嗎？',
    faqUnlistedA: '可以。無法刊登廣告或尚未公開的物件，只要提供條件，我們也能個別介紹。免註冊。',
    hubEntry: (hub, line, stops) => `${hub}（${line}，${stops}站）`,
    join: '、',
  },
  'zh-CN': {
    marketTitle: (station) => `${station}周边行情`,
    marketNote: '根据本网站刊登中房源的售价计算的参考值，并非成交价。',
    count: '刊登中房源', countValue: (count) => `${count} 套`,
    priceRange: '价格范围', priceMedian: '价格中位数', unitPrice: '每平方米价格（中位数）', layouts: '常见户型',
    walk: '距车站步行', walkBuckets: ['5分钟以内', '6〜10分钟', '超过10分钟／未标示'],
    accessTitle: (station) => `从${station}无需换乘即可到达的主要车站`,
    stops: (count) => `${count}站`,
    accessNote: '按各线路的停靠站计算。所需时间因列车种类和时段而异。',
    faqTitle: '常见问题',
    faqCountQ: (station) => `${station}周边有多少在售房源？`,
    faqCountA: (count, range, median) => `本网站目前刊登${count}套房源。价格为${range}${median ? `，中位数为${median}` : ''}。房源会随时新增和更新。`,
    faqAccessQ: (station) => `从${station}无需换乘可以到达哪些主要车站？`,
    faqAccessA: (hubs) => `${hubs}。`,
    faqForeignQ: (station) => `外国人也能购买${station}周边的房源吗？`,
    faqForeignA: '可以。在日本，外国籍人士原则上也可以购买并持有不动产。如果您住在海外，我们也会协助汇款、登记和税务手续，提供中文、日语、英语服务。',
    faqUnlistedQ: '网站上没有的房源也能介绍吗？',
    faqUnlistedA: '可以。无法刊登广告或尚未公开的房源，只要提供条件，我们也能单独介绍。免注册。',
    hubEntry: (hub, line, stops) => `${hub}（${line}，${stops}站）`,
    join: '、',
  },
}

export function getStationFactsCopy(locale: string): StationFactsCopy {
  return COPY[locale] ?? COPY.en
}
