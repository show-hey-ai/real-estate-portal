import { defaultLocale, locales, type Locale } from '@/i18n/config'

function getLocale(locale: string): Locale { return locales.includes(locale as Locale) ? locale as Locale : defaultLocale }

const copy = {
  ja: {
    matchTitle: '購入条件を相談する', matchIntro: 'エリア・予算・購入時期を入力し、WhatsAppでご相談ください。送信前に内容を確認できます。',
    area: '希望エリア', areaPlaceholder: '例：目黒区・渋谷区、山手線沿線', budget: '予算', purpose: '購入目的', purposeOptions: ['投資用', '居住用', '土地'], type: '物件の種類', timing: '購入時期', priority: '重視すること',
    select: '未定', budgetOptions: ['5,000万円未満', '5,000万〜1億円', '1億〜2億円', '2億円以上'], typeOptions: ['マンション', '戸建て', '土地', '一棟収益物件', '店舗・事務所'], timingOptions: ['できるだけ早く', '今年中', 'まだ先'], priorityOptions: ['立地', '広さ', '価格', '通勤・交通'],
    contact: 'この条件でWhatsApp相談', contactNote: 'ボタンを押すとWhatsAppが開きます。送信前に内容を確認できます。',
    guideTitle: '東京の不動産購入ガイド', guideIntro: '物件探しから契約・決済まで、最初に押さえたい流れです。個別の費用や条件は物件ごとに確認します。',
    guideSteps: [['1. 条件を決める', '購入目的、予算、エリア、広さ、購入時期の優先順位を整理します。'], ['2. 物件を比較する', '価格に加え、現況、建物の状態、賃料・利回り、土地条件を目的に応じて確認します。'], ['3. 資金計画を確認する', '物件価格以外に必要な費用や、支払方法を確認します。'], ['4. 契約と引渡し', '重要事項や契約条件を確認し、決済と引渡しを進めます。']],
  },
  en: {
    matchTitle: 'Discuss your property search', matchIntro: 'Share your preferred area, budget, and timing via WhatsApp. You can review the message before sending.',
    area: 'Preferred area', areaPlaceholder: 'e.g. Meguro, Shibuya, Yamanote Line', budget: 'Budget', purpose: 'Purchase purpose', purposeOptions: ['Investment', 'Residential', 'Land'], type: 'Property type', timing: 'Purchase timing', priority: 'Top priority',
    select: 'Not decided', budgetOptions: ['Under ¥50M', '¥50M–¥100M', '¥100M–¥200M', 'Over ¥200M'], typeOptions: ['Condominium', 'House', 'Land', 'Whole building', 'Commercial'], timingOptions: ['As soon as possible', 'This year', 'Later'], priorityOptions: ['Location', 'Space', 'Price', 'Commute'],
    contact: 'Discuss via WhatsApp', contactNote: 'WhatsApp opens with a draft. You can review it before sending.',
    guideTitle: 'Buying property in Tokyo', guideIntro: 'The basic path from search to closing. Confirm costs and conditions for each property.',
    guideSteps: [['1. Set your criteria', 'Prioritize purchase purpose, budget, area, space, and timing.'], ['2. Compare properties', 'Review occupancy, building condition, income, or land conditions as relevant.'], ['3. Plan the funds', 'Check costs beyond the purchase price and how you will pay.'], ['4. Contract and closing', 'Review the property disclosure and contract, then complete closing and handover.']],
  },
  'zh-TW': {
    matchTitle: '諮詢購屋條件', matchIntro: '填寫意向地區、預算和購買時間，透過 WhatsApp 諮詢。傳送前可以確認內容。',
    area: '意向地區', areaPlaceholder: '例如：目黑區、澀谷區、山手線沿線', budget: '預算', purpose: '購買目的', purposeOptions: ['投資用', '居住用', '土地'], type: '物件類型', timing: '購買時間', priority: '最重視的條件',
    select: '未決定', budgetOptions: ['5,000萬日圓以下', '5,000萬～1億日圓', '1億～2億日圓', '2億日圓以上'], typeOptions: ['公寓住宅', '獨棟住宅', '土地', '整棟收益物件', '店鋪・辦公室'], timingOptions: ['盡快', '今年內', '較晚'], priorityOptions: ['地點', '面積', '價格', '通勤'],
    contact: '透過 WhatsApp 諮詢', contactNote: '將開啟 WhatsApp 草稿，傳送前可先確認內容。',
    guideTitle: '東京不動產購買指南', guideIntro: '從找房到簽約交屋的基本流程。費用與條件需依個別物件確認。',
    guideSteps: [['1. 整理需求', '確認預算、地區、面積、通勤與購買時間的優先順序。'], ['2. 比較物件', '依目的確認現況、建物狀況、收益或土地條件。'], ['3. 規劃資金', '確認房價以外的費用與付款方式。'], ['4. 簽約與交屋', '確認重要事項和契約條件，再進行結算與交屋。']],
  },
  'zh-CN': {
    matchTitle: '咨询购房条件', matchIntro: '填写意向地区、预算和购买时间，通过 WhatsApp 咨询。发送前可以确认内容。',
    area: '意向地区', areaPlaceholder: '例如：目黑区、涩谷区、山手线沿线', budget: '预算', purpose: '购买目的', purposeOptions: ['投资用', '居住用', '土地'], type: '房产类型', timing: '购买时间', priority: '最重视的条件',
    select: '未决定', budgetOptions: ['5,000万日元以下', '5,000万～1亿日元', '1亿～2亿日元', '2亿日元以上'], typeOptions: ['公寓住宅', '独栋住宅', '土地', '整栋收益房产', '商铺・办公室'], timingOptions: ['尽快', '今年内', '以后'], priorityOptions: ['位置', '面积', '价格', '通勤'],
    contact: '通过 WhatsApp 咨询', contactNote: '将打开 WhatsApp 草稿，发送前可先确认内容。',
    guideTitle: '东京房产购买指南', guideIntro: '从找房到签约交房的基本流程。费用和条件需依具体房源确认。',
    guideSteps: [['1. 整理需求', '确认预算、地区、面积、通勤与购买时间的优先顺序。'], ['2. 比较房产', '按购买目的确认现状、建筑状况、收益或土地条件。'], ['3. 规划资金', '确认房价以外的费用和付款方式。'], ['4. 签约与交房', '确认重要事项和合同条件，再进行结算与交房。']],
  },
} as const

export function getBuyerJourneyCopy(locale: string) { return copy[getLocale(locale)] }
