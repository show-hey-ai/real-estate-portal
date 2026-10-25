/**
 * Train lines inside Tokyo's 23 wards as buyers know them (service names such as the Yamanote loop
 * or the Keihin-Tohoku Line, not the track sections in the national data), with their stations in
 * running order. Only stations inside the 23 wards are listed (owner decision 2026-10-25).
 *
 * Checked against 国土数値情報 鉄道データ N02 (2025) by scripts/build-transit.ts: every station
 * must exist there, and neighbouring stations must be close to each other.
 */
export type LineCategory = 'jr' | 'metro' | 'toei' | 'private'

export interface TransitLine {
  id: string
  ja: string
  en: string
  category: LineCategory
  /** Company shown as the group heading for private railways. */
  operator: string
  color: string
  stations: readonly string[]
  /** The last station runs on to this one (the Yamanote loop, the Oedo Line's loop). */
  loopTo?: string
  /** Short spurs that leave the main line at `from`. */
  branches?: readonly { from: string; stations: readonly string[] }[]
  /** Other ways listings write the line name. */
  aliases?: readonly string[]
}

export const TRANSIT_LINES: readonly TransitLine[] = [
  // JR East
  { id: 'jr-yamanote', ja: 'JR山手線', en: 'JR Yamanote Line', category: 'jr', operator: 'JR東日本', color: '#80c241', loopTo: '東京', aliases: ['山手線', '山手線等'],
    stations: ['東京', '有楽町', '新橋', '浜松町', '田町', '高輪ゲートウェイ', '品川', '大崎', '五反田', '目黒', '恵比寿', '渋谷', '原宿', '代々木', '新宿', '新大久保', '高田馬場', '目白', '池袋', '大塚', '巣鴨', '駒込', '田端', '西日暮里', '日暮里', '鶯谷', '上野', '御徒町', '秋葉原', '神田'] },
  { id: 'jr-keihin-tohoku', ja: 'JR京浜東北線', en: 'JR Keihin-Tohoku Line', category: 'jr', operator: 'JR東日本', color: '#00b2e5', aliases: ['京浜東北線', 'JR京浜東北・根岸線'],
    stations: ['赤羽', '東十条', '王子', '上中里', '田端', '西日暮里', '日暮里', '鶯谷', '上野', '御徒町', '秋葉原', '神田', '東京', '有楽町', '新橋', '浜松町', '田町', '高輪ゲートウェイ', '品川', '大井町', '大森', '蒲田'] },
  { id: 'jr-chuo-rapid', ja: 'JR中央線（快速）', en: 'JR Chuo Line (Rapid)', category: 'jr', operator: 'JR東日本', color: '#f15a22', aliases: ['JR中央線', '中央線', 'JR中央本線', 'JR中央線快速', '中央線快速'],
    stations: ['東京', '神田', '御茶ノ水', '四ツ谷', '新宿', '中野', '高円寺', '阿佐ケ谷', '荻窪', '西荻窪'] },
  { id: 'jr-chuo-sobu-local', ja: 'JR中央・総武線（各駅停車）', en: 'JR Chuo-Sobu Line (Local)', category: 'jr', operator: 'JR東日本', color: '#ffd400', aliases: ['JR総武線', '総武線', 'JR中央・総武線', 'JR総武中央線', '総武中央線', '総武・中央線', 'JR中央総武線', '中央・総武線'],
    stations: ['西荻窪', '荻窪', '阿佐ケ谷', '高円寺', '中野', '東中野', '大久保', '新宿', '代々木', '千駄ケ谷', '信濃町', '四ツ谷', '市ケ谷', '飯田橋', '水道橋', '御茶ノ水', '秋葉原', '浅草橋', '両国', '錦糸町', '亀戸', '平井', '新小岩', '小岩'] },
  { id: 'jr-sobu-rapid', ja: 'JR総武線（快速）', en: 'JR Sobu Line (Rapid)', category: 'jr', operator: 'JR東日本', color: '#0067c0', aliases: ['JR総武快速線', '総武快速線', 'JR総武本線'],
    stations: ['東京', '新日本橋', '馬喰町', '錦糸町', '新小岩'] },
  { id: 'jr-saikyo', ja: 'JR埼京線', en: 'JR Saikyo Line', category: 'jr', operator: 'JR東日本', color: '#00ac9a', aliases: ['埼京線', '赤羽線', 'JR赤羽線'],
    stations: ['大崎', '恵比寿', '渋谷', '新宿', '池袋', '板橋', '十条', '赤羽', '北赤羽', '浮間舟渡'] },
  { id: 'jr-shonan-shinjuku', ja: 'JR湘南新宿ライン', en: 'JR Shonan-Shinjuku Line', category: 'jr', operator: 'JR東日本', color: '#e21f26', aliases: ['湘南新宿ライン'],
    stations: ['西大井', '大崎', '恵比寿', '渋谷', '新宿', '池袋', '赤羽'] },
  { id: 'jr-tokaido', ja: 'JR東海道線', en: 'JR Tokaido Line', category: 'jr', operator: 'JR東日本', color: '#f68b1e', aliases: ['東海道線', 'JR東海道本線', 'JR上野東京ライン', '上野東京ライン'],
    stations: ['東京', '新橋', '品川'] },
  { id: 'jr-yokosuka', ja: 'JR横須賀線', en: 'JR Yokosuka Line', category: 'jr', operator: 'JR東日本', color: '#1e50a2', aliases: ['横須賀線'],
    stations: ['東京', '新橋', '品川', '西大井'] },
  { id: 'jr-utsunomiya-takasaki', ja: 'JR宇都宮線・高崎線', en: 'JR Utsunomiya / Takasaki Line', category: 'jr', operator: 'JR東日本', color: '#f39700', aliases: ['JR宇都宮線', '宇都宮線', 'JR高崎線', '高崎線', '東北本線(宇都宮線)', 'JR東北本線', '東北本線'],
    stations: ['東京', '上野', '尾久', '赤羽'] },
  { id: 'jr-joban', ja: 'JR常磐線', en: 'JR Joban Line', category: 'jr', operator: 'JR東日本', color: '#00b261', aliases: ['常磐線', '常磐緩線', '常磐緩行線', 'JR常磐緩行線', 'JR常磐線快速', '常磐線快速'],
    stations: ['上野', '日暮里', '三河島', '南千住', '北千住', '綾瀬', '亀有', '金町'] },
  { id: 'jr-keiyo', ja: 'JR京葉線', en: 'JR Keiyo Line', category: 'jr', operator: 'JR東日本', color: '#c9242f', aliases: ['京葉線'],
    stations: ['東京', '八丁堀', '越中島', '潮見', '新木場', '葛西臨海公園'] },

  // Tokyo Metro
  { id: 'metro-ginza', ja: '東京メトロ銀座線', en: 'Tokyo Metro Ginza Line', category: 'metro', operator: '東京メトロ', color: '#ff9500', aliases: ['銀座線'],
    stations: ['渋谷', '表参道', '外苑前', '青山一丁目', '赤坂見附', '溜池山王', '虎ノ門', '新橋', '銀座', '京橋', '日本橋', '三越前', '神田', '末広町', '上野広小路', '上野', '稲荷町', '田原町', '浅草'] },
  { id: 'metro-marunouchi', ja: '東京メトロ丸ノ内線', en: 'Tokyo Metro Marunouchi Line', category: 'metro', operator: '東京メトロ', color: '#f62e36', aliases: ['丸ノ内線', '丸の内線', '丸ノ内方南', '丸ノ内線方南町支線'],
    stations: ['池袋', '新大塚', '茗荷谷', '後楽園', '本郷三丁目', '御茶ノ水', '淡路町', '大手町', '東京', '銀座', '霞ケ関', '国会議事堂前', '赤坂見附', '四ツ谷', '四谷三丁目', '新宿御苑前', '新宿三丁目', '新宿', '西新宿', '中野坂上', '新中野', '東高円寺', '新高円寺', '南阿佐ケ谷', '荻窪'],
    branches: [{ from: '中野坂上', stations: ['中野新橋', '中野富士見町', '方南町'] }] },
  { id: 'metro-hibiya', ja: '東京メトロ日比谷線', en: 'Tokyo Metro Hibiya Line', category: 'metro', operator: '東京メトロ', color: '#9a9a8f', aliases: ['日比谷線'],
    stations: ['中目黒', '恵比寿', '広尾', '六本木', '神谷町', '虎ノ門ヒルズ', '霞ケ関', '日比谷', '銀座', '東銀座', '築地', '八丁堀', '茅場町', '人形町', '小伝馬町', '秋葉原', '仲御徒町', '上野', '入谷', '三ノ輪', '南千住', '北千住'] },
  { id: 'metro-tozai', ja: '東京メトロ東西線', en: 'Tokyo Metro Tozai Line', category: 'metro', operator: '東京メトロ', color: '#009bbf', aliases: ['東西線', '東京メトロ下半東西線'],
    stations: ['中野', '落合', '高田馬場', '早稲田', '神楽坂', '飯田橋', '九段下', '竹橋', '大手町', '日本橋', '茅場町', '門前仲町', '木場', '東陽町', '南砂町', '西葛西', '葛西'] },
  { id: 'metro-chiyoda', ja: '東京メトロ千代田線', en: 'Tokyo Metro Chiyoda Line', category: 'metro', operator: '東京メトロ', color: '#00bb85', aliases: ['千代田線'],
    stations: ['代々木上原', '代々木公園', '明治神宮前', '表参道', '乃木坂', '赤坂', '国会議事堂前', '霞ケ関', '日比谷', '二重橋前', '大手町', '新御茶ノ水', '湯島', '根津', '千駄木', '西日暮里', '町屋', '北千住', '綾瀬', '北綾瀬'] },
  { id: 'metro-yurakucho', ja: '東京メトロ有楽町線', en: 'Tokyo Metro Yurakucho Line', category: 'metro', operator: '東京メトロ', color: '#c1a470', aliases: ['有楽町線'],
    stations: ['地下鉄成増', '地下鉄赤塚', '平和台', '氷川台', '小竹向原', '千川', '要町', '池袋', '東池袋', '護国寺', '江戸川橋', '飯田橋', '市ケ谷', '麹町', '永田町', '桜田門', '有楽町', '銀座一丁目', '新富町', '月島', '豊洲', '辰巳', '新木場'] },
  { id: 'metro-hanzomon', ja: '東京メトロ半蔵門線', en: 'Tokyo Metro Hanzomon Line', category: 'metro', operator: '東京メトロ', color: '#8f76d6', aliases: ['半蔵門線'],
    stations: ['渋谷', '表参道', '青山一丁目', '永田町', '半蔵門', '九段下', '神保町', '大手町', '三越前', '水天宮前', '清澄白河', '住吉', '錦糸町', '押上'] },
  { id: 'metro-namboku', ja: '東京メトロ南北線', en: 'Tokyo Metro Namboku Line', category: 'metro', operator: '東京メトロ', color: '#00ac9b', aliases: ['南北線', '埼玉高速線', '埼玉高速鉄道線'],
    stations: ['目黒', '白金台', '白金高輪', '麻布十番', '六本木一丁目', '溜池山王', '永田町', '四ツ谷', '市ケ谷', '飯田橋', '後楽園', '東大前', '本駒込', '駒込', '西ケ原', '王子', '王子神谷', '志茂', '赤羽岩淵'] },
  { id: 'metro-fukutoshin', ja: '東京メトロ副都心線', en: 'Tokyo Metro Fukutoshin Line', category: 'metro', operator: '東京メトロ', color: '#9c5e31', aliases: ['副都心線'],
    stations: ['地下鉄成増', '地下鉄赤塚', '平和台', '氷川台', '小竹向原', '千川', '要町', '池袋', '雑司が谷', '西早稲田', '東新宿', '新宿三丁目', '北参道', '明治神宮前', '渋谷'] },

  // Toei (Tokyo Metropolitan Bureau of Transportation)
  { id: 'toei-asakusa', ja: '都営浅草線', en: 'Toei Asakusa Line', category: 'toei', operator: '都営', color: '#e85298', aliases: ['浅草線'],
    stations: ['西馬込', '馬込', '中延', '戸越', '五反田', '高輪台', '泉岳寺', '三田', '大門', '新橋', '東銀座', '宝町', '日本橋', '人形町', '東日本橋', '浅草橋', '蔵前', '浅草', '本所吾妻橋', '押上'] },
  { id: 'toei-mita', ja: '都営三田線', en: 'Toei Mita Line', category: 'toei', operator: '都営', color: '#0079c2', aliases: ['三田線'],
    stations: ['目黒', '白金台', '白金高輪', '三田', '芝公園', '御成門', '内幸町', '日比谷', '大手町', '神保町', '水道橋', '春日', '白山', '千石', '巣鴨', '西巣鴨', '新板橋', '板橋区役所前', '板橋本町', '本蓮沼', '志村坂上', '志村三丁目', '蓮根', '西台', '高島平', '新高島平', '西高島平'] },
  { id: 'toei-shinjuku', ja: '都営新宿線', en: 'Toei Shinjuku Line', category: 'toei', operator: '都営', color: '#6cbb5a', aliases: ['新宿線'],
    stations: ['新宿', '新宿三丁目', '曙橋', '市ケ谷', '九段下', '神保町', '小川町', '岩本町', '馬喰横山', '浜町', '森下', '菊川', '住吉', '西大島', '大島', '東大島', '船堀', '一之江', '瑞江', '篠崎'] },
  { id: 'toei-oedo', ja: '都営大江戸線', en: 'Toei Oedo Line', category: 'toei', operator: '都営', color: '#b6007a', loopTo: '都庁前', aliases: ['大江戸線'],
    stations: ['光が丘', '練馬春日町', '豊島園', '練馬', '新江古田', '落合南長崎', '中井', '東中野', '中野坂上', '西新宿五丁目', '都庁前', '新宿西口', '東新宿', '若松河田', '牛込柳町', '牛込神楽坂', '飯田橋', '春日', '本郷三丁目', '上野御徒町', '新御徒町', '蔵前', '両国', '森下', '清澄白河', '門前仲町', '月島', '勝どき', '築地市場', '汐留', '大門', '赤羽橋', '麻布十番', '六本木', '青山一丁目', '国立競技場', '代々木', '新宿'] },
  { id: 'toden-arakawa', ja: '都電荒川線', en: 'Toden Arakawa Line', category: 'toei', operator: '都営', color: '#dd6b9b', aliases: ['荒川線', '東京さくらトラム', '都電荒川線（東京さくらトラム）'],
    stations: ['三ノ輪橋', '荒川一中前', '荒川区役所前', '荒川二丁目', '荒川七丁目', '町屋駅前', '町屋二丁目', '東尾久三丁目', '熊野前', '宮ノ前', '小台', '荒川遊園地前', '荒川車庫前', '梶原', '栄町', '王子駅前', '飛鳥山', '滝野川一丁目', '西ケ原四丁目', '新庚申塚', '庚申塚', '巣鴨新田', '大塚駅前', '向原', '東池袋四丁目', '都電雑司ケ谷', '鬼子母神前', '学習院下', '面影橋', '早稲田'] },
  { id: 'nippori-toneri-liner', ja: '日暮里・舎人ライナー', en: 'Nippori-Toneri Liner', category: 'toei', operator: '都営', color: '#e06ea8', aliases: ['日暮里舎人ライナー', '舎人ライナー', '日暮里舎人'],
    stations: ['日暮里', '西日暮里', '赤土小学校前', '熊野前', '足立小台', '扇大橋', '高野', '江北', '西新井大師西', '谷在家', '舎人公園', '舎人', '見沼代親水公園'] },

  // Private railways
  { id: 'tokyu-toyoko', ja: '東急東横線', en: 'Tokyu Toyoko Line', category: 'private', operator: '東急', color: '#da0442', aliases: ['東横線'],
    stations: ['渋谷', '代官山', '中目黒', '祐天寺', '学芸大学', '都立大学', '自由が丘', '田園調布', '多摩川'] },
  { id: 'tokyu-meguro', ja: '東急目黒線', en: 'Tokyu Meguro Line', category: 'private', operator: '東急', color: '#009cd2', aliases: ['目黒線'],
    stations: ['目黒', '不動前', '武蔵小山', '西小山', '洗足', '大岡山', '奥沢', '田園調布', '多摩川'] },
  { id: 'tokyu-den-en-toshi', ja: '東急田園都市線', en: 'Tokyu Den-en-toshi Line', category: 'private', operator: '東急', color: '#20a288', aliases: ['田園都市線'],
    stations: ['渋谷', '池尻大橋', '三軒茶屋', '駒沢大学', '桜新町', '用賀', '二子玉川'] },
  { id: 'tokyu-oimachi', ja: '東急大井町線', en: 'Tokyu Oimachi Line', category: 'private', operator: '東急', color: '#f18c43', aliases: ['大井町線'],
    stations: ['大井町', '下神明', '戸越公園', '中延', '荏原町', '旗の台', '北千束', '大岡山', '緑が丘', '自由が丘', '九品仏', '尾山台', '等々力', '上野毛', '二子玉川'] },
  { id: 'tokyu-ikegami', ja: '東急池上線', en: 'Tokyu Ikegami Line', category: 'private', operator: '東急', color: '#ee86a7', aliases: ['池上線'],
    stations: ['五反田', '大崎広小路', '戸越銀座', '荏原中延', '旗の台', '長原', '洗足池', '石川台', '雪が谷大塚', '御嶽山', '久が原', '千鳥町', '池上', '蓮沼', '蒲田'] },
  { id: 'tokyu-tamagawa', ja: '東急多摩川線', en: 'Tokyu Tamagawa Line', category: 'private', operator: '東急', color: '#ae0378', aliases: ['多摩川線', '東急多摩川'],
    stations: ['多摩川', '沼部', '鵜の木', '下丸子', '武蔵新田', '矢口渡', '蒲田'] },
  { id: 'tokyu-setagaya', ja: '東急世田谷線', en: 'Tokyu Setagaya Line', category: 'private', operator: '東急', color: '#e5a800', aliases: ['世田谷線'],
    stations: ['三軒茶屋', '西太子堂', '若林', '松陰神社前', '世田谷', '上町', '宮の坂', '山下', '松原', '下高井戸'] },
  { id: 'keio', ja: '京王線', en: 'Keio Line', category: 'private', operator: '京王', color: '#dd0077', aliases: ['京王新線', '京王本線'],
    stations: ['新宿', '初台', '幡ヶ谷', '笹塚', '代田橋', '明大前', '下高井戸', '桜上水', '上北沢', '八幡山', '芦花公園', '千歳烏山'] },
  { id: 'keio-inokashira', ja: '京王井の頭線', en: 'Keio Inokashira Line', category: 'private', operator: '京王', color: '#2b3f8f', aliases: ['井の頭線'],
    stations: ['渋谷', '神泉', '駒場東大前', '池ノ上', '下北沢', '新代田', '東松原', '明大前', '永福町', '西永福', '浜田山', '高井戸', '富士見ヶ丘', '久我山'] },
  { id: 'odakyu', ja: '小田急小田原線', en: 'Odakyu Odawara Line', category: 'private', operator: '小田急', color: '#2288cc', aliases: ['小田急線', '小田原線', '小田急電鉄小田原線'],
    stations: ['新宿', '南新宿', '参宮橋', '代々木八幡', '代々木上原', '東北沢', '下北沢', '世田谷代田', '梅ヶ丘', '豪徳寺', '経堂', '千歳船橋', '祖師ヶ谷大蔵', '成城学園前', '喜多見'] },
  { id: 'seibu-ikebukuro', ja: '西武池袋線', en: 'Seibu Ikebukuro Line', category: 'private', operator: '西武', color: '#f5a200', aliases: ['池袋線'],
    stations: ['池袋', '椎名町', '東長崎', '江古田', '桜台', '練馬', '中村橋', '富士見台', '練馬高野台', '石神井公園', '大泉学園'] },
  { id: 'seibu-shinjuku', ja: '西武新宿線', en: 'Seibu Shinjuku Line', category: 'private', operator: '西武', color: '#00a0de',
    stations: ['西武新宿', '高田馬場', '下落合', '中井', '新井薬師前', '沼袋', '野方', '都立家政', '鷺ノ宮', '下井草', '井荻', '上井草', '上石神井', '武蔵関'] },
  { id: 'seibu-yurakucho', ja: '西武有楽町線', en: 'Seibu Yurakucho Line', category: 'private', operator: '西武', color: '#f5a200', aliases: ['西武有楽町'],
    stations: ['小竹向原', '新桜台', '練馬'] },
  { id: 'seibu-toshima', ja: '西武豊島線', en: 'Seibu Toshima Line', category: 'private', operator: '西武', color: '#f5a200', aliases: ['豊島線'],
    stations: ['練馬', '豊島園'] },
  { id: 'tobu-tojo', ja: '東武東上線', en: 'Tobu Tojo Line', category: 'private', operator: '東武', color: '#0f6cc3', aliases: ['東上線', '東武東上本線'],
    stations: ['池袋', '北池袋', '下板橋', '大山', '中板橋', 'ときわ台', '上板橋', '東武練馬', '下赤塚', '成増'] },
  { id: 'tobu-skytree', ja: '東武スカイツリーライン', en: 'Tobu Skytree Line', category: 'private', operator: '東武', color: '#0f6cc3', aliases: ['東武伊勢崎線', '伊勢崎線', 'スカイツリーライン'],
    stations: ['浅草', 'とうきょうスカイツリー', '曳舟', '東向島', '鐘ヶ淵', '堀切', '牛田', '北千住', '小菅', '五反野', '梅島', '西新井', '竹ノ塚'],
    branches: [{ from: '曳舟', stations: ['押上'] }] },
  { id: 'tobu-kameido', ja: '東武亀戸線', en: 'Tobu Kameido Line', category: 'private', operator: '東武', color: '#0f6cc3', aliases: ['亀戸線'],
    stations: ['曳舟', '小村井', '東あずま', '亀戸水神', '亀戸'] },
  { id: 'tobu-daishi', ja: '東武大師線', en: 'Tobu Daishi Line', category: 'private', operator: '東武', color: '#0f6cc3', aliases: ['大師線'],
    stations: ['西新井', '大師前'] },
  { id: 'keisei-main', ja: '京成本線', en: 'Keisei Main Line', category: 'private', operator: '京成', color: '#0068b7', aliases: ['京成線'],
    stations: ['京成上野', '日暮里', '新三河島', '町屋', '千住大橋', '京成関屋', '堀切菖蒲園', 'お花茶屋', '青砥', '京成高砂', '京成小岩', '江戸川'] },
  { id: 'keisei-oshiage', ja: '京成押上線', en: 'Keisei Oshiage Line', category: 'private', operator: '京成', color: '#0068b7', aliases: ['押上線'],
    stations: ['押上', '京成曳舟', '八広', '四ツ木', '京成立石', '青砥'] },
  { id: 'keisei-kanamachi', ja: '京成金町線', en: 'Keisei Kanamachi Line', category: 'private', operator: '京成', color: '#0068b7', aliases: ['金町線'],
    stations: ['京成高砂', '柴又', '京成金町'] },
  { id: 'hokuso', ja: '北総線', en: 'Hokuso Line', category: 'private', operator: '北総鉄道', color: '#3a7bd5', aliases: ['北総鉄道', '成田スカイアクセス', '京成成田空港線'],
    stations: ['京成高砂', '新柴又'] },
  { id: 'keikyu-main', ja: '京急本線', en: 'Keikyu Main Line', category: 'private', operator: '京急', color: '#e5171f', aliases: ['京浜急行本線', '京浜急行線', '京浜急行', '京急線', '京浜急線'],
    stations: ['泉岳寺', '品川', '北品川', '新馬場', '青物横丁', '鮫洲', '立会川', '大森海岸', '平和島', '大森町', '梅屋敷', '京急蒲田', '雑色', '六郷土手'] },
  { id: 'keikyu-airport', ja: '京急空港線', en: 'Keikyu Airport Line', category: 'private', operator: '京急', color: '#e5171f', aliases: ['空港線'],
    stations: ['京急蒲田', '糀谷', '大鳥居', '穴守稲荷', '天空橋', '羽田空港第3ターミナル', '羽田空港第1・第2ターミナル'] },
  { id: 'tsukuba-express', ja: 'つくばエクスプレス', en: 'Tsukuba Express', category: 'private', operator: 'つくばエクスプレス', color: '#c8102e', aliases: ['つくばEX', 'TX', '常磐新線'],
    stations: ['秋葉原', '新御徒町', '浅草', '南千住', '北千住', '青井', '六町'] },
  { id: 'rinkai', ja: 'りんかい線', en: 'Rinkai Line', category: 'private', operator: 'りんかい線', color: '#00418e', aliases: ['東京臨海高速鉄道りんかい線', '臨海副都心線'],
    stations: ['大崎', '大井町', '品川シーサイド', '天王洲アイル', '東京テレポート', '国際展示場', '東雲', '新木場'] },
  { id: 'yurikamome', ja: 'ゆりかもめ', en: 'Yurikamome', category: 'private', operator: 'ゆりかもめ', color: '#27a8a0', aliases: ['ゆりかもめ線', '新交通ゆりかもめ', '東京臨海新交通臨海線'],
    stations: ['新橋', '汐留', '竹芝', '日の出', '芝浦ふ頭', 'お台場海浜公園', '台場', '東京国際クルーズターミナル', 'テレコムセンター', '青海', '東京ビッグサイト', '有明', '有明テニスの森', '市場前', '新豊洲', '豊洲'] },
  { id: 'tokyo-monorail', ja: '東京モノレール', en: 'Tokyo Monorail', category: 'private', operator: '東京モノレール', color: '#2c6db5', aliases: ['東京モノレール羽田空港線', '東京モノレール羽田線', '東京モノレ'],
    stations: ['浜松町', '天王洲アイル', '大井競馬場前', '流通センター', '昭和島', '整備場', '天空橋', '羽田空港第3ターミナル', '新整備場', '羽田空港第1ターミナル', '羽田空港第2ターミナル'] },
]
