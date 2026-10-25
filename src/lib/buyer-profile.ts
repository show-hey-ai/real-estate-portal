/**
 * Who is asking, collected before every enquiry (owner decision 2026-10-25): where the buyer lives,
 * nationality, individual or company, how they will pay and why they buy. The answers go at the top of
 * the prefilled chat or email; nothing is sent to our servers.
 */
export const PROFILE_QUESTIONS = ['buyer', 'nationality', 'residence', 'funding', 'purpose'] as const
export type ProfileQuestion = (typeof PROFILE_QUESTIONS)[number]
export type BuyerProfile = Partial<Record<ProfileQuestion, string>>

export const PROFILE_OPTIONS: Record<ProfileQuestion, readonly string[]> = {
  residence: ['japan', 'overseas'],
  nationality: ['japanese', 'foreign'],
  buyer: ['individual', 'company-jp', 'company-foreign'],
  funding: ['loan', 'cash', 'undecided'],
  purpose: ['live', 'invest', 'undecided'],
}

interface ProfileCopy {
  title: string
  note: string
  missing: string
  heading: string
  questions: Record<ProfileQuestion, string>
  options: Record<ProfileQuestion, Record<string, string>>
}

const ja: ProfileCopy = {
  title: 'ご購入者について（必須）',
  note: 'ご状況に合わせてご案内するため、送信前に選んでください。選んだ内容はメッセージに入ります。',
  missing: '先に「ご購入者について」の質問にすべて答えてください。',
  heading: '【購入者情報】',
  questions: { residence: 'お住まい（法人は所在地）', nationality: '国籍（法人は代表者）', buyer: '購入名義', funding: '資金', purpose: '目的' },
  options: {
    residence: { japan: '日本', overseas: '海外' },
    nationality: { japanese: '日本人', foreign: '外国人' },
    buyer: { individual: '個人', 'company-jp': '国内法人', 'company-foreign': '外国法人' },
    funding: { loan: 'ローンを使う', cash: '現金（ローンなし）', undecided: '未定' },
    purpose: { live: '自分で住む', invest: '賃貸・投資', undecided: '未定' },
  },
}

const en: ProfileCopy = {
  title: 'About you (required)',
  note: 'Please choose before sending so we can advise on your situation. Your answers are added to the message.',
  missing: 'Please answer all the “About you” questions first.',
  heading: '[About me]',
  questions: { residence: 'Based in', nationality: 'Nationality (for a company, its representative)', buyer: 'Buying as', funding: 'Funding', purpose: 'Purpose' },
  options: {
    residence: { japan: 'Japan', overseas: 'Outside Japan' },
    nationality: { japanese: 'Japanese', foreign: 'Not Japanese' },
    buyer: { individual: 'An individual', 'company-jp': 'A Japanese company', 'company-foreign': 'A foreign company' },
    funding: { loan: 'With a loan', cash: 'Cash (no loan)', undecided: 'Undecided' },
    purpose: { live: 'To live in', invest: 'To rent out / invest', undecided: 'Undecided' },
  },
}

const zhTW: ProfileCopy = {
  title: '關於購買者（必填）',
  note: '為了依您的狀況說明，請在傳送前選擇。所選內容會加入訊息中。',
  missing: '請先回答「關於購買者」的所有問題。',
  heading: '【購買者資訊】',
  questions: { residence: '居住地（法人為所在地）', nationality: '國籍（法人為代表人）', buyer: '購買名義', funding: '資金', purpose: '目的' },
  options: {
    residence: { japan: '日本', overseas: '海外' },
    nationality: { japanese: '日本人', foreign: '外國人' },
    buyer: { individual: '個人', 'company-jp': '日本法人', 'company-foreign': '外國法人' },
    funding: { loan: '使用貸款', cash: '現金（不貸款）', undecided: '未定' },
    purpose: { live: '自住', invest: '出租・投資', undecided: '未定' },
  },
}

const zhCN: ProfileCopy = {
  title: '关于购买者（必填）',
  note: '为了根据您的情况说明，请在发送前选择。所选内容会加入消息中。',
  missing: '请先回答“关于购买者”的所有问题。',
  heading: '【购买者信息】',
  questions: { residence: '居住地（法人为所在地）', nationality: '国籍（法人为代表人）', buyer: '购买名义', funding: '资金', purpose: '目的' },
  options: {
    residence: { japan: '日本', overseas: '海外' },
    nationality: { japanese: '日本人', foreign: '外国人' },
    buyer: { individual: '个人', 'company-jp': '日本法人', 'company-foreign': '外国法人' },
    funding: { loan: '使用贷款', cash: '现金（不贷款）', undecided: '未定' },
    purpose: { live: '自住', invest: '出租・投资', undecided: '未定' },
  },
}

export function getProfileCopy(locale: string): ProfileCopy {
  return locale === 'ja' ? ja : locale === 'zh-TW' ? zhTW : locale === 'zh-CN' ? zhCN : en
}

export function isProfileComplete(profile: BuyerProfile): boolean {
  return PROFILE_QUESTIONS.every((question) => PROFILE_OPTIONS[question].includes(profile[question] ?? ''))
}

/** The answers as message lines, e.g. "【購入者情報】\nお住まい：海外に住んでいる\n…". */
export function profileText(profile: BuyerProfile, locale: string): string {
  const copy = getProfileCopy(locale)
  const separator = locale === 'en' ? ': ' : '：'
  return [copy.heading, ...PROFILE_QUESTIONS.map((question) => `${copy.questions[question]}${separator}${copy.options[question][profile[question] ?? ''] ?? '-'}`)].join('\n')
}

/** Saved answers from the visitor's browser; anything unexpected is dropped. */
export function parseStoredProfile(raw: string | null): BuyerProfile {
  try {
    const value: unknown = raw ? JSON.parse(raw) : {}
    if (!value || typeof value !== 'object') return {}
    return Object.fromEntries(PROFILE_QUESTIONS.flatMap((question) => {
      const answer = (value as Record<string, unknown>)[question]
      return typeof answer === 'string' && PROFILE_OPTIONS[question].includes(answer) ? [[question, answer]] : []
    }))
  } catch {
    return {}
  }
}

export const PROFILE_STORAGE_KEY = 'ziyou:buyer-profile:v1'
