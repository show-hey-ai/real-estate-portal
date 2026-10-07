import type { GuideArticle } from './guides'

const MOF_OVERVIEW = 'https://www.mof.go.jp/policy/international_policy/gaitame_kawase/real_property/seido_gaiyo.html'
const MOF_FAQ = 'https://www.mof.go.jp/policy/international_policy/gaitame_kawase/real_property/FAQ_J.pdf'
const MOF_LEAFLET = 'https://www.mof.go.jp/policy/international_policy/gaitame_kawase/real_property/real_property_leafletJ.pdf'
const TOKYO_TAX = 'https://www.tax.metro.tokyo.lg.jp/kazei/real_estate/kotei_tosi'

/**
 * Guides on the Foreign Exchange Act report for non-resident buyers (rules from 1 April 2026,
 * checked against the MOF FAQ and leaflet on 2026-10-07) and on Tokyo's fixed asset and city
 * planning taxes (Tokyo Metropolitan Tax Bureau page, checked the same day).
 */
export const extraGuideArticles6: GuideArticle[] = [
  {
    slug: 'japan-property-foreign-exchange-report',
    publishedAt: '2026-10-07',
    updatedAt: '2026-10-07',
    readMinutes: 5,
    tags: ['foreign buyer', 'non-resident', 'regulation'],
    locales: {
      ja: {
        category: '手続き',
        title: '非居住者が日本の不動産を買ったら：外為法の報告は20日以内（2026年4月から対象拡大）',
        excerpt: '海外に住む方が日本の不動産を取得したら、20日以内に日本銀行経由で財務大臣へ報告します。2026年4月1日以降は、自分が住むための購入も報告の対象になりました。',
        seoDescription: '非居住者による日本の不動産取得の外為法報告。取得後20日以内に日本銀行経由で提出、金額に関係なく必要。2026年4月1日からの変更点（居住用も対象）、代理提出、罰則を財務省資料にもとづき解説。',
        intro: '海外にお住まいの方が日本の不動産を買うと、売買や登記とは別に、外国為替及び外国貿易法（外為法）にもとづく報告が必要です。2026年4月1日に制度が改正され、以前は不要だった「自分が住むための購入」も報告の対象になりました。古い情報のままのサイトも多いので、最新の要点をまとめます。',
        keyTakeaways: [
          '非居住者が日本の不動産を取得したら、取得後20日以内に日本銀行経由で財務大臣へ報告する',
          '金額や面積の大小にかかわらず必要',
          '2026年4月1日以降の取得は、目的を問わず不動産そのものの報告が必要（居住用でも必要）',
          '不動産会社など日本の居住者が代理で提出できる。報告しないと罰則がある',
        ],
        sections: [
          {
            id: 'who',
            heading: '誰が報告するのか（非居住者とは）',
            paragraphs: [
              '報告するのは、外為法上の「非居住者」が日本の不動産やそれに関する権利（借地権・賃借権など）を取得したときです。居住者とは、日本に住所または居所がある個人と、日本に主たる事務所がある法人（外国法人の日本支店を含む）をいい、それ以外が非居住者です。',
              '外国人の方は原則として非居住者として扱われますが、日本の事務所に勤務する方や、入国後6か月以上たった方は居住者として扱われます。判断に迷う場合は、代理人や財務省に確認してください。',
            ],
          },
          {
            id: 'deadline',
            heading: '期限と提出先',
            paragraphs: [
              '報告書（様式第22）は、取得後20日以内に日本銀行を経由して財務大臣に提出します。取得日は、売買契約日や所有権移転日など適切な日を記載します。20日目が日本銀行の休業日なら翌営業日まで、郵送の場合は期限までに必着です。',
            ],
            bullets: [
              '金額や面積にかかわらず必要',
              '共有で買った場合は、購入者ごとに提出',
              '同じ時期に複数の物件を取得した場合は、1通にまとめられる',
            ],
          },
          {
            id: 'change-2026',
            heading: '2026年4月1日からの変更点',
            paragraphs: ['取得日によって、報告の対象と不要になる場合が変わりました。'],
            table: {
              headers: ['', '2026年3月31日までの取得', '2026年4月1日以降の取得'],
              rows: [
                ['報告の対象', '投資目的などで取得したもの', '目的を問わず取得したもの'],
                ['本人・家族・従業員が住むための取得', '報告不要', '不動産そのものは報告が必要（借地権などの権利部分だけ不要）'],
                ['他の非居住者からの取得', '報告不要', '報告が必要'],
                ['新しい記載項目', '—', '取引の相手方（居住者か非居住者か）、取得の目的、不動産番号'],
              ],
            },
          },
          {
            id: 'how',
            heading: '提出方法と代理',
            paragraphs: [
              '報告書の様式と記入の手引は日本語のみで、日本語で記載する必要があります。不動産会社など日本の居住者が代理で提出でき、代理人が提出する場合はオンラインでの提出が推奨されています。',
            ],
          },
          {
            id: 'penalty',
            heading: '提出し忘れたとき・罰則',
            paragraphs: [
              '期限を過ぎていても、速やかに提出する必要があります。その際は、期限内に提出できなかった理由を報告書の欄外に簡潔に書き添えます。報告をしなかったり虚偽の報告をしたりすると、6か月以下の拘禁刑または50万円以下の罰金の対象になります。',
            ],
          },
        ],
        faq: [
          { question: '自分が住むために買う場合も報告が必要ですか？', answer: '2026年4月1日以降の取得なら、不動産そのものについては報告が必要です。報告が不要になるのは、居住用などの目的で取得した借地権などの権利部分だけです。' },
          { question: '安い物件でも必要ですか？', answer: 'はい。金額や面積の大小にかかわらず必要です。' },
          { question: '日本語が読めません。', answer: '様式は日本語のみですが、不動産会社など日本の居住者が代理で作成・提出できます。' },
        ],
        ctaTitle: '購入後の手続きもご相談ください',
        ctaDescription: '物件探しから契約、引渡し後の報告まで、日本語・英語・中国語でご案内します。',
        sources: [
          { label: '財務省「本邦にある不動産の取得に関する報告」制度概要', url: MOF_OVERVIEW },
          { label: '財務省 よくあるご質問（2026年4月1日施行の改正後）', url: MOF_FAQ },
          { label: '財務省 リーフレット（令和8年6月）', url: MOF_LEAFLET },
        ],
      },
      en: {
        category: 'Procedures',
        title: 'Bought Japanese property as a non-resident? File the Foreign Exchange Act report within 20 days (wider since April 2026)',
        excerpt: 'Non-residents who acquire property in Japan report it to the Minister of Finance through the Bank of Japan within 20 days. Since 1 April 2026 this includes homes bought to live in.',
        seoDescription: 'The Foreign Exchange Act report for non-residents buying Japanese property: within 20 days via the Bank of Japan, at any price. What changed on 1 April 2026, filing through an agent, and penalties, based on Ministry of Finance materials.',
        intro: 'When someone living outside Japan buys Japanese property, there is a report to file under the Foreign Exchange and Foreign Trade Act, separate from the sale and the registration. The rules changed on 1 April 2026: buying a home to live in, which used to be exempt, now has to be reported too. Many websites still show the old rules, so here are the current essentials.',
        keyTakeaways: [
          'A non-resident who acquires Japanese property reports it within 20 days, via the Bank of Japan, to the Minister of Finance',
          'Required at any price or size',
          'For acquisitions from 1 April 2026, the property itself must be reported whatever the purpose, including a home to live in',
          'A Japanese resident such as your real estate agent can file it for you; not reporting is penalised',
        ],
        sections: [
          {
            id: 'who',
            heading: 'Who files (what "non-resident" means)',
            paragraphs: [
              'The report applies when a non-resident under the Act acquires property in Japan or rights to it (leasehold, lease rights and so on). Residents are individuals with an address or residence in Japan, and organisations with their main office in Japan (including Japanese branches of foreign companies). Everyone else is a non-resident.',
              'Foreign nationals are treated as non-residents in principle, but those working at an office in Japan, or who entered Japan six months or more ago, are treated as residents. If you are unsure, ask your agent or the Ministry of Finance.',
            ],
          },
          {
            id: 'deadline',
            heading: 'Deadline and where to file',
            paragraphs: [
              'The report (Form 22) goes to the Minister of Finance through the Bank of Japan within 20 days of acquisition. Use a suitable date as the acquisition date, such as the contract date or the date ownership transferred. If day 20 falls on a Bank of Japan holiday, the deadline moves to the next business day; posted reports must arrive by the deadline.',
            ],
            bullets: [
              'Required at any price or size',
              'Co-owners each file their own report',
              'Several properties acquired at the same time can go in one report',
            ],
          },
          {
            id: 'change-2026',
            heading: 'What changed on 1 April 2026',
            paragraphs: ['What must be reported, and what is exempt, depends on the acquisition date.'],
            table: {
              headers: ['', 'Acquired by 31 March 2026', 'Acquired from 1 April 2026'],
              rows: [
                ['What is reported', 'Property acquired for investment and similar purposes', 'Property acquired for any purpose'],
                ['Bought for you, family or employees to live in', 'Exempt', 'The property itself must be reported (only rights such as leasehold are exempt)'],
                ['Bought from another non-resident', 'Exempt', 'Must be reported'],
                ['New items on the form', '—', 'The other party (resident or not), the purpose, and the property number'],
              ],
            },
          },
          {
            id: 'how',
            heading: 'How to file, and filing through an agent',
            paragraphs: [
              'The form and its instructions are in Japanese only, and the report must be written in Japanese. A Japanese resident such as your real estate agent can file it for you, and agents are asked to file online.',
            ],
          },
          {
            id: 'penalty',
            heading: 'If you missed it, and penalties',
            paragraphs: [
              'Even after the deadline, the report still has to be filed promptly, with a short note in the margin explaining why it is late. Not reporting, or reporting falsely, can lead to imprisonment of up to six months or a fine of up to ¥500,000.',
            ],
          },
        ],
        faq: [
          { question: 'Do I report a home I bought to live in?', answer: 'Yes, if you acquired it on or after 1 April 2026: the property itself must be reported. Only rights such as leasehold acquired for living in are exempt.' },
          { question: 'Is a cheap property exempt?', answer: 'No. The report is required at any price or size.' },
          { question: 'I cannot read Japanese.', answer: 'The form is Japanese only, but a Japanese resident such as your real estate agent can prepare and file it for you.' },
        ],
        ctaTitle: 'Ask us about the steps after buying, too',
        ctaDescription: 'From finding a home to the contract and the reports after handover, we help in English, Chinese and Japanese.',
        sources: [
          { label: 'Ministry of Finance: report on acquiring property in Japan (overview, Japanese)', url: MOF_OVERVIEW },
          { label: 'Ministry of Finance FAQ, after the 1 April 2026 amendment (Japanese)', url: MOF_FAQ },
          { label: 'Ministry of Finance leaflet, June 2026 (Japanese)', url: MOF_LEAFLET },
        ],
      },
      'zh-TW': {
        category: '手續',
        title: '非居住者在日本買房後：外匯法報告須在20天內提出（2026年4月起範圍擴大）',
        excerpt: '住在海外的人取得日本不動產後，須在20天內經日本銀行向財務大臣報告。2026年4月1日起，自住用途的購買也須報告。',
        seoDescription: '非居住者取得日本不動產的外匯法報告：取得後20天內經日本銀行提出，與金額無關。依財務省資料說明2026年4月1日起的變更（自住也須報告）、代理提出與罰則。',
        intro: '住在海外的人購買日本不動產時，除了買賣與登記，還須依《外匯及外國貿易法》（外匯法）提出報告。制度於2026年4月1日修正，過去不需報告的「自住用途購買」也納入報告對象。許多網站仍是舊資訊，以下整理最新重點。',
        keyTakeaways: [
          '非居住者取得日本不動產後，須在20天內經日本銀行向財務大臣報告',
          '與金額、面積大小無關，一律須報告',
          '2026年4月1日以後取得者，不論目的，不動產本身都須報告（自住也須報告）',
          '可由不動產公司等日本居住者代為提出；未報告有罰則',
        ],
        sections: [
          {
            id: 'who',
            heading: '誰須報告（何謂非居住者）',
            paragraphs: [
              '外匯法上的「非居住者」取得日本不動產或相關權利（借地權、租賃權等）時須報告。居住者是指在日本有住所或居所的個人，以及主要事務所在日本的法人（包含外國法人的日本分公司），其餘皆為非居住者。',
              '外國人原則上視為非居住者，但在日本的事務所任職者，或入境日本滿6個月以上者，視為居住者。若難以判斷，請向代理人或財務省確認。',
            ],
          },
          {
            id: 'deadline',
            heading: '期限與提出窗口',
            paragraphs: [
              '報告書（樣式第22）須在取得後20天內，經日本銀行向財務大臣提出。取得日可填寫買賣契約日或所有權移轉日等適當日期。第20天若為日本銀行休業日，延至次一營業日；郵寄須於期限前送達。',
            ],
            bullets: [
              '與金額、面積無關，一律須報告',
              '共有購買時，每位購買者各自提出',
              '同一時期取得多筆物件，可合併為一份報告',
            ],
          },
          {
            id: 'change-2026',
            heading: '2026年4月1日起的變更',
            paragraphs: ['報告對象與免報告情形，依取得日而不同。'],
            table: {
              headers: ['', '2026年3月31日前取得', '2026年4月1日以後取得'],
              rows: [
                ['報告對象', '以投資等目的取得者', '不論目的皆須報告'],
                ['本人、家人或員工自住用途', '免報告', '不動產本身須報告（僅借地權等權利部分免報告）'],
                ['向其他非居住者購買', '免報告', '須報告'],
                ['新增填寫項目', '—', '交易對象（居住者或非居住者）、取得目的、不動產編號'],
              ],
            },
          },
          {
            id: 'how',
            heading: '提出方式與代理',
            paragraphs: [
              '報告書樣式與填寫說明僅有日文，且須以日文填寫。可由不動產公司等日本居住者代為提出，代理提出時建議使用線上系統。',
            ],
          },
          {
            id: 'penalty',
            heading: '忘記提出時與罰則',
            paragraphs: [
              '即使已逾期限，仍須儘速提出，並在報告書欄外簡要註明未能如期提出的原因。未報告或虛偽報告者，可處6個月以下拘禁刑或50萬日圓以下罰金。',
            ],
          },
        ],
        faq: [
          { question: '買來自住也須報告嗎？', answer: '2026年4月1日以後取得者，不動產本身須報告。僅因自住等目的取得的借地權等權利部分可免報告。' },
          { question: '便宜的物件也須報告嗎？', answer: '是的，與金額、面積大小無關，一律須報告。' },
          { question: '我看不懂日文。', answer: '樣式僅有日文，但可由不動產公司等日本居住者代為製作與提出。' },
        ],
        ctaTitle: '購屋後的手續也歡迎諮詢',
        ctaDescription: '從找房、簽約到交屋後的報告，我們以中文、日文、英文為您說明。',
        sources: [
          { label: '日本財務省「取得日本境內不動產之報告」制度概要（日文）', url: MOF_OVERVIEW },
          { label: '日本財務省 常見問題（2026年4月1日修正施行後，日文）', url: MOF_FAQ },
          { label: '日本財務省 宣傳單（2026年6月，日文）', url: MOF_LEAFLET },
        ],
      },
      'zh-CN': {
        category: '手续',
        title: '非居住者在日本买房后：外汇法报告须在20天内提交（2026年4月起范围扩大）',
        excerpt: '住在海外的人取得日本房产后，须在20天内经日本银行向财务大臣报告。2026年4月1日起，自住用途的购买也须报告。',
        seoDescription: '非居住者取得日本房产的外汇法报告：取得后20天内经日本银行提交，与金额无关。依据财务省资料说明2026年4月1日起的变化（自住也须报告）、代理提交与罚则。',
        intro: '住在海外的人购买日本房产时，除了买卖和登记，还须依据《外汇及外国贸易法》（外汇法）提交报告。制度于2026年4月1日修订，以前不需要报告的"自住用途购买"也纳入了报告范围。很多网站仍是旧信息，下面整理最新要点。',
        keyTakeaways: [
          '非居住者取得日本房产后，须在20天内经日本银行向财务大臣报告',
          '与金额、面积大小无关，一律须报告',
          '2026年4月1日以后取得的，不论目的，房产本身都须报告（自住也须报告）',
          '可由房产中介等日本居住者代为提交；不报告有罚则',
        ],
        sections: [
          {
            id: 'who',
            heading: '谁须报告（什么是非居住者）',
            paragraphs: [
              '外汇法上的"非居住者"取得日本房产或相关权利（借地权、租赁权等）时须报告。居住者是指在日本有住所或居所的个人，以及主要办事处在日本的法人（包括外国法人的日本分公司），其余均为非居住者。',
              '外国人原则上视为非居住者，但在日本的办事处任职的人，或入境日本满6个月以上的人，视为居住者。难以判断时，请向代理人或财务省确认。',
            ],
          },
          {
            id: 'deadline',
            heading: '期限与提交窗口',
            paragraphs: [
              '报告书（样式第22）须在取得后20天内，经日本银行向财务大臣提交。取得日可填写买卖合同日或所有权转移日等适当日期。第20天若为日本银行休息日，顺延至下一个营业日；邮寄须在期限前送达。',
            ],
            bullets: [
              '与金额、面积无关，一律须报告',
              '共同购买时，每位购买者分别提交',
              '同一时期取得多套房产，可以合并为一份报告',
            ],
          },
          {
            id: 'change-2026',
            heading: '2026年4月1日起的变化',
            paragraphs: ['报告范围和免报告的情形，因取得日而不同。'],
            table: {
              headers: ['', '2026年3月31日前取得', '2026年4月1日以后取得'],
              rows: [
                ['报告范围', '以投资等目的取得的', '不论目的都须报告'],
                ['本人、家人或员工自住用途', '免报告', '房产本身须报告（仅借地权等权利部分免报告）'],
                ['从其他非居住者处购买', '免报告', '须报告'],
                ['新增填写项目', '—', '交易对方（居住者或非居住者）、取得目的、不动产编号'],
              ],
            },
          },
          {
            id: 'how',
            heading: '提交方式与代理',
            paragraphs: [
              '报告书样式和填写说明只有日文，且须用日文填写。可由房产中介等日本居住者代为提交，代理提交时建议使用线上系统。',
            ],
          },
          {
            id: 'penalty',
            heading: '忘记提交时与罚则',
            paragraphs: [
              '即使已过期限，也须尽快提交，并在报告书栏外简要注明未能按期提交的原因。不报告或虚假报告的，可处6个月以下拘禁刑或50万日元以下罚金。',
            ],
          },
        ],
        faq: [
          { question: '买来自住也须报告吗？', answer: '2026年4月1日以后取得的，房产本身须报告。只有因自住等目的取得的借地权等权利部分可以免报告。' },
          { question: '便宜的房子也须报告吗？', answer: '是的，与金额、面积大小无关，一律须报告。' },
          { question: '我看不懂日文。', answer: '样式只有日文，但可由房产中介等日本居住者代为制作和提交。' },
        ],
        ctaTitle: '买房后的手续也欢迎咨询',
        ctaDescription: '从找房、签约到交房后的报告，我们用中文、日语、英语为您说明。',
        sources: [
          { label: '日本财务省"取得日本境内不动产的报告"制度概要（日文）', url: MOF_OVERVIEW },
          { label: '日本财务省 常见问题（2026年4月1日修订施行后，日文）', url: MOF_FAQ },
          { label: '日本财务省 宣传单（2026年6月，日文）', url: MOF_LEAFLET },
        ],
      },
    },
  },
  {
    slug: 'tokyo-fixed-asset-tax-city-planning-tax',
    publishedAt: '2026-10-07',
    updatedAt: '2026-10-07',
    readMinutes: 6,
    tags: ['tax', 'running costs', 'foreign buyer'],
    locales: {
      ja: {
        category: '税金',
        title: '東京の固定資産税・都市計画税：税率、計算例、払い方（海外在住の方も）',
        excerpt: '東京23区では固定資産税1.4%、都市計画税0.3%。住宅用地の特例、年4回の納期、売買時の日割り精算、海外在住の方の納税管理人までまとめます。',
        seoDescription: '東京23区の固定資産税（1.4%）と都市計画税（0.3%）の仕組み。評価額にかかること、住宅用地の特例（1/6・1/3）と都の軽減、6・9・12・2月の納期、マンションの計算例、海外在住の納税管理人を解説。',
        intro: '不動産を持つと、毎年かかる税金が固定資産税と都市計画税です。東京23区では東京都（都税事務所）が課税します。金額は物件価格ではなく、行政が決める評価額をもとに計算されます。仕組みと計算例を見ていきましょう。',
        keyTakeaways: [
          '1月1日時点の所有者に、その年度の1年分がかかる',
          '東京23区の税率は固定資産税1.4%、都市計画税0.3%（物件価格ではなく評価額にかかる）',
          '住宅用地は特例で課税標準が下がる（200㎡までは固定資産税1/6、都市計画税1/3。都が都市計画税をさらに半額）',
          '23区の納期は6月・9月・12月・2月の年4回。海外在住なら納税管理人を定める',
        ],
        sections: [
          {
            id: 'who-when',
            heading: '誰に、いつかかるか',
            paragraphs: [
              '固定資産税と都市計画税は、毎年1月1日時点で固定資産課税台帳に所有者として登録されている人に、その年度の1年分がかかります。土地と建物の両方が対象で、東京23区では都税事務所が課税します。',
              '課税標準額が、土地は30万円、家屋は20万円に満たない場合は課税されません（免税点）。',
            ],
          },
          {
            id: 'rates',
            heading: '税率と計算のもと',
            paragraphs: [
              '東京23区の税率は、固定資産税が1.4%、都市計画税が0.3%です。かけるのは物件の売買価格ではなく、固定資産税評価額などをもとにした課税標準額です。評価額は売買価格より低いことが多く、物件ごとの金額は納税通知書や評価証明書で確認できます。',
            ],
          },
          {
            id: 'residential-land',
            heading: '住宅用地の特例',
            paragraphs: ['住宅が建っている土地は、課税標準が下がる特例があります。マンションは敷地を戸数で分けるため、多くの住戸が「小規模住宅用地」に当たります。'],
            table: {
              headers: ['区分', '固定資産税', '都市計画税'],
              rows: [
                ['小規模住宅用地（住宅1戸あたり200㎡まで）', '価格×1/6', '価格×1/3（さらに東京都の措置で税額が1/2に）'],
                ['一般住宅用地（200㎡を超える部分）', '価格×1/3', '価格×2/3'],
              ],
            },
          },
          {
            id: 'example',
            heading: '計算例（想定例）',
            paragraphs: ['実際には負担調整などで金額が変わることがあります。目安としてご覧ください。'],
            example: {
              title: '区分マンション1戸（敷地持分は小規模住宅用地）',
              lines: [
                '土地（敷地持分）の評価額600万円、建物の評価額900万円と仮定',
                '固定資産税：土地 600万円×1/6×1.4%＝1万4,000円、建物 900万円×1.4%＝12万6,000円',
                '都市計画税：土地 600万円×1/3×0.3%＝6,000円 → 東京都の措置で半額の3,000円、建物 900万円×0.3%＝2万7,000円',
                '合計：年およそ17万円（年4回に分けて払う）',
              ],
              note: '想定例です。実際の額は納税通知書・評価証明書で確認してください。',
            },
          },
          {
            id: 'new-building',
            heading: '新築住宅の減額',
            paragraphs: [
              '一定の床面積の要件を満たす新築住宅は、建物の固定資産税額（120㎡までの部分）が一定期間2分の1になります。期間は3年度分、3階建以上の耐火・準耐火建築物は5年度分です。適用期限などの条件があるため、新築の購入時は最新の要件を確認してください。中古の購入では通常は関係ありません。',
            ],
          },
          {
            id: 'payment',
            heading: '払い方と、売買したときの精算',
            paragraphs: [
              '23区の納期は、6月・9月・12月・2月の年4回です。売買した年は、1月1日の所有者（売主）に1年分の納税通知が届くため、引渡日を境に日割りで精算するのが一般的です。起算日（1月1日か4月1日か）は契約で決めます。',
            ],
          },
          {
            id: 'overseas',
            heading: '海外にお住まいの方',
            paragraphs: [
              '東京都内に住所などがない場合は、納税に関する手続きをしてもらう納税管理人を定め、物件の所在地を担当する都税事務所に申告する必要があります。納税通知書は納税管理人に送られます。家族や知人、管理会社や税理士などに頼むのが一般的です。',
            ],
          },
        ],
        faq: [
          { question: '物件価格の1.4%がかかるのですか？', answer: 'いいえ。かかるのは行政が決める評価額などをもとにした課税標準額で、売買価格より低いことが多いです。' },
          { question: '年の途中で買ったら、その年の税金は？', answer: '1月1日の所有者（売主）に1年分かかるため、売買契約で引渡日から日割りで精算するのが一般的です。' },
          { question: '海外に住んでいても払えますか？', answer: '納税管理人を定めて都税事務所に申告すれば、納税通知書が納税管理人に届き、その方を通じて納められます。' },
        ],
        ctaTitle: '物件ごとの毎月の費用も確認できます',
        ctaDescription: '各物件ページで管理費・修繕積立金を表示しています。税金を含めた保有費用のご相談もどうぞ。',
        sources: [
          { label: '東京都主税局「固定資産税・都市計画税（土地・家屋）」', url: TOKYO_TAX },
        ],
      },
      en: {
        category: 'Tax',
        title: 'Fixed asset tax and city planning tax in Tokyo: rates, a worked example and how to pay (also from overseas)',
        excerpt: 'In Tokyo’s 23 wards the fixed asset tax is 1.4% and the city planning tax 0.3%. The residential land relief, the four payment dates, splitting the tax when you buy, and the tax agent you need if you live abroad.',
        seoDescription: 'How Tokyo’s fixed asset tax (1.4%) and city planning tax (0.3%) work: charged on the assessed value, residential land relief (1/6, 1/3) and Tokyo’s own reduction, June/September/December/February payments, a condo example, and the tax agent for owners living abroad.',
        intro: 'Owning property in Japan comes with two yearly taxes: fixed asset tax and city planning tax. In Tokyo’s 23 wards they are charged by the Tokyo Metropolitan Government through its tax offices. The amount is based on an assessed value set by the government, not on what you paid. Here is how it works, with an example.',
        keyTakeaways: [
          'The owner on 1 January pays for the whole fiscal year',
          'In the 23 wards: fixed asset tax 1.4%, city planning tax 0.3%, charged on the assessed value, not the price',
          'Residential land is taxed on a reduced base (up to 200㎡: 1/6 for fixed asset tax, 1/3 for city planning tax, which Tokyo halves again)',
          'Paid in four instalments: June, September, December and February. If you live abroad, appoint a tax agent',
        ],
        sections: [
          {
            id: 'who-when',
            heading: 'Who pays, and when',
            paragraphs: [
              'Both taxes are charged for the whole fiscal year to the person registered as owner in the fixed asset tax register on 1 January. They apply to land and buildings, and in the 23 wards the Tokyo tax offices collect them.',
              'No tax is charged when the taxable base is under ¥300,000 for land or ¥200,000 for a building.',
            ],
          },
          {
            id: 'rates',
            heading: 'Rates and what they apply to',
            paragraphs: [
              'In the 23 wards the fixed asset tax rate is 1.4% and the city planning tax rate 0.3%. They apply to a taxable base derived from the official assessed value, not to the sale price. The assessed value is usually lower than the price; the figures for a specific property are on its tax notice or assessment certificate.',
            ],
          },
          {
            id: 'residential-land',
            heading: 'Relief for residential land',
            paragraphs: ['Land under a home is taxed on a reduced base. A condominium’s land is split among its units, so most units count as small residential land.'],
            table: {
              headers: ['Type', 'Fixed asset tax', 'City planning tax'],
              rows: [
                ['Small residential land (up to 200㎡ per home)', 'Value × 1/6', 'Value × 1/3 (and Tokyo halves the tax)'],
                ['General residential land (the part over 200㎡)', 'Value × 1/3', 'Value × 2/3'],
              ],
            },
          },
          {
            id: 'example',
            heading: 'Worked example (illustrative)',
            paragraphs: ['Real bills can differ because of transitional adjustments. Use this as a rough guide.'],
            example: {
              title: 'One condominium unit (its land share is small residential land)',
              lines: [
                'Assume the land share is assessed at ¥6M and the building at ¥9M',
                'Fixed asset tax: land ¥6M × 1/6 × 1.4% = ¥14,000; building ¥9M × 1.4% = ¥126,000',
                'City planning tax: land ¥6M × 1/3 × 0.3% = ¥6,000, halved by Tokyo to ¥3,000; building ¥9M × 0.3% = ¥27,000',
                'Total: about ¥170,000 a year, paid in four instalments',
              ],
              note: 'Illustrative figures. Check the actual amounts on the tax notice or assessment certificate.',
            },
          },
          {
            id: 'new-building',
            heading: 'Reduction for new homes',
            paragraphs: [
              'New homes that meet floor-area conditions pay half the building’s fixed asset tax (on up to 120㎡) for a set period: three fiscal years, or five for fire-resistant buildings of three or more storeys. The relief has a deadline and other conditions, so check the current rules when buying new. It usually does not apply to resale purchases.',
            ],
          },
          {
            id: 'payment',
            heading: 'Paying, and splitting the tax when you buy',
            paragraphs: [
              'In the 23 wards the tax is paid in four instalments: June, September, December and February. In the year of a sale the seller, as owner on 1 January, receives the whole year’s bill, so buyer and seller usually split it by days from the handover date. The contract sets whether the year counts from 1 January or 1 April.',
            ],
          },
          {
            id: 'overseas',
            heading: 'If you live abroad',
            paragraphs: [
              'Owners without an address in Tokyo must appoint a tax agent to handle their tax matters and report the appointment to the tax office for the property’s area. Tax notices then go to the agent. Owners usually ask family, a friend, the property manager or a tax accountant.',
            ],
          },
        ],
        faq: [
          { question: 'Is it 1.4% of the price I paid?', answer: 'No. It applies to a taxable base derived from the government’s assessed value, which is usually lower than the price.' },
          { question: 'Who pays the tax in the year I buy?', answer: 'The seller, as owner on 1 January, is billed for the year; the contract usually splits it by days from the handover date.' },
          { question: 'Can I pay while living abroad?', answer: 'Yes. Appoint a tax agent and report it to the tax office; the notices go to the agent, who pays on your behalf.' },
        ],
        ctaTitle: 'See the monthly costs of each listing',
        ctaDescription: 'Every listing shows its management fee and repair reserve. Ask us about the full yearly cost of owning, taxes included.',
        sources: [
          { label: 'Tokyo Metropolitan Tax Bureau: fixed asset tax and city planning tax (Japanese)', url: TOKYO_TAX },
        ],
      },
      'zh-TW': {
        category: '稅金',
        title: '東京的固定資產稅與都市計畫稅：稅率、試算範例與繳納方式（海外居住者也適用）',
        excerpt: '東京23區固定資產稅1.4%、都市計畫稅0.3%。整理住宅用地特例、每年4期的繳納、買賣時按日分攤，以及海外居住者的納稅管理人。',
        seoDescription: '東京23區固定資產稅（1.4%）與都市計畫稅（0.3%）的機制：依評定額課稅、住宅用地特例（1/6、1/3）與東京都減輕措施、6・9・12・2月繳納、公寓試算範例、海外居住者的納稅管理人。',
        intro: '持有不動產後，每年須繳的稅是固定資產稅與都市計畫稅。在東京23區由東京都（都稅事務所）課徵。金額不是依物件售價，而是依政府評定的價格計算。以下說明機制並附上試算範例。',
        keyTakeaways: [
          '由1月1日當時的所有人繳納該年度一整年的稅',
          '東京23區稅率：固定資產稅1.4%、都市計畫稅0.3%（依評定額，而非售價）',
          '住宅用地有特例降低課稅標準（200㎡以內：固定資產稅1/6、都市計畫稅1/3，東京都再將都市計畫稅減半）',
          '23區每年分6月、9月、12月、2月4期繳納；住在海外須指定納稅管理人',
        ],
        sections: [
          {
            id: 'who-when',
            heading: '向誰課稅、何時課稅',
            paragraphs: [
              '固定資產稅與都市計畫稅，向每年1月1日登記於固定資產課稅台帳上的所有人，課徵該年度一整年的稅。土地與建物皆為課稅對象，東京23區由都稅事務所課徵。',
              '課稅標準額土地未滿30萬日圓、房屋未滿20萬日圓時不課稅（免稅點）。',
            ],
          },
          {
            id: 'rates',
            heading: '稅率與計算基礎',
            paragraphs: [
              '東京23區稅率為固定資產稅1.4%、都市計畫稅0.3%。乘上的不是物件售價，而是以固定資產稅評定額等為基礎的課稅標準額。評定額通常低於售價，各物件的金額可在納稅通知書或評價證明書上確認。',
            ],
          },
          {
            id: 'residential-land',
            heading: '住宅用地特例',
            paragraphs: ['建有住宅的土地，課稅標準可降低。公寓的土地依戶數分攤，因此多數住戶屬於「小規模住宅用地」。'],
            table: {
              headers: ['區分', '固定資產稅', '都市計畫稅'],
              rows: [
                ['小規模住宅用地（每戶住宅200㎡以內）', '價格×1/6', '價格×1/3（東京都措施再將稅額減為1/2）'],
                ['一般住宅用地（超過200㎡的部分）', '價格×1/3', '價格×2/3'],
              ],
            },
          },
          {
            id: 'example',
            heading: '試算範例（假設）',
            paragraphs: ['實際金額可能因負擔調整等而不同，請作為參考。'],
            example: {
              title: '公寓1戶（土地持分屬小規模住宅用地）',
              lines: [
                '假設土地（持分）評定額600萬日圓、建物評定額900萬日圓',
                '固定資產稅：土地 600萬×1/6×1.4%＝1萬4,000日圓；建物 900萬×1.4%＝12萬6,000日圓',
                '都市計畫稅：土地 600萬×1/3×0.3%＝6,000日圓 → 東京都措施減半為3,000日圓；建物 900萬×0.3%＝2萬7,000日圓',
                '合計：每年約17萬日圓（分4期繳納）',
              ],
              note: '此為假設範例，實際金額請以納稅通知書或評價證明書為準。',
            },
          },
          {
            id: 'new-building',
            heading: '新建住宅的減額',
            paragraphs: [
              '符合一定樓地板面積條件的新建住宅，建物固定資產稅（120㎡以內部分）在一定期間內減半：一般為3個年度，3層以上的耐火・準耐火建築為5個年度。此措施有適用期限等條件，購買新建住宅時請確認最新規定。購買中古屋通常不適用。',
            ],
          },
          {
            id: 'payment',
            heading: '繳納方式與買賣時的分攤',
            paragraphs: [
              '23區每年分6月、9月、12月、2月4期繳納。買賣當年，1月1日的所有人（賣方）會收到一整年的納稅通知，因此一般以交屋日為界按日分攤。起算日（1月1日或4月1日）由契約約定。',
            ],
          },
          {
            id: 'overseas',
            heading: '住在海外的人',
            paragraphs: [
              '在東京都內沒有住所等的人，須指定代為辦理納稅事務的納稅管理人，並向物件所在地的都稅事務所申報。納稅通知書會寄給納稅管理人。一般會委託家人、朋友、管理公司或稅理士。',
            ],
          },
        ],
        faq: [
          { question: '是按售價的1.4%課稅嗎？', answer: '不是。依政府評定額等為基礎的課稅標準額課稅，通常低於售價。' },
          { question: '年中購買時，當年的稅怎麼算？', answer: '由1月1日的所有人（賣方）繳納一整年，一般在買賣契約中依交屋日按日分攤。' },
          { question: '住在海外也能繳納嗎？', answer: '可以。指定納稅管理人並向都稅事務所申報後，納稅通知書會寄給納稅管理人，由其代為繳納。' },
        ],
        ctaTitle: '也能查看每個物件的每月費用',
        ctaDescription: '每個物件頁面都會顯示管理費與修繕基金。也歡迎諮詢含稅金在內的持有成本。',
        sources: [
          { label: '東京都主稅局「固定資產稅・都市計畫稅（土地・房屋）」（日文）', url: TOKYO_TAX },
        ],
      },
      'zh-CN': {
        category: '税金',
        title: '东京的固定资产税和都市计划税：税率、计算示例与缴纳方式（海外居住者也适用）',
        excerpt: '东京23区固定资产税1.4%、都市计划税0.3%。整理住宅用地特例、每年4期缴纳、买卖时按天分摊，以及海外居住者的纳税管理人。',
        seoDescription: '东京23区固定资产税（1.4%）和都市计划税（0.3%）的机制：按评估额计税、住宅用地特例（1/6、1/3）与东京都减免措施、6・9・12・2月缴纳、公寓计算示例、海外居住者的纳税管理人。',
        intro: '持有房产后，每年要交的税是固定资产税和都市计划税。在东京23区由东京都（都税事务所）征收。金额不是按房价，而是按政府评估的价格计算。下面说明机制并附上计算示例。',
        keyTakeaways: [
          '由1月1日时的所有人缴纳该年度一整年的税',
          '东京23区税率：固定资产税1.4%、都市计划税0.3%（按评估额，而不是房价）',
          '住宅用地有特例降低计税基础（200㎡以内：固定资产税1/6、都市计划税1/3，东京都再将都市计划税减半）',
          '23区每年分6月、9月、12月、2月4期缴纳；住在海外须指定纳税管理人',
        ],
        sections: [
          {
            id: 'who-when',
            heading: '向谁征税、何时征税',
            paragraphs: [
              '固定资产税和都市计划税，向每年1月1日登记在固定资产课税台账上的所有人，征收该年度一整年的税。土地和建筑都是征税对象，东京23区由都税事务所征收。',
              '计税基础额土地不满30万日元、房屋不满20万日元时不征税（免税点）。',
            ],
          },
          {
            id: 'rates',
            heading: '税率与计算基础',
            paragraphs: [
              '东京23区税率为固定资产税1.4%、都市计划税0.3%。乘的不是房屋售价，而是以固定资产税评估额等为基础的计税基础额。评估额通常低于售价，具体房产的金额可在纳税通知书或评估证明书上确认。',
            ],
          },
          {
            id: 'residential-land',
            heading: '住宅用地特例',
            paragraphs: ['建有住宅的土地，计税基础可以降低。公寓的土地按户数分摊，所以多数住户属于"小规模住宅用地"。'],
            table: {
              headers: ['区分', '固定资产税', '都市计划税'],
              rows: [
                ['小规模住宅用地（每户住宅200㎡以内）', '价格×1/6', '价格×1/3（东京都措施再将税额减为1/2）'],
                ['一般住宅用地（超过200㎡的部分）', '价格×1/3', '价格×2/3'],
              ],
            },
          },
          {
            id: 'example',
            heading: '计算示例（假设）',
            paragraphs: ['实际金额可能因负担调整等而不同，请作为参考。'],
            example: {
              title: '公寓1户（土地份额属于小规模住宅用地）',
              lines: [
                '假设土地（份额）评估额600万日元、建筑评估额900万日元',
                '固定资产税：土地 600万×1/6×1.4%＝1万4,000日元；建筑 900万×1.4%＝12万6,000日元',
                '都市计划税：土地 600万×1/3×0.3%＝6,000日元 → 东京都措施减半为3,000日元；建筑 900万×0.3%＝2万7,000日元',
                '合计：每年约17万日元（分4期缴纳）',
              ],
              note: '这是假设示例，实际金额请以纳税通知书或评估证明书为准。',
            },
          },
          {
            id: 'new-building',
            heading: '新建住宅的减免',
            paragraphs: [
              '符合一定建筑面积条件的新建住宅，建筑部分的固定资产税（120㎡以内部分）在一定期间内减半：一般为3个年度，3层以上的耐火・准耐火建筑为5个年度。该措施有适用期限等条件，购买新房时请确认最新规定。购买二手房通常不适用。',
            ],
          },
          {
            id: 'payment',
            heading: '缴纳方式与买卖时的分摊',
            paragraphs: [
              '23区每年分6月、9月、12月、2月4期缴纳。买卖当年，1月1日的所有人（卖方）会收到一整年的纳税通知，所以一般以交房日为界按天分摊。起算日（1月1日或4月1日）由合同约定。',
            ],
          },
          {
            id: 'overseas',
            heading: '住在海外的人',
            paragraphs: [
              '在东京都内没有住所等的人，须指定代为办理纳税事务的纳税管理人，并向房产所在地的都税事务所申报。纳税通知书会寄给纳税管理人。一般会委托家人、朋友、管理公司或税理士。',
            ],
          },
        ],
        faq: [
          { question: '是按房价的1.4%征税吗？', answer: '不是。按政府评估额等为基础的计税基础额征税，通常低于房价。' },
          { question: '年中买房，当年的税怎么算？', answer: '由1月1日的所有人（卖方）缴纳一整年，一般在买卖合同中按交房日按天分摊。' },
          { question: '住在海外也能缴纳吗？', answer: '可以。指定纳税管理人并向都税事务所申报后，纳税通知书会寄给纳税管理人，由其代为缴纳。' },
        ],
        ctaTitle: '也能查看每套房源的每月费用',
        ctaDescription: '每个房源页面都显示管理费和修缮积立金。也欢迎咨询含税金在内的持有成本。',
        sources: [
          { label: '东京都主税局"固定资产税・都市计划税（土地・房屋）"（日文）', url: TOKYO_TAX },
        ],
      },
    },
  },
]
