import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const extractionSchema = {
  name: 'property_extraction',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      property_type: {
        type: ['string', 'null'],
        enum: ['区分マンション', '一棟マンション', '一棟アパート', '戸建', '土地', '店舗・事務所', 'その他', null],
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
            line: { type: ['string', 'null'], description: '路線名（例: JR山手線）' },
            walk_minutes: { type: ['integer', 'null'], description: '徒歩分' },
          },
          required: ['name', 'line', 'walk_minutes'],
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
      ad_allowed: {
        type: ['boolean', 'null'],
        description: '広告掲載可否。「広告可」「広告転載可」「広告掲載可」「AD可」等の記載があればtrue、「広告不可」「広告転載不可」「広告掲載不可」等があればfalse、記載なしはnull',
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
        description: '物件のアピールポイント・営業文（日本語、150-300文字程度）。マイソクから読み取れる魅力的な点、立地の良さ、投資メリット、物件の特徴を投資家向けにまとめる。',
      },
      appeal_points: {
        type: 'array',
        items: { type: 'string' },
        description: '物件のセールスポイント（箇条書き）。例: 駅徒歩5分、表面利回り8%、新耐震基準、角部屋、オーナーチェンジ可など。',
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
        description: '検出された警告（利回り記載あり、民泊関連記載等）',
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
      'ad_allowed',
      'yield_gross',
      'yield_net',
      'description_ja',
      'appeal_points',
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
10. 広告掲載可否（ad_allowed）: 「広告可」「広告転載可」「広告掲載可」「AD可」等の記載があればtrue。「広告不可」「広告転載不可」等があればfalse。記載が見つからなければnull。

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
    model: 'gpt-4o',
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
