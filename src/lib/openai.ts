import OpenAI from 'openai'
import { PROPERTY_TYPES } from '@/lib/property-type'

let _openai: OpenAI | null = null
export const OCR_MODEL = process.env.MAISOKU_OCR_MODEL || process.env.OPENAI_VISION_MODEL || 'gpt-4.1-mini'
export const EXTRACT_MODEL = process.env.MAISOKU_EXTRACT_MODEL || process.env.OPENAI_VISION_MODEL || 'gpt-4.1-mini'
export const TRANSLATE_MODEL = process.env.MAISOKU_TRANSLATE_MODEL || 'gpt-4.1-mini'

export function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-build',
    })
  }
  return _openai
}

export const openai = new Proxy({} as OpenAI, {
  get(_, prop) {
    return Reflect.get(getOpenAI(), prop)
  },
})

export const extractionSchema = {
  name: 'property_extraction',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      property_type: {
        type: ['string', 'null'],
        enum: [...PROPERTY_TYPES, null],
      },
      price: {
        type: ['integer', 'null'],
        description: '価格（円）。不明な場合はnull',
      },
      address_full: {
        type: ['string', 'null'],
        description: '抽出できた住所（番地まで含む完全な住所）',
      },
      prefecture: {
        type: ['string', 'null'],
      },
      city: {
        type: ['string', 'null'],
      },
      stations: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: '駅名（例: 渋谷駅）' },
            name_en: { type: ['string', 'null'], description: '駅名の英語表記・ローマ字（例: Shibuya）' },
            line: { type: ['string', 'null'], description: '路線名（例: JR山手線）' },
            walk_minutes: { type: ['integer', 'null'], description: '徒歩分' },
          },
          required: ['name', 'name_en', 'line', 'walk_minutes'],
          additionalProperties: false,
        },
        description: '最寄駅リスト（複数可）',
      },
      land_area: {
        type: ['number', 'null'],
        description: '土地面積（㎡）',
      },
      building_area: {
        type: ['number', 'null'],
        description: '建物面積（㎡）',
      },
      floor_count: {
        type: ['integer', 'null'],
      },
      built_year: {
        type: ['integer', 'null'],
        description: '築年（西暦）。例: 平成5年 → 1993',
      },
      built_month: {
        type: ['integer', 'null'],
        description: '築月（1-12）。記載がなければnull',
      },
      structure: {
        type: ['string', 'null'],
        enum: ['RC', 'SRC', 'S', '木造', '軽量鉄骨', 'その他', null],
      },
      zoning: {
        type: ['string', 'null'],
        description: '用途地域',
      },
      current_status: {
        type: ['string', 'null'],
        description: '現況（賃貸中、空室、居住中等）',
      },
      info_registered_at: {
        type: ['string', 'null'],
        description: '物件情報の登録日（YYYY-MM-DD形式）。マイソクに「情報登録日」「登録日」「作成日」等の記載があれば抽出。なければnull',
      },
      info_updated_at: {
        type: ['string', 'null'],
        description: '物件情報の更新日（YYYY-MM-DD形式）。マイソクに「情報更新日」「更新日」「改定日」等の記載があれば抽出。なければnull',
      },
      conditions_expiry: {
        type: ['string', 'null'],
        description: '取引条件の有効期限（YYYY-MM-DD形式）。マイソクに「有効期限」「条件期限」「価格有効期限」等の記載があれば抽出。なければnull',
      },
      delivery_date: {
        type: ['string', 'null'],
        description: '引渡し可能時期。「即時」「相談」「2026年4月」等、記載のまま抽出。なければnull',
      },
      ad_allowed: {
        type: 'boolean',
        description: `広告掲載可否の判定ルール（厳密に従うこと）:

【trueにするケース — 以下のいずれかが明記されている場合のみ】
- 「広告可」「広告転載可」「広告掲載可」「AD可」
- 「自社サイトのみ可」「自社HP可」「自社ホームページのみ掲載可能」→ true（自社ポータルに掲載するため）
- 「ネット広告可」「ネット広告でお願い」
- 「SUUMO以外可能」「楽待・健美家は不可」等、特定媒体のみ不可 → true（自社ポータルは該当しないため）

【falseにするケース】
- 「広告不可」「広告掲載不可」「広告NG」「広告転載不可」「全て不可」
- 「ネット広告厳禁」「ネット広告一切厳禁」「広告一切不可」
- 「広告掲載(HP含む)は不可」
- 「承諾書が必要」「応相談」→ false（明確な許可ではない）
- 広告可否について一切記載がない → false（許可が明示されていない限りfalse）

【重要な注意点】
- 「広告の料金に相当する額 相談」等は広告費の話であり、広告可否とは無関係 → 他に可の記載がなければfalse
- 取引態様欄、備考欄、帯部分（ページ下部の不動産会社情報エリア）を必ず確認すること
- 広告可否の記載は小さい文字で書かれていることが多いので注意深く探すこと`,
      },
      yield_gross: {
        type: ['number', 'null'],
        description: '表面利回り（%）。記載があれば抽出、なければnull',
      },
      yield_net: {
        type: ['number', 'null'],
        description: '実質利回り（%）。記載があれば抽出、なければnull',
      },
      description_ja: {
        type: ['string', 'null'],
        description: '物件のアピールポイント・営業文（日本語、150-300文字程度）。単なる収益物件ではなく、宿泊業向け取得候補として紹介する前提で、立地、建物規模、宿泊転用余地、確認すべき法規・消防・建築論点を投資家向けにまとめる。',
      },
      appeal_points: {
        type: 'array',
        items: { type: 'string' },
        description: '物件のセールスポイント（箇条書き）。宿泊転用理由、想定用途、買主ペルソナ、駅距離、建物規模、利回りなどを短く含める。',
      },
      hospitality_assessment: {
        type: 'object',
        description: '宿泊事業向け取得候補としての初期評価。断定ではなく、紹介前・買付前に確認すべき仮説として出す。',
        properties: {
          potential_score: {
            type: ['integer', 'null'],
            description: '宿泊事業化の初期見込み。1=弱い、3=要調査、5=強い。資料から判断不能ならnull。',
          },
          recommended_use: {
            type: ['string', 'null'],
            enum: ['民泊', '簡易宿所', 'ホテル', '旅館', '社宅・マンスリー', '開発用地', '要調査', null],
            description: '資料から見た最も自然な宿泊・運用用途。',
          },
          conversion_reason: {
            type: ['string', 'null'],
            description: 'なぜ宿泊事業向け候補になり得るか。80文字程度。',
          },
          primary_risks: {
            type: 'array',
            items: { type: 'string' },
            description: '購入前に確認すべき宿泊事業リスク。用途地域、消防、建築、検査済証、保健所、既存賃貸借など。',
          },
          buyer_persona: {
            type: ['string', 'null'],
            description: '刺さりやすい買主像。例: 民泊運営会社、簡易宿所運営者、ホテル開発事業者、海外投資家。',
          },
        },
        required: ['potential_score', 'recommended_use', 'conversion_reason', 'primary_risks', 'buyer_persona'],
        additionalProperties: false,
      },
      confidence: {
        type: 'object',
        properties: {
          overall: { type: 'number' },
          price: { type: 'number' },
          address: { type: 'number' },
          area: { type: 'number' },
        },
        required: ['overall', 'price', 'address', 'area'],
        additionalProperties: false,
      },
      warnings: {
        type: 'array',
        items: { type: 'string' },
        description: '検出された警告。買主・投資家への注意事項のみを含める。広告掲載可否、広告承諾、REINS期限、媒体制限などの内部運用情報は含めない。',
      },
      evidence: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            field: { type: 'string' },
            raw_text: { type: 'string' },
            confidence: { type: 'number' },
            page_number: { type: ['integer', 'null'], description: 'PDFのページ番号（1始まり）' },
          },
          required: ['field', 'raw_text', 'confidence', 'page_number'],
          additionalProperties: false,
        },
      },
    },
    required: [
      'property_type',
      'price',
      'address_full',
      'prefecture',
      'city',
      'stations',
      'land_area',
      'building_area',
      'floor_count',
      'built_year',
      'built_month',
      'structure',
      'zoning',
      'current_status',
      'info_registered_at',
      'info_updated_at',
      'conditions_expiry',
      'delivery_date',
      'ad_allowed',
      'yield_gross',
      'yield_net',
      'description_ja',
      'appeal_points',
      'hospitality_assessment',
      'confidence',
      'warnings',
      'evidence'
    ],
    additionalProperties: false,
  },
}

