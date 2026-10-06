import type { Locale } from '@/i18n/config'
import type { GuideExample, GuideSource, GuideTable } from './guides'

/**
 * Tables, worked examples and primary sources layered onto existing guides (see docs/CONTENT_STYLE_GUIDE.md).
 * Kept apart from the article text so the prose files stay readable. Every source URL was checked.
 */

interface SectionExtra {
  table?: GuideTable
  example?: GuideExample
}

export interface GuideEnrichment {
  sources?: GuideSource[]
  sections?: Record<string, SectionExtra>
}

const NTA_CAPITAL_GAINS = 'https://www.nta.go.jp/taxes/shiraberu/taxanswer/joto/3202.htm'
const NTA_BUY_FROM_NON_RESIDENT = 'https://www.nta.go.jp/taxes/shiraberu/taxanswer/gensen/2879.htm'
const NTA_RENT_TO_NON_RESIDENT = 'https://www.nta.go.jp/taxes/shiraberu/taxanswer/gensen/2880.htm'
const MLIT_SEISMIC = 'https://www.mlit.go.jp/jutakukentiku/house/jutakukentiku_house_fr_000043.html'
const MLIT_CONDO_MANAGEMENT = 'https://www.mlit.go.jp/jutakukentiku/house/jutakukentiku_house_tk5_000052.html'
const MLIT_MINPAKU = 'https://www.mlit.go.jp/kankocho/minpaku/'

