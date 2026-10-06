import { randomBytes } from 'node:crypto'
import { z } from 'zod'
import { BUDGET_SLUGS, TYPE_COLLECTIONS, budgetBand, inBudget, typeSlugFor, type BudgetSlug, type TypeSlug } from '@/lib/collections'
import { priceBandRange } from '@/lib/price-bands'
import { WARD_SLUGS, wardLabel } from '@/lib/ward-tile-map'
import { OPERATOR_NAME, OPERATOR_NAME_JA, SITE_NAME } from '@/lib/site-config'

/**
 * New-listing email alerts without an account: input validation, matching and email text.
 * Mail follows the Japanese Act on Regulation of Transmission of Specified Electronic Mail:
 * double opt-in, sender identity and address, and an unsubscribe link in every message.
 */

export const ALERT_LOCALES = ['ja', 'en', 'zh-TW', 'zh-CN'] as const
export type AlertLocale = (typeof ALERT_LOCALES)[number]

export interface AlertCriteria {
  ward?: string
  type?: TypeSlug
  budget?: BudgetSlug
}

const typeSlugs = Object.keys(TYPE_COLLECTIONS) as [TypeSlug, ...TypeSlug[]]

export const subscribeSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).email(),
  locale: z.enum(ALERT_LOCALES).default('en'),
  ward: z.string().refine((value) => value in WARD_SLUGS).optional(),
  type: z.enum(typeSlugs).optional(),
  budget: z.enum(BUDGET_SLUGS).optional(),
  consent: z.literal(true),
  /** Honeypot: people never fill it in. */
  website: z.string().max(0).optional(),
})

export type SubscribeInput = z.infer<typeof subscribeSchema>

export function criteriaFrom(input: Pick<SubscribeInput, 'ward' | 'type' | 'budget'>): AlertCriteria {
  return Object.fromEntries(Object.entries({ ward: input.ward, type: input.type, budget: input.budget }).filter(([, value]) => value)) as AlertCriteria
}

export function newAlertToken(): string {
  return randomBytes(32).toString('base64url')
}

export interface AlertListing {
  id: string
  city: string | null
  propertyType: string | null
  price: number | string | bigint | null
}

export function matchesCriteria(criteria: AlertCriteria, listing: AlertListing): boolean {
  if (criteria.ward && listing.city !== criteria.ward) return false
  if (criteria.type && typeSlugFor(listing.propertyType) !== criteria.type) return false
  if (criteria.budget) {
    const band = budgetBand(criteria.budget)
    if (!band || !inBudget(listing.price, band)) return false
  }
  return true
}

