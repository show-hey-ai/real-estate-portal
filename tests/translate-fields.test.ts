import assert from 'node:assert/strict'
import test from 'node:test'
import { translateStructure } from '../src/lib/translate-fields'

test('structure translations preserve the construction type', () => {
  assert.equal(translateStructure('S', 'en'), 'Steel Frame (S)')
  assert.equal(translateStructure('S', 'zh-CN'), '钢骨结构 (S)')
  assert.equal(translateStructure('SRC造', 'en'), 'Steel Reinforced Concrete (SRC)')
  assert.equal(translateStructure('RC造', 'en'), 'Reinforced Concrete (RC)')
  assert.equal(translateStructure('鉄骨鉄筋コンクリート造', 'en'), 'Steel Reinforced Concrete (SRC)')
})

test('stations seen on published listings have English names', async () => {
  const { translateStationName } = await import('../src/lib/translate-fields')
  const expected: Record<string, string> = {
    '神泉': 'Shinsen', '北参道': 'Kita-Sando', '中野坂上': 'Nakano-Sakaue', '池尻大橋': 'Ikejiri-Ohashi',
    '赤羽橋': 'Akabanebashi', '富士見ヶ丘': 'Fujimigaoka', '京成金町': 'Keisei-Kanamachi', '落合南長崎': 'Ochiai-Minami-Nagasaki',
  }
  for (const [ja, en] of Object.entries(expected)) assert.equal(translateStationName(ja, 'en'), en)
  for (const ja of ['武蔵関', '上石神井', '高井戸', '昭和島', '五反野', '新宿西口', '新大塚', '新江古田', '東長崎', '豊島園', '岩本町', '新中野', '中野富士見町', '東高円寺', '蓮根', '若林', '浜町', '春日', '上井草']) {
    assert.doesNotMatch(translateStationName(ja, 'en') ?? '', /[぀-ヿ一-鿿]/u, ja)
  }
})

test('station labels ignore a Japanese name_en and English text gets known station names', async () => {
  const { formatTransitAccessLabel, romanizeStationNames, translateRailwayLine } = await import('../src/lib/translate-fields')
  assert.equal(formatTransitAccessLabel({ name: '神泉', name_en: '神泉', line: '京王井の頭線', line_en: 'Keio Inokashira Line' }, 'en'), 'Keio Inokashira Line / Shinsen')
  assert.equal(formatTransitAccessLabel({ name: '神泉', name_en: '神泉' }, 'ja'), '神泉')
  assert.equal(romanizeStationNames('4 min walk to 神泉 Station (Keio Inokashira Line).'), '4 min walk to Shinsen Station (Keio Inokashira Line).')
  assert.equal(romanizeStationNames('Near 未知駅名 Station.'), 'Near 未知駅名 Station.')
  assert.equal(romanizeStationNames('7 min walk to Shin-Sakuradai Station (西武有楽町); 3 min walk to Honancho Station (丸ノ内方南).'), '7 min walk to Shin-Sakuradai Station (Seibu Yurakucho Line); 3 min walk to Honancho Station (Tokyo Metro Marunouchi Line (Honancho Branch)).')
  assert.equal(romanizeStationNames('No Japanese here.'), 'No Japanese here.')
  assert.equal(translateRailwayLine('京浜急線', 'en'), 'Keikyu Main Line')
  assert.equal(translateRailwayLine('日暮里舎人', 'en'), 'Nippori-Toneri Liner')
})

test('ward labels use the Chinese characters in Chinese', async () => {
  const { wardLabel } = await import('../src/lib/ward-tile-map')
  assert.equal(wardLabel('渋谷区', 'zh-CN'), '涩谷区')
  assert.equal(wardLabel('渋谷区', 'zh-TW'), '澀谷區')
  assert.equal(wardLabel('台東区', 'zh-CN'), '台东区')
  assert.equal(wardLabel('豊島区', 'zh-TW'), '豐島區')
  assert.equal(wardLabel('渋谷区', 'ja'), '渋谷区')
  assert.equal(wardLabel('渋谷区', 'en'), 'Shibuya')
})
