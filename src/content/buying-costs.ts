/**
 * Buyer-facing summary of financing options for foreign nationals and the usual costs of a purchase,
 * grouped by when they are paid. Amounts are rules of thumb; the listing page has the per-property estimate.
 */

export type FinancingKey = 'visa' | 'company' | 'cash'
export type CostStage = 'contract' | 'settlement' | 'after' | 'holding'

export interface CostItem {
  name: string
  amount: string
  note: string
}

export interface BuyingCostsCopy {
  financingTitle: string
  financingIntro: string
  financing: Record<FinancingKey, { title: string; body: string }>
  financingNote: string
  costsTitle: string
  costsIntro: string
  stages: Record<CostStage, { title: string; items: CostItem[] }>
  costsNote: string
}

const ja: BuyingCostsCopy = {
  financingTitle: '外国籍の方のローン利用',
  financingIntro: '外国籍の方でも、次のような場合は日本の金融機関のローンを利用できる可能性があります。',
  financing: {
    visa: { title: '日本の在留資格（ビザ）がある', body: '日本に住み、在留資格がある方はローンを申し込めます。永住権の有無、在留期間、勤務先や収入、頭金の額などで審査されます。' },
    company: { title: '日本法人を設立して買う', body: '日本に会社を設立し、法人名義で購入・借入れする方法があります。事業計画や自己資金、代表者の状況が審査されます。' },
    cash: { title: '海外在住で在留資格がない', body: '日本の金融機関での借入れは難しいことが多く、現金での購入が一般的です。' },
  },
  financingNote: '融資の可否・金利・頭金の割合は金融機関の審査で決まります。どの方法が合うかは購入相談でお尋ねください。',
  costsTitle: '購入時・保有中にかかる主な費用',
  costsIntro: '物件価格のほかにかかる費用を、支払うタイミングごとにまとめました。',
  stages: {
    contract: { title: '売買契約のとき', items: [
      { name: '手付金', amount: '物件価格の5〜10%程度', note: '代金の一部で、決済時に残代金と相殺されます。' },
      { name: '印紙税', amount: '1万円（1,000万超〜5,000万円以下の場合）', note: '売買契約書に貼ります。金額帯で変わります。' },
      { name: '仲介手数料（半額）', amount: '上限：価格×3%＋6万円＋消費税', note: '契約時と引渡し時に半分ずつ払うのが一般的です。' },
    ] },
    settlement: { title: '決済・引渡しのとき', items: [
      { name: '残代金・仲介手数料（残り）', amount: '物件価格−手付金', note: 'ローンを使う場合は融資金で支払います。' },
      { name: '登録免許税', amount: '固定資産税評価額×税率', note: '所有権移転・抵当権設定の登記にかかる税金。住宅用の軽減があります。' },
      { name: '司法書士報酬', amount: '数万〜十数万円', note: '登記手続きの代行費用です。' },
      { name: '固定資産税・管理費などの精算', amount: '日割り', note: '引渡し日以降の分を売主に払います。' },
      { name: 'ローン費用・火災保険', amount: '金融機関・補償内容による', note: '事務手数料、保証料、ローン契約の印紙、火災・地震保険料など。' },
    ] },
    after: { title: '引渡しのあと', items: [
      { name: '不動産取得税', amount: '固定資産税評価額×税率（軽減あり）', note: '引渡しから数か月後に納税通知書が届きます。' },
    ] },
    holding: { title: '保有している間', items: [
      { name: '固定資産税・都市計画税', amount: '毎年', note: '1月1日時点の所有者に課税され、年4回に分けて納めます。' },
      { name: '管理費・修繕積立金', amount: '毎月（マンション）', note: '物件ごとに金額が決まっています。' },
      { name: '賃貸管理費', amount: '家賃の数%が目安', note: '賃貸に出して管理会社に任せる場合です。' },
      { name: '所得税・住民税', amount: '賃料収入がある場合', note: '確定申告が必要です。海外にお住まいなら納税管理人を選びます。' },
    ] },
  },
  costsNote: '税率や軽減措置は物件や時期で変わります。物件ページでは価格から計算した諸費用の目安を表示しています。',
}

