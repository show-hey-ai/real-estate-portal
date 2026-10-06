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
  assert.equal(titleTemplate('ja'), '%s｜自由不動産')
  assert.equal(titleTemplate('en'), '%s | Ziyou Real Estate')
  assert.equal(listingsSnippet('zh-CN', 26).title, '东京23区在售房源一览（26套）')
})
