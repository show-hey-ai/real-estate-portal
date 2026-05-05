import { type Locale, defaultLocale, locales } from '@/i18n/config'

const guideUiCopy = {
  ja: {
    navLabel: 'ガイド',
    homeCrumb: 'ホーム',
    indexTitle: '海外投資家向け 日本不動産ガイド',
    indexDescription:
      '海外投資家が日本の収益不動産を検討するときに必要な論点を、英語・中国語・日本語で整理した実務ガイドです。',
    indexLead:
      '外国人購入、利回りの見方、保有スキームなど、問い合わせ前に詰まりやすいテーマを短く整理しています。',
    indexPoints: [
      '外国人が日本で収益不動産を買う流れ',
      '東京の利回り数字をどう読むか',
      '個人保有と法人保有の考え方',
    ],
    browseListings: '公開中の物件を見る',
    readArticle: '記事を読む',
    viewAllGuides: 'ガイド一覧を見る',
    homeTitle: '購入前に確認したい投資ガイド',
    homeDescription:
      '海外投資家が日本の不動産を検討するときに確認したい論点を、実務目線で整理しています。',
    publishedLabel: '公開',
    updatedLabel: '更新',
    readingTime: (minutes: number) => `${minutes}分で読めます`,
    tableOfContents: '目次',
    keyTakeaways: '要点',
    faq: 'よくある質問',
    backToGuides: 'ガイド一覧へ戻る',
    ctaButton: '物件一覧を見る',
    relatedGuides: 'あわせて読みたいガイド',
  },
  en: {
    navLabel: 'Guides',
    homeCrumb: 'Home',
    indexTitle: 'Japan Real Estate Guides for Overseas Investors',
    indexDescription:
      'Practical multilingual guides for overseas buyers evaluating Japanese investment property, return assumptions, ownership structure, and execution risk.',
    indexLead:
      'These articles answer the practical questions overseas investors usually ask before they inquire.',
    indexPoints: [
      'How foreign buyers acquire income property in Japan',
      'How to read return assumptions in Tokyo',
      'When to buy personally vs through a company',
    ],
    browseListings: 'Browse live listings',
    readArticle: 'Read article',
    viewAllGuides: 'View all guides',
    homeTitle: 'Investor guides for shortlisting Japan hospitality property',
    homeDescription:
      'We publish concise guides around acquisition, underwriting, and ownership so overseas buyers can move from research to shortlist faster.',
    publishedLabel: 'Published',
    updatedLabel: 'Updated',
    readingTime: (minutes: number) => `${minutes} min read`,
    tableOfContents: 'Contents',
    keyTakeaways: 'Key takeaways',
    faq: 'FAQ',
    backToGuides: 'Back to guides',
    ctaButton: 'See listings',
    relatedGuides: 'Related guides',
  },
  'zh-TW': {
    navLabel: '指南',
    homeCrumb: '首頁',
    indexTitle: '面向海外投資人的日本不動產指南',
    indexDescription:
      '以繁體中文、英文與日文整理日本收益不動產的購買流程、投報率判讀、持有結構與執行風險。',
    indexLead:
      '這些文章整理海外投資人在詢問前通常需要確認的實務問題。',
    indexPoints: [
      '外國人購買日本收益物件的流程',
      '如何判讀東京投報率數字',
      '個人持有與法人持有的差異',
    ],
    browseListings: '查看公開物件',
    readArticle: '閱讀文章',
    viewAllGuides: '查看全部指南',
    homeTitle: '購買前確認用投資指南',
    homeDescription:
      '用文章回答海外投資人最常查詢的議題，讓使用者從內容頁自然進入物件列表與洽詢流程。',
    publishedLabel: '發布',
    updatedLabel: '更新',
    readingTime: (minutes: number) => `${minutes} 分鐘閱讀`,
    tableOfContents: '目錄',
    keyTakeaways: '重點整理',
    faq: '常見問題',
    backToGuides: '返回指南列表',
    ctaButton: '查看物件',
    relatedGuides: '延伸閱讀',
  },
  'zh-CN': {
    navLabel: '指南',
    homeCrumb: '首页',
    indexTitle: '面向海外投资人的日本房产指南',
    indexDescription:
      '用简体中文、英文和日文整理日本收益房产的购买流程、收益率判断、持有结构和执行风险。',
    indexLead:
      '这些文章整理海外投资人在咨询前通常需要确认的实务问题。',
    indexPoints: [
      '外国人购买日本收益房产的流程',
      '如何判断东京收益率数字',
      '个人持有与公司持有的差异',
    ],
    browseListings: '查看公开房源',
    readArticle: '阅读文章',
    viewAllGuides: '查看全部指南',
    homeTitle: '购买前确认用投资指南',
    homeDescription:
      '通过文章回答海外投资人最常检索的问题，让用户从内容页自然进入房源列表和咨询流程。',
    publishedLabel: '发布',
    updatedLabel: '更新',
    readingTime: (minutes: number) => `${minutes} 分钟阅读`,
    tableOfContents: '目录',
    keyTakeaways: '重点整理',
    faq: '常见问题',
    backToGuides: '返回指南列表',
    ctaButton: '查看房源',
    relatedGuides: '延伸阅读',
  },
} as const satisfies Record<
  Locale,
  {
    navLabel: string
    homeCrumb: string
    indexTitle: string
    indexDescription: string
    indexLead: string
    indexPoints: string[]
    browseListings: string
    readArticle: string
    viewAllGuides: string
    homeTitle: string
    homeDescription: string
    publishedLabel: string
    updatedLabel: string
    readingTime: (minutes: number) => string
    tableOfContents: string
    keyTakeaways: string
    faq: string
    backToGuides: string
    ctaButton: string
    relatedGuides: string
  }
>

export function normalizeGuideLocale(locale: string | null | undefined): Locale {
  if (locale && locales.includes(locale as Locale)) {
    return locale as Locale
  }

  return defaultLocale
}

export function getGuideUiCopy(locale: string | Locale) {
  return guideUiCopy[normalizeGuideLocale(locale)]
}

export function formatGuideDate(value: string, locale: string | Locale) {
  const normalizedLocale = normalizeGuideLocale(locale)
  const formatterLocale =
    normalizedLocale === 'ja'
      ? 'ja-JP'
      : normalizedLocale === 'en'
        ? 'en-US'
        : normalizedLocale

  return new Intl.DateTimeFormat(formatterLocale, {
    year: 'numeric',
    month: normalizedLocale === 'en' ? 'short' : 'numeric',
    day: 'numeric',
  }).format(new Date(value))
}

export function formatGuideReadingTime(minutes: number, locale: string | Locale) {
  return getGuideUiCopy(locale).readingTime(minutes)
}