const en: BuyingCostsCopy = {
  financingTitle: 'Mortgages for foreign nationals',
  financingIntro: 'Foreign nationals can often borrow from a Japanese lender in the following situations.',
  financing: {
    visa: { title: 'You hold Japanese residence status (a visa)', body: 'Residents of Japan can apply for a mortgage. Lenders look at permanent residency, the length of your status, employer and income, and the down payment.' },
    company: { title: 'You set up a Japanese company', body: 'You can buy and borrow in the name of a company established in Japan. Lenders review the business plan, equity and the representative.' },
    cash: { title: 'You live abroad without Japanese residence status', body: 'Borrowing from Japanese lenders is usually difficult, so most buyers pay in cash.' },
  },
  financingNote: 'Lenders decide eligibility, rates and the down payment. Ask us which route fits your situation.',
  costsTitle: 'Main costs of buying and owning',
  costsIntro: 'Costs on top of the price, grouped by when you pay them.',
  stages: {
    contract: { title: 'At the contract', items: [
      { name: 'Deposit', amount: 'About 5–10% of the price', note: 'Part of the price; deducted from the balance at settlement.' },
      { name: 'Stamp duty', amount: '¥10,000 (for ¥10M–¥50M)', note: 'Affixed to the sale contract; depends on the price band.' },
      { name: 'Brokerage fee (half)', amount: 'Max: price × 3% + ¥60,000 + tax', note: 'Usually half at the contract and half at handover.' },
    ] },
    settlement: { title: 'At settlement and handover', items: [
      { name: 'Balance and remaining brokerage', amount: 'Price minus deposit', note: 'Paid from the loan if you borrow.' },
      { name: 'Registration tax', amount: 'Assessed value × rate', note: 'For registering ownership and any mortgage; reduced for homes.' },
      { name: 'Judicial scrivener fee', amount: 'Tens of thousands to ~¥150,000', note: 'For handling the registration.' },
      { name: 'Property tax and fee settlement', amount: 'Pro rata', note: 'You reimburse the seller from the handover date.' },
      { name: 'Loan costs and insurance', amount: 'Depends on lender and cover', note: 'Loan fees, guarantee, loan contract stamp, fire and earthquake insurance.' },
    ] },
    after: { title: 'After handover', items: [
      { name: 'Real estate acquisition tax', amount: 'Assessed value × rate (relief available)', note: 'The tax notice arrives a few months after handover.' },
    ] },
    holding: { title: 'While you own it', items: [
      { name: 'Fixed asset and city planning tax', amount: 'Every year', note: 'Charged to the owner on 1 January, paid in four instalments.' },
      { name: 'Management and repair reserve fees', amount: 'Monthly (condominiums)', note: 'Set for each property.' },
      { name: 'Rental management fee', amount: 'A few % of rent', note: 'If you let it through a management company.' },
      { name: 'Income and resident tax', amount: 'If you receive rent', note: 'File a tax return; overseas owners appoint a tax representative.' },
    ] },
  },
  costsNote: 'Rates and reliefs depend on the property and the date. Each listing page shows an estimate based on its price.',
}

const zhTW: BuyingCostsCopy = {
  financingTitle: '外國籍買家的貸款',
  financingIntro: '外國籍人士在以下情況，有機會向日本金融機構申請貸款。',
  financing: {
    visa: { title: '持有日本在留資格（簽證）', body: '居住在日本並持有在留資格者可申請房貸。審查會看是否有永住權、在留期間、任職公司與收入、頭期款等。' },
    company: { title: '設立日本法人購買', body: '可用在日本設立的公司名義購買與借款。審查會看事業計畫、自有資金與負責人情況。' },
    cash: { title: '居住海外且無在留資格', body: '向日本金融機構借款通常較困難，一般以現金購買。' },
  },
  financingNote: '能否貸款、利率與頭期款比例由金融機構審查決定。哪種方式適合您，歡迎在購屋諮詢時詢問。',
  costsTitle: '購買時與持有期間的主要費用',
  costsIntro: '依支付時間整理物件價格以外的費用。',
  stages: {
    contract: { title: '簽訂買賣契約時', items: [
      { name: '訂金', amount: '約物件價格的5〜10%', note: '屬於價款的一部分，交割時抵扣尾款。' },
      { name: '印花稅', amount: '1萬日圓（1,000萬〜5,000萬日圓）', note: '貼於買賣契約書，依金額級距不同。' },
      { name: '仲介費（一半）', amount: '上限：價格×3%＋6萬日圓＋稅', note: '一般於簽約與交屋時各付一半。' },
    ] },
    settlement: { title: '交割・交屋時', items: [
      { name: '尾款・剩餘仲介費', amount: '物件價格−訂金', note: '使用貸款時以貸款金支付。' },
      { name: '登錄免許稅', amount: '評定價值×稅率', note: '所有權移轉與抵押權設定登記的稅金，住宅有減免。' },
      { name: '代書（司法書士）費用', amount: '數萬〜十數萬日圓', note: '代辦登記手續的費用。' },
      { name: '固定資產稅・管理費等分攤', amount: '按日計算', note: '交屋日之後的部分支付給賣方。' },
      { name: '貸款費用・火災保險', amount: '依金融機構與保障內容', note: '手續費、保證費、貸款契約印花稅、火災與地震保險費等。' },
    ] },
    after: { title: '交屋之後', items: [
      { name: '不動產取得稅', amount: '評定價值×稅率（有減免）', note: '交屋數個月後會收到繳稅通知。' },
    ] },
    holding: { title: '持有期間', items: [
      { name: '固定資產稅・都市計畫稅', amount: '每年', note: '對1月1日的所有人課稅，分4期繳納。' },
      { name: '管理費・修繕公積金', amount: '每月（公寓）', note: '各物件金額不同。' },
      { name: '租賃管理費', amount: '約租金的數%', note: '出租並委託管理公司時。' },
      { name: '所得稅・住民稅', amount: '有租金收入時', note: '需報稅；居住海外者需選任納稅管理人。' },
    ] },
  },
  costsNote: '稅率與減免依物件與時期而異。物件頁面會依價格顯示雜費試算。',
}

