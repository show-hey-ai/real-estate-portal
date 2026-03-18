/**
 * DB上の日本語フィールド値を言語に応じて翻訳するマッピング
 */

const propertyTypeMap: Record<string, Record<string, string>> = {
  '区分マンション': { en: 'Condominium', 'zh-TW': '公寓', 'zh-CN': '公寓' },
  '一棟マンション': { en: 'Whole Building (Mansion)', 'zh-TW': '整棟公寓', 'zh-CN': '整栋公寓' },
  '一棟アパート': { en: 'Whole Building (Apartment)', 'zh-TW': '整棟公寓', 'zh-CN': '整栋公寓' },
  '戸建': { en: 'House', 'zh-TW': '獨棟住宅', 'zh-CN': '独栋住宅' },
  '土地': { en: 'Land', 'zh-TW': '土地', 'zh-CN': '土地' },
  '店舗・事務所': { en: 'Commercial / Office', 'zh-TW': '商業/辦公', 'zh-CN': '商业/办公' },
  'その他': { en: 'Other', 'zh-TW': '其他', 'zh-CN': '其他' },
}

const structureMap: Record<string, Record<string, string>> = {
  'RC': { en: 'Reinforced Concrete (RC)', 'zh-TW': '鋼筋混凝土 (RC)', 'zh-CN': '钢筋混凝土 (RC)' },
  'SRC': { en: 'Steel Reinforced Concrete (SRC)', 'zh-TW': '鋼骨鋼筋混凝土 (SRC)', 'zh-CN': '钢骨钢筋混凝土 (SRC)' },
  'S造': { en: 'Steel Frame', 'zh-TW': '鋼骨結構', 'zh-CN': '钢骨结构' },
  '鉄骨造': { en: 'Steel Frame', 'zh-TW': '鋼骨結構', 'zh-CN': '钢骨结构' },
  '木造': { en: 'Wooden', 'zh-TW': '木造', 'zh-CN': '木造' },
  '軽量鉄骨': { en: 'Light Steel Frame', 'zh-TW': '輕鋼結構', 'zh-CN': '轻钢结构' },
  '鉄筋コンクリート造': { en: 'Reinforced Concrete (RC)', 'zh-TW': '鋼筋混凝土 (RC)', 'zh-CN': '钢筋混凝土 (RC)' },
  '鉄骨鉄筋コンクリート造': { en: 'Steel Reinforced Concrete (SRC)', 'zh-TW': '鋼骨鋼筋混凝土 (SRC)', 'zh-CN': '钢骨钢筋混凝土 (SRC)' },
}

const zoningMap: Record<string, Record<string, string>> = {
  '第1種低層住居専用地域': { en: 'Category I Exclusively Low-rise Residential', 'zh-TW': '第一種低層住居專用地域', 'zh-CN': '第一种低层住居专用地域' },
  '第2種低層住居専用地域': { en: 'Category II Exclusively Low-rise Residential', 'zh-TW': '第二種低層住居專用地域', 'zh-CN': '第二种低层住居专用地域' },
  '第1種中高層住居専用地域': { en: 'Category I Mid/High-rise Residential', 'zh-TW': '第一種中高層住居專用地域', 'zh-CN': '第一种中高层住居专用地域' },
  '第2種中高層住居専用地域': { en: 'Category II Mid/High-rise Residential', 'zh-TW': '第二種中高層住居專用地域', 'zh-CN': '第二种中高层住居专用地域' },
  '第1種住居地域': { en: 'Category I Residential', 'zh-TW': '第一種住居地域', 'zh-CN': '第一种住居地域' },
  '第2種住居地域': { en: 'Category II Residential', 'zh-TW': '第二種住居地域', 'zh-CN': '第二种住居地域' },
  '準住居地域': { en: 'Quasi-Residential', 'zh-TW': '準住居地域', 'zh-CN': '准住居地域' },
  '近隣商業地域': { en: 'Neighborhood Commercial', 'zh-TW': '近鄰商業地域', 'zh-CN': '近邻商业地域' },
  '商業地域': { en: 'Commercial', 'zh-TW': '商業地域', 'zh-CN': '商业地域' },
  '準工業地域': { en: 'Quasi-Industrial', 'zh-TW': '準工業地域', 'zh-CN': '准工业地域' },
  '工業地域': { en: 'Industrial', 'zh-TW': '工業地域', 'zh-CN': '工业地域' },
  '工業専用地域': { en: 'Exclusively Industrial', 'zh-TW': '工業專用地域', 'zh-CN': '工业专用地域' },
}

