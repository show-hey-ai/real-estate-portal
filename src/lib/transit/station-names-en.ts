/**
 * English names (operators' romanisation) of stations in the 23 wards that the main dictionary in
 * translate-fields.ts lacked when the station list was built (2026-10-25).
 */
export const EXTRA_STATION_NAMES_EN: Readonly<Record<string, string>> = {
  // JR
  新大久保: 'Shin-Okubo', 上中里: 'Kami-Nakazato', 阿佐ケ谷: 'Asagaya', 大久保: 'Okubo', 千駄ケ谷: 'Sendagaya',
  信濃町: 'Shinanomachi', 市ケ谷: 'Ichigaya', 水道橋: 'Suidobashi', 平井: 'Hirai', 新日本橋: 'Shin-Nihombashi',
  西大井: 'Nishi-Oi', 越中島: 'Etchujima', 潮見: 'Shiomi', 葛西臨海公園: 'Kasai-Rinkai-Koen',
  // Tokyo Metro
  外苑前: 'Gaiemmae', 末広町: 'Suehirocho', 淡路町: 'Awajicho', 霞ケ関: 'Kasumigaseki', 国会議事堂前: 'Kokkai-Gijidomae',
  新高円寺: 'Shin-Koenji', 南阿佐ケ谷: 'Minami-Asagaya', 中野新橋: 'Nakano-Shimbashi', 神谷町: 'Kamiyacho',
  虎ノ門ヒルズ: 'Toranomon Hills', 日比谷: 'Hibiya', 木場: 'Kiba', 代々木上原: 'Yoyogi-Uehara', 代々木公園: 'Yoyogi-Koen',
  明治神宮前: 'Meiji-Jingumae', 乃木坂: 'Nogizaka', 二重橋前: 'Nijubashimae', 桜田門: 'Sakuradamon', 神保町: 'Jimbocho',
  六本木一丁目: 'Roppongi-Itchome', 東大前: 'Todaimae', 本駒込: 'Hon-Komagome', 西ケ原: 'Nishigahara', 王子神谷: 'Oji-Kamiya',
  志茂: 'Shimo', 赤羽岩淵: 'Akabane-Iwabuchi',
  // Toei subway, tram and Nippori-Toneri Liner
  高輪台: 'Takanawadai', 内幸町: 'Uchisaiwaicho', 白山: 'Hakusan', 千石: 'Sengoku', 西巣鴨: 'Nishi-Sugamo',
  板橋本町: 'Itabashi-Honcho', 本蓮沼: 'Motohasunuma', 新高島平: 'Shin-Takashimadaira', 西高島平: 'Nishi-Takashimadaira',
  小川町: 'Ogawamachi', 菊川: 'Kikukawa', 練馬春日町: 'Nerima-Kasugacho', 西新宿五丁目: 'Nishi-Shinjuku-Gochome',
  若松河田: 'Wakamatsu-Kawada', 上野御徒町: 'Ueno-Okachimachi', 汐留: 'Shiodome', 国立競技場: 'Kokuritsu-Kyogijo',
  荒川一中前: 'Arakawa-Itchumae', 荒川区役所前: 'Arakawa-Kuyakushomae', 荒川二丁目: 'Arakawa-Nichome', 荒川七丁目: 'Arakawa-Nanachome',
  町屋駅前: 'Machiya-Ekimae', 町屋二丁目: 'Machiya-Nichome', 東尾久三丁目: 'Higashi-Ogu-Sanchome', 宮ノ前: 'Miyanomae', 小台: 'Odai',
  荒川遊園地前: 'Arakawa-Yuenchimae', 荒川車庫前: 'Arakawa-Shakomae', 梶原: 'Kajiwara', 栄町: 'Sakaecho', 王子駅前: 'Oji-Ekimae',
  飛鳥山: 'Asukayama', 滝野川一丁目: 'Takinogawa-Itchome', 西ケ原四丁目: 'Nishigahara-Yonchome', 新庚申塚: 'Shin-Koshinzuka',
  庚申塚: 'Koshinzuka', 巣鴨新田: 'Sugamo-Shinden', 大塚駅前: 'Otsuka-Ekimae', 向原: 'Mukohara', 東池袋四丁目: 'Higashi-Ikebukuro-Yonchome',
  都電雑司ケ谷: 'Toden-Zoshigaya', 鬼子母神前: 'Kishibojimmae', 学習院下: 'Gakushuin-Shita', 面影橋: 'Omokagebashi',
  赤土小学校前: 'Akado-Shogakkomae', 高野: 'Koya', 谷在家: 'Yazaike',
  // Tokyu
  祐天寺: 'Yutenji', 学芸大学: 'Gakugei-Daigaku', 都立大学: 'Toritsu-Daigaku', 不動前: 'Fudomae', 西小山: 'Nishi-Koyama',
  洗足: 'Senzoku', 大岡山: 'Ookayama', 下神明: 'Shimo-Shinmei', 戸越公園: 'Togoshi-Koen', 荏原町: 'Ebaramachi',
  北千束: 'Kita-Senzoku', 緑が丘: 'Midorigaoka', 長原: 'Nagahara', 洗足池: 'Senzoku-Ike', 石川台: 'Ishikawadai',
  雪が谷大塚: 'Yukigaya-Otsuka', 御嶽山: 'Ontakesan', 久が原: 'Kugahara', 千鳥町: 'Chidoricho', 鵜の木: 'Unoki',
  西太子堂: 'Nishi-Taishido', 松陰神社前: 'Shoin-Jinja-Mae', 世田谷: 'Setagaya', 宮の坂: 'Miyanosaka', 山下: 'Yamashita', 松原: 'Matsubara',
  // Keio and Odakyu
  代田橋: 'Daitabashi', 桜上水: 'Sakurajosui', 上北沢: 'Kami-Kitazawa', 八幡山: 'Hachimanyama', 芦花公園: 'Roka-Koen',
  駒場東大前: 'Komaba-Todaimae', 池ノ上: 'Ikenoue', 新代田: 'Shin-Daita', 東松原: 'Higashi-Matsubara', 西永福: 'Nishi-Eifuku',
  南新宿: 'Minami-Shinjuku', 参宮橋: 'Sangubashi', 代々木八幡: 'Yoyogi-Hachiman', 東北沢: 'Higashi-Kitazawa', 喜多見: 'Kitami',
  // Seibu and Tobu
  練馬高野台: 'Nerima-Takanodai', 西武新宿: 'Seibu-Shinjuku', 下落合: 'Shimo-Ochiai', 新井薬師前: 'Arai-Yakushimae',
  沼袋: 'Numabukuro', 野方: 'Nogata', 都立家政: 'Toritsu-Kasei', 鷺ノ宮: 'Saginomiya', 下井草: 'Shimo-Igusa', 井荻: 'Iogi',
  新桜台: 'Shin-Sakuradai', 北池袋: 'Kita-Ikebukuro', 中板橋: 'Naka-Itabashi', ときわ台: 'Tokiwadai', 下赤塚: 'Shimo-Akatsuka',
  とうきょうスカイツリー: 'Tokyo Skytree', 堀切: 'Horikiri', 牛田: 'Ushida', 小菅: 'Kosuge', 小村井: 'Omurai',
  東あずま: 'Higashi-Azuma', 亀戸水神: 'Kameido-Suijin', 大師前: 'Daishimae',
  // Keisei, Hokuso and Keikyu
  京成上野: 'Keisei-Ueno', 千住大橋: 'Senju-Ohashi', 京成関屋: 'Keisei-Sekiya', お花茶屋: 'Ohanajaya', 京成高砂: 'Keisei-Takasago',
  京成小岩: 'Keisei-Koiwa', 江戸川: 'Edogawa', 京成曳舟: 'Keisei-Hikifune', 八広: 'Yahiro', 四ツ木: 'Yotsugi', 新柴又: 'Shin-Shibamata',
  大鳥居: 'Otorii', 羽田空港第3ターミナル: 'Haneda Airport Terminal 3', '羽田空港第1・第2ターミナル': 'Haneda Airport Terminal 1·2',
  // Tsukuba Express, Rinkai Line, Yurikamome and Tokyo Monorail
  青井: 'Aoi', 六町: 'Rokucho', 東京テレポート: 'Tokyo Teleport', 東雲: 'Shinonome', 竹芝: 'Takeshiba', 日の出: 'Hinode',
  芝浦ふ頭: 'Shibaura-Futo', お台場海浜公園: 'Odaiba-Kaihinkoen', 東京国際クルーズターミナル: 'Tokyo International Cruise Terminal',
  青海: 'Aomi', 東京ビッグサイト: 'Tokyo Big Sight', 有明テニスの森: 'Ariake-Tennis-no-Mori', 市場前: 'Shijo-Mae', 新豊洲: 'Shin-Toyosu',
  大井競馬場前: 'Oi Keibajo-Mae', 整備場: 'Seibijo', 新整備場: 'Shin-Seibijo',
  羽田空港第1ターミナル: 'Haneda Airport Terminal 1', 羽田空港第2ターミナル: 'Haneda Airport Terminal 2',
}
