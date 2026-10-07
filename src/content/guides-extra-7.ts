import type { GuideArticle } from './guides'

const MLIT_FLOOD = 'https://www.mlit.go.jp/report/press/totikensangyo16_hh_000205.html'
const TOKYO_RISK = 'https://www.funenka.metro.tokyo.lg.jp/area-hazard-level/regional-risk-list/index.html'
const GSI_MAP = 'https://disaportal.gsi.go.jp/'
const MOF_QUAKE = 'https://www.mof.go.jp/policy/financial_system/earthquake_insurance/jisin.htm'

/**
 * How to check earthquake and flood risk for a Tokyo home. Facts checked on 2026-10-07: MLIT
 * (flood hazard maps in the disclosure briefing since 28 Aug 2020), Tokyo's area risk survey
 * (9th, Sept 2022, 5,192 districts, five relative ranks), GSI hazard map portal, MOF earthquake
 * insurance (attached to fire insurance, 30–50%, caps ¥50M building / ¥10M contents).
 */
export const extraGuideArticles7: GuideArticle[] = [
  {
    slug: 'tokyo-earthquake-flood-risk-check',
    publishedAt: '2026-10-07',
    updatedAt: '2026-10-07',
    readMinutes: 6,
    tags: ['earthquake', 'flood', 'hazard map'],
    locales: {
      ja: {
        category: '安全',
        title: '東京の物件の地震・水害リスクを確かめる：建物・地域・ハザードマップ・保険',
        excerpt: '建物の耐震基準、町丁目ごとの地震の危険度（東京都）、ハザードマップの水害リスク、地震保険の4つで確かめます。',
        seoDescription: '東京で物件を買う前の地震・水害リスクの確かめ方。新耐震基準、東京都の地域危険度（5,192町丁目・5段階）、国土地理院の重ねるハザードマップ、重要事項説明での水害ハザードマップの説明、地震保険の仕組みを解説。',
        intro: '日本は地震や大雨の多い国なので、物件を選ぶときにリスクを確かめるのはごく普通のことです。東京では、建物そのもの、物件がある地域、水害の想定、保険の4つを公的な資料で確かめられます。順番に見ていきましょう。',
        keyTakeaways: [
          '建物：1981年6月以降に建築確認を受けた「新耐震基準」かを確認する',
          '地域：東京都が町丁目ごとに地震の危険度を5段階で公表している（ランク5が最も高い）',
          '水害：ハザードマップで洪水・内水・高潮の想定を確認する。重要事項説明でも説明される',
          '保険：地震による損害は火災保険だけでは補償されず、地震保険を付ける',
        ],
        sections: [
          {
            id: 'building',
            heading: '建物：耐震基準を確認する',
            paragraphs: [
              '1981年6月1日以降に建築確認を受けた建物は「新耐震基準」で設計されています。築年が1984年以降ならほぼ新耐震基準ですが、1981〜83年築は建築確認の日付を確認しましょう。くわしくは耐震基準のガイドをご覧ください。',
            ],
          },
          {
            id: 'area',
            heading: '地域：東京都の「地域危険度」',
            paragraphs: [
              '東京都はおおむね5年ごとに「地震に関する地域危険度測定調査」を行っています。2022年9月公表の第9回調査では、都内の5,192町丁目ごとに、建物倒壊・火災・総合の3つの危険度を5段階で評価しています。',
              'ランクは都内での相対評価で、ランク5が最も危険度が高く、ランク1が最も低い地域です。ランク1でも被害がないという意味ではないため、建物の耐震性とあわせて判断します。',
            ],
            table: {
              headers: ['危険度', '内容'],
              rows: [
                ['建物倒壊危険度', '地震の揺れで建物が壊れる危険性'],
                ['火災危険度', '地震で起きた火災が燃え広がる危険性'],
                ['総合危険度', '上の2つに、災害時の避難や消火・救助のしやすさを加えたもの'],
              ],
            },
          },
          {
            id: 'flood',
            heading: '水害：ハザードマップを見る',
            paragraphs: [
              '国土地理院の「重ねるハザードマップ」では、住所を入れると洪水・高潮・土砂災害などの想定を地図に重ねて見られます。各区もハザードマップを公開しています。',
              '2020年8月28日から、不動産会社は重要事項説明で、水害ハザードマップ（洪水・雨水出水・高潮）を示して物件のおおよその位置を説明することになりました。浸水想定区域に入っていなくても、水害の危険がないわけではありません。',
            ],
          },
          {
            id: 'condo',
            heading: 'マンションで確認したいこと',
            paragraphs: [],
            bullets: [
              '住戸の階数と、浸水想定の深さ（低層階ほど影響を受けやすい）',
              '耐震診断や耐震改修の履歴（旧耐震の建物の場合）',
              '長期修繕計画と修繕積立金の状況',
              '管理組合が加入している共用部分の保険',
            ],
          },
          {
            id: 'insurance',
            heading: '地震保険',
            paragraphs: [
              '火災保険だけでは、地震による火災や倒壊などの損害は補償されません。地震保険は火災保険に付けて入る仕組みで、保険金額は火災保険の30〜50%の範囲（建物5,000万円、家財1,000万円が上限）で決めます。',
            ],
          },
        ],
        faq: [
          { question: 'ランク1の地域なら安全ですか？', answer: '都内での相対的な評価で、危険度が比較的低いという意味です。被害がないという意味ではないので、建物の耐震性とあわせて判断してください。' },
          { question: 'ハザードマップで色がない場所は水害の心配がありませんか？', answer: '浸水想定区域に入っていなくても、水害の危険がないわけではありません。国土交通省も、そう誤解しないよう説明するよう求めています。' },
          { question: '海外に住んでいても地震保険に入れますか？', answer: '日本の物件の火災保険に付けて入ります。管理会社や保険代理店に相談してください。' },
        ],
        ctaTitle: '物件ごとにハザードマップを確認できます',
        ctaDescription: '各物件ページから、その場所を中心にした国土地理院のハザードマップと、東京都の地域危険度のページを開けます。',
        sources: [
          { label: '国土交通省：重要事項説明への水害リスクの追加（2020年8月28日施行）', url: MLIT_FLOOD },
          { label: '東京都：地域危険度一覧（第9回調査）', url: TOKYO_RISK },
          { label: '国土地理院：ハザードマップポータルサイト', url: GSI_MAP },
          { label: '財務省：地震保険制度の概要', url: MOF_QUAKE },
        ],
      },
      en: {
        category: 'Safety',
        title: 'Checking earthquake and flood risk for a Tokyo home: the building, the area, hazard maps and insurance',
        excerpt: 'Four checks: the building’s earthquake standard, Tokyo’s district earthquake risk ranks, flood hazard maps, and earthquake insurance.',
        seoDescription: 'How to check earthquake and flood risk before buying in Tokyo: the new earthquake standard, Tokyo’s area risk survey (5,192 districts, five ranks), the GSI hazard map, flood maps in the disclosure briefing, and how earthquake insurance works.',
        intro: 'Japan has frequent earthquakes and heavy rain, so checking risk is a normal part of choosing a home. In Tokyo you can check four things with official sources: the building itself, the area it stands in, flood scenarios, and insurance.',
        keyTakeaways: [
          'Building: check it follows the new earthquake standard (building permit from June 1981)',
          'Area: Tokyo ranks earthquake risk for every district on a 1–5 scale (5 is the highest)',
          'Flood: hazard maps show river flooding, rainwater flooding and storm surge; brokers must explain them before the contract',
          'Insurance: fire insurance alone does not cover earthquake damage; add earthquake insurance',
        ],
        sections: [
          {
            id: 'building',
            heading: 'The building: its earthquake standard',
            paragraphs: [
              'Buildings permitted from 1 June 1981 are designed to the new earthquake standard. Homes completed in 1984 or later almost always are; for 1981–83, check the permit date. See our earthquake-standard guide for details.',
            ],
          },
          {
            id: 'area',
            heading: 'The area: Tokyo’s district risk ranks',
            paragraphs: [
              'About every five years the Tokyo Metropolitan Government surveys earthquake risk by district. The 9th survey, published in September 2022, rates each of 5,192 districts for building collapse, fire and overall risk on five ranks.',
              'Ranks are relative within Tokyo: rank 5 is the highest risk and rank 1 the lowest. Rank 1 does not mean no damage, so weigh it together with the building’s earthquake resistance.',
            ],
            table: {
              headers: ['Risk', 'What it measures'],
              rows: [
                ['Building collapse', 'The chance of buildings collapsing from shaking'],
                ['Fire', 'The chance of earthquake fires spreading'],
                ['Overall', 'Both of the above, plus how hard evacuation, firefighting and rescue would be'],
              ],
            },
          },
          {
            id: 'flood',
            heading: 'Floods: read the hazard map',
            paragraphs: [
              'On the GSI “Kasaneru” hazard map, enter an address to overlay flood, storm-surge and landslide scenarios. Each ward also publishes hazard maps.',
              'Since 28 August 2020, brokers must show the flood hazard maps (river flooding, rainwater flooding and storm surge) in the pre-contract disclosure briefing and point out the property’s approximate location. Being outside a flood zone does not mean there is no flood risk.',
            ],
          },
          {
            id: 'condo',
            heading: 'What to check in a condominium',
            paragraphs: [],
            bullets: [
              'The unit’s floor and the expected flood depth (lower floors are more exposed)',
              'Any seismic assessment or retrofit (for older-standard buildings)',
              'The long-term repair plan and repair reserve',
              'The owners’ association insurance for common areas',
            ],
          },
          {
            id: 'insurance',
            heading: 'Earthquake insurance',
            paragraphs: [
              'Fire insurance alone does not cover fire, collapse or other damage caused by an earthquake. Earthquake insurance is added to a fire policy, at 30–50% of the fire insurance amount, up to ¥50 million for the building and ¥10 million for contents.',
            ],
          },
        ],
        faq: [
          { question: 'Is a rank 1 district safe?', answer: 'It means relatively low risk within Tokyo, not no risk. Consider the building’s earthquake resistance too.' },
          { question: 'If an area is uncoloured on the hazard map, is there no flood risk?', answer: 'No. Being outside a flood zone does not rule out flooding; the ministry asks brokers to make that clear.' },
          { question: 'Can I get earthquake insurance while living abroad?', answer: 'It is added to the fire insurance for the Japanese property. Ask your property manager or an insurance agent.' },
        ],
        ctaTitle: 'Check the hazard map for any listing',
        ctaDescription: 'Every listing page links to the GSI hazard map centred on the property and to Tokyo’s district risk page.',
        sources: [
          { label: 'Ministry of Land, Infrastructure, Transport and Tourism: flood risk in the disclosure briefing (Japanese)', url: MLIT_FLOOD },
          { label: 'Tokyo Metropolitan Government: district risk list, 9th survey (Japanese)', url: TOKYO_RISK },
          { label: 'Geospatial Information Authority of Japan: hazard map portal', url: GSI_MAP },
          { label: 'Ministry of Finance: earthquake insurance (Japanese)', url: MOF_QUAKE },
        ],
      },
      'zh-TW': {
        category: '安全',
        title: '確認東京物件的地震與水災風險：建物、地區、災害潛勢圖與保險',
        excerpt: '從建物的耐震標準、東京都各町丁目的地震危險度、水災潛勢圖與地震保險四個面向確認。',
        seoDescription: '在東京買房前如何確認地震與水災風險：新耐震標準、東京都地區危險度（5,192個町丁目、5個等級）、國土地理院災害潛勢圖、重要事項說明中的水災潛勢圖說明，以及地震保險的機制。',
        intro: '日本地震與豪雨較多，選房時確認風險是很平常的事。在東京，可以用公開資料確認四件事：建物本身、所在地區、水災假設與保險。',
        keyTakeaways: [
          '建物：確認是否為1981年6月以後取得建築確認的「新耐震標準」',
          '地區：東京都依町丁目公布地震危險度，分為5級（第5級最高）',
          '水災：以潛勢圖確認洪水、內水與暴潮的假設；重要事項說明時也會說明',
          '保險：地震造成的損害僅靠火災保險無法理賠，須加保地震保險',
        ],
        sections: [
          {
            id: 'building',
            heading: '建物：確認耐震標準',
            paragraphs: [
              '1981年6月1日以後取得建築確認的建物，依「新耐震標準」設計。1984年以後完工的幾乎都是新耐震；1981〜83年完工的請確認建築確認日期。詳見耐震標準指南。',
            ],
          },
          {
            id: 'area',
            heading: '地區：東京都的「地區危險度」',
            paragraphs: [
              '東京都大約每5年進行一次「地震地區危險度測定調查」。2022年9月公布的第9次調查，針對都內5,192個町丁目，以5個等級評估建物倒塌、火災與綜合三種危險度。',
              '等級是在東京都內的相對評估，第5級危險度最高，第1級最低。第1級也不代表不會受災，請與建物的耐震性一併判斷。',
            ],
            table: {
              headers: ['危險度', '內容'],
              rows: [
                ['建物倒塌危險度', '地震搖晃造成建物倒塌的危險性'],
                ['火災危險度', '地震引發的火災延燒的危險性'],
                ['綜合危險度', '上述兩者，加上災害時避難、滅火與救援的困難程度'],
              ],
            },
          },
          {
            id: 'flood',
            heading: '水災：查看災害潛勢圖',
            paragraphs: [
              '在國土地理院的「重疊災害潛勢圖」輸入地址，即可疊加查看洪水、暴潮、土石災害等假設。各區也公開災害潛勢圖。',
              '自2020年8月28日起，不動產公司在重要事項說明時，須出示水災潛勢圖（洪水、雨水內水、暴潮）並說明物件的大致位置。不在淹水假設區域內，也不代表沒有水災風險。',
            ],
          },
          {
            id: 'condo',
            heading: '公寓要確認的事項',
            paragraphs: [],
            bullets: [
              '住戶樓層與假設淹水深度（樓層越低越容易受影響）',
              '耐震診斷或耐震補強紀錄（舊耐震建物）',
              '長期修繕計畫與修繕公積金狀況',
              '管理組合為公共部分投保的保險',
            ],
          },
          {
            id: 'insurance',
            heading: '地震保險',
            paragraphs: [
              '僅靠火災保險，無法理賠地震造成的火災或倒塌等損害。地震保險須附加於火災保險，保險金額為火災保險的30〜50%（建物上限5,000萬日圓、家具上限1,000萬日圓）。',
            ],
          },
        ],
        faq: [
          { question: '第1級的地區就安全嗎？', answer: '代表在東京都內危險度相對較低，並非不會受災。請與建物的耐震性一併判斷。' },
          { question: '潛勢圖上沒有顏色的地方，就沒有水災風險嗎？', answer: '不在淹水假設區域內，也不代表沒有水災風險。國土交通省也要求業者說明避免誤解。' },
          { question: '住在海外也能投保地震保險嗎？', answer: '附加於日本物件的火災保險投保。請洽管理公司或保險代理店。' },
        ],
        ctaTitle: '每個物件都能查看災害潛勢圖',
        ctaDescription: '從各物件頁面，可開啟以該位置為中心的國土地理院災害潛勢圖，以及東京都地區危險度頁面。',
        sources: [
          { label: '國土交通省：重要事項說明新增水災風險（2020年8月28日施行，日文）', url: MLIT_FLOOD },
          { label: '東京都：地區危險度一覽（第9次調查，日文）', url: TOKYO_RISK },
          { label: '國土地理院：災害潛勢圖入口網站', url: GSI_MAP },
          { label: '財務省：地震保險制度概要（日文）', url: MOF_QUAKE },
        ],
      },
      'zh-CN': {
        category: '安全',
        title: '确认东京房产的地震和水灾风险：建筑、地区、灾害地图和保险',
        excerpt: '从建筑的抗震标准、东京都各町丁目的地震危险度、水灾灾害地图和地震保险四个方面确认。',
        seoDescription: '在东京买房前如何确认地震和水灾风险：新抗震标准、东京都地区危险度（5,192个町丁目、5个等级）、国土地理院灾害地图、重要事项说明中的水灾地图说明，以及地震保险的机制。',
        intro: '日本地震和暴雨较多，选房时确认风险是很平常的事。在东京，可以用公开资料确认四件事：建筑本身、所在地区、水灾假设和保险。',
        keyTakeaways: [
          '建筑：确认是否为1981年6月以后取得建筑确认的“新抗震标准”',
          '地区：东京都按町丁目公布地震危险度，分为5级（第5级最高）',
          '水灾：用灾害地图确认洪水、内涝和风暴潮的假设；重要事项说明时也会说明',
          '保险：地震造成的损失只靠火灾保险无法赔付，需要加保地震保险',
        ],
        sections: [
          {
            id: 'building',
            heading: '建筑：确认抗震标准',
            paragraphs: [
              '1981年6月1日以后取得建筑确认的建筑，按“新抗震标准”设计。1984年以后竣工的几乎都是新抗震；1981〜83年竣工的请确认建筑确认日期。详见抗震标准指南。',
            ],
          },
          {
            id: 'area',
            heading: '地区：东京都的“地区危险度”',
            paragraphs: [
              '东京都大约每5年进行一次“地震地区危险度测定调查”。2022年9月公布的第9次调查，针对都内5,192个町丁目，以5个等级评估建筑倒塌、火灾和综合三种危险度。',
              '等级是在东京都内的相对评估，第5级危险度最高，第1级最低。第1级也不代表不会受灾，请结合建筑的抗震性一起判断。',
            ],
            table: {
              headers: ['危险度', '内容'],
              rows: [
                ['建筑倒塌危险度', '地震摇晃导致建筑倒塌的危险性'],
                ['火灾危险度', '地震引发的火灾蔓延的危险性'],
                ['综合危险度', '上述两项，加上灾害时疏散、灭火和救援的难度'],
              ],
            },
          },
          {
            id: 'flood',
            heading: '水灾：查看灾害地图',
            paragraphs: [
              '在国土地理院的“叠加灾害地图”输入地址，就能叠加查看洪水、风暴潮、山体滑坡等假设。各区也公开灾害地图。',
              '自2020年8月28日起，房产公司在重要事项说明时，必须出示水灾灾害地图（洪水、内涝、风暴潮）并说明房产的大致位置。不在淹水假设区域内，也不代表没有水灾风险。',
            ],
          },
          {
            id: 'condo',
            heading: '公寓需要确认的事项',
            paragraphs: [],
            bullets: [
              '住户楼层和假设淹水深度（楼层越低越容易受影响）',
              '抗震诊断或抗震加固记录（旧抗震建筑）',
              '长期修缮计划和修缮基金情况',
              '管理组合为公共部分投保的保险',
            ],
          },
          {
            id: 'insurance',
            heading: '地震保险',
            paragraphs: [
              '只靠火灾保险，无法赔付地震造成的火灾或倒塌等损失。地震保险需附加在火灾保险上，保险金额为火灾保险的30〜50%（建筑上限5,000万日元、家具上限1,000万日元）。',
            ],
          },
        ],
        faq: [
          { question: '第1级的地区就安全吗？', answer: '表示在东京都内危险度相对较低，并不是不会受灾。请结合建筑的抗震性一起判断。' },
          { question: '灾害地图上没有颜色的地方，就没有水灾风险吗？', answer: '不在淹水假设区域内，也不代表没有水灾风险。国土交通省也要求业者说明，避免误解。' },
          { question: '住在海外也能买地震保险吗？', answer: '附加在日本房产的火灾保险上投保。请咨询管理公司或保险代理。' },
        ],
        ctaTitle: '每套房源都能查看灾害地图',
        ctaDescription: '在各房源页面，可以打开以该位置为中心的国土地理院灾害地图，以及东京都地区危险度页面。',
        sources: [
          { label: '国土交通省：重要事项说明新增水灾风险（2020年8月28日施行，日文）', url: MLIT_FLOOD },
          { label: '东京都：地区危险度一览（第9次调查，日文）', url: TOKYO_RISK },
          { label: '国土地理院：灾害地图门户网站', url: GSI_MAP },
          { label: '财务省：地震保险制度概要（日文）', url: MOF_QUAKE },
        ],
      },
    },
  },
]

