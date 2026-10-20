import type { GuideArticle } from './guides'

/**
 * Hospitality guides (旅館業 / 民泊) for investors opening lodging in Tokyo's 23 wards.
 * Facts checked against the official pages listed in `sources` on 2026-10-20.
 * No company figures are invented: costs that depend on the building are described, not quantified.
 */

const TAITO_TEBIKI = 'https://www.city.taito.lg.jp/kenchiku/jutaku/eisei/kankyoeisei/20180903162819383.files/R7taitoukuryokangyounotebiki.pdf'
const TAITO_FAQ = 'https://www.city.taito.lg.jp/kenchiku/jutaku/eisei/kankyoeisei/20180903162819383.html'
const KITA_TEBIKI = 'https://www.city.kita.lg.jp/_res/projects/default_project/_page_/001/008/982/ryokan_tebiki_kita.pdf'
const OTA_RYOKAN = 'https://www.city.ota.tokyo.jp/seikatsu/hoken/eisei/riyoubiyou/tetuduki/ryokanngyou.html'
const CHUO_RYOKAN = 'https://www.city.chuo.lg.jp/a0030/kenkouiryou/eisei/kankyoueisei/ryokanngyou.html'
const MHLW_2018 = 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000188046.html'
const MHLW_2016 = 'https://www.mhlw.go.jp/file/05-Shingikai-11121000-Iyakushokuhinkyoku-Soumuka/0000120947.pdf'
const MLIT_2019 = 'https://www.mlit.go.jp/report/press/house05_hh_000789.html'
const MLIT_200SQM = 'https://www.mlit.go.jp/common/001294996.pdf'
const TOKYO_ZONING = 'https://www.toshiseibi.metro.tokyo.lg.jp/kanko/area_ree/youto_seigen.pdf'
const TFD_MINPAKU = 'https://www.tfd.metro.tokyo.lg.jp/content/000100802.pdf'
const MINPAKU_PORTAL = 'https://www.mlit.go.jp/kankocho/minpaku/overview/minpaku/law1.html'
const OTA_MINPAKU = 'https://www.city.ota.tokyo.jp/seikatsu/hoken/minpaku/minpaku.html'
const CHUO_MINPAKU = 'https://www.city.chuo.lg.jp/a0030/kenkouiryou/eisei/seikatsueisei/minpaku/jyutakujyukuhakujigyojyorei.html'
const TAITO_MINPAKU = 'https://www.city.taito.lg.jp/kenchiku/jutaku/eisei/jutakulaw/minpanku20180613_003.html'
const SHINJUKU_PUBCOM = 'https://www.city.shinjuku.lg.jp/kenkou/kenko01_002177_01_00001.html'

const FDMA_TEKIGO = 'https://www.fdma.go.jp/laws/tutatsu/assets/260307_yo60.pdf'
const MLIT_TECH = 'https://www.mlit.go.jp/common/001294992.pdf'
const MHLW_2018_DECREE = 'https://www.mhlw.go.jp/content/11130500/001353975.pdf'
const SHINJUKU_FEE = 'https://www.city.shinjuku.lg.jp/content/000384209.pdf'
const SHINJUKU_RYOKAN_DRAFT = 'https://www.city.shinjuku.lg.jp/content/000467609.pdf'
const CHIYODA_MINPAKU = 'https://www.city.chiyoda.lg.jp/koho/kurashi/jutakushukuhakujigyo/jorei.html'

