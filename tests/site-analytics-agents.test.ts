import assert from 'node:assert/strict'
import test from 'node:test'
import { isAutomatedAnalyticsAgent } from '../src/lib/site-analytics'

test('performance audits and crawlers are not counted as visitors', () => {
  for (const agent of [
    'Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Mobile Safari/537.36 Chrome-Lighthouse',
    'Mozilla/5.0 (compatible; Google-InspectionTool/1.0)',
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/120.0 Safari/537.36',
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot',
    'Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)',
  ]) assert.equal(isAutomatedAnalyticsAgent(agent), true, agent)
})

test('ordinary browsers are counted', () => {
  assert.equal(isAutomatedAnalyticsAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'), false)
  assert.equal(isAutomatedAnalyticsAgent(null), false)
})
