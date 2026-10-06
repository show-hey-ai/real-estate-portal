import type { Locale } from '@/i18n/config'
import type { GuideCase } from './guides'

/**
 * Typical situations international buyers run into, written as illustrative cases.
 * They are labelled on the page as composites, never presented as our own deals;
 * replace with real, anonymised cases from our transactions when available.
 */
export const guideCases: Record<string, Partial<Record<Locale, GuideCase[]>>> = {
  'buying-property-japan-visa': {
    ja: [
      { title: '送金が決済日に間に合わない', situation: '海外在住のAさんは、決済の数日前に海外送金を始めました。送金元の銀行で本人確認と資金の出どころの確認に時間がかかり、決済日に入金が間に合わない恐れが出ました。', lesson: '契約の時点で送金ルートと所要日数を確認し、決済日の1〜2週間前には送金を始める。資金の出どころを示す書類も先に用意しておく。' },
      { title: '印鑑証明の代わりの書類が間に合わない', situation: '日本に住民登録のないBさんは、印鑑証明が用意できないことを決済の直前に知りました。代わりのサイン証明は在外公館の予約が必要で、取得まで2週間かかりました。', lesson: '購入を決めた段階で、サイン証明や宣誓供述書など必要書類の一覧を司法書士に確認し、早めに予約する。' },
    ],
    en: [
      { title: 'The transfer does not arrive in time', situation: 'A buyer living abroad started the international transfer a few days before closing. The sending bank took time over identity and source-of-funds checks, and the money nearly missed the closing date.', lesson: 'Confirm the transfer route and timing at the contract, start the transfer one to two weeks before closing, and prepare source-of-funds documents early.' },
      { title: 'The seal certificate replacement is late', situation: 'A buyer with no Japanese resident registration learned just before closing that they could not provide a seal certificate. The replacement signature certificate needed an embassy appointment and took two weeks.', lesson: 'Once you decide to buy, ask the judicial scrivener for the full list of documents (signature certificate, sworn statement) and book appointments early.' },
    ],
    'zh-TW': [
      { title: '匯款趕不上交割日', situation: '居住海外的A先生在交割前幾天才開始海外匯款。匯出銀行的身分與資金來源確認耗時，差點趕不上交割日。', lesson: '簽約時就確認匯款路徑與所需天數，在交割前1〜2週開始匯款，並提早準備資金來源證明。' },
      { title: '取代印鑑證明的文件來不及', situation: '在日本沒有住民登記的B小姐，在交割前才知道無法提供印鑑證明。替代的簽名證明需預約駐外館處，花了兩週才取得。', lesson: '決定購買時，就向司法書士確認簽名證明、宣誓供述書等必要文件清單，並提早預約。' },
    ],
    'zh-CN': [
      { title: '汇款赶不上交割日', situation: '居住海外的A先生在交割前几天才开始海外汇款。汇出银行的身份与资金来源核查耗时，差点赶不上交割日。', lesson: '签约时就确认汇款路径与所需天数，在交割前1〜2周开始汇款，并提前准备资金来源证明。' },
      { title: '代替印鉴证明的文件来不及', situation: '在日本没有住民登记的B女士，在交割前才知道无法提供印鉴证明。替代的签名证明需要预约驻外使领馆，花了两周才拿到。', lesson: '决定购买时，就向司法书士确认签名证明、宣誓供述书等必要文件清单，并提前预约。' },
    ],
  },
  'tokyo-condo-management-fee-repair-reserve': {
    ja: [{ title: '買った翌年に修繕積立金が2倍に', situation: 'Cさんは、管理費と修繕積立金が安い築40年のマンションを購入しました。翌年の総会で修繕積立金が2倍に値上げされました。長期修繕計画には、もともと値上げの予定が書かれていました。', lesson: '購入前に重要事項調査報告書と長期修繕計画を取り寄せ、今後の値上げ予定と修繕積立金の残高を確認する。' }],
    en: [{ title: 'The repair reserve doubled a year after buying', situation: 'A buyer chose a 40-year-old condominium with low monthly fees. At the next annual meeting the repair reserve was doubled; the long-term repair plan had already scheduled the increase.', lesson: 'Before buying, get the building management report and the long-term repair plan, and check planned increases and the reserve balance.' }],
    'zh-TW': [{ title: '買後隔年修繕公積金漲為兩倍', situation: 'C先生買了一間管理費與修繕公積金便宜、屋齡40年的公寓。隔年大會決議修繕公積金調漲為兩倍，而長期修繕計畫裡原本就寫著調漲預定。', lesson: '購買前取得重要事項調查報告書與長期修繕計畫，確認未來調漲預定與公積金餘額。' }],
    'zh-CN': [{ title: '买后次年修缮基金涨为两倍', situation: 'C先生买了一套管理费与修缮基金便宜、房龄40年的公寓。次年大会决议修缮基金上调为两倍，而长期修缮计划里原本就写着上调计划。', lesson: '购买前取得重要事项调查报告书与长期修缮计划，确认未来上调计划与基金余额。' }],
  },
  'tokyo-condo-minpaku-short-term-rental-rules': {
    ja: [{ title: '民泊のつもりで買ったら規約で禁止', situation: 'Dさんは民泊で運用するつもりで都心の区分マンションを購入しました。引渡し後に管理規約を確認すると、住宅宿泊事業は禁止されていました。', lesson: '民泊を考えているなら、契約前に管理規約と総会決議を確認し、禁止されていないことを書面で確かめる。できない場合の賃貸での収支も計算しておく。' }],
    en: [{ title: 'Bought for Airbnb, banned by the bylaws', situation: 'A buyer purchased a central Tokyo condo to run as a short-term rental. After handover they read the bylaws and found short-term rentals were banned.', lesson: 'If you plan short-term rentals, check the bylaws and association resolutions before the contract and get it in writing. Work out the numbers as an ordinary rental too.' }],
    'zh-TW': [{ title: '為了做民宿而買，卻被規約禁止', situation: 'D先生為了經營民宿買下市中心的區分公寓，交屋後才查看管理規約，發現禁止民宿。', lesson: '若考慮民宿，簽約前就確認管理規約與大會決議，並取得書面確認；也先試算一般出租的收支。' }],
    'zh-CN': [{ title: '为了做民宿而买，却被规约禁止', situation: 'D先生为了经营民宿买下市中心的区分公寓，交房后才查看管理规约，发现禁止民宿。', lesson: '如果考虑民宿，签约前就确认管理规约与大会决议，并取得书面确认；也先测算普通出租的收支。' }],
  },
  'renting-out-tokyo-condo-from-overseas': {
    ja: [{ title: 'サブリースの賃料が下がり、解約もできない', situation: 'Eさんはサブリース付きの物件を購入しました。数年後、管理会社から賃料の引き下げを求められ、解約しようとしたところ、借主保護のため簡単には解約できないことが分かりました。', lesson: 'サブリース付き物件は、賃料の見直し条件・解約条件・契約期間を契約前に確認し、サブリースがない場合の収支でも判断する。' }],
    en: [{ title: 'The sublease rent fell and could not be ended', situation: 'A buyer bought a unit with a master lease. A few years later the company asked to cut the rent, and the owner found the lease could not easily be ended because of tenant protection.', lesson: 'For units with a master lease, check the rent review terms, termination terms and the lease period before buying, and judge the numbers without the sublease too.' }],
    'zh-TW': [{ title: '包租租金調降又無法解約', situation: 'E先生買了附包租的物件。幾年後管理公司要求調降租金，想解約時才發現因承租人保護而不易解約。', lesson: '附包租的物件，簽約前確認租金調整條件、解約條件與契約期間，並以沒有包租時的收支判斷。' }],
    'zh-CN': [{ title: '包租租金下调又无法解约', situation: 'E先生买了附带包租的房源。几年后管理公司要求下调租金，想解约时才发现因租客保护而不易解约。', lesson: '附带包租的房源，签约前确认租金调整条件、解约条件与合同期限，并以没有包租时的收支来判断。' }],
  },
  'selling-tokyo-property-costs-taxes': {
    ja: [{ title: '売却代金の1割が差し引かれて資金計画が狂った', situation: '海外在住のFさんは、売却代金で次の物件を買う予定でした。決済で代金の10.21%が源泉徴収され、還付は翌年の確定申告後になることを知り、資金が足りなくなりました。', lesson: '海外在住で売る場合は、10.21%が差し引かれ、戻るのは翌年の申告後になる前提で資金計画を立てる。' }],
    en: [{ title: '10% withheld from the sale price upset the plan', situation: 'A seller living abroad planned to use the sale proceeds for the next purchase. At closing, 10.21% was withheld, and the refund would only come after the next year\'s tax return, leaving them short.', lesson: 'If you sell while living abroad, plan on 10.21% being withheld and returned only after the following year\'s return.' }],
    'zh-TW': [{ title: '售價被預扣一成，資金計畫被打亂', situation: '居住海外的F先生打算用售屋款購買下一間物件。交割時售價的10.21%被預扣，退稅要等隔年報稅後，導致資金不足。', lesson: '居住海外出售時，請以預扣10.21%、隔年報稅後才退還為前提規劃資金。' }],
    'zh-CN': [{ title: '售价被预扣一成，资金计划被打乱', situation: '居住海外的F先生打算用售房款购买下一套房产。交割时售价的10.21%被预扣，退税要等次年报税后，导致资金不足。', lesson: '居住海外出售时，请以预扣10.21%、次年报税后才退还为前提规划资金。' }],
  },
}
