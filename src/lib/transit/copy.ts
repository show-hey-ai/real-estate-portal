import type { LineCategory } from './lines'

export interface TransitCopy {
  title: string
  intro: string
  search: string
  noMatch: string
  categories: Record<LineCategory, string>
  allStations: string
  branch: (from: string) => string
  loop: string
  walk: string
  walkAny: string
  walkWithin: (minutes: number) => string
  clear: string
  show: (count: number) => string
  nothing: string
  remove: (label: string) => string
  count: (count: number) => string
  entryTitle: string
  entryNote: string
  allLines: string
  choose: string
  change: string
  metaTitle: string
  metaDescription: (count: number) => string
  linePages: string
}

const ja: TransitCopy = {
  title: '路線・駅から探す',
  intro: '路線を開いて駅を選んでください。複数の路線・駅を選べます。数字は公開中の物件数です。',
  search: '駅名で探す（例：渋谷、shibuya）',
  noMatch: '該当する駅がありません',
  categories: { jr: 'JR', metro: '東京メトロ', toei: '都営', private: '私鉄・その他' },
  allStations: 'この路線の駅をすべて選ぶ',
  branch: (from) => `${from}から分岐`,
  loop: '環状運転',
  walk: '駅徒歩',
  walkAny: '指定なし',
  walkWithin: (minutes) => `${minutes}分以内`,
  clear: 'クリア',
  show: (count) => `${count}件を見る`,
  nothing: '該当する物件がありません',
  remove: (label) => `${label}を外す`,
  count: (count) => `${count}件`,
  entryTitle: '路線・駅から探す',
  entryNote: '通勤・通学に使う路線から選べます。数字は公開中の物件数です。',
  allLines: 'すべての路線から選ぶ',
  choose: '路線・駅から選ぶ',
  change: '路線・駅を変更',
  metaTitle: '路線・駅から探す｜東京23区の売り物件',
  metaDescription: (count) => `東京23区の55路線・約490駅から、駅近くの売り物件${count}件を探せます。JR・東京メトロ・都営・私鉄に対応、駅徒歩でも絞り込めます。`,
  linePages: '路線ごとの物件ページ',
}

const en: TransitCopy = {
  title: 'Search by train line and station',
  intro: 'Open a line and pick stations. You can combine several lines and stations. Numbers show listings for sale now.',
  search: 'Find a station (e.g. Shibuya)',
  noMatch: 'No station found',
  categories: { jr: 'JR', metro: 'Tokyo Metro', toei: 'Toei', private: 'Private railways' },
  allStations: 'Select every station on this line',
  branch: (from) => `Branch from ${from}`,
  loop: 'Loop line',
  walk: 'Walk time',
  walkAny: 'Any',
  walkWithin: (minutes) => `Within ${minutes} min`,
  clear: 'Clear',
  show: (count) => `Show ${count} ${count === 1 ? 'listing' : 'listings'}`,
  nothing: 'No listings match',
  remove: (label) => `Remove ${label}`,
  count: (count) => `${count}`,
  entryTitle: 'Search by train line',
  entryNote: 'Start from the line you commute on. Numbers show listings for sale now.',
  allLines: 'Choose from all lines',
  choose: 'Choose lines and stations',
  change: 'Change lines and stations',
  metaTitle: 'Tokyo Property for Sale by Train Line and Station',
  metaDescription: (count) => `Find ${count} properties for sale near stations in Tokyo's 23 wards: 55 lines and about 490 stations on JR, Tokyo Metro, Toei and private railways, with a walk-time filter.`,
  linePages: 'Properties by line',
}

const zhTW: TransitCopy = {
  title: '依路線・車站尋找',
  intro: '展開路線後選擇車站，可同時選擇多條路線與多個車站。數字為目前刊登中的物件數。',
  search: '搜尋車站（例：Shibuya）',
  noMatch: '找不到符合的車站',
  categories: { jr: 'JR', metro: '東京Metro', toei: '都營', private: '私鐵・其他' },
  allStations: '選擇此路線的所有車站',
  branch: (from) => `由${from}分岔`,
  loop: '環狀線',
  walk: '步行時間',
  walkAny: '不限',
  walkWithin: (minutes) => `${minutes}分鐘以內`,
  clear: '清除',
  show: (count) => `查看${count}件`,
  nothing: '沒有符合條件的物件',
  remove: (label) => `移除${label}`,
  count: (count) => `${count}件`,
  entryTitle: '依路線・車站尋找',
  entryNote: '可從通勤路線開始選擇。數字為目前刊登中的物件數。',
  allLines: '從所有路線選擇',
  choose: '選擇路線・車站',
  change: '變更路線・車站',
  metaTitle: '依路線・車站尋找東京23區待售物件',
  metaDescription: (count) => `從東京23區55條路線、約490個車站中，尋找車站附近的待售物件（${count}件）。支援JR、東京Metro、都營與私鐵，並可依步行時間篩選。`,
  linePages: '各路線物件頁面',
}

const zhCN: TransitCopy = {
  ...zhTW,
  title: '按线路・车站查找',
  intro: '展开线路后选择车站，可同时选择多条线路和多个车站。数字为当前在售房源数。',
  search: '搜索车站（例：Shibuya）',
  noMatch: '没有符合的车站',
  categories: { jr: 'JR', metro: '东京Metro', toei: '都营', private: '私铁・其他' },
  allStations: '选择该线路的所有车站',
  branch: (from) => `从${from}分岔`,
  loop: '环线',
  walk: '步行时间',
  walkAny: '不限',
  walkWithin: (minutes) => `${minutes}分钟以内`,
  clear: '清除',
  show: (count) => `查看${count}套`,
  nothing: '没有符合条件的房源',
  remove: (label) => `移除${label}`,
  count: (count) => `${count}套`,
  entryTitle: '按线路・车站查找',
  entryNote: '可以从通勤线路开始选择。数字为当前在售房源数。',
  allLines: '从所有线路中选择',
  choose: '选择线路・车站',
  change: '更改线路・车站',
  metaTitle: '按线路・车站查找东京23区在售房源',
  metaDescription: (count) => `从东京23区55条线路、约490个车站中，查找车站附近的在售房源（${count}套）。支持JR、东京Metro、都营和私铁，并可按步行时间筛选。`,
  linePages: '各线路房源页面',
}

export function getTransitCopy(locale: string): TransitCopy {
  return locale === 'ja' ? ja : locale === 'zh-TW' ? zhTW : locale === 'zh-CN' ? zhCN : en
}