export const extractionPrompt = `あなたは不動産情報抽出AIです。以下のマイソク（物件資料）から情報を抽出してください。

【重要ルール】
1. 不明な項目はnullにする。推測で埋めない。
2. 住所は「address_full」に抽出した全文（番地まで）を入れる。丁目までへの整形はシステムが行う。
3. 最寄駅は複数ある場合がある。「stations」配列に全て抽出する。各駅について路線名と徒歩分も可能な限り抽出。
4. 築年月は西暦と月を分けて出力（例: 平成5年3月 → built_year: 1993, built_month: 3）
5. 利回りが記載されている場合は抽出するが、warnings に「利回りは参考値です。実際の収益を保証するものではありません。」を追加。
6. 民泊、旅館、簡易宿所、ホテル関連の記載がある場合、warnings に「民泊・旅館業には許認可が必要です。現地法規をご確認ください。」を追加。
7. 税金、ビザ、法規に関する記載がある場合、warnings に「税務・法務については専門家にご相談ください。」を追加。
8. 価格が1億円未満で利回り20%超など異常値の場合、warnings に「数値に異常の可能性があります。要確認。」を追加。
9. 各フィールドについて、抽出元テキストと信頼度、ページ番号を evidence に記録。
10. 物件情報の登録日・更新日（info_registered_at, info_updated_at）: マイソクに記載があればYYYY-MM-DD形式で抽出。「情報登録日」「登録日」「作成日」「情報更新日」「更新日」「改定日」等。
11. 取引条件の有効期限（conditions_expiry）: 「有効期限」「条件期限」「価格有効期限」等の記載があればYYYY-MM-DD形式で抽出。
12. 引渡し可能時期（delivery_date）: 「引渡し」「引き渡し」「引渡時期」等の記載があれば、「即時」「相談」「2026年4月」等そのまま抽出。
13. 広告掲載可否（ad_allowed）: 「広告可」「広告転載可」「広告掲載可」「AD可」等の記載があればtrue。「楽待・健美家は不可」等、特定媒体のみ不可の場合もtrue（自社ポータルは該当しないため）。「広告不可」「広告転載不可」「全て不可」等があればfalse。「承諾書が必要」「相談可」等の事前承諾必須の記載もfalse。記載が見つからなければfalse。
14. warnings には、広告掲載可否・承諾要否・媒体制限・REINS関連などの内部メモを絶対に含めない。
15. 物件種別（property_type）は必ず実態で判定する。REINSの「売マンション」は区分とは限らない。**判定は厳格に。** タイトル・ヘッダーだけで判断せず、本文の数値とキーワードを総合する。
    一棟系の決定的サイン（1つでも該当すれば一棟）：
    - 「一棟」「一棟売」「一棟物件」「売収益マンション」「収益ビル」「売ビル」「総戸数」（全戸数の記載）
    - 全○室、総戸数○戸、レントロール（部屋ごとの賃料表）添付
    - **建物面積（延床面積）が記載されており、専有面積の表記がない**
    - 価格が ¥3億以上 + 用途「マンション」+ 専有面積記載なし → ほぼ確実に一棟
    - 「現況利回り」「想定家賃」「想定年収」が建物全体に対して計算されている
    - 元寮、寄宿舎、社員寮、シェアハウスとして使われていた建物全体

    区分マンションの決定的サイン（1つでも該当すれば区分）：
    - 「専有面積」+ 「所在階／階数」+ 「号室」（部屋番号）
    - 「管理費」「修繕積立金」（毎月の費用、共有部の管理）
    - 「○階部分」「○階号」「ルーフバルコニー」「専用庭」（個別住戸の特徴）
    - 1住戸の間取り図のみ（建物全体の図面なし）
    - 総戸数の記載があるが、価格と紐付くのは1住戸分

    判定優先度：**「専有面積」+「号室」+「管理費」が揃えば必ず区分**。それ以外の高額物件で、専有面積記載なし＋建物全体の数値（延床面積、総戸数、満室想定家賃）があれば一棟。

    ビル全体は「一棟ビル」、共同住宅全体は「一棟マンション」、アパート全体は「一棟アパート」。
16. このポータルでは、投資家に対して「宿泊業向け物件を探し、紹介し、取得まで支援する」ことを前面に出す。description_ja / appeal_points / hospitality_assessment は、物件紹介を主役にしつつ、宿泊事業として買えるかの確認論点も示す営業前提で書く。
17. hospitality_assessment は、断定ではなく初期仮説として作る。用途地域、消防、建築、検査済証、保健所、既存賃貸借の論点があれば primary_risks に入れる。
18. appeal_points には、少なくとも「宿泊転用理由」「想定用途」「想定買主」に相当する短い要素を入れる。ただし資料から根拠が弱い場合は「要調査」と明記する。
19. 既存物件をホテル・旅館・簡易宿所に用途変更する前提では、次を強く評価する:
    - 既存ホテル・旅館・簡易宿所、既存営業権付き
    - 元寮、寄宿舎、社員寮、共同住宅、シェアハウスなど宿泊用途に近い建物
    - 検査済証、確認済証、確認申請図面、竣工図、消防設備関係書類がある
    - 近隣商業、商業、準工業、第二種住居、準住居、第一種住居（規模要確認）
20. 次はリスクとして重く見る:
    - 検査済証なしの古い戸建、確認図面なし、未登記、増改築履歴不明、現況と登記・図面の不一致
    - 旧耐震、特に1981年5月以前
    - 木造3階建て
    - 接道2m未満、43条ただし書き、私道権利不明、セットバック未了、再建築不可
    - 第一種/第二種低層住居専用地域、第一種/第二種中高層住居専用地域、田園住居地域、工業系で宿泊用途に不向きな地域
21. 200㎡以下は「安全」ではない。用途変更の確認申請が不要な場合があるだけで、建築基準法・消防法・旅館業法への適合確認は必要。primary_risks で誤解なく書く。

【入力テキスト】`