export const extraGuideArticles9: GuideArticle[] = [
  // ───────────────────────────── 1. Timeline and cost ─────────────────────────────
  {
    slug: 'tokyo-ryokan-license-timeline-cost',
    publishedAt: '2026-10-20',
    updatedAt: '2026-10-20',
    readMinutes: 7,
    tags: ['hospitality', 'ryokan license', 'hotel', 'minpaku'],
    locales: {
      ja: {
        category: 'ホテル・旅館',
        title: '東京で旅館業許可を取るには何か月・いくらかかる？流れと費用の内訳',
        excerpt: '東京23区で旅館業（簡易宿所・旅館・ホテル営業）の許可を取るまでの手順、区が示す期間の目安、申請手数料、費用が膨らむポイントを整理します。',
        seoDescription: '東京23区の旅館業許可（簡易宿所・旅館ホテル営業）の取得期間と費用。事前相談から許可までの流れ、北区・台東区が示す期間の目安、区ごとの申請手数料、消防・建築で費用が変わる点を解説。',
        intro: '東京23区で旅館業の許可を取るまでの期間は、建物の工事を除いても、事前相談から許可まで数か月を見込むのが現実的です。区の示す目安では、施設が完成してから許可までに土日祝を除いて20日（北区）かかり、その前の調査・設計・消防や建築との調整・工事の期間は建物によって大きく変わります。申請手数料そのものは数万円ですが、費用の大半は消防設備・建築の適合工事と専門家への報酬で、建物によって大きく変わります。',
        keyTakeaways: [
          '流れは「事前相談 → 近隣周知 → 建築・消防との協議 → 申請 → 現地検査 → 許可」',
          '台東区の目安：立入検査で問題がなければ、検査後1週間〜10日程度で許可（学校等の近くで関係機関への照会が必要な場合は、照会に通常1〜1.5か月）',
          '北区の目安：施設完成から土日祝を除き20日（関係機関への照会がある場合は48日）',
          '申請手数料は区ごとに違う（例：北区・新宿区・大田区は簡易宿所16,500円、旅館・ホテル30,600円）',
          '費用を大きく左右するのは消防設備と建築基準法への適合工事。購入前の調査で見通しを立てる',
        ],
        sections: [
          {
            id: 'flow',
            heading: '許可までの流れは？',
            paragraphs: [
              '答え：保健所への事前相談から始まり、建築・消防の基準を満たしたうえで申請し、保健所の現地検査に合格すると許可が出ます。区によって順番や名称は少しずつ違いますが、骨組みは同じです。',
              '台東区の手引きでは、事前相談のあと工事着手前に近隣住民へ周知し、その報告書を提出します。北区も、用途地域の確認と近隣周知を申請前の手順に置いています。大田区は事前相談が予約制で必須、オンライン申請はできません。',
            ],
            diagram: {
              kind: 'flow',
              title: '旅館業許可の一般的な流れ（東京23区）',
              steps: [
                { label: '用途地域・物件の確認', detail: '旅館・ホテルが建てられる地域か' },
                { label: '保健所に事前相談', detail: '図面を持参。区によって予約制' },
                { label: '近隣への周知', detail: '工事着手前。報告書を提出する区が多い' },
                { label: '建築・消防と協議', detail: '建築課（指定確認検査機関）と所轄消防署' },
                { label: '工事・申請', detail: '申請書・図面・手数料を提出' },
                { label: '検査', detail: '建築・消防の検査に適合後、保健所の施設検査' },
                { label: '許可・営業開始', detail: '許可書の交付' },
              ],
            },
          },
          {
            id: 'how-long',
            heading: '期間はどのくらい？',
            paragraphs: [
              '答え：区が示す目安は、施設が完成してから許可まで約1か月（北区：土日祝を除き20日）です。その前の物件調査・設計・建築や消防との調整・工事にかかる期間は建物によって大きく違い、ここが全体の長さを決めます。',
              '北区は、施設完成から土日祝を除いて20日、関係機関への意見照会が必要な施設では48日を目安としています。台東区は、立入検査で問題がなければ検査後1週間〜10日程度で許可になるとしています。また台東区では、学校等から110m以内の施設は関係機関への照会が必要で、その照会に通常1か月〜1か月半かかります。',
              '時間がかかりやすいのは、申請の前の段階です。用途地域が合わない、避難経路や階段の区画が基準を満たさない、消防設備の追加が必要、といった問題は図面の段階で見つかることが多く、設計の手戻りがそのまま遅れになります。',
            ],
            table: {
              caption: '区が示す期間の目安（2026年10月確認）',
              headers: ['区', '段階', '目安'],
              rows: [
                ['台東区', '学校等から110m以内の場合の関係機関への照会', '通常1か月〜1か月半'],
                ['台東区', '立入検査から許可まで', '1週間〜10日程度'],
                ['北区', '施設完成から許可まで', '土日祝を除き20日'],
                ['北区', '同上（関係機関への意見照会がある施設）', '土日祝を除き48日'],
              ],
            },
          },
          {
            id: 'fees',
            heading: '申請手数料はいくら？',
            paragraphs: [
              '答え：簡易宿所で1万円台、旅館・ホテル営業で2〜3万円台です。金額は区の条例で決まり、区によって違います。',
            ],
            table: {
              caption: '旅館業の申請手数料（各区の公表資料、2026年10月確認）',
              headers: ['区', '旅館・ホテル営業', '簡易宿所営業'],
              rows: [
                ['北区', '30,600円', '16,500円'],
                ['新宿区', '30,600円', '16,500円'],
                ['大田区', '30,600円', '16,500円'],
                ['中央区', '22,000円', '11,000円'],
              ],
            },
          },
          {
            id: 'cost-drivers',
            heading: '費用を大きく左右するものは？',
            paragraphs: [
              '答え：手数料よりはるかに大きいのが、消防設備の設置と、建築基準法に合わせるための工事です。どこまで必要かは建物の階数・面積・階段の数・構造で決まるため、物件ごとに見積もるしかありません。',
              '用途変更する部分が200㎡以下なら建築確認の申請は不要ですが、基準に適合させる義務は残ります。「確認申請がいらない＝工事がいらない」ではない点に注意してください。',
            ],
            bullets: [
              '消防設備：自動火災報知設備（小規模なら特定小規模施設用）、誘導灯、消火器、防炎物品など',
              '建築：階段の区画（竪穴区画）、避難経路、内装制限など。3階建ては特に要確認',
              '設備：玄関帳場（フロント）またはその代わりの設備、トイレ・洗面などの数',
              '専門家：建築士（図面・適合確認）、行政書士（申請書類）、消防設備業者',
              '近隣対応：周知のための説明や書類の作成',
            ],
          },
          {
            id: 'example',
            heading: '期間の組み立て例',
            paragraphs: [
              '下の例は、区の目安を当てはめて期間を組み立てたものです。実際の案件の数字ではありません。',
            ],
            example: {
              title: '例：北区の戸建を簡易宿所にする場合の組み立て（説明用）',
              lines: [
                '物件調査・用途地域の確認・事前相談：2〜4週間',
                '建築士の図面作成と、建築課・消防署との事前相談：建物による（基準に合わない点が見つかると設計の手戻りが出る）',
                '工事：建物による（設備の追加だけで済むか、区画工事が必要かで大きく変わる）',
                '施設完成から許可まで：土日祝を除き20日（北区の目安）',
                '学校等が近く関係機関への照会が必要な場合：北区の目安は48日に延びる',
              ],
              note: '区・建物・工事内容によって大きく変わります。購入スケジュールを組む前に、物件ごとの確認が必要です。',
            },
          },
          {
            id: 'mistakes',
            heading: 'よくある失敗',
            paragraphs: [],
            bullets: [
              '購入してから用途地域を調べ、旅館業ができないと分かる',
              '「200㎡以下だから手続きは簡単」と考え、消防・建築の工事費を見込んでいない',
              '近隣周知や事前相談の予約待ちを計算に入れず、開業日を先に決めてしまう',
              '区の条例（帳場の常駐、学校からの距離など）を確認していない',
            ],
          },
        ],
        faq: [
          { question: '旅館業許可の標準処理期間は決まっていますか？', answer: '「標準処理期間」という名称で公表している区は確認できませんでした。北区は施設完成から土日祝を除き20日、台東区は検査後1週間〜10日程度といった目安を示しています。' },
          { question: '外国人や海外在住でも許可を取れますか？', answer: '旅館業の許可は営業者に対して出るもので、国籍の要件はありません。ただし事前相談や検査への立会い、緊急時の対応体制など、国内で動ける体制が必要です。' },
          { question: '物件を買う前に、許可が取れるか分かりますか？', answer: '用途地域、道路、避難、消防などは、図面と公開情報である程度判定できます。当社の「ホテル・民泊 開業診断」で、購入前に確認できます。' },
          { question: '許可が出たあとに名義を変えられますか？', answer: '旅館業の許可は営業者ごとのため、営業者が変わる場合は区の手続きが必要です。相続・合併・分割・事業譲渡の場合は、許可を引き継ぐ承継の手続きがあります。事前に保健所に確認してください。' },
        ],
        ctaTitle: '購入前に、旅館業ができる物件か確認する',
        ctaDescription: '旅館業の案件を30件以上手がけてきた自由不動産が、用途地域・消防・建築の見通しを確認します。日本語・英語・中国語で対応します。',
        sources: [
          { label: '台東区「旅館業のてびき」（令和7年版）', url: TAITO_TEBIKI },
          { label: '台東区 旅館業の許可（よくある質問）', url: TAITO_FAQ },
          { label: '北区保健所「旅館業のてびき」', url: KITA_TEBIKI },
          { label: '大田区 旅館業の手続き', url: OTA_RYOKAN },
          { label: '中央区 旅館業', url: CHUO_RYOKAN },
          { label: '国土交通省 改正建築基準法（2019年6月25日施行）', url: MLIT_2019 },
          { label: '新宿区 旅館業営業許可申請書（手数料の記載）', url: SHINJUKU_FEE },
          { label: '消防庁 消防法令適合通知書の交付について（通知）', url: FDMA_TEKIGO },
        ],
      },
      en: {
        category: 'Hotels & ryokan',
        title: 'How Long Does a Ryokan or Hotel License Take in Tokyo, and What Does It Cost?',
        excerpt: 'The steps to a lodging business licence (ryokangyo kyoka) in Tokyo\'s 23 wards, the time each ward says to expect, application fees, and where the real costs come from.',
        seoDescription: 'Japan hotel and ryokan licence in Tokyo: the step-by-step process, timelines published by Kita and Taito wards, application fees by ward, and the fire-safety and building work that drive the real cost.',
        intro: "Getting a lodging business licence (ryokangyo kyoka, the licence behind hotels, ryokan and guesthouses) in Tokyo's 23 wards usually takes a few months from first consultation to licence, before counting any building work. Ward guidance points to 20 business days from completion of the premises to licence (Kita Ward); the survey, design, building and fire discussions and works before that vary widely by building. The application fee itself is JPY 11,000 to 30,600; most of the cost is fire-safety equipment, building compliance work and professional fees, which depend heavily on the building.",
        keyTakeaways: [
          'Steps: consultation → notify neighbours → building and fire consultations → application → on-site inspection → licence',
          'Taito Ward: licence about 1 week to 10 days after a clean inspection (if a school is nearby and other agencies must be consulted, that inquiry usually takes 1 to 1.5 months)',
          'Kita Ward: 20 business days from completion (48 if other agencies must be consulted)',
          'Fees vary by ward, e.g. JPY 16,500 for a simple lodging (kan-i shukusho) and JPY 30,600 for a ryokan/hotel licence in Kita, Shinjuku and Ota',
          'Fire equipment and building compliance drive the real cost, so check the building before you buy',
        ],
        sections: [
          {
            id: 'flow',
            heading: 'What are the steps?',
            paragraphs: [
              'Short answer: you start with a consultation at the ward health centre (hokenjo), bring the building up to building and fire standards, apply, and receive the licence after the health centre inspects the premises. Wards differ in detail, but the backbone is the same.',
              'Taito Ward requires you to notify neighbours before construction starts and file a report. Kita Ward also puts a zoning check and neighbour notice before the application. Ota Ward requires a booked consultation and does not accept online applications.',
            ],
            diagram: {
              kind: 'flow',
              title: 'Typical licence process in Tokyo\'s 23 wards',
              steps: [
                { label: 'Check zoning and the building', detail: 'Is a hotel or ryokan allowed here?' },
                { label: 'Consult the health centre', detail: 'Bring drawings; some wards need a booking' },
                { label: 'Notify neighbours', detail: 'Before construction; many wards want a report' },
                { label: 'Building and fire consultations', detail: 'Ward building office and local fire station' },
                { label: 'Works and application', detail: 'Forms, drawings and fee' },
                { label: 'Inspections', detail: 'Building and fire first, then the health centre' },
                { label: 'Licence and opening', detail: 'Licence certificate issued' },
              ],
            },
          },
          {
            id: 'how-long',
            heading: 'How long does it take?',
            paragraphs: [
              'Short answer: ward guidance puts completion-to-licence at about a month (Kita Ward: 20 business days). The time before that, for property checks, design, building and fire discussions and works, varies widely by building and decides the overall length.',
              'Kita Ward points to 20 days (excluding weekends and holidays) from completion of the premises, or 48 days when other agencies must be consulted. Taito Ward says a licence follows about 1 week to 10 days after a clean inspection; for premises within 110 m of a school, the ward must consult other agencies, which usually takes 1 to 1.5 months.',
              'Most delays happen before the application: zoning that does not allow lodging, stairs or escape routes that fail the rules, or fire equipment that must be added. These usually surface at the drawing stage, and redesign time becomes delay.',
            ],
            table: {
              caption: 'Ward timelines (checked October 2026)',
              headers: ['Ward', 'Stage', 'Guide'],
              rows: [
                ['Taito', 'Inquiry to other agencies when within 110 m of a school', 'Usually 1 to 1.5 months'],
                ['Taito', 'Inspection to licence', 'About 1 week to 10 days'],
                ['Kita', 'Completion of premises to licence', '20 business days'],
                ['Kita', 'Same, where other agencies are consulted', '48 business days'],
              ],
            },
          },
          {
            id: 'fees',
            heading: 'What is the application fee?',
            paragraphs: [
              'Short answer: about JPY 11,000 to 16,500 for a simple lodging licence and JPY 22,000 to 30,600 for a ryokan/hotel licence. Each ward sets its own fee.',
            ],
            table: {
              caption: 'Licence application fees (ward publications, checked October 2026)',
              headers: ['Ward', 'Ryokan / hotel', 'Simple lodging (kan-i shukusho)'],
              rows: [
                ['Kita', 'JPY 30,600', 'JPY 16,500'],
                ['Shinjuku', 'JPY 30,600', 'JPY 16,500'],
                ['Ota', 'JPY 30,600', 'JPY 16,500'],
                ['Chuo', 'JPY 22,000', 'JPY 11,000'],
              ],
            },
          },
          {
            id: 'cost-drivers',
            heading: 'What drives the real cost?',
            paragraphs: [
              'Short answer: fire-safety equipment and the work needed to meet the Building Standards Act cost far more than the fee. How much is needed depends on floors, floor area, number of staircases and structure, so it has to be estimated building by building.',
              'If the area changing use is 200 m² or less, no building confirmation application is needed, but the building must still comply. No application does not mean no works.',
            ],
            bullets: [
              'Fire safety: automatic fire alarm (a simplified system for small buildings), exit signs, extinguishers, flame-retardant curtains and carpets',
              'Building: enclosure of stairwells, escape routes, interior finish rules; three-storey houses need extra care',
              'Facilities: a front desk or an approved substitute, enough toilets and washbasins',
              'Professionals: architect (drawings and compliance), administrative scrivener (gyoseishoshi, the application), fire equipment contractor',
              'Neighbour notice: explanations and paperwork',
            ],
          },
          {
            id: 'example',
            heading: 'Building a timeline: an illustration',
            paragraphs: ['This illustration applies the ward guidance above. It is not a figure from a real case.'],
            example: {
              title: 'Illustration: turning a house in Kita Ward into a simple lodging',
              lines: [
                'Property check, zoning, first consultation: 2 to 4 weeks',
                'Architect drawings and early talks with the building office and fire station: depends on the building (any non-compliance means redesign)',
                'Construction: depends on the building, from adding equipment to rebuilding stair enclosures',
                'Completion to licence: 20 business days (Kita Ward guide)',
                'If a school is nearby and other agencies must be consulted: Kita Ward\'s guide extends to 48 business days',
              ],
              note: 'Actual timing varies widely by ward, building and works. Check the property before fixing a purchase schedule.',
            },
          },
          {
            id: 'mistakes',
            heading: 'Common mistakes',
            paragraphs: [],
            bullets: [
              'Checking zoning after buying and finding lodging is not allowed',
              'Assuming "under 200 m² means easy" and leaving fire and building works out of the budget',
              'Fixing an opening date before allowing for neighbour notice and consultation bookings',
              'Missing ward rules such as a staffed front desk or distance from schools',
            ],
          },
        ],
        faq: [
          { question: 'Is there an official processing time?', answer: 'We found no ward publishing a formal "standard processing period". Kita Ward gives 20 business days from completion and Taito Ward about 1 week to 10 days after inspection as guides.' },
          { question: 'Can a foreigner or overseas resident get the licence?', answer: 'There is no nationality requirement; the licence is issued to the operator. You do need people in Japan who can attend consultations and inspections and respond to emergencies.' },
          { question: 'Can I find out before buying whether a licence is possible?', answer: 'Zoning, road access, escape routes and fire requirements can largely be judged from drawings and public data. Our hotel and minpaku feasibility check does this before you buy.' },
          { question: 'Can the licence be transferred when I sell?', answer: 'Licences belong to the operator, so a new operator generally needs the ward process. Inheritance, mergers, company splits and business transfers have a succession procedure. Confirm with the health centre in advance.' },
        ],
        ctaTitle: 'Check the building before you buy',
        ctaDescription: 'Ziyou Real Estate has worked on 30+ ryokan licence projects and checks zoning, fire and building issues in English, Japanese and Chinese. This guide is general information, not legal advice for a specific case.',
        sources: [
          { label: 'Taito Ward ryokan licence handbook, FY2025 (Japanese)', url: TAITO_TEBIKI },
          { label: 'Taito Ward ryokan licence FAQ (Japanese)', url: TAITO_FAQ },
          { label: 'Kita Ward health centre ryokan handbook (Japanese)', url: KITA_TEBIKI },
          { label: 'Ota Ward ryokan licence procedure (Japanese)', url: OTA_RYOKAN },
          { label: 'Chuo Ward ryokan licence (Japanese)', url: CHUO_RYOKAN },
          { label: 'MLIT: amended Building Standards Act in force 25 June 2019 (Japanese)', url: MLIT_2019 },
          { label: 'Shinjuku Ward ryokan licence application form with fees (Japanese)', url: SHINJUKU_FEE },
          { label: 'FDMA notice on fire-code compliance notices (Japanese)', url: FDMA_TEKIGO },
        ],
      },
      'zh-TW': {
        category: '飯店・旅館',
        title: '在東京取得旅館業許可要多久、花多少錢？流程與費用拆解',
        excerpt: '整理東京23區取得旅館業許可（簡易宿所、旅館・飯店營業）的流程、各區公布的時間參考、申請規費，以及費用容易膨脹的地方。',
        seoDescription: '東京23區旅館業許可（簡易宿所、旅館飯店營業）需要多久、多少錢？從事前諮詢到取得許可的流程、北區與台東區的時間參考、各區申請規費、消防與建築工程對費用的影響。',
        intro: '在東京23區取得旅館業許可，即使不算建物工程，從事前諮詢到拿到許可，實務上也要抓幾個月。依各區公布的參考，設施完工到許可約20個工作日（北區）；在此之前的調查、設計、與建築・消防的協調及施工，依建物差異很大。申請規費本身只要數萬日圓，費用大頭在消防設備、建築法規的改善工程與專家報酬，依物件差異很大。',
        keyTakeaways: [
          '流程：事前諮詢 → 通知鄰居 → 與建築・消防協商 → 申請 → 現場檢查 → 許可',
          '台東區參考：現場檢查無問題時，約1週到10天取得許可（靠近學校等需徵詢相關機關時，徵詢通常需1〜1.5個月）',
          '北區參考：設施完工後約20個工作日（需徵詢其他機關時為48天）',
          '規費依區而異（例：北區、新宿區、大田區簡易宿所16,500日圓，旅館・飯店30,600日圓）',
          '真正左右費用的是消防設備與建築改善工程，購買前就要評估',
        ],
        sections: [
          {
            id: 'flow',
            heading: '取得許可的流程？',
            paragraphs: [
              '簡答：先到保健所事前諮詢，讓建物符合建築與消防標準後提出申請，通過保健所現場檢查即可取得許可。各區細節略有不同，但骨架相同。',
              '台東區規定動工前要通知附近居民並提交報告；北區也把用途地域確認與通知鄰居放在申請之前；大田區的事前諮詢須預約，且不受理線上申請。',
            ],
            diagram: {
              kind: 'flow',
              title: '東京23區旅館業許可的一般流程',
              steps: [
                { label: '確認用途地域與物件', detail: '這裡能蓋旅館・飯店嗎' },
                { label: '保健所事前諮詢', detail: '攜帶圖面，部分區需預約' },
                { label: '通知鄰居', detail: '動工前，多數區要提交報告' },
                { label: '與建築・消防協商', detail: '區建築課與轄區消防署' },
                { label: '施工・申請', detail: '申請書、圖面、規費' },
                { label: '檢查', detail: '建築、消防合格後由保健所檢查設施' },
                { label: '許可・開業', detail: '核發許可證' },
              ],
            },
          },
          {
            id: 'how-long',
            heading: '需要多久？',
            paragraphs: [
              '簡答：各區的參考是設施完工到許可約1個月（北區：扣除週末假日20天）。在此之前的物件調查、設計、與建築・消防協調與施工的時間，依建物差異很大，決定了整體長度。',
              '北區的參考是設施完工後扣除週末假日20天，需要徵詢其他機關的設施為48天。台東區表示現場檢查沒有問題時，約1週到10天取得許可；距學校等110m以內的設施需徵詢相關機關，通常需要1個月到1個半月。',
              '最容易拖延的是申請之前：用途地域不符、樓梯或避難路線不合規、需要追加消防設備等，多半在圖面階段才發現，重新設計的時間就直接變成延誤。',
            ],
            table: {
              caption: '各區公布的時間參考（2026年10月確認）',
              headers: ['區', '階段', '參考'],
              rows: [
                ['台東區', '距學校等110m以內時徵詢相關機關', '通常1個月〜1個半月'],
                ['台東區', '現場檢查到許可', '約1週〜10天'],
                ['北區', '設施完工到許可', '扣除週末假日20天'],
                ['北區', '同上（需徵詢其他機關）', '扣除週末假日48天'],
              ],
            },
          },
          {
            id: 'fees',
            heading: '申請規費多少？',
            paragraphs: ['簡答：簡易宿所約1萬多日圓，旅館・飯店營業約2〜3萬日圓，由各區條例訂定。'],
            table: {
              caption: '旅館業申請規費（各區公布資料，2026年10月確認）',
              headers: ['區', '旅館・飯店營業', '簡易宿所營業'],
              rows: [
                ['北區', '30,600日圓', '16,500日圓'],
                ['新宿區', '30,600日圓', '16,500日圓'],
                ['大田區', '30,600日圓', '16,500日圓'],
                ['中央區', '22,000日圓', '11,000日圓'],
              ],
            },
          },
          {
            id: 'cost-drivers',
            heading: '什麼會大幅影響費用？',
            paragraphs: [
              '簡答：遠比規費高的，是消防設備與符合《建築基準法》的改善工程。需要做到什麼程度，取決於樓層數、面積、樓梯數量與結構，只能逐件估算。',
              '變更用途的面積在200㎡以下時，不需要申請建築確認，但仍有符合法規的義務。「不用申請」不等於「不用施工」。',
            ],
            bullets: [
              '消防：自動火災警報設備（小規模可用簡易型）、避難指示燈、滅火器、防焰窗簾地毯等',
              '建築：樓梯間區劃、避難路線、內裝限制等，3層樓特別要注意',
              '設備：櫃台或替代設備、廁所與洗手台數量',
              '專家：建築師（圖面與法規確認）、行政書士（申請文件）、消防設備業者',
              '鄰里：說明與文件',
            ],
          },
          {
            id: 'example',
            heading: '時程試算範例',
            paragraphs: ['以下套用各區參考試算，並非實際案件數字。'],
            example: {
              title: '範例：把北區獨棟改為簡易宿所（說明用）',
              lines: [
                '物件調查、用途地域確認、事前諮詢：2〜4週',
                '建築師畫圖並與建築課・消防署事前諮詢：依建物而定（發現不合規處就要重新設計）',
                '施工：依建物而定（只加設備或需做區劃工程，差很多）',
                '完工到許可：扣除週末假日20天（北區參考）',
                '靠近學校等需徵詢相關機關時：北區參考延長為48天',
              ],
              note: '依區、建物、工程內容差異很大。安排購買時程前，請先逐件確認。',
            },
          },
          {
            id: 'mistakes',
            heading: '常見失誤',
            paragraphs: [],
            bullets: [
              '買了才查用途地域，發現不能做旅館業',
              '以為「200㎡以下就很簡單」，沒把消防與建築工程算進預算',
              '沒算入通知鄰居與諮詢預約的時間，就先決定開業日',
              '沒確認區條例（櫃台常駐、與學校的距離等）',
            ],
          },
        ],
        faq: [
          { question: '有官方的標準處理期間嗎？', answer: '我們沒有找到以「標準處理期間」名稱公布的區。北區以完工後20個工作日、台東區以檢查後約1週到10天作為參考。' },
          { question: '外國人或住在海外也能取得許可嗎？', answer: '許可核發給經營者，沒有國籍限制。但需要能在日本出席諮詢與檢查、處理緊急狀況的體制。' },
          { question: '買之前能知道能否取得許可嗎？', answer: '用途地域、道路、避難、消防等，多半可從圖面與公開資訊判斷。可利用本公司的「飯店・民宿開業診斷」在購買前確認。' },
          { question: '賣房時許可能轉移嗎？', answer: '許可屬於經營者，經營者變更通常需重新辦理區的手續；繼承、合併、分割、事業讓渡等情況另有承繼程序，請事先向保健所確認。' },
        ],
        ctaTitle: '購買前先確認能否經營旅館業',
        ctaDescription: '經手旅館業案件30件以上的自由不動產，可用中文、日文、英文為您確認用途地域、消防與建築的可行性。本文為一般資訊，並非個案法律意見。',
        sources: [
          { label: '台東區《旅館業手冊》令和7年版（日文）', url: TAITO_TEBIKI },
          { label: '台東區 旅館業許可常見問題（日文）', url: TAITO_FAQ },
          { label: '北區保健所《旅館業手冊》（日文）', url: KITA_TEBIKI },
          { label: '大田區 旅館業手續（日文）', url: OTA_RYOKAN },
          { label: '中央區 旅館業（日文）', url: CHUO_RYOKAN },
          { label: '國土交通省 修正建築基準法（2019年6月25日施行，日文）', url: MLIT_2019 },
          { label: '新宿區 旅館業營業許可申請書（含規費，日文）', url: SHINJUKU_FEE },
          { label: '消防廳 消防法令適合通知書核發通知（日文）', url: FDMA_TEKIGO },
        ],
      },
      'zh-CN': {
        category: '酒店・旅馆',
        title: '在东京取得旅馆业许可要多久、花多少钱？流程与费用拆解',
        excerpt: '梳理东京23区取得旅馆业许可（简易宿所、旅馆・酒店营业）的流程、各区公布的时间参考、申请手续费，以及费用容易超支的环节。',
        seoDescription: '东京23区旅馆业许可（简易宿所、旅馆酒店营业）需要多久、多少钱？从事前咨询到取得许可的流程、北区与台东区的时间参考、各区申请手续费、消防与建筑改造对成本的影响。',
        intro: '在东京23区取得旅馆业许可，即使不算改造工期，从事前咨询到拿到许可，实际也要按几个月来规划。按各区公布的参考，设施完工到许可约20个工作日（北区）；在此之前的调查、设计、与建筑・消防的协调及施工，因建筑差异很大。申请手续费只要几万日元，成本大头在消防设备、建筑法规改造工程和专业人士报酬，因物业而差异很大。',
        keyTakeaways: [
          '流程：事前咨询 → 告知邻居 → 与建筑・消防协商 → 申请 → 现场检查 → 许可',
          '台东区参考：现场检查无问题时，约1周到10天取得许可（靠近学校等需征询相关机关时，征询通常需1〜1.5个月）',
          '北区参考：设施完工后约20个工作日（需征询其他机关时为48天）',
          '手续费因区而异（例：北区、新宿区、大田区简易宿所16,500日元，旅馆・酒店30,600日元）',
          '真正决定成本的是消防设备与建筑改造，购买前就要评估',
        ],
        sections: [
          {
            id: 'flow',
            heading: '取得许可的流程？',
            paragraphs: [
              '简答：先到保健所事前咨询，让建筑符合建筑与消防标准后提交申请，通过保健所现场检查即可取得许可。各区细节略有差异，但主干相同。',
              '台东区要求动工前告知周边居民并提交报告；北区也把用途地域确认与告知邻居放在申请之前；大田区的事前咨询须预约，且不接受线上申请。',
            ],
            diagram: {
              kind: 'flow',
              title: '东京23区旅馆业许可的一般流程',
              steps: [
                { label: '确认用途地域与物业', detail: '这里能建旅馆・酒店吗' },
                { label: '保健所事前咨询', detail: '携带图纸，部分区需预约' },
                { label: '告知邻居', detail: '动工前，多数区要求提交报告' },
                { label: '与建筑・消防协商', detail: '区建筑课与辖区消防署' },
                { label: '施工・申请', detail: '申请书、图纸、手续费' },
                { label: '检查', detail: '建筑、消防合格后由保健所检查设施' },
                { label: '许可・开业', detail: '颁发许可证' },
              ],
            },
          },
          {
            id: 'how-long',
            heading: '需要多久？',
            paragraphs: [
              '简答：各区的参考是设施完工到许可约1个月（北区：扣除周末节假日20天）。在此之前的物业调查、设计、与建筑・消防协调和施工的时间，因建筑差异很大，决定了整体时长。',
              '北区的参考是设施完工后扣除周末节假日20天，需征询其他机关的设施为48天。台东区表示现场检查无问题时约1周到10天取得许可；距学校等110m以内的设施需征询相关机关，通常需要1到1.5个月。',
              '最容易拖延的是申请之前：用途地域不符、楼梯或疏散路线不合规、需要追加消防设备等，大多在图纸阶段才发现，重新设计的时间就直接变成延误。',
            ],
            table: {
              caption: '各区公布的时间参考（2026年10月确认）',
              headers: ['区', '阶段', '参考'],
              rows: [
                ['台东区', '距学校等110m以内时征询相关机关', '通常1〜1.5个月'],
                ['台东区', '现场检查到许可', '约1周〜10天'],
                ['北区', '设施完工到许可', '扣除周末节假日20天'],
                ['北区', '同上（需征询其他机关）', '扣除周末节假日48天'],
              ],
            },
          },
          {
            id: 'fees',
            heading: '申请手续费多少？',
            paragraphs: ['简答：简易宿所约1万多日元，旅馆・酒店营业约2〜3万日元，由各区条例规定。'],
            table: {
              caption: '旅馆业申请手续费（各区公布资料，2026年10月确认）',
              headers: ['区', '旅馆・酒店营业', '简易宿所营业'],
              rows: [
                ['北区', '30,600日元', '16,500日元'],
                ['新宿区', '30,600日元', '16,500日元'],
                ['大田区', '30,600日元', '16,500日元'],
                ['中央区', '22,000日元', '11,000日元'],
              ],
            },
          },
          {
            id: 'cost-drivers',
            heading: '什么会大幅影响成本？',
            paragraphs: [
              '简答：远比手续费高的，是消防设备与符合《建筑基准法》的改造工程。需要做到什么程度，取决于层数、面积、楼梯数量与结构，只能逐套估算。',
              '变更用途的面积在200㎡以下时，不需要申请建筑确认，但仍须符合法规。「不用申请」不等于「不用施工」。',
            ],
            bullets: [
              '消防：自动火灾报警设备（小规模可用简易型）、疏散指示灯、灭火器、防焰窗帘地毯等',
              '建筑：楼梯间分隔、疏散路线、内装限制等，3层楼尤其要注意',
              '设施：前台或替代设备、卫生间与洗手台数量',
              '专业人士：建筑师（图纸与合规确认）、行政书士（申请材料）、消防设备公司',
              '邻里：说明与文件',
            ],
          },
          {
            id: 'example',
            heading: '时间规划示例',
            paragraphs: ['以下套用各区参考进行估算，并非真实案例数据。'],
            example: {
              title: '示例：把北区独栋改为简易宿所（说明用）',
              lines: [
                '物业调查、用途地域确认、事前咨询：2〜4周',
                '建筑师出图并与建筑课・消防署事前咨询：视建筑而定（发现不合规处就要重新设计）',
                '施工：视建筑而定（只加设备还是需要做分隔工程，差别很大）',
                '完工到许可：扣除周末节假日20天（北区参考）',
                '靠近学校等需征询相关机关时：北区参考延长为48天',
              ],
              note: '因区、建筑、工程内容差异很大。确定购买时间表前，请先逐套确认。',
            },
          },
          {
            id: 'mistakes',
            heading: '常见失误',
            paragraphs: [],
            bullets: [
              '买完才查用途地域，发现不能做旅馆业',
              '以为「200㎡以下就很简单」，没把消防与建筑工程算进预算',
              '没算告知邻居与咨询预约的时间，就先定了开业日',
              '没确认区条例（前台常驻、与学校的距离等）',
            ],
          },
        ],
        faq: [
          { question: '有官方的标准处理期限吗？', answer: '我们没有找到以「标准处理期间」名称公布的区。北区以完工后20个工作日、台东区以检查后约1周到10天作为参考。' },
          { question: '外国人或住在海外也能取得许可吗？', answer: '许可颁发给经营者，没有国籍限制。但需要能在日本出席咨询与检查、处理紧急情况的团队。' },
          { question: '买之前能知道能否取得许可吗？', answer: '用途地域、道路、疏散、消防等，大多可从图纸与公开信息判断。可通过本公司的「酒店・民宿开业诊断」在购买前确认。' },
          { question: '卖房时许可能转让吗？', answer: '许可属于经营者，经营者变更通常需重新办理区的手续；继承、合并、分立、业务转让等情况另有承继程序，请事先向保健所确认。' },
        ],
        ctaTitle: '购买前先确认能否经营旅馆业',
        ctaDescription: '经手旅馆业项目30件以上的自由不动产，可用中文、日文、英文为您确认用途地域、消防与建筑的可行性。本文为一般信息，并非个案法律意见。',
        sources: [
          { label: '台东区《旅馆业手册》令和7年版（日文）', url: TAITO_TEBIKI },
          { label: '台东区 旅馆业许可常见问题（日文）', url: TAITO_FAQ },
          { label: '北区保健所《旅馆业手册》（日文）', url: KITA_TEBIKI },
          { label: '大田区 旅馆业手续（日文）', url: OTA_RYOKAN },
          { label: '中央区 旅馆业（日文）', url: CHUO_RYOKAN },
          { label: '国土交通省 修订建筑基准法（2019年6月25日施行，日文）', url: MLIT_2019 },
          { label: '新宿区 旅馆业营业许可申请书（含手续费，日文）', url: SHINJUKU_FEE },
          { label: '消防厅 消防法令适合通知书颁发通知（日文）', url: FDMA_TEKIGO },
        ],
      },
    },
  },
  // ───────────────────────────── 2. Converting a house ─────────────────────────────
  {
    slug: 'convert-house-to-ryokan-tokyo-requirements',
    publishedAt: '2026-10-20',
    updatedAt: '2026-10-20',
    readMinutes: 8,
    tags: ['hospitality', 'ryokan license', 'detached house', 'conversion'],
    locales: {
      ja: {
        category: 'ホテル・旅館',
        title: '戸建・空き家を旅館業（簡易宿所）にできる条件は？購入前に見る5つのポイント',
        excerpt: '東京23区で戸建や小さなビルを旅館業の施設に転用するための条件を、用途地域・建築基準法・消防・面積基準・区の条例の5つに分けて整理します。',
        seoDescription: '戸建・空き家を旅館業（簡易宿所）に転用する条件。旅館・ホテルが可能な用途地域、200㎡以下の用途変更、3階建て200㎡未満の特例、消防設備、簡易宿所の面積基準、台東区・北区・新宿区の条例を解説。',
        intro: '戸建を旅館業の施設にできるかは、まず用途地域で決まります。第一種・第二種低層住居専用地域や中高層住居専用地域では旅館・ホテルは建てられません。用途地域を通過したら、建築基準法（避難・階段の区画）、消防設備、簡易宿所の面積基準、区の条例の順に確認します。200㎡以下なら建築確認の申請は不要ですが、基準への適合は必要です。',
        keyTakeaways: [
          '最初の関門は用途地域。低層住居専用・中高層住居専用・工業地域などでは旅館・ホテルは不可',
          '用途変更が200㎡以下なら建築確認の申請は不要（2019年6月25日施行）。ただし基準への適合は必須',
          '3階建て・200㎡未満は、警報設備などを設ければ耐火建築物にしなくてよい特例がある',
          '1〜2階建ての戸建は、主に特定小規模施設用の自動火災報知設備で対応できる',
          '帳場（フロント）や学校からの距離など、区の条例で条件が上乗せされる',
        ],
        sections: [
          {
            id: 'zoning',
            heading: '① 用途地域：その場所で旅館業ができる？',
            paragraphs: [
              '答え：旅館・ホテルが建てられる用途地域でなければ、建物がどれだけ良くても許可は出ません。物件資料の「用途地域」欄を最初に確認します。',
            ],
            table: {
              caption: '用途地域とホテル・旅館（東京都都市整備局の用途制限表より）',
              headers: ['用途地域', 'ホテル・旅館'],
              rows: [
                ['第一種・第二種低層住居専用地域、田園住居地域', '不可'],
                ['第一種・第二種中高層住居専用地域', '不可'],
                ['第一種住居地域', '3,000㎡以下なら可'],
                ['第二種住居地域、準住居地域', '可'],
                ['近隣商業地域、商業地域、準工業地域', '可'],
                ['工業地域、工業専用地域', '不可'],
              ],
            },
          },
          {
            id: 'building',
            heading: '② 建築基準法：200㎡と3階建てがカギ',
            paragraphs: [
              '答え：用途を変える部分が200㎡以下なら建築確認の申請は不要です。ただし、確認申請がいらないだけで、建築基準法と消防法に適合させる義務はそのまま残ります。',
              'この「200㎡」は、2019年6月25日に全面施行された改正建築基準法で、それまでの100㎡から引き上げられました。',
              'また同じ改正で、延べ面積200㎡未満・3階以下の建物は、必要な措置を講じれば耐火建築物などにしなくてよくなりました。宿泊のように就寝に使う用途では、自動火災報知設備などの警報設備を設けることが条件です。',
              '3階建ての戸建では、階段まわりの区画（竪穴区画）が問題になりやすく、扉の性能などの細かい要件があります。旅館への当てはめは建物ごとに判断が分かれるため、建築士の確認が欠かせません。',
            ],
          },
          {
            id: 'fire',
            heading: '③ 消防：必要な設備は階数で変わる',
            paragraphs: [
              '答え：1〜2階建ての住宅なら、主に特定小規模施設用の自動火災報知設備で対応できます。3階以上や地下がある建物は、原則として通常の自動火災報知設備が必要です。',
              '申請では、消防署が発行する「消防法令適合通知書」を保健所に提出します。消防署が立入検査をして、基準に合っていれば交付されます。',
            ],
            bullets: [
              '1〜2階建て：主に特定小規模施設用自動火災報知設備',
              '3階以上・地下あり：原則として自動火災報知設備',
              '屋内階段が1つだけの建物は、感知器の規制が厳しくなる',
              '誘導灯：出入口・通路・階段（見通しがきく場合は免除される箇所あり）',
              'カーテン・じゅうたんは防炎物品',
              '消火器：台所。延べ150㎡以上なら建物全体',
            ],
          },
          {
            id: 'area',
            heading: '④ 面積と設備：簡易宿所の基準',
            paragraphs: [
              '答え：簡易宿所は客室の延床面積33㎡以上が原則ですが、宿泊者を10人未満にする場合は「3.3㎡×宿泊者数」以上で足ります（2016年4月施行）。小さな戸建でも、定員を絞れば基準を満たせることがあります。',
              '玄関帳場（フロント）は、2018年6月施行の改正で、本人確認や鍵の受け渡し、緊急時の対応ができる設備があれば代替できるようになりました。ただし区の条例で別の定めがあることに注意してください。',
            ],
            example: {
              title: '例：定員の考え方（説明用）',
              lines: [
                '客室の延床面積が20㎡の場合',
                '20㎡ ÷ 3.3㎡ = 約6.06 → 宿泊者は6人まで',
                '33㎡に届かなくても、定員6人（10人未満）なら面積基準を満たす',
              ],
              note: '客室の数え方や他の設備基準は区の条例・保健所の運用で確認してください。',
            },
          },
          {
            id: 'ward-rules',
            heading: '⑤ 区の条例：上乗せ条件',
            paragraphs: [
              '答え：同じ東京23区でも、区によって条件が違います。購入前に、物件がある区の手引きを必ず確認します。',
            ],
            bullets: [
              '台東区：対面できる玄関帳場を設け、営業時間中は従事者を常駐。学校などから110m以内は不許可になる場合がある',
              '北区：居住型（5室以下・定員10人以下）は帳場不要。不在型の簡易宿所も、5室以下・定員10人以下で、防犯カメラ（72時間以上保存）や概ね10分以内の駆けつけ体制などの代替措置をとれば帳場を設けなくてよい',
              '新宿区：旅館用途の延床面積を200㎡超とする最低規模や、帳場の設置・従業員の常駐を求める条例改正案が出ている（2026年10月時点で未成立）',
            ],
          },
          {
            id: 'checklist',
            heading: '購入前チェックリスト',
            paragraphs: [],
            bullets: [
              '用途地域は旅館・ホテルが可能な地域か',
              '用途を変える面積は200㎡以下か、超えるか',
              '階数（3階建てか）と、屋内階段の数',
              '必要な消防設備と、その工事の見通し',
              '客室面積と、想定する定員',
              '区の条例（帳場、学校からの距離、近隣周知）',
              '検査済証の有無（台東区は施設完成後に写しの提出を求めている）',
            ],
          },
        ],
        faq: [
          { question: '再建築不可の戸建でも旅館業はできますか？', answer: '再建築不可かどうかと旅館業の可否は別の問題ですが、道路や避難の条件が厳しい物件では消防・建築の協議が難しくなりがちです。個別に確認が必要です。' },
          { question: '検査済証がない古い戸建でも大丈夫ですか？', answer: '区によっては施設完成後に検査済証の写しの提出を求めます。ない場合の扱いは区と建物の状況によるため、購入前に保健所・建築士への確認をおすすめします。' },
          { question: '民泊（住宅宿泊事業）なら条件は緩いですか？', answer: '住宅のまま届出で営業できる一方、年180日の上限と区の上乗せ規制があります。365日営業したい場合は旅館業の許可が必要です。' },
        ],
        ctaTitle: '気になる戸建が旅館業にできるか確認する',
        ctaDescription: '用途地域・道路・避難・消防などを、図面と公開情報で購入前に判定します。日本語・英語・中国語で対応します。',
        sources: [
          { label: '東京都都市整備局 用途地域による建築物の用途制限', url: TOKYO_ZONING },
          { label: '国土交通省 改正建築基準法の施行（2019年6月25日）', url: MLIT_2019 },
          { label: '国土交通省 用途変更の確認申請（200㎡）の解説', url: MLIT_200SQM },
          { label: '東京消防庁 民泊の消防用設備等に関するQ&A', url: TFD_MINPAKU },
          { label: '厚生労働省 旅館業法施行令改正（簡易宿所の面積基準）', url: MHLW_2016 },
          { label: '厚生労働省 旅館業法の改正（2018年施行）', url: MHLW_2018 },
          { label: '台東区「旅館業のてびき」', url: TAITO_TEBIKI },
          { label: '北区保健所「旅館業のてびき」', url: KITA_TEBIKI },
          { label: '国土交通省 改正建築基準法の技術的解説（3階建て・200㎡未満、竪穴区画）', url: MLIT_TECH },
          { label: '厚生労働省 旅館業法施行令等の改正通知（2018年6月15日施行、玄関帳場）', url: MHLW_2018_DECREE },
          { label: '消防庁 消防法令適合通知書の交付について（通知）', url: FDMA_TEKIGO },
          { label: '新宿区 旅館業条例等の改正案', url: SHINJUKU_RYOKAN_DRAFT },
        ],
      },
      en: {
        category: 'Hotels & ryokan',
        title: 'Can You Turn a House in Tokyo into a Ryokan or Guesthouse? 5 Checks Before You Buy',
        excerpt: 'What it takes to convert a detached house or small building in Tokyo\'s 23 wards into licensed lodging: zoning, the Building Standards Act, fire safety, floor-area rules and ward bylaws.',
        seoDescription: 'Converting a Tokyo house into a licensed guesthouse (kan-i shukusho): zoning that allows hotels, the 200 m² change-of-use rule, the three-storey exemption, fire alarms, the 3.3 m² per guest rule and ward bylaws.',
        intro: "Whether a house can become a licensed lodging starts with zoning: hotels and ryokan are not allowed in low-rise or mid/high-rise exclusive residential zones. If the zoning passes, check the Building Standards Act (escape routes and stair enclosures), fire equipment, floor-area rules for simple lodgings, and ward bylaws, in that order. Below 200 m² no building confirmation application is needed, but the building must still comply.",
        keyTakeaways: [
          'Zoning is the first gate; hotels and ryokan are not allowed in exclusive residential or industrial zones',
          'Change of use of 200 m² or less needs no confirmation application (since 25 June 2019), but compliance is still required',
          'Buildings under 200 m² and up to three storeys can avoid fire-resistive construction if alarms and other measures are added',
          'One- and two-storey houses can usually use a simplified automatic fire alarm system',
          'Ward bylaws add conditions such as a front desk or distance from schools',
        ],
        sections: [
          {
            id: 'zoning',
            heading: '1. Zoning: is lodging allowed here?',
            paragraphs: ['Short answer: if the zone does not allow hotels or ryokan, no licence will be issued however good the building is. Check the zoning (yoto chiiki) line in the listing first.'],
            table: {
              caption: 'Zoning and hotels/ryokan (Tokyo Metropolitan Government use-restriction table)',
              headers: ['Zone', 'Hotel / ryokan'],
              rows: [
                ['Category 1 and 2 low-rise exclusive residential; rural residential', 'Not allowed'],
                ['Category 1 and 2 mid/high-rise exclusive residential', 'Not allowed'],
                ['Category 1 residential', 'Allowed up to 3,000 m²'],
                ['Category 2 residential; quasi-residential', 'Allowed'],
                ['Neighbourhood commercial; commercial; quasi-industrial', 'Allowed'],
                ['Industrial; exclusive industrial', 'Not allowed'],
              ],
            },
          },
          {
            id: 'building',
            heading: '2. Building rules: 200 m² and three storeys',
            paragraphs: [
              'Short answer: if the area changing use is 200 m² or less, no building confirmation application is required. The building still has to meet the Building Standards Act and the Fire Service Act.',
              'The 200 m² threshold (up from 100 m²) came with the amended Building Standards Act, fully in force from 25 June 2019.',
              'The same amendment lets buildings under 200 m² with up to three storeys avoid fire-resistive construction if required measures are taken; for sleeping uses such as lodging, that means installing a fire alarm system.',
              'In three-storey houses the enclosure of the stairwell is a frequent problem, with detailed door requirements. How this applies to a given ryokan plan differs case by case, so an architect\'s review is essential.',
            ],
          },
          {
            id: 'fire',
            heading: '3. Fire safety: equipment depends on storeys',
            paragraphs: [
              'Short answer: a one- or two-storey house can usually use a simplified automatic fire alarm (tokutei shokibo shisetsu-yo). Buildings with three or more storeys or a basement generally need a standard system.',
              'The application includes a fire-code compliance notice (shobo horei tekigo tsuchisho) issued by the fire station after it inspects the building.',
            ],
            bullets: [
              'One or two storeys: mainly a simplified automatic fire alarm',
              'Three storeys or basement: standard automatic fire alarm as a rule',
              'Buildings with a single indoor staircase face stricter detector rules',
              'Exit signs at exits, corridors and stairs (some may be waived where visibility is good)',
              'Flame-retardant curtains and carpets',
              'Extinguisher in the kitchen; throughout the building at 150 m² or more',
            ],
          },
          {
            id: 'area',
            heading: '4. Floor area and facilities for a simple lodging',
            paragraphs: [
              'Short answer: a simple lodging normally needs 33 m² of guest-room floor area, but if guests are capped below 10, 3.3 m² per guest is enough (in force April 2016). Even a small house can qualify with a lower guest cap.',
              'Since the June 2018 amendment, a front desk can be replaced by equipment that handles ID checks, key handover and emergency response, but ward bylaws may still require a desk.',
            ],
            example: {
              title: 'Illustration: working out the guest cap',
              lines: [
                'Guest-room floor area: 20 m²',
                '20 m² ÷ 3.3 m² ≈ 6.06 → up to 6 guests',
                'Below 33 m², but with 6 guests (under 10) the area rule is met',
              ],
              note: 'Check how rooms are counted and other facility rules with the ward health centre.',
            },
          },
          {
            id: 'ward-rules',
            heading: '5. Ward bylaws: extra conditions',
            paragraphs: ['Short answer: conditions differ between wards. Read the handbook of the ward where the property sits before buying.'],
            bullets: [
              'Taito: a face-to-face front desk staffed during operating hours; may be refused within 110 m of a school',
              'Kita: no desk needed for owner-occupied lodgings (up to 5 rooms and 10 guests); unattended simple lodgings can skip the desk only if they also stay within 5 rooms and 10 guests and add substitutes such as CCTV kept 72+ hours and staff able to arrive in about 10 minutes',
              'Shinjuku: a proposed bylaw would set a 200 m²+ minimum floor area for ryokan use and require a staffed desk (not yet adopted as of October 2026)',
            ],
          },
          {
            id: 'checklist',
            heading: 'Checklist before buying',
            paragraphs: [],
            bullets: [
              'Zoning allows hotels/ryokan',
              'Area changing use: 200 m² or less, or more',
              'Number of storeys (three?) and indoor staircases',
              'Fire equipment needed and likely works',
              'Guest-room area and intended guest cap',
              'Ward bylaws: front desk, school distance, neighbour notice',
              'Completion certificate (kensa zumisho); Taito Ward asks for a copy after completion',
            ],
          },
        ],
        faq: [
          { question: 'Can a house that cannot be rebuilt (saikenchiku fuka) be licensed?', answer: 'The two questions are separate, but properties with poor road access or escape routes tend to make building and fire talks harder. It needs a case-by-case check.' },
          { question: 'What if an old house has no completion certificate?', answer: 'Some wards ask for a copy after completion. How a missing certificate is handled depends on the ward and the building, so check with the health centre and an architect before buying.' },
          { question: 'Is minpaku (private lodging) easier?', answer: 'Minpaku only needs a notification and the house stays residential, but it is capped at 180 nights a year and wards add limits. To operate all year you need a lodging licence.' },
        ],
        ctaTitle: 'Check whether the house can be licensed',
        ctaDescription: 'We check zoning, road access, escape routes and fire requirements on paper before you buy, in English, Japanese and Chinese. General information, not legal advice for a specific case.',
        sources: [
          { label: 'Tokyo Metropolitan Government: use restrictions by zone (Japanese)', url: TOKYO_ZONING },
          { label: 'MLIT: amended Building Standards Act in force 25 June 2019 (Japanese)', url: MLIT_2019 },
          { label: 'MLIT: 200 m² change-of-use rule explained (Japanese)', url: MLIT_200SQM },
          { label: 'Tokyo Fire Department: fire equipment Q&A for lodging (Japanese)', url: TFD_MINPAKU },
          { label: 'MHLW: simple lodging floor-area rule (Japanese)', url: MHLW_2016 },
          { label: 'MHLW: 2018 amendment of the Inns and Hotels Act (Japanese)', url: MHLW_2018 },
          { label: 'Taito Ward ryokan handbook (Japanese)', url: TAITO_TEBIKI },
          { label: 'Kita Ward ryokan handbook (Japanese)', url: KITA_TEBIKI },
          { label: 'MLIT technical notes: three-storey under-200 m² rule and stair enclosures (Japanese)', url: MLIT_TECH },
          { label: 'MHLW notice on the 2018 decree amendments, incl. front desk (Japanese)', url: MHLW_2018_DECREE },
          { label: 'FDMA notice on fire-code compliance notices (Japanese)', url: FDMA_TEKIGO },
          { label: 'Shinjuku Ward draft ryokan bylaw amendment (Japanese)', url: SHINJUKU_RYOKAN_DRAFT },
        ],
      },
      'zh-TW': {
        category: '飯店・旅館',
        title: '獨棟、空屋能改成旅館業（簡易宿所）嗎？購買前要看的5個重點',
        excerpt: '把東京23區的獨棟或小型大樓轉作旅館業設施，從用途地域、建築基準法、消防、面積基準、區條例5個面向整理條件。',
        seoDescription: '獨棟、空屋改為旅館業（簡易宿所）的條件：可經營旅館飯店的用途地域、200㎡以下的用途變更、3層樓200㎡未滿的特例、消防設備、簡易宿所面積基準、台東區・北區・新宿區條例。',
        intro: '獨棟能不能做旅館業，首先由用途地域決定。第一種・第二種低層住居專用地域與中高層住居專用地域不能蓋旅館・飯店。用途地域過關後，依序確認建築基準法（避難、樓梯間區劃）、消防設備、簡易宿所面積基準與區條例。200㎡以下不需申請建築確認，但仍須符合法規。',
        keyTakeaways: [
          '第一關是用途地域：低層住居專用、中高層住居專用、工業地域等不能經營旅館・飯店',
          '用途變更200㎡以下不需申請建築確認（2019年6月25日施行），但仍須符合法規',
          '3層樓、200㎡未滿的建物，設置警報設備等即可不必做成耐火建築物',
          '1〜2層的獨棟，多半可用特定小規模設施用自動火災警報設備',
          '櫃台、與學校距離等，區條例另有附加條件',
        ],
        sections: [
          {
            id: 'zoning',
            heading: '① 用途地域：這裡能經營旅館業嗎？',
            paragraphs: ['簡答：不是可蓋旅館・飯店的用途地域，建物再好也拿不到許可。先看物件資料的「用途地域」欄。'],
            table: {
              caption: '用途地域與飯店・旅館（東京都都市整備局用途限制表）',
              headers: ['用途地域', '飯店・旅館'],
              rows: [
                ['第一種・第二種低層住居專用地域、田園住居地域', '不可'],
                ['第一種・第二種中高層住居專用地域', '不可'],
                ['第一種住居地域', '3,000㎡以下可'],
                ['第二種住居地域、準住居地域', '可'],
                ['近鄰商業地域、商業地域、準工業地域', '可'],
                ['工業地域、工業專用地域', '不可'],
              ],
            },
          },
          {
            id: 'building',
            heading: '② 建築基準法：關鍵在200㎡與3層樓',
            paragraphs: [
              '簡答：變更用途的部分在200㎡以下，就不需申請建築確認；但符合《建築基準法》與《消防法》的義務仍在。',
              '這個「200㎡」是2019年6月25日全面施行的修正建築基準法，從原本的100㎡放寬而來。',
              '同次修法也規定，總面積200㎡未滿、3層以下的建物，採取必要措施即可不必做成耐火建築物；住宿這類睡眠用途，條件是設置自動火災警報等設備。',
              '3層樓獨棟常卡在樓梯間區劃（竪穴區劃），門的性能等要求很細。實際套用到旅館的判斷因建物而異，一定要請建築師確認。',
            ],
          },
          {
            id: 'fire',
            heading: '③ 消防：所需設備依樓層而定',
            paragraphs: [
              '簡答：1〜2層的住宅多半可用特定小規模設施用自動火災警報設備；3層以上或有地下室，原則上需要一般的自動火災警報設備。',
              '申請時要向保健所提交消防署核發的「消防法令適合通知書」，由消防署現場檢查合格後核發。',
            ],
            bullets: [
              '1〜2層：主要為特定小規模設施用自動火災警報設備',
              '3層以上或有地下室：原則上為自動火災警報設備',
              '只有一座室內樓梯的建物，偵測器規定較嚴',
              '避難指示燈：出入口、走道、樓梯（視線良好處可免設）',
              '窗簾、地毯需為防焰物品',
              '滅火器：廚房；總面積150㎡以上需全棟配置',
            ],
          },
          {
            id: 'area',
            heading: '④ 面積與設備：簡易宿所的基準',
            paragraphs: [
              '簡答：簡易宿所原則上客房總面積需33㎡以上，但住宿人數未滿10人時，只要「3.3㎡×住宿人數」以上即可（2016年4月施行）。小獨棟只要限縮人數，也可能符合。',
              '依2018年6月施行的修法，櫃台可由能完成身分確認、交付鑰匙、緊急應變的設備替代；但區條例可能另有規定。',
            ],
            example: {
              title: '範例：住宿人數的算法（說明用）',
              lines: [
                '客房總面積20㎡',
                '20㎡ ÷ 3.3㎡ ≈ 6.06 → 最多6人',
                '雖未達33㎡，但6人（未滿10人）即符合面積基準',
              ],
              note: '客房的計算方式與其他設備基準，請向保健所確認。',
            },
          },
          {
            id: 'ward-rules',
            heading: '⑤ 區條例：附加條件',
            paragraphs: ['簡答：同在東京23區，條件也因區而異。購買前務必看物件所在區的手冊。'],
            bullets: [
              '台東區：設置可面對面的櫃台，營業時間內須有人員常駐；距學校等110m以內可能不予許可',
              '北區：居住型（5間以下、10人以下）不需櫃台；不在型簡易宿所若同樣在5間以下、10人以下，並設置防盜攝影機（保存72小時以上）與約10分鐘內到場的體制等替代措施，也可不設櫃台',
              '新宿區：已提出旅館用途總面積需超過200㎡、須設櫃台並有員工常駐的條例修正案（2026年10月時尚未通過）',
            ],
          },
          {
            id: 'checklist',
            heading: '購買前檢查清單',
            paragraphs: [],
            bullets: [
              '用途地域是否可經營旅館・飯店',
              '變更用途面積是否在200㎡以下',
              '樓層數（是否3層）與室內樓梯數量',
              '所需消防設備與工程評估',
              '客房面積與預計住宿人數',
              '區條例（櫃台、與學校距離、通知鄰居）',
              '有無檢查完了證（台東區要求完工後提交影本）',
            ],
          },
        ],
        faq: [
          { question: '無法重建的獨棟也能做旅館業嗎？', answer: '能否重建與能否經營旅館業是兩回事，但道路與避難條件差的物件，建築與消防協商往往較難，需要逐件確認。' },
          { question: '沒有檢查完了證的老房子可以嗎？', answer: '部分區要求完工後提交檢查完了證影本。沒有時如何處理，依區與建物狀況而定，建議購買前先向保健所與建築師確認。' },
          { question: '民宿（住宅宿泊事業）條件比較寬鬆嗎？', answer: '民宿以申報即可、建物維持住宅，但一年上限180天，各區還有附加限制。想全年營業，需要旅館業許可。' },
        ],
        ctaTitle: '確認想買的獨棟能否做旅館業',
        ctaDescription: '依據圖面與公開資訊，在購買前判定用途地域、道路、避難、消防等，提供中文、日文、英文服務。本文為一般資訊，並非個案法律意見。',
        sources: [
          { label: '東京都都市整備局 用途地域與建築物用途限制（日文）', url: TOKYO_ZONING },
          { label: '國土交通省 修正建築基準法施行（2019年6月25日，日文）', url: MLIT_2019 },
          { label: '國土交通省 用途變更確認申請（200㎡）說明（日文）', url: MLIT_200SQM },
          { label: '東京消防廳 民宿消防設備Q&A（日文）', url: TFD_MINPAKU },
          { label: '厚生勞動省 簡易宿所面積基準（日文）', url: MHLW_2016 },
          { label: '厚生勞動省 旅館業法修正（2018年施行，日文）', url: MHLW_2018 },
          { label: '台東區《旅館業手冊》（日文）', url: TAITO_TEBIKI },
          { label: '北區保健所《旅館業手冊》（日文）', url: KITA_TEBIKI },
          { label: '國土交通省 修正建築基準法技術說明（3層200㎡未滿、樓梯間區劃，日文）', url: MLIT_TECH },
          { label: '厚生勞動省 2018年施行令修正通知（含櫃台，日文）', url: MHLW_2018_DECREE },
          { label: '消防廳 消防法令適合通知書核發通知（日文）', url: FDMA_TEKIGO },
          { label: '新宿區 旅館業條例修正案（日文）', url: SHINJUKU_RYOKAN_DRAFT },
        ],
      },
      'zh-CN': {
        category: '酒店・旅馆',
        title: '独栋、空置房能改成旅馆业（简易宿所）吗？购买前要看的5个要点',
        excerpt: '把东京23区的独栋或小型楼宇改作旅馆业设施，从用途地域、建筑基准法、消防、面积标准、区条例5个方面梳理条件。',
        seoDescription: '独栋、空置房改为旅馆业（简易宿所）的条件：可经营旅馆酒店的用途地域、200㎡以下的用途变更、3层200㎡以下的特例、消防设备、简易宿所面积标准、台东区・北区・新宿区条例。',
        intro: '独栋能否做旅馆业，首先由用途地域决定。第一种・第二种低层住居专用地域与中高层住居专用地域不能建旅馆・酒店。用途地域过关后，依次确认建筑基准法（疏散、楼梯间分隔）、消防设备、简易宿所面积标准与区条例。200㎡以下不需申请建筑确认，但仍须符合法规。',
        keyTakeaways: [
          '第一关是用途地域：低层住居专用、中高层住居专用、工业地域等不能经营旅馆・酒店',
          '用途变更200㎡以下不需申请建筑确认（2019年6月25日施行），但仍须符合法规',
          '3层、不足200㎡的建筑，设置报警设备等即可不必建成耐火建筑',
          '1〜2层的独栋，大多可用特定小规模设施用自动火灾报警设备',
          '前台、与学校距离等，区条例另有附加条件',
        ],
        sections: [
          {
            id: 'zoning',
            heading: '① 用途地域：这里能经营旅馆业吗？',
            paragraphs: ['简答：不在可建旅馆・酒店的用途地域，建筑再好也拿不到许可。先看物业资料的「用途地域」一栏。'],
            table: {
              caption: '用途地域与酒店・旅馆（东京都都市整备局用途限制表）',
              headers: ['用途地域', '酒店・旅馆'],
              rows: [
                ['第一种・第二种低层住居专用地域、田园住居地域', '不可'],
                ['第一种・第二种中高层住居专用地域', '不可'],
                ['第一种住居地域', '3,000㎡以下可'],
                ['第二种住居地域、准住居地域', '可'],
                ['近邻商业地域、商业地域、准工业地域', '可'],
                ['工业地域、工业专用地域', '不可'],
              ],
            },
          },
          {
            id: 'building',
            heading: '② 建筑基准法：关键在200㎡与3层',
            paragraphs: [
              '简答：变更用途的部分在200㎡以下，就不需申请建筑确认；但符合《建筑基准法》与《消防法》的义务仍然存在。',
              '这个「200㎡」来自2019年6月25日全面施行的修订建筑基准法，由原来的100㎡放宽。',
              '同次修法还规定，总面积不足200㎡、3层以下的建筑，采取必要措施即可不必建成耐火建筑；住宿这类睡眠用途，条件是设置自动火灾报警等设备。',
              '3层独栋常卡在楼梯间分隔（竖井分隔），门的性能等要求很细。具体到旅馆项目的判断因建筑而异，一定要请建筑师确认。',
            ],
          },
          {
            id: 'fire',
            heading: '③ 消防：所需设备取决于层数',
            paragraphs: [
              '简答：1〜2层的住宅大多可用特定小规模设施用自动火灾报警设备；3层以上或有地下室，原则上需要常规自动火灾报警设备。',
              '申请时要向保健所提交消防署颁发的「消防法令适合通知书」，由消防署现场检查合格后颁发。',
            ],
            bullets: [
              '1〜2层：主要为特定小规模设施用自动火灾报警设备',
              '3层以上或有地下室：原则上为自动火灾报警设备',
              '只有一部室内楼梯的建筑，探测器规定更严',
              '疏散指示灯：出入口、走廊、楼梯（视线良好处可免设）',
              '窗帘、地毯需为防焰物品',
              '灭火器：厨房；总面积150㎡以上需全楼配置',
            ],
          },
          {
            id: 'area',
            heading: '④ 面积与设施：简易宿所的标准',
            paragraphs: [
              '简答：简易宿所原则上客房总面积需33㎡以上，但住宿人数不足10人时，只要「3.3㎡×住宿人数」以上即可（2016年4月施行）。小独栋只要控制人数，也可能达标。',
              '根据2018年6月施行的修法，前台可由能完成身份核验、交付钥匙、应急处理的设备替代；但区条例可能另有规定。',
            ],
            example: {
              title: '示例：住宿人数的计算（说明用）',
              lines: [
                '客房总面积20㎡',
                '20㎡ ÷ 3.3㎡ ≈ 6.06 → 最多6人',
                '虽未达33㎡，但6人（不足10人）即符合面积标准',
              ],
              note: '客房的计算方式与其他设施标准，请向保健所确认。',
            },
          },
          {
            id: 'ward-rules',
            heading: '⑤ 区条例：附加条件',
            paragraphs: ['简答：同在东京23区，条件也因区而异。购买前务必查看物业所在区的手册。'],
            bullets: [
              '台东区：设置可面对面的前台，营业时间内须有人员常驻；距学校等110m以内可能不予许可',
              '北区：家主居住型（5间以下、10人以下）不需前台；家主不在型简易宿所若同样在5间以下、10人以下，并采取安防摄像头（保存72小时以上）和约10分钟内到场的体制等替代措施，也可不设前台',
              '新宿区：已提出旅馆用途总面积须超过200㎡、须设前台并有员工常驻的条例修订案（2026年10月尚未通过）',
            ],
          },
          {
            id: 'checklist',
            heading: '购买前检查清单',
            paragraphs: [],
            bullets: [
              '用途地域是否可经营旅馆・酒店',
              '变更用途面积是否在200㎡以下',
              '层数（是否3层）与室内楼梯数量',
              '所需消防设备与工程评估',
              '客房面积与预计住宿人数',
              '区条例（前台、与学校距离、告知邻居）',
              '有无竣工检查合格证（台东区要求完工后提交复印件）',
            ],
          },
        ],
        faq: [
          { question: '不可重建的独栋也能做旅馆业吗？', answer: '能否重建与能否经营旅馆业是两回事，但道路与疏散条件差的物业，建筑与消防协商往往更难，需要逐套确认。' },
          { question: '没有竣工检查合格证的老房子可以吗？', answer: '部分区要求完工后提交竣工检查合格证复印件。没有时如何处理，取决于区与建筑状况，建议购买前先向保健所与建筑师确认。' },
          { question: '民宿（住宅宿泊事业）条件更宽松吗？', answer: '民宿只需申报、建筑保持住宅用途，但一年上限180天，各区还有附加限制。想全年营业，需要旅馆业许可。' },
        ],
        ctaTitle: '确认想买的独栋能否做旅馆业',
        ctaDescription: '依据图纸与公开信息，在购买前判定用途地域、道路、疏散、消防等，提供中文、日文、英文服务。本文为一般信息，并非个案法律意见。',
        sources: [
          { label: '东京都都市整备局 用途地域与建筑用途限制（日文）', url: TOKYO_ZONING },
          { label: '国土交通省 修订建筑基准法施行（2019年6月25日，日文）', url: MLIT_2019 },
          { label: '国土交通省 用途变更确认申请（200㎡）说明（日文）', url: MLIT_200SQM },
          { label: '东京消防厅 民宿消防设备Q&A（日文）', url: TFD_MINPAKU },
          { label: '厚生劳动省 简易宿所面积标准（日文）', url: MHLW_2016 },
          { label: '厚生劳动省 旅馆业法修订（2018年施行，日文）', url: MHLW_2018 },
          { label: '台东区《旅馆业手册》（日文）', url: TAITO_TEBIKI },
          { label: '北区保健所《旅馆业手册》（日文）', url: KITA_TEBIKI },
          { label: '国土交通省 修订建筑基准法技术说明（3层不足200㎡、楼梯间分隔，日文）', url: MLIT_TECH },
          { label: '厚生劳动省 2018年施行令修订通知（含前台，日文）', url: MHLW_2018_DECREE },
          { label: '消防厅 消防法令适合通知书颁发通知（日文）', url: FDMA_TEKIGO },
          { label: '新宿区 旅馆业条例修订案（日文）', url: SHINJUKU_RYOKAN_DRAFT },
        ],
      },
    },
  },
  // ───────────────────────────── 3. Minpaku vs ryokan licence ─────────────────────────────
  {
    slug: 'minpaku-vs-ryokan-license-tokyo-365-days',
    publishedAt: '2026-10-20',
    updatedAt: '2026-10-20',
    readMinutes: 6,
    tags: ['hospitality', 'minpaku', 'ryokan license', 'short-term rental'],
    locales: {
      ja: {
        category: 'ホテル・旅館',
        title: '民泊と旅館業、365日営業するならどっち？東京23区の違いと区ごとの制限',
        excerpt: '住宅宿泊事業法（民泊新法）・旅館業法・特区民泊の違いと、中央区・台東区・新宿区・千代田区・大田区の制限を、年間の営業日数という観点で比べます。',
        seoDescription: '民泊（住宅宿泊事業）と旅館業の違い。年180日の上限、届出と許可、家主不在型の管理委託、大田区の特区民泊（2泊3日以上）、中央区・台東区・新宿区・千代田区の営業制限を2026年10月時点で解説。',
        intro: '1年を通して営業したいなら、旅館業法の許可（または大田区などの特区民泊の認定）が必要です。住宅宿泊事業法の民泊は届出で始められる一方、営業できるのは年180日までで、東京23区ではさらに区の条例で曜日や地域が絞られます。2026年10月には台東区で平日営業を認めない改正が施行され、新宿区でも規制強化の案が示されています。',
        keyTakeaways: [
          '住宅宿泊事業法の民泊：届出制・年180日まで。家主不在型は管理業者への委託が義務',
          '旅館業：許可制・日数の上限なし。ただし用途地域・建築・消防の条件が厳しい',
          '特区民泊（大田区）：認定制・最低2泊3日・日数上限なし',
          '中央区は土曜正午〜月曜正午のみ、台東区は2026年10月1日以降の届出は平日不可',
          '新宿区は住居系地域などで新規の民泊を禁止する案をパブリックコメント中（2026年10月）',
        ],
        sections: [
          {
            id: 'compare',
            heading: '3つの制度は何が違う？',
            paragraphs: ['答え：いちばん大きな違いは営業できる日数と、始めるときの手続きです。'],
            table: {
              caption: '東京23区で人を有料で泊める3つの制度',
              headers: ['', '住宅宿泊事業（民泊）', '旅館業（簡易宿所など）', '特区民泊（大田区）'],
              rows: [
                ['手続き', '届出', '許可', '認定'],
                ['営業日数の上限', '年180日', 'なし', 'なし'],
                ['宿泊日数の条件', 'なし', 'なし', '最低2泊3日'],
                ['建物の用途', '住宅のまま', '旅館・ホテル等の基準に適合が必要', '区の基準による'],
                ['区の上乗せ規制', '曜日・地域の制限が多い', '帳場・学校距離などの条例', '区のガイドライン'],
              ],
            },
          },
          {
            id: 'minpaku-180',
            heading: '民泊の「年180日」はどう数える？',
            paragraphs: [
              '答え：毎年4月1日正午から翌年4月1日正午までの1年間で、人を宿泊させた日数が180日を超えてはいけません。',
              '家主が住んでいない家主不在型では、標識の掲示を除く業務を住宅宿泊管理業者に委託する義務があります。',
            ],
          },
          {
            id: 'wards',
            heading: '区ごとの制限（2026年10月時点）',
            paragraphs: ['答え：東京23区では、180日の枠いっぱいに営業できない区が多くあります。購入前に必ず区の最新の条例を確認してください。'],
            table: {
              caption: '主な区の住宅宿泊事業の制限',
              headers: ['区', '主な制限'],
              rows: [
                ['中央区', '区内全域で、営業できるのは土曜日正午〜月曜日正午のみ'],
                ['台東区', '2026年10月1日以降に届出した住宅は、家主居住型・不在型とも平日営業不可（9月30日までに受理された届出は対象外）'],
                ['新宿区', '住居専用地域は金曜日正午〜月曜日正午のみ。住居系地域などで新規の民泊を禁止する改正案のパブリックコメントが2026年10月15日〜11月13日'],
                ['千代田区', '文教地区・学校周辺は、家主居住型が日曜日正午〜金曜日正午は不可、家主不在型は全日不可。人口密集区域は家主不在型不可'],
                ['大田区', '家主不在型は、旅館・ホテルが建てられる用途地域でのみ可能で、小中学校から100m以内は月曜正午〜金曜正午は不可（家主居住型は緩和あり）'],
              ],
            },
          },
          {
            id: 'which',
            heading: '結局どちらを選ぶ？',
            paragraphs: [
              '答え：収益を通年で組み立てたいなら、最初から旅館業の許可が取れる物件を選ぶのが基本です。民泊は、住宅として使いながら一部の期間だけ貸したい場合に向いています。',
              '民泊で収支を計算するときは、180日ではなく、区の曜日制限を当てはめた実際に営業できる日数で計算します。たとえば中央区の制限では、週のうち営業できるのは土曜正午から月曜正午までです。',
            ],
            bullets: [
              '通年営業が前提 → 旅館業の許可（大田区なら特区民泊も選択肢）',
              '住みながら一部の期間だけ貸す → 住宅宿泊事業の民泊',
              'マンションの一室 → 管理規約で民泊禁止のことが多い（別ガイド参照）',
            ],
          },
          {
            id: 'mistakes',
            heading: 'よくある失敗',
            paragraphs: [],
            bullets: [
              '「年180日営業できる」前提で収支を組み、区の曜日制限を見落とす',
              '条例改正の動き（台東区・新宿区など）を確認せずに購入する',
              '民泊で始めて、あとから旅館業に切り替えようとして用途地域で不可と分かる',
            ],
          },
        ],
        faq: [
          { question: 'すでに届出済みの民泊にも新しい規制はかかりますか？', answer: '台東区の改正は2026年9月30日までに受理された届出を対象外としています。新宿区の改正案は既存施設に施行2年後から適用する内容です。区ごとに経過措置が違うため、個別に確認が必要です。' },
          { question: '民泊から旅館業に切り替えられますか？', answer: '旅館業の基準（用途地域・建築・消防・面積）を満たせば許可を取ることはできます。用途地域で不可の場所では切り替えられません。' },
          { question: '特区民泊は大田区以外でもできますか？', answer: '東京23区では大田区が国家戦略特区の民泊を実施しています。他の区で検討する場合は、その区の最新情報を確認してください。' },
        ],
        ctaTitle: '通年営業できる物件を探す・確認する',
        ctaDescription: '旅館業の許可が取れる見込みの物件を、区の規制も含めて確認します。日本語・英語・中国語で対応します。',
        sources: [
          { label: '観光庁 民泊制度ポータル「住宅宿泊事業法の概要」', url: MINPAKU_PORTAL },
          { label: '大田区 民泊（制度の比較）', url: OTA_MINPAKU },
          { label: '中央区 住宅宿泊事業の条例', url: CHUO_MINPAKU },
          { label: '台東区 住宅宿泊事業の条例改正', url: TAITO_MINPAKU },
          { label: '新宿区 住宅宿泊事業条例改正案のパブリックコメント', url: SHINJUKU_PUBCOM },
          { label: '厚生労働省 旅館業法の改正', url: MHLW_2018 },
          { label: '千代田区 住宅宿泊事業の条例', url: CHIYODA_MINPAKU },
        ],
      },
      en: {
        category: 'Hotels & ryokan',
        title: 'Minpaku or a Ryokan Licence: Which Lets You Operate 365 Days in Tokyo?',
        excerpt: 'How Japan\'s private lodging (minpaku) law, the hotel/ryokan licence and Ota Ward\'s special-zone scheme differ, and how Chuo, Taito, Shinjuku, Chiyoda and Ota wards restrict operating days.',
        seoDescription: 'Minpaku vs ryokan licence in Tokyo: the 180-night cap, notification vs licence, mandatory management for absentee hosts, Ota special-zone minpaku (2 nights minimum), and ward limits in Chuo, Taito, Shinjuku and Chiyoda as of October 2026.',
        intro: "To operate all year you need a lodging licence under the Inns and Hotels Act (or special-zone approval in Ota Ward). Minpaku under the Private Lodging Business Act only needs a notification but is capped at 180 nights a year, and Tokyo wards cut that further by weekday and area. Taito Ward stopped weekday operation for new notifications from October 2026, and Shinjuku Ward has proposed tighter rules.",
        keyTakeaways: [
          'Minpaku: notification, up to 180 nights a year; absentee hosts must hire a registered manager',
          'Ryokan/hotel licence: no day cap, but strict zoning, building and fire conditions',
          'Special-zone minpaku (Ota Ward): approval, minimum 2 nights, no day cap',
          'Chuo: Saturday noon to Monday noon only; Taito: no weekdays for notifications from 1 October 2026',
          'Shinjuku: a proposal to ban new minpaku in residential zones was under public comment in October 2026',
        ],
        sections: [
          {
            id: 'compare',
            heading: 'How do the three systems differ?',
            paragraphs: ['Short answer: the biggest differences are the number of days you can operate and how you get started.'],
            table: {
              caption: 'Three ways to host paying guests in Tokyo\'s 23 wards',
              headers: ['', 'Minpaku (private lodging)', 'Lodging licence (e.g. simple lodging)', 'Special-zone minpaku (Ota)'],
              rows: [
                ['Procedure', 'Notification', 'Licence', 'Approval'],
                ['Day cap per year', '180 nights', 'None', 'None'],
                ['Minimum stay', 'None', 'None', '2 nights (3 days)'],
                ['Building use', 'Stays residential', 'Must meet lodging standards', 'Per ward standards'],
                ['Ward add-ons', 'Weekday and area limits common', 'Bylaws on front desk, school distance', 'Ward guidelines'],
              ],
            },
          },
          {
            id: 'minpaku-180',
            heading: 'How is the 180-night cap counted?',
            paragraphs: [
              'Short answer: nights with guests may not exceed 180 in each year running from noon on 1 April to noon on the next 1 April.',
              'Where the host does not live on site, everything except displaying the sign must be outsourced to a registered private lodging manager.',
            ],
          },
          {
            id: 'wards',
            heading: 'Ward limits (as of October 2026)',
            paragraphs: ['Short answer: in many Tokyo wards you cannot use the full 180 nights. Always check the current bylaw for the ward before buying.'],
            table: {
              caption: 'Main minpaku limits by ward',
              headers: ['Ward', 'Main limits'],
              rows: [
                ['Chuo', 'Whole ward: Saturday noon to Monday noon only'],
                ['Taito', 'Homes notified on or after 1 October 2026 cannot operate on weekdays, hosted or absentee (notifications accepted by 30 September are exempt)'],
                ['Shinjuku', 'Exclusive residential zones: Friday noon to Monday noon only. A proposal to ban new minpaku in residential and other zones was under public comment 15 October to 13 November 2026'],
                ['Chiyoda', 'Near schools and in education districts: hosted minpaku barred Sunday noon to Friday noon, absentee barred entirely; absentee barred in dense residential areas'],
                ['Ota', 'Absentee minpaku: only where hotels are allowed by zoning, and within 100 m of schools no operation Monday noon to Friday noon (relaxed for hosted minpaku)'],
              ],
            },
          },
          {
            id: 'which',
            heading: 'So which should you choose?',
            paragraphs: [
              'Short answer: if you want year-round income, buy a property that can get a lodging licence from the start. Minpaku suits owners who live in the home and rent it out part of the time.',
              'When modelling minpaku income, use the days the ward actually allows, not 180. Under Chuo Ward\'s rule, for example, you can only host from Saturday noon to Monday noon each week.',
            ],
            bullets: [
              'Year-round operation → lodging licence (or special-zone minpaku in Ota)',
              'Living there and renting part-time → minpaku',
              'A condo unit → building bylaws often ban minpaku (see our separate guide)',
            ],
          },
          {
            id: 'mistakes',
            heading: 'Common mistakes',
            paragraphs: [],
            bullets: [
              'Modelling income on 180 nights and missing ward weekday limits',
              'Buying without checking pending bylaw changes (Taito, Shinjuku and others)',
              'Starting as minpaku and later finding a licence is impossible because of zoning',
            ],
          },
        ],
        faq: [
          { question: 'Do new rules apply to minpaku already notified?', answer: 'Taito Ward exempts notifications accepted by 30 September 2026. Shinjuku\'s proposal would apply to existing homes two years after it takes effect. Transitional rules differ by ward, so check each case.' },
          { question: 'Can I switch from minpaku to a lodging licence?', answer: 'Yes, if the property meets lodging standards (zoning, building, fire, floor area). Where zoning forbids hotels, you cannot switch.' },
          { question: 'Is special-zone minpaku available outside Ota?', answer: 'Within Tokyo\'s 23 wards, Ota runs national strategic special-zone minpaku. For any other ward, check that ward\'s current information.' },
        ],
        ctaTitle: 'Find or check a property that can operate year-round',
        ctaDescription: 'We check whether a property can get a lodging licence, including ward rules, in English, Japanese and Chinese. General information, not legal advice for a specific case.',
        sources: [
          { label: 'Japan Tourism Agency: Private Lodging Business Act overview (Japanese)', url: MINPAKU_PORTAL },
          { label: 'Ota Ward: comparison of lodging schemes (Japanese)', url: OTA_MINPAKU },
          { label: 'Chuo Ward minpaku bylaw (Japanese)', url: CHUO_MINPAKU },
          { label: 'Taito Ward minpaku bylaw amendment (Japanese)', url: TAITO_MINPAKU },
          { label: 'Shinjuku Ward public comment on minpaku bylaw (Japanese)', url: SHINJUKU_PUBCOM },
          { label: 'MHLW: amendment of the Inns and Hotels Act (Japanese)', url: MHLW_2018 },
          { label: 'Chiyoda Ward minpaku bylaw (Japanese)', url: CHIYODA_MINPAKU },
        ],
      },
      'zh-TW': {
        category: '飯店・旅館',
        title: '民宿還是旅館業？想全年365天營業該選哪一個：東京23區的差異與各區限制',
        excerpt: '比較住宅宿泊事業法（民宿新法）、旅館業法與大田區特區民宿，並整理中央區、台東區、新宿區、千代田區、大田區對營業天數的限制。',
        seoDescription: '民宿（住宅宿泊事業）與旅館業差在哪？一年180天上限、申報與許可、屋主不在型須委託管理業者、大田區特區民宿（2晚3天以上）、中央區・台東區・新宿區・千代田區的營業限制（2026年10月）。',
        intro: '想全年營業，需要旅館業法的許可（或大田區的特區民宿認定）。住宅宿泊事業法的民宿只要申報即可開始，但一年最多180天，東京23區還會用區條例限制星期與地區。2026年10月台東區已施行不准平日營業的修正，新宿區也提出加強管制的方案。',
        keyTakeaways: [
          '住宅宿泊事業（民宿）：申報制，一年180天以內；屋主不在型須委託管理業者',
          '旅館業：許可制，沒有天數上限，但用途地域、建築、消防條件嚴格',
          '特區民宿（大田區）：認定制，最少2晚3天，沒有天數上限',
          '中央區只能週六中午至週一中午；台東區2026年10月1日以後申報者平日不可營業',
          '新宿區擬禁止住居系地域等新設民宿，2026年10月徵求公眾意見中',
        ],
        sections: [
          {
            id: 'compare',
            heading: '三種制度差在哪？',
            paragraphs: ['簡答：最大的差異是可營業天數與開始時的手續。'],
            table: {
              caption: '在東京23區收費讓人住宿的三種制度',
              headers: ['', '住宅宿泊事業（民宿）', '旅館業（簡易宿所等）', '特區民宿（大田區）'],
              rows: [
                ['手續', '申報', '許可', '認定'],
                ['年營業天數上限', '180天', '無', '無'],
                ['住宿天數條件', '無', '無', '最少2晚3天'],
                ['建物用途', '維持住宅', '須符合旅館・飯店基準', '依區基準'],
                ['區的附加限制', '多有星期與地區限制', '櫃台、學校距離等條例', '區的指引'],
              ],
            },
          },
          {
            id: 'minpaku-180',
            heading: '民宿的「一年180天」怎麼算？',
            paragraphs: [
              '簡答：每年4月1日中午到隔年4月1日中午的一年內，讓人住宿的天數不得超過180天。',
              '屋主不住在現場的屋主不在型，除張貼標示外的業務，須委託住宅宿泊管理業者。',
            ],
          },
          {
            id: 'wards',
            heading: '各區限制（2026年10月）',
            paragraphs: ['簡答：東京23區有不少區無法用滿180天。購買前務必確認該區最新條例。'],
            table: {
              caption: '主要各區的民宿限制',
              headers: ['區', '主要限制'],
              rows: [
                ['中央區', '全區僅能週六中午至週一中午營業'],
                ['台東區', '2026年10月1日以後申報的住宅，屋主居住型・不在型皆平日不可營業（9月30日前受理者不在此限）'],
                ['新宿區', '住居專用地域僅週五中午至週一中午。禁止住居系地域等新設民宿的修正案，2026年10月15日至11月13日徵求公眾意見'],
                ['千代田區', '文教地區、學校周邊：屋主居住型週日中午至週五中午不可，屋主不在型全日不可；人口密集區不可屋主不在型'],
                ['大田區', '屋主不在型僅限可蓋旅館・飯店的用途地域，中小學100m以內週一中午至週五中午不可（屋主居住型有放寬）'],
              ],
            },
          },
          {
            id: 'which',
            heading: '到底該選哪個？',
            paragraphs: [
              '簡答：想全年穩定經營，原則上一開始就選能取得旅館業許可的物件。民宿適合自住、只出租部分期間的情況。',
              '用民宿試算收支時，不要用180天，要用套上區星期限制後實際可營業的天數。例如中央區每週只能在週六中午到週一中午營業。',
            ],
            bullets: [
              '以全年營業為前提 → 旅館業許可（大田區也可考慮特區民宿）',
              '自住、部分期間出租 → 住宅宿泊事業民宿',
              '公寓單戶 → 管理規約常禁止民宿（請見另一篇指南）',
            ],
          },
          {
            id: 'mistakes',
            heading: '常見失誤',
            paragraphs: [],
            bullets: [
              '以「一年可營業180天」試算，忽略區的星期限制',
              '沒確認條例修正動向（台東區、新宿區等）就購買',
              '先做民宿，之後想改旅館業，才發現用途地域不可',
            ],
          },
        ],
        faq: [
          { question: '已申報的民宿也適用新規定嗎？', answer: '台東區的修正排除2026年9月30日前受理的申報；新宿區修正案則對既有設施於施行2年後適用。各區過渡措施不同，需逐件確認。' },
          { question: '民宿可以改成旅館業嗎？', answer: '符合旅館業基準（用途地域、建築、消防、面積）即可取得許可；用途地域不允許的地方無法轉換。' },
          { question: '大田區以外也能做特區民宿嗎？', answer: '東京23區中由大田區實施國家戰略特區民宿；考慮其他區時，請確認該區的最新資訊。' },
        ],
        ctaTitle: '尋找、確認可全年營業的物件',
        ctaDescription: '連同各區規定，確認物件能否取得旅館業許可，提供中文、日文、英文服務。本文為一般資訊，並非個案法律意見。',
        sources: [
          { label: '觀光廳 民宿制度入口網「住宅宿泊事業法概要」（日文）', url: MINPAKU_PORTAL },
          { label: '大田區 民宿制度比較（日文）', url: OTA_MINPAKU },
          { label: '中央區 住宅宿泊事業條例（日文）', url: CHUO_MINPAKU },
          { label: '台東區 住宅宿泊事業條例修正（日文）', url: TAITO_MINPAKU },
          { label: '新宿區 住宅宿泊事業條例修正案公眾意見（日文）', url: SHINJUKU_PUBCOM },
          { label: '厚生勞動省 旅館業法修正（日文）', url: MHLW_2018 },
          { label: '千代田區 住宅宿泊事業條例（日文）', url: CHIYODA_MINPAKU },
        ],
      },
      'zh-CN': {
        category: '酒店・旅馆',
        title: '民宿还是旅馆业？想全年365天营业该选哪个：东京23区的区别与各区限制',
        excerpt: '比较住宅宿泊事业法（民宿新法）、旅馆业法与大田区特区民宿，并梳理中央区、台东区、新宿区、千代田区、大田区对营业天数的限制。',
        seoDescription: '民宿（住宅宿泊事业）与旅馆业的区别：一年180天上限、申报与许可、房东不在型须委托管理公司、大田区特区民宿（2晚3天以上）、中央区・台东区・新宿区・千代田区的营业限制（2026年10月）。',
        intro: '想全年营业，需要旅馆业法的许可（或大田区的特区民宿认定）。住宅宿泊事业法的民宿只需申报即可开始，但一年最多180天，东京23区还会通过区条例按星期和区域进一步限制。2026年10月台东区已施行不允许工作日营业的修订，新宿区也提出了收紧方案。',
        keyTakeaways: [
          '住宅宿泊事业（民宿）：申报制，一年180天以内；房东不在型须委托管理公司',
          '旅馆业：许可制，没有天数上限，但用途地域、建筑、消防条件严格',
          '特区民宿（大田区）：认定制，最少2晚3天，没有天数上限',
          '中央区仅周六中午至周一中午；台东区2026年10月1日以后申报的工作日不可营业',
          '新宿区拟禁止住居系地域等新设民宿，2026年10月征求公众意见中',
        ],
        sections: [
          {
            id: 'compare',
            heading: '三种制度有什么区别？',
            paragraphs: ['简答：最大的区别是可营业天数和启动时的手续。'],
            table: {
              caption: '在东京23区收费接待住宿的三种制度',
              headers: ['', '住宅宿泊事业（民宿）', '旅馆业（简易宿所等）', '特区民宿（大田区）'],
              rows: [
                ['手续', '申报', '许可', '认定'],
                ['年营业天数上限', '180天', '无', '无'],
                ['住宿天数条件', '无', '无', '最少2晚3天'],
                ['建筑用途', '保持住宅', '须符合旅馆・酒店标准', '按区标准'],
                ['区的附加限制', '星期与区域限制多', '前台、学校距离等条例', '区的指引'],
              ],
            },
          },
          {
            id: 'minpaku-180',
            heading: '民宿的「一年180天」怎么算？',
            paragraphs: [
              '简答：每年4月1日中午到次年4月1日中午的一年内，接待住宿的天数不得超过180天。',
              '房东不住在现场的房东不在型，除张贴标识外的业务，须委托住宅宿泊管理业者。',
            ],
          },
          {
            id: 'wards',
            heading: '各区限制（2026年10月）',
            paragraphs: ['简答：东京23区不少区无法用满180天。购买前务必确认该区最新条例。'],
            table: {
              caption: '主要各区的民宿限制',
              headers: ['区', '主要限制'],
              rows: [
                ['中央区', '全区仅周六中午至周一中午可营业'],
                ['台东区', '2026年10月1日以后申报的住宅，房东居住型・不在型工作日均不可营业（9月30日前受理的不受影响）'],
                ['新宿区', '住居专用地域仅周五中午至周一中午。禁止住居系地域等新设民宿的修订案，2026年10月15日至11月13日征求公众意见'],
                ['千代田区', '文教地区、学校周边：房东居住型周日中午至周五中午不可，房东不在型全天不可；人口密集区不可房东不在型'],
                ['大田区', '房东不在型仅限可建旅馆・酒店的用途地域，中小学100m以内周一中午至周五中午不可（房东居住型有放宽）'],
              ],
            },
          },
          {
            id: 'which',
            heading: '到底该选哪个？',
            paragraphs: [
              '简答：想全年稳定经营，原则上一开始就选能取得旅馆业许可的物业。民宿适合自住、只出租部分时间的情况。',
              '用民宿测算收益时，不要按180天，要按套用区星期限制后实际可营业的天数。例如中央区每周只能在周六中午到周一中午营业。',
            ],
            bullets: [
              '以全年营业为前提 → 旅馆业许可（大田区也可考虑特区民宿）',
              '自住、部分时间出租 → 住宅宿泊事业民宿',
              '公寓单套 → 管理规约常禁止民宿（请见另一篇指南）',
            ],
          },
          {
            id: 'mistakes',
            heading: '常见失误',
            paragraphs: [],
            bullets: [
              '按「一年可营业180天」测算，忽略区的星期限制',
              '没确认条例修订动向（台东区、新宿区等）就购买',
              '先做民宿，之后想改旅馆业，才发现用途地域不允许',
            ],
          },
        ],
        faq: [
          { question: '已申报的民宿也适用新规定吗？', answer: '台东区的修订不适用于2026年9月30日前受理的申报；新宿区修订案则对既有设施于施行2年后适用。各区过渡措施不同，需逐个确认。' },
          { question: '民宿可以转为旅馆业吗？', answer: '符合旅馆业标准（用途地域、建筑、消防、面积）即可取得许可；用途地域不允许的地方无法转换。' },
          { question: '大田区以外也能做特区民宿吗？', answer: '东京23区中由大田区实施国家战略特区民宿；考虑其他区时，请确认该区的最新信息。' },
        ],
        ctaTitle: '寻找、确认可全年营业的物业',
        ctaDescription: '连同各区规定，确认物业能否取得旅馆业许可，提供中文、日文、英文服务。本文为一般信息，并非个案法律意见。',
        sources: [
          { label: '观光厅 民宿制度门户「住宅宿泊事业法概要」（日文）', url: MINPAKU_PORTAL },
          { label: '大田区 民宿制度比较（日文）', url: OTA_MINPAKU },
          { label: '中央区 住宅宿泊事业条例（日文）', url: CHUO_MINPAKU },
          { label: '台东区 住宅宿泊事业条例修订（日文）', url: TAITO_MINPAKU },
          { label: '新宿区 住宅宿泊事业条例修订案公众意见（日文）', url: SHINJUKU_PUBCOM },
          { label: '厚生劳动省 旅馆业法修订（日文）', url: MHLW_2018 },
          { label: '千代田区 住宅宿泊事业条例（日文）', url: CHIYODA_MINPAKU },
        ],
      },
    },
  },
]
