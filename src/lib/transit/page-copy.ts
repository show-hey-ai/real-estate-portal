import { chinesePlaceName, isChineseLocale } from '../zh-script'
/** Text for the line pages (/lines/[id]) and station pages (/stations/[slug]). */
export interface TransitPageCopy {
  home: string
  hub: string
  lineTitle: (line: string) => string
  lineIntro: (line: string, stations: number, count: number) => string
  lineEmpty: (line: string) => string
  lineDescription: (line: string, count: number) => string
  stationsTitle: string
  lineListings: string
  seeAll: (count: number) => string
  chooseOnLine: string
  stationTitle: (station: string) => string
  stationIntro: (station: string, ward: string, count: number) => string
  stationEmpty: (station: string) => string
  stationDescription: (station: string, ward: string, count: number) => string
  area: string
  landPrice: (yen: string) => string
  lines: string
  neighbours: string
  stationListings: string
  nearby: string
  walkFilter: string
  search: string
}

const ja: TransitPageCopy = {
  home: 'ホーム',
  hub: '路線・駅から探す',
  lineTitle: (line) => `${line}沿線の売り物件`,
  lineIntro: (line, stations, count) => `${line}の23区内${stations}駅の近くで、公開中の売買物件は${count}件です。駅ごとの件数から選んで、価格・広さ・駅徒歩を比べられます。`,
  lineEmpty: (line) => `${line}沿線で現在公開中の物件はありません。ご希望の条件をお知らせいただければ、紹介できる物件を確認します。`,
  lineDescription: (line, count) => `${line}沿線（東京23区）の売買物件${count}件。中古マンション・戸建て・土地を駅ごとに比較。日本語・英語・中国語で購入相談に対応するWelcome Home Tokyo。`,
  stationsTitle: '駅ごとの物件数',
  lineListings: '沿線の物件',
  seeAll: (count) => `${count}件をすべて見る`,
  chooseOnLine: 'この路線の駅を選んで探す',
  stationTitle: (station) => `${station}周辺の売り物件`,
  stationIntro: (station, ward, count) => `${station}（${ward}）の近くで公開中の売買物件は${count}件です。駅からの徒歩時間が短い順に並べています。`,
  stationEmpty: (station) => `${station}の近くで現在公開中の物件はありません。隣の駅や同じ区の物件もご覧ください。`,
  stationDescription: (station, ward, count) => `${station}（東京都${ward}）周辺の売買物件${count}件。駅徒歩・価格・広さを比較。日本語・英語・中国語で購入相談に対応するWelcome Home Tokyo。`,
  area: 'エリア',
  landPrice: (yen) => `住宅地の平均地価 ${yen}円/㎡（2026年地価公示）`,
  lines: '乗り入れ路線',
  neighbours: '隣の駅',
  stationListings: '駅の近くの物件',
  nearby: '物件のある近くの駅',
  walkFilter: '駅徒歩で絞り込む',
  search: '条件を指定して探す',
}

const en: TransitPageCopy = {
  home: 'Home',
  hub: 'Search by line and station',
  lineTitle: (line) => `Property for sale along the ${line}`,
  lineIntro: (line, stations, count) => `${count} properties are for sale near the ${stations} stations of the ${line} in Tokyo's 23 wards. Pick a station to compare prices, sizes and walking times.`,
  lineEmpty: (line) => `No properties are listed along the ${line} right now. Tell us what you are looking for and we will check what we can introduce.`,
  lineDescription: (line, count) => `${count} properties for sale along the ${line} in Tokyo's 23 wards. Compare condominiums, houses and land station by station, with support in English, Japanese and Chinese.`,
  stationsTitle: 'Listings by station',
  lineListings: 'Properties along the line',
  seeAll: (count) => `See all ${count}`,
  chooseOnLine: 'Choose stations on this line',
  stationTitle: (station) => `Property for sale near ${station}`,
  stationIntro: (station, ward, count) => `${count} properties are for sale near ${station}, in ${ward} ward. They are sorted by walking time from the station.`,
  stationEmpty: (station) => `No properties are listed near ${station} right now. See the neighbouring stations or the rest of the ward.`,
  stationDescription: (station, ward, count) => `${count} properties for sale near ${station} in ${ward}, Tokyo. Compare walking times, prices and sizes, with support in English, Japanese and Chinese.`,
  area: 'Area',
  landPrice: (yen) => `Average residential land price ¥${yen}/m² (2026 official land prices)`,
  lines: 'Lines',
  neighbours: 'Neighbouring stations',
  stationListings: 'Properties near the station',
  nearby: 'Nearby stations with listings',
  walkFilter: 'Filter by walking time',
  search: 'Search with filters',
}

