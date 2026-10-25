import assert from 'node:assert/strict'
import test from 'node:test'
import { toPublicDescription } from '../src/lib/public-description'

test('Japanese descriptions name the sales flyer and listing information, not REINS or 原資料', () => {
  assert.equal(
    toPublicDescription('現況は空室、最新REINSでは即時引渡し。原資料の参考月額賃料55,000円。', 'ja'),
    '現況は空室、最新の物件情報では即時引渡し。販売図面の参考月額賃料55,000円。',
  )
  assert.equal(toPublicDescription('原資料・最新REINSには確認書の記載があります。', 'ja'), '販売図面・最新の物件情報には確認書の記載があります。')
  assert.equal(toPublicDescription('現行REINSの所在階は地下1階。REINSは即時。', 'ja'), '最新の物件情報の所在階は地下1階。最新の物件情報は即時。')
  assert.equal(toPublicDescription('外観写真は原資料提供で、撮影時期は未確認です。', 'ja'), '外観写真は販売図面からの転載で、撮影時期は未確認です。')
  assert.equal(toPublicDescription('原現資料に変更予定と記載。原図面では南東角住戸。', 'ja'), '販売図面に変更予定と記載。販売図面では南東角住戸。')
})

test('internal consistency notes are dropped from Japanese descriptions', () => {
  assert.equal(
    toPublicDescription('2019年築。原資料のバルコニー8.42㎡は現行記載と整合しています。所有権。', 'ja'),
    '2019年築。所有権。',
  )
})

test('English descriptions say listing information instead of REINS, keeping sentence capitals', () => {
  assert.equal(
    toPublicDescription('Current REINS gives a 12-minute walk. The source states vacant; the current REINS states rented.', 'en'),
    'The latest listing information gives a 12-minute walk. The source states vacant; the latest listing information states rented.',
  )
  assert.equal(toPublicDescription('REINS lists RC; latest REINS lists SRC.', 'en'), 'The latest listing information lists RC; the latest listing information lists SRC.')
})

test('Chinese descriptions replace REINS in both scripts', () => {
  assert.equal(toPublicDescription('現況空置，現行REINS記載可立即交屋，REINS及圖面記載11分鐘。', 'zh-TW'), '現況空置，最新物件資訊記載可立即交屋，最新物件資訊及圖面記載11分鐘。')
  assert.equal(toPublicDescription('丰洲站步行依最新REINS为14分钟。', 'zh-CN'), '丰洲站步行依最新物件信息为14分钟。')
})

test('empty descriptions stay empty', () => {
  assert.equal(toPublicDescription(null, 'ja'), null)
  assert.equal(toPublicDescription('', 'en'), null)
})
