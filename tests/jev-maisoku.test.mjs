import assert from 'node:assert/strict'
import test from 'node:test'
import jev from '../src/lib/jev-maisoku.ts'

const { reviewMaisokuWithJev, formatJevMaisokuNote } = jev

const facts = {
  propertyType: '区分マンション', price: 68000000, city: '目黒区',
  buildingArea: 63, landArea: null, builtYear: 2008,
  currentStatus: '空室', zoning: '第一種住居地域',
  features: ['目黒駅徒歩8分'], warnings: [],
}

test('missing API key leaves the listing for ordinary draft review', async () => {
  const key = process.env.JEV_API_KEY
  const fetchBefore = globalThis.fetch
  delete process.env.JEV_API_KEY
  globalThis.fetch = () => { throw new Error('unexpected network call') }
  try { assert.equal(await reviewMaisokuWithJev(facts), null) }
  finally { if (key === undefined) delete process.env.JEV_API_KEY; else process.env.JEV_API_KEY = key; globalThis.fetch = fetchBefore }
})

test('Jev assesses structured residential facts without publishing or receiving private address', async () => {
  const key = process.env.JEV_API_KEY
  const fetchBefore = globalThis.fetch
  process.env.JEV_API_KEY = 'test-key'
  let request
  globalThis.fetch = async (url, options) => {
    request = { url, options }
    return new Response(JSON.stringify({ model: 'jev-2026-09', answers: {
      residential_fit: { type: 'choice', choice: 'residential_home', confidence: 0.91, probabilities: {} },
      review_priority: { type: 'choice', choice: 'review_soon', confidence: 0.87, probabilities: {} },
    }, usage: { input_tokens: 100, output_tokens: 5 } }), { status: 200 })
  }
  try {
    const result = await reviewMaisokuWithJev(facts)
    assert.equal(request.url, 'https://api.typesafe.ai/v1/systemone')
    assert.equal(request.options.headers.Authorization, 'Bearer test-key')
    const body = JSON.parse(request.options.body)
    assert.equal(body.model, 'jev-latest')
    assert.equal(body.state.city, '目黒区')
    assert.equal('address_full' in body.state, false)
    assert.equal('features' in body.state, false)
    assert.equal('warnings' in body.state, false)
    assert.equal('ad_allowed' in body.state, false)
    assert.equal('publish' in body.questions, false)
    assert.equal(result.fit, 'residential_home')
    assert.match(formatJevMaisokuNote(result), /公開可否・広告許可の判断ではありません/)
  } finally { if (key === undefined) delete process.env.JEV_API_KEY; else process.env.JEV_API_KEY = key; globalThis.fetch = fetchBefore }
})
