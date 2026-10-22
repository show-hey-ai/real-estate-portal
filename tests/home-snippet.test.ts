import assert from 'node:assert/strict'
import test from 'node:test'
import { homeSnippet } from '../src/lib/home-snippet'

test('the home snippet leads with the live listing count in every language', () => {
  assert.match(homeSnippet('ja', 26).title, /^東京23区の売買物件26件/)
  assert.match(homeSnippet('en', 26).title, /^26 Tokyo Properties for Sale/)
  assert.match(homeSnippet('zh-TW', 26).title, /26筆/)
  assert.match(homeSnippet('zh-CN', 26).title, /26套/)
  assert.match(homeSnippet('ja', 26).description, /登録なし/)
})

test('without inventory the snippet drops the count instead of showing zero', () => {
  for (const locale of ['ja', 'en', 'zh-TW', 'zh-CN']) {
    const snippet = homeSnippet(locale, 0)
    assert.doesNotMatch(snippet.title, /\b0\b|0件|0筆|0套/)
    assert.doesNotMatch(snippet.description, /\b0 properties|0件|0筆|0套/)
  }
})

test('collection titles carry the count, and the brand follows the language', async () => {
  const { countedTitle, titleTemplate, listingsSnippet } = await import('../src/lib/home-snippet')
  assert.equal(countedTitle('港区の売買物件', 4, 'ja'), '港区の売買物件（4件）')
  assert.equal(countedTitle('Property for sale in Minato, Tokyo', 4, 'en'), 'Property for sale in Minato, Tokyo (4)')
  assert.equal(countedTitle('港区の売買物件', 0, 'ja'), '港区の売買物件')
  assert.equal(titleTemplate('ja'), '%s｜Welcome Home Tokyo')
  assert.equal(titleTemplate('en'), '%s | Welcome Home Tokyo')
  assert.equal(listingsSnippet('zh-CN', 26).title, '东京23区在售房源一览（26套）')
})

test('the home hero names what is for sale, the count and foreign buyers, in every language', async () => {
  const { homeHero } = await import('../src/lib/home-snippet')
  const en = homeHero('en', 182)
  assert.match(en.title, /182/)
  assert.match(en.title, /Tokyo/)
  assert.match(`${en.title} ${en.description}`, /for sale/i)
  assert.match(en.description, /foreign/i)
  assert.equal(en.browse, 'Browse 182 properties')
  assert.match(homeHero('ja', 182).title, /182件/)
  assert.match(homeHero('ja', 182).title, /中古マンション/)
  assert.match(homeHero('ja', 182).description, /外国籍/)
  assert.equal(homeHero('ja', 182).browse, '182件の物件を見る')
  assert.match(homeHero('zh-TW', 182).title, /182筆/)
  assert.match(homeHero('zh-CN', 182).title, /182套/)
})

test('the home hero drops the number when nothing is published', async () => {
  const { homeHero } = await import('../src/lib/home-snippet')
  for (const locale of ['ja', 'en', 'zh-TW', 'zh-CN']) {
    const hero = homeHero(locale, 0)
    assert.doesNotMatch(`${hero.title} ${hero.description} ${hero.browse}`, /\b0\b|0件|0筆|0套/)
    assert.ok(hero.browse.length > 0)
  }
})
