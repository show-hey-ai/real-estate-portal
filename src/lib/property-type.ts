export const PROPERTY_TYPES = [
  '区分マンション',
  '一棟マンション',
  '一棟アパート',
  '一棟ビル',
  '戸建',
  '土地',
  '店舗・事務所',
  'その他',
] as const

export type PropertyType = (typeof PROPERTY_TYPES)[number]

type PropertyTypeContext = {
  descriptionJa?: string | null
  features?: unknown
  evidence?: { raw_text?: string | null; rawText?: string | null }[] | null
  buildingArea?: number | string | null
  landArea?: number | string | null
  floorCount?: number | string | null
}

function normalizeNumber(value: number | string | null | undefined): number | null {
  if (value == null || value === '') return null
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : null
}

function stringifyFeatures(features: unknown): string {
  if (!features) return ''
  if (Array.isArray(features)) return features.join(' ')
  if (typeof features === 'string') return features
  return ''
}

function getContextText(context: PropertyTypeContext): string {
  const evidenceText = (context.evidence || [])
    .map((item) => item.raw_text || item.rawText || '')
    .join(' ')

  return [
    context.descriptionJa,
    stringifyFeatures(context.features),
    evidenceText,
  ]
    .filter(Boolean)
    .join(' ')
}

export function normalizePropertyType(
  propertyType: string | null | undefined,
  context: PropertyTypeContext = {},
): PropertyType | null {
  const current = PROPERTY_TYPES.includes(propertyType as PropertyType)
    ? (propertyType as PropertyType)
    : null
  const text = getContextText(context)
  const buildingArea = normalizeNumber(context.buildingArea)
  const landArea = normalizeNumber(context.landArea)
  const floorCount = normalizeNumber(context.floorCount)
  const hasWholeBuildingScale =
    (buildingArea != null && buildingArea >= 120 && landArea != null && landArea >= 40) ||
    (floorCount != null && floorCount >= 2 && buildingArea != null && buildingArea >= 120)

  if (/売地|更地|土地売買|ホテル用地|開発用地|建築条件/.test(text) && !buildingArea) {
    return '土地'
  }

  if (/一棟アパート|1棟アパート|売アパート|アパート一棟/.test(text)) {
    return '一棟アパート'
  }

  if (
    /一棟ビル|1棟ビル|売ビル|収益ビル|ビル一棟|店舗ビル|事務所ビル|賃貸ビル/.test(text) ||
    (/ビル/.test(text) && /土地面積|建物延|建物面積|満室|利回り|賃料/.test(text) && hasWholeBuildingScale)
  ) {
    return '一棟ビル'
  }

  if (
    /一棟マンション|1棟マンション|一棟売収益マンション|築浅一棟|売収益マンション|収益マンション|共同住宅|全[0-9０-９]+室|総戸数[0-9０-９]+戸|[0-9０-９]+戸中|[0-9０-９]+室中/.test(text) &&
    hasWholeBuildingScale
  ) {
    return '一棟マンション'
  }

  if (/戸建|一戸建|売一戸建|住宅一棟/.test(text) && !/[0-9０-９]+室中|全[0-9０-９]+室|総戸数[0-9０-９]+戸/.test(text)) {
    return '戸建'
  }

  if (/店舗|事務所|工場|美容室/.test(text) && /区分所有|[0-9０-９]+階部分|専有面積/.test(text)) {
    return '店舗・事務所'
  }

  if (/区分マンション|区分所有|専有面積|所在階|[0-9０-９]+階部分|号室|管理費|修繕積立金|分譲マンション/.test(text)) {
    return '区分マンション'
  }

  return current
}