const currentStatusMap: Record<string, Record<string, string>> = {
  '空家': { en: 'Vacant', 'zh-TW': '空屋', 'zh-CN': '空房' },
  '空室': { en: 'Vacant', 'zh-TW': '空屋', 'zh-CN': '空房' },
  '賃貸中': { en: 'Tenanted', 'zh-TW': '出租中', 'zh-CN': '出租中' },
  '居住中': { en: 'Owner Occupied', 'zh-TW': '自住中', 'zh-CN': '自住中' },
  '使用中': { en: 'In Use', 'zh-TW': '使用中', 'zh-CN': '使用中' },
}

function lookupTranslation(
  value: string | null | undefined,
  map: Record<string, Record<string, string>>,
  locale: string
): string | null {
  if (!value) return null
  if (locale === 'ja') return value

  // 完全一致
  if (map[value]?.[locale]) return map[value][locale]

  // 部分一致（「RC造」→「RC」等）
  for (const [key, translations] of Object.entries(map)) {
    if (value.includes(key) || key.includes(value)) {
      return translations[locale] || value
    }
  }

  return value
}

export function translatePropertyType(value: string | null, locale: string): string | null {
  return lookupTranslation(value, propertyTypeMap, locale)
}

export function translateStructure(value: string | null, locale: string): string | null {
  return lookupTranslation(value, structureMap, locale)
}

export function translateZoning(value: string | null, locale: string): string | null {
  return lookupTranslation(value, zoningMap, locale)
}

export function translateCurrentStatus(value: string | null, locale: string): string | null {
  return lookupTranslation(value, currentStatusMap, locale)
}

