import type { GuideArticle } from './guides'

const SAITAMA_LEAFLET = 'https://www.pref.saitama.lg.jp/documents/1945/r8_myhome_to_zeikin_mihiraki.pdf'
const NTA_REGISTRATION = 'https://www.nta.go.jp/taxes/shiraberu/taxanswer/inshi/7191.htm'
const TOKYO_ACQUISITION = 'https://www.tax.metro.tokyo.lg.jp/kazei/real_estate/fudosan'
const MOJ_CONTACT = 'https://www.moj.go.jp/MINJI/minji05_00589.html'
const MOJ_ADDRESS = 'https://www.moj.go.jp/MINJI/minji05_00574.html'

/**
 * Taxes and registration when buying in Tokyo. Facts checked on 2026-10-07 against Saitama
 * Prefecture's FY2026 (令和8年度) "マイホームと税金" leaflet (national rules): registration tax on the
 * assessed value, 2% standard, land 1.5% to 31 Mar 2029, own-home building 0.3% to 31 Mar 2027,
 * new-home preservation 0.15%; acquisition tax 4% standard, 3% for land and housing to 31 Mar 2027,
 * residential land valued at 1/2. MOJ pages: domestic contact and romaji names from April 2024.
 */
export const extraGuideArticles8: GuideArticle[] = [
  {
    slug: 'japan-property-purchase-taxes-registration',
    publishedAt: '2026-10-07',
    updatedAt: '2026-10-07',
    readMinutes: 6,
    tags: ['tax', 'registration', 'foreign buyer'],
    locales: {
      ja: {
        category: '税金',
        title: '東京で不動産を買うときの税金と登記：登録免許税・不動産取得税・司法書士',
        excerpt: '買うときに一度だけかかる税金は、登記のときの登録免許税と、あとから届く不動産取得税です。計算のもとは物件価格ではなく固定資産税評価額。海外在住の方の登記の注意点もまとめます。',
        seoDescription: '東京で不動産を買うときの登録免許税（標準2%、土地1.5%、自宅用の建物0.3%）と不動産取得税（標準4%、土地・住宅3%、宅地は評価額1/2）の仕組み、計算例、司法書士による登記、海外在住の方の国内連絡先・ローマ字氏名を解説。',
        intro: '不動産を買うと、物件の代金のほかに、買ったときに一度だけかかる税金があります。登記のときに払う「登録免許税」と、あとから東京都に払う「不動産取得税」です。どちらも物件価格ではなく、行政が決める固定資産税評価額をもとに計算します。登記の流れと、海外にお住まいの方が準備するものもあわせて見ていきましょう。',
        keyTakeaways: [
          '登録免許税は所有権の登記のときに払う国の税金。売買による移転は標準2%（土地は2029年3月31日までの登記なら1.5%）',
          '自分が住む一定の住宅の建物は、2027年3月31日までの取得で0.3%に軽減される（貸す目的の購入は対象外）',
          '不動産取得税は東京都に払う税金で、標準4%。2027年3月31日までに取得した土地と住宅は3%、宅地は評価額を半分にして計算する',
          '登記はふつう決済の日に司法書士が行う。海外在住の方は国内連絡先や住所を証明する書類が必要',
        ],
        sections: [
          {
            id: 'overview',
            heading: '買うときにかかる2つの税金',
            paragraphs: [
              '購入時にかかる主な税金は、国に払う登録免許税と、都道府県（東京なら東京都）に払う不動産取得税の2つです。どちらも計算のもとは売買価格ではなく、固定資産税評価額です。評価額は売買価格より低いことが多いので、税額もそれだけ小さくなります。',
              '毎年かかる固定資産税・都市計画税とは別のものです。毎年の税金については、固定資産税・都市計画税のガイドをご覧ください。',
            ],
          },
          {
            id: 'registration-tax',
            heading: '登録免許税（登記のときに払う国の税金）',
            paragraphs: [
              '所有権を自分の名義にする登記をするときに払います。税率は登記の種類で決まっていて、売買による所有権の移転は標準2%です。ただし、軽減措置があります。',
              '建物の0.3%は、自分が住むための一定の住宅に限られます。住宅用家屋証明書が必要で、取得から1年以内に登記することが条件です。貸す目的で買う場合は対象になりません。また、住宅ローンを借りて抵当権を設定する場合は、その登記にも別に登録免許税がかかります。',
            ],
            table: {
              headers: ['登記の内容', '税率（評価額にかける）'],
              rows: [
                ['売買による移転（標準）', '2%'],
                ['土地の売買による移転（2029年3月31日までの登記）', '1.5%'],
                ['自分が住む一定の住宅の建物の売買による移転（2027年3月31日までの取得、取得後1年以内の登記）', '0.3%'],
                ['一定の新築住宅の所有権保存登記', '0.15%'],
              ],
            },
          },
          {
            id: 'acquisition-tax',
            heading: '不動産取得税（あとから届く都の税金）',
            paragraphs: [
              '土地や建物を取得したときに一度だけかかる都道府県の税金で、東京都内の物件なら東京都に払います。購入から数か月後に納税通知書が届くのがふつうなので、その分の資金を残しておきましょう。',
              '税率は標準4%ですが、2027年3月31日までに取得した土地と住宅は3%です。また、同じ期限までに取得した宅地は、評価額を半分にして計算します。一定の条件を満たす住宅とその土地には、さらに軽減があります（中古住宅なら床面積40〜240㎡などの条件）。くわしい条件は東京都主税局のページで確認してください。',
            ],
          },
          {
            id: 'example',
            heading: '計算例（想定例）',
            paragraphs: ['数字はわかりやすくするための仮のものです。実際の税額は評価額や軽減の条件で変わります。'],
            example: {
              title: '中古マンション1戸（土地の評価額1,000万円、建物の評価額1,000万円と仮定）',
              lines: [
                '登録免許税（土地）：1,000万円×1.5%＝15万円',
                '登録免許税（建物）：自分が住む一定の住宅なら 1,000万円×0.3%＝3万円、貸す目的なら 1,000万円×2%＝20万円',
                '不動産取得税（土地）：1,000万円×1/2×3%＝15万円',
                '不動産取得税（建物）：1,000万円×3%＝30万円（一定の住宅の軽減を受けられれば、ここから下がる）',
              ],
              note: '想定例です。住宅の軽減、住宅ローンの登記、司法書士の報酬は含みません。実際の額は司法書士や税理士に確認してください。',
            },
          },
          {
            id: 'scrivener',
            heading: '登記の流れと司法書士',
            paragraphs: [
              '所有権の登記は、ふつう司法書士が行います。決済（残代金の支払いと引渡し）の日に、司法書士が売主・買主の書類と本人確認をしたうえで、その日のうちに法務局へ登記を申請するのが一般的です。',
              '司法書士の報酬は事務所によって違います。決済の前に、登録免許税と報酬を含めた見積もりをもらいましょう。',
            ],
          },
          {
            id: 'overseas',
            heading: '海外にお住まいの方の登記',
            paragraphs: [
              '2024年4月1日から、海外に住む方が所有者として登記するときは、日本国内の連絡先となる人（国内連絡先）の情報もあわせて登記されるようになりました。不動産会社や司法書士が国内連絡先になることも想定されています。適当な人がいない場合は、その旨を申請に書くこともできます。',
              '外国籍の方は、氏名のローマ字表記も登記されます。また、住所を証明する書類（住んでいる国の公的な証明書など）が必要です。何を用意すればよいかは国や状況で変わるので、早めに司法書士に確認しましょう。',
            ],
            bullets: [
              '住所を証明する書類',
              '国内連絡先となる人の情報と承諾',
              '外国籍の方はローマ字氏名を証明する書類',
            ],
          },
          {
            id: 'fx-report',
            heading: '外為法の報告も忘れずに',
            paragraphs: [
              '非居住者が日本の不動産を取得したときは、登記とは別に、外国為替及び外国貿易法（外為法）にもとづく報告を取得後20日以内に行います。くわしくは外為法の報告のガイドをご覧ください。',
            ],
          },
        ],
        faq: [
          { question: '物件価格の2%がかかるのですか？', answer: 'いいえ。登録免許税も不動産取得税も、売買価格ではなく固定資産税評価額をもとに計算します。評価額は売買価格より低いことが多いです。' },
          { question: '貸すために買う場合も0.3%になりますか？', answer: 'いいえ。建物の0.3%は自分が住むための一定の住宅が対象です。貸す目的の購入では、建物は標準の2%です。' },
          { question: '不動産取得税はいつ払いますか？', answer: '購入から数か月後に東京都から納税通知書が届き、それにもとづいて払います。' },
          { question: '海外にいても登記できますか？', answer: 'できます。ふつうは司法書士が手続きします。国内連絡先や住所を証明する書類などが必要なので、早めに司法書士に相談してください。' },
        ],
        ctaTitle: '購入にかかる費用をまとめてご案内します',
        ctaDescription: '物件ごとの諸費用の目安や、司法書士・税理士への相談の進め方について、日本語・英語・中国語でご相談いただけます。',
        sources: [
          { label: '埼玉県「マイホームと税金」令和8年度版（国の税制の解説を含む）', url: SAITAMA_LEAFLET },
          { label: '国税庁 タックスアンサー No.7191 登録免許税の税額表', url: NTA_REGISTRATION },
          { label: '東京都主税局「不動産取得税」', url: TOKYO_ACQUISITION },
          { label: '法務省「令和6年4月1日以降にする所有権に関する登記の申請について」', url: MOJ_CONTACT },
          { label: '法務省「外国居住の外国人や外国法人が所有権の登記名義人となる登記の申請をする場合の住所証明情報について」', url: MOJ_ADDRESS },
        ],
      },
      en: {
        category: 'Tax',
        title: 'Taxes and registration when buying property in Tokyo: registration tax, acquisition tax and the judicial scrivener',
        excerpt: 'Two one-off taxes come with a purchase: registration tax when the title is registered, and real estate acquisition tax, billed later. Both use the assessed value, not the price. Plus what overseas buyers need for registration.',
        seoDescription: 'How Japan’s registration and license tax (2% standard, 1.5% for land, 0.3% for your own home’s building) and Tokyo’s real estate acquisition tax (4% standard, 3% for land and housing, residential land at half value) work, with an example, the judicial scrivener’s role, and the domestic contact and romaji name rules for overseas buyers.',
        intro: 'Besides the price, buying property in Japan comes with taxes you pay once: registration and license tax, paid when the title is registered, and real estate acquisition tax, paid later to the Tokyo Metropolitan Government. Both are based on the fixed asset tax assessed value set by the government, not on what you pay. Here is how they work, how registration happens, and what to prepare if you live abroad.',
        keyTakeaways: [
          'Registration tax is a national tax paid when you register ownership. Transfer by sale is 2% standard (1.5% for land registered by 31 March 2029)',
          'The building of a qualifying home you will live in drops to 0.3% if bought by 31 March 2027 (buying to rent out does not qualify)',
          'Acquisition tax goes to Tokyo: 4% standard, 3% for land and housing acquired by 31 March 2027, and residential land counts at half its value',
          'A judicial scrivener usually registers the title on settlement day. Overseas buyers need a domestic contact and address documents',
        ],
        sections: [
          {
            id: 'overview',
            heading: 'Two taxes when you buy',
            paragraphs: [
              'The main purchase taxes are registration and license tax, paid to the national government, and real estate acquisition tax, paid to the prefecture (in Tokyo, the Tokyo Metropolitan Government). Both are calculated on the fixed asset tax assessed value, not the price. The assessed value is usually lower than the price, so the tax is lower too.',
              'These are separate from the yearly fixed asset tax and city planning tax. See our fixed asset tax guide for those.',
            ],
          },
          {
            id: 'registration-tax',
            heading: 'Registration and license tax (national, paid at registration)',
            paragraphs: [
              'You pay it when ownership is registered in your name. The rate depends on the kind of registration: a transfer by sale is 2% as standard, with reductions below.',
              'The 0.3% building rate is only for a qualifying home you will live in yourself. It needs a housing certificate, and the registration must be made within one year of buying. Buying to rent out does not qualify. If you take a mortgage, registering it carries its own registration tax as well.',
            ],
            table: {
              headers: ['Registration', 'Rate (on the assessed value)'],
              rows: [
                ['Transfer by sale (standard)', '2%'],
                ['Land transfer by sale (registered by 31 March 2029)', '1.5%'],
                ['Building of a qualifying home you will live in, transfer by sale (bought by 31 March 2027, registered within 1 year)', '0.3%'],
                ['Preservation registration of a qualifying new home', '0.15%'],
              ],
            },
          },
          {
            id: 'acquisition-tax',
            heading: 'Real estate acquisition tax (Tokyo, billed later)',
            paragraphs: [
              'A prefectural tax charged once when you acquire land or buildings; for property in Tokyo you pay the Tokyo Metropolitan Government. The tax notice usually arrives a few months after the purchase, so keep funds aside for it.',
              'The standard rate is 4%, but land and housing acquired by 31 March 2027 are taxed at 3%. Residential land acquired by the same date counts at half its assessed value. Qualifying homes and their land get further reductions (for a used home, a floor area of 40–240㎡ among other conditions). Check the Tokyo Metropolitan Tax Bureau page for the exact conditions.',
            ],
          },
          {
            id: 'example',
            heading: 'Worked example (illustrative)',
            paragraphs: ['The numbers are made up to keep things simple. Real amounts depend on the assessed value and on which reductions apply.'],
            example: {
              title: 'A resale condominium unit (assume land assessed at ¥10M and building at ¥10M)',
              lines: [
                'Registration tax, land: ¥10M × 1.5% = ¥150,000',
                'Registration tax, building: ¥10M × 0.3% = ¥30,000 if it is a qualifying home you live in; ¥10M × 2% = ¥200,000 if you buy to rent out',
                'Acquisition tax, land: ¥10M × 1/2 × 3% = ¥150,000',
                'Acquisition tax, building: ¥10M × 3% = ¥300,000 (lower if a qualifying-home reduction applies)',
              ],
              note: 'Illustrative figures. Housing reductions, mortgage registration and the scrivener’s fee are not included. Confirm actual amounts with a judicial scrivener or tax accountant.',
            },
          },
          {
            id: 'scrivener',
            heading: 'How registration works: the judicial scrivener',
            paragraphs: [
              'Title registration is normally handled by a judicial scrivener (shiho shoshi). On settlement day, when the balance is paid and the property is handed over, the scrivener checks both parties’ documents and identity and usually files the registration with the Legal Affairs Bureau the same day.',
              'Scrivener fees vary by office. Ask for an estimate, including the registration tax, before settlement.',
            ],
          },
          {
            id: 'overseas',
            heading: 'Registering from overseas',
            paragraphs: [
              'Since 1 April 2024, when someone living abroad is registered as owner, details of a contact person in Japan (a “domestic contact”) are registered too. A real estate business or a judicial scrivener can act as that contact. If you have no one, the application can state that instead.',
              'For foreign nationals, the name is also recorded in romaji (Latin letters). You also need documents proving your address, such as an official certificate from your country of residence. What exactly to prepare depends on your country and situation, so ask your scrivener early.',
            ],
            bullets: [
              'Documents proving your address',
              'Details and consent of your domestic contact',
              'For foreign nationals, a document showing your name in romaji',
            ],
          },
          {
            id: 'fx-report',
            heading: 'Do not forget the Foreign Exchange Act report',
            paragraphs: [
              'Separately from registration, a non-resident who acquires Japanese property must report it under the Foreign Exchange and Foreign Trade Act within 20 days. See our foreign exchange report guide for details.',
            ],
          },
        ],
        faq: [
          { question: 'Is the tax 2% of the price?', answer: 'No. Both registration tax and acquisition tax are calculated on the fixed asset tax assessed value, which is usually lower than the price.' },
          { question: 'Do I get the 0.3% rate if I buy to rent out?', answer: 'No. The 0.3% building rate is for a qualifying home you will live in yourself. When buying to rent out, the building is taxed at the standard 2%.' },
          { question: 'When do I pay the acquisition tax?', answer: 'A tax notice from the Tokyo Metropolitan Government usually arrives a few months after the purchase, and you pay according to it.' },
          { question: 'Can I register the property while living abroad?', answer: 'Yes. A judicial scrivener usually handles it. You will need a domestic contact and address documents, so talk to the scrivener early.' },
        ],
        ctaTitle: 'Ask us about the full cost of buying',
        ctaDescription: 'We can walk you through typical purchase costs for each listing and how to work with a judicial scrivener or tax accountant, in English, Japanese or Chinese.',
        sources: [
          { label: 'Saitama Prefecture: “My home and taxes”, FY2026 edition, including national tax rules (Japanese)', url: SAITAMA_LEAFLET },
          { label: 'National Tax Agency: Tax Answer No. 7191, registration tax rates (Japanese)', url: NTA_REGISTRATION },
          { label: 'Tokyo Metropolitan Tax Bureau: real estate acquisition tax (Japanese)', url: TOKYO_ACQUISITION },
          { label: 'Ministry of Justice: ownership registrations from 1 April 2024 (Japanese)', url: MOJ_CONTACT },
          { label: 'Ministry of Justice: address proof for owners living abroad (Japanese)', url: MOJ_ADDRESS },
        ],
      },
      'zh-TW': {
        category: '稅金',
        title: '在東京買房時的稅金與登記：登錄免許稅、不動產取得稅與司法書士',
        excerpt: '購屋時一次性的稅金，是登記時繳的登錄免許稅，以及之後才寄來的不動產取得稅。計算基礎不是成交價，而是固定資產稅評定額。也整理海外買方登記時的注意事項。',
        seoDescription: '在東京買房時的登錄免許稅（標準2%、土地1.5%、自住房屋0.3%）與不動產取得稅（標準4%、土地與住宅3%、宅地以評定額1/2計算）的機制、試算範例、司法書士辦理登記，以及海外買方的國內聯絡人與羅馬拼音姓名規定。',
        intro: '買房除了房價之外，還有購買時只繳一次的稅金：登記時繳給國家的「登錄免許稅」，以及之後繳給東京都的「不動產取得稅」。兩者都不是以成交價計算，而是以政府核定的固定資產稅評定額為基礎。以下說明計算方式、登記流程，以及住在海外的買方需要準備什麼。',
        keyTakeaways: [
          '登錄免許稅是辦理所有權登記時繳的國稅。買賣移轉標準為2%（土地在2029年3月31日前登記為1.5%）',
          '自住的特定住宅房屋，在2027年3月31日前取得可降為0.3%（出租目的的購買不適用）',
          '不動產取得稅繳給東京都，標準4%。2027年3月31日前取得的土地與住宅為3%，宅地以評定額的一半計算',
          '登記通常由司法書士在交屋結清當天辦理。海外買方需要國內聯絡人與住址證明文件',
        ],
        sections: [
          {
            id: 'overview',
            heading: '購屋時的兩種稅',
            paragraphs: [
              '購屋時主要的稅是繳給國家的登錄免許稅，以及繳給都道府縣（東京為東京都）的不動產取得稅。兩者的計算基礎都不是成交價，而是固定資產稅評定額。評定額通常低於成交價，稅額也會相對較低。',
              '這兩種稅與每年繳的固定資產稅、都市計畫稅不同。每年的稅金請參考固定資產稅與都市計畫稅指南。',
            ],
          },
          {
            id: 'registration-tax',
            heading: '登錄免許稅（登記時繳的國稅）',
            paragraphs: [
              '將所有權登記到自己名下時繳納。稅率依登記種類而定，買賣移轉標準為2%，另有以下減輕措施。',
              '房屋的0.3%僅適用於自住的特定住宅，需要「住宅用家屋證明書」，且須在取得後1年內登記。以出租為目的購買則不適用。另外，如果申請房貸並設定抵押權，該登記也另外要繳登錄免許稅。',
            ],
            table: {
              headers: ['登記內容', '稅率（乘以評定額）'],
              rows: [
                ['買賣移轉（標準）', '2%'],
                ['土地買賣移轉（2029年3月31日前登記）', '1.5%'],
                ['自住特定住宅房屋的買賣移轉（2027年3月31日前取得、取得後1年內登記）', '0.3%'],
                ['特定新建住宅的所有權保存登記', '0.15%'],
              ],
            },
          },
          {
            id: 'acquisition-tax',
            heading: '不動產取得稅（之後寄來的東京都稅）',
            paragraphs: [
              '取得土地或建物時只課一次的都道府縣稅，東京都內的物件繳給東京都。通常在購買幾個月後才會收到繳稅通知書，請預留這筆資金。',
              '標準稅率為4%，但2027年3月31日前取得的土地與住宅為3%。同一期限前取得的宅地，以評定額的一半計算。符合條件的住宅及其土地還有進一步減輕（中古住宅須符合樓地板面積40〜240㎡等條件）。詳細條件請參考東京都主稅局的頁面。',
            ],
          },
          {
            id: 'example',
            heading: '試算範例（假設）',
            paragraphs: ['數字為方便說明的假設值。實際稅額會依評定額與減輕條件而不同。'],
            example: {
              title: '中古公寓1戶（假設土地評定額1,000萬日圓、房屋評定額1,000萬日圓）',
              lines: [
                '登錄免許稅（土地）：1,000萬日圓×1.5%＝15萬日圓',
                '登錄免許稅（房屋）：自住特定住宅為 1,000萬日圓×0.3%＝3萬日圓；出租目的為 1,000萬日圓×2%＝20萬日圓',
                '不動產取得稅（土地）：1,000萬日圓×1/2×3%＝15萬日圓',
                '不動產取得稅（房屋）：1,000萬日圓×3%＝30萬日圓（若適用特定住宅的減輕，金額會再降低）',
              ],
              note: '此為假設範例，未包含住宅減輕、房貸抵押登記與司法書士報酬。實際金額請向司法書士或稅理士確認。',
            },
          },
          {
            id: 'scrivener',
            heading: '登記流程與司法書士',
            paragraphs: [
              '所有權登記通常由司法書士辦理。在交屋結清（支付尾款與交屋）當天，司法書士確認買賣雙方的文件與身分後，一般會在當天向法務局申請登記。',
              '司法書士的報酬依事務所而不同。請在交屋前取得包含登錄免許稅與報酬的估價單。',
            ],
          },
          {
            id: 'overseas',
            heading: '住在海外的買方如何登記',
            paragraphs: [
              '自2024年4月1日起，住在海外的人登記為所有權人時，也要一併登記日本國內的聯絡人（國內聯絡人）資料。不動產業者或司法書士也可以擔任國內聯絡人。若沒有合適的人，也可以在申請中註明沒有。',
              '外國籍人士的姓名也會以羅馬拼音登記。此外還需要住址證明文件（例如居住國的官方證明）。需要準備的文件依國家與情況而不同，請及早向司法書士確認。',
            ],
            bullets: [
              '住址證明文件',
              '國內聯絡人的資料與同意書',
              '外國籍人士需證明羅馬拼音姓名的文件',
            ],
          },
          {
            id: 'fx-report',
            heading: '別忘了外匯法的申報',
            paragraphs: [
              '除了登記之外，非居住者取得日本不動產後，須在20天內依《外匯及對外貿易法》（外匯法）申報。詳見外匯法申報指南。',
            ],
          },
        ],
        faq: [
          { question: '是以房價的2%計算嗎？', answer: '不是。登錄免許稅與不動產取得稅都以固定資產稅評定額計算，評定額通常低於成交價。' },
          { question: '以出租為目的購買，也適用0.3%嗎？', answer: '不適用。房屋的0.3%是針對自住的特定住宅。以出租為目的購買時，房屋適用標準的2%。' },
          { question: '不動產取得稅什麼時候繳？', answer: '通常在購買幾個月後，東京都會寄來繳稅通知書，依通知書繳納。' },
          { question: '住在海外也能辦理登記嗎？', answer: '可以，通常由司法書士辦理。需要國內聯絡人與住址證明文件等，請及早與司法書士討論。' },
        ],
        ctaTitle: '購屋費用可以一併諮詢',
        ctaDescription: '我們可以用中文、日文、英文說明各物件的購屋費用概算，以及如何與司法書士、稅理士溝通。',
        sources: [
          { label: '埼玉縣「自用住宅與稅金」令和8年度版（含國稅制度說明，日文）', url: SAITAMA_LEAFLET },
          { label: '國稅廳 Tax Answer No.7191 登錄免許稅稅額表（日文）', url: NTA_REGISTRATION },
          { label: '東京都主稅局「不動產取得稅」（日文）', url: TOKYO_ACQUISITION },
          { label: '法務省：2024年4月1日以後的所有權登記申請（日文）', url: MOJ_CONTACT },
          { label: '法務省：海外居住者登記為所有權人時的住址證明（日文）', url: MOJ_ADDRESS },
        ],
      },
      'zh-CN': {
        category: '税费',
        title: '在东京买房时的税费和登记：登录免许税、不动产取得税和司法书士',
        excerpt: '买房时一次性的税，是登记时缴的登录免许税，以及之后才寄来的不动产取得税。计算基础不是成交价，而是固定资产税评估额。也整理了海外买家登记时的注意事项。',
        seoDescription: '在东京买房时的登录免许税（标准2%、土地1.5%、自住房屋0.3%）和不动产取得税（标准4%、土地和住宅3%、宅地按评估额1/2计算）的机制、计算示例、司法书士办理登记，以及海外买家的国内联系人和罗马字姓名规定。',
        intro: '买房除了房款之外，还有购买时只缴一次的税：登记时缴给国家的“登录免许税”，以及之后缴给东京都的“不动产取得税”。两者都不是按成交价计算，而是以政府核定的固定资产税评估额为基础。下面介绍计算方法、登记流程，以及住在海外的买家需要准备什么。',
        keyTakeaways: [
          '登录免许税是办理所有权登记时缴的国税。买卖转移标准为2%（土地在2029年3月31日前登记为1.5%）',
          '自住的特定住宅房屋，在2027年3月31日前取得可降到0.3%（以出租为目的购买不适用）',
          '不动产取得税缴给东京都，标准4%。2027年3月31日前取得的土地和住宅为3%，宅地按评估额的一半计算',
          '登记通常由司法书士在交割当天办理。海外买家需要国内联系人和住址证明材料',
        ],
        sections: [
          {
            id: 'overview',
            heading: '买房时的两种税',
            paragraphs: [
              '买房时主要的税是缴给国家的登录免许税，以及缴给都道府县（东京为东京都）的不动产取得税。两者的计算基础都不是成交价，而是固定资产税评估额。评估额通常低于成交价，税额也会相应较低。',
              '这两种税和每年缴的固定资产税、都市计划税不同。每年的税请参考固定资产税和都市计划税指南。',
            ],
          },
          {
            id: 'registration-tax',
            heading: '登录免许税（登记时缴的国税）',
            paragraphs: [
              '把所有权登记到自己名下时缴纳。税率按登记种类确定，买卖转移标准为2%，另有以下减免措施。',
              '房屋的0.3%只适用于自住的特定住宅，需要“住宅用家屋证明书”，并且要在取得后1年内登记。以出租为目的购买不适用。另外，如果办理房贷并设定抵押权，这项登记也要另外缴登录免许税。',
            ],
            table: {
              headers: ['登记内容', '税率（乘以评估额）'],
              rows: [
                ['买卖转移（标准）', '2%'],
                ['土地买卖转移（2029年3月31日前登记）', '1.5%'],
                ['自住特定住宅房屋的买卖转移（2027年3月31日前取得、取得后1年内登记）', '0.3%'],
                ['特定新建住宅的所有权保存登记', '0.15%'],
              ],
            },
          },
          {
            id: 'acquisition-tax',
            heading: '不动产取得税（之后寄来的东京都税）',
            paragraphs: [
              '取得土地或建筑时只征一次的都道府县税，东京都内的房产缴给东京都。一般在购买几个月后才会收到缴税通知书，请预留这笔资金。',
              '标准税率为4%，但2027年3月31日前取得的土地和住宅为3%。同一期限前取得的宅地，按评估额的一半计算。符合条件的住宅及其土地还有进一步减免（二手住宅需满足建筑面积40〜240㎡等条件）。具体条件请查看东京都主税局的页面。',
            ],
          },
          {
            id: 'example',
            heading: '计算示例（假设）',
            paragraphs: ['数字是为了便于说明的假设值。实际税额会因评估额和减免条件而不同。'],
            example: {
              title: '二手公寓1套（假设土地评估额1,000万日元、房屋评估额1,000万日元）',
              lines: [
                '登录免许税（土地）：1,000万日元×1.5%＝15万日元',
                '登录免许税（房屋）：自住特定住宅为 1,000万日元×0.3%＝3万日元；以出租为目的为 1,000万日元×2%＝20万日元',
                '不动产取得税（土地）：1,000万日元×1/2×3%＝15万日元',
                '不动产取得税（房屋）：1,000万日元×3%＝30万日元（如适用特定住宅减免，金额会再降低）',
              ],
              note: '此为假设示例，不含住宅减免、房贷抵押登记和司法书士报酬。实际金额请向司法书士或税理士确认。',
            },
          },
          {
            id: 'scrivener',
            heading: '登记流程和司法书士',
            paragraphs: [
              '所有权登记通常由司法书士办理。在交割（支付尾款并交房）当天，司法书士核对买卖双方的材料和身份后，一般当天就向法务局申请登记。',
              '司法书士的报酬因事务所而异。请在交割前拿到包含登录免许税和报酬的报价。',
            ],
          },
          {
            id: 'overseas',
            heading: '住在海外的买家如何登记',
            paragraphs: [
              '自2024年4月1日起，住在海外的人登记为所有权人时，也要一并登记日本国内的联系人（国内联系人）信息。房产公司或司法书士也可以担任国内联系人。如果没有合适的人，也可以在申请中注明没有。',
              '外国籍人士的姓名也会用罗马字登记。此外还需要住址证明材料（例如居住国的官方证明）。需要准备哪些材料因国家和情况而异，请尽早向司法书士确认。',
            ],
            bullets: [
              '住址证明材料',
              '国内联系人的信息和同意书',
              '外国籍人士需证明罗马字姓名的材料',
            ],
          },
          {
            id: 'fx-report',
            heading: '别忘了外汇法申报',
            paragraphs: [
              '除了登记之外，非居住者取得日本房产后，需要在20天内根据《外汇及对外贸易法》（外汇法）申报。详见外汇法申报指南。',
            ],
          },
        ],
        faq: [
          { question: '是按房价的2%计算吗？', answer: '不是。登录免许税和不动产取得税都按固定资产税评估额计算，评估额通常低于成交价。' },
          { question: '以出租为目的购买，也适用0.3%吗？', answer: '不适用。房屋的0.3%针对的是自住的特定住宅。以出租为目的购买时，房屋适用标准的2%。' },
          { question: '不动产取得税什么时候缴？', answer: '一般在购买几个月后，东京都会寄来缴税通知书，按通知书缴纳。' },
          { question: '住在海外也能办理登记吗？', answer: '可以，通常由司法书士办理。需要国内联系人和住址证明材料等，请尽早和司法书士沟通。' },
        ],
        ctaTitle: '买房费用可以一起咨询',
        ctaDescription: '我们可以用中文、日文、英文介绍各房源的购房费用估算，以及如何与司法书士、税理士沟通。',
        sources: [
          { label: '埼玉县“自住房与税”令和8年度版（含国税制度说明，日文）', url: SAITAMA_LEAFLET },
          { label: '国税厅 Tax Answer No.7191 登录免许税税额表（日文）', url: NTA_REGISTRATION },
          { label: '东京都主税局“不动产取得税”（日文）', url: TOKYO_ACQUISITION },
          { label: '法务省：2024年4月1日以后的所有权登记申请（日文）', url: MOJ_CONTACT },
          { label: '法务省：海外居住者登记为所有权人时的住址证明（日文）', url: MOJ_ADDRESS },
        ],
      },
    },
  },
]
