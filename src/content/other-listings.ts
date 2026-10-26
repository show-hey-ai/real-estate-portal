/**
 * "Found it on another site?" page: buyers paste a SUUMO / HOME'S / at home link and send it to us
 * by chat or email. We never fetch or republish the other site's content (their terms forbid it);
 * the owner checks each property by hand.
 */
export interface OtherListingsCopy {
  metaTitle: string
  metaDescription: string
  eyebrow: string
  title: string
  lead: string
  stepsTitle: string
  steps: [string, string][]
  formTitle: string
  urlLabel: string
  urlPlaceholder: string
  urlInvalid: string
  topicsLabel: string
  topics: string[]
  sendVia: string
  whatsapp: string
  line: string
  wechat: string
  email: string
  wechatCopied: string
  message: (url: string, topics: string[]) => string
  subject: string
  notesTitle: string
  notes: string[]
  entryTitle: string
  entryBody: string
}

const ja: OtherListingsCopy = {
  metaTitle: 'SUUMO・HOME\'Sなど他社サイトの物件も相談できます｜Welcome Home Tokyo',
  metaDescription: '他社サイトで見つけた東京の売買物件のURLを送るだけ。物件の確認、内見、購入手続きまで、日本語・英語・中国語でお手伝いします。登録不要。',
  eyebrow: '他社サイトの物件',
  title: '他社サイトで見つけた物件も、相談できます',
  lead: 'SUUMO・LIFULL HOME\'S・アットホームなどで見つけた東京の売買物件のURLを送ってください。物件の確認から内見、購入の手続きまで、日本語・英語・中国語でお手伝いします。',
  stepsTitle: '相談の流れ',
  steps: [
    ['URLと知りたいことを送る', '下の欄にURLを貼り、LINE・WhatsApp・WeChat・メールのどれかで送ってください。登録は不要です。'],
    ['当社が物件を確認', '売出し中かどうか、当社からご紹介できるか、追加の資料や写真が手に入るかを確認してご連絡します。'],
    ['内見・購入をサポート', '内見の手配、価格の相談、契約や外国籍の方の手続きまで、ご希望の言語でご案内します。'],
  ],
  formTitle: '物件のURLを送る',
  urlLabel: '物件ページのURL',
  urlPlaceholder: 'https://suumo.jp/…',
  urlInvalid: 'https:// から始まるURLを入れてください',
  topicsLabel: '知りたいこと（いくつでも）',
  topics: ['内見したい', 'まだ売出し中か知りたい', '詳しい資料・写真がほしい', '価格や条件を相談したい', '外国籍・海外在住でも買えるか'],
  sendVia: '送る方法を選んでください',
  whatsapp: 'WhatsAppで送る',
  line: 'LINEで送る',
  wechat: 'WeChatで送る',
  email: 'メールで送る',
  wechatCopied: '送る内容をコピーしました。WeChatが開いたら、トークに貼り付けて送ってください。',
  message: (url, topics) => ['他社サイトで見つけた物件について相談したいです。', `URL：${url}`, topics.length ? `知りたいこと：${topics.join('、')}` : ''].filter(Boolean).join('\n'),
  subject: '他社サイトの物件について',
  notesTitle: 'ご了承ください',
  notes: [
    '売主が直接販売する新築物件など、当社からご紹介できない物件もあります。その場合も理由をお伝えします。',
    '当社がご紹介・仲介する場合は、買主様から仲介手数料（宅地建物取引業法の上限の範囲内）をいただきます。金額は事前にお伝えします。',
    'お送りいただいたURLやご質問は、このご相談の対応にだけ使います。',
  ],
  entryTitle: '他社サイトで見つけた物件も相談できます',
  entryBody: 'SUUMOなどの物件URLを送るだけ。日本語・英語・中国語で確認から購入までお手伝いします。',
}

