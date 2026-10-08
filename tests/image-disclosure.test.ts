import assert from 'node:assert/strict'
import test from 'node:test'
import { aiImageDisclosure } from '../src/lib/image-disclosure'

test('ordinary images and incidental AI mentions have no AI disclosure', () => {
  for (const caption of [null, undefined, '室内写真', '家具除去なし', 'AI加工なしの室内写真']) {
    assert.equal(aiImageDisclosure(caption, 'ja'), null)
  }
})

test('reviewed AI furniture removal is disclosed in every supported language', () => {
  const caption = 'AI加工画像（原資料提供・一部家具を除去）'
  for (const [locale, label, removal] of [['ja', 'AI加工画像', '一部家具を除去'], ['en', 'AI-edited image', 'some furniture removed'], ['zh-TW', 'AI處理圖片', '部分家具已移除'], ['zh-CN', 'AI处理图片', '部分家具已移除']]) {
    const disclosure = aiImageDisclosure(caption, locale)
    assert.equal(disclosure?.label, label)
    assert.ok(disclosure?.detail.includes(removal))
    assert.ok(!disclosure?.detail.includes('080-'))
  }
})

test('a generic AI image does not invent furniture removal or render private caption text', () => {
  const disclosure = aiImageDisclosure('AI加工画像（原資料提供） 担当080-0000-0000', 'ja')
  assert.ok(disclosure?.detail.includes('AI加工画像'))
  assert.ok(!disclosure?.detail.includes('家具'))
  assert.ok(!disclosure?.detail.includes('080-'))
  assert.equal(aiImageDisclosure('AI加工画像', 'unknown')?.label, 'AI-edited image')
})
