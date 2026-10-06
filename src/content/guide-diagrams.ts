import type { Locale } from '@/i18n/config'
import type { GuideDiagram } from './guides'

/** Information diagrams placed under guide sections: guide slug → language → section id → diagram. */
export const guideDiagrams: Record<string, Partial<Record<Locale, Record<string, GuideDiagram>>>> = {
  'japan-earthquake-standards-1981': {
    ja: { 'what-changed': { kind: 'timeline', title: '完成年と耐震基準の目安', start: 1950, end: 2026, segments: [{ label: '旧耐震基準', from: 1950, to: 1981, tone: 'old' }, { label: '境目', from: 1981, to: 1984, tone: 'check' }, { label: '新耐震基準', from: 1984, to: 2026, tone: 'new' }], note: '1981年6月1日以降に建築確認を受けた建物が新耐震。1981〜1983年完成の建物は建築確認日を確認します。' } },
    en: { 'what-changed': { kind: 'timeline', title: 'Completion year and the earthquake standard', start: 1950, end: 2026, segments: [{ label: 'Old standard', from: 1950, to: 1981, tone: 'old' }, { label: 'Check', from: 1981, to: 1984, tone: 'check' }, { label: 'New standard', from: 1984, to: 2026, tone: 'new' }], note: 'Buildings permitted on or after 1 June 1981 follow the new standard; for completion years 1981–1983, check the permit date.' } },
    'zh-TW': { 'what-changed': { kind: 'timeline', title: '完工年份與耐震基準', start: 1950, end: 2026, segments: [{ label: '舊耐震基準', from: 1950, to: 1981, tone: 'old' }, { label: '交界', from: 1981, to: 1984, tone: 'check' }, { label: '新耐震基準', from: 1984, to: 2026, tone: 'new' }], note: '1981年6月1日以後取得建築許可者為新耐震；1981〜1983年完工的建物需確認建築許可日期。' } },
    'zh-CN': { 'what-changed': { kind: 'timeline', title: '竣工年份与耐震标准', start: 1950, end: 2026, segments: [{ label: '旧耐震标准', from: 1950, to: 1981, tone: 'old' }, { label: '交界', from: 1981, to: 1984, tone: 'check' }, { label: '新耐震标准', from: 1984, to: 2026, tone: 'new' }], note: '1981年6月1日以后取得建筑许可者为新耐震；1981〜1983年竣工的建筑需确认建筑许可日期。' } },
  },
  'selling-tokyo-property-costs-taxes': {
    ja: { withholding: { kind: 'flow', title: '海外在住の売主のお金の流れ', steps: [{ label: '売買契約', detail: '代金の受け取り方を確認' }, { label: '決済', detail: '買主が代金の10.21%を差し引いて納付' }, { label: '翌年2〜3月に確定申告', detail: '納税管理人を通じて申告' }, { label: '差額の還付', detail: '払いすぎた分が戻る' }] } },
    en: { withholding: { kind: 'flow', title: 'How the money moves for a non-resident seller', steps: [{ label: 'Sale contract', detail: 'Agree how you will be paid' }, { label: 'Closing', detail: 'Buyer withholds 10.21% and pays it in' }, { label: 'Tax return next Feb–Mar', detail: 'Filed through your tax representative' }, { label: 'Refund of the difference', detail: 'Any overpayment comes back' }] } },
    'zh-TW': { withholding: { kind: 'flow', title: '海外賣方的資金流向', steps: [{ label: '簽訂買賣契約', detail: '確認收款方式' }, { label: '交割', detail: '買方預扣價款的10.21%並繳納' }, { label: '隔年2〜3月報稅', detail: '透過納稅管理人申報' }, { label: '退還差額', detail: '多繳的部分退回' }] } },
    'zh-CN': { withholding: { kind: 'flow', title: '海外卖方的资金流向', steps: [{ label: '签订买卖合同', detail: '确认收款方式' }, { label: '交割', detail: '买方预扣房款的10.21%并缴纳' }, { label: '次年2〜3月报税', detail: '通过纳税管理人申报' }, { label: '退还差额', detail: '多缴的部分退回' }] } },
  },
  'tokyo-condo-minpaku-short-term-rental-rules': {
    ja: { checklist: { kind: 'flow', title: '民泊ができるかの判断の順番', steps: [{ label: '管理規約', detail: '民泊が禁止されていないか' }, { label: '区の条例', detail: '区域・期間の制限' }, { label: '制度を選ぶ', detail: '年180日以内は届出、通年は旅館業の許可' }, { label: 'できない場合', detail: '賃貸・マンスリーで運用' }] } },
    en: { checklist: { kind: 'flow', title: 'Deciding whether short-term rental is possible', steps: [{ label: 'Bylaws', detail: 'Not banned?' }, { label: 'Ward ordinance', detail: 'Area and period limits' }, { label: 'Choose the system', detail: 'Up to 180 nights: notification; all year: hotel licence' }, { label: 'If not possible', detail: 'Ordinary or monthly rental' }] } },
    'zh-TW': { checklist: { kind: 'flow', title: '判斷能否做民宿的順序', steps: [{ label: '管理規約', detail: '是否禁止民宿' }, { label: '區條例', detail: '區域與期間限制' }, { label: '選擇制度', detail: '每年180天內申報，全年需旅館業許可' }, { label: '無法經營時', detail: '一般出租或月租' }] } },
    'zh-CN': { checklist: { kind: 'flow', title: '判断能否做民宿的顺序', steps: [{ label: '管理规约', detail: '是否禁止民宿' }, { label: '区条例', detail: '区域与期间限制' }, { label: '选择制度', detail: '每年180天内申报，全年需旅馆业许可' }, { label: '无法经营时', detail: '普通出租或月租' }] } },
  },
  'buying-property-japan-visa': {
    ja: { documents: { kind: 'flow', title: '海外からの購入の流れ', steps: [{ label: '購入を決める' }, { label: '書類の準備', detail: 'サイン証明・宣誓供述書など（2〜3週間）' }, { label: '売買契約', detail: '手付金を支払う' }, { label: '送金', detail: '決済の1〜2週間前に開始' }, { label: '決済・登記', detail: '鍵の受け取り' }] } },
    en: { documents: { kind: 'flow', title: 'Buying from overseas, step by step', steps: [{ label: 'Decide to buy' }, { label: 'Prepare documents', detail: 'Signature certificate, sworn statement (2–3 weeks)' }, { label: 'Sale contract', detail: 'Pay the deposit' }, { label: 'Transfer funds', detail: 'Start 1–2 weeks before closing' }, { label: 'Closing and registration', detail: 'Receive the keys' }] } },
    'zh-TW': { documents: { kind: 'flow', title: '從海外購屋的流程', steps: [{ label: '決定購買' }, { label: '準備文件', detail: '簽名證明、宣誓供述書等（2〜3週）' }, { label: '簽訂買賣契約', detail: '支付訂金' }, { label: '匯款', detail: '交割前1〜2週開始' }, { label: '交割・登記', detail: '領取鑰匙' }] } },
    'zh-CN': { documents: { kind: 'flow', title: '从海外购房的流程', steps: [{ label: '决定购买' }, { label: '准备文件', detail: '签名证明、宣誓供述书等（2〜3周）' }, { label: '签订买卖合同', detail: '支付定金' }, { label: '汇款', detail: '交割前1〜2周开始' }, { label: '交割・登记', detail: '领取钥匙' }] } },
  },
  'renting-out-tokyo-condo-from-overseas': {
    ja: { remittance: { kind: 'flow', title: '家賃が手元に届くまで', steps: [{ label: '入居者が家賃を支払う' }, { label: '管理会社が回収', detail: '管理委託料などを差し引く' }, { label: 'オーナーの口座へ送金', detail: '毎月の収支報告書つき' }, { label: '翌年に確定申告', detail: '納税管理人を通じて' }] } },
    en: { remittance: { kind: 'flow', title: 'How rent reaches you', steps: [{ label: 'Tenant pays rent' }, { label: 'Management company collects', detail: 'Deducts its fee' }, { label: 'Sent to your account', detail: 'With a monthly statement' }, { label: 'Tax return next year', detail: 'Through your tax representative' }] } },
    'zh-TW': { remittance: { kind: 'flow', title: '租金到手的流程', steps: [{ label: '承租人支付租金' }, { label: '管理公司收取', detail: '扣除委託管理費等' }, { label: '匯入屋主帳戶', detail: '附每月收支報告' }, { label: '隔年報稅', detail: '透過納稅管理人' }] } },
    'zh-CN': { remittance: { kind: 'flow', title: '租金到手的流程', steps: [{ label: '租客支付租金' }, { label: '管理公司收取', detail: '扣除委托管理费等' }, { label: '汇入业主账户', detail: '附每月收支报告' }, { label: '次年报税', detail: '通过纳税管理人' }] } },
  },
  'how-to-buy-japan-investment-property': {
    ja: { process: { kind: 'flow', title: '購入の流れ', steps: [{ label: '条件を整理' }, { label: '候補を比較・調査' }, { label: '買付・重要事項説明' }, { label: '売買契約' }, { label: '決済・引渡し' }, { label: '管理開始' }] } },
    en: { process: { kind: 'flow', title: 'The purchase, step by step', steps: [{ label: 'Set criteria' }, { label: 'Compare and inspect' }, { label: 'Offer and disclosure' }, { label: 'Sale contract' }, { label: 'Closing and handover' }, { label: 'Start management' }] } },
    'zh-TW': { process: { kind: 'flow', title: '購買流程', steps: [{ label: '整理條件' }, { label: '比較與調查' }, { label: '出價・重要事項說明' }, { label: '買賣契約' }, { label: '交割・交屋' }, { label: '開始管理' }] } },
    'zh-CN': { process: { kind: 'flow', title: '购买流程', steps: [{ label: '整理条件' }, { label: '比较与调查' }, { label: '出价・重要事项说明' }, { label: '买卖合同' }, { label: '交割・交房' }, { label: '开始管理' }] } },
  },
}
