import type { GuideArticle } from './guides'

/** Second set of buyer guides from the competitor review: visas and letting from overseas. */
export const extraGuideArticles2: GuideArticle[] = [
  {
    slug: 'buying-property-japan-visa',
    publishedAt: '2026-10-06',
    updatedAt: '2026-10-07',
    readMinutes: 5,
    tags: ['visa', 'foreign buyer', 'residency'],
    locales: {
      ja: {
        category: '外国人の購入',
        title: '日本で不動産を買うとビザはもらえる？外国人の購入と在留資格',
        excerpt: '外国人は国籍や在留資格に関係なく日本の不動産を買えます。一方で、不動産を持っても在留資格は得られません。購入に必要な書類と、住むための在留資格の考え方を整理します。',
        seoDescription: '外国人が日本で不動産を買う条件、不動産購入とビザ（在留資格）の関係、海外在住者の必要書類、経営・管理ビザとの違いを解説。',
        intro: '海外のお客様からよくいただく質問が「東京で家を買えば日本に住めるか」です。答えは、購入はできても、それだけでは在留資格は得られない、です。購入と在留資格を分けて考えると、計画が立てやすくなります。',
        keyTakeaways: [
          '外国人でも、日本に住んでいなくても不動産を購入できる',
          '不動産を所有しても在留資格（ビザ）は得られない',
          '海外在住者は、印鑑証明の代わりにサイン証明などで手続きする',
          '日本に住むには、仕事・家族・事業など別の理由による在留資格が必要',
        ],
        sections: [
          {
            id: 'can-buy',
            heading: '外国人も日本の不動産を買える',
            paragraphs: [
              '日本には、外国人が土地や建物を所有することを一般的に禁止する法律はありません。日本に住んでいない方でも、日本人と同じように売買契約を結び、所有権を登記できます。',
              '住宅ローンを使う場合は別で、多くの金融機関が日本の在留資格や日本での収入を条件にしています。海外在住の方は現金購入が一般的です。',
            ],
          },
          {
            id: 'no-visa',
            heading: '不動産を持ってもビザは出ない',
            paragraphs: [
              '日本には、一定額の不動産を買うと在留資格が得られる「投資ビザ」の制度はありません。在留資格は、日本で何をするか（働く、家族と暮らす、事業を経営するなど）で決まります。',
              '短期滞在が認められる国・地域の方は、観光などの目的で滞在する間、購入した住まいを利用できます。長く住む場合は、目的に合った在留資格を別に取得する必要があります。',
            ],
          },
          {
            id: 'business-manager',
            heading: '「経営・管理」の在留資格との違い',
            paragraphs: [
              '日本で会社を設立して事業を行う方には「経営・管理」の在留資格がありますが、事業の実態や資本金などの要件があり、不動産を買うだけでは対象になりません。要件は2025年に厳しくなっているため、最新の条件は出入国在留管理庁や専門家に確認してください。',
            ],
          },
          {
            id: 'documents',
            heading: '海外在住者の購入手続きと書類',
            paragraphs: ['海外にお住まいの方は、日本の住民票や印鑑証明がないため、代わりの書類を用意します。'],
            bullets: [
              'パスポートなどの本人確認書類',
              '居住国での住所を証明する書類（宣誓供述書など）',
              '印鑑証明の代わりのサイン証明（居住国の公証人や日本の在外公館で取得）',
              '購入資金の出どころがわかる書類と、送金の準備',
              '日本での連絡先や、税金の手続きを任せる納税管理人',
            ],
          },
          {
            id: 'reporting',
            heading: '購入後の届出',
            paragraphs: [
              '非居住者が日本の不動産を取得した場合、外国為替及び外国貿易法にもとづき、取得後20日以内に日本銀行経由で財務大臣へ報告します。2026年4月1日以降の取得は、自分が住むための購入でも不動産そのものの報告が必要です。不動産会社など日本の居住者が代理で提出できます（くわしくは「外為法の報告」のガイドへ）。',
            ],
          },
        ],
        faq: [
          { question: '観光ビザで来日して契約できますか？', answer: '契約や決済の手続き自体はできます。書類の郵送や代理人の利用で、来日せずに進めることもできます。' },
          { question: '不動産を買えば永住権に有利になりますか？', answer: '不動産の所有は在留資格や永住許可の要件ではありません。仕事や家族など、在留の目的にもとづいて審査されます。' },
          { question: '法人で買えばビザが取れますか？', answer: '法人で購入しても、それだけでは在留資格は得られません。経営・管理の在留資格には、実際の事業や資本金などの要件があります。' },
        ],
        ctaTitle: '海外からの購入を相談する',
        ctaDescription: '必要書類や送金、管理の進め方は物件ごとに変わります。気になる物件があれば、登録なしでご相談ください。',
      },
      en: {
        category: 'Foreign buyers',
        title: 'Does Buying Property in Japan Get You a Visa? Ownership vs Residency',
        excerpt: 'Foreigners can buy property in Japan regardless of nationality or residency, but owning property does not give you a visa. What you need to buy, and how residence status really works.',
        seoDescription: 'Can foreigners buy property in Japan, and does it give a visa? Ownership rules, documents for overseas buyers, and how the Business Manager visa differs.',
        intro: 'One of the most common questions from overseas buyers is whether buying a home in Tokyo lets them live in Japan. You can buy, but ownership alone does not give you residence status. Treating the purchase and the visa as separate plans makes both easier.',
        keyTakeaways: [
          'Foreigners can buy property in Japan, even without living there',
          'Owning property does not give you a visa or residence status',
          'Overseas buyers use a signature certificate instead of a registered seal certificate',
          'Living in Japan needs a residence status based on work, family or business',
        ],
        sections: [
          {
            id: 'can-buy',
            heading: 'Foreigners can buy',
            paragraphs: [
              'Japan has no general law stopping foreigners from owning land or buildings. Non-residents can sign a sale contract and register ownership in the same way as Japanese buyers.',
              'Mortgages are different: most Japanese lenders require residence status in Japan or income here. Buyers living abroad usually pay cash.',
            ],
          },
          {
            id: 'no-visa',
            heading: 'Property does not come with a visa',
            paragraphs: [
              'Japan has no investor or "golden" visa granted for buying property. Residence status depends on what you do in Japan: work, family, running a business and so on.',
              'Visitors from visa-exempt countries can use their home during short stays for tourism and similar purposes. To live here longer you need a residence status that fits your purpose.',
            ],
          },
          {
            id: 'business-manager',
            heading: 'How the Business Manager status differs',
            paragraphs: [
              'People who establish and run a business in Japan can apply for the Business Manager residence status, but it requires a real business and minimum capital, and buying property alone does not qualify. The requirements were tightened in 2025, so confirm the current rules with the Immigration Services Agency or a specialist.',
            ],
          },
          {
            id: 'documents',
            heading: 'Documents for buyers living abroad',
            paragraphs: ['Without a Japanese resident record or registered seal, overseas buyers prepare alternatives.'],
            bullets: [
              'Passport or other identification',
              'Proof of address in your country, such as a sworn statement',
              'A signature certificate from a notary or a Japanese embassy or consulate, in place of a seal certificate',
              'Evidence of the source of funds and plans for the transfer',
              'A contact in Japan and a tax representative for tax matters',
            ],
          },
          {
            id: 'reporting',
            heading: 'Reporting after the purchase',
            paragraphs: [
              'A non-resident who acquires Japanese real estate reports it under the Foreign Exchange and Foreign Trade Act, via the Bank of Japan to the Minister of Finance, within 20 days. For acquisitions from 1 April 2026 the property itself must be reported even when bought to live in. A Japanese resident such as your real estate agent can file it (see our guide on the Foreign Exchange Act report).',
            ],
          },
        ],
        faq: [
          { question: 'Can I sign the contract on a tourist visit?', answer: 'Yes, the contract and closing can be done. Documents can also be sent by post or handled through an agent so you do not need to travel.' },
          { question: 'Does owning property help with permanent residency?', answer: 'Property ownership is not a requirement for residence status or permanent residency. Applications are judged on the purpose of your stay, such as work or family.' },
          { question: 'Do I get a visa if I buy through a company?', answer: 'Not by buying alone. The Business Manager status requires an actual business and minimum capital, among other conditions.' },
        ],
        ctaTitle: 'Talk to us about buying from overseas',
        ctaDescription: 'Documents, transfers and management differ by property. Ask about any listing without signing up.',
      },
      'zh-TW': {
        category: '外國人購屋',
        title: '在日本買房能拿到簽證嗎？外國人購屋與在留資格',
        excerpt: '外國人不論國籍或在留資格都可以購買日本不動產，但持有不動產並不會取得簽證。整理購買所需文件與居住所需在留資格的觀念。',
        seoDescription: '說明外國人在日本購屋的條件、購屋與簽證（在留資格）的關係、海外居住者所需文件，以及與經營・管理簽證的差異。',
        intro: '海外客戶最常問的問題之一是「在東京買房就能住在日本嗎？」答案是：可以購買，但光是購買無法取得在留資格。把購屋與簽證分開規劃，會更容易推進。',
        keyTakeaways: [
          '外國人即使不住在日本，也可以購買不動產',
          '持有不動產不會取得在留資格（簽證）',
          '海外居住者以簽名證明等文件取代印鑑證明',
          '要在日本居住，需要基於工作、家庭、事業等其他理由的在留資格',
        ],
        sections: [
          {
            id: 'can-buy',
            heading: '外國人也可以買日本不動產',
            paragraphs: [
              '日本沒有一般性禁止外國人持有土地或建物的法律。不住在日本的人也能與日本人一樣簽訂買賣契約並登記所有權。',
              '使用房貸則不同，多數金融機構以日本的在留資格或在日收入為條件。居住海外者一般以現金購買。',
            ],
          },
          {
            id: 'no-visa',
            heading: '持有不動產不會核發簽證',
            paragraphs: [
              '日本沒有「購買一定金額不動產即可取得在留資格」的投資簽證制度。在留資格取決於在日本做什麼，例如工作、與家人同住、經營事業等。',
              '可免簽短期停留的國家或地區人士，在觀光等目的停留期間可以使用自己購買的住所。若要長期居住，需另外取得符合目的的在留資格。',
            ],
          },
          {
            id: 'business-manager',
            heading: '與「經營・管理」在留資格的差異',
            paragraphs: [
              '在日本設立公司並經營事業者可申請「經營・管理」在留資格，但有事業實體與資本額等要件，只是購買不動產並不符合。相關要件已於2025年趨嚴，最新條件請向出入國在留管理廳或專家確認。',
            ],
          },
          {
            id: 'documents',
            heading: '海外居住者的購屋手續與文件',
            paragraphs: ['海外居住者沒有日本的住民票與印鑑證明，需準備替代文件。'],
            bullets: [
              '護照等身分證明文件',
              '居住國住址的證明文件（如宣誓供述書）',
              '取代印鑑證明的簽名證明（向居住國公證人或日本駐外館處申請）',
              '可說明購屋資金來源的文件與匯款準備',
              '在日本的聯絡窗口，以及處理稅務的納稅管理人',
            ],
          },
          {
            id: 'reporting',
            heading: '購買後的申報',
            paragraphs: [
              '非居住者取得日本不動產後，須依《外匯及外國貿易法》在20天內經日本銀行向財務大臣報告。2026年4月1日以後取得者，即使是自住用途，不動產本身也須報告。可由不動產公司等日本居住者代為提出（詳見「外匯法報告」指南）。',
            ],
          },
        ],
        faq: [
          { question: '持觀光簽證來日本可以簽約嗎？', answer: '可以辦理簽約與交割。也可透過郵寄文件或委託代理人，不必親自來日本。' },
          { question: '買房對申請永住有幫助嗎？', answer: '持有不動產並非在留資格或永住許可的要件，審查依工作、家庭等停留目的進行。' },
          { question: '用公司名義購買可以拿到簽證嗎？', answer: '僅購買不動產並不能取得。經營・管理在留資格需要實際的事業與資本額等條件。' },
        ],
        ctaTitle: '諮詢從海外購屋',
        ctaDescription: '所需文件、匯款與管理方式依物件而異。對有興趣的物件，歡迎免註冊諮詢。',
      },
      'zh-CN': {
        category: '外国人购房',
        title: '在日本买房能拿到签证吗？外国人购房与在留资格',
        excerpt: '外国人不论国籍或在留资格都可以购买日本房产，但持有房产并不会获得签证。整理购买所需文件与居住所需在留资格的思路。',
        seoDescription: '说明外国人在日本购房的条件、购房与签证（在留资格）的关系、海外居住者所需文件，以及与经营・管理签证的区别。',
        intro: '海外客户最常问的问题之一是“在东京买房就能住在日本吗？”答案是：可以购买，但仅凭购买无法获得在留资格。把购房与签证分开规划，会更容易推进。',
        keyTakeaways: [
          '外国人即使不住在日本，也可以购买房产',
          '持有房产不会获得在留资格（签证）',
          '海外居住者用签名证明等文件代替印鉴证明',
          '要在日本居住，需要基于工作、家庭、事业等其他理由的在留资格',
        ],
        sections: [
          {
            id: 'can-buy',
            heading: '外国人也可以买日本房产',
            paragraphs: [
              '日本没有一般性禁止外国人持有土地或建筑的法律。不住在日本的人也能和日本人一样签订买卖合同并登记所有权。',
              '使用房贷则不同，多数金融机构以日本的在留资格或在日收入为条件。居住海外者一般全款购买。',
            ],
          },
          {
            id: 'no-visa',
            heading: '持有房产不会签发签证',
            paragraphs: [
              '日本没有“购买一定金额房产即可获得在留资格”的投资签证制度。在留资格取决于在日本做什么，例如工作、与家人同住、经营事业等。',
              '可免签短期停留的国家或地区人士，在旅游等目的停留期间可以使用自己购买的住所。若要长期居住，需要另外取得符合目的的在留资格。',
            ],
          },
          {
            id: 'business-manager',
            heading: '与“经营・管理”在留资格的区别',
            paragraphs: [
              '在日本设立公司并经营事业者可申请“经营・管理”在留资格，但有事业实体与注册资本等要求，仅购买房产并不符合。相关要求已于2025年收紧，最新条件请向出入国在留管理厅或专业人士确认。',
            ],
          },
          {
            id: 'documents',
            heading: '海外居住者的购房手续与文件',
            paragraphs: ['海外居住者没有日本的住民票与印鉴证明，需要准备替代文件。'],
            bullets: [
              '护照等身份证明文件',
              '居住国住址的证明文件（如宣誓供述书）',
              '代替印鉴证明的签名证明（向居住国公证人或日本驻外使领馆申请）',
              '能说明购房资金来源的文件与汇款准备',
              '在日本的联络人，以及处理税务的纳税管理人',
            ],
          },
          {
            id: 'reporting',
            heading: '购买后的申报',
            paragraphs: [
              '非居住者取得日本房产后，须依据《外汇及外国贸易法》在20天内经日本银行向财务大臣报告。2026年4月1日以后取得的，即使是自住用途，房产本身也须报告。可由房产中介等日本居住者代为提交（详见“外汇法报告”指南）。',
            ],
          },
        ],
        faq: [
          { question: '持旅游签证来日本可以签约吗？', answer: '可以办理签约与交割。也可以通过邮寄文件或委托代理人，不必亲自来日本。' },
          { question: '买房对申请永住有帮助吗？', answer: '持有房产不是在留资格或永住许可的要件，审核依据工作、家庭等停留目的进行。' },
          { question: '用公司名义购买可以拿到签证吗？', answer: '仅购买房产并不能获得。经营・管理在留资格需要实际的事业与注册资本等条件。' },
        ],
        ctaTitle: '咨询从海外购房',
        ctaDescription: '所需文件、汇款与管理方式因房源而异。对感兴趣的房源，欢迎免注册咨询。',
      },
    },
  },
  {
    slug: 'renting-out-tokyo-condo-from-overseas',
    publishedAt: '2026-10-06',
    updatedAt: '2026-10-06',
    readMinutes: 6,
    tags: ['rental', 'investment', 'property management'],
    locales: {
      ja: {
        category: '運用',
        title: '海外から東京のマンションを貸すには？管理方法・契約・税金の基本',
        excerpt: '管理委託とサブリースの違い、普通借家と定期借家、毎月かかる費用、海外在住オーナーの源泉徴収と確定申告まで、賃貸運用の基本をまとめます。',
        seoDescription: '海外在住のオーナーが東京のマンションを賃貸に出す方法。管理委託とサブリース、普通借家と定期借家、費用、非居住者の源泉徴収20.42%と確定申告を解説。',
        intro: '東京の中古マンションは、賃貸中のまま買う「オーナーチェンジ」や、購入後に貸し出す使い方が多く見られます。海外に住みながら貸す場合は、管理会社の選び方と税金の手続きが特に大切です。',
        keyTakeaways: [
          '管理は「管理委託」と「サブリース」の2つが中心',
          '日本の普通借家契約は借主の保護が強い。期間を決めて貸すなら定期借家',
          '管理費・修繕積立金、固定資産税、空室、入替え費用を見込んで利回りを考える',
          '非居住者に家賃を払う法人などは20.42%を源泉徴収し、オーナーは日本で確定申告する',
        ],
        sections: [
          {
            id: 'management',
            heading: '管理委託とサブリース',
            paragraphs: [
              '管理委託は、入居者募集、家賃の回収、トラブル対応などを管理会社に任せる方法です。手数料は家賃の5%前後が多く、空室のリスクはオーナーが負います。',
              'サブリースは、管理会社が部屋を借り上げて転貸する方法です。空室でも一定の賃料を受け取れますが、受け取る賃料は相場より低めで、見直しや解約の条件に注意が必要です。',
            ],
          },
          {
            id: 'lease-types',
            heading: '普通借家と定期借家',
            paragraphs: [
              '日本の普通借家契約では、借主の保護が強く、オーナー側から契約を終えるには正当な理由が必要です。将来自分で住む予定がある場合や、売却時期を決めたい場合は、期間満了で終わる定期借家契約が向いています。',
              '賃貸中の物件を買う場合は、今の賃貸契約と敷金の返還義務をそのまま引き継ぎます。契約書の内容、賃料の滞納、契約期間を確認しましょう。',
            ],
          },
          {
            id: 'costs',
            heading: '賃貸中にかかる費用',
            paragraphs: ['家賃収入から、次の費用を差し引いて手取りを考えます。'],
            bullets: [
              '管理費・修繕積立金（オーナー負担）',
              '管理会社への手数料',
              '固定資産税・都市計画税、火災保険',
              '入居者の入替え時の募集費用・原状回復費用',
              '空室期間の家賃収入の減少',
            ],
          },
          {
            id: 'tax',
            heading: '海外在住オーナーの税金',
            paragraphs: [
              '非居住者のオーナーに家賃を払う法人や事業者は、原則として家賃の20.42%を源泉徴収して納めます（個人が自分で住むために借りている場合は不要）。',
              '日本の不動産所得は日本で確定申告が必要で、源泉徴収された税金は申告で精算されます。日本に住所がない場合は、税務署とのやりとりを任せる納税管理人を届け出ます。',
            ],
          },
          {
            id: 'remittance',
            heading: '家賃の受け取りと報告',
            paragraphs: [
              '家賃は管理会社がまとめて受け取り、手数料などを差し引いて日本の口座や海外の口座に送金するのが一般的です。毎月の収支報告書や、英語・中国語での対応が可能かも、管理会社選びのポイントです。',
            ],
          },
        ],
        faq: [
          { question: '家賃の相場はどう調べますか？', answer: '同じエリア・広さ・築年数の募集賃料を比べます。物件ページでは賃貸中の物件の現在の賃料と表面・実質利回りを表示しています。' },
          { question: '民泊として貸せますか？', answer: '多くのマンションは管理規約で民泊を禁止しています。購入前に管理規約と区の条例を確認してください。' },
          { question: '入居者が退去したら何が必要ですか？', answer: '原状回復工事と次の入居者の募集が必要です。費用と空室期間を見込んでおきましょう。' },
        ],
        ctaTitle: '賃貸中の物件を探す',
        ctaDescription: '物件ページでは、賃貸中の物件の賃料、管理費等を差し引いた実質利回り、月々の収支を確認できます。',
      },
      en: {
        category: 'Owning',
        title: 'Renting Out a Tokyo Condo From Overseas: Management, Leases and Tax',
        excerpt: 'Management contracts vs master leases, ordinary vs fixed-term leases, running costs, and the 20.42% withholding and tax return for non-resident owners.',
        seoDescription: 'How overseas owners rent out a Tokyo condominium: management contract or sublease, ordinary or fixed-term lease, costs, 20.42% non-resident withholding and tax returns.',
        intro: 'Many Tokyo resale condominiums are bought with a tenant in place or let out after purchase. If you will own from abroad, choosing the management company and handling tax correctly matter most.',
        keyTakeaways: [
          'The two main options are a management contract and a master lease (sublease)',
          'Ordinary leases strongly protect tenants; a fixed-term lease ends on a set date',
          'Allow for building fees, property tax, vacancies and re-letting costs',
          'Companies paying rent to non-residents withhold 20.42%, and owners file a Japanese tax return',
        ],
        sections: [
          {
            id: 'management',
            heading: 'Management contract or master lease',
            paragraphs: [
              'Under a management contract, a company finds tenants, collects rent and handles issues for you, usually for around 5% of the rent. You carry the vacancy risk.',
              'Under a master lease (sublease), the company rents the unit from you and sublets it. You receive a set rent even when it is empty, but it is below market, and the terms for rent reviews and ending the contract need care.',
            ],
          },
          {
            id: 'lease-types',
            heading: 'Ordinary and fixed-term leases',
            paragraphs: [
              'Ordinary leases in Japan strongly protect tenants; a landlord needs just cause to end one. If you may live in the unit later or want to sell at a set time, a fixed-term lease that ends on its expiry date is more suitable.',
              'If you buy a unit that is already let, you take over the lease and the duty to return the deposit. Check the lease terms, any rent arrears and the lease period.',
            ],
          },
          {
            id: 'costs',
            heading: 'Running costs',
            paragraphs: ['Deduct these from the rent to see what you actually keep.'],
            bullets: [
              'Management fee and repair reserve (paid by the owner)',
              'The management company\'s fee',
              'Fixed asset and city planning tax, fire insurance',
              'Letting and restoration costs when tenants change',
              'Lost rent during vacancies',
            ],
          },
          {
            id: 'tax',
            heading: 'Tax for overseas owners',
            paragraphs: [
              'Companies and businesses paying rent to a non-resident owner generally withhold 20.42% and pay it to the tax office. Individuals renting the home to live in are not required to withhold.',
              'Rental income from Japan must be reported in a Japanese tax return, where the withheld tax is settled. Owners without an address in Japan appoint a tax representative to deal with the tax office.',
            ],
          },
          {
            id: 'remittance',
            heading: 'Receiving rent and reports',
            paragraphs: [
              'The management company usually collects the rent, deducts its fees and sends the balance to your Japanese or overseas account. Monthly statements and support in English or Chinese are worth checking when you choose a company.',
            ],
          },
        ],
        faq: [
          { question: 'How do I judge the rent level?', answer: 'Compare advertised rents for similar size, age and area. Our listing pages show the current rent and the gross and net yield for let units.' },
          { question: 'Can I use it for Airbnb?', answer: 'Most condominium bylaws ban short-term rentals. Check the bylaws and ward rules before buying.' },
          { question: 'What happens when a tenant leaves?', answer: 'The unit needs restoring and re-letting. Budget for the cost and an empty period.' },
        ],
        ctaTitle: 'Browse let properties',
        ctaDescription: 'Listing pages show the rent of let units, the net yield after building fees, and the monthly cash flow.',
      },
      'zh-TW': {
        category: '經營',
        title: '從海外出租東京公寓：管理方式、租約與稅務基礎',
        excerpt: '整理委託管理與包租的差異、普通租約與定期租約、每月費用，以及海外屋主的20.42%預扣與報稅。',
        seoDescription: '海外屋主如何出租東京公寓：委託管理或包租、普通或定期租約、費用、非居住者租金預扣20.42%與日本報稅。',
        intro: '東京的中古公寓常以「帶租約」方式購買，或購買後出租。若居住在海外並出租，管理公司的選擇與稅務手續特別重要。',
        keyTakeaways: [
          '管理方式主要有「委託管理」與「包租」兩種',
          '日本普通租約對承租人保護很強，若要約定期限出租可用定期租約',
          '計算報酬時要預估管理費・修繕公積金、固定資產稅、空置與換租費用',
          '支付租金給非居住者的法人等需預扣20.42%，屋主需在日本報稅',
        ],
        sections: [
          {
            id: 'management',
            heading: '委託管理與包租',
            paragraphs: [
              '委託管理是將招租、收租與處理問題交給管理公司，手續費多為租金的5%左右，空置風險由屋主承擔。',
              '包租是管理公司向屋主承租後再轉租。即使空置也能收到固定租金，但金額低於行情，且需注意調整租金與解約的條件。',
            ],
          },
          {
            id: 'lease-types',
            heading: '普通租約與定期租約',
            paragraphs: [
              '日本的普通租約對承租人保護很強，屋主要終止契約需有正當理由。若將來可能自住或想在特定時間出售，適合使用到期即終止的定期租約。',
              '購買出租中的物件時，會直接承接現有租約與返還押金（敷金）的義務。請確認租約內容、是否欠租與租期。',
            ],
          },
          {
            id: 'costs',
            heading: '出租期間的費用',
            paragraphs: ['從租金收入扣除以下費用，才是實際收入。'],
            bullets: [
              '管理費・修繕公積金（屋主負擔）',
              '管理公司手續費',
              '固定資產稅・都市計畫稅、火災保險',
              '換租時的招租費用與復原費用',
              '空置期間的租金損失',
            ],
          },
          {
            id: 'tax',
            heading: '海外屋主的稅務',
            paragraphs: [
              '支付租金給非居住者屋主的法人或事業者，原則上需預扣租金的20.42%並繳納（個人為自住而承租時不需預扣）。',
              '日本不動產所得需在日本報稅，預扣稅額於申報時結算。在日本沒有住址者，需申報委任納稅管理人處理與稅務署的往來。',
            ],
          },
          {
            id: 'remittance',
            heading: '收取租金與報告',
            paragraphs: [
              '一般由管理公司統一收取租金，扣除手續費後匯入日本或海外帳戶。每月收支報告，以及能否以英文或中文溝通，也是選擇管理公司的重點。',
            ],
          },
        ],
        faq: [
          { question: '如何判斷租金行情？', answer: '比較同區域、同面積與屋齡的招租租金。本站物件頁面會顯示出租中物件的目前租金與表面・實質投報率。' },
          { question: '可以做民宿嗎？', answer: '多數公寓的管理規約禁止民宿。購買前請確認管理規約與區的條例。' },
          { question: '承租人退租後需要做什麼？', answer: '需要進行復原工程並招募下一位承租人，請預估費用與空置期間。' },
        ],
        ctaTitle: '尋找出租中的物件',
        ctaDescription: '物件頁面可確認出租中物件的租金、扣除管理費等後的實質投報率與每月收支。',
      },
      'zh-CN': {
        category: '运营',
        title: '从海外出租东京公寓：管理方式、租约与税务基础',
        excerpt: '整理委托管理与包租的区别、普通租约与定期租约、每月费用，以及海外业主的20.42%预扣与报税。',
        seoDescription: '海外业主如何出租东京公寓：委托管理或包租、普通或定期租约、费用、非居住者租金预扣20.42%与日本报税。',
        intro: '东京的二手公寓常以“带租约”方式购买，或购买后出租。如果住在海外并出租，管理公司的选择与税务手续尤为重要。',
        keyTakeaways: [
          '管理方式主要有“委托管理”和“包租”两种',
          '日本普通租约对租客保护很强，若要约定期限出租可用定期租约',
          '计算收益时要预估管理费・修缮基金、固定资产税、空置与换租费用',
          '向非居住者支付租金的法人等需预扣20.42%，业主需在日本报税',
        ],
        sections: [
          {
            id: 'management',
            heading: '委托管理与包租',
            paragraphs: [
              '委托管理是把招租、收租与处理问题交给管理公司，手续费多为租金的5%左右，空置风险由业主承担。',
              '包租是管理公司向业主承租后再转租。即使空置也能收到固定租金，但金额低于市场水平，且需注意调整租金与解约的条件。',
            ],
          },
          {
            id: 'lease-types',
            heading: '普通租约与定期租约',
            paragraphs: [
              '日本的普通租约对租客保护很强，业主要终止合同需有正当理由。如果将来可能自住或想在特定时间出售，适合使用到期即终止的定期租约。',
              '购买出租中的房源时，会直接承接现有租约与返还押金（敷金）的义务。请确认租约内容、是否欠租与租期。',
            ],
          },
          {
            id: 'costs',
            heading: '出租期间的费用',
            paragraphs: ['从租金收入中扣除以下费用，才是实际收入。'],
            bullets: [
              '管理费・修缮基金（业主承担）',
              '管理公司手续费',
              '固定资产税・城市规划税、火灾保险',
              '换租时的招租费用与恢复原状费用',
              '空置期间的租金损失',
            ],
          },
          {
            id: 'tax',
            heading: '海外业主的税务',
            paragraphs: [
              '向非居住者业主支付租金的法人或经营者，原则上需预扣租金的20.42%并缴纳（个人为自住而租用时不需要预扣）。',
              '日本房产所得需要在日本报税，预扣税额在申报时结算。在日本没有住址者，需要申报委任纳税管理人处理与税务署的往来。',
            ],
          },
          {
            id: 'remittance',
            heading: '收取租金与报告',
            paragraphs: [
              '一般由管理公司统一收取租金，扣除手续费后汇入日本或海外账户。每月收支报告，以及能否用英文或中文沟通，也是选择管理公司的要点。',
            ],
          },
        ],
        faq: [
          { question: '如何判断租金水平？', answer: '比较同区域、同面积与房龄的招租租金。本站房源页面会显示出租中房源的当前租金与表面・实际收益率。' },
          { question: '可以做民宿吗？', answer: '多数公寓的管理规约禁止民宿。购买前请确认管理规约与区的条例。' },
          { question: '租客退租后需要做什么？', answer: '需要进行恢复原状工程并招募下一位租客，请预估费用与空置期间。' },
        ],
        ctaTitle: '查找出租中的房源',
        ctaDescription: '房源页面可确认出租中房源的租金、扣除管理费等后的实际收益率与每月收支。',
      },
    },
  },
]
