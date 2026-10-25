export interface SimulatorCopy {
  nav: string
  title: string
  description: string
  intro: string
  conditions: string
  price: string
  priceUnit: string
  /** Yen per unit of the price box: 万円 = 10,000, million yen = 1,000,000. */
  priceUnitValue: number
  payment: string
  loan: string
  cash: string
  down: string
  rate: string
  years: string
  yearsUnit: string
  fees: string
  feesNote: string
  rent: string
  rentNone: string
  rentNote: string
  grossYield: string
  cashTitle: string
  cashFees: string
  cashRent: string
  cashFlow: string
  cashNote: string
  browse: string
  results: string
  barCash: string
  barMonthly: string
  barFlow: string
  fromListing: string
  homeTitle: string
  homeBody: string
}

const COPY: Record<string, SimulatorCopy> = {
  ja: {
    nav: '購入シミュレーター', title: '東京の不動産 購入シミュレーター',
    description: '物件価格、ローンか現金か、頭金・金利・返済期間、管理費や家賃を選ぶだけで、必要な自己資金・初期費用・月々の返済と収支の目安がわかります。',
    intro: '価格や支払い方法を選ぶと、必要な自己資金、初期費用の内訳、月々の返済と収支の目安がすぐに表示されます。登録は不要です。',
    conditions: '条件を選ぶ', price: '物件価格', priceUnit: '万円', priceUnitValue: 10_000,
    payment: '支払い方法', loan: 'ローン', cash: '現金', down: '頭金', rate: '金利（年）', years: '返済期間', yearsUnit: '年',
    fees: '管理費・修繕積立金（月額）', feesNote: '区分マンションは毎月かかります。戸建て・土地は0円で計算します。',
    rent: '賃貸に出す場合の家賃（月額）', rentNone: '貸さない', rentNote: '貸す場合は、表面利回りと月々の収支を計算します。',
    grossYield: '表面利回り', cashTitle: '現金で買う場合の毎月のお金',
    cashFees: '管理費・修繕積立金', cashRent: '家賃収入', cashFlow: '月々の収支（家賃−管理費等）',
    cashNote: '固定資産税・賃貸管理費・空室は含みません。',
    browse: 'この価格帯の物件を見る', results: '計算結果',
    barCash: '必要な自己資金', barMonthly: '月々の返済', barFlow: '月々の収支',
    fromListing: 'この物件で条件を変えて試算する（家賃・現金購入も）', homeTitle: '購入シミュレーター', homeBody: '価格と支払い方法を選ぶだけで、必要な自己資金・初期費用・月々の返済がすぐわかります。',
  },
  en: {
    nav: 'Purchase simulator', title: 'Tokyo property purchase simulator',
    description: 'Choose a price, mortgage or cash, down payment, interest rate, term, monthly fees and rent to see the cash you need, purchase costs, monthly payments and cash flow.',
    intro: 'Choose a price and how you will pay to see the cash you need, a breakdown of purchase costs, and your monthly payment and cash flow straight away. No sign-up.',
    conditions: 'Your conditions', price: 'Price', priceUnit: 'million yen', priceUnitValue: 1_000_000,
    payment: 'Payment', loan: 'Mortgage', cash: 'Cash', down: 'Down payment', rate: 'Interest rate (annual)', years: 'Loan term', yearsUnit: 'years',
    fees: 'Management fee and repair reserve (monthly)', feesNote: 'Condominiums charge these every month; use ¥0 for houses and land.',
    rent: 'Monthly rent if you let it out', rentNone: 'Not letting', rentNote: 'If you let it out, gross yield and monthly cash flow are worked out.',
    grossYield: 'Gross yield', cashTitle: 'Monthly money when buying in cash',
    cashFees: 'Management fee and repair reserve', cashRent: 'Rental income', cashFlow: 'Monthly cash flow (rent − fees)',
    cashNote: 'Property tax, letting fees and vacancies are not included.',
    browse: 'See properties at this price', results: 'Results',
    barCash: 'Cash you need', barMonthly: 'Monthly payment', barFlow: 'Monthly cash flow',
    fromListing: 'Try other conditions for this property (rent, cash purchase)', homeTitle: 'Purchase simulator', homeBody: 'Pick a price and how you will pay to see the cash you need, purchase costs and monthly payments.',
  },
  'zh-TW': {
    nav: '購屋試算', title: '東京不動產購屋試算',
    description: '選擇物件價格、貸款或現金、頭期款、利率、還款期間、管理費與租金，即可估算所需自有資金、購屋費用、每月還款與收支。',
    intro: '選擇價格與付款方式後，會立即顯示所需自有資金、初期費用明細，以及每月還款與收支的估算。免註冊。',
    conditions: '選擇條件', price: '物件價格', priceUnit: '萬日圓', priceUnitValue: 10_000,
    payment: '付款方式', loan: '貸款', cash: '現金', down: '頭期款', rate: '年利率', years: '還款期間', yearsUnit: '年',
    fees: '管理費・修繕基金（每月）', feesNote: '公寓每月都需支付；獨棟與土地以0日圓計算。',
    rent: '出租時的租金（每月）', rentNone: '不出租', rentNote: '出租時會計算表面投報率與每月收支。',
    grossYield: '表面投報率', cashTitle: '以現金購買時的每月金額',
    cashFees: '管理費・修繕基金', cashRent: '租金收入', cashFlow: '每月收支（租金−管理費等）',
    cashNote: '未含固定資產稅、租賃管理費與空置。',
    browse: '查看此價格帶的物件', results: '試算結果',
    barCash: '所需自有資金', barMonthly: '每月還款', barFlow: '每月收支',
    fromListing: '以此物件改變條件試算（含出租與現金購買）', homeTitle: '購屋試算', homeBody: '選擇價格與付款方式，即可了解所需自有資金、購屋費用與每月還款。',
  },
  'zh-CN': {
    nav: '购房试算', title: '东京房产购房试算',
    description: '选择房产价格、贷款或全款、首付、利率、还款期限、管理费和租金，即可估算所需自有资金、购房费用、月供和收支。',
    intro: '选择价格和付款方式后，会立即显示所需自有资金、初期费用明细，以及月供和收支的估算。免注册。',
    conditions: '选择条件', price: '房产价格', priceUnit: '万日元', priceUnitValue: 10_000,
    payment: '付款方式', loan: '贷款', cash: '全款', down: '首付', rate: '年利率', years: '还款期限', yearsUnit: '年',
    fees: '管理费・修缮基金（每月）', feesNote: '公寓每月都需支付；独栋和土地按0日元计算。',
    rent: '出租时的租金（每月）', rentNone: '不出租', rentNote: '出租时会计算表面收益率和每月收支。',
    grossYield: '表面收益率', cashTitle: '全款购买时的每月金额',
    cashFees: '管理费・修缮基金', cashRent: '租金收入', cashFlow: '每月收支（租金−管理费等）',
    cashNote: '未含固定资产税、租赁管理费和空置。',
    browse: '查看此价格区间的房源', results: '试算结果',
    barCash: '所需自有资金', barMonthly: '每月还款', barFlow: '每月收支',
    fromListing: '以此房源改变条件试算（含出租与全款购买）', homeTitle: '购房试算', homeBody: '选择价格和付款方式，即可了解所需自有资金、购房费用和月供。',
  },
}

export function getSimulatorCopy(locale: string): SimulatorCopy {
  return COPY[locale] ?? COPY.en
}