// 複数ページ対応用のプロンプト生成
export function createMultiPagePrompt(pageContents: { pageNumber: number; text: string }[]): string {
  const pageTexts = pageContents.map(p => `--- ページ ${p.pageNumber} ---\n${p.text}`).join('\n\n')
  return `${extractionPrompt}

${pageTexts}

【注意】
- 複数ページにまたがる情報を統合してください
- evidence の page_number には、その情報が記載されていたページ番号を記録してください`
}

// 4言語翻訳スキーマ
export const translationSchema = {
  name: 'property_translation',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      description_en: {
        type: 'string',
        description: 'English translation of the property description',
      },
      description_zh_tw: {
        type: 'string',
        description: 'Traditional Chinese (Taiwan) translation',
      },
      description_zh_cn: {
        type: 'string',
        description: 'Simplified Chinese translation',
      },
      features_en: {
        type: 'array',
        items: { type: 'string' },
        description: 'English translation of appeal points / features tags. Keep each tag short (2-5 words).',
      },
      features_zh_tw: {
        type: 'array',
        items: { type: 'string' },
        description: 'Traditional Chinese translation of appeal points / features tags.',
      },
      features_zh_cn: {
        type: 'array',
        items: { type: 'string' },
        description: 'Simplified Chinese translation of appeal points / features tags.',
      },
    },
    required: ['description_en', 'description_zh_tw', 'description_zh_cn', 'features_en', 'features_zh_tw', 'features_zh_cn'],
    additionalProperties: false,
  },
}