// 路線名マッピング
const railwayLineMap: Record<string, string> = {
  '東京メトロ東西線': 'Tokyo Metro Tozai Line',
  '東京メトロ丸ノ内線': 'Tokyo Metro Marunouchi Line',
  '東京メトロ日比谷線': 'Tokyo Metro Hibiya Line',
  '東京メトロ千代田線': 'Tokyo Metro Chiyoda Line',
  '東京メトロ銀座線': 'Tokyo Metro Ginza Line',
  '東京メトロ半蔵門線': 'Tokyo Metro Hanzomon Line',
  '東京メトロ有楽町線': 'Tokyo Metro Yurakucho Line',
  '東京メトロ副都心線': 'Tokyo Metro Fukutoshin Line',
  '東京メトロ南北線': 'Tokyo Metro Namboku Line',
  '都営大江戸線': 'Toei Oedo Line',
  '都営新宿線': 'Toei Shinjuku Line',
  '都営三田線': 'Toei Mita Line',
  '都営浅草線': 'Toei Asakusa Line',
  'JR山手線': 'JR Yamanote Line',
  'JR中央線': 'JR Chuo Line',
  'JR中央・総武線': 'JR Chuo-Sobu Line',
  'JR総武線': 'JR Sobu Line',
  'JR京浜東北線': 'JR Keihin-Tohoku Line',
  'JR埼京線': 'JR Saikyo Line',
  'JR湘南新宿ライン': 'JR Shonan-Shinjuku Line',
  'JR東海道線': 'JR Tokaido Line',
  'JR横須賀線': 'JR Yokosuka Line',
  'JR常磐線': 'JR Joban Line',
  'JR武蔵野線': 'JR Musashino Line',
  'JR京葉線': 'JR Keiyo Line',
  '西武新宿線': 'Seibu Shinjuku Line',
  '西武池袋線': 'Seibu Ikebukuro Line',
  '東急東横線': 'Tokyu Toyoko Line',
  '東急田園都市線': 'Tokyu Den-en-toshi Line',
  '東急目黒線': 'Tokyu Meguro Line',
  '東急大井町線': 'Tokyu Oimachi Line',
  '東急池上線': 'Tokyu Ikegami Line',
  '京王線': 'Keio Line',
  '京王井の頭線': 'Keio Inokashira Line',
  '小田急線': 'Odakyu Line',
  '小田急小田原線': 'Odakyu Odawara Line',
  '京急本線': 'Keikyu Main Line',
  '京成本線': 'Keisei Main Line',
  'つくばエクスプレス': 'Tsukuba Express',
  'りんかい線': 'Rinkai Line',
  'ゆりかもめ': 'Yurikamome',
  '東武東上線': 'Tobu Tojo Line',
  '東武伊勢崎線': 'Tobu Isesaki Line',
  '東武スカイツリーライン': 'Tobu Skytree Line',
  '相鉄線': 'Sotetsu Line',
  '横浜市営地下鉄ブルーライン': 'Yokohama Blue Line',
  // 追加: DB実データから
  'JR総武本線': 'JR Sobu Main Line',
  'JR八高線': 'JR Hachiko Line',
  'JR京葉線・東京メトロ日比谷線': 'JR Keiyo Line / Tokyo Metro Hibiya Line',
  'JR山手線ほか': 'JR Yamanote Line etc.',
  '東京メトロ日比谷線・東西線': 'Tokyo Metro Hibiya / Tozai Line',
  '東京メトロ銀座線・東西線・都営浅草線': 'Tokyo Metro Ginza / Tozai / Toei Asakusa Line',
  '東京メトロ東西線・都営大江戸線': 'Tokyo Metro Tozai / Toei Oedo Line',
  '東京地下鉄有楽町線': 'Tokyo Metro Yurakucho Line',
  '東京東上線': 'Tobu Tojo Line',
  '東急世田谷線': 'Tokyu Setagaya Line',
  '東急多摩川線': 'Tokyu Tamagawa Line',
  '東急東横線・目黒線・多摩川線': 'Tokyu Toyoko / Meguro / Tamagawa Line',
  '京王電鉄京王線': 'Keio Line',
  '京浜急行線': 'Keikyu Line',
  '京浜東北線': 'JR Keihin-Tohoku Line',
  '京成金町線': 'Keisei Kanamachi Line',
  '西武拝島線': 'Seibu Haijima Line',
  '西武柳沢': 'Seibu Yanagisawa',
  '多摩モノレール': 'Tama Monorail',
  '日暮里・舎人ライナー': 'Nippori-Toneri Liner',
  '中央線': 'JR Chuo Line',
  '丸の内線': 'Tokyo Metro Marunouchi Line',
  '半蔵門線': 'Tokyo Metro Hanzomon Line',
  '千代田線': 'Tokyo Metro Chiyoda Line',
  '日比谷線': 'Tokyo Metro Hibiya Line',
  '有楽町線': 'Tokyo Metro Yurakucho Line',
  '銀座線': 'Tokyo Metro Ginza Line',
  '山手線': 'JR Yamanote Line',
  '埼京線': 'JR Saikyo Line',
  '京葉線': 'JR Keiyo Line',
  '横浜線': 'JR Yokohama Line',
  '南海本線': 'Nankai Main Line',
  '大阪メトロ御堂筋線': 'Osaka Metro Midosuji Line',
  '大江戸線': 'Toei Oedo Line',
}

// 都道府県マッピング
const prefectureMap: Record<string, string> = {
  '東京都': 'Tokyo',
  '神奈川県': 'Kanagawa',
  '埼玉県': 'Saitama',
  '千葉県': 'Chiba',
  '大阪府': 'Osaka',
  '京都府': 'Kyoto',
  '兵庫県': 'Hyogo',
  '愛知県': 'Aichi',
  '福岡県': 'Fukuoka',
  '北海道': 'Hokkaido',
  '宮城県': 'Miyagi',
  '広島県': 'Hiroshima',
  '沖縄県': 'Okinawa',
}

// 区市町村マッピング（主要なもの）
const cityMap: Record<string, string> = {
  '新宿区': 'Shinjuku',
  '渋谷区': 'Shibuya',
  '港区': 'Minato',
  '中央区': 'Chuo',
  '千代田区': 'Chiyoda',
  '品川区': 'Shinagawa',
  '目黒区': 'Meguro',
  '大田区': 'Ota',
  '世田谷区': 'Setagaya',
  '杉並区': 'Suginami',
  '中野区': 'Nakano',
  '練馬区': 'Nerima',
  '板橋区': 'Itabashi',
  '豊島区': 'Toshima',
  '北区': 'Kita',
  '荒川区': 'Arakawa',
  '台東区': 'Taito',
  '墨田区': 'Sumida',
  '江東区': 'Koto',
  '江戸川区': 'Edogawa',
  '足立区': 'Adachi',
  '葛飾区': 'Katsushika',
  '文京区': 'Bunkyo',
  '八王子市': 'Hachioji',
  '立川市': 'Tachikawa',
  '武蔵野市': 'Musashino',
  '三鷹市': 'Mitaka',
  '町田市': 'Machida',
  '府中市': 'Fuchu',
  '調布市': 'Chofu',
  '西東京市': 'Nishi-Tokyo',
  '横浜市': 'Yokohama',
  '川崎市': 'Kawasaki',
  'さいたま市': 'Saitama City',
  '千葉市': 'Chiba City',
}

