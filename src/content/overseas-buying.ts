import type { GuideSource } from './guides'

/**
 * "Buying from overseas": how the money moves and a checklist, for buyers living abroad.
 * Rules checked on 2026-10-07 against the Ministry of Justice (registration from 1 April 2024),
 * the National Tax Agency (No.2879), the Bank of Japan (payment reports over ¥30M), the Ministry
 * of Finance (acquisition report) and the AML handbook for real estate agents. Our company never
 * holds purchase money; currency exchange and transfers are done by banks or licensed providers.
 */

export interface OverseasStep { label: string; detail: string }
export interface ChecklistItem { id: string; label: string; href?: string }
export interface ChecklistGroup { id: string; title: string; items: ChecklistItem[] }
export interface OverseasFaq { question: string; answer: string }

export interface OverseasBuyingCopy {
  title: string
  description: string
  lead: string
  noHoldingTitle: string
  noHoldingBody: string
  flowTitle: string
  flowCaption: string
  flow: OverseasStep[]
  settlementTitle: string
  settlementIntro: string
  settlementOptions: OverseasStep[]
  remitTitle: string
  remitPoints: string[]
  checklistTitle: string
  checklistIntro: string
  /** Template with {done} and {total}; a string so it can be passed to the client checklist. */
  progress: string
  reset: string
  guideLink: string
  groups: ChecklistGroup[]
  faqTitle: string
  faq: OverseasFaq[]
  ctaTitle: string
  ctaBody: string
  costLink: string
  sources: GuideSource[]
}

const FX_GUIDE = '/guides/japan-property-foreign-exchange-report'
const TAX_GUIDE = '/guides/tokyo-fixed-asset-tax-city-planning-tax'
const RENT_GUIDE = '/guides/renting-out-tokyo-condo-from-overseas'

const SOURCES = {
  registration: 'https://www.moj.go.jp/MINJI/minji05_00589.html',
  addressProof: 'https://www.moj.go.jp/MINJI/minji05_00574.html',
  withholding: 'https://www.nta.go.jp/taxes/shiraberu/taxanswer/gensen/2879.htm',
  paymentReport: 'https://www.boj.or.jp/about/services/tame/t-houkoku.htm',
  acquisitionReport: 'https://www.mof.go.jp/policy/international_policy/gaitame_kawase/real_property/seido_gaiyo.html',
  aml: 'https://www.retpc.jp/wp-content/uploads/hansya/pdf/amlctf_hdbk_5th_01.pdf',
}

/** Item ids are shared by every language so a saved checklist survives a language switch. */
export const CHECKLIST_IDS = [
  'kyc-id', 'kyc-purpose', 'funds-source', 'pay-method', 'address-proof', 'domestic-contact', 'seller-nonresident',
  'remit-early', 'remit-name', 'remit-buffer', 'remit-report', 'remit-verify',
  'fx-report', 'tax-agent', 'management', 'insurance', 'rental',
] as const

