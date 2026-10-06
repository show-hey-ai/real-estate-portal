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