const en: OtherListingsCopy = {
  metaTitle: 'Found a Tokyo property on SUUMO or another site? Ask us | Welcome Home Tokyo',
  metaDescription: 'Send us the link to any Tokyo property for sale on SUUMO, LIFULL HOME\'S or at home. We check it, arrange viewings and help you buy, in English, Japanese or Chinese. No sign-up.',
  eyebrow: 'Properties on other sites',
  title: 'Found a property on another site? We can help you buy it',
  lead: 'Send us the link to a Tokyo property for sale on SUUMO, LIFULL HOME\'S, at home or any other site. We check it, arrange viewings and guide you through the purchase in English, Japanese or Chinese.',
  stepsTitle: 'How it works',
  steps: [
    ['Send the link and your questions', 'Paste the link below and send it by WhatsApp, LINE, WeChat or email. No sign-up needed.'],
    ['We check the property', 'We confirm it is still for sale, whether we can introduce it to you, and whether more documents or photos are available.'],
    ['We help you view and buy', 'Viewings, price questions, the contract and the steps for foreign buyers, in your language.'],
  ],
  formTitle: 'Send a property link',
  urlLabel: 'Link to the property page',
  urlPlaceholder: 'https://suumo.jp/…',
  urlInvalid: 'Enter a link starting with https://',
  topicsLabel: 'What would you like to know? (any)',
  topics: ['I want to view it', 'Is it still for sale?', 'More documents and photos', 'Price or terms', 'Can I buy as a foreigner or from overseas?'],
  sendVia: 'Choose how to send it',
  whatsapp: 'Send on WhatsApp',
  line: 'Send on LINE',
  wechat: 'Send on WeChat',
  email: 'Send by email',
  wechatCopied: 'Your message is copied. When WeChat opens, paste it into the chat and send.',
  message: (url, topics) => ['I found a property on another site and would like to ask about it.', `Link: ${url}`, topics.length ? `I'd like to know: ${topics.join(', ')}` : ''].filter(Boolean).join('\n'),
  subject: 'A property on another site',
  notesTitle: 'Please note',
  notes: [
    'Some properties cannot be introduced through us, such as new homes sold directly by the developer. We will tell you why.',
    'If we introduce or broker a property for you, we charge the buyer a brokerage fee within the legal maximum. We tell you the amount in advance.',
    'We use the link and questions you send only to answer this inquiry.',
  ],
  entryTitle: 'Found a property on another site?',
  entryBody: 'Send us the SUUMO (or other) link. We check it and help you buy, in English, Japanese or Chinese.',
}

const zhTW: OtherListingsCopy = {
  metaTitle: '在SUUMO等其他網站看到的物件也能諮詢｜Welcome Home Tokyo',
  metaDescription: '只要傳送在SUUMO、LIFULL HOME\'S、at home等網站看到的東京待售物件網址，我們以中文、日文、英文協助確認物件、安排看房到購買手續。免註冊。',
  eyebrow: '其他網站的物件',
  title: '在其他網站看到的物件，也能找我們諮詢',
  lead: '請傳送在SUUMO、LIFULL HOME\'S、at home等網站看到的東京待售物件網址。從確認物件、安排看房到購買手續，我們以中文、日文、英文協助您。',
  stepsTitle: '諮詢流程',
  steps: [
    ['傳送網址與想了解的事', '在下方貼上網址，透過LINE、WhatsApp、WeChat或電子郵件傳送即可，免註冊。'],
    ['我們確認物件', '確認是否仍在出售、本公司能否介紹，以及能否取得更多資料或照片，再與您聯絡。'],
    ['協助看房與購買', '安排看房、價格諮詢、簽約與外國人購屋手續，都以您習慣的語言說明。'],
  ],
  formTitle: '傳送物件網址',
  urlLabel: '物件頁面網址',
  urlPlaceholder: 'https://suumo.jp/…',
  urlInvalid: '請輸入以 https:// 開頭的網址',
  topicsLabel: '想了解的事（可複選）',
  topics: ['想看房', '是否仍在出售', '想要更詳細的資料與照片', '想討論價格或條件', '外國人或海外居住者能否購買'],
  sendVia: '請選擇傳送方式',
  whatsapp: '用WhatsApp傳送',
  line: '用LINE傳送',
  wechat: '用微信傳送',
  email: '用電子郵件傳送',
  wechatCopied: '已複製訊息內容。微信開啟後，請貼到對話中傳送。',
  message: (url, topics) => ['我在其他網站看到一個物件，想諮詢。', `網址：${url}`, topics.length ? `想了解：${topics.join('、')}` : ''].filter(Boolean).join('\n'),
  subject: '其他網站的物件',
  notesTitle: '注意事項',
  notes: [
    '部分物件（如建商直接銷售的新建物件）本公司無法介紹，屆時也會說明原因。',
    '由本公司介紹或仲介時，將向買方收取仲介手續費（在宅地建物取引業法上限範圍內），金額會事先告知。',
    '您傳送的網址與問題僅用於本次諮詢。',
  ],
  entryTitle: '在其他網站看到的物件也能諮詢',
  entryBody: '只要傳送SUUMO等網站的物件網址，我們以中文、日文、英文協助確認到購買。',
}

