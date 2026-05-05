import { type Locale } from '@/i18n/config'

export interface GuideSection {
  id: string
  heading: string
  paragraphs: string[]
  bullets?: string[]
}

export interface GuideFaqItem {
  question: string
  answer: string
}

export interface GuideLocaleContent {
  category: string
  title: string
  excerpt: string
  seoDescription: string
  intro: string
  keyTakeaways: string[]
  sections: GuideSection[]
  faq: GuideFaqItem[]
  ctaTitle: string
  ctaDescription: string
}

export interface GuideArticle {
  slug: string
  publishedAt: string
  updatedAt: string
  readMinutes: number
  tags: string[]
  locales: Record<Locale, GuideLocaleContent>
}

export const guideArticles: GuideArticle[] = [
  {
    slug: 'how-to-buy-japan-investment-property',
    publishedAt: '2026-04-09',
    updatedAt: '2026-04-09',
    readMinutes: 7,
    tags: ['foreign buyer', 'acquisition', 'japan real estate'],
    locales: {
      ja: {
        category: '購入ガイド',
        title: '外国人投資家が日本で収益不動産を買う流れ',
        excerpt:
          '物件選定から買付、契約、決済、引渡し、運用開始まで、日本の収益不動産購入プロセスを実務目線で整理します。',
        seoDescription:
          '外国人投資家が日本で収益不動産を買う手順、必要書類、初期費用、注意点を実務ベースで解説。',
        intro:
          '日本の不動産は外国人でも購入できます。ただし、買えることと、スムーズに進むことは別です。投資物件では、融資の可否、出口価格、賃貸需要、管理体制まで含めて最初に設計しておく必要があります。',
        keyTakeaways: [
          '日本では外国人でも不動産所有が可能',
          '実務上は本人確認、送金経路、管理体制の整理が重要',
          '価格だけでなく、利回りの質と運用難易度を見るべき',
        ],
        sections: [
          {
            id: 'why-japan',
            heading: 'なぜ日本不動産が海外投資家に選ばれるのか',
            paragraphs: [
              '東京の中心部は、賃貸需要の厚さ、流動性、法的安定性が揃っているため、海外投資家にとって比較的読みやすい市場です。都心13区は特に、空室リスクと出口の両方を考えやすいエリアです。',
              '一方で、表面利回りだけを見て地方や築古に寄りすぎると、修繕・空室・再販で苦しくなります。最初の1件は、運用の再現性を取りやすいエリアと商品から入る方が現実的です。',
            ],
          },
          {
            id: 'process',
            heading: '購入の実務フロー',
            paragraphs: [
              '基本の流れは、条件整理、候補抽出、物件精査、買付、重要事項説明、売買契約、決済、引渡し、管理開始です。海外居住者の場合は、書類取得と送金手配に時間がかかるため、通常より前倒しで準備します。',
              '収益物件では、現地確認より先に、レントロール、修繕履歴、管理形態、入居状況、売主事情、出口想定を数字で確認する方が重要です。',
            ],
            bullets: [
              '希望条件をエリア、予算、種別、利回り、保有期間で明確化する',
              '物件資料だけでなく、賃料の継続性と修繕コストも確認する',
              '買付前に送金・名義・契約主体を固める',
            ],
          },
          {
            id: 'costs',
            heading: '最初に見落としやすい費用',
            paragraphs: [
              '購入価格のほかに、仲介手数料、登記費用、印紙、司法書士費用、火災保険、固定資産税精算、管理関連の初期費用が発生します。案件によっては、修繕費やリーシング費用も早期に必要です。',
              '投資判断では、取得時コストを含めた実質利回りで見ないと、表面数字だけが良く見えてしまいます。',
            ],
            bullets: [
              '仲介手数料',
              '登記・司法書士関連費用',
              '税金精算',
              '管理・修繕の初期コスト',
            ],
          },
          {
            id: 'mistakes',
            heading: '失敗しやすいポイント',
            paragraphs: [
              '一番多いのは、物件単体の見た目で判断して、運用難易度を軽視することです。築年数、修繕履歴、借地、告知事項、リーシング難易度、管理会社の質は、将来の収益を大きく左右します。',
              'また、海外投資家は返信速度が遅いだけで案件を逃すことがあります。本人確認書類、送金証憑、サイン方法、契約主体は先に整えておくべきです。',
            ],
          },
          {
            id: 'checklist',
            heading: '買付前の最低チェックリスト',
            paragraphs: [
              '買付を入れる前に、数字と実務の両方を短く確認できる状態を作るべきです。特に、保有期間と出口戦略が曖昧なまま買うと、価格調整や売却判断でぶれます。',
            ],
            bullets: [
              '実質ベースで利回りを見ているか',
              '賃貸需要と空室時の再募集条件を把握しているか',
              '修繕・管理の想定費用が織り込まれているか',
              '購入主体と送金方法が確定しているか',
            ],
          },
        ],
        faq: [
          {
            question: '外国人でも日本の不動産を購入できますか？',
            answer:
              'できます。日本では外国籍でも不動産の所有自体は可能です。ただし、融資条件、送金実務、税務申告、管理体制は別途整理が必要です。',
          },
          {
            question: '最初の投資対象は一棟と区分のどちらが良いですか？',
            answer:
              '予算と運用体制によります。最初の1件で安定性を重視するなら、都心の需要が読みやすい区分や管理負荷の低い物件が入りやすいです。',
          },
          {
            question: '現地に行かずに購入できますか？',
            answer:
              '案件によっては可能ですが、本人確認、契約手続、資金移動、委任状対応など事前準備が必要です。投資額が大きい場合は、短期でも現地確認した方が安全です。',
          },
        ],
        ctaTitle: '公開中の東京投資物件を見る',
        ctaDescription:
          '都心13区の収益物件を一覧で見ながら、利回り、駅距離、価格帯を比較できます。',
      },
      en: {
        category: 'Acquisition Guide',
        title: 'How Overseas Investors Can Buy Investment Property in Japan',
        excerpt:
          'A practical overview of how foreign investors evaluate, reserve, contract, close, and start operating income property in Japan.',
        seoDescription:
          'Learn how overseas investors buy investment property in Japan, including timeline, paperwork, costs, and common execution mistakes.',
        intro:
          'Foreign buyers can legally own property in Japan, but the real challenge is execution. The best deals usually go to buyers who can move quickly on diligence, documentation, and fund flow while staying disciplined on yield quality and exit risk.',
        keyTakeaways: [
          'Foreign ownership is permitted in Japan',
          'Execution speed matters as much as legal eligibility',
          'You should underwrite operations and exit before making an offer',
        ],
        sections: [
          {
            id: 'why-japan',
            heading: 'Why Japan is attractive to overseas investors',
            paragraphs: [
              'Central Tokyo remains attractive because tenant demand, legal clarity, and resale liquidity are stronger than in many other markets. For first-time cross-border buyers, that makes underwriting more predictable.',
              'That said, high advertised yields can hide leasing weakness, deferred repairs, or poor resale depth. Your first deal should optimize for repeatability, not for the most aggressive headline number.',
            ],
          },
          {
            id: 'process',
            heading: 'The real acquisition process',
            paragraphs: [
              'In practice, the sequence is: define criteria, source opportunities, screen the asset, submit an offer, complete diligence, sign the contract, fund the closing, take title, and hand over to management. Overseas buyers should prepare identity documents and remittance logistics earlier than local buyers.',
              'For income property, your first screen should focus on rent stability, repair history, tenant profile, management structure, seller motivation, and realistic exit assumptions.',
            ],
            bullets: [
              'Set your target ward, budget, asset type, yield band, and hold period',
              'Check rent durability and capex risk before reacting to marketing copy',
              'Finalize purchasing entity and fund path before you bid',
            ],
          },
          {
            id: 'costs',
            heading: 'Costs investors often underestimate',
            paragraphs: [
              'Beyond the purchase price, acquisition costs include brokerage, registration, judicial scrivener fees, stamp tax, insurance, tax settlement, and sometimes immediate repair or leasing costs.',
              'If you only look at headline yield and ignore entry costs, your projected return can be materially overstated.',
            ],
            bullets: [
              'Brokerage fees',
              'Registration and legal closing costs',
              'Tax prorations',
              'Early repair and management expenses',
            ],
          },
          {
            id: 'mistakes',
            heading: 'Where foreign investors usually lose time or money',
            paragraphs: [
              'The most common mistake is choosing based on appearance or nominal yield without underwriting operating difficulty. Building age, repair history, tenant churn, special rights, and local leasing depth all matter.',
              'The second mistake is being administratively slow. Deals can move before buyers have clarified signatures, source of funds, remittance route, or ownership structure.',
            ],
          },
          {
            id: 'checklist',
            heading: 'Offer-stage checklist',
            paragraphs: [
              'Before you submit a purchase application, you should be able to explain the cash flow, downside case, hold strategy, and exit path in a few lines. If you cannot, the deal is not ready.',
            ],
            bullets: [
              'Did you review realistic net yield rather than headline yield alone?',
              'Do you understand the local tenant pool and reletting conditions?',
              'Are capex and management assumptions reflected in your model?',
              'Is your buying entity and remittance path already decided?',
            ],
          },
        ],
        faq: [
          {
            question: 'Can foreigners buy property in Japan without residency?',
            answer:
              'Yes. Japan generally allows foreign buyers to own property without residency. Financing, tax filing, and day-to-day operations still require separate planning.',
          },
          {
            question: 'Is a condominium or a whole building better for a first deal?',
            answer:
              'That depends on budget and operating capacity. Many first-time overseas investors start with assets in central areas where tenant demand and resale depth are easier to read.',
          },
          {
            question: 'Can I buy remotely?',
            answer:
              'Sometimes yes, but only if identity verification, signatures, fund transfer, and representation arrangements are prepared early. Larger deals usually justify at least one site visit.',
          },
        ],
        ctaTitle: 'Browse live Tokyo investment listings',
        ctaDescription:
          'Compare central Tokyo opportunities by price, station access, and yield before shortlisting your first candidates.',
      },
      'zh-TW': {
        category: '購買指南',
        title: '海外投資人購買日本收益不動產的實務流程',
        excerpt:
          '從條件設定、物件篩選、買付、簽約、交割到出租管理，整理海外投資人購買日本收益物件的實務步驟。',
        seoDescription:
          '說明海外投資人如何購買日本收益不動產，包括流程、文件、取得成本與常見風險。',
        intro:
          '外國人可以在日本持有不動產，但真正的難點在於執行。收益型物件的評估不只是買不買得起，而是能否快速完成盡職調查、資金安排、契約流程，並且在持有期間維持穩定營運。',
        keyTakeaways: [
          '外國人可以在日本持有不動產',
          '實務上最重要的是文件、資金與時程管理',
          '投資判斷應先看營運與退出，而不是只看表面投報率',
        ],
        sections: [
          {
            id: 'why-japan',
            heading: '為什麼日本不動產對海外投資人有吸引力',
            paragraphs: [
              '東京核心區具備租賃需求穩定、法規清楚、流動性相對高等特點，對跨境投資人來說，比較容易建立可重複的投資框架。',
              '但如果只看高報酬率而忽略修繕、空置與轉售風險，實際報酬可能遠低於預期。第一筆交易通常更適合選擇運營難度較低、需求較穩定的產品。',
            ],
          },
          {
            id: 'process',
            heading: '實際購買流程',
            paragraphs: [
              '一般流程包括：設定條件、篩選物件、初步分析、提出買付、盡職調查、簽署契約、交割、過戶，以及交給管理方開始營運。海外買家應提早準備身分文件與資金匯款安排。',
              '收益物件的重點是租金延續性、修繕履歷、管理模式、出租狀況與未來出售可能，而不是只看銷售頁面的包裝。',
            ],
            bullets: [
              '先定義區域、預算、產品類型、投報率與持有年限',
              '在買付前確認租金品質與修繕風險',
              '先確定購買主體與資金路徑，再進入出價',
            ],
          },
          {
            id: 'costs',
            heading: '常被低估的取得成本',
            paragraphs: [
              '除了房價本身，還會有仲介費、登記費、司法書士費、印紙稅、保險、稅金分攤，以及部分案件的初期修繕與招租成本。',
              '如果只用表面報酬率判斷，沒有把取得成本與早期資本支出納入，投資回報通常會被高估。',
            ],
            bullets: [
              '仲介費',
              '登記與法律費用',
              '稅費分攤',
              '初期修繕與管理成本',
            ],
          },
          {
            id: 'mistakes',
            heading: '最常見的失誤',
            paragraphs: [
              '最常見的是只看外觀或表面收益，而忽略持有期間的難度。屋齡、修繕、租客更替、特殊權利、區域租賃深度，都會影響真實回報。',
              '另一個問題是行政準備太慢。若買家還沒釐清簽約方式、資金來源與匯款流程，案件往往會先被別人拿走。',
            ],
          },
          {
            id: 'checklist',
            heading: '買付前的檢查清單',
            paragraphs: [
              '在提出買付前，應該能用很短的時間說清楚現金流、下行情境、持有策略與退出方式。如果做不到，代表還沒準備好。',
            ],
            bullets: [
              '是否以實質投報率而非表面投報率評估？',
              '是否理解當地租客需求與再出租條件？',
              '是否已納入修繕與管理費用？',
              '購買主體與資金移轉方式是否已確定？',
            ],
          },
        ],
        faq: [
          {
            question: '外國人沒有日本居留也可以買房嗎？',
            answer:
              '可以。日本原則上允許外國人持有不動產，但融資、稅務申報與營運管理仍需另外安排。',
          },
          {
            question: '第一筆投資比較適合區分還是整棟？',
            answer:
              '取決於預算與管理能力。很多海外投資人會先從東京核心區、需求較穩定的物件切入，降低判斷難度。',
          },
          {
            question: '可以完全不來日本就完成交易嗎？',
            answer:
              '有些案件可以，但前提是身分驗證、授權、簽約與匯款流程都提早安排完成。金額較大的案件通常仍建議至少一次現地確認。',
          },
        ],
        ctaTitle: '查看東京投資物件',
        ctaDescription:
          '可直接比較都心13區物件的價格、車站距離與表面投報率，建立第一輪候選名單。',
      },
      'zh-CN': {
        category: '购买指南',
        title: '海外投资人购买日本收益房产的实务流程',
        excerpt:
          '从条件设定、房源筛选、买付、签约、交割到出租管理，整理海外投资人购买日本收益物业的关键步骤。',
        seoDescription:
          '介绍海外投资人如何购买日本收益房产，包括流程、文件、取得成本和常见风险。',
        intro:
          '外国人可以在日本持有房产，但真正的难点在于执行。收益型物业的关键不只是能不能买，而是能否快速完成尽调、资金安排、合同流程，并在持有期间维持稳定运营。',
        keyTakeaways: [
          '外国人可以在日本持有房产',
          '实务上最重要的是文件、资金和时间管理',
          '投资判断应先看运营与退出，而不是只看表面收益率',
        ],
        sections: [
          {
            id: 'why-japan',
            heading: '为什么日本房产对海外投资人有吸引力',
            paragraphs: [
              '东京核心区具备租赁需求稳定、法规清晰、流动性相对高等特点，对跨境投资人来说更容易建立可复制的投资框架。',
              '但如果只看高收益率而忽略维修、空置和转售风险，实际回报可能明显低于预期。第一笔交易通常更适合选择运营难度较低、需求更稳定的产品。',
            ],
          },
          {
            id: 'process',
            heading: '实际购买流程',
            paragraphs: [
              '一般流程包括：设定条件、筛选房源、初步分析、提交买付、尽职调查、签署合同、交割、过户，以及交给管理方开始运营。海外买家应提前准备身份证明和资金汇款安排。',
              '收益型物业的重点是租金持续性、维修记录、管理方式、出租情况和未来出售可能，而不只是销售资料上的包装。',
            ],
            bullets: [
              '先确定区域、预算、产品类型、收益率和持有年限',
              '在买付前确认租金质量与维修风险',
              '先明确购买主体和资金路径，再进入出价',
            ],
          },
          {
            id: 'costs',
            heading: '常被低估的取得成本',
            paragraphs: [
              '除了房价本身，还会有中介费、登记费、司法书士费用、印花税、保险、税费分摊，以及部分项目的初期维修和招租成本。',
              '如果只用表面收益率判断，没有把取得成本和早期资本支出算进去，投资回报通常会被高估。',
            ],
            bullets: [
              '中介费',
              '登记与法律费用',
              '税费分摊',
              '初期维修与管理成本',
            ],
          },
          {
            id: 'mistakes',
            heading: '最常见的失误',
            paragraphs: [
              '最常见的是只看外观或表面收益，而忽略持有期的实际难度。房龄、维修、租客更替、特殊权利、区域租赁深度都会影响真实回报。',
              '另一个问题是行政准备太慢。如果买家还没有理清签约方式、资金来源和汇款路径，项目往往会先被别人拿走。',
            ],
          },
          {
            id: 'checklist',
            heading: '买付前的检查清单',
            paragraphs: [
              '在提交买付前，应该能在很短时间内说明现金流、下行情景、持有策略和退出方式。如果做不到，说明这笔交易还没准备好。',
            ],
            bullets: [
              '是否以实际收益率而不是表面收益率评估？',
              '是否理解当地租客需求和再出租条件？',
              '是否已计入维修和管理费用？',
              '购买主体和资金转移方式是否已经确定？',
            ],
          },
        ],
        faq: [
          {
            question: '外国人没有日本居留也能买房吗？',
            answer:
              '可以。日本原则上允许外国人持有不动产，但融资、税务申报和运营管理仍需另外安排。',
          },
          {
            question: '第一笔投资更适合买公寓还是整栋？',
            answer:
              '取决于预算和管理能力。很多海外投资人会先从东京核心区、需求更稳定的房源切入，降低判断难度。',
          },
          {
            question: '可以完全不来日本就完成交易吗？',
            answer:
              '部分项目可以，但前提是身份验证、授权、签约和汇款流程都提前准备好。金额较大的交易通常仍建议至少进行一次现场确认。',
          },
        ],
        ctaTitle: '查看东京投资房源',
        ctaDescription:
          '可以直接比较都心13区房源的价格、车站距离和表面收益率，先建立第一轮候选清单。',
      },
    },
  },
  {
    slug: 'tokyo-cap-rate-guide',
    publishedAt: '2026-04-09',
    updatedAt: '2026-04-09',
    readMinutes: 6,
    tags: ['yield', 'tokyo market', 'underwriting'],
    locales: {
      ja: {
        category: 'マーケット分析',
        title: '東京の利回り物件を見るときに知っておくべきこと',
        excerpt:
          '4%、5%、6%という数字の違いを、都心13区の実務感覚に引き直して解説します。利回りの高さだけで判断しないための基準です。',
        seoDescription:
          '東京の投資用不動産で表面利回り4%、5%、6%が何を意味するか、立地・築年・出口の観点から整理します。',
        intro:
          '東京の投資物件では、利回りが高いこと自体が良いとは限りません。利回りは、価格が安い理由や運用難易度の裏返しでもあります。数字を見る順番を間違えると、見た目が良い物件に引っ張られます。',
        keyTakeaways: [
          '表面利回りは入口指標であって結論ではない',
          '都心の低利回り物件は出口と安定性で評価されることが多い',
          '高利回りは修繕・空室・流動性のリスクを伴いやすい',
        ],
        sections: [
          {
            id: 'gross-vs-real',
            heading: '表面利回りだけでは足りない理由',
            paragraphs: [
              '表面利回りは、年間賃料を価格で割っただけの数字です。管理費、修繕、空室、原状回復、リーシングコスト、税金は含まれていません。',
              '同じ5%でも、修繕済みで空室リスクが低い都心物件と、将来コストが読みにくい築古物件では、実質収益が大きく変わります。',
            ],
          },
          {
            id: 'ranges',
            heading: '都心13区で利回りの数字が意味するもの',
            paragraphs: [
              'ざっくり言えば、都心の4%台は「安定性・流動性寄り」、5%台は「バランス型」、6%以上は「何らかのリスク説明が必要」と考えるのが実務的です。',
              'もちろん築年数、駅距離、再開発、規模、テナント属性で変わりますが、数字だけが突出している場合は理由を先に確認するべきです。',
            ],
            bullets: [
              '4%台: 立地や出口の強さで買われるケースが多い',
              '5%台: 条件次第で最も比較しやすいレンジ',
              '6%以上: 修繕、空室、特殊事情を疑うべきレンジ',
            ],
          },
          {
            id: 'risk',
            heading: '高利回りの裏にあるもの',
            paragraphs: [
              '駅距離、築古、旧耐震、借地権、エリアの賃貸需要、狭小間取り、入居属性、再建築の難しさなどが、価格に織り込まれて利回りが上がることがあります。',
              '利回りを上げる理由が、改善可能な運用課題なのか、構造的に消えないリスクなのかで判断は大きく変わります。',
            ],
          },
          {
            id: 'metrics',
            heading: '利回り以外に必ず見る指標',
            paragraphs: [
              '価格だけでなく、賃料の継続性、出口の流動性、修繕のタイミング、管理体制、想定空室率、再募集賃料、資本的支出を一緒に見ないと、数字は簡単に錯覚を生みます。',
            ],
            bullets: [
              '再募集時の想定賃料',
              '過去の修繕履歴と今後の資本的支出',
              '駅距離とエリアの賃貸需要',
              '売却時に誰が買うかという出口像',
            ],
          },
          {
            id: 'screening',
            heading: '最初の足切りに使える見方',
            paragraphs: [
              '初期スクリーニングでは、利回り、駅距離、築年、エリア、価格帯、修繕履歴を短く並べて、異常値を弾くのが効率的です。詳しい判断はその後です。',
            ],
          },
        ],
        faq: [
          {
            question: '東京で表面利回り6%は高いですか？',
            answer:
              '都心13区では高めです。良い意味ではなく、まず高い理由を確認すべき数字です。築年、権利関係、修繕、空室、流動性を先に見てください。',
          },
          {
            question: '低利回りでも買う価値はありますか？',
            answer:
              'あります。出口の強さや需要の安定性が高い物件は、低利回りでも総合的に見て良い投資になることがあります。',
          },
          {
            question: '一番見るべき数字は何ですか？',
            answer:
              '表面利回り単体ではなく、実質利回り、再募集賃料、修繕負担、出口価格の4点をセットで見るのが現実的です。',
          },
        ],
        ctaTitle: '利回りで比較しやすい物件を見る',
        ctaDescription:
          '価格、駅距離、利回りを横並びで見ながら、数字の違いを都心13区の文脈で比較できます。',
      },
      en: {
        category: 'Market Analysis',
        title: 'Tokyo Cap Rate Guide: What 4%, 5%, and 6% Yield Really Mean',
        excerpt:
          'A practical way to interpret yield in central Tokyo without confusing headline return with actual investment quality.',
        seoDescription:
          'Understand what 4%, 5%, and 6% yield usually means for Tokyo investment property across central wards, age, liquidity, and risk.',
        intro:
          'Yield is useful, but only when read in context. In Tokyo, a higher cap rate is often compensation for some combination of leasing risk, repair burden, structural weakness, or thinner resale demand.',
        keyTakeaways: [
          'Yield is a screening input, not an investment decision',
          'Lower yields in central Tokyo often trade on stability and exit liquidity',
          'Higher yields require a clearer explanation before they deserve attention',
        ],
        sections: [
          {
            id: 'gross-vs-real',
            heading: 'Why yield is only the first number',
            paragraphs: [
              'Headline yield can ignore repairs, vacancy, leasing costs, insurance, tax, and asset management friction.',
              'Two properties with the same 5% yield can produce very different real cash flow depending on tenant quality, capex timing, and reletting risk.',
            ],
          },
          {
            id: 'ranges',
            heading: 'How to read yield bands in central Tokyo',
            paragraphs: [
              'As a rough framing tool, 4% in central Tokyo often signals stability and exit strength, 5% can be a balanced underwriting range, and 6% or above usually requires a risk explanation.',
              'That explanation may be acceptable, but it should be explicit before you get excited by the number.',
            ],
            bullets: [
              '4% range: often priced for location quality and liquidity',
              '5% range: usually the easiest range to compare rationally',
              '6%+ range: investigate why the discount exists',
            ],
          },
          {
            id: 'risk',
            heading: 'What usually sits behind high yield',
            paragraphs: [
              'Long station walks, older buildings, deferred repairs, weak tenant depth, non-standard rights, micro-lot constraints, and uncertain resale can all push pricing lower and yield higher.',
              'The key question is whether the issue is operationally fixable or structurally permanent.',
            ],
          },
          {
            id: 'metrics',
            heading: 'The numbers that matter alongside yield',
            paragraphs: [
              'You should review expected market rent, capital expenditure timing, tenant turnover risk, management quality, and realistic resale depth together with yield.',
            ],
            bullets: [
              'Reletting rent assumptions',
              'Repair history and planned capital expenditure',
              'Station access and tenant pool depth',
              'Who the next buyer is likely to be',
            ],
          },
          {
            id: 'screening',
            heading: 'A better first-pass screening method',
            paragraphs: [
              'For initial screening, combine yield, station access, building age, ward, price point, and repair condition. That is often enough to eliminate weak leads before deeper diligence.',
            ],
          },
        ],
        faq: [
          {
            question: 'Is 6% yield high for central Tokyo?',
            answer:
              'Yes, usually. That does not automatically make it bad, but it does mean you should identify the specific reason the market is pricing the asset at that yield.',
          },
          {
            question: 'Can lower-yield assets still be attractive?',
            answer:
              'Absolutely. Lower-yield assets can still perform well when liquidity, tenant demand, and downside protection are stronger.',
          },
          {
            question: 'What number matters most beyond cap rate?',
            answer:
              'A practical answer is not one number but a set: realistic net yield, reletting rent, capex timing, and probable exit pricing.',
          },
        ],
        ctaTitle: 'Compare Tokyo listings by yield and station access',
        ctaDescription:
          'Use live listings to compare yield in context instead of reacting to headline numbers alone.',
      },
      'zh-TW': {
        category: '市場分析',
        title: '看東京投資物件時，如何正確理解投報率',
        excerpt:
          '用都心13區的實務角度理解 4%、5%、6% 的差異，避免只看表面報酬率就做判斷。',
        seoDescription:
          '說明東京投資不動產中 4%、5%、6% 表面投報率各自代表什麼，並分析立地、屋齡與退出風險。',
        intro:
          '投報率本身不是答案，只是入口。東京的不動產如果表面報酬率特別高，往往代表租賃、修繕、權利或流動性上有額外風險需要被市場折價。',
        keyTakeaways: [
          '表面投報率只是初步篩選工具',
          '都心低投報率物件常常是以穩定性與退出流動性取勝',
          '高投報率必須先找出原因，才值得深入',
        ],
        sections: [
          {
            id: 'gross-vs-real',
            heading: '為什麼不能只看表面投報率',
            paragraphs: [
              '表面投報率只是年租金除以價格，沒有包含修繕、空置、重新招租、保險、稅費與管理摩擦。',
              '同樣是 5%，在東京核心區、修繕狀態良好的物件，與潛在支出高的老舊物件，實際現金流可能完全不同。',
            ],
          },
          {
            id: 'ranges',
            heading: '都心13區常見投報率區間的實務解讀',
            paragraphs: [
              '粗略來說，4% 左右通常代表穩定性與流動性較強，5% 是相對容易比較的平衡區間，6% 以上則應先找出折價原因。',
              '這些只是框架，不是結論。真正的判斷仍要回到屋齡、距站距離、權利關係與出租需求。',
            ],
            bullets: [
              '4%區間: 常由立地與退出性支撐價格',
              '5%區間: 最適合做橫向比較',
              '6%以上: 先確認高報酬率背後的原因',
            ],
          },
          {
            id: 'risk',
            heading: '高投報率通常反映哪些問題',
            paragraphs: [
              '較遠的車站距離、老舊建物、延後修繕、租客深度不足、特殊權利、地段弱勢或轉售買盤有限，都可能讓價格下降、表面投報率上升。',
              '關鍵在於，這些問題是可改善的營運議題，還是長期存在的結構性風險。',
            ],
          },
          {
            id: 'metrics',
            heading: '除了投報率之外，一定要一起看的指標',
            paragraphs: [
              '建議把再出租租金、修繕時點、管理品質、車站距離、租客需求深度與退出市場一起看，否則數字很容易造成錯覺。',
            ],
            bullets: [
              '再出租租金假設',
              '修繕履歷與未來資本支出',
              '車站距離與租客需求',
              '未來轉售可能的買方輪廓',
            ],
          },
          {
            id: 'screening',
            heading: '更有效率的初步篩選方式',
            paragraphs: [
              '第一輪可以先把投報率、距站、屋齡、區域、價格與修繕條件放在一起看，先排除明顯不合適的物件，再做深入分析。',
            ],
          },
        ],
        faq: [
          {
            question: '都心13區 6% 的表面投報率算高嗎？',
            answer:
              '通常算高。這不一定代表不好，但一定代表需要先找出市場為何給它這個價格。',
          },
          {
            question: '低投報率物件還值得買嗎？',
            answer:
              '值得，前提是它的需求穩定、流動性強、下行風險低。都心核心區很多好資產就是用這種邏輯交易。',
          },
          {
            question: '投報率以外，最重要的是什麼？',
            answer:
              '更實務的做法是一起看實質投報率、再出租租金、修繕支出與退出價格，而不是只找單一指標。',
          },
        ],
        ctaTitle: '用投報率與車站條件比較物件',
        ctaDescription:
          '直接查看東京物件列表，從價格、距站與表面投報率的組合來做第一輪篩選。',
      },
      'zh-CN': {
        category: '市场分析',
        title: '看东京投资房产时，如何正确理解收益率',
        excerpt:
          '用都心13区的实务视角理解 4%、5%、6% 的差异，避免只看表面收益率就做判断。',
        seoDescription:
          '说明东京投资房产中 4%、5%、6% 表面收益率分别意味着什么，并分析地段、房龄和退出风险。',
        intro:
          '收益率本身不是结论，只是入口。东京房产如果表面收益率特别高，往往意味着租赁、维修、权利或流动性上存在额外风险，需要市场折价。',
        keyTakeaways: [
          '表面收益率只是初步筛选工具',
          '都心低收益率房源往往胜在稳定性和退出流动性',
          '高收益率必须先解释原因，才值得深入',
        ],
        sections: [
          {
            id: 'gross-vs-real',
            heading: '为什么不能只看表面收益率',
            paragraphs: [
              '表面收益率只是年租金除以价格，并没有包含维修、空置、重新招租、保险、税费和管理摩擦。',
              '同样是 5%，在东京核心区维修状态良好的房源，和潜在支出高的老旧房源，实际现金流可能完全不同。',
            ],
          },
          {
            id: 'ranges',
            heading: '都心13区常见收益率区间的实务解读',
            paragraphs: [
              '粗略来说，4% 左右通常代表稳定性和流动性较强，5% 是相对容易比较的平衡区间，6% 以上则应先找出折价原因。',
              '这些只是框架，不是结论。真正的判断仍应回到房龄、距站、权利关系和出租需求。',
            ],
            bullets: [
              '4%区间: 往往由地段与退出性支撑价格',
              '5%区间: 最适合横向比较',
              '6%以上: 先确认高收益率背后的原因',
            ],
          },
          {
            id: 'risk',
            heading: '高收益率通常反映哪些问题',
            paragraphs: [
              '较远的车站距离、老旧建筑、延后维修、租客深度不足、特殊权利、地段弱势或转售买盘有限，都可能让价格下降、表面收益率上升。',
              '关键在于，这些问题是可改善的运营议题，还是长期存在的结构性风险。',
            ],
          },
          {
            id: 'metrics',
            heading: '除了收益率，一定要一起看的指标',
            paragraphs: [
              '建议同时看再出租租金、维修时点、管理质量、距站条件、租客需求深度和退出市场，否则数字很容易带来错觉。',
            ],
            bullets: [
              '再出租租金假设',
              '维修记录与未来资本支出',
              '车站距离与租客需求',
              '未来转售可能的买方轮廓',
            ],
          },
          {
            id: 'screening',
            heading: '更有效的初步筛选方法',
            paragraphs: [
              '第一轮可先把收益率、距站、房龄、区域、价格和维修条件放在一起看，先排除明显不合适的房源，再进入深入分析。',
            ],
          },
        ],
        faq: [
          {
            question: '都心13区 6% 的表面收益率算高吗？',
            answer:
              '通常算高。这不一定代表不好，但一定意味着要先搞清楚市场为什么给它这样的价格。',
          },
          {
            question: '低收益率房源还值得买吗？',
            answer:
              '值得，前提是它的需求稳定、流动性强、下行风险低。东京核心区很多优质资产就是按这个逻辑交易的。',
          },
          {
            question: '收益率之外最重要的是什么？',
            answer:
              '更实务的做法是同时看实际收益率、再出租租金、维修支出和退出价格，而不是只追单一指标。',
          },
        ],
        ctaTitle: '按收益率和车站条件比较房源',
        ctaDescription:
          '直接查看东京房源列表，从价格、距站和表面收益率的组合出发完成第一轮筛选。',
      },
    },
  },
  {
    slug: 'personal-vs-company-japan-property',
    publishedAt: '2026-04-09',
    updatedAt: '2026-04-09',
    readMinutes: 7,
    tags: ['structuring', 'company setup', 'tax planning'],
    locales: {
      ja: {
        category: '投資ストラクチャー',
        title: '個人で買うか、法人で買うか: 日本不動産投資の考え方',
        excerpt:
          '海外投資家が日本の不動産を取得するときに、個人名義と法人名義のどちらを選ぶべきかを、融資・税務・運用の観点で整理します。',
        seoDescription:
          '日本不動産投資で個人名義と法人名義のどちらが向いているかを、融資、運用、税務、管理の観点から比較します。',
        intro:
          '購入主体の選択は、価格交渉より先に決めておくべき重要論点です。個人か法人かで、融資の選択肢、書類量、税務対応、保有コスト、売却時の設計が変わります。',
        keyTakeaways: [
          '小規模・初回案件では個人の方が実務が軽いことが多い',
          '法人は資産管理と再投資の設計で有利になりやすい',
          '最適解は国籍ではなく、保有規模と運用方針で決まる',
        ],
        sections: [
          {
            id: 'personal',
            heading: '個人名義が向くケース',
            paragraphs: [
              '初回投資で、保有規模がまだ小さく、案件数も多くない場合は、個人名義の方がシンプルに進むことがあります。意思決定も早く、管理コストも比較的軽くなります。',
              'ただし、将来的に複数物件へ拡大する場合や、相続・パートナーシップ・再投資まで含めて考える場合は、最初から法人を検討した方が整理しやすいこともあります。',
            ],
          },
          {
            id: 'company',
            heading: '法人名義が向くケース',
            paragraphs: [
              '複数物件を持つ想定がある、共同投資の予定がある、収益の留保と再投資を前提にしている場合は、法人名義の方が管理しやすいことがあります。',
              '一方で、設立・維持・会計・申告のコストと手間は増えます。規模が小さいうちは、法人のメリットがコストを上回らないことも普通です。',
            ],
          },
          {
            id: 'finance',
            heading: '融資と審査への影響',
            paragraphs: [
              '融資可否は名義だけでなく、居住地、収入源、金融機関との関係、担保評価、投資経験、資産背景など多くの要素で決まります。',
              '海外投資家の場合、個人の方が通しやすいケースもあれば、法人の方が説明しやすいケースもあります。ここは一般論より、対象金融機関ごとの実務差が大きいです。',
            ],
          },
          {
            id: 'operations',
            heading: '運用と税務で見るべき点',
            paragraphs: [
              '保有後の管理では、家賃受取、修繕支払、外注契約、税務申告、売却時の処理まで見据える必要があります。個人名義は簡潔ですが、法人は整理された管理に向くことがあります。',
              'ただし、税務は居住国との関係も含めて個別性が高いため、一般論で決め打ちしない方が安全です。',
            ],
          },
          {
            id: 'decision',
            heading: '判断のための簡易フレーム',
            paragraphs: [
              '1件目で様子を見るのか、5年で複数棟に広げるのかで、答えは変わります。購入前に、保有年数、物件数、再投資方針、共同保有の有無を整理すると判断しやすくなります。',
            ],
            bullets: [
              '1件目でシンプルに始めたいなら個人寄り',
              '複数物件・共同出資・再投資重視なら法人寄り',
              '税務と融資は最終的に専門家・金融機関で確認する',
            ],
          },
        ],
        faq: [
          {
            question: '最初の1件目から法人を作るべきですか？',
            answer:
              '必ずしもそうではありません。保有規模と今後の投資計画によります。1件目で小さく始めるなら、個人の方が実務が軽いことも多いです。',
          },
          {
            question: '法人の方が融資に有利ですか？',
            answer:
              '一概には言えません。金融機関ごとの差が大きく、投資家の属性や案件内容によって判断が変わります。',
          },
          {
            question: '誰に相談して決めるべきですか？',
            answer:
              '不動産仲介だけでなく、税理士、司法書士、必要に応じて金融機関も含めて決めるべきです。特に海外居住者は税務面の整理が重要です。',
          },
        ],
        ctaTitle: '運用しやすい東京物件を先に見る',
        ctaDescription:
          '購入主体を決める前に、価格帯、駅距離、利回り帯を見て、自分の投資方針に合う物件感を固められます。',
      },
      en: {
        category: 'Investment Structuring',
        title: 'Should You Buy in Your Name or Through a Company in Japan?',
        excerpt:
          'A practical comparison of personal ownership and company ownership for overseas investors buying Japanese real estate.',
        seoDescription:
          'Compare personal ownership and company ownership for Japanese real estate investment, including financing, administration, and tax-related planning points.',
        intro:
          'Ownership structure should be decided before you get emotionally attached to a specific deal. The right answer changes with scale, financing plans, tax context, and whether you are building a portfolio or buying one asset.',
        keyTakeaways: [
          'Personal ownership is often simpler for smaller first deals',
          'Company ownership becomes more compelling as scale and reinvestment plans grow',
          'The best structure depends on strategy, not on a generic rule',
        ],
        sections: [
          {
            id: 'personal',
            heading: 'When personal ownership makes sense',
            paragraphs: [
              'For a first acquisition with limited scale, personal ownership can be easier to execute. Decision-making is faster and the administrative burden is usually lighter.',
              'If your plan is to test the market with one smaller asset before expanding, simplicity can be a real advantage.',
            ],
          },
          {
            id: 'company',
            heading: 'When company ownership makes sense',
            paragraphs: [
              'If you expect to hold multiple assets, reinvest retained cash flow, or involve partners, a company can offer a cleaner operating framework.',
              'The tradeoff is that setup, maintenance, bookkeeping, and tax compliance become more demanding. At smaller scale, those costs can outweigh the benefits.',
            ],
          },
          {
            id: 'finance',
            heading: 'How structure affects financing',
            paragraphs: [
              'Financing outcomes depend on more than the ownership vehicle. Lender relationship, borrower profile, collateral quality, income history, and location all matter.',
              'For overseas buyers, there is no universal rule that company ownership is better or worse. The lender-specific process matters more than theory.',
            ],
          },
          {
            id: 'operations',
            heading: 'Operational and tax implications',
            paragraphs: [
              'After acquisition, you need a structure that can handle rent collection, vendor payments, repairs, accounting, and eventual sale efficiently.',
              'Tax treatment is highly fact-specific, especially when cross-border reporting is involved. That is why structure decisions should not be made from generic internet advice alone.',
            ],
          },
          {
            id: 'decision',
            heading: 'A practical decision framework',
            paragraphs: [
              'Start with your actual plan: one asset or a portfolio, short hold or long hold, solo ownership or partners, distribute income or reinvest. Your structure should support that plan rather than work against it.',
            ],
            bullets: [
              'Smaller first deals often favor simplicity',
              'Portfolio building often favors clearer corporate structure',
              'Tax and financing decisions should be confirmed with specialists',
            ],
          },
        ],
        faq: [
          {
            question: 'Do I need a Japanese company for my first purchase?',
            answer:
              'Not always. Many investors begin with personal ownership if the deal is straightforward and scale is still limited.',
          },
          {
            question: 'Is company ownership always better for financing?',
            answer:
              'No. Financing depends on the lender, borrower profile, collateral, and documentation. Structure is only one factor.',
          },
          {
            question: 'Who should help me decide?',
            answer:
              'You should coordinate with your broker, tax adviser, legal registration professional, and where relevant, your lender. Cross-border tax considerations are too important to guess.',
          },
        ],
        ctaTitle: 'Look at Tokyo listings that fit your target scale',
        ctaDescription:
          'Review live opportunities by price, station access, and yield so you can match ownership structure to the kind of assets you actually plan to buy.',
      },
      'zh-TW': {
        category: '投資架構',
        title: '用個人名義還是法人名義買日本不動產？',
        excerpt:
          '從融資、管理、稅務與擴張角度，比較海外投資人使用個人或法人名義購買日本不動產的差異。',
        seoDescription:
          '比較日本不動產投資中個人名義與法人名義的差異，包含融資、管理、稅務與持有規模考量。',
        intro:
          '購買主體不應該等到喜歡某個案件之後才決定。名義會影響融資、文件、持有成本、營運效率與將來出售方式，因此應在進場前先定方向。',
        keyTakeaways: [
          '小規模首購案件常常更適合個人名義',
          '若目標是多物件與再投資，法人架構通常更有彈性',
          '最佳做法取決於規模與策略，而不是固定答案',
        ],
        sections: [
          {
            id: 'personal',
            heading: '適合用個人名義的情況',
            paragraphs: [
              '如果是第一筆交易、規模不大、希望先快速進入市場，個人名義通常更容易執行，行政負擔也較低。',
              '若只是先用一件資產測試市場，簡單往往比複雜更有價值。',
            ],
          },
          {
            id: 'company',
            heading: '適合用法人名義的情況',
            paragraphs: [
              '如果預計持有多件物件、需要保留現金流再投資，或有共同投資安排，法人架構通常更容易管理。',
              '但法人也會增加設立、維護、記帳與申報成本。規模太小時，未必划算。',
            ],
          },
          {
            id: 'finance',
            heading: '融資審查的差異',
            paragraphs: [
              '融資結果不只看名義，還會看貸款對象、收入來源、擔保、物件內容與金融機構關係。',
              '對海外投資人而言，沒有絕對的個人較好或法人較好，通常是金融機構別差異更大。',
            ],
          },
          {
            id: 'operations',
            heading: '營運與稅務上的考量',
            paragraphs: [
              '持有後要處理租金收取、付款、修繕、稅務申報與出售。個人名義較簡單，但法人在多物件管理上通常更有秩序。',
              '稅務尤其涉及居住地與跨境申報，不能只憑一般文章就做結論。',
            ],
          },
          {
            id: 'decision',
            heading: '實務上的判斷框架',
            paragraphs: [
              '先定義你是要買一件還是建立組合、短持有還是長持有、單獨投資還是共同投資。結構應該服務你的策略，而不是反過來限制你。',
            ],
            bullets: [
              '第一件、規模小、求快: 偏個人',
              '多物件、共同投資、再投資: 偏法人',
              '最終仍需和稅務與融資專業人士確認',
            ],
          },
        ],
        faq: [
          {
            question: '第一筆就一定要設法人嗎？',
            answer:
              '不一定。如果只是先買第一件、規模有限，個人名義可能更有效率。',
          },
          {
            question: '法人一定比較容易貸款嗎？',
            answer:
              '不一定。貸款結果往往更取決於金融機構、投資人背景與物件本身。',
          },
          {
            question: '應該找誰一起判斷？',
            answer:
              '除了仲介之外，最好同時與稅務顧問、司法書士及可能的金融機構一起確認。海外居住者尤其要先釐清稅務。',
          },
        ],
        ctaTitle: '先看符合你規模的東京物件',
        ctaDescription:
          '在決定用個人或法人前，先透過價格、距站與投報率帶出你真正想買的資產類型。',
      },
      'zh-CN': {
        category: '投资架构',
        title: '用个人名义还是公司名义买日本房产？',
        excerpt:
          '从融资、管理、税务和扩张角度，比较海外投资人用个人或公司名义购买日本房产的差异。',
        seoDescription:
          '比较日本房产投资中个人名义与公司名义的差异，包括融资、管理、税务和持有规模考量。',
        intro:
          '购买主体不应该等到喜欢上某个项目之后才决定。名义会影响融资、文件、持有成本、运营效率以及未来出售方式，因此最好在入场前先定方向。',
        keyTakeaways: [
          '小规模首购项目通常更适合个人名义',
          '如果目标是多房源和再投资，公司架构通常更灵活',
          '最佳答案取决于规模和策略，而不是固定规则',
        ],
        sections: [
          {
            id: 'personal',
            heading: '适合个人名义的情况',
            paragraphs: [
              '如果是第一笔交易、规模不大、希望先快速进入市场，个人名义通常更容易执行，行政负担也更低。',
              '如果只是先用一套资产测试市场，简单往往比复杂更有价值。',
            ],
          },
          {
            id: 'company',
            heading: '适合公司名义的情况',
            paragraphs: [
              '如果计划持有多套房源、保留现金流继续投资，或者存在共同投资安排，公司架构通常更容易管理。',
              '但公司也会增加设立、维护、记账和申报成本。规模太小时，未必划算。',
            ],
          },
          {
            id: 'finance',
            heading: '融资审查的差异',
            paragraphs: [
              '融资结果不只看名义，还会看借款人背景、收入来源、抵押质量、房源内容和与金融机构的关系。',
              '对于海外投资人来说，并不存在绝对的“个人更好”或“公司更好”，更多取决于目标金融机构的实务标准。',
            ],
          },
          {
            id: 'operations',
            heading: '运营与税务上的考虑',
            paragraphs: [
              '持有后需要处理租金收取、付款、维修、税务申报和出售。个人名义更简单，但公司在多房源管理上通常更有秩序。',
              '税务尤其涉及居住地与跨境申报，不能只靠一般文章做决定。',
            ],
          },
          {
            id: 'decision',
            heading: '实务判断框架',
            paragraphs: [
              '先定义你是买一套还是做组合、短期持有还是长期持有、单独投资还是联合投资。结构应该服务你的策略，而不是反过来限制你。',
            ],
            bullets: [
              '第一笔、规模小、求快: 偏个人',
              '多房源、联合投资、再投资: 偏公司',
              '最终仍需和税务及融资专业人士确认',
            ],
          },
        ],
        faq: [
          {
            question: '第一笔就一定要设公司吗？',
            answer:
              '不一定。如果只是先买第一套、规模有限，个人名义往往更高效。',
          },
          {
            question: '公司一定更容易贷款吗？',
            answer:
              '不一定。贷款结果更多取决于金融机构、投资人背景和房源本身。',
          },
          {
            question: '应该找谁一起判断？',
            answer:
              '除了中介外，最好同时与税务顾问、司法书士以及可能合作的金融机构一起确认。海外居住者尤其要先理清税务。',
          },
        ],
        ctaTitle: '先看符合你规模的东京房源',
        ctaDescription:
          '在决定用个人还是公司之前，先通过价格、距站和收益率筛出你真正会购买的资产类型。',
      },
    },
  },
]

export function getGuideArticles(locale: Locale) {
  return guideArticles.map((article) => ({
    slug: article.slug,
    publishedAt: article.publishedAt,
    updatedAt: article.updatedAt,
    readMinutes: article.readMinutes,
    tags: article.tags,
    ...article.locales[locale],
  }))
}

export function getGuideArticleBySlug(slug: string, locale: Locale) {
  const article = guideArticles.find((item) => item.slug === slug)
  if (!article) return null

  return {
    slug: article.slug,
    publishedAt: article.publishedAt,
    updatedAt: article.updatedAt,
    readMinutes: article.readMinutes,
    tags: article.tags,
    ...article.locales[locale],
  }
}

export function getGuideSlugs() {
  return guideArticles.map((article) => article.slug)
}