// 4言語翻訳関数
export async function translateDescription(descriptionJa: string, featuresJa?: string[]): Promise<{
  descriptionEn: string
  descriptionZhTw: string
  descriptionZhCn: string
  featuresEn: string[]
  featuresZhTw: string[]
  featuresZhCn: string[]
}> {
  const featuresText = featuresJa && featuresJa.length > 0
    ? `\n\nAppeal points / features tags to also translate:\n${featuresJa.map(f => `- ${f}`).join('\n')}`
    : ''

  const response = await openai.chat.completions.create({
    model: TRANSLATE_MODEL,
    messages: [
      {
        role: 'system',
        content: `You are a professional real estate translator. Translate the following Japanese property description into English, Traditional Chinese (Taiwan), and Simplified Chinese.

Requirements:
- Keep the tone professional yet appealing for international investors
- Preserve all specific details (numbers, areas, yields)
- Use appropriate real estate terminology for each language
- Keep the translation natural and culturally appropriate
- Each translation should be 100-300 characters
- For features tags, keep each translated tag short (2-5 words)

Japanese text to translate:
${descriptionJa}${featuresText}`,
      },
      {
        role: 'user',
        content: 'Please translate the property description and features.',
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: translationSchema as Parameters<typeof openai.chat.completions.create>[0]['response_format'] extends { json_schema?: infer T } ? T : never,
    },
  })

  const result = JSON.parse(response.choices[0]?.message?.content || '{}')

  return {
    descriptionEn: result.description_en || '',
    descriptionZhTw: result.description_zh_tw || '',
    descriptionZhCn: result.description_zh_cn || '',
    featuresEn: result.features_en || [],
    featuresZhTw: result.features_zh_tw || [],
    featuresZhCn: result.features_zh_cn || [],
  }
}