// 駅名ローマ字マッピング（主要駅）
const stationNameMap: Record<string, string> = {
  '落合': 'Ochiai',
  '中井': 'Nakai',
  '東中野': 'Higashi-Nakano',
  '新宿': 'Shinjuku',
  '渋谷': 'Shibuya',
  '池袋': 'Ikebukuro',
  '品川': 'Shinagawa',
  '東京': 'Tokyo',
  '上野': 'Ueno',
  '秋葉原': 'Akihabara',
  '有楽町': 'Yurakucho',
  '銀座': 'Ginza',
  '六本木': 'Roppongi',
  '赤坂': 'Akasaka',
  '目黒': 'Meguro',
  '恵比寿': 'Ebisu',
  '代々木': 'Yoyogi',
  '原宿': 'Harajuku',
  '表参道': 'Omotesando',
  '中目黒': 'Naka-Meguro',
  '三軒茶屋': 'Sangenjaya',
  '下北沢': 'Shimokitazawa',
  '吉祥寺': 'Kichijoji',
  '武蔵小山': 'Musashi-Koyama',
  '大崎': 'Osaki',
  '五反田': 'Gotanda',
  '大井町': 'Oimachi',
  '蒲田': 'Kamata',
  '田町': 'Tamachi',
  '浜松町': 'Hamamatsucho',
  '新橋': 'Shimbashi',
  '神田': 'Kanda',
  '御茶ノ水': 'Ochanomizu',
  '飯田橋': 'Iidabashi',
  '市ヶ谷': 'Ichigaya',
  '四ツ谷': 'Yotsuya',
  '高田馬場': 'Takadanobaba',
  '目白': 'Mejiro',
  '大塚': 'Otsuka',
  '巣鴨': 'Sugamo',
  '駒込': 'Komagome',
  '日暮里': 'Nippori',
  '西日暮里': 'Nishi-Nippori',
  '赤羽': 'Akabane',
  '王子': 'Oji',
  '十条': 'Jujo',
  '板橋': 'Itabashi',
  '練馬': 'Nerima',
  '光が丘': 'Hikarigaoka',
  '豊洲': 'Toyosu',
  '月島': 'Tsukishima',
  '門前仲町': 'Monzen-Nakacho',
  '清澄白河': 'Kiyosumi-Shirakawa',
  '押上': 'Oshiage',
  '錦糸町': 'Kinshicho',
  '亀戸': 'Kameido',
  '北千住': 'Kita-Senju',
  '綾瀬': 'Ayase',
  '町田': 'Machida',
  '立川': 'Tachikawa',
  '八王子': 'Hachioji',
  '国分寺': 'Kokubunji',
  '三鷹': 'Mitaka',
  '荻窪': 'Ogikubo',
  '中野': 'Nakano',
  '高円寺': 'Koenji',
  '阿佐ヶ谷': 'Asagaya',
  '西荻窪': 'Nishi-Ogikubo',
  '武蔵境': 'Musashi-Sakai',
  '小竹向原': 'Kotake-Mukaihara',
  '江戸川橋': 'Edogawabashi',
  '護国寺': 'Gokokuji',
  '茗荷谷': 'Myogadani',
  '後楽園': 'Korakuen',
  '本郷三丁目': 'Hongo-Sanchome',
  '湯島': 'Yushima',
  '根津': 'Nezu',
  '千駄木': 'Sendagi',
  '白金高輪': 'Shirokane-Takanawa',
  '麻布十番': 'Azabu-Juban',
  '広尾': 'Hiroo',
  '代官山': 'Daikanyama',
  '自由が丘': 'Jiyugaoka',
  '二子玉川': 'Futako-Tamagawa',
  '溝の口': 'Mizonokuchi',
  '武蔵小杉': 'Musashi-Kosugi',
  '川崎': 'Kawasaki',
  '横浜': 'Yokohama',
  '大宮': 'Omiya',
  '浦和': 'Urawa',
  '船橋': 'Funabashi',
  '柏': 'Kashiwa',
  '千葉': 'Chiba',
  '品川シーサイド': 'Shinagawa Seaside',
  '八丁堀': 'Hatchobori',
  '勝どき': 'Kachidoki',
  '田端': 'Tabata',
  '両国': 'Ryogoku',
  '板橋区役所前': 'Itabashi-Kuyakushomae',
  '新板橋': 'Shin-Itabashi',
  '下板橋': 'Shimo-Itabashi',
  '志村坂上': 'Shimura-Sakaue',
  '西台': 'Nishidai',
  '高島平': 'Takashimadaira',
  '成増': 'Narimasu',
  '地下鉄成増': 'Chikatetsu-Narimasu',
  '大山': 'Oyama',
  '上板橋': 'Kami-Itabashi',
  '東武練馬': 'Tobu-Nerima',
  '小岩': 'Koiwa',
  '新小岩': 'Shin-Koiwa',
  '瑞江': 'Mizue',
  '篠崎': 'Shinozaki',
  '葛西': 'Kasai',
  '西葛西': 'Nishi-Kasai',
  '船堀': 'Funabori',
  '一之江': 'Ichinoe',
  '大島': 'Ojima',
  '東大島': 'Higashi-Ojima',
  '住吉': 'Sumiyoshi',
  '森下': 'Morishita',
  '両国': 'Ryogoku',
  '浅草': 'Asakusa',
  '蔵前': 'Kuramae',
  '浅草橋': 'Asakusabashi',
  '馬喰町': 'Bakurocho',
  '人形町': 'Ningyocho',
  '水天宮前': 'Suitengumae',
  '茅場町': 'Kayabacho',
  '日本橋': 'Nihombashi',
  '三越前': 'Mitsukoshimae',
  '大手町': 'Otemachi',
  '竹橋': 'Takebashi',
  '九段下': 'Kudanshita',
  '半蔵門': 'Hanzomon',
  '永田町': 'Nagatacho',
  '溜池山王': 'Tameike-Sanno',
  '虎ノ門': 'Toranomon',
  '新御茶ノ水': 'Shin-Ochanomizu',
  '湯島': 'Yushima',
  '上野広小路': 'Ueno-Hirokoji',
  '仲御徒町': 'Naka-Okachimachi',
  '御徒町': 'Okachimachi',
  '入谷': 'Iriya',
  '三ノ輪': 'Minowa',
  '南千住': 'Minami-Senju',
  '町屋': 'Machiya',
  '西新井': 'Nishiarai',
  '竹ノ塚': 'Takenotsuka',
  '梅島': 'Umejima',
  '北綾瀬': 'Kita-Ayase',
  '金町': 'Kanamachi',
  '亀有': 'Kameari',
  '青砥': 'Aoto',
  '京成立石': 'Keisei-Tateishi',
  '堀切菖蒲園': 'Horikiri-Shobuen',
  '曳舟': 'Hikifune',
  '鐘ヶ淵': 'Kanegafuchi',
  '東向島': 'Higashi-Mukojima',
  '業平橋': 'Narihirabashi',
  '本所吾妻橋': 'Honjo-Azumabashi',
  '西新宿': 'Nishi-Shinjuku',
  '東新宿': 'Higashi-Shinjuku',
  '新宿三丁目': 'Shinjuku-Sanchome',
  '新宿御苑前': 'Shinjuku-Gyoenmae',
  '四谷三丁目': 'Yotsuya-Sanchome',
  '曙橋': 'Akebonobashi',
  '牛込柳町': 'Ushigome-Yanagicho',
  '牛込神楽坂': 'Ushigome-Kagurazaka',
  '神楽坂': 'Kagurazaka',
  '早稲田': 'Waseda',
  '高田馬場': 'Takadanobaba',
  '西早稲田': 'Nishi-Waseda',
  '雑司が谷': 'Zoshigaya',
  '東池袋': 'Higashi-Ikebukuro',
  '千川': 'Senkawa',
  '要町': 'Kanamecho',
  '氷川台': 'Hikawadai',
  '平和台': 'Heiwadai',
  '地下鉄赤塚': 'Chikatetsu-Akatsuka',
  '和光市': 'Wakoshi',
  '朝霞': 'Asaka',
  '志木': 'Shiki',
  '川越': 'Kawagoe',
  '所沢': 'Tokorozawa',
  '秋津': 'Akitsu',
  '清瀬': 'Kiyose',
  '東久留米': 'Higashi-Kurume',
  'ひばりヶ丘': 'Hibarigaoka',
  '保谷': 'Hoya',
  '大泉学園': 'Oizumi-Gakuen',
  '石神井公園': 'Shakujii-Koen',
  '中村橋': 'Nakamura-Bashi',
  '富士見台': 'Fujimidai',
  '桜台': 'Sakuradai',
  '江古田': 'Ekoda',
  '椎名町': 'Shiinamachi',
  // 追加: DB実データから
  'たまプラーザ': 'Tama-Plaza',
  'とうきょうスカイツリー駅': 'Tokyo Skytree',
  'なんば': 'Namba',
  '難波': 'Namba',
  '上板橋駅': 'Kami-Itabashi',
  '上町': 'Kamimachi',
  '中井駅': 'Nakai',
  '京成船橋': 'Keisei-Funabashi',
  '代々木公園駅': 'Yoyogi-Koen',
  '北八王子': 'Kita-Hachioji',
  '北赤羽': 'Kita-Akabane',
  '千歳烏山': 'Chitose-Karasuyama',
  '品川シーサイド駅': 'Shinagawa Seaside',
  '多摩川': 'Tamagawa',
  '大崎広小路': 'Osaki-Hirokoji',
  '大森': 'Omori',
  '大森海岸': 'Omori-Kaigan',
  '宝町': 'Takaracho',
  '小伝馬町': 'Kodenmacho',
  '志村三丁目': 'Shimura-Sanchome',
  '志村三丁目駅': 'Shimura-Sanchome',
  '成城学園前': 'Seijo-Gakuenmae',
  '戸越銀座': 'Togoshi-Ginza',
  '新宿三丁目駅': 'Shinjuku-Sanchome',
  '新宿駅': 'Shinjuku',
  '新富町': 'Shintomicho',
  '日野': 'Hino',
  '東中野駅': 'Higashi-Nakano',
  '東日本橋': 'Higashi-Nihombashi',
  '東武練馬駅': 'Tobu-Nerima',
  '柴又': 'Shibamata',
  '桜新町': 'Sakura-Shinmachi',
  '武蔵砂川': 'Musashi-Sunagawa',
  '沼部': 'Numabe',
  '浮間舟渡': 'Ukima-Funado',
  '渋谷駅': 'Shibuya',
  '甲州街道': 'Koshu-Kaido',
  '石岡駅': 'Ishioka',
  '西新井大師西': 'Nishiarai-Daishi-Nishi',
  '西武柳沢': 'Seibu-Yanagisawa',
  '赤坂見附': 'Akasaka-Mitsuke',
  '都庁前': 'Tochomae',
  '都庁前駅': 'Tochomae',
  '青山一丁目': 'Aoyama-Itchome',
  '青物横丁': 'Aomono-Yokocho',
  '青物横丁駅': 'Aomono-Yokocho',
  '馬喰横山': 'Bakuro-Yokoyama',
  '駒沢大学': 'Komazawa-Daigaku',
  '鶯谷': 'Uguisudani',
  '鶴川': 'Tsurukawa',
  '麹町': 'Kojimachi',
  '落合駅': 'Ochiai',
  '虎ノ門ヒルズ駅': 'Toranomon Hills',
  '虎ノ門駅': 'Toranomon',
  '船堀駅': 'Funabori',
}

export function translateRailwayLine(line: string | null | undefined, locale: string): string | null {
  if (!line || locale === 'ja') return line || null
  // 完全一致
  if (railwayLineMap[line]) return railwayLineMap[line]
  // 部分一致
  for (const [ja, en] of Object.entries(railwayLineMap)) {
    if (line.includes(ja)) return en
  }
  return line
}

export function translateStationName(name: string | null | undefined, locale: string): string | null {
  if (!name || locale === 'ja') return name || null
  if (stationNameMap[name]) return stationNameMap[name]
  return name
}

export function translateAddress(address: string | null | undefined, locale: string): string | null {
  if (!address || locale === 'ja') return address || null

  let result = address
  // 都道府県を変換
  for (const [ja, en] of Object.entries(prefectureMap)) {
    if (result.includes(ja)) {
      result = result.replace(ja, '')
      // 区市町村を変換
      for (const [jaCity, enCity] of Object.entries(cityMap)) {
        if (result.includes(jaCity)) {
          return `${enCity}, ${en}`
        }
      }
      return en
    }
  }
  return address
}
