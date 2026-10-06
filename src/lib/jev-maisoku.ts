/** A second opinion on extracted maisoku facts. Never grants advertising permission or publishes a listing. */
export interface MaisokuFacts {
  propertyType: string
  price: number
  city: string | null
  buildingArea: number | null
  landArea: number | null
  builtYear: number | null
  currentStatus: string | null
  zoning: string | null
  stationCount?: number
  evidenceCount?: number
  features: string[]
  warnings: string[]
}

export interface JevMaisokuReview {
  fit: 'residential_home' | 'residential_land' | 'investment_or_commercial' | 'unclear'
  priority: 'review_soon' | 'standard' | 'needs_facts'
  confidence: number
  model: string
}

const fits = ['residential_home', 'residential_land', 'investment_or_commercial', 'unclear']
const priorities = ['review_soon', 'standard', 'needs_facts']

export async function reviewMaisokuWithJev(facts: MaisokuFacts): Promise<JevMaisokuReview | null> {
  const key = process.env.JEV_API_KEY
  if (!key) return null

  const response = await fetch('https://api.typesafe.ai/v1/systemone', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.JEV_MODEL || 'jev-latest',
      state: {
        property_type: facts.propertyType,
        price_yen: facts.price,
        city: facts.city,
        building_area_sqm: facts.buildingArea,
        land_area_sqm: facts.landArea,
        built_year: facts.builtYear,
        current_status: facts.currentStatus?.slice(0, 100),
        zoning: facts.zoning?.slice(0, 100),
        station_count: facts.stationCount ?? null,
        evidence_count: facts.evidenceCount ?? null,
        feature_count: facts.features.length,
        warning_count: facts.warnings.length,
      },
      questions: {
        residential_fit: {
          type: 'choice',
          instructions: 'Classify this Japanese sale property for a Tokyo property portal with investment, residential, and land categories. Treat missing or conflicting evidence as unclear. Do not assess advertising permission, legal eligibility, mortgage eligibility, investment returns, or whether to publish.',
          criteria: {
            residential_home: 'A condominium unit or house offered with vacant possession or for owner occupation.',
            residential_land: 'Land for sale, regardless of whether its future use is residential or business.',
            investment_or_commercial: 'A whole income-producing building, tenanted investment unit, office, shop, or other investment or commercial asset.',
            unclear: 'Insufficient or conflicting facts to decide.',
          },
        },
        review_priority: {
          type: 'choice',
          instructions: 'Choose how a human broker should queue review of this sale listing. This is only internal triage; do not approve publication.',
          criteria: {
            review_soon: 'Clear category and sufficient basic facts for prompt human review.',
            standard: 'Category appears plausible with ordinary fact checking still needed.',
            needs_facts: 'Critical facts are missing or contradictory; request source confirmation first.',
          },
        },
      },
    }),
    signal: AbortSignal.timeout(10_000),
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`Jev HTTP ${response.status}`)
  const payload = await response.json() as {
    model?: unknown
    answers?: { residential_fit?: { type?: unknown; choice?: unknown; confidence?: unknown }; review_priority?: { type?: unknown; choice?: unknown; confidence?: unknown } }
  }
  const fit = payload.answers?.residential_fit
  const priority = payload.answers?.review_priority
  if (fit?.type !== 'choice' || priority?.type !== 'choice' ||
      !fits.includes(String(fit.choice)) || !priorities.includes(String(priority.choice)) ||
      typeof fit.confidence !== 'number' || !Number.isFinite(fit.confidence) || fit.confidence < 0 || fit.confidence > 1 ||
      typeof priority.confidence !== 'number' || !Number.isFinite(priority.confidence) || priority.confidence < 0 || priority.confidence > 1 ||
      typeof payload.model !== 'string' || payload.model.length > 80) throw new Error('Invalid Jev response')
  return {
    fit: fit.choice as JevMaisokuReview['fit'],
    priority: priority.choice as JevMaisokuReview['priority'],
    confidence: Math.min(fit.confidence, priority.confidence),
    model: payload.model,
  }
}

export function formatJevMaisokuNote(review: JevMaisokuReview): string {
  const fit = { residential_home: '居住用', residential_land: '土地', investment_or_commercial: '投資用の可能性', unclear: '用途判定保留' }[review.fit]
  const priority = { review_soon: '優先確認', standard: '通常確認', needs_facts: '資料の追加確認' }[review.priority]
  return `Jev予備判定 (${review.model}): ${fit} / ${priority} / 信頼度${Math.round(review.confidence * 100)}%。公開可否・広告許可の判断ではありません。`
}
