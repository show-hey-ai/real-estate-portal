import type { GuideArticle } from './guides'

/**
 * Buyer guides added from the competitor review (earthquake standards, monthly fees).
 * Written from public rules; figures are stated as ranges or guideline values.
 */
export const extraGuideArticles: GuideArticle[] = [
  {
    slug: 'japan-earthquake-standards-1981',
    publishedAt: '2026-10-06',
    updatedAt: '2026-10-06',
    readMinutes: 6,
    tags: ['earthquake', 'building age', 'due diligence'],
    locales: {
      ja: {
        category: '物件の見方',
        title: '新耐震・旧耐震の見分け方｜1981年の基準と中古マンション選び',
        excerpt: '1981年6月の新耐震基準、築年数との関係、旧耐震物件を検討するときに確認する書類と、ローン・税への影響を整理します。',
        seoDescription: '新耐震基準（1981年6月）と旧耐震の違い、築年からの見分け方、建築確認日の確認方法、耐震診断・ローン・住宅ローン控除への影響を解説。',
        intro: '東京で中古マンションを探すと、築40年以上の物件も多く見かけます。地震の多い日本では、建物がどの耐震基準で設計されたかが、安全性だけでなく融資や税金、売却のしやすさにも関わります。ここでは、築年数からの目安と、契約前に確認したいポイントをまとめます。',
        keyTakeaways: [
          '新耐震基準は1981年6月1日以降に建築確認を受けた建物に適用される',
          '判断の基準は完成年ではなく建築確認日。1981〜1983年完成の建物は要確認',
          '旧耐震でも耐震診断・改修の有無で評価は変わる',
          '旧耐震はローン条件や税の特例に影響することがある',
        ],
        sections: [
          {
            id: 'what-changed',
            heading: '1981年に何が変わったのか',
            paragraphs: [
              '1981年6月の建築基準法改正で導入された基準を「新耐震基準」と呼びます。中規模の地震（震度5強程度）ではほとんど損傷せず、まれに起きる大地震（震度6強〜7程度）でも倒壊・崩壊しないことを目標にしています。',
              'それ以前の「旧耐震基準」は、震度5程度の地震で倒れないことを主な目標としていました。大地震のあとの調査では、旧耐震の建物に大きな被害が多く見られたことが、基準見直しの背景になっています。',
            ],
          },
          {
            id: 'how-to-tell',
            heading: '築年数から見分けるときの注意',
            paragraphs: [
              '新耐震かどうかは、建物の完成日ではなく「建築確認」を受けた日で決まります。マンションは確認から完成まで1〜2年かかることが多いため、1981〜1983年ごろに完成した建物は、どちらの基準か書類で確かめる必要があります。',
              '当サイトの物件ページでは、完成年から目安を表示しています（1984年以降は新耐震、1981〜1983年は要確認、それ以前は旧耐震の可能性）。最終的な判断は、建築確認日がわかる書類で行います。',
            ],
            bullets: [
              '確認済証・検査済証、または役所で閲覧できる建築計画概要書で建築確認日を確認',
              '重要事項説明では、旧耐震の建物について耐震診断の有無と内容が説明される',
              '管理組合が保管する図面や修繕履歴もあわせて確認',
            ],
          },
          {
            id: 'old-standard',
            heading: '旧耐震の物件を検討するなら',
            paragraphs: [
              '旧耐震の建物でも、耐震診断を受けて基準を満たしている、または耐震改修工事を済ませている場合があります。管理組合が診断や改修を検討しているか、その費用を修繕積立金でまかなえるかも重要です。',
              '旧耐震の物件は価格が抑えめで、利回りが高く見えることがあります。その分、将来の改修費用、建て替えの議論、買い手が見つかりやすいかといった出口の条件も含めて比較しましょう。',
            ],
          },
          {
            id: 'loans-tax',
            heading: 'ローン・税金への影響',
            paragraphs: [
              '金融機関によっては、旧耐震の建物に対して融資期間を短くしたり、担保評価を低くしたりすることがあります。ローンを使う場合は、事前に金融機関の条件を確認してください。',
              '住宅ローン控除などの税の特例では、登記簿上の建築日付が1982年1月1日以降の住宅は新耐震基準に適合しているものとして扱われます。それより前の建物は、耐震基準適合証明書などで適合を示す必要があります。',
            ],
          },
          {
            id: 'checklist',
            heading: '契約前のチェックリスト',
            paragraphs: ['旧耐震・新耐震にかかわらず、次の点を確認しておくと安心です。'],
            bullets: [
              '建築確認日と、新耐震・旧耐震のどちらか',
              '耐震診断・耐震改修の実施状況と結果',
              '長期修繕計画と、大規模修繕の実施時期',
              '修繕積立金の残高と、今後の値上げ予定',
              '金融機関のローン条件（ローンを使う場合）',
            ],
          },
        ],
        faq: [
          { question: '旧耐震の物件は買わないほうがいいですか？', answer: '一律に避ける必要はありません。耐震診断・改修の状況、管理状態、価格、将来の修繕計画を比べて判断します。ローンや税の条件が変わる点は事前に確認してください。' },
          { question: '1982年完成のマンションは新耐震ですか？', answer: '完成年だけでは判断できません。1981年6月1日より前に建築確認を受けていれば旧耐震です。建築確認日を書類で確認してください。' },
          { question: '新耐震なら地震で被害を受けませんか？', answer: '新耐震は大地震で倒壊しないことを目標にした基準で、損傷がないことを保証するものではありません。地盤や管理状態、地域の危険度もあわせて確認しましょう。' },
        ],
        ctaTitle: '築年数・耐震基準から物件を比べる',
        ctaDescription: '物件ページでは築年からの耐震基準の目安を表示しています。気になる物件は資料請求で重要事項調査報告書なども確認できます。',
      },
      en: {
        category: 'Due diligence',
        title: "Japan's 1981 Earthquake Standard: How to Read a Building's Age",
        excerpt: 'What changed in June 1981, why the permit date matters more than the completion year, and what to check before buying an older Tokyo condominium.',
        seoDescription: "Japan's new (1981) and old earthquake standards explained for foreign buyers: how to tell them apart, what documents to check, and effects on loans and tax.",
        intro: 'Many resale condominiums in Tokyo are more than 40 years old. In a country with frequent earthquakes, the standard a building was designed to affects not only safety but also financing, tax relief and resale. This guide explains the rule of thumb from the building age and what to check before you sign.',
        keyTakeaways: [
          'The new earthquake standard applies to buildings whose permit was granted on or after 1 June 1981',
          'The permit date decides it, not the completion year; buildings completed 1981–83 need checking',
          'An older building can still be assessed and reinforced',
          'Older standards can affect loan terms and tax relief',
        ],
        sections: [
          {
            id: 'what-changed',
            heading: 'What changed in 1981',
            paragraphs: [
              'The Building Standards Act was revised in June 1981. Buildings designed to the new standard should suffer little damage in moderate earthquakes (around seismic intensity upper 5) and should not collapse in rare, severe ones (upper 6 to 7).',
              'The earlier standard mainly aimed to keep buildings standing in quakes of around intensity 5. Surveys after major earthquakes found heavy damage concentrated in buildings designed to the old standard, which is why the rules were tightened.',
            ],
          },
          {
            id: 'how-to-tell',
            heading: 'Reading the building age',
            paragraphs: [
              'Whether the new standard applies depends on the date the building permit (建築確認) was granted, not on when the building was finished. Condominiums often take one to two years to build, so buildings completed around 1981–1983 must be checked against documents.',
              'Our listing pages show a hint from the completion year: 1984 and later, new standard; 1981–1983, check the permit date; earlier, likely the old standard. The final answer comes from the permit documents.',
            ],
            bullets: [
              'The permit date is on the confirmation certificate or the building plan summary held by the ward office',
              'For older buildings, the formal disclosure before the contract states whether a seismic assessment was carried out and its result',
              'Drawings and repair records kept by the owners association help too',
            ],
          },
          {
            id: 'old-standard',
            heading: 'If you consider an older building',
            paragraphs: [
              'Some old-standard buildings have passed a seismic assessment or been reinforced. Ask whether the owners association has assessed the building or plans to, and whether the repair reserve can cover the work.',
              'Old-standard properties are often cheaper and can show higher yields. Weigh that against future reinforcement costs, possible redevelopment discussions and how easily you could sell later.',
            ],
          },
          {
            id: 'loans-tax',
            heading: 'Loans and tax',
            paragraphs: [
              'Some lenders shorten loan terms or lower the collateral value for old-standard buildings. If you will borrow, check the lender\'s conditions early.',
              'For tax relief such as the mortgage tax deduction, homes whose registered construction date is 1 January 1982 or later are treated as meeting the new standard. Earlier buildings need a certificate showing they comply.',
            ],
          },
          {
            id: 'checklist',
            heading: 'Checklist before you sign',
            paragraphs: ['Whatever the building age, these points are worth confirming.'],
            bullets: [
              'The permit date and which standard applies',
              'Any seismic assessment or reinforcement, and the results',
              'The long-term repair plan and when major repairs are due',
              'The repair reserve balance and planned increases',
              'Your lender\'s conditions, if you will borrow',
            ],
          },
        ],
        faq: [
          { question: 'Should I avoid old-standard buildings?', answer: 'Not automatically. Compare the assessment and reinforcement status, management, price and repair plans, and check how loans and tax relief are affected.' },
          { question: 'Is a condominium completed in 1982 built to the new standard?', answer: 'The completion year alone cannot tell you. If the permit was granted before 1 June 1981, it is old-standard. Check the permit date in the documents.' },
          { question: 'Does the new standard mean no earthquake damage?', answer: 'It aims to prevent collapse in a major earthquake; it does not guarantee no damage. Also look at ground conditions, maintenance and local hazard maps.' },
        ],
        ctaTitle: 'Compare properties by age and standard',
        ctaDescription: 'Listing pages show an earthquake-standard hint from the building age. Use “Get documents” to request the building management report for any property.',
      },
      'zh-TW': {
        category: '物件判讀',
        title: '日本新耐震與舊耐震怎麼分？1981年基準與中古公寓選購',
        excerpt: '整理1981年6月的新耐震基準、與屋齡的關係、檢討舊耐震物件時要確認的文件，以及對貸款與稅務的影響。',
        seoDescription: '說明日本新耐震（1981年6月）與舊耐震的差異、如何依屋齡判斷、確認建築許可日期的方法，以及對耐震診斷、貸款與稅務的影響。',
        intro: '在東京找中古公寓，常會看到屋齡40年以上的物件。在地震頻繁的日本，建物依哪一種耐震基準設計，不只關係安全，也影響貸款、稅務優惠與日後轉售。本文整理依屋齡判斷的方式，以及簽約前應確認的重點。',
        keyTakeaways: [
          '新耐震基準適用於1981年6月1日以後取得建築許可的建物',
          '判斷依據是建築許可日期而非完工年份，1981〜1983年完工者需確認',
          '舊耐震建物的評價會因耐震診斷與補強而不同',
          '舊耐震可能影響貸款條件與稅務優惠',
        ],
        sections: [
          {
            id: 'what-changed',
            heading: '1981年改變了什麼',
            paragraphs: [
              '1981年6月建築基準法修訂後的基準稱為「新耐震基準」，目標是在中度地震（約震度5強）時幾乎不受損，在罕見的大地震（約震度6強〜7）時不倒塌。',
              '之前的「舊耐震基準」主要目標是在約震度5的地震中不倒塌。大地震後的調查顯示，嚴重受損多集中在舊耐震建物，這也是基準修訂的背景。',
            ],
          },
          {
            id: 'how-to-tell',
            heading: '依屋齡判斷時的注意事項',
            paragraphs: [
              '是否為新耐震，取決於取得「建築確認」（建築許可）的日期，而不是完工日期。公寓從許可到完工常需1〜2年，因此1981〜1983年左右完工的建物，需要以文件確認。',
              '本站物件頁面會依完工年份顯示參考（1984年以後為新耐震、1981〜1983年需確認、更早可能為舊耐震）。最終仍以可確認建築許可日期的文件為準。',
            ],
            bullets: [
              '可從確認濟證、檢查濟證或區公所的建築計畫概要書確認許可日期',
              '舊耐震建物在重要事項說明中，會說明是否做過耐震診斷及其內容',
              '也可一併確認管理組合保存的圖面與修繕紀錄',
            ],
          },
          {
            id: 'old-standard',
            heading: '若考慮舊耐震物件',
            paragraphs: [
              '有些舊耐震建物已通過耐震診斷，或已完成耐震補強工程。也要確認管理組合是否在規劃診斷或補強，以及修繕公積金是否足以支應。',
              '舊耐震物件價格通常較低，投報率看起來較高。比較時也要納入未來補強費用、改建討論與日後是否容易轉售等出場條件。',
            ],
          },
          {
            id: 'loans-tax',
            heading: '對貸款與稅務的影響',
            paragraphs: [
              '部分金融機構會對舊耐震建物縮短貸款期間或降低擔保評價。使用貸款時，請事先確認金融機構的條件。',
              '在房貸減稅等稅務優惠上，登記簿上建築日期為1982年1月1日以後的住宅，視為符合新耐震基準；更早的建物需以耐震基準適合證明書等證明符合。',
            ],
          },
          {
            id: 'checklist',
            heading: '簽約前檢查清單',
            paragraphs: ['無論新舊耐震，建議確認以下事項。'],
            bullets: [
              '建築許可日期，以及屬於新耐震或舊耐震',
              '耐震診斷與補強的實施狀況與結果',
              '長期修繕計畫與大規模修繕時程',
              '修繕公積金餘額與未來調漲計畫',
              '金融機構的貸款條件（使用貸款時）',
            ],
          },
        ],
        faq: [
          { question: '舊耐震物件最好不要買嗎？', answer: '不必一概排除。請比較耐震診斷與補強狀況、管理情況、價格與未來修繕計畫，並事先確認對貸款與稅務的影響。' },
          { question: '1982年完工的公寓是新耐震嗎？', answer: '僅看完工年份無法判斷。若在1981年6月1日以前取得建築許可，就是舊耐震。請以文件確認許可日期。' },
          { question: '新耐震就不會受地震損害嗎？', answer: '新耐震的目標是大地震時不倒塌，並不保證完全不受損。也請一併確認地盤、管理狀況與地區危險度。' },
        ],
        ctaTitle: '依屋齡與耐震基準比較物件',
        ctaDescription: '物件頁面會依屋齡顯示耐震基準參考。對有興趣的物件，可透過「索取資料」取得重要事項調查報告書等文件。',
      },
      'zh-CN': {
        category: '房源判读',
        title: '日本新耐震与旧耐震怎么分？1981年标准与二手公寓选购',
        excerpt: '整理1981年6月的新耐震标准、与房龄的关系、考虑旧耐震房源时要确认的文件，以及对贷款与税务的影响。',
        seoDescription: '说明日本新耐震（1981年6月）与旧耐震的区别、如何按房龄判断、确认建筑许可日期的方法，以及对抗震诊断、贷款与税务的影响。',
        intro: '在东京找二手公寓，常会看到房龄40年以上的房源。在地震频繁的日本，建筑按哪种耐震标准设计，不仅关系安全，也影响贷款、税务优惠与日后转售。本文整理按房龄判断的方法，以及签约前应确认的要点。',
        keyTakeaways: [
          '新耐震标准适用于1981年6月1日以后取得建筑许可的建筑',
          '判断依据是建筑许可日期而非竣工年份，1981〜1983年竣工者需确认',
          '旧耐震建筑的评价会因抗震诊断与加固而不同',
          '旧耐震可能影响贷款条件与税务优惠',
        ],
        sections: [
          {
            id: 'what-changed',
            heading: '1981年改变了什么',
            paragraphs: [
              '1981年6月建筑基准法修订后的标准称为“新耐震标准”，目标是在中度地震（约震度5强）时几乎不受损，在罕见的大地震（约震度6强〜7）时不倒塌。',
              '之前的“旧耐震标准”主要目标是在约震度5的地震中不倒塌。大地震后的调查显示，严重受损多集中在旧耐震建筑，这也是标准修订的背景。',
            ],
          },
          {
            id: 'how-to-tell',
            heading: '按房龄判断时的注意事项',
            paragraphs: [
              '是否为新耐震，取决于取得“建筑确认”（建筑许可）的日期，而不是竣工日期。公寓从许可到竣工常需1〜2年，因此1981〜1983年前后竣工的建筑，需要用文件确认。',
              '本站房源页面会按竣工年份显示参考（1984年以后为新耐震、1981〜1983年需确认、更早可能为旧耐震）。最终仍以能确认建筑许可日期的文件为准。',
            ],
            bullets: [
              '可从确认济证、检查济证或区政府的建筑计划概要书确认许可日期',
              '旧耐震建筑在重要事项说明中，会说明是否做过抗震诊断及其内容',
              '也可一并确认管理组合保存的图纸与修缮记录',
            ],
          },
          {
            id: 'old-standard',
            heading: '如果考虑旧耐震房源',
            paragraphs: [
              '有些旧耐震建筑已通过抗震诊断，或已完成抗震加固工程。也要确认管理组合是否在规划诊断或加固，以及修缮基金是否足以支付。',
              '旧耐震房源价格通常较低，收益率看起来较高。比较时也要考虑未来加固费用、重建讨论以及日后是否容易转售等退出条件。',
            ],
          },
          {
            id: 'loans-tax',
            heading: '对贷款与税务的影响',
            paragraphs: [
              '部分金融机构会对旧耐震建筑缩短贷款期限或降低担保评估。使用贷款时，请事先确认金融机构的条件。',
              '在房贷减税等税务优惠上，登记簿上建筑日期为1982年1月1日以后的住宅，视为符合新耐震标准；更早的建筑需用耐震标准适合证明书等证明符合。',
            ],
          },
          {
            id: 'checklist',
            heading: '签约前检查清单',
            paragraphs: ['无论新旧耐震，建议确认以下事项。'],
            bullets: [
              '建筑许可日期，以及属于新耐震还是旧耐震',
              '抗震诊断与加固的实施情况与结果',
              '长期修缮计划与大规模修缮时间',
              '修缮基金余额与未来上调计划',
              '金融机构的贷款条件（使用贷款时）',
            ],
          },
        ],
        faq: [
          { question: '旧耐震房源最好不要买吗？', answer: '不必一概排除。请比较抗震诊断与加固情况、管理情况、价格与未来修缮计划，并事先确认对贷款与税务的影响。' },
          { question: '1982年竣工的公寓是新耐震吗？', answer: '仅看竣工年份无法判断。若在1981年6月1日以前取得建筑许可，就是旧耐震。请用文件确认许可日期。' },
          { question: '新耐震就不会受地震损害吗？', answer: '新耐震的目标是大地震时不倒塌，并不保证完全不受损。也请一并确认地基、管理情况与地区危险度。' },
        ],
        ctaTitle: '按房龄与耐震标准比较房源',
        ctaDescription: '房源页面会按房龄显示耐震标准参考。对感兴趣的房源，可通过“索取资料”获取重要事项调查报告书等文件。',
      },
    },
  },
  {
    slug: 'tokyo-condo-management-fee-repair-reserve',
    publishedAt: '2026-10-06',
    updatedAt: '2026-10-06',
    readMinutes: 6,
    tags: ['monthly costs', 'condominium', 'repair reserve'],
    locales: {
      ja: {
        category: '費用',
        title: '管理費と修繕積立金とは？中古マンションの毎月の費用と確認ポイント',
        excerpt: '管理費と修繕積立金の違い、国のガイドラインの目安、値上げや一時金、前所有者の滞納が引き継がれる点まで、購入前に知っておきたいことをまとめます。',
        seoDescription: 'マンションの管理費・修繕積立金の違い、国土交通省ガイドラインの目安、段階増額と一時金、滞納の引き継ぎ、重要事項調査報告書で確認する点を解説。',
        intro: 'マンションを買うと、ローンの返済とは別に、毎月「管理費」と「修繕積立金」を払います。どちらも建物の価値を保つための費用ですが、金額が安いほど良いとは限りません。購入前に確認したいポイントを整理します。',
        keyTakeaways: [
          '管理費は日常の管理、修繕積立金は将来の大規模修繕のための費用',
          '修繕積立金が低すぎると、将来の値上げや一時金の負担につながる',
          '前の所有者の滞納分は、買主に請求されることがある',
          '重要事項調査報告書と長期修繕計画で、残高と今後の予定を確認する',
        ],
        sections: [
          {
            id: 'difference',
            heading: '管理費と修繕積立金の違い',
            paragraphs: [
              '管理費は、共用部分の清掃、管理会社への委託費、共用部の電気代、エレベーターや設備の点検など、日々の管理に使われます。',
              '修繕積立金は、12〜15年ごとに行われることが多い大規模修繕（外壁、屋上防水、給排水管など）のために積み立てるお金です。マンション全体の口座で管理され、売却しても個人には戻りません。',
            ],
          },
          {
            id: 'guideline',
            heading: '金額の目安',
            paragraphs: [
              '国土交通省の「マンションの修繕積立金に関するガイドライン」は、建物の規模や階数ごとに、必要な積立額の目安を示しています。中小規模のマンションでは、専有面積1㎡あたり月300円前後が平均的な水準です。',
              'たとえば専有面積50㎡なら、修繕積立金は月1万5,000円前後が一つの目安になります。これより大きく下回る場合は、将来の値上げを前提にしている可能性があります。',
            ],
          },
          {
            id: 'increases',
            heading: '値上げと一時金に注意',
            paragraphs: [
              '新築時の積立額を低く設定し、数年ごとに段階的に上げていく「段階増額積立方式」のマンションは少なくありません。築年数がたつほど、修繕積立金が上がっていく前提で資金計画を立てましょう。',
              '積立金が不足すると、大規模修繕のときに一時金として数十万円単位の負担を求められることもあります。長期修繕計画と現在の残高を比べると、不足の有無がわかります。',
            ],
          },
          {
            id: 'arrears',
            heading: '前の所有者の滞納は引き継がれる',
            paragraphs: [
              '区分所有法では、管理費や修繕積立金の滞納分は、その部屋を買った人にも請求できるとされています。契約前に、売主の滞納がないこと、ある場合は決済時に精算されることを確認してください。',
              'マンション全体で滞納が多い場合は、管理組合の運営状態にも注意が必要です。',
            ],
          },
          {
            id: 'documents',
            heading: '購入前に確認する書類',
            paragraphs: ['管理会社が作成する「重要事項調査報告書」と、管理組合の「長期修繕計画」で、次の点を確認しましょう。'],
            bullets: [
              '管理費・修繕積立金の月額と、今後の値上げ予定',
              '修繕積立金の残高と、借入金の有無',
              'マンション全体と対象住戸の滞納状況',
              '前回の大規模修繕の時期と、次回の予定',
              'ペット・民泊・リフォームなど管理規約の制限',
            ],
          },
        ],
        faq: [
          { question: '管理費や修繕積立金は住宅ローンに含められますか？', answer: '含められません。毎月、ローンの返済とは別に支払います。当サイトの返済シミュレーションでは、物件情報に記載がある場合に合計額を表示しています。' },
          { question: '修繕積立金が安い物件はお得ですか？', answer: '必ずしもそうではありません。将来の値上げや一時金の負担が大きくなることがあります。長期修繕計画と残高を確認してください。' },
          { question: '賃貸に出した場合は誰が払いますか？', answer: '所有者が払います。賃料から差し引いて考えるため、実質利回りの計算に含めます。' },
        ],
        ctaTitle: '毎月の費用も含めて物件を比べる',
        ctaDescription: '物件ページでは、記載のある管理費・修繕積立金と、ローン返済を合わせた毎月の支払い額を確認できます。',
      },
      en: {
        category: 'Costs',
        title: 'Management Fee and Repair Reserve: Monthly Costs of a Tokyo Condo',
        excerpt: 'How the two monthly fees differ, the national guideline for repair reserves, staged increases and one-off levies, and why unpaid fees can pass to the buyer.',
        seoDescription: 'Tokyo condominium management fees and repair reserve funds explained for foreign buyers: guideline amounts, increases, special levies, arrears and documents to check.',
        intro: 'When you own a Japanese condominium you pay two monthly fees on top of any loan: the management fee and the repair reserve. Both protect the building\'s value, and the cheapest is not always the best. Here is what to check before buying.',
        keyTakeaways: [
          'The management fee pays for day-to-day running; the repair reserve funds future major repairs',
          'A repair reserve that is too low usually means increases or one-off levies later',
          'Unpaid fees left by the previous owner can be claimed from the buyer',
          'The building management report and long-term repair plan show the balance and plans',
        ],
        sections: [
          {
            id: 'difference',
            heading: 'Two different fees',
            paragraphs: [
              'The management fee covers cleaning of common areas, the management company, common-area electricity, and lift and equipment inspections.',
              'The repair reserve is saved for major repairs, usually every 12 to 15 years: exterior walls, roof waterproofing, water and drain pipes. It belongs to the owners association, so it is not refunded when you sell.',
            ],
          },
          {
            id: 'guideline',
            heading: 'How much is typical',
            paragraphs: [
              'The Ministry of Land, Infrastructure, Transport and Tourism publishes a guideline on repair reserves, with reference amounts by building size and height. For small and mid-sized condominiums the average is around ¥300 per m² of floor area per month.',
              'For a 50 m² unit that suggests a repair reserve of about ¥15,000 a month. A figure far below that often assumes increases later.',
            ],
          },
          {
            id: 'increases',
            heading: 'Increases and one-off levies',
            paragraphs: [
              'Many buildings start with a low reserve and raise it in steps every few years. Plan your budget assuming the reserve will rise as the building ages.',
              'If the fund falls short, owners may be asked for a one-off levy, sometimes several hundred thousand yen, when major repairs are due. Comparing the long-term repair plan with the current balance shows whether there is a gap.',
            ],
          },
          {
            id: 'arrears',
            heading: "Unpaid fees pass to the buyer",
            paragraphs: [
              'Under the Act on Building Unit Ownership, the association can claim unpaid management fees and repair reserve from whoever buys the unit. Before the contract, confirm the seller has no arrears, or that any arrears will be settled at closing.',
              'If many owners in the building are in arrears, look carefully at how the association is run.',
            ],
          },
          {
            id: 'documents',
            heading: 'Documents to check',
            paragraphs: ["The management company's building management report (重要事項調査報告書) and the association's long-term repair plan should show:"],
            bullets: [
              'Monthly management fee and repair reserve, and planned increases',
              'Repair reserve balance and any association loans',
              'Arrears for the building and for the unit',
              'When major repairs were last done and are next planned',
              'Bylaw restrictions on pets, short-term rentals and renovation',
            ],
          },
        ],
        faq: [
          { question: 'Can the fees be included in a mortgage?', answer: 'No. You pay them every month on top of the loan. Our loan simulator shows the combined monthly total when the listing states the fees.' },
          { question: 'Is a low repair reserve a good deal?', answer: 'Not necessarily. It can mean larger increases or one-off levies later. Check the repair plan and the balance.' },
          { question: 'Who pays if I rent the unit out?', answer: 'The owner pays. Deduct the fees from the rent when you work out the net yield.' },
        ],
        ctaTitle: 'Compare properties including monthly costs',
        ctaDescription: 'Listing pages show the stated management fee and repair reserve together with the estimated loan repayment.',
      },
      'zh-TW': {
        category: '費用',
        title: '管理費與修繕公積金是什麼？中古公寓每月費用與確認重點',
        excerpt: '整理管理費與修繕公積金的差異、國家指引的參考金額、調漲與一次性費用，以及前屋主欠繳會由買方承接等購買前須知。',
        seoDescription: '說明日本公寓管理費與修繕公積金的差異、國土交通省指引的參考金額、分段調漲與一次性費用、欠繳承接，以及重要事項調查報告書的確認重點。',
        intro: '在日本買公寓，除了房貸之外，每月還要繳「管理費」與「修繕公積金」。兩者都是維持建物價值的費用，但不是越便宜越好。以下整理購買前應確認的重點。',
        keyTakeaways: [
          '管理費用於日常管理，修繕公積金用於未來的大規模修繕',
          '修繕公積金過低，未來可能調漲或收取一次性費用',
          '前屋主欠繳的費用，可能向買方請求',
          '透過重要事項調查報告書與長期修繕計畫確認餘額與未來計畫',
        ],
        sections: [
          {
            id: 'difference',
            heading: '管理費與修繕公積金的差異',
            paragraphs: [
              '管理費用於公共區域清潔、管理公司委託費、公共區域電費、電梯與設備檢查等日常管理。',
              '修繕公積金是為了通常每12〜15年進行一次的大規模修繕（外牆、屋頂防水、給排水管等）而累積的資金，由管理組合統一管理，出售時不會退還給個人。',
            ],
          },
          {
            id: 'guideline',
            heading: '金額參考',
            paragraphs: [
              '國土交通省的「公寓修繕公積金指引」依建物規模與樓層數提供所需金額的參考。中小規模公寓的平均水準約為每平方公尺每月300日圓左右。',
              '例如專有面積50平方公尺，修繕公積金約每月1萬5,000日圓左右可作為參考。若明顯低於此水準，可能是以未來調漲為前提。',
            ],
          },
          {
            id: 'increases',
            heading: '注意調漲與一次性費用',
            paragraphs: [
              '不少公寓在新建時設定較低金額，之後每隔幾年分段調漲。屋齡越高，越要以修繕公積金會上漲為前提規劃資金。',
              '若公積金不足，大規模修繕時可能要求一次性負擔數十萬日圓。比較長期修繕計畫與目前餘額，可看出是否有不足。',
            ],
          },
          {
            id: 'arrears',
            heading: '前屋主的欠繳會被承接',
            paragraphs: [
              '依區分所有法，管理費與修繕公積金的欠繳可以向購買該戶的人請求。簽約前請確認賣方沒有欠繳，若有則於交割時結清。',
              '若整棟公寓欠繳者多，也需注意管理組合的運作狀況。',
            ],
          },
          {
            id: 'documents',
            heading: '購買前要確認的文件',
            paragraphs: ['請透過管理公司製作的「重要事項調查報告書」與管理組合的「長期修繕計畫」確認以下事項。'],
            bullets: [
              '管理費與修繕公積金月額，以及未來調漲計畫',
              '修繕公積金餘額與是否有借款',
              '整棟與該戶的欠繳狀況',
              '上次大規模修繕時間與下次預定',
              '寵物、民宿、裝修等管理規約限制',
            ],
          },
        ],
        faq: [
          { question: '管理費與修繕公積金可以算入房貸嗎？', answer: '不行，需在房貸之外每月另行支付。本站的還款試算在物件資訊有記載時，會顯示合計金額。' },
          { question: '修繕公積金便宜的物件比較划算嗎？', answer: '不一定，未來可能大幅調漲或需負擔一次性費用。請確認長期修繕計畫與餘額。' },
          { question: '出租時由誰支付？', answer: '由所有人支付。計算實質投報率時，請從租金中扣除。' },
        ],
        ctaTitle: '連同每月費用比較物件',
        ctaDescription: '物件頁面可查看有記載的管理費、修繕公積金與房貸還款合計的每月支出。',
      },
      'zh-CN': {
        category: '费用',
        title: '管理费与修缮基金是什么？二手公寓每月费用与确认要点',
        excerpt: '整理管理费与修缮基金的区别、国家指引的参考金额、上调与一次性费用，以及前业主欠缴会由买方承担等购买前须知。',
        seoDescription: '说明日本公寓管理费与修缮基金的区别、国土交通省指引的参考金额、分段上调与一次性费用、欠缴承担，以及重要事项调查报告书的确认要点。',
        intro: '在日本买公寓，除了房贷之外，每月还要缴“管理费”和“修缮基金”。两者都是维持建筑价值的费用，但并非越便宜越好。以下整理购买前应确认的要点。',
        keyTakeaways: [
          '管理费用于日常管理，修缮基金用于未来的大规模修缮',
          '修缮基金过低，未来可能上调或收取一次性费用',
          '前业主欠缴的费用，可能向买方追讨',
          '通过重要事项调查报告书与长期修缮计划确认余额与未来计划',
        ],
        sections: [
          {
            id: 'difference',
            heading: '管理费与修缮基金的区别',
            paragraphs: [
              '管理费用于公共区域清洁、管理公司委托费、公共区域电费、电梯与设备检查等日常管理。',
              '修缮基金是为了通常每12〜15年进行一次的大规模修缮（外墙、屋顶防水、给排水管等）而积累的资金，由管理组合统一管理，出售时不会退还给个人。',
            ],
          },
          {
            id: 'guideline',
            heading: '金额参考',
            paragraphs: [
              '国土交通省的“公寓修缮基金指引”按建筑规模与楼层数给出所需金额的参考。中小规模公寓的平均水平约为每平方米每月300日元左右。',
              '例如专有面积50平方米，修缮基金约每月1万5,000日元左右可作为参考。若明显低于此水平，可能是以未来上调为前提。',
            ],
          },
          {
            id: 'increases',
            heading: '注意上调与一次性费用',
            paragraphs: [
              '不少公寓在新建时设定较低金额，之后每隔几年分段上调。房龄越高，越要以修缮基金会上涨为前提规划资金。',
              '若基金不足，大规模修缮时可能要求一次性负担数十万日元。比较长期修缮计划与当前余额，可以看出是否存在缺口。',
            ],
          },
          {
            id: 'arrears',
            heading: '前业主的欠缴会被承担',
            paragraphs: [
              '根据区分所有法，管理费与修缮基金的欠缴可以向购买该户的人追讨。签约前请确认卖方没有欠缴，如有则在交割时结清。',
              '若整栋公寓欠缴者多，也需注意管理组合的运作情况。',
            ],
          },
          {
            id: 'documents',
            heading: '购买前要确认的文件',
            paragraphs: ['请通过管理公司制作的“重要事项调查报告书”与管理组合的“长期修缮计划”确认以下事项。'],
            bullets: [
              '管理费与修缮基金月额，以及未来上调计划',
              '修缮基金余额与是否有借款',
              '整栋与该户的欠缴情况',
              '上次大规模修缮时间与下次计划',
              '宠物、民宿、装修等管理规约限制',
            ],
          },
        ],
        faq: [
          { question: '管理费与修缮基金可以算入房贷吗？', answer: '不可以，需在房贷之外每月另行支付。本站的还款试算在房源信息有记载时，会显示合计金额。' },
          { question: '修缮基金便宜的房源更划算吗？', answer: '不一定，未来可能大幅上调或需负担一次性费用。请确认长期修缮计划与余额。' },
          { question: '出租时由谁支付？', answer: '由业主支付。计算实际收益率时，请从租金中扣除。' },
        ],
        ctaTitle: '连同每月费用比较房源',
        ctaDescription: '房源页面可查看有记载的管理费、修缮基金与房贷还款合计的每月支出。',
      },
    },
  },
]
