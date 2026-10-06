import { defaultLocale, locales, type Locale } from '@/i18n/config'

const copy = {
  ja: {
    discover: '見つける', recommendations: 'あなたへの提案', articles: '購入のヒント',
    menu: 'メニューを開く', navigation: '物件探しのメニュー', search: '物件を検索',
    keyword: 'エリア・住所から探す', areaTitle: 'エリアから探す', all: 'すべて見る',
    personalTitle: '気になる物件から、あなたに合う一件へ。',
    personalDescription: '希望条件を保存。候補を比べて、気になる物件は専用チャットで相談できます。',
    personalCta: '条件を保存して探す', filterDetails: 'エリア・価格・駅などで詳しく探す',
  },
  en: {
    discover: 'Discover', recommendations: 'For you', articles: 'Buying insights',
    menu: 'Open menu', navigation: 'Property navigation', search: 'Search properties',
    keyword: 'Tokyo ward or Japanese address', areaTitle: 'Explore by area', all: 'View all',
    personalTitle: 'From a shortlist to the right property for you.',
    personalDescription: 'Save your criteria, compare candidates, and discuss a property in its private chat.',
    personalCta: 'Save my criteria', filterDetails: 'Refine by area, price, station, and more',
  },
  'zh-TW': {
    discover: '探索物件', recommendations: '為您推薦', articles: '購屋知識',
    menu: '開啟選單', navigation: '物件搜尋選單', search: '搜尋物件',
    keyword: '東京23區或日文地址', areaTitle: '依地區尋找', all: '查看全部',
    personalTitle: '從心動的物件，找到適合您的一間。',
    personalDescription: '儲存需求、比較候選物件，再透過物件專屬的私人聊天室諮詢。',
    personalCta: '儲存需求並搜尋', filterDetails: '依地區、價格、車站等進一步搜尋',
  },
  'zh-CN': {
    discover: '探索房源', recommendations: '为您推荐', articles: '购房知识',
    menu: '打开菜单', navigation: '房源搜索菜单', search: '搜索房产',
    keyword: '东京23区或日文地址', areaTitle: '按地区寻找', all: '查看全部',
    personalTitle: '从心动的房源，找到适合您的一套。',
    personalDescription: '保存需求、比较候选房源，再通过房源专属的私人聊天室咨询。',
    personalCta: '保存需求并搜索', filterDetails: '按地区、价格、车站等进一步搜索',
  },
} as const

export function getMarketplaceCopy(locale: string) {
  return copy[locales.includes(locale as Locale) ? locale as Locale : defaultLocale]
}
