import type { GuideArticle } from './guides'

/** Third set of buyer guides from the competitor review: leasehold and selling later. */
export const extraGuideArticles3: GuideArticle[] = [
  {
    slug: 'leasehold-vs-freehold-tokyo',
    publishedAt: '2026-10-06',
    updatedAt: '2026-10-06',
    readMinutes: 5,
    tags: ['leasehold', 'land rights', 'due diligence'],
    locales: {
      ja: {
        category: '物件の見方',
        title: '所有権と借地権の違い｜東京の物件で確認したい土地の権利',
        excerpt: '土地を所有する「所有権」と、土地を借りる「借地権」の違い、借地権の種類、地代や承諾料などの費用、ローンや売却への影響を整理します。',
        seoDescription: '所有権と借地権の違いを外国人購入者向けに解説。旧法借地権・普通借地権・定期借地権、地代・更新料・譲渡承諾料、ローンや売却への影響。',
        intro: '東京の物件情報には「土地権利：所有権」または「借地権」と書かれています。借地権の物件は価格が割安なことが多い一方で、毎月の地代や、売却・建替え時の地主の承諾など、所有権にはない条件があります。',
        keyTakeaways: [
          '所有権は土地も自分のもの。借地権は建物を持つために土地を借りる権利',
          '借地権には旧法借地権・普通借地権・定期借地権があり、更新の扱いが違う',
          '地代のほか、更新料や売却時の承諾料がかかることがある',
          'ローンが使いにくく、売却時も条件の説明が必要になる',
        ],
        sections: [
          {
            id: 'difference',
            heading: '所有権と借地権',
            paragraphs: [
              '所有権の物件では、建物と土地（マンションなら敷地の持分）の両方を所有します。借地権の物件では、建物は自分のものですが、土地は地主から借りていて、地代を払います。',
              '借地権の物件は、同じ立地の所有権物件より価格が抑えられていることが多く、土地の固定資産税は地主が負担します。',
            ],
          },
          {
            id: 'types',
            heading: '借地権の種類',
            paragraphs: ['いつ、どの法律にもとづいて契約したかで、更新の扱いが変わります。'],
            bullets: [
              '旧法借地権：1992年7月以前の契約。借地人の保護が強く、更新が続くことが多い',
              '普通借地権：当初の期間は30年以上。地主が更新を拒むには正当な理由が必要',
              '定期借地権：期間は50年以上など。更新はなく、期間満了で更地にして返すのが原則',
            ],
          },
          {
            id: 'costs',
            heading: '借地権でかかる費用',
            paragraphs: [
              '毎月または年ごとの地代のほか、契約更新のときの更新料、売却するときの譲渡承諾料、建替えのときの建替承諾料が慣習的に求められることがあります。定期借地権のマンションでは、地代や解体のための積立金が管理費などに上乗せされている場合があります。',
            ],
          },
          {
            id: 'loans-resale',
            heading: 'ローンと売却への影響',
            paragraphs: [
              '借地権の物件は担保としての評価が低く、ローンを扱う金融機関が限られます。売却するときも、買主に地代や承諾の条件を説明する必要があり、買い手が限られることがあります。',
              '定期借地権は期間が短くなるほど価値が下がるため、残りの期間を必ず確認しましょう。',
            ],
          },
          {
            id: 'checklist',
            heading: '借地権の物件で確認すること',
            paragraphs: ['契約前に、次の書類と条件を確認してください。'],
            bullets: [
              '借地契約書（種類、期間、残りの期間、更新の条件）',
              '現在の地代と、改定の履歴',
              '譲渡・建替え・増改築に地主の承諾が必要かと、承諾料の目安',
              '地主の承諾を得てローンを使えるか',
            ],
          },
        ],
        faq: [
          { question: '当サイトの物件は所有権ですか？', answer: '物件ページの「土地権利」に記載しています。借地権の物件には「確認したい点」に表示します。' },
          { question: '借地権でも外国人は買えますか？', answer: '買えます。所有権と同じく国籍による制限はありませんが、地主の承諾などの条件を事前に確認してください。' },
          { question: '借地権は将来所有権にできますか？', answer: '地主が土地を売る場合に、借地人が底地を買い取って所有権にできることがあります。交渉しだいです。' },
        ],
        ctaTitle: '所有権の物件を探す',
        ctaDescription: '物件ページで土地権利を確認できます。借地権の物件は確認したい点としてお知らせします。',
      },
      en: {
        category: 'Due diligence',
        title: 'Freehold vs Leasehold in Tokyo: What the Land Rights Line Means',
        excerpt: 'The difference between owning the land and leasing it, the three types of Japanese leasehold, ground rent and consent fees, and the effect on loans and resale.',
        seoDescription: 'Freehold (所有権) vs leasehold (借地権) in Tokyo for foreign buyers: old-law, ordinary and fixed-term leaseholds, ground rent, renewal and consent fees, loans and resale.',
        intro: 'Tokyo listings state the land rights as freehold (所有権) or leasehold (借地権). Leasehold properties are often cheaper, but they come with ground rent and the landowner\'s consent for selling or rebuilding, conditions that freehold does not have.',
        keyTakeaways: [
          'Freehold means you own the land too; leasehold means you lease the land your building stands on',
          'There are old-law, ordinary and fixed-term leaseholds, with different renewal rules',
          'Ground rent, renewal fees and a consent fee on sale may apply',
          'Loans are harder to get, and buyers need the terms explained when you sell',
        ],
        sections: [
          {
            id: 'difference',
            heading: 'Freehold and leasehold',
            paragraphs: [
              'With freehold you own the building and the land (for a condominium, a share of the site). With leasehold you own the building, but you lease the land from the landowner and pay ground rent.',
              'Leasehold properties are often priced below freehold in the same location, and the landowner pays the fixed asset tax on the land.',
            ],
          },
          {
            id: 'types',
            heading: 'Types of leasehold',
            paragraphs: ['Renewal depends on when the lease was made and under which law.'],
            bullets: [
              'Old-law leasehold: leases from before August 1992; strong tenant protection and usually renewed',
              'Ordinary leasehold: an initial term of 30 years or more; the landowner needs just cause to refuse renewal',
              'Fixed-term leasehold: for example 50 years or more; no renewal, and the land is normally returned cleared at the end',
            ],
          },
          {
            id: 'costs',
            heading: 'Costs of leasehold',
            paragraphs: [
              'Besides ground rent, landowners customarily ask for a renewal fee when the lease is renewed, a consent fee when you sell and another when you rebuild. In fixed-term leasehold condominiums, ground rent and a demolition reserve may be added to the monthly fees.',
            ],
          },
          {
            id: 'loans-resale',
            heading: 'Loans and resale',
            paragraphs: [
              'Leasehold is weaker collateral, so fewer lenders will finance it. When you sell, buyers need the ground rent and consent terms explained, which can narrow the market.',
              'A fixed-term leasehold loses value as the remaining term shortens, so always check how many years are left.',
            ],
          },
          {
            id: 'checklist',
            heading: 'What to check',
            paragraphs: ['Before signing, confirm these documents and terms.'],
            bullets: [
              'The land lease contract: type, term, years remaining and renewal terms',
              'Current ground rent and its revision history',
              'Whether sale, rebuilding or extension needs consent, and the usual fees',
              'Whether a loan can be used with the landowner\'s consent',
            ],
          },
        ],
        faq: [
          { question: 'Are your listings freehold?', answer: 'The land rights appear on each listing page. Leasehold properties are flagged under “Points to check”.' },
          { question: 'Can foreigners buy leasehold property?', answer: 'Yes. As with freehold there is no nationality restriction, but confirm the landowner\'s consent conditions in advance.' },
          { question: 'Can leasehold become freehold later?', answer: 'If the landowner sells the land, the leaseholder may be able to buy it and become the freehold owner. It depends on negotiation.' },
        ],
        ctaTitle: 'Browse freehold properties',
        ctaDescription: 'Each listing page shows the land rights, and leasehold is flagged as a point to check.',
      },
      'zh-TW': {
        category: '物件判讀',
        title: '所有權與借地權的差異｜東京物件要確認的土地權利',
        excerpt: '整理擁有土地的「所有權」與租用土地的「借地權」差異、借地權的種類、地租與承諾費等費用，以及對貸款與轉售的影響。',
        seoDescription: '為外國購屋者說明所有權與借地權的差異：舊法借地權、普通借地權、定期借地權，地租、更新費、轉讓承諾費，以及對貸款與轉售的影響。',
        intro: '東京的物件資訊會標示「土地權利：所有權」或「借地權」。借地權物件價格通常較低，但有每月地租，出售或改建時需地主同意等所有權沒有的條件。',
        keyTakeaways: [
          '所有權是連土地也屬於自己；借地權是為擁有建物而租用土地的權利',
          '借地權分為舊法借地權、普通借地權、定期借地權，續約規定不同',
          '除地租外，可能需要更新費與出售時的承諾費',
          '貸款較難申請，出售時也需向買方說明條件',
        ],
        sections: [
          {
            id: 'difference',
            heading: '所有權與借地權',
            paragraphs: [
              '所有權物件同時擁有建物與土地（公寓則為基地持分）。借地權物件的建物屬於自己，但土地向地主租用，需要支付地租。',
              '借地權物件通常比同地段的所有權物件便宜，且土地的固定資產稅由地主負擔。',
            ],
          },
          {
            id: 'types',
            heading: '借地權的種類',
            paragraphs: ['依簽約時間與適用法律，續約規定不同。'],
            bullets: [
              '舊法借地權：1992年7月以前的契約，對借地人保護較強，多半持續續約',
              '普通借地權：初始期間30年以上，地主拒絕續約需有正當理由',
              '定期借地權：例如50年以上，不續約，原則上期滿後拆除建物歸還土地',
            ],
          },
          {
            id: 'costs',
            heading: '借地權的費用',
            paragraphs: [
              '除每月或每年的地租外，依慣例可能需要續約時的更新費、出售時的轉讓承諾費，以及改建時的改建承諾費。定期借地權公寓的地租與拆除準備金，有時會加在管理費等費用中。',
            ],
          },
          {
            id: 'loans-resale',
            heading: '對貸款與轉售的影響',
            paragraphs: [
              '借地權物件的擔保評價較低，可承作貸款的金融機構有限。出售時也需向買方說明地租與承諾條件，買方可能較少。',
              '定期借地權的剩餘期間越短價值越低，請務必確認剩餘年數。',
            ],
          },
          {
            id: 'checklist',
            heading: '借地權物件的確認事項',
            paragraphs: ['簽約前請確認以下文件與條件。'],
            bullets: [
              '借地契約（種類、期間、剩餘期間、續約條件）',
              '目前地租與調整紀錄',
              '轉讓、改建、增建是否需地主同意，以及承諾費的參考',
              '取得地主同意後能否使用貸款',
            ],
          },
        ],
        faq: [
          { question: '本站物件是所有權嗎？', answer: '物件頁面的「土地權利」有記載。借地權物件會在「需確認事項」中標示。' },
          { question: '外國人可以買借地權物件嗎？', answer: '可以。與所有權相同沒有國籍限制，但請事先確認地主同意等條件。' },
          { question: '借地權日後可以轉為所有權嗎？', answer: '若地主出售土地，借地人有機會買下土地成為所有權人，視協商而定。' },
        ],
        ctaTitle: '尋找所有權物件',
        ctaDescription: '物件頁面可確認土地權利，借地權物件會標示為需確認事項。',
      },
      'zh-CN': {
        category: '房源判读',
        title: '所有权与借地权的区别｜东京房源要确认的土地权利',
        excerpt: '整理拥有土地的“所有权”与租用土地的“借地权”的区别、借地权的种类、地租与承诺费等费用，以及对贷款与转售的影响。',
        seoDescription: '为外国购房者说明所有权与借地权的区别：旧法借地权、普通借地权、定期借地权，地租、更新费、转让承诺费，以及对贷款与转售的影响。',
        intro: '东京的房源信息会标示“土地权利：所有权”或“借地权”。借地权房源价格通常较低，但有每月地租，出售或重建时需要地主同意等所有权没有的条件。',
        keyTakeaways: [
          '所有权是连土地也属于自己；借地权是为拥有建筑而租用土地的权利',
          '借地权分为旧法借地权、普通借地权、定期借地权，续约规定不同',
          '除地租外，可能需要更新费与出售时的承诺费',
          '贷款较难申请，出售时也需要向买方说明条件',
        ],
        sections: [
          {
            id: 'difference',
            heading: '所有权与借地权',
            paragraphs: [
              '所有权房源同时拥有建筑与土地（公寓则为用地份额）。借地权房源的建筑属于自己，但土地向地主租用，需要支付地租。',
              '借地权房源通常比同地段的所有权房源便宜，且土地的固定资产税由地主承担。',
            ],
          },
          {
            id: 'types',
            heading: '借地权的种类',
            paragraphs: ['根据签约时间与适用法律，续约规定不同。'],
            bullets: [
              '旧法借地权：1992年7月以前的合同，对借地人保护较强，大多持续续约',
              '普通借地权：初始期限30年以上，地主拒绝续约需要正当理由',
              '定期借地权：例如50年以上，不续约，原则上期满后拆除建筑归还土地',
            ],
          },
          {
            id: 'costs',
            heading: '借地权的费用',
            paragraphs: [
              '除每月或每年的地租外，按惯例可能需要续约时的更新费、出售时的转让承诺费，以及重建时的重建承诺费。定期借地权公寓的地租与拆除准备金，有时会加在管理费等费用中。',
            ],
          },
          {
            id: 'loans-resale',
            heading: '对贷款与转售的影响',
            paragraphs: [
              '借地权房源的担保评估较低，能提供贷款的金融机构有限。出售时也需要向买方说明地租与承诺条件，买家可能较少。',
              '定期借地权的剩余期限越短价值越低，请务必确认剩余年数。',
            ],
          },
          {
            id: 'checklist',
            heading: '借地权房源的确认事项',
            paragraphs: ['签约前请确认以下文件与条件。'],
            bullets: [
              '借地合同（种类、期限、剩余期限、续约条件）',
              '当前地租与调整记录',
              '转让、重建、扩建是否需要地主同意，以及承诺费的参考',
              '取得地主同意后能否使用贷款',
            ],
          },
        ],
        faq: [
          { question: '本站房源是所有权吗？', answer: '房源页面的“土地权利”有记载。借地权房源会在“需确认事项”中标示。' },
          { question: '外国人可以买借地权房源吗？', answer: '可以。与所有权相同没有国籍限制，但请事先确认地主同意等条件。' },
          { question: '借地权以后可以转为所有权吗？', answer: '如果地主出售土地，借地人有机会买下土地成为所有权人，视协商而定。' },
        ],
        ctaTitle: '查找所有权房源',
        ctaDescription: '房源页面可确认土地权利，借地权房源会标示为需确认事项。',
      },
    },
  },
  {
    slug: 'selling-tokyo-property-costs-taxes',
    publishedAt: '2026-10-06',
    updatedAt: '2026-10-06',
    readMinutes: 6,
    tags: ['selling', 'capital gains', 'tax'],
    locales: {
      ja: {
        category: '費用',
        title: '東京の不動産を売るときの費用と税金｜海外在住オーナーの注意点',
        excerpt: '売却時の仲介手数料や登記費用、譲渡所得税の計算と5年ルール、海外在住の売主に対する10.21%の源泉徴収と確定申告を整理します。',
        seoDescription: '東京の不動産売却時の費用と税金を解説。譲渡所得の計算、所有期間5年の判定、税率20.315%と39.63%、非居住者の源泉徴収10.21%と確定申告。',
        intro: '買うときに出口を考えておくと、物件選びが変わります。売却時にかかる費用と税金、特に海外にお住まいのオーナーに関係する手続きをまとめました。',
        keyTakeaways: [
          '売却益（譲渡所得）は、売却価格から取得費と売却費用を引いて計算する',
          '所有期間は売却した年の1月1日時点で判定し、5年を超えると税率が下がる',
          '海外在住の売主には、買主が代金の10.21%を源泉徴収するのが原則',
          '売却した翌年に日本で確定申告し、源泉徴収された税金を精算する',
        ],
        sections: [
          {
            id: 'costs',
            heading: '売却時にかかる費用',
            paragraphs: ['売却価格の全額が手元に残るわけではありません。主な費用は次のとおりです。'],
            bullets: [
              '仲介手数料（上限：売却価格×3%＋6万円＋消費税）',
              '売買契約書の印紙税',
              'ローンが残っている場合の抵当権抹消の登記費用と、繰上返済の手数料',
              '必要に応じて、測量・修繕・引越しなどの費用',
            ],
          },
          {
            id: 'gain',
            heading: '譲渡所得の計算',
            paragraphs: [
              '譲渡所得は「売却価格 −（取得費＋譲渡費用）」で計算します。取得費は購入価格と購入時の諸費用の合計から、建物の減価償却分を差し引いたものです。',
              '購入時の契約書などがなく取得費がわからない場合は、売却価格の5%を取得費とみなすため、税金が大きくなります。購入時の書類は必ず保管しておきましょう。',
            ],
          },
          {
            id: 'rates',
            heading: '税率と5年ルール',
            paragraphs: [
              '所有期間が、売却した年の1月1日時点で5年を超えていれば長期譲渡所得として約20.315%、5年以下なら短期譲渡所得として約39.63%（いずれも所得税・復興特別所得税・住民税の合計）がかかります。',
              '住民税は翌年1月1日に日本に住所がある人に課税されるため、その時点で海外在住の場合は所得税と復興特別所得税の部分（長期15.315%、短期30.63%）が中心になります。',
            ],
          },
          {
            id: 'withholding',
            heading: '海外在住の売主の源泉徴収',
            paragraphs: [
              '売主が非居住者の場合、買主は売却代金の10.21%を源泉徴収して税務署に納めるのが原則です（個人が自分や親族の住まいとして1億円以下で買う場合は不要）。',
              '源泉徴収された税金は、売却した翌年の確定申告で精算され、払いすぎていれば還付されます。日本に住所がない場合は、納税管理人を通じて申告します。',
            ],
          },
          {
            id: 'plan',
            heading: '買う時点で考えておくこと',
            paragraphs: ['出口を見据えて、購入時から次の点を意識しておくと安心です。'],
            bullets: [
              '契約書・領収書など、取得費がわかる書類の保管',
              '5年の所有期間の区切り（売却年の1月1日で判定）',
              '旧耐震・借地権・再建築不可など、売りにくくなる条件',
              '賃貸中で売るか、空室にして売るか',
            ],
          },
        ],
        faq: [
          { question: '自分が住んでいた家なら税金は安くなりますか？', answer: '自分が住んでいた家の売却には3,000万円の特別控除などの特例がありますが、要件があります。投資用や住んでいない物件は対象外です。' },
          { question: '売却損が出たら申告は必要ですか？', answer: '税金はかかりませんが、源泉徴収された税金を取り戻すには確定申告が必要です。' },
          { question: '税金の計算は誰に頼めますか？', answer: '日本の税理士に依頼するのが一般的です。売却のご相談は当社でもお受けしています。' },
        ],
        ctaTitle: '出口も考えて物件を選ぶ',
        ctaDescription: '物件ページでは、耐震基準や土地権利など、将来の売りやすさに関わる確認ポイントも表示しています。',
      },
      en: {
        category: 'Costs',
        title: 'Selling Tokyo Property Later: Costs, Capital Gains Tax and Non-Resident Withholding',
        excerpt: 'Selling costs, how capital gains are calculated, the five-year rule, the 10.21% withholding on non-resident sellers and the Japanese tax return.',
        seoDescription: 'Costs and taxes when selling Tokyo property: capital gains calculation, the five-year rule, 20.315% vs 39.63% rates, 10.21% withholding for non-resident sellers and tax returns.',
        intro: 'Thinking about the exit when you buy changes what you buy. Here are the costs and taxes of selling, with the steps that matter for owners who live abroad.',
        keyTakeaways: [
          'The gain is the sale price minus the acquisition cost and selling costs',
          'The holding period is judged on 1 January of the year of sale; over five years means a lower rate',
          'Buyers generally withhold 10.21% of the price when the seller is a non-resident',
          'You file a Japanese tax return the year after the sale, which settles the withheld tax',
        ],
        sections: [
          {
            id: 'costs',
            heading: 'Selling costs',
            paragraphs: ['Not all of the sale price reaches you. The main costs are:'],
            bullets: [
              'Brokerage fee (maximum: price × 3% + ¥60,000 + consumption tax)',
              'Stamp duty on the sale contract',
              'Registration to release any mortgage, and early repayment fees',
              'Where needed, surveying, repairs and moving',
            ],
          },
          {
            id: 'gain',
            heading: 'Calculating the gain',
            paragraphs: [
              'The capital gain is the sale price minus the acquisition cost and the selling costs. The acquisition cost is the purchase price plus purchase costs, less depreciation on the building.',
              'If you cannot document the acquisition cost, 5% of the sale price is used instead, which usually means much more tax. Keep your purchase documents.',
            ],
          },
          {
            id: 'rates',
            heading: 'Rates and the five-year rule',
            paragraphs: [
              'If you have owned the property for more than five years as of 1 January of the year you sell, the long-term rate of about 20.315% applies; otherwise the short-term rate of about 39.63% (both combine income tax, the reconstruction surtax and resident tax).',
              'Resident tax is charged to people with an address in Japan on 1 January of the following year, so if you live abroad then, mainly the national part applies (15.315% long-term, 30.63% short-term).',
            ],
          },
          {
            id: 'withholding',
            heading: 'Withholding on non-resident sellers',
            paragraphs: [
              'When the seller is a non-resident, the buyer generally withholds 10.21% of the price and pays it to the tax office. It does not apply when an individual buys a home for their own or a relative\'s use for ¥100 million or less.',
              'The withheld tax is settled in your tax return the following year, and any overpayment is refunded. Without an address in Japan, you file through a tax representative.',
            ],
          },
          {
            id: 'plan',
            heading: 'What to plan when you buy',
            paragraphs: ['With the exit in mind, keep these in view from the start.'],
            bullets: [
              'Keep the contract and receipts that prove your acquisition cost',
              'Note when you pass five years of ownership (judged on 1 January of the year of sale)',
              'Watch for conditions that make resale harder: old earthquake standard, leasehold, no rebuilding',
              'Decide whether you will sell with a tenant or vacant',
            ],
          },
        ],
        faq: [
          { question: 'Is tax lower if I lived in the home?', answer: 'Selling your own home can qualify for reliefs such as a ¥30 million special deduction, subject to conditions. Investment property you did not live in does not qualify.' },
          { question: 'Do I need to file if I sell at a loss?', answer: 'No tax is due, but you need to file to recover any tax that was withheld.' },
          { question: 'Who can calculate the tax?', answer: 'A Japanese tax accountant usually handles it. We are also happy to discuss selling with you.' },
        ],
        ctaTitle: 'Choose with the exit in mind',
        ctaDescription: 'Listing pages flag points such as the earthquake standard and land rights that affect how easily a property sells later.',
      },
      'zh-TW': {
        category: '費用',
        title: '出售東京不動產的費用與稅金｜海外屋主注意事項',
        excerpt: '整理出售時的仲介費與登記費用、讓渡所得稅計算與5年規則、對海外賣方的10.21%預扣，以及日本報稅。',
        seoDescription: '說明出售東京不動產的費用與稅金：讓渡所得計算、持有期間5年的判定、稅率20.315%與39.63%、非居住者預扣10.21%與報稅。',
        intro: '購買時就考慮出場，會改變選擇物件的方式。以下整理出售時的費用與稅金，特別是與海外屋主相關的手續。',
        keyTakeaways: [
          '出售獲利（讓渡所得）以售價扣除取得費與出售費用計算',
          '持有期間以出售當年1月1日判定，超過5年稅率較低',
          '賣方為海外居住者時，原則上由買方預扣價款的10.21%',
          '出售隔年在日本報稅，結算預扣稅額',
        ],
        sections: [
          {
            id: 'costs',
            heading: '出售時的費用',
            paragraphs: ['售價並不會全部入帳，主要費用如下。'],
            bullets: [
              '仲介費（上限：售價×3%＋6萬日圓＋消費稅）',
              '買賣契約印花稅',
              '仍有房貸時的抵押權塗銷登記費用與提前還款手續費',
              '視需要的測量、修繕、搬家等費用',
            ],
          },
          {
            id: 'gain',
            heading: '讓渡所得的計算',
            paragraphs: [
              '讓渡所得＝售價 −（取得費＋讓渡費用）。取得費是購買價格加上購買時雜費，再扣除建物的折舊。',
              '若沒有購買時的契約書等文件而無法得知取得費，將以售價的5%視為取得費，稅金會大幅增加。請務必保存購買時的文件。',
            ],
          },
          {
            id: 'rates',
            heading: '稅率與5年規則',
            paragraphs: [
              '若以出售當年1月1日計算持有超過5年，適用長期讓渡所得約20.315%；5年以下則為短期讓渡所得約39.63%（皆為所得稅、復興特別所得稅與住民稅合計）。',
              '住民稅是對隔年1月1日在日本有住所者課徵，若當時居住海外，主要為所得稅與復興特別所得稅部分（長期15.315%、短期30.63%）。',
            ],
          },
          {
            id: 'withholding',
            heading: '海外賣方的預扣',
            paragraphs: [
              '賣方為非居住者時，原則上買方需預扣售價的10.21%並繳納給稅務署（個人以1億日圓以下購買自住或親屬居住用房屋時不需預扣）。',
              '預扣稅額於出售隔年報稅時結算，多繳會退還。在日本沒有住址者，透過納稅管理人申報。',
            ],
          },
          {
            id: 'plan',
            heading: '購買時就要考慮的事',
            paragraphs: ['著眼出場，從購買時就留意以下事項。'],
            bullets: [
              '保存可證明取得費的契約書與收據',
              '持有期間5年的分界（以出售當年1月1日判定）',
              '舊耐震、借地權、不可重建等不利轉售的條件',
              '要帶租約出售，還是空屋出售',
            ],
          },
        ],
        faq: [
          { question: '若是自住過的房子，稅金會比較少嗎？', answer: '出售自住房屋有3,000萬日圓特別扣除等優惠，但有適用條件。投資用或未自住的物件不適用。' },
          { question: '出售虧損也需要報稅嗎？', answer: '不需繳稅，但若要取回被預扣的稅金，需要報稅。' },
          { question: '稅金計算可以委託誰？', answer: '一般委託日本的稅理士。本公司也受理出售諮詢。' },
        ],
        ctaTitle: '考慮出場來選擇物件',
        ctaDescription: '物件頁面也會顯示耐震基準、土地權利等影響日後轉售的確認事項。',
      },
      'zh-CN': {
        category: '费用',
        title: '出售东京房产的费用与税金｜海外业主注意事项',
        excerpt: '整理出售时的中介费与登记费用、转让所得税计算与5年规则、对海外卖方的10.21%预扣，以及日本报税。',
        seoDescription: '说明出售东京房产的费用与税金：转让所得计算、持有期限5年的判定、税率20.315%与39.63%、非居住者预扣10.21%与报税。',
        intro: '购买时就考虑退出，会改变选择房源的方式。以下整理出售时的费用与税金，特别是与海外业主相关的手续。',
        keyTakeaways: [
          '出售收益（转让所得）以售价扣除取得费与出售费用计算',
          '持有期限以出售当年1月1日判定，超过5年税率较低',
          '卖方为海外居住者时，原则上由买方预扣房款的10.21%',
          '出售次年在日本报税，结算预扣税额',
        ],
        sections: [
          {
            id: 'costs',
            heading: '出售时的费用',
            paragraphs: ['售价不会全部到手，主要费用如下。'],
            bullets: [
              '中介费（上限：售价×3%＋6万日元＋消费税）',
              '买卖合同印花税',
              '仍有房贷时的抵押权注销登记费用与提前还款手续费',
              '视需要的测量、修缮、搬家等费用',
            ],
          },
          {
            id: 'gain',
            heading: '转让所得的计算',
            paragraphs: [
              '转让所得＝售价 −（取得费＋转让费用）。取得费是购买价格加上购买时杂费，再扣除建筑的折旧。',
              '如果没有购买时的合同等文件而无法得知取得费，将以售价的5%视为取得费，税金会大幅增加。请务必保存购买时的文件。',
            ],
          },
          {
            id: 'rates',
            heading: '税率与5年规则',
            paragraphs: [
              '若以出售当年1月1日计算持有超过5年，适用长期转让所得约20.315%；5年以下则为短期转让所得约39.63%（均为所得税、复兴特别所得税与住民税合计）。',
              '住民税是对次年1月1日在日本有住所者征收，若当时居住海外，主要为所得税与复兴特别所得税部分（长期15.315%、短期30.63%）。',
            ],
          },
          {
            id: 'withholding',
            heading: '海外卖方的预扣',
            paragraphs: [
              '卖方为非居住者时，原则上买方需预扣售价的10.21%并缴纳给税务署（个人以1亿日元以下购买自住或亲属居住用房屋时不需预扣）。',
              '预扣税额在出售次年报税时结算，多缴会退还。在日本没有住址者，通过纳税管理人申报。',
            ],
          },
          {
            id: 'plan',
            heading: '购买时就要考虑的事',
            paragraphs: ['着眼退出，从购买时就留意以下事项。'],
            bullets: [
              '保存能证明取得费的合同与收据',
              '持有期限5年的分界（以出售当年1月1日判定）',
              '旧耐震、借地权、不可重建等不利转售的条件',
              '是带租约出售，还是空置出售',
            ],
          },
        ],
        faq: [
          { question: '如果是自住过的房子，税金会更少吗？', answer: '出售自住房屋有3,000万日元特别扣除等优惠，但有适用条件。投资用或未自住的房产不适用。' },
          { question: '出售亏损也需要报税吗？', answer: '不需要缴税，但若要取回被预扣的税金，需要报税。' },
          { question: '税金计算可以委托谁？', answer: '一般委托日本的税理士。本公司也受理出售咨询。' },
        ],
        ctaTitle: '考虑退出来选择房源',
        ctaDescription: '房源页面也会显示耐震标准、土地权利等影响日后转售的确认事项。',
      },
    },
  },
]