export const guideEnrichments: Record<string, Partial<Record<Locale, GuideEnrichment>>> = {
  'japan-earthquake-standards-1981': {
    ja: {
      sources: [{ label: '国土交通省「住宅・建築物の耐震化について」', url: MLIT_SEISMIC }],
      sections: { 'how-to-tell': { table: { caption: '完成年からの目安（最終判断は建築確認日）', headers: ['完成年', '目安', '確認すること'], rows: [['1984年以降', '新耐震の可能性が高い', '特になし'], ['1981〜1983年', 'どちらの可能性もある', '建築確認日'], ['1980年以前', '旧耐震の可能性が高い', '耐震診断・改修の有無']] } } },
    },
    en: {
      sources: [{ label: 'MLIT: Earthquake resistance of housing and buildings (Japanese)', url: MLIT_SEISMIC }],
      sections: { 'how-to-tell': { table: { caption: 'Rule of thumb from the completion year (the permit date decides)', headers: ['Completed', 'Likely standard', 'What to check'], rows: [['1984 or later', 'New standard', '—'], ['1981–1983', 'Either', 'Building permit date'], ['1980 or earlier', 'Old standard', 'Seismic assessment or reinforcement']] } } },
    },
    'zh-TW': {
      sources: [{ label: '國土交通省「住宅・建築物的耐震化」（日文）', url: MLIT_SEISMIC }],
      sections: { 'how-to-tell': { table: { caption: '依完工年份的參考（最終以建築許可日期判斷）', headers: ['完工年份', '參考', '需確認'], rows: [['1984年以後', '多為新耐震', '—'], ['1981〜1983年', '兩者皆有可能', '建築許可日期'], ['1980年以前', '多為舊耐震', '耐震診斷・補強']] } } },
    },
    'zh-CN': {
      sources: [{ label: '国土交通省“住宅・建筑物的抗震化”（日文）', url: MLIT_SEISMIC }],
      sections: { 'how-to-tell': { table: { caption: '按竣工年份的参考（最终以建筑许可日期判断）', headers: ['竣工年份', '参考', '需确认'], rows: [['1984年以后', '多为新耐震', '—'], ['1981〜1983年', '两者都有可能', '建筑许可日期'], ['1980年以前', '多为旧耐震', '抗震诊断・加固']] } } },
    },
  },
  'tokyo-condo-management-fee-repair-reserve': {
    ja: {
      sources: [{ label: '国土交通省「マンション管理」（修繕積立金ガイドラインなど）', url: MLIT_CONDO_MANAGEMENT }],
      sections: {
        difference: { table: { headers: ['', '管理費', '修繕積立金'], rows: [['使い道', '清掃・管理会社・共用部の電気代など日常の管理', '12〜15年ごとの大規模修繕'], ['払う時期', '毎月', '毎月（一時金がかかることも）'], ['売却したら', '戻らない', '戻らない（建物の資金として残る）']] } },
        guideline: { example: { title: '専有面積50㎡のマンションの場合（目安）', lines: ['修繕積立金：50㎡ × 約300円 ＝ 月 約15,000円', '管理費（例）：月 10,000円', '合計：月 約25,000円 ＝ 年 約30万円'], note: '金額は例です。実際の金額は物件ごとに異なります。' } },
      },
    },
    en: {
      sources: [{ label: 'MLIT: Condominium management, including the repair reserve guideline (Japanese)', url: MLIT_CONDO_MANAGEMENT }],
      sections: {
        difference: { table: { headers: ['', 'Management fee', 'Repair reserve'], rows: [['Pays for', 'Cleaning, management company, common-area power', 'Major repairs every 12–15 years'], ['When', 'Monthly', 'Monthly (one-off levies possible)'], ['When you sell', 'Not refunded', 'Not refunded (stays with the building)']] } },
        guideline: { example: { title: 'A 50 m² unit (illustrative)', lines: ['Repair reserve: 50 m² × about ¥300 = about ¥15,000 a month', 'Management fee (example): ¥10,000 a month', 'Total: about ¥25,000 a month = about ¥300,000 a year'], note: 'Illustrative figures; each building differs.' } },
      },
    },
    'zh-TW': {
      sources: [{ label: '國土交通省「公寓管理」（含修繕公積金指引，日文）', url: MLIT_CONDO_MANAGEMENT }],
      sections: {
        difference: { table: { headers: ['', '管理費', '修繕公積金'], rows: [['用途', '清潔、管理公司、公共區域電費等日常管理', '每12〜15年的大規模修繕'], ['支付時間', '每月', '每月（可能有一次性費用）'], ['出售時', '不退還', '不退還（留作建物資金）']] } },
        guideline: { example: { title: '專有面積50平方公尺的公寓（參考）', lines: ['修繕公積金：50㎡ × 約300日圓 ＝ 每月約15,000日圓', '管理費（例）：每月10,000日圓', '合計：每月約25,000日圓 ＝ 每年約30萬日圓'], note: '金額為舉例，實際依物件而異。' } },
      },
    },
    'zh-CN': {
      sources: [{ label: '国土交通省“公寓管理”（含修缮基金指引，日文）', url: MLIT_CONDO_MANAGEMENT }],
      sections: {
        difference: { table: { headers: ['', '管理费', '修缮基金'], rows: [['用途', '清洁、管理公司、公共区域电费等日常管理', '每12〜15年的大规模修缮'], ['支付时间', '每月', '每月（可能有一次性费用）'], ['出售时', '不退还', '不退还（留作建筑资金）']] } },
        guideline: { example: { title: '专有面积50平方米的公寓（参考）', lines: ['修缮基金：50㎡ × 约300日元 ＝ 每月约15,000日元', '管理费（例）：每月10,000日元', '合计：每月约25,000日元 ＝ 每年约30万日元'], note: '金额为举例，实际因房源而异。' } },
      },
    },
  },
  'selling-tokyo-property-costs-taxes': {
    ja: {
      sources: [{ label: '国税庁 No.3202 譲渡所得の計算のしかた（分離課税）', url: NTA_CAPITAL_GAINS }, { label: '国税庁 No.2879 非居住者等から土地等を購入したとき', url: NTA_BUY_FROM_NON_RESIDENT }],
      sections: {
        rates: { example: { title: '3,000万円で買い、4,000万円で売る場合（例）', lines: ['取得費：購入3,000万円＋諸費用200万円−建物の減価償却300万円＝2,900万円', '譲渡費用（仲介手数料など）：140万円', '譲渡所得：4,000万円−（2,900万円＋140万円）＝960万円', '長期（5年超）：960万円×20.315%≒195万円／短期：×39.63%≒380万円', '海外在住で住民税がかからない長期の場合：×15.315%≒147万円'], note: '計算の流れを示す例で、個別の税額ではありません。特例や控除は条件によって変わります。' } },
        withholding: { example: { title: '海外在住の売主が4,000万円で売る場合（例）', lines: ['買主が源泉徴収：4,000万円×10.21%＝408.4万円', '翌年の確定申告で税額147万円（上の長期の例）と精算', '差額の約261万円が還付'], note: '個人が自分や親族の住まいとして1億円以下で買う場合は、源泉徴収は不要です。' } },
      },
    },
    en: {
      sources: [{ label: 'National Tax Agency No.3202: Calculating capital gains (Japanese)', url: NTA_CAPITAL_GAINS }, { label: 'National Tax Agency No.2879: Buying land from a non-resident (Japanese)', url: NTA_BUY_FROM_NON_RESIDENT }],
      sections: {
        rates: { example: { title: 'Bought for ¥30M, sold for ¥40M (illustrative)', lines: ['Acquisition cost: ¥30M price + ¥2M purchase costs − ¥3M building depreciation = ¥29M', 'Selling costs (brokerage etc.): ¥1.4M', 'Gain: ¥40M − (¥29M + ¥1.4M) = ¥9.6M', 'Long-term (over 5 years): ¥9.6M × 20.315% ≈ ¥1.95M; short-term: × 39.63% ≈ ¥3.80M', 'Long-term, living abroad with no resident tax: × 15.315% ≈ ¥1.47M'], note: 'Shows how the calculation works; it is not a tax assessment. Reliefs and deductions depend on conditions.' } },
        withholding: { example: { title: 'A non-resident seller selling for ¥40M (illustrative)', lines: ['The buyer withholds ¥40M × 10.21% = ¥4.084M', 'Next year\'s tax return settles it against the ¥1.47M tax above', 'About ¥2.61M is refunded'], note: 'No withholding when an individual buys a home for their own or a relative\'s use for ¥100M or less.' } },
      },
    },
    'zh-TW': {
      sources: [{ label: '國稅廳 No.3202 讓渡所得的計算方式（日文）', url: NTA_CAPITAL_GAINS }, { label: '國稅廳 No.2879 向非居住者購買土地等時（日文）', url: NTA_BUY_FROM_NON_RESIDENT }],
      sections: {
        rates: { example: { title: '以3,000萬日圓買入、4,000萬日圓賣出（舉例）', lines: ['取得費：購入3,000萬＋雜費200萬−建物折舊300萬＝2,900萬日圓', '讓渡費用（仲介費等）：140萬日圓', '讓渡所得：4,000萬−（2,900萬＋140萬）＝960萬日圓', '長期（超過5年）：960萬×20.315%≒195萬日圓／短期：×39.63%≒380萬日圓', '居住海外、不課住民稅的長期情況：×15.315%≒147萬日圓'], note: '此為說明計算流程的例子，並非個別稅額。優惠與扣除依條件而異。' } },
        withholding: { example: { title: '海外賣方以4,000萬日圓出售（舉例）', lines: ['買方預扣：4,000萬×10.21%＝408.4萬日圓', '隔年報稅時與上例稅額147萬日圓結算', '差額約261萬日圓退還'], note: '個人以1億日圓以下購買自住或親屬居住用房屋時不需預扣。' } },
      },
    },
    'zh-CN': {
      sources: [{ label: '国税厅 No.3202 转让所得的计算方式（日文）', url: NTA_CAPITAL_GAINS }, { label: '国税厅 No.2879 向非居住者购买土地等时（日文）', url: NTA_BUY_FROM_NON_RESIDENT }],
      sections: {
        rates: { example: { title: '以3,000万日元买入、4,000万日元卖出（举例）', lines: ['取得费：购入3,000万＋杂费200万−建筑折旧300万＝2,900万日元', '转让费用（中介费等）：140万日元', '转让所得：4,000万−（2,900万＋140万）＝960万日元', '长期（超过5年）：960万×20.315%≈195万日元／短期：×39.63%≈380万日元', '居住海外、不征住民税的长期情况：×15.315%≈147万日元'], note: '此为说明计算流程的例子，并非个别税额。优惠与扣除因条件而异。' } },
        withholding: { example: { title: '海外卖方以4,000万日元出售（举例）', lines: ['买方预扣：4,000万×10.21%＝408.4万日元', '次年报税时与上例税额147万日元结算', '差额约261万日元退还'], note: '个人以1亿日元以下购买自住或亲属居住用房屋时不需要预扣。' } },
      },
    },
  },
  'renting-out-tokyo-condo-from-overseas': {
    ja: {
      sources: [{ label: '国税庁 No.2880 非居住者等に不動産の賃借料を支払ったとき', url: NTA_RENT_TO_NON_RESIDENT }],
      sections: {
        management: { table: { headers: ['', '管理委託', 'サブリース'], rows: [['受け取る家賃', '実際の家賃から手数料を引いた額', '決まった賃料（相場より低め）'], ['空室のリスク', 'オーナー', '管理会社'], ['手数料の目安', '家賃の5%前後', '賃料の差額として織り込み'], ['注意点', '空室期間の収入減', '賃料見直し・解約の条件']] } },
        costs: { example: { title: '2,080万円・家賃11.3万円の部屋の場合（例）', lines: ['年間家賃：113,000円×12＝1,356,000円 → 表面利回り6.5%', '管理費・修繕積立金：年250,320円', '管理委託料（家賃の5%）：年67,800円', '固定資産税・都市計画税（仮）：年60,000円', '手取り：年977,880円 → 実質利回り約4.7%'], note: '空室・入替え費用・所得税は含みません。将来の収益を約束するものではありません。' } },
      },
    },
    en: {
      sources: [{ label: 'National Tax Agency No.2880: Rent paid to non-residents (Japanese)', url: NTA_RENT_TO_NON_RESIDENT }],
      sections: {
        management: { table: { headers: ['', 'Management contract', 'Master lease (sublease)'], rows: [['Rent you receive', 'Actual rent minus the fee', 'A set rent, below market'], ['Vacancy risk', 'Owner', 'Management company'], ['Typical fee', 'About 5% of rent', 'Built into the lower rent'], ['Watch for', 'Lost rent when empty', 'Rent reviews and termination terms']] } },
        costs: { example: { title: 'A ¥20.8M unit let at ¥113,000 a month (illustrative)', lines: ['Annual rent: ¥113,000 × 12 = ¥1,356,000 → gross yield 6.5%', 'Management fee and repair reserve: ¥250,320 a year', 'Management company (5% of rent): ¥67,800 a year', 'Property taxes (assumed): ¥60,000 a year', 'Net: ¥977,880 a year → net yield about 4.7%'], note: 'Excludes vacancies, re-letting costs and income tax. Not a forecast or promise of returns.' } },
      },
    },
    'zh-TW': {
      sources: [{ label: '國稅廳 No.2880 支付不動產租金給非居住者時（日文）', url: NTA_RENT_TO_NON_RESIDENT }],
      sections: {
        management: { table: { headers: ['', '委託管理', '包租'], rows: [['收到的租金', '實際租金扣除手續費', '固定租金（低於行情）'], ['空置風險', '屋主', '管理公司'], ['手續費參考', '租金的5%左右', '反映在較低租金中'], ['注意事項', '空置期間收入減少', '租金調整與解約條件']] } },
        costs: { example: { title: '2,080萬日圓、月租11.3萬日圓的物件（舉例）', lines: ['年租金：113,000×12＝1,356,000日圓 → 表面投報率6.5%', '管理費・修繕公積金：每年250,320日圓', '委託管理費（租金5%）：每年67,800日圓', '固定資產稅等（假設）：每年60,000日圓', '實收：每年977,880日圓 → 實質投報率約4.7%'], note: '不含空置、換租費用與所得稅，並非對未來收益的保證。' } },
      },
    },
    'zh-CN': {
      sources: [{ label: '国税厅 No.2880 向非居住者支付房产租金时（日文）', url: NTA_RENT_TO_NON_RESIDENT }],
      sections: {
        management: { table: { headers: ['', '委托管理', '包租'], rows: [['收到的租金', '实际租金扣除手续费', '固定租金（低于市场）'], ['空置风险', '业主', '管理公司'], ['手续费参考', '租金的5%左右', '反映在较低租金中'], ['注意事项', '空置期间收入减少', '租金调整与解约条件']] } },
        costs: { example: { title: '2,080万日元、月租11.3万日元的房源（举例）', lines: ['年租金：113,000×12＝1,356,000日元 → 表面收益率6.5%', '管理费・修缮基金：每年250,320日元', '委托管理费（租金5%）：每年67,800日元', '固定资产税等（假设）：每年60,000日元', '实收：每年977,880日元 → 实际收益率约4.7%'], note: '不含空置、换租费用与所得税，并非对未来收益的保证。' } },
      },
    },
  },
  'leasehold-vs-freehold-tokyo': {
    ja: { sections: { types: { table: { headers: ['種類', '契約の時期・期間', '更新', '期間が終わったら'], rows: [['旧法借地権', '1992年7月以前の契約', '更新されることが多い', '更新が続くのが一般的'], ['普通借地権', '当初30年以上', '地主の拒絶には正当な理由が必要', '更新が基本'], ['定期借地権（一般）', '50年以上など', 'なし', '更地にして返す']] } } } },
    en: { sections: { types: { table: { headers: ['Type', 'When / term', 'Renewal', 'At the end'], rows: [['Old-law leasehold', 'Leases before August 1992', 'Usually renewed', 'Renewals continue'], ['Ordinary leasehold', '30 years or more at first', 'Landowner needs just cause to refuse', 'Renewal is the norm'], ['Fixed-term leasehold', 'For example 50 years or more', 'None', 'Land returned cleared']] } } } },
    'zh-TW': { sections: { types: { table: { headers: ['種類', '簽約時間・期間', '續約', '期滿後'], rows: [['舊法借地權', '1992年7月以前的契約', '多半續約', '通常持續續約'], ['普通借地權', '初始30年以上', '地主拒絕需正當理由', '以續約為原則'], ['定期借地權（一般）', '50年以上等', '不續約', '拆除建物歸還土地']] } } } },
    'zh-CN': { sections: { types: { table: { headers: ['种类', '签约时间・期限', '续约', '期满后'], rows: [['旧法借地权', '1992年7月以前的合同', '大多续约', '通常持续续约'], ['普通借地权', '初始30年以上', '地主拒绝需正当理由', '以续约为原则'], ['定期借地权（一般）', '50年以上等', '不续约', '拆除建筑归还土地']] } } } },
  },
  'tokyo-condo-minpaku-short-term-rental-rules': {
    ja: {
      sources: [{ label: '観光庁「民泊制度ポータルサイト」', url: MLIT_MINPAKU }],
      sections: { systems: { table: { headers: ['制度', '手続き', '営業できる日数', '主な条件'], rows: [['住宅宿泊事業法', '届出', '年180日まで', '区の条例で上乗せ規制'], ['旅館業法（簡易宿所など）', '許可', '制限なし', '用途地域・建物の用途・設備'], ['特区民泊', '認定', '制限なし（最低宿泊日数あり）', '23区では大田区']] } } },
    },
    en: {
      sources: [{ label: 'Japan Tourism Agency: Minpaku portal (English available)', url: MLIT_MINPAKU }],
      sections: { systems: { table: { headers: ['System', 'Procedure', 'Nights per year', 'Main conditions'], rows: [['Minpaku law', 'Notification', 'Up to 180', 'Ward ordinances add limits'], ['Hotel Business Act (simple lodging etc.)', 'Licence', 'No cap', 'Zoning, building use, facilities'], ['Special-zone minpaku', 'Certification', 'No cap (minimum stay applies)', 'Ota Ward in the 23 wards']] } } },
    },
    'zh-TW': {
      sources: [{ label: '觀光廳「民宿制度入口網站」', url: MLIT_MINPAKU }],
      sections: { systems: { table: { headers: ['制度', '手續', '可營業天數', '主要條件'], rows: [['住宅宿泊事業法', '申報', '每年最多180天', '各區條例附加限制'], ['旅館業法（簡易宿所等）', '許可', '無上限', '用途地域、建物用途、設備'], ['特區民宿', '認定', '無上限（有最低住宿天數）', '23區中為大田區']] } } },
    },
    'zh-CN': {
      sources: [{ label: '观光厅“民宿制度门户网站”', url: MLIT_MINPAKU }],
      sections: { systems: { table: { headers: ['制度', '手续', '可营业天数', '主要条件'], rows: [['住宅宿泊事业法', '申报', '每年最多180天', '各区条例附加限制'], ['旅馆业法（简易宿所等）', '许可', '无上限', '用途地域、建筑用途、设备'], ['特区民宿', '认定', '无上限（有最低住宿天数）', '23区中为大田区']] } } },
    },
  },
  'buying-property-japan-visa': {
    ja: { sections: { 'no-visa': { table: { headers: ['あなたの状況', '購入', '住宅ローン', '日本に住む'], rows: [['日本の在留資格がある', 'できる', '利用できる可能性あり', '在留資格の範囲で可'], ['海外在住・在留資格なし', 'できる', '難しい（現金購入が一般的）', '短期滞在の範囲のみ'], ['日本法人を設立して買う', 'できる（法人名義）', '法人として借入れの可能性', '法人を作るだけでは不可']] } } } },
    en: { sections: { 'no-visa': { table: { headers: ['Your situation', 'Buy', 'Mortgage', 'Live in Japan'], rows: [['Japanese residence status', 'Yes', 'Possible', 'Within your status'], ['Living abroad, no status', 'Yes', 'Difficult (cash is usual)', 'Short stays only'], ['Buying through a Japanese company', 'Yes (company name)', 'Possible as a company', 'Not from the company alone']] } } } },
    'zh-TW': { sections: { 'no-visa': { table: { headers: ['您的情況', '購買', '房貸', '在日本居住'], rows: [['持有日本在留資格', '可以', '有機會申請', '在在留資格範圍內'], ['居住海外、無在留資格', '可以', '困難（多為現金購買）', '僅限短期停留'], ['設立日本法人購買', '可以（法人名義）', '可能以法人借款', '僅設立法人不可']] } } } },
    'zh-CN': { sections: { 'no-visa': { table: { headers: ['您的情况', '购买', '房贷', '在日本居住'], rows: [['持有日本在留资格', '可以', '有机会申请', '在在留资格范围内'], ['居住海外、无在留资格', '可以', '困难（多为全款购买）', '仅限短期停留'], ['设立日本法人购买', '可以（法人名义）', '可能以法人借款', '仅设立法人不可']] } } } },
  },
  'renovating-resale-condo-tokyo': {
    ja: { sections: { scope: { table: { headers: ['部分', '例', '個人で工事できるか'], rows: [['専有部分', '床・壁・天井、キッチン・浴室・トイレ', 'できる（管理組合への申請が必要）'], ['共用部分', '窓サッシ、玄関ドアの外側、バルコニー、外壁、柱・梁', '原則できない'], ['専有部分の配管', '床下の給排水管', '建物の構造しだい']] } } } },
    en: { sections: { scope: { table: { headers: ['Part', 'Examples', 'Can one owner change it?'], rows: [['Private parts', 'Floors, walls, ceilings, kitchen, bathroom, toilet', 'Yes, with association approval'], ['Common parts', 'Window frames, outside of the front door, balcony, exterior, structure', 'Generally no'], ['Pipes inside the unit', 'Water and drain pipes under the floor', 'Depends on the building']] } } } },
    'zh-TW': { sections: { scope: { table: { headers: ['部分', '例子', '個人能否施工'], rows: [['專有部分', '地板、牆壁、天花板、廚房、浴室、廁所', '可以（需向管理組合申請）'], ['公共部分', '窗框、玄關門外側、陽台、外牆、柱樑', '原則上不可'], ['專有部分的管線', '地板下的給排水管', '依建物結構而定']] } } } },
    'zh-CN': { sections: { scope: { table: { headers: ['部分', '例子', '个人能否施工'], rows: [['专有部分', '地板、墙壁、天花板、厨房、浴室、卫生间', '可以（需向管理组合申请）'], ['公共部分', '窗框、入户门外侧、阳台、外墙、柱梁', '原则上不可'], ['专有部分的管道', '地板下的给排水管', '取决于建筑结构']] } } } },
  },
}