const zhCN: OtherListingsCopy = {
  ...zhTW,
  metaTitle: '在SUUMO等其他网站看到的房源也能咨询｜Welcome Home Tokyo',
  metaDescription: '只要发送在SUUMO、LIFULL HOME\'S、at home等网站看到的东京在售房源链接，我们用中文、日语、英语协助确认房源、安排看房到购买手续。免注册。',
  eyebrow: '其他网站的房源',
  title: '在其他网站看到的房源，也能找我们咨询',
  lead: '请发送在SUUMO、LIFULL HOME\'S、at home等网站看到的东京在售房源链接。从确认房源、安排看房到购买手续，我们用中文、日语、英语协助您。',
  stepsTitle: '咨询流程',
  steps: [
    ['发送链接和想了解的事', '在下方粘贴链接，通过微信、WhatsApp、LINE或邮件发送即可，免注册。'],
    ['我们确认房源', '确认是否仍在出售、本公司能否介绍，以及能否取得更多资料或照片，再与您联系。'],
    ['协助看房与购买', '安排看房、价格咨询、签约和外国人购房手续，都用您习惯的语言说明。'],
  ],
  formTitle: '发送房源链接',
  urlLabel: '房源页面链接',
  urlInvalid: '请输入以 https:// 开头的链接',
  topicsLabel: '想了解的事（可多选）',
  topics: ['想看房', '是否仍在出售', '想要更详细的资料和照片', '想商量价格或条件', '外国人或海外居住者能否购买'],
  sendVia: '请选择发送方式',
  whatsapp: '用WhatsApp发送',
  line: '用LINE发送',
  wechat: '用微信发送',
  email: '用邮件发送',
  wechatCopied: '已复制消息内容。微信打开后，请粘贴到对话中发送。',
  message: (url, topics) => ['我在其他网站看到一个房源，想咨询。', `链接：${url}`, topics.length ? `想了解：${topics.join('、')}` : ''].filter(Boolean).join('\n'),
  subject: '其他网站的房源',
  notesTitle: '注意事项',
  notes: [
    '部分房源（如开发商直销的新建房源）本公司无法介绍，届时也会说明原因。',
    '由本公司介绍或居间时，将向买方收取中介费（在宅地建物取引业法上限范围内），金额会事先告知。',
    '您发送的链接和问题仅用于本次咨询。',
  ],
  entryTitle: '在其他网站看到的房源也能咨询',
  entryBody: '只要发送SUUMO等网站的房源链接，我们用中文、日语、英语协助确认到购买。',
}

export function getOtherListingsCopy(locale: string): OtherListingsCopy {
  return locale === 'ja' ? ja : locale === 'zh-TW' ? zhTW : locale === 'zh-CN' ? zhCN : en
}

/** A link the visitor pasted: http(s) only, trimmed, at most 500 characters. */
export function cleanListingUrl(value: string): string | null {
  const trimmed = value.trim()
  if (trimmed.length > 500) return null
  try {
    const url = new URL(trimmed)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null
  } catch {
    return null
  }
}