export const overseasBuyingCopy: Record<'ja' | 'en' | 'zh-TW' | 'zh-CN', OverseasBuyingCopy> = {
  ja: {
    title: '海外から東京の不動産を買う：お金の流れとチェックリスト',
    description: '海外にお住まいの方が東京の物件を買うときの、お金の流れ（送金・決済・登記）と、契約前から引渡し後までのチェックリスト。外為法の報告、源泉徴収、登記の国内連絡先まで。',
    lead: '海外にお住まいでも、東京の不動産は購入できます。ただ、国際送金の日数や、登記・報告の書類など、国内の購入にはない準備があります。お金がいつ・どこへ動くのかと、やることの一覧をまとめました。',
    noHoldingTitle: '当社が購入代金を預かることはありません',
    noHoldingBody: 'お金は買主から売主（または決済のための口座）へ動きます。両替と送金は、銀行や資金移動業の登録を受けた送金会社が行います。送金先と金額は、必ず書面で確認してから送ってください。',
    flowTitle: 'お金と手続きの流れ',
    flowCaption: '申込みから引渡し後までの5ステップ',
    flow: [
      { label: '購入申込み・本人確認', detail: '物件が決まったら、本人確認書類と、取引の目的・職業などを確認します（法律で決められた確認です）。' },
      { label: '売買契約・手付金', detail: '重要事項の説明（オンライン可）を受けて契約し、手付金を支払います。支払方法は契約前に決めます。' },
      { label: '海外から送金', detail: '銀行や送金会社で円に両替して日本へ送ります。数営業日かかるため、決済日より前に余裕をもって着金させます。' },
      { label: '決済日', detail: '司法書士が登記の書類を確認し、同じ日に残代金を支払い、所有権移転の登記を申請します。' },
      { label: '引渡し後', detail: '非居住者は20日以内に外為法の報告をします。納税管理人の指定なども済ませます。' },
    ],
    settlementTitle: '決済（残代金の支払い）の方法',
    settlementIntro: '決済の方法は、売主・司法書士・金融機関と相談して、取引ごとに決めます。代表的な方法は次の2つです。',
    settlementOptions: [
      { label: '日本の銀行口座から支払う', detail: '日本に口座がある、または開設できる場合の方法です。決済日に、その口座から売主へ振り込みます。' },
      { label: '海外から決済用の口座へ事前に送金する', detail: '日本に口座がない場合によく使われる方法です。どの口座へ、いつまでに、いくら送るかを、司法書士・当社と書面で確認してから送ります。' },
    ],
    remitTitle: '送金で気をつけること',
    remitPoints: [
      '代金は円で支払います。両替する時点の為替で円の金額が変わるため、為替の動きと手数料の分の余裕をみて送ります。',
      '国際送金はふつう数営業日かかります。決済日の数営業日前までに着金するよう、送金日を銀行と確認します。',
      '送金は買主本人名義の口座から行います。本人以外からの送金は、確認に時間がかかることがあります。',
      '大きな金額の入金では、銀行から送金の目的や資金の出どころを聞かれることがあります。説明できる書類を手元に用意しておきます。',
      '3,000万円を超える支払・受領は、日本銀行への報告が必要になることがあります（銀行経由の取引は銀行を通じて提出）。',
      '「振込先が変わった」というメールには注意してください。口座の変更は、電話など別の方法で必ず確認します。',
    ],
    checklistTitle: 'チェックリスト',
    checklistIntro: 'チェックした内容は、このブラウザにだけ保存されます。',
    progress: '{total}項目中 {done}項目 完了',
    reset: 'チェックを外す',
    guideLink: 'くわしいガイド',
    groups: [
      { id: 'before', title: '契約の前', items: [
        { id: 'kyc-id', label: '本人確認書類（パスポートなど）を用意した' },
        { id: 'kyc-purpose', label: '購入の目的と職業を伝えられるようにした（法律で決められた確認）' },
        { id: 'funds-source', label: '資金の出どころを説明できる書類を用意した（預金残高、資産の売却代金の明細など）' },
        { id: 'pay-method', label: '手付金と残代金の支払方法・送金先を、書面で確認した' },
        { id: 'address-proof', label: '登記用の住所証明（本国政府の証明書、または公証人の証明書＋パスポートの写し）と日本語訳の準備を始めた' },
        { id: 'domestic-contact', label: '登記する国内連絡先を決めた（不動産会社や司法書士なども可）' },
        { id: 'seller-nonresident', label: '売主が非居住者か確認した（非居住者なら、買主が代金の10.21%を源泉徴収。個人が自分や家族の住まいとして1億円以下で買う場合を除く）' },
      ] },
      { id: 'remit', title: '送金', items: [
        { id: 'remit-early', label: '決済日の数営業日前までに着金するよう、送金日を決めた' },
        { id: 'remit-name', label: '買主本人名義の口座から送る' },
        { id: 'remit-buffer', label: '為替の動きと手数料の分、余裕をもって送る' },
        { id: 'remit-report', label: '3,000万円を超える場合の日本銀行への報告について、銀行・司法書士と確認した' },
        { id: 'remit-verify', label: '送金先の口座を、メール以外の方法でも確認した' },
      ] },
      { id: 'after', title: '引渡しの後', items: [
        { id: 'fx-report', label: '外為法の報告を出した（非居住者は取得後20日以内）', href: FX_GUIDE },
        { id: 'tax-agent', label: '納税管理人を決めて、都税事務所に申告した', href: TAX_GUIDE },
        { id: 'management', label: 'マンションの管理会社・管理組合に、所有者の変更と連絡先を届け出た' },
        { id: 'insurance', label: '火災保険に入った' },
        { id: 'rental', label: '貸すなら、管理会社と、家賃の源泉徴収（20.42%）・確定申告の段取りを決めた', href: RENT_GUIDE },
      ] },
    ],
    faqTitle: 'よくある質問',
    faq: [
      { question: '日本の銀行口座は必要ですか？', answer: '必須ではありません。日本に口座がない場合は、海外から決済用の口座へ事前に送金する方法などを、売主・司法書士・金融機関と相談して決めます。' },
      { question: 'ドルや人民元で支払えますか？', answer: '代金は円で支払います。両替は送金のときに銀行や送金会社で行います。サイトでは参考として外貨での概算も表示しています。' },
      { question: '送金にはどれくらいかかりますか？', answer: '国や銀行によりますが、ふつうは数営業日です。決済日の前に余裕をもって送ってください。' },
      { question: '自由不動産がお金を預かりますか？', answer: 'いいえ。当社は購入代金を預かりません。両替と送金は銀行や登録を受けた送金会社が行います。' },
      { question: '日本に来なくても買えますか？', answer: '多くの手続きは海外からでも進められ、重要事項の説明もオンラインで受けられます。住所証明などの書類は準備に時間がかかるため、早めに始めてください。' },
    ],
    ctaTitle: '海外からの購入をご相談ください',
    ctaBody: '日本語・英語・中国語で、物件探しから送金の段取り、引渡し後の手続きまでご案内します。',
    costLink: '購入にかかる費用を試算する',
    sources: [
      { label: '法務省：令和6年4月1日からの所有権の登記（国内連絡先・ローマ字氏名）', url: SOURCES.registration },
      { label: '法務省：海外に住む外国人等の住所証明情報', url: SOURCES.addressProof },
      { label: '国税庁 No.2879：非居住者等から土地等を購入したとき', url: SOURCES.withholding },
      { label: '日本銀行：支払又は支払の受領に関する報告書', url: SOURCES.paymentReport },
      { label: '財務省：本邦にある不動産の取得に関する報告', url: SOURCES.acquisitionReport },
      { label: '不動産流通推進センター：犯罪収益移転防止法ハンドブック（宅地建物取引業者向け）', url: SOURCES.aml },
    ],
  },
  en: {
    title: 'Buying Tokyo property from overseas: how the money moves, with a checklist',
    description: 'How money moves when you buy a Tokyo home from abroad (transfer, settlement, registration), and a checklist from before the contract to after handover: the FX Act report, withholding tax and the domestic contact for registration.',
    lead: 'You can buy property in Tokyo while living abroad. There is extra preparation compared with a local purchase, though: international transfers take days, and registration and reporting need documents. Here is when and where the money moves, and everything to do.',
    noHoldingTitle: 'We never hold your purchase money',
    noHoldingBody: 'Money moves from the buyer to the seller (or to an account set up for the settlement). Currency exchange and transfers are handled by banks or registered money transfer providers. Always confirm the receiving account and amount in writing before you send.',
    flowTitle: 'How the money and paperwork move',
    flowCaption: '5 steps from offer to after handover',
    flow: [
      { label: 'Offer and identity check', detail: 'Once you choose a home, we confirm your ID, the purpose of the purchase and your occupation, as Japanese law requires.' },
      { label: 'Contract and deposit', detail: 'After the disclosure briefing (available online) you sign and pay the deposit. The payment method is agreed before the contract.' },
      { label: 'Transfer from abroad', detail: 'Your bank or a transfer provider converts the money to yen and sends it to Japan. It takes a few business days, so plan for it to arrive well before settlement.' },
      { label: 'Settlement day', detail: 'A judicial scrivener checks the registration documents; on the same day the balance is paid and the ownership transfer is filed.' },
      { label: 'After handover', detail: 'Non-residents file the Foreign Exchange Act report within 20 days, and appoint a tax agent.' },
    ],
    settlementTitle: 'How the balance is paid at settlement',
    settlementIntro: 'The method is agreed for each purchase with the seller, the judicial scrivener and the banks. The two common ways:',
    settlementOptions: [
      { label: 'Pay from a Japanese bank account', detail: 'If you have, or can open, an account in Japan, you transfer from it to the seller on settlement day.' },
      { label: 'Send in advance to an account set up for the settlement', detail: 'Common when you have no Japanese account. Confirm in writing with the scrivener and us which account, by when and how much, before you send.' },
    ],
    remitTitle: 'Things to watch when you send money',
    remitPoints: [
      'The price is paid in yen. The yen amount depends on the exchange rate when you convert, so leave a margin for rate moves and fees.',
      'International transfers usually take a few business days. Check with your bank and plan for the money to arrive a few business days before settlement.',
      'Send from an account in the buyer’s own name. Transfers from someone else can take longer to clear.',
      'For large incoming amounts, the bank may ask about the purpose and source of the funds. Keep documents that explain them at hand.',
      'Payments or receipts over ¥30 million may need a report to the Bank of Japan (through the bank, when the payment goes through one).',
      'Beware of emails saying the bank details have changed. Always confirm any change by phone or another channel.',
    ],
    checklistTitle: 'Checklist',
    checklistIntro: 'Your ticks are saved in this browser only.',
    progress: '{done} of {total} done',
    reset: 'Clear ticks',
    guideLink: 'Read the guide',
    groups: [
      { id: 'before', title: 'Before the contract', items: [
        { id: 'kyc-id', label: 'Prepared my ID (passport or similar)' },
        { id: 'kyc-purpose', label: 'Ready to state the purpose of the purchase and my occupation (a legal requirement)' },
        { id: 'funds-source', label: 'Prepared documents showing where the money comes from (bank balances, proceeds of a sale, and so on)' },
        { id: 'pay-method', label: 'Confirmed in writing how and where the deposit and balance are paid' },
        { id: 'address-proof', label: 'Started on the address proof for registration (a government certificate, or a notary’s certificate plus a passport copy) and its Japanese translation' },
        { id: 'domestic-contact', label: 'Chose the domestic contact to register (a real estate company or scrivener is fine)' },
        { id: 'seller-nonresident', label: 'Checked whether the seller is a non-resident (if so, the buyer withholds 10.21% of the price, unless an individual buys a home for themselves or family for ¥100 million or less)' },
      ] },
      { id: 'remit', title: 'Sending the money', items: [
        { id: 'remit-early', label: 'Set a transfer date so the money arrives a few business days before settlement' },
        { id: 'remit-name', label: 'Sending from an account in the buyer’s own name' },
        { id: 'remit-buffer', label: 'Leaving a margin for exchange-rate moves and fees' },
        { id: 'remit-report', label: 'Checked the Bank of Japan report for amounts over ¥30 million with the bank and scrivener' },
        { id: 'remit-verify', label: 'Confirmed the receiving account by a channel other than email' },
      ] },
      { id: 'after', title: 'After handover', items: [
        { id: 'fx-report', label: 'Filed the Foreign Exchange Act report (non-residents, within 20 days)', href: FX_GUIDE },
        { id: 'tax-agent', label: 'Appointed a tax agent and reported it to the Tokyo tax office', href: TAX_GUIDE },
        { id: 'management', label: 'Told the building manager and owners’ association about the new owner and contact details' },
        { id: 'insurance', label: 'Took out fire insurance' },
        { id: 'rental', label: 'If renting out: arranged a property manager, rent withholding (20.42%) and the tax return', href: RENT_GUIDE },
      ] },
    ],
    faqTitle: 'FAQ',
    faq: [
      { question: 'Do I need a Japanese bank account?', answer: 'No. Without one, you can send the money in advance to an account set up for the settlement, agreed with the seller, the scrivener and the banks.' },
      { question: 'Can I pay in US dollars or yuan?', answer: 'The price is paid in yen. Your bank or transfer provider converts it when you send. The site shows approximate foreign-currency prices for reference.' },
      { question: 'How long does a transfer take?', answer: 'Usually a few business days, depending on the country and bank. Send well before settlement.' },
      { question: 'Does Ziyou Real Estate hold the money?', answer: 'No. We never hold purchase money. Banks or registered transfer providers handle exchange and transfers.' },
      { question: 'Can I buy without coming to Japan?', answer: 'Most steps can be done from abroad, and the disclosure briefing can be online. Documents such as the address proof take time, so start early.' },
    ],
    ctaTitle: 'Planning to buy from overseas? Talk to us',
    ctaBody: 'In English, Chinese or Japanese: from finding a home to planning the transfer and the steps after handover.',
    costLink: 'Estimate the purchase costs',
    sources: [
      { label: 'Ministry of Justice: ownership registration from 1 April 2024 (domestic contact, romanised names; Japanese)', url: SOURCES.registration },
      { label: 'Ministry of Justice: address proof for foreigners living abroad (Japanese)', url: SOURCES.addressProof },
      { label: 'National Tax Agency No.2879: buying land from a non-resident (Japanese)', url: SOURCES.withholding },
      { label: 'Bank of Japan: payment and receipt reports (Japanese)', url: SOURCES.paymentReport },
      { label: 'Ministry of Finance: report on acquiring property in Japan (Japanese)', url: SOURCES.acquisitionReport },
      { label: 'Real Estate Transaction Promotion Center: AML handbook for real estate agents (Japanese)', url: SOURCES.aml },
    ],
  },
  'zh-TW': {
    title: '從海外購買東京不動產：資金流向與檢查清單',
    description: '住在海外的人購買東京物件時的資金流向（匯款、交割、登記），以及從簽約前到交屋後的檢查清單：外匯法報告、預扣稅、登記的日本國內聯絡人。',
    lead: '即使住在海外，也能購買東京的不動產。不過與在日本購買相比，還需要額外準備，例如國際匯款需要數天，登記與報告也需要文件。以下整理資金何時、流向何處，以及該做的事項。',
    noHoldingTitle: '本公司不會代管購屋款',
    noHoldingBody: '資金由買方直接流向賣方（或為交割設定的帳戶）。換匯與匯款由銀行或已登記的資金移動業者辦理。匯款前，請務必以書面確認收款帳戶與金額。',
    flowTitle: '資金與手續的流程',
    flowCaption: '從申請到交屋後的5個步驟',
    flow: [
      { label: '購買申請與身分確認', detail: '決定物件後，依日本法律確認身分證明文件、購買目的與職業等。' },
      { label: '簽約與訂金', detail: '聽取重要事項說明（可線上進行）後簽約並支付訂金。付款方式於簽約前決定。' },
      { label: '從海外匯款', detail: '由銀行或匯款業者換成日圓匯至日本。需要數個營業日，請在交割日前預留充裕時間到帳。' },
      { label: '交割日', detail: '司法書士確認登記文件，同日支付尾款並申請所有權移轉登記。' },
      { label: '交屋後', detail: '非居住者須在20天內提出外匯法報告，並指定納稅管理人等。' },
    ],
    settlementTitle: '交割（支付尾款）的方式',
    settlementIntro: '交割方式依每筆交易，與賣方、司法書士及金融機構商量決定。常見方式有以下兩種：',
    settlementOptions: [
      { label: '從日本的銀行帳戶支付', detail: '適用於在日本有帳戶或可開戶的情形。交割日從該帳戶轉帳給賣方。' },
      { label: '事先從海外匯至交割用帳戶', detail: '在日本沒有帳戶時常用的方式。匯款前，請與司法書士及本公司以書面確認匯入哪個帳戶、期限與金額。' },
    ],
    remitTitle: '匯款注意事項',
    remitPoints: [
      '價款以日圓支付。換匯當時的匯率會影響日圓金額，請預留匯率變動與手續費的空間。',
      '國際匯款通常需要數個營業日。請向銀行確認，讓款項在交割日前數個營業日到帳。',
      '請從買方本人名義的帳戶匯款。由他人匯款可能需要較長的確認時間。',
      '大額入帳時，銀行可能詢問匯款目的與資金來源。請備妥可說明的文件。',
      '超過3,000萬日圓的支付或收款，可能須向日本銀行報告（經由銀行的交易透過銀行提出）。',
      '請小心「收款帳戶已變更」的電子郵件。帳戶變更務必以電話等其他方式確認。',
    ],
    checklistTitle: '檢查清單',
    checklistIntro: '勾選的內容只會儲存在這個瀏覽器中。',
    progress: '{total}項中已完成{done}項',
    reset: '清除勾選',
    guideLink: '閱讀指南',
    groups: [
      { id: 'before', title: '簽約前', items: [
        { id: 'kyc-id', label: '已準備身分證明文件（護照等）' },
        { id: 'kyc-purpose', label: '已能說明購買目的與職業（法律規定的確認）' },
        { id: 'funds-source', label: '已準備可說明資金來源的文件（存款餘額、資產出售款明細等）' },
        { id: 'pay-method', label: '已以書面確認訂金與尾款的付款方式及收款帳戶' },
        { id: 'address-proof', label: '已開始準備登記用的住址證明（本國政府的證明書，或公證人證明書＋護照影本）及日文翻譯' },
        { id: 'domestic-contact', label: '已決定要登記的日本國內聯絡人（可由不動產公司或司法書士擔任）' },
        { id: 'seller-nonresident', label: '已確認賣方是否為非居住者（若是，買方須預扣價款的10.21%；個人為自己或家人居住而以1億日圓以下購買者除外）' },
      ] },
      { id: 'remit', title: '匯款', items: [
        { id: 'remit-early', label: '已決定匯款日，讓款項在交割日前數個營業日到帳' },
        { id: 'remit-name', label: '從買方本人名義的帳戶匯款' },
        { id: 'remit-buffer', label: '預留匯率變動與手續費的空間' },
        { id: 'remit-report', label: '已與銀行及司法書士確認超過3,000萬日圓時的日本銀行報告' },
        { id: 'remit-verify', label: '已用電子郵件以外的方式確認收款帳戶' },
      ] },
      { id: 'after', title: '交屋後', items: [
        { id: 'fx-report', label: '已提出外匯法報告（非居住者須在取得後20天內）', href: FX_GUIDE },
        { id: 'tax-agent', label: '已指定納稅管理人並向都稅事務所申報', href: TAX_GUIDE },
        { id: 'management', label: '已向公寓管理公司與管理組合通知所有人變更與聯絡方式' },
        { id: 'insurance', label: '已投保火災保險' },
        { id: 'rental', label: '若要出租：已安排管理公司、租金預扣（20.42%）與報稅', href: RENT_GUIDE },
      ] },
    ],
    faqTitle: '常見問題',
    faq: [
      { question: '需要日本的銀行帳戶嗎？', answer: '不一定。沒有帳戶時，可與賣方、司法書士及金融機構商量，事先從海外匯至交割用帳戶等。' },
      { question: '可以用美元或人民幣支付嗎？', answer: '價款以日圓支付，於匯款時由銀行或匯款業者換匯。網站上也會顯示外幣概算供參考。' },
      { question: '匯款需要多久？', answer: '依國家與銀行而定，通常為數個營業日。請在交割日前預留充裕時間。' },
      { question: '自由不動產會代管款項嗎？', answer: '不會。本公司不代管購屋款，換匯與匯款由銀行或已登記的匯款業者辦理。' },
      { question: '不來日本也能購買嗎？', answer: '多數手續可在海外進行，重要事項說明也可線上進行。住址證明等文件需要時間準備，請及早開始。' },
    ],
    ctaTitle: '歡迎諮詢從海外購屋',
    ctaBody: '以中文、日文、英文說明，從找房、安排匯款到交屋後的手續。',
    costLink: '試算購屋費用',
    sources: [
      { label: '法務省：2024年4月1日起的所有權登記（國內聯絡人、羅馬字姓名，日文）', url: SOURCES.registration },
      { label: '法務省：居住海外的外國人等的住址證明（日文）', url: SOURCES.addressProof },
      { label: '國稅廳 No.2879：向非居住者購買土地等時（日文）', url: SOURCES.withholding },
      { label: '日本銀行：支付或收款報告書（日文）', url: SOURCES.paymentReport },
      { label: '財務省：取得日本境內不動產之報告（日文）', url: SOURCES.acquisitionReport },
      { label: '不動產流通推進中心：犯罪收益移轉防止法手冊（不動產業者用，日文）', url: SOURCES.aml },
    ],
  },
  'zh-CN': {
    title: '从海外购买东京房产：资金流向与检查清单',
    description: '住在海外的人购买东京房产时的资金流向（汇款、交割、登记），以及从签约前到交房后的检查清单：外汇法报告、预扣税、登记的日本国内联系人。',
    lead: '即使住在海外，也可以购买东京的房产。不过和在日本购买相比，还需要额外准备，比如国际汇款需要几天，登记和报告也需要材料。下面整理资金何时、流向哪里，以及要做的事。',
    noHoldingTitle: '本公司不会代管购房款',
    noHoldingBody: '资金由买方直接流向卖方（或为交割设立的账户）。换汇和汇款由银行或已登记的资金移动业者办理。汇款前，请务必书面确认收款账户和金额。',
    flowTitle: '资金与手续的流程',
    flowCaption: '从申请到交房后的5个步骤',
    flow: [
      { label: '购买申请与身份确认', detail: '确定房源后，依据日本法律确认身份证件、购买目的和职业等。' },
      { label: '签约与定金', detail: '听取重要事项说明（可线上进行）后签约并支付定金。付款方式在签约前确定。' },
      { label: '从海外汇款', detail: '由银行或汇款业者换成日元汇到日本。需要几个工作日，请在交割日前留出充足的到账时间。' },
      { label: '交割日', detail: '司法书士确认登记材料，同一天支付尾款并申请所有权转移登记。' },
      { label: '交房后', detail: '非居住者须在20天内提交外汇法报告，并指定纳税管理人等。' },
    ],
    settlementTitle: '交割（支付尾款）的方式',
    settlementIntro: '交割方式按每笔交易，与卖方、司法书士和金融机构商量决定。常见方式有以下两种：',
    settlementOptions: [
      { label: '从日本的银行账户支付', detail: '适用于在日本有账户或可以开户的情况。交割日从该账户转账给卖方。' },
      { label: '事先从海外汇到交割用账户', detail: '在日本没有账户时常用的方式。汇款前，请与司法书士和本公司书面确认汇入哪个账户、截止时间和金额。' },
    ],
    remitTitle: '汇款注意事项',
    remitPoints: [
      '房款以日元支付。换汇时的汇率会影响日元金额，请预留汇率变动和手续费的余量。',
      '国际汇款通常需要几个工作日。请向银行确认，让款项在交割日前几个工作日到账。',
      '请从买方本人名下的账户汇款。由他人汇款可能需要更长的确认时间。',
      '大额入账时，银行可能会询问汇款目的和资金来源。请备好可以说明的材料。',
      '超过3,000万日元的支付或收款，可能需要向日本银行报告（经由银行的交易通过银行提交）。',
      '请警惕"收款账户已变更"的邮件。账户变更务必通过电话等其他方式确认。',
    ],
    checklistTitle: '检查清单',
    checklistIntro: '勾选的内容只保存在这个浏览器里。',
    progress: '{total}项中已完成{done}项',
    reset: '清除勾选',
    guideLink: '阅读指南',
    groups: [
      { id: 'before', title: '签约前', items: [
        { id: 'kyc-id', label: '已准备身份证件（护照等）' },
        { id: 'kyc-purpose', label: '已能说明购买目的和职业（法律规定的确认）' },
        { id: 'funds-source', label: '已准备可以说明资金来源的材料（存款余额、资产出售款明细等）' },
        { id: 'pay-method', label: '已书面确认定金和尾款的付款方式及收款账户' },
        { id: 'address-proof', label: '已开始准备登记用的住址证明（本国政府的证明书，或公证人证明书＋护照复印件）及日文翻译' },
        { id: 'domestic-contact', label: '已确定要登记的日本国内联系人（可以由房产公司或司法书士担任）' },
        { id: 'seller-nonresident', label: '已确认卖方是否为非居住者（如果是，买方须预扣房款的10.21%；个人为自己或家人居住以1亿日元以下购买的除外）' },
      ] },
      { id: 'remit', title: '汇款', items: [
        { id: 'remit-early', label: '已确定汇款日，让款项在交割日前几个工作日到账' },
        { id: 'remit-name', label: '从买方本人名下的账户汇款' },
        { id: 'remit-buffer', label: '预留汇率变动和手续费的余量' },
        { id: 'remit-report', label: '已与银行和司法书士确认超过3,000万日元时的日本银行报告' },
        { id: 'remit-verify', label: '已通过邮件以外的方式确认收款账户' },
      ] },
      { id: 'after', title: '交房后', items: [
        { id: 'fx-report', label: '已提交外汇法报告（非居住者须在取得后20天内）', href: FX_GUIDE },
        { id: 'tax-agent', label: '已指定纳税管理人并向都税事务所申报', href: TAX_GUIDE },
        { id: 'management', label: '已向公寓管理公司和管理组合通知所有人变更和联系方式' },
        { id: 'insurance', label: '已购买火灾保险' },
        { id: 'rental', label: '如果出租：已安排管理公司、租金预扣（20.42%）和报税', href: RENT_GUIDE },
      ] },
    ],
    faqTitle: '常见问题',
    faq: [
      { question: '需要日本的银行账户吗？', answer: '不一定。没有账户时，可以与卖方、司法书士和金融机构商量，事先从海外汇到交割用账户等。' },
      { question: '可以用美元或人民币支付吗？', answer: '房款以日元支付，汇款时由银行或汇款业者换汇。网站上也显示外币概算供参考。' },
      { question: '汇款需要多久？', answer: '因国家和银行而异，通常是几个工作日。请在交割日前留出充足时间。' },
      { question: '自由不动产会代管款项吗？', answer: '不会。本公司不代管购房款，换汇和汇款由银行或已登记的汇款业者办理。' },
      { question: '不来日本也能买吗？', answer: '大部分手续可以在海外进行，重要事项说明也可以线上进行。住址证明等材料需要时间准备，请尽早开始。' },
    ],
    ctaTitle: '欢迎咨询从海外买房',
    ctaBody: '用中文、日语、英语为您说明，从找房、安排汇款到交房后的手续。',
    costLink: '试算购房费用',
    sources: [
      { label: '法务省：2024年4月1日起的所有权登记（国内联系人、罗马字姓名，日文）', url: SOURCES.registration },
      { label: '法务省：居住海外的外国人等的住址证明（日文）', url: SOURCES.addressProof },
      { label: '国税厅 No.2879：从非居住者处购买土地等时（日文）', url: SOURCES.withholding },
      { label: '日本银行：支付或收款报告书（日文）', url: SOURCES.paymentReport },
      { label: '财务省：取得日本境内不动产的报告（日文）', url: SOURCES.acquisitionReport },
      { label: '不动产流通推进中心：犯罪收益转移防止法手册（房产业者用，日文）', url: SOURCES.aml },
    ],
  },
}

export function overseasBuyingFor(locale: string): OverseasBuyingCopy {
  return overseasBuyingCopy[locale as keyof typeof overseasBuyingCopy] ?? overseasBuyingCopy.en
}
