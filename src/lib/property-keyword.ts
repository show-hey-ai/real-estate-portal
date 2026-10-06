import { TOKYO_23_WARDS } from './public-search'
import { translateCityName } from './translate-fields'

const chineseWards: Record<string, readonly string[]> = {
  新宿区: ['新宿區'], 渋谷区: ['澀谷區', '澀谷区', '涩谷区'], 港区: ['港區'],
  品川区: ['品川區'], 豊島区: ['豐島區', '丰岛区'], 大田区: ['大田區'],
  目黒区: ['目黑區', '目黑区'], 文京区: ['文京區'], 中央区: ['中央區'],
  千代田区: ['千代田區'], 世田谷区: ['世田谷區'], 杉並区: ['杉並區', '杉并区'],
  中野区: ['中野區'], 台東区: ['台東區', '台东区'], 墨田区: ['墨田區'],
  江東区: ['江東區', '江东区'], 北区: ['北區'], 荒川区: ['荒川區'],
  板橋区: ['板橋區', '板桥区'], 練馬区: ['練馬區', '练马区'], 足立区: ['足立區'],
  葛飾区: ['葛飾區', '葛饰区'], 江戸川区: ['江戶川區', '江户川区'],
}

/** Resolve known ward names only; preserve other address keywords without guessing. */
export function normalizePropertyKeyword(input: string | undefined): string {
  const safe = (input || '').normalize('NFKC').replace(/[^\p{L}\p{N}\s-]/gu, '').trim().slice(0, 80)
  const name = safe.toLowerCase().replace(/(?:\s+|-)(?:ward|ku)$/u, '').trim()
  for (const ward of TOKYO_23_WARDS) {
    const english = translateCityName(ward, 'en')!.toLowerCase()
    if (name === english || safe === ward || chineseWards[ward]?.includes(safe)) return ward
  }
  return safe
}
