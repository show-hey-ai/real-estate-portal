import assert from 'node:assert/strict'
import test from 'node:test'
import { chineseLineName, chinesePlaceName, toChineseScript } from '../src/lib/zh-script'

test('Japanese character forms become Traditional or Simplified Chinese', () => {
  assert.equal(toChineseScript('渋谷区', 'zh-TW'), '澀谷區')
  assert.equal(toChineseScript('渋谷区', 'zh-CN'), '涩谷区')
  assert.equal(toChineseScript('東京都中野区若宮2丁目', 'zh-TW'), '東京都中野區若宮2丁目')
  assert.equal(toChineseScript('恵比寿', 'zh-CN'), '惠比寿')
  assert.equal(toChineseScript('浜松町', 'zh-TW'), '濱松町')
})

test('station names follow the usual Chinese spellings, or English when kana remains', () => {
  assert.equal(chinesePlaceName('虎ノ門', 'Toranomon', 'zh-TW'), '虎之門')
  assert.equal(chinesePlaceName('虎ノ門', 'Toranomon', 'zh-CN'), '虎之门')
  assert.equal(chinesePlaceName('自由が丘', 'Jiyugaoka', 'zh-TW'), '自由之丘')
  assert.equal(chinesePlaceName('市ケ谷', 'Ichigaya', 'zh-TW'), '市谷')
  assert.equal(chinesePlaceName('四ツ谷', 'Yotsuya', 'zh-CN'), '四谷')
  assert.equal(chinesePlaceName('勝どき', 'Kachidoki', 'zh-TW'), 'Kachidoki')
  assert.equal(chinesePlaceName('虎ノ門ヒルズ', 'Toranomon Hills', 'zh-CN'), 'Toranomon Hills')
})

test('line names use the Chinese names buyers know', () => {
  assert.equal(chineseLineName('JR山手線', 'JR Yamanote Line', 'zh-TW'), 'JR山手線')
  assert.equal(chineseLineName('JR山手線', 'JR Yamanote Line', 'zh-CN'), 'JR山手线')
  assert.equal(chineseLineName('東京メトロ丸ノ内線', 'Tokyo Metro Marunouchi Line', 'zh-TW'), '東京地鐵丸之內線')
  assert.equal(chineseLineName('東京メトロ丸ノ内線', 'Tokyo Metro Marunouchi Line', 'zh-CN'), '东京地铁丸之内线')
  assert.equal(chineseLineName('東武スカイツリーライン', 'Tobu Skytree Line', 'zh-TW'), '東武晴空塔線')
  assert.equal(chineseLineName('ゆりかもめ', 'Yurikamome', 'zh-CN'), '百合海鸥')
  assert.equal(chineseLineName('京王井の頭線', 'Keio Inokashira Line', 'zh-TW'), '京王井之頭線')
  assert.equal(chineseLineName('JR湘南新宿ライン', 'JR Shonan-Shinjuku Line', 'zh-CN'), 'JR湘南新宿线')
})