const zhTW: TransitPageCopy = {
  home: '首頁',
  hub: '依路線・車站尋找',
  lineTitle: (line) => `${line}沿線待售物件`,
  lineIntro: (line, stations, count) => `${line}在東京23區內${stations}個車站附近，目前刊登中的待售物件共${count}筆。可依車站比較價格、面積與步行時間。`,
  lineEmpty: (line) => `${line}沿線目前沒有刊登中的物件。請告訴我們您的條件，我們會確認可介紹的物件。`,
  lineDescription: (line, count) => `東京23區${line}沿線待售物件${count}筆。依車站比較公寓、獨棟與土地，提供中文、日文、英文購屋諮詢。`,
  stationsTitle: '各車站物件數',
  lineListings: '沿線物件',
  seeAll: (count) => `查看全部${count}筆`,
  chooseOnLine: '選擇此路線的車站搜尋',
  stationTitle: (station) => `${station}周邊待售物件`,
  stationIntro: (station, ward, count) => `位於${ward}的${station}附近，目前刊登中的待售物件共${count}筆，依步行時間由短至長排列。`,
  stationEmpty: (station) => `${station}附近目前沒有刊登中的物件。請參考鄰近車站或同區的物件。`,
  stationDescription: (station, ward, count) => `東京${ward}${station}周邊待售物件${count}筆。比較步行時間、價格與面積，提供中文、日文、英文購屋諮詢。`,
  area: '區域',
  landPrice: (yen) => `住宅地平均地價 ${yen}日圓/㎡（2026年地價公示）`,
  lines: '停靠路線',
  neighbours: '相鄰車站',
  stationListings: '車站附近的物件',
  nearby: '附近有物件的車站',
  walkFilter: '依步行時間篩選',
  search: '指定條件搜尋',
}

const zhCN: TransitPageCopy = {
  home: '首页',
  hub: '按线路・车站查找',
  lineTitle: (line) => `${line}沿线在售房源`,
  lineIntro: (line, stations, count) => `${line}在东京23区内${stations}个车站附近，当前在售房源共${count}套。可按车站比较价格、面积和步行时间。`,
  lineEmpty: (line) => `${line}沿线目前没有在售房源。请告诉我们您的条件，我们会确认可介绍的房源。`,
  lineDescription: (line, count) => `东京23区${line}沿线在售房源${count}套。按车站比较公寓、独栋和土地，提供中文、日文、英文购房咨询。`,
  stationsTitle: '各车站房源数',
  lineListings: '沿线房源',
  seeAll: (count) => `查看全部${count}套`,
  chooseOnLine: '选择该线路的车站查找',
  stationTitle: (station) => `${station}周边在售房源`,
  stationIntro: (station, ward, count) => `位于${ward}的${station}附近，当前在售房源共${count}套，按步行时间由短到长排列。`,
  stationEmpty: (station) => `${station}附近目前没有在售房源。请参考相邻车站或同区的房源。`,
  stationDescription: (station, ward, count) => `东京${ward}${station}周边在售房源${count}套。比较步行时间、价格和面积，提供中文、日文、英文购房咨询。`,
  area: '区域',
  landPrice: (yen) => `住宅地平均地价 ${yen}日元/㎡（2026年地价公示）`,
  lines: '停靠线路',
  neighbours: '相邻车站',
  stationListings: '车站附近的房源',
  nearby: '附近有房源的车站',
  walkFilter: '按步行时间筛选',
  search: '指定条件搜索',
}

export function getTransitPageCopy(locale: string): TransitPageCopy {
  return locale === 'ja' ? ja : locale === 'zh-TW' ? zhTW : locale === 'zh-CN' ? zhCN : en
}


/**
 * A station as a page heading: 渋谷駅 / Shibuya Station / 渋谷站（Shibuya）. Chinese pages keep the
 * kanji name with the English one, and use the English name alone for kana names.
 */
export function stationHeading(name: string, english: string, locale: string): string {
  if (locale === 'ja') return name.endsWith('駅前') ? name : `${name}駅`
  if (isChineseLocale(locale)) {
    const chinese = chinesePlaceName(name, english, locale)
    return chinese === english ? `${english}站` : `${chinese}站（${english}）`
  }
  return `${english} Station`
}