const copy = {
  ja: {
    all: '東京23区のすべての物件',
    confirmSubject: `【${SITE_NAME}】新着物件メールの登録確認`,
    confirmBody: (criteria: string, link: string) => `新着物件メールのお申し込みありがとうございます。\n\n条件：${criteria}\n\n下のリンクを開き「登録を完了する」を押すと、週1回、条件に合う新着物件をお届けします。\n${link}\n\nお心当たりがない場合は、このメールを破棄してください。登録は完了しません。`,
    digestSubject: (count: number) => `【${SITE_NAME}】新着物件 ${count}件`,
    digestIntro: (criteria: string) => `ご登録の条件（${criteria}）に合う新着物件です。`,
    unsubscribe: '配信停止',
    footer: `送信者：${SITE_NAME}（運営：${OPERATOR_NAME_JA}／宅地建物取引業 東京都知事（1）第108831号）\n〒111-0052 東京都台東区柳橋1丁目11番5号 柳橋ビル305号室\nお問い合わせ：admin@ziyou-fudosan.com`,
  },
  en: {
    all: "All properties in Tokyo's 23 wards",
    confirmSubject: `[${SITE_NAME}] Confirm your new-listing alerts`,
    confirmBody: (criteria: string, link: string) => `Thank you for signing up for new-listing alerts.\n\nCriteria: ${criteria}\n\nOpen the link below and press “Confirm” to receive matching new listings once a week.\n${link}\n\nIf you did not request this, ignore this email and nothing will be sent.`,
    digestSubject: (count: number) => `[${SITE_NAME}] ${count} new ${count === 1 ? 'property' : 'properties'}`,
    digestIntro: (criteria: string) => `New listings matching your criteria (${criteria}).`,
    unsubscribe: 'Unsubscribe',
    footer: `Sender: ${SITE_NAME}, operated by ${OPERATOR_NAME} (real estate brokerage licence: Tokyo Governor (1) No. 108831)\nYanagibashi Bldg. 305, 1-11-5 Yanagibashi, Taito-ku, Tokyo 111-0052, Japan\nContact: admin@ziyou-fudosan.com`,
  },
  'zh-TW': {
    all: '東京23區所有物件',
    confirmSubject: `【${SITE_NAME}】新物件通知登記確認`,
    confirmBody: (criteria: string, link: string) => `感謝您申請新物件通知。\n\n條件：${criteria}\n\n開啟下方連結並按「完成登記」，每週一次寄送符合條件的新物件。\n${link}\n\n若非本人申請，請忽略此郵件，登記不會完成。`,
    digestSubject: (count: number) => `【${SITE_NAME}】新物件 ${count}筆`,
    digestIntro: (criteria: string) => `符合您登記條件（${criteria}）的新物件。`,
    unsubscribe: '取消訂閱',
    footer: `寄件者：${SITE_NAME}（營運：自由不動產合同會社／宅地建物交易業 東京都知事（1）第108831號）\n〒111-0052 東京都台東區柳橋1丁目11番5號 柳橋大樓305號室\n聯絡：admin@ziyou-fudosan.com`,
  },
  'zh-CN': {
    all: '东京23区所有房源',
    confirmSubject: `【${SITE_NAME}】新房源通知订阅确认`,
    confirmBody: (criteria: string, link: string) => `感谢您订阅新房源通知。\n\n条件：${criteria}\n\n打开下方链接并点击“完成订阅”，每周一次发送符合条件的新房源。\n${link}\n\n如非本人申请，请忽略此邮件，订阅不会完成。`,
    digestSubject: (count: number) => `【${SITE_NAME}】新房源 ${count}套`,
    digestIntro: (criteria: string) => `符合您订阅条件（${criteria}）的新房源。`,
    unsubscribe: '取消订阅',
    footer: `发件人：${SITE_NAME}（运营：自由不动产合同会社／宅地建物交易业 东京都知事（1）第108831号）\n〒111-0052 东京都台东区柳桥1丁目11番5号 柳桥大楼305号室\n联系：admin@ziyou-fudosan.com`,
  },
} as const

function textFor(locale: string) {
  return copy[locale as AlertLocale] ?? copy.en
}

export function criteriaLabel(criteria: AlertCriteria, locale: string): string {
  const parts = [
    criteria.ward ? wardLabel(criteria.ward, locale) : null,
    criteria.type ? TYPE_COLLECTIONS[criteria.type].label[locale as AlertLocale] ?? TYPE_COLLECTIONS[criteria.type].label.en : null,
    criteria.budget ? priceBandRange(budgetBand(criteria.budget)!, locale) : null,
  ].filter(Boolean)
  return parts.length ? parts.join(' / ') : textFor(locale).all
}

export interface AlertMail {
  subject: string
  text: string
}

export function buildConfirmMail(locale: string, criteria: AlertCriteria, confirmUrl: string): AlertMail {
  const text = textFor(locale)
  return { subject: text.confirmSubject, text: `${text.confirmBody(criteriaLabel(criteria, locale), confirmUrl)}\n\n--\n${text.footer}` }
}

export interface DigestItem {
  title: string
  price: string
  url: string
}

export function buildDigestMail(locale: string, criteria: AlertCriteria, items: DigestItem[], unsubscribeUrl: string): AlertMail {
  const text = textFor(locale)
  const lines = items.map((item) => `・${item.title}\n  ${item.price}\n  ${item.url}`)
  return {
    subject: text.digestSubject(items.length),
    text: `${text.digestIntro(criteriaLabel(criteria, locale))}\n\n${lines.join('\n\n')}\n\n${text.unsubscribe}: ${unsubscribeUrl}\n\n--\n${text.footer}`,
  }
}
