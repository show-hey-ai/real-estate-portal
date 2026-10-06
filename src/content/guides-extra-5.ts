import type { GuideArticle } from './guides'

/** Guides on short-term rentals (minpaku) and renovating a resale condominium. */
export const extraGuideArticles5: GuideArticle[] = [
  {
    slug: 'tokyo-condo-minpaku-short-term-rental-rules',
    publishedAt: '2026-10-07',
    updatedAt: '2026-10-07',
    readMinutes: 6,
    tags: ['minpaku', 'short-term rental', 'investment'],
    locales: {
      ja: {
        category: '運用',
        title: '東京のマンションで民泊はできる？3つの制度と確認ポイント',
        excerpt: '住宅宿泊事業法（年180日まで）、旅館業法の許可、国家戦略特区の3つの制度と、マンションの管理規約・区の条例による制限を整理します。',
        seoDescription: '東京のマンションで民泊を始める前に。住宅宿泊事業法の年180日上限、旅館業法の簡易宿所、特区民泊の違い、管理規約と区の上乗せ規制、購入前の確認点を解説。',
        intro: '「買ったマンションを民泊にしたい」というご相談は多くいただきます。ただし、東京のマンションでは制度上・規約上の制限が多く、購入後に運営できないと分かるケースもあります。購入前に確認すべきことをまとめました。',
        keyTakeaways: [
          '民泊の主な制度は「住宅宿泊事業法」「旅館業法」「特区民泊」の3つ',
          '住宅宿泊事業法の民泊は年180日まで。区によってさらに制限がある',
          '多くのマンションは管理規約で民泊を禁止している',
          '購入前に、管理規約・区の条例・用途地域を必ず確認する',
        ],
        sections: [
          {
            id: 'systems',
            heading: '民泊の3つの制度',
            paragraphs: ['有料で人を泊めるには、次のいずれかの制度にもとづく届出や許可が必要です。'],
            bullets: [
              '住宅宿泊事業法（いわゆる民泊新法）：届出制。営業できるのは年180日まで',
              '旅館業法（簡易宿所など）：許可制。日数の上限はないが、建物の用途や設備、用途地域の条件が厳しい',
              '国家戦略特区（特区民泊）：東京23区では大田区が対象。最低宿泊日数などの条件がある',
            ],
          },
          {
            id: 'ward-rules',
            heading: '区ごとの上乗せ規制',
            paragraphs: [
              '住宅宿泊事業法の民泊は、区の条例で営業できる区域や期間がさらに制限されていることがあります。たとえば住居専用地域では平日の営業を認めないなど、区によって内容が異なります。物件のある区の最新の条例を確認してください。',
            ],
          },
          {
            id: 'bylaws',
            heading: 'マンションの管理規約',
            paragraphs: [
              '分譲マンションでは、管理規約で民泊（住宅宿泊事業）を禁止しているケースが多くあります。禁止が明記されていない場合も、総会の決議で禁止されることがあります。管理規約と、民泊に関する総会決議の有無を、重要事項調査報告書とあわせて確認しましょう。',
            ],
          },
          {
            id: 'alternatives',
            heading: '民泊ができない場合の選択肢',
            paragraphs: [
              '民泊ができないマンションでも、通常の賃貸（普通借家・定期借家）や、30日以上のマンスリー賃貸で運用する方法があります。宿泊用途で考えるなら、一棟の建物や、旅館業の許可を取りやすい物件を検討するほうが現実的です。',
            ],
          },
          {
            id: 'checklist',
            heading: '購入前のチェックリスト',
            paragraphs: [],
            bullets: [
              '管理規約に民泊の禁止・許可の定めがあるか',
              '物件のある区の民泊条例（区域・期間の制限）',
              '用途地域（旅館業の許可が取れるか）',
              '消防設備や避難経路など、必要な設備と工事費',
              '民泊ができなかった場合の賃貸での収支',
            ],
          },
        ],
        faq: [
          { question: '当サイトの物件は民泊に使えますか？', answer: '多くの区分マンションは管理規約で禁止されています。物件ごとに管理規約を確認しますので、資料請求でお問い合わせください。' },
          { question: '年180日を超えて営業できますか？', answer: '住宅宿泊事業法の民泊ではできません。日数の制限がない運営には旅館業法の許可が必要です。' },
          { question: 'ホテル・旅館向けの物件も扱っていますか？', answer: '運営会社の自由不動産は、ホテル・旅館向け物件のご相談も受けています。購入目的をお知らせください。' },
        ],
        ctaTitle: '目的に合った物件を相談する',
        ctaDescription: '民泊・賃貸・自己居住など、使い方によって選ぶべき物件は変わります。目的を添えてご相談ください。',
      },
      en: {
        category: 'Owning',
        title: 'Airbnb in a Tokyo Condo? Japan\'s Three Short-Term Rental Systems',
        excerpt: 'The minpaku law with its 180-night cap, hotel business licences, the special-zone scheme, and how condo bylaws and ward rules restrict short-term rentals.',
        seoDescription: 'Can you run an Airbnb in a Tokyo condominium? The 180-night minpaku law, simple lodging licences, special-zone minpaku, condo bylaw bans, ward rules and what to check before buying.',
        intro: 'Many buyers ask whether they can use a Tokyo condominium as an Airbnb. In practice, laws and building rules restrict it heavily, and some owners find out only after buying that they cannot operate. Here is what to check first.',
        keyTakeaways: [
          'There are three systems: the minpaku law, the hotel business licence and the special-zone scheme',
          'Minpaku under the law is capped at 180 nights a year, and wards add limits',
          'Most condominium bylaws ban short-term rentals',
          'Check the bylaws, ward rules and zoning before you buy',
        ],
        sections: [
          {
            id: 'systems',
            heading: 'Three systems',
            paragraphs: ['Paid overnight stays need a notification or licence under one of these.'],
            bullets: [
              'Private Lodging Business Act (minpaku law): notification; up to 180 nights a year',
              'Hotel Business Act (for example a simple lodging licence): no night cap, but strict rules on building use, facilities and zoning',
              'National Strategic Special Zones: in Tokyo\'s 23 wards, Ota Ward; minimum stay lengths and other conditions apply',
            ],
          },
          {
            id: 'ward-rules',
            heading: 'Extra ward rules',
            paragraphs: [
              'Wards can further restrict minpaku under the law by area and period, for example banning weekday operation in residential zones. Rules differ by ward, so check the current ordinance where the property is.',
            ],
          },
          {
            id: 'bylaws',
            heading: 'Condominium bylaws',
            paragraphs: [
              'Many condominium bylaws prohibit short-term rentals. Where they are silent, the owners association may still ban them by resolution. Check the bylaws and any resolutions alongside the building management report.',
            ],
          },
          {
            id: 'alternatives',
            heading: 'If short-term rental is not allowed',
            paragraphs: [
              'You can still let the unit on an ordinary or fixed-term lease, or as a furnished monthly rental of 30 days or more. For a lodging business, a whole building or a property that can obtain a hotel licence is usually more realistic.',
            ],
          },
          {
            id: 'checklist',
            heading: 'Checklist before buying',
            paragraphs: [],
            bullets: [
              'Whether the bylaws ban or allow short-term rentals',
              'The ward\'s minpaku ordinance (area and period limits)',
              'Zoning, and whether a hotel licence is possible',
              'Fire safety equipment and escape routes, and their cost',
              'The numbers as an ordinary rental if short-term letting fails',
            ],
          },
        ],
        faq: [
          { question: 'Can your listings be used for Airbnb?', answer: 'Most condominium units are covered by bylaw bans. We check the bylaws for each property; use “Get documents” to ask.' },
          { question: 'Can I operate more than 180 nights?', answer: 'Not under the minpaku law. Year-round operation needs a Hotel Business Act licence.' },
          { question: 'Do you handle hotel and ryokan properties?', answer: 'Our operator, Ziyou Real Estate, also advises on hotel and ryokan properties. Tell us your purpose.' },
        ],
        ctaTitle: 'Tell us how you plan to use it',
        ctaDescription: 'Short-term rental, long-term letting or living there all point to different properties. Ask with your purpose in mind.',
      },
      'zh-TW': {
        category: '經營',
        title: '東京公寓可以做民宿嗎？三種制度與確認重點',
        excerpt: '整理住宅宿泊事業法（每年180天）、旅館業法許可、國家戰略特區三種制度，以及公寓管理規約與各區條例的限制。',
        seoDescription: '在東京公寓經營民宿前必讀：住宅宿泊事業法每年180天上限、旅館業法簡易宿所、特區民宿的差異、管理規約與各區附加規定、購買前確認重點。',
        intro: '我們常收到「買的公寓想做民宿」的諮詢。但東京公寓在制度與規約上限制很多，也有買後才發現無法經營的情況。以下整理購買前應確認的事項。',
        keyTakeaways: [
          '民宿主要有「住宅宿泊事業法」「旅館業法」「特區民宿」三種制度',
          '住宅宿泊事業法的民宿每年最多180天，各區還有附加限制',
          '多數公寓的管理規約禁止民宿',
          '購買前務必確認管理規約、區條例與用途地域',
        ],
        sections: [
          {
            id: 'systems',
            heading: '民宿的三種制度',
            paragraphs: ['收費讓人住宿，需依下列其中一種制度申報或取得許可。'],
            bullets: [
              '住宅宿泊事業法（民宿新法）：申報制，每年最多營業180天',
              '旅館業法（簡易宿所等）：許可制，無天數上限，但建物用途、設備與用途地域條件嚴格',
              '國家戰略特區（特區民宿）：東京23區中為大田區，有最低住宿天數等條件',
            ],
          },
          {
            id: 'ward-rules',
            heading: '各區的附加規定',
            paragraphs: [
              '住宅宿泊事業法的民宿，各區可依條例進一步限制可營業的區域與期間，例如住居專用地域平日不可營業等，內容因區而異。請確認物件所在區的最新條例。',
            ],
          },
          {
            id: 'bylaws',
            heading: '公寓管理規約',
            paragraphs: [
              '許多分售公寓在管理規約中禁止民宿。即使未明文禁止，也可能經管理組合大會決議禁止。請連同重要事項調查報告書，確認管理規約與相關決議。',
            ],
          },
          {
            id: 'alternatives',
            heading: '無法做民宿時的選擇',
            paragraphs: [
              '即使不能做民宿，也可以一般出租（普通或定期租約），或以30天以上的月租方式經營。若以住宿用途為主，考慮整棟建物或較易取得旅館業許可的物件較為實際。',
            ],
          },
          {
            id: 'checklist',
            heading: '購買前檢查清單',
            paragraphs: [],
            bullets: [
              '管理規約是否禁止或允許民宿',
              '物件所在區的民宿條例（區域與期間限制）',
              '用途地域（能否取得旅館業許可）',
              '消防設備與避難動線等必要設備及工程費',
              '若無法做民宿，一般出租的收支',
            ],
          },
        ],
        faq: [
          { question: '本站物件可以做民宿嗎？', answer: '多數區分公寓的管理規約禁止。我們會逐一確認管理規約，請透過索取資料詢問。' },
          { question: '可以超過每年180天營業嗎？', answer: '依住宅宿泊事業法不行。全年營業需取得旅館業法許可。' },
          { question: '也有飯店、旅館用物件嗎？', answer: '營運公司自由不動產也受理飯店、旅館用物件的諮詢，請告知購買目的。' },
        ],
        ctaTitle: '依用途諮詢物件',
        ctaDescription: '民宿、出租或自住，適合的物件各不相同。歡迎附上用途諮詢。',
      },
      'zh-CN': {
        category: '运营',
        title: '东京公寓可以做民宿吗？三种制度与确认要点',
        excerpt: '整理住宅宿泊事业法（每年180天）、旅馆业法许可、国家战略特区三种制度，以及公寓管理规约与各区条例的限制。',
        seoDescription: '在东京公寓经营民宿前必读：住宅宿泊事业法每年180天上限、旅馆业法简易宿所、特区民宿的区别、管理规约与各区附加规定、购买前确认要点。',
        intro: '我们经常收到“买的公寓想做民宿”的咨询。但东京公寓在制度与规约上限制很多，也有买后才发现无法经营的情况。以下整理购买前应确认的事项。',
        keyTakeaways: [
          '民宿主要有“住宅宿泊事业法”“旅馆业法”“特区民宿”三种制度',
          '住宅宿泊事业法的民宿每年最多180天，各区还有附加限制',
          '多数公寓的管理规约禁止民宿',
          '购买前务必确认管理规约、区条例与用途地域',
        ],
        sections: [
          {
            id: 'systems',
            heading: '民宿的三种制度',
            paragraphs: ['收费让人住宿，需要依据下列其中一种制度申报或取得许可。'],
            bullets: [
              '住宅宿泊事业法（民宿新法）：申报制，每年最多营业180天',
              '旅馆业法（简易宿所等）：许可制，无天数上限，但建筑用途、设备与用途地域条件严格',
              '国家战略特区（特区民宿）：东京23区中为大田区，有最低住宿天数等条件',
            ],
          },
          {
            id: 'ward-rules',
            heading: '各区的附加规定',
            paragraphs: [
              '住宅宿泊事业法的民宿，各区可通过条例进一步限制可营业的区域与期间，例如住居专用地域工作日不可营业等，内容因区而异。请确认房源所在区的最新条例。',
            ],
          },
          {
            id: 'bylaws',
            heading: '公寓管理规约',
            paragraphs: [
              '许多分售公寓在管理规约中禁止民宿。即使未明文禁止，也可能经管理组合大会决议禁止。请连同重要事项调查报告书，确认管理规约与相关决议。',
            ],
          },
          {
            id: 'alternatives',
            heading: '无法做民宿时的选择',
            paragraphs: [
              '即使不能做民宿，也可以普通出租（普通或定期租约），或以30天以上的月租方式经营。若以住宿用途为主，考虑整栋建筑或较易取得旅馆业许可的房源更为现实。',
            ],
          },
          {
            id: 'checklist',
            heading: '购买前检查清单',
            paragraphs: [],
            bullets: [
              '管理规约是否禁止或允许民宿',
              '房源所在区的民宿条例（区域与期间限制）',
              '用途地域（能否取得旅馆业许可）',
              '消防设备与疏散通道等必要设备及工程费',
              '如果无法做民宿，普通出租的收支',
            ],
          },
        ],
        faq: [
          { question: '本站房源可以做民宿吗？', answer: '多数区分公寓的管理规约禁止。我们会逐一确认管理规约，请通过索取资料咨询。' },
          { question: '可以超过每年180天营业吗？', answer: '依据住宅宿泊事业法不可以。全年营业需要取得旅馆业法许可。' },
          { question: '也有酒店、旅馆用房源吗？', answer: '运营公司自由不动产也受理酒店、旅馆用房源的咨询，请告知购买目的。' },
        ],
        ctaTitle: '按用途咨询房源',
        ctaDescription: '民宿、出租或自住，适合的房源各不相同。欢迎附上用途咨询。',
      },
    },
  },
  {
    slug: 'renovating-resale-condo-tokyo',
    publishedAt: '2026-10-07',
    updatedAt: '2026-10-07',
    readMinutes: 5,
    tags: ['renovation', 'condominium', 'costs'],
    locales: {
      ja: {
        category: '物件の見方',
        title: '中古マンションのリフォーム・リノベーションの基本｜できること・費用・手続き',
        excerpt: '専有部分と共用部分の違い、管理組合への申請、床の遮音規定や配管の制約、費用の目安まで、中古マンションを買って直すときの基本を整理します。',
        seoDescription: '中古マンションのリフォーム・リノベーションで知っておきたいこと。専有部分と共用部分、管理組合への工事申請、床の遮音性能、水回りの移動の制約、工事時間、費用の目安。',
        intro: '東京の中古マンションは、購入後にリフォームやリノベーションをして住む・貸す方が多くいます。ただし、マンションには自由に変えられない部分や手続きがあります。購入前に知っておきたい基本をまとめました。',
        keyTakeaways: [
          '室内（専有部分）は工事できるが、窓・玄関ドア・バルコニーは共用部分で原則変更できない',
          '工事の前に管理組合への申請と承認が必要',
          '床材の遮音性能や、水回りの移動には建物ごとの制約がある',
          'フルリノベーションの費用は広さと内容しだいで、1㎡あたり10万〜20万円程度がひとつの目安',
        ],
        sections: [
          {
            id: 'scope',
            heading: '工事できる範囲',
            paragraphs: [
              '自分で工事できるのは、室内の床・壁・天井、キッチンや浴室などの設備といった専有部分です。窓サッシ、玄関ドアの外側、バルコニー、建物の柱・梁・外壁は共用部分で、原則として個人では変更できません。',
            ],
          },
          {
            id: 'rules',
            heading: '管理規約と工事の申請',
            paragraphs: ['工事を始める前に、管理規約や使用細則にもとづいて管理組合へ申請し、承認を受けます。'],
            bullets: [
              '床をフローリングに変える場合の遮音性能（L値などの基準）',
              '工事できる曜日・時間帯と、近隣への事前のお知らせ',
              '共用廊下やエレベーターの養生、資材の搬入方法',
              '電気容量の上限（ブレーカーの容量を増やせるか）',
            ],
          },
          {
            id: 'plumbing',
            heading: '水回りの移動に注意',
            paragraphs: [
              'キッチンや浴室を移動したい場合、排水管の勾配がとれるかがポイントです。床下の空間が狭い建物では、移動できる範囲が限られます。古い建物では、専有部分の給排水管の交換もあわせて検討しましょう。',
            ],
          },
          {
            id: 'cost',
            heading: '費用と期間の目安',
            paragraphs: [
              '内装を一新するフルリノベーションは、広さや設備のグレードによりますが、1㎡あたり10万〜20万円程度がひとつの目安です。部分的なリフォーム（クロスや床の張り替え、設備交換）なら、より少ない費用で済みます。工期はフルリノベーションで2〜3か月程度かかることが多く、設計や管理組合の承認の期間も見込みましょう。',
            ],
          },
          {
            id: 'buying',
            heading: '購入前に確認すること',
            paragraphs: [],
            bullets: [
              '管理規約・使用細則のリフォームに関する定め',
              '床下・天井裏の空間と、配管の位置',
              '前回の大規模修繕の時期（共用部分の状態）',
              'リノベーション済み物件なら、工事の内容と保証',
            ],
          },
        ],
        faq: [
          { question: '「リノベーション済み」の物件を買うのと、自分で直すのはどちらがいいですか？', answer: '済み物件はすぐ住めて費用も見えやすく、自分で直す場合は好みに合わせられます。工事の手間と期間、価格の差を比べて選びましょう。' },
          { question: '海外にいても工事を進められますか？', answer: '設計や工事会社とオンラインで打ち合わせて進めることはできます。管理組合への申請など、日本側の窓口が必要です。' },
          { question: 'リフォーム費用もローンに含められますか？', answer: '金融機関によっては、購入とリフォームをまとめて借りられる商品があります。条件は金融機関に確認してください。' },
        ],
        ctaTitle: '直して住む・貸す前提で物件を探す',
        ctaDescription: '物件ページの「物件のポイント」では、リノベーション済み・予定の物件がわかります。',
      },
      en: {
        category: 'Due diligence',
        title: 'Renovating a Resale Tokyo Condo: What You Can Change, Costs and Approvals',
        excerpt: 'Private vs common parts, approval from the owners association, floor sound rules, limits on moving kitchens and bathrooms, and rough costs.',
        seoDescription: 'Renovating a resale condominium in Tokyo: what owners can change, association approval, flooring sound ratings, plumbing limits, working hours, typical costs and timelines.',
        intro: 'Many buyers renovate a resale Tokyo condominium before living in it or letting it. Condominiums come with parts you cannot change and approvals you need. Here are the basics to know before buying.',
        keyTakeaways: [
          'You can renovate the interior, but windows, the front door and balconies are common parts',
          'Work needs an application to, and approval from, the owners association',
          'Floor sound ratings and the plumbing limit what you can change',
          'A full renovation often costs roughly ¥100,000–200,000 per m², depending on scope',
        ],
        sections: [
          {
            id: 'scope',
            heading: 'What you can change',
            paragraphs: [
              'Owners can renovate the private parts: floors, walls, ceilings and fittings such as the kitchen and bathroom. Window frames, the outside of the front door, balconies, structure and exterior walls are common parts and generally cannot be changed by one owner.',
            ],
          },
          {
            id: 'rules',
            heading: 'Bylaws and approvals',
            paragraphs: ['Before starting, apply to the owners association under the bylaws and house rules and get approval.'],
            bullets: [
              'Sound insulation standards when changing to wooden flooring',
              'Permitted working days and hours, and notices to neighbours',
              'Protecting shared corridors and lifts, and how materials are delivered',
              'The electrical capacity limit for the unit',
            ],
          },
          {
            id: 'plumbing',
            heading: 'Moving kitchens and bathrooms',
            paragraphs: [
              'Moving a kitchen or bathroom depends on keeping enough slope for the drain pipes. Buildings with little space under the floor limit how far fittings can move. In older buildings, consider replacing the pipes within the unit at the same time.',
            ],
          },
          {
            id: 'cost',
            heading: 'Costs and timing',
            paragraphs: [
              'A full interior renovation often costs roughly ¥100,000–200,000 per m², depending on size and specification. Partial work, such as new wallpaper, flooring or fittings, costs less. Full renovations often take two to three months of work, plus time for design and association approval.',
            ],
          },
          {
            id: 'buying',
            heading: 'What to check before buying',
            paragraphs: [],
            bullets: [
              'Renovation rules in the bylaws and house rules',
              'Space under the floor and above the ceiling, and where the pipes run',
              'When major repairs were last done on the common parts',
              'For renovated units, what was done and any warranty',
            ],
          },
        ],
        faq: [
          { question: 'Should I buy renovated or renovate myself?', answer: 'Renovated units are ready to use with known costs; renovating yourself lets you choose the finish. Compare the effort, time and price difference.' },
          { question: 'Can I renovate while living abroad?', answer: 'You can work with designers and contractors online, but you need a contact in Japan for things like the association application.' },
          { question: 'Can renovation costs be included in a loan?', answer: 'Some lenders offer loans that cover purchase and renovation together. Check the conditions with the lender.' },
        ],
        ctaTitle: 'Find properties to renovate or ready to move in',
        ctaDescription: 'The good points on each listing show renovated units and planned renovations.',
      },
      'zh-TW': {
        category: '物件判讀',
        title: '中古公寓翻修的基本｜可改範圍、費用與手續',
        excerpt: '整理專有部分與公共部分的差異、向管理組合申請、地板隔音規定與管線限制，以及費用參考。',
        seoDescription: '東京中古公寓翻修須知：專有與公共部分、向管理組合申請工程、地板隔音性能、水電移位限制、施工時間與費用參考。',
        intro: '許多人買下東京中古公寓後進行翻修再自住或出租。但公寓有不能自由變更的部分與必要手續。以下整理購買前應了解的基本。',
        keyTakeaways: [
          '室內（專有部分）可施工，但窗戶、玄關門、陽台屬公共部分，原則上不可變更',
          '施工前需向管理組合申請並取得同意',
          '地板隔音性能與水電移位有各建物的限制',
          '全面翻修費用依面積與內容而異，約每平方公尺10萬〜20萬日圓可作參考',
        ],
        sections: [
          {
            id: 'scope',
            heading: '可施工的範圍',
            paragraphs: [
              '可自行施工的是室內地板、牆壁、天花板，以及廚房、浴室等設備的專有部分。窗框、玄關門外側、陽台、柱樑與外牆屬公共部分，原則上個人不可變更。',
            ],
          },
          {
            id: 'rules',
            heading: '管理規約與工程申請',
            paragraphs: ['開工前需依管理規約與使用細則向管理組合申請並取得同意。'],
            bullets: [
              '改為木地板時的隔音性能標準',
              '可施工的日期與時段，以及事前告知鄰居',
              '公共走廊與電梯的保護、建材搬運方式',
              '用電容量上限',
            ],
          },
          {
            id: 'plumbing',
            heading: '注意水電移位',
            paragraphs: [
              '想移動廚房或浴室時，關鍵在於排水管能否維持坡度。地板下空間狹小的建物，可移動範圍有限。老舊建物也建議一併更換專有部分的給排水管。',
            ],
          },
          {
            id: 'cost',
            heading: '費用與工期參考',
            paragraphs: [
              '全面翻修依面積與設備等級而異，約每平方公尺10萬〜20萬日圓可作參考；局部翻修（換壁紙、地板或設備）費用較低。全面翻修工期多需2〜3個月，另需預留設計與管理組合審核時間。',
            ],
          },
          {
            id: 'buying',
            heading: '購買前要確認的事',
            paragraphs: [],
            bullets: [
              '管理規約與使用細則中關於翻修的規定',
              '地板下與天花板內的空間與管線位置',
              '上次大規模修繕時間（公共部分狀態）',
              '已翻修物件的工程內容與保固',
            ],
          },
        ],
        faq: [
          { question: '買已翻修的物件好，還是自己翻修好？', answer: '已翻修物件可直接入住、費用明確；自己翻修則能依喜好設計。請比較工程時間、手續與價差。' },
          { question: '人在海外也能進行翻修嗎？', answer: '可透過線上與設計師、施工公司討論，但向管理組合申請等需要日本的聯絡窗口。' },
          { question: '翻修費用可以納入貸款嗎？', answer: '部分金融機構有購屋與翻修合併的貸款，條件請向金融機構確認。' },
        ],
        ctaTitle: '以翻修為前提尋找物件',
        ctaDescription: '物件頁面的「物件優點」可看出已翻新或預定翻新的物件。',
      },
      'zh-CN': {
        category: '房源判读',
        title: '二手公寓翻新的基本｜可改范围、费用与手续',
        excerpt: '整理专有部分与公共部分的区别、向管理组合申请、地板隔音规定与管道限制，以及费用参考。',
        seoDescription: '东京二手公寓翻新须知：专有与公共部分、向管理组合申请工程、地板隔音性能、水电移位限制、施工时间与费用参考。',
        intro: '许多人买下东京二手公寓后进行翻新再自住或出租。但公寓有不能自由改变的部分与必要手续。以下整理购买前应了解的基本。',
        keyTakeaways: [
          '室内（专有部分）可施工，但窗户、入户门、阳台属公共部分，原则上不可改变',
          '施工前需要向管理组合申请并取得同意',
          '地板隔音性能与水电移位有各建筑的限制',
          '全面翻新费用因面积与内容而异，约每平方米10万〜20万日元可作参考',
        ],
        sections: [
          {
            id: 'scope',
            heading: '可施工的范围',
            paragraphs: [
              '可自行施工的是室内地板、墙壁、天花板，以及厨房、浴室等设备的专有部分。窗框、入户门外侧、阳台、柱梁与外墙属公共部分，原则上个人不可改变。',
            ],
          },
          {
            id: 'rules',
            heading: '管理规约与工程申请',
            paragraphs: ['开工前需依据管理规约与使用细则向管理组合申请并取得同意。'],
            bullets: [
              '改为木地板时的隔音性能标准',
              '可施工的日期与时段，以及事先告知邻居',
              '公共走廊与电梯的保护、建材搬运方式',
              '用电容量上限',
            ],
          },
          {
            id: 'plumbing',
            heading: '注意水电移位',
            paragraphs: [
              '想移动厨房或浴室时，关键在于排水管能否保持坡度。地板下空间狭小的建筑，可移动范围有限。老旧建筑也建议一并更换专有部分的给排水管。',
            ],
          },
          {
            id: 'cost',
            heading: '费用与工期参考',
            paragraphs: [
              '全面翻新因面积与设备等级而异，约每平方米10万〜20万日元可作参考；局部翻新（换墙纸、地板或设备）费用较低。全面翻新工期多需2〜3个月，另需预留设计与管理组合审核时间。',
            ],
          },
          {
            id: 'buying',
            heading: '购买前要确认的事',
            paragraphs: [],
            bullets: [
              '管理规约与使用细则中关于翻新的规定',
              '地板下与天花板内的空间与管道位置',
              '上次大规模修缮时间（公共部分状态）',
              '已翻新房源的工程内容与保修',
            ],
          },
        ],
        faq: [
          { question: '买已翻新的房源好，还是自己翻新好？', answer: '已翻新房源可直接入住、费用明确；自己翻新则能按喜好设计。请比较工程时间、手续与价差。' },
          { question: '人在海外也能进行翻新吗？', answer: '可以通过线上与设计师、施工公司沟通，但向管理组合申请等需要日本的联络人。' },
          { question: '翻新费用可以纳入贷款吗？', answer: '部分金融机构有购房与翻新合并的贷款，条件请向金融机构确认。' },
        ],
        ctaTitle: '以翻新为前提查找房源',
        ctaDescription: '房源页面的“房源优点”可看出已翻新或计划翻新的房源。',
      },
    },
  },
]
