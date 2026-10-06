import { formatPrice } from './format'
import { formatApprovedPublicAddress } from './address'
import {
  formatTransitAccessLabel,
  translateAddress,
  translateCurrentStatus,
  translatePropertyType,
  translateStructure,
} from './translate-fields'
import {
  normalizeTransitStations,
  type TransitStationInput,
} from './transit-normalization'
import {
  CHAT_TOPICS,
  getListingChatCopy,
  type ChatLocale,
  type ChatTopic,
} from './listing-chat-copy'

/** Deliberately excludes descriptions, source PDFs, private addresses and operational notes. */
export interface ChatListingFacts {
  id: string
  propertyType: string | null
  price: string | number | null
  priceCurrency: string | null
  addressPublic: string | null
  stations: TransitStationInput[] | null
  builtYear: number | null
  builtMonth: number | null
  buildingArea: string | number | null
  landArea: string | number | null
  structure: string | null
  floorCount: number | null
  currentStatus: string | null
  updatedAt: string | null
}

const patterns: Record<ChatTopic, RegExp> = {
  price:
    /価格|値段|金額|いくら|price|asking|how much|多少錢|多少钱|價格|价格|售價|售价/iu,
  area: /面積|広さ|広い|平米|平方米|平方|area|size|large|big|面积|m2/iu,
  access:
    /駅|徒歩|アクセス|交通|station|walk|train|access|車站|车站|步行|地鐵|地铁/iu,
  building:
    /築|構造|何階|階建|種別|built|structure|construction|year|floor|property type|建築年份|建筑年份|構造|结构|樓層|楼层/iu,
  location: /住所|場所|どこ|号室|部屋番号|番地|address|location|located|地址|位置|門牌|门牌/iu,
  status: /現況|空室|入居|状況|status|occupied|vacant|現況|现状|入住/iu,
}
const restricted =
  /private|admin|internal|secret|prompt|instruction|system|社内|内部|非公開|系統|系统|提示詞|提示词/iu
const confirmation =
  /内見|予約|見学|値下|交渉|妥当|相場|適正|購入(?:条件|手続|申込|相談|でき)|買える|ローン|融資|税金|諸費用|許可|許認可|民泊|旅館|ホテル|viewing|book|appointment|discount|negotiat|fair price|market value|mortgage|financ|tax|closing cost|licen[cs]|permit|hotel|minpaku|can (?:I|we) buy|purchase (?:terms|conditions)|看房|預約|预约|議價|议价|貸款|贷款|許可|许可|保證|保证/iu

function positiveNumber(value: string | number | null) {
  if (value === null || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : null
}

export function answerListingQuestion(
  listing: ChatListingFacts,
  message: string,
  locale: ChatLocale
) {
  const copy = getListingChatCopy(locale)
  const text = message.normalize('NFKC')
  if (restricted.test(text))
    return {
      answer: copy.restricted,
      topics: [] as ChatTopic[],
      needsInquiry: true,
    }
  if (confirmation.test(text))
    return {
      answer: copy.confirmation,
      topics: [] as ChatTopic[],
      needsInquiry: true,
    }
  const summary = /まとめ|概要|overview|summary|介紹|介绍|簡介|简介/iu.test(
    text
  )
  const topics = CHAT_TOPICS.filter(
    (topic) => summary || patterns[topic].test(text)
  )
  if (!topics.length)
    return { answer: copy.fallback, topics, needsInquiry: true }
  let missing = false
  const unknown = () => {
    missing = true
    return copy.unknown
  }
  const lines = topics.map((topic) => {
    switch (topic) {
      case 'price': {
        const price = positiveNumber(listing.price)
        return `${copy.price}: ${price !== null && Number.isSafeInteger(price) && (!listing.priceCurrency || listing.priceCurrency === 'JPY') ? formatPrice(price, locale) : unknown()}`
      }
      case 'area': {
        const building = positiveNumber(listing.buildingArea)
        const land = positiveNumber(listing.landArea)
        return [
          ...(listing.propertyType === '土地'
            ? []
            : [
                `${copy.buildingArea}: ${building !== null ? `${building} m²` : unknown()}`,
              ]),
          `${copy.landArea}: ${land !== null ? `${land} m²` : unknown()}`,
        ].join('\n')
      }
      case 'access': {
        const stations = normalizeTransitStations(listing.stations).slice(0, 6)
        return `${copy.access}: ${stations.length ? stations.map((station) => `${formatTransitAccessLabel(station, locale)} — ${station.walk_minutes !== null ? `${copy.walk} ${station.walk_minutes} ${copy.minutes}` : unknown()}`).join('\n') : unknown()}`
      }
      case 'building': {
        return [
          `${copy.propertyType}: ${translatePropertyType(listing.propertyType, locale) || unknown()}`,
          `${copy.builtYear}: ${listing.builtYear && listing.builtYear > 0 ? `${listing.builtYear}${copy.year}${listing.builtMonth ? ` / ${listing.builtMonth}` : ''}` : unknown()}`,
          `${copy.structure}: ${translateStructure(listing.structure, locale) || unknown()}`,
          `${copy.floorCount}: ${listing.floorCount && listing.floorCount > 0 ? `${listing.floorCount} ${copy.floors}` : unknown()}`,
        ].join('\n')
      }
      case 'location': {
        const address = formatApprovedPublicAddress(listing.addressPublic)
        return `${copy.location}: ${address ? translateAddress(address, locale) || address : unknown()}`
      }
      case 'status':
        return `${copy.status}: ${listing.currentStatus ? translateCurrentStatus(listing.currentStatus, locale) || listing.currentStatus : unknown()}`
    }
  })
  return { answer: lines.join('\n\n'), topics, needsInquiry: missing }
}
