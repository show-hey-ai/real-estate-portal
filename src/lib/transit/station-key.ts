/**
 * Matching key for a station name: listings, operators and the national data write the same
 * station as 市ヶ谷 / 市ケ谷, with or without 駅 and with sub-names such as 押上〈スカイツリー前〉.
 */
export function stationKey(name: string | null | undefined): string {
  return (name ?? '')
    .normalize('NFKC')
    .replace(/[〈<（(][^〉>）)]*[〉>）)]/g, '')
    .replace(/\s+/g, '')
    .replace(/駅$/, '')
    .replace(/ヶ/g, 'ケ')
}