const zhCN: BuyingCostsCopy = {
  financingTitle: '外国籍买家的贷款',
  financingIntro: '外国籍人士在以下情况下，有机会向日本金融机构申请贷款。',
  financing: {
    visa: { title: '持有日本在留资格（签证）', body: '居住在日本并持有在留资格者可申请房贷。审核会看是否有永住权、在留期限、任职公司与收入、首付等。' },
    company: { title: '设立日本法人购买', body: '可用在日本设立的公司名义购买和借款。审核会看事业计划、自有资金与负责人情况。' },
    cash: { title: '居住海外且无在留资格', body: '向日本金融机构借款通常较难，一般以全款购买。' },
  },
  financingNote: '能否贷款、利率和首付比例由金融机构审核决定。哪种方式适合您，欢迎在购房咨询时询问。',
  costsTitle: '购买时与持有期间的主要费用',
  costsIntro: '按支付时间整理房价以外的费用。',
  stages: {
    contract: { title: '签订买卖合同时', items: [
      { name: '定金', amount: '约房价的5〜10%', note: '属于房款的一部分，交割时抵扣尾款。' },
      { name: '印花税', amount: '1万日元（1,000万〜5,000万日元）', note: '贴于买卖合同，按金额档次不同。' },
      { name: '中介费（一半）', amount: '上限：价格×3%＋6万日元＋税', note: '一般在签约和交房时各付一半。' },
    ] },
    settlement: { title: '交割・交房时', items: [
      { name: '尾款・剩余中介费', amount: '房价−定金', note: '使用贷款时以贷款支付。' },
      { name: '登录免许税', amount: '评估价值×税率', note: '所有权转移与抵押权设定登记的税金，住宅有减免。' },
      { name: '司法书士费用', amount: '数万〜十数万日元', note: '代办登记手续的费用。' },
      { name: '固定资产税・管理费等分摊', amount: '按日计算', note: '交房日之后的部分支付给卖方。' },
      { name: '贷款费用・火灾保险', amount: '因金融机构与保障内容而异', note: '手续费、保证费、贷款合同印花税、火灾与地震保险费等。' },
    ] },
    after: { title: '交房之后', items: [
      { name: '不动产取得税', amount: '评估价值×税率（有减免）', note: '交房数个月后会收到缴税通知。' },
    ] },
    holding: { title: '持有期间', items: [
      { name: '固定资产税・城市规划税', amount: '每年', note: '对1月1日的所有人征税，分4期缴纳。' },
      { name: '管理费・修缮基金', amount: '每月（公寓）', note: '各房源金额不同。' },
      { name: '租赁管理费', amount: '约租金的百分之几', note: '出租并委托管理公司时。' },
      { name: '所得税・住民税', amount: '有租金收入时', note: '需要报税；居住海外者需选任纳税管理人。' },
    ] },
  },
  costsNote: '税率与减免因房产和时期而异。房源页面会按价格显示杂费估算。',
}

const byLocale: Record<string, BuyingCostsCopy> = { ja, en, 'zh-TW': zhTW, 'zh-CN': zhCN }

export function getBuyingCostsCopy(locale: string): BuyingCostsCopy {
  return byLocale[locale] ?? en
}
