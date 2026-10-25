// Japanese place and line names written for Chinese readers: Japanese-only character forms become
// Traditional (zh-TW) or Simplified (zh-CN) ones, and names that keep kana fall back to English.
// The tables cover the characters used in Tokyo's station, line and ward names and in addresses.

const TW: Record<string, string> = Object.fromEntries([...
  '両兩亀龜仏佛伝傳会會円圓区區参參国國営營増增奥奧学學宝寶寿壽巣巢庁廳広廣徳德恵惠戸戶条條栄榮桜櫻楽樂横橫歳歲氷冰沢澤浅淺浜濱渋澀滝瀧瀬瀨稲稻経經総總緑綠舎舍芦蘆芸藝薬藥蔵藏豊豐鉄鐵郷鄉関關雑雜駅站駄馱麹麴黒黑内內歩步黄黃塩鹽剣劍単單囲圍図圖売賣変變弥彌戦戰数數旧舊気氣満滿礼禮続續縄繩読讀鶏雞竜龍辺邊県縣発發乗乘来來実實将將帯帶糸絲様樣険險験驗隠隱斎齋寛寬渓溪涙淚姫姬拝拜抜拔択擇挙舉掲揭捜搜摂攝団團転轉軽輕効效労勞勧勸巻卷峡峽脳腦郵郵鉱礦銭錢録錄鋳鑄聴聽覚覺観觀誉譽'.match(/../gu) ?? []].map((pair) => [...pair] as [string, string]))

const CN: Record<string, string> = Object.fromEntries([...
  '両两亀龟仏佛伝传円圆営营園园場场増增岡冈島岛巣巢師师庁厅広广庫库後后徳德恵惠戸户東东栄荣桜樱楽乐橋桥歳岁氷冰沢泽浜滨淵渊渋涩湯汤滝泷濃浓瀬濑烏乌稲稻窪洼競竞築筑糸丝経经綾绫総总緑绿線线練练習习臨临舎舍芸艺葉叶蓮莲蔵藏薬药見见親亲調调議议護护豊丰賀贺車车軒轩輪轮郷乡鉄铁銀银錦锦鐘钟長长門门間间関关陽阳際际雑杂雲云電电須须頭头飛飞飯饭飾饰馬马駄驮駅站駒驹鮫鲛鳥鸟鴨鸭鵜鹈鶯莺鷺鹭麹麴黒黑歩步単单囲围図图売卖変变戦战気气満满続续縄绳読读鶏鸡竜龙辺边県县発发乗乘実实帯带様样険险験验隠隐斎斋寛宽涙泪拝拜抜拔択择挙举掲揭捜搜摂摄団团転转軽轻機机開开興兴業业紀纪紅红細细織织網网聖圣華华衛卫補补観观記记説说貝贝貫贯貴贵軍军運运過过達达遠远選选郵邮針针鈴铃鉱矿銭钱鋼钢録录鍛锻鎌镰鏡镜閉闭閣阁陣阵陸陆隣邻難难静静韓韩順顺領领頼赖題题額额類类風风飲饮養养館馆駐驻髪发魚鱼鳳凤鳴鸣鶴鹤鷹鹰齢龄龍龙労劳勧劝巻卷峡峡脳脑聴听覚觉誉誉'.match(/../gu) ?? []].map((pair) => [...pair] as [string, string]))

const KANA = /[぀-ヿ]/u

export type ChineseLocale = 'zh-TW' | 'zh-CN'

export function isChineseLocale(locale: string): locale is ChineseLocale {
  return locale === 'zh-TW' || locale === 'zh-CN'
}

/** Character forms only; kana and Latin letters are left as they are. */
export function toChineseScript(text: string, locale: ChineseLocale): string {
  const table = locale === 'zh-TW' ? TW : CN
  return [...text].map((char) => table[char] ?? char).join('')
}

/** 虎ノ門 → 虎之門, 自由が丘 → 自由之丘, 市ケ谷 → 市谷, 四ツ谷 → 四谷: the usual Chinese spellings. */
function dropJapaneseParticles(name: string): string {
  return name.replace(/[ノのが]/gu, '之').replace(/[ケヶツ]/gu, '')
}

/** A station or place name for Chinese pages; names that still contain kana use the English name. */
export function chinesePlaceName(japanese: string, english: string, locale: ChineseLocale): string {
  const name = dropJapaneseParticles(japanese)
  return KANA.test(name) ? english : toChineseScript(name, locale)
}

const LINE_WORDS: [RegExp, Record<ChineseLocale, string>][] = [
  [/東京メトロ/u, { 'zh-TW': '東京地鐵', 'zh-CN': '东京地铁' }],
  [/スカイツリーライン/u, { 'zh-TW': '晴空塔線', 'zh-CN': '晴空塔线' }],
  [/つくばエクスプレス/u, { 'zh-TW': '筑波快線', 'zh-CN': '筑波快线' }],
  [/りんかい線/u, { 'zh-TW': '臨海線', 'zh-CN': '临海线' }],
  [/ゆりかもめ/u, { 'zh-TW': '百合海鷗', 'zh-CN': '百合海鸥' }],
  [/東京モノレール/u, { 'zh-TW': '東京單軌電車', 'zh-CN': '东京单轨电车' }],
  [/ライナー|ライン/u, { 'zh-TW': '線', 'zh-CN': '线' }],
]

/** A train line name for Chinese pages (JR山手線, 東京地鐵銀座線, 百合海鸥); English when kana remains. */
export function chineseLineName(japanese: string, english: string, locale: ChineseLocale): string {
  const replaced = LINE_WORDS.reduce((name, [pattern, words]) => name.replace(pattern, words[locale]), japanese)
  return chinesePlaceName(replaced, english, locale)
}
