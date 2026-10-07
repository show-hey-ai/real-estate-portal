// Building names appear at the start of the Japanese description ("ライオンズ…。75.40㎡の…").
// Address-only openings such as "足立区竹の塚1丁目の区分マンション" are not names.

const MAX_LENGTH = 30

export function extractBuildingName(descriptionJa: string | null | undefined): string | null {
  const first = (descriptionJa ?? '').split('。')[0]?.trim()
  if (!first) return null
  let name = first.replace(/の区分マンション$/u, '')
  name = name.split(/の(?=\d)/u)[0]
  name = name.replace(/[,、].*$/u, '').replace(/\s*\d+階$/u, '').trim()
  if (name.length < 2 || name.length > MAX_LENGTH) return null
  // Station and walking-time phrases (「北池袋駅徒歩9分」) are access notes, not building names.
  if (/丁目|番地|木造|鉄骨|中古|戸建|区分マンション|一棟|徒歩|駅/u.test(name)) return null
  if (/^[^\s]{1,4}区/u.test(name)) return null
  return name
}

const LOT = '(?:[0-9０-９]+(?:[-‐−－][0-9０-９]+)+|[0-9０-９]+番地?(?:[0-9０-９]+号)?)'
const TRAILING_UNIT = /\s*[0-9０-９]+(?:号室|階部分|階)$/u

/** The building name written after the lot number in a public address ("…9-3 カテリーナ池袋西プラザタワー501号室"). */
export function buildingNameFromAddress(addressPublic: string | null | undefined): string | null {
  const match = (addressPublic ?? '').trim().match(new RegExp(`${LOT}\\s*(.+)$`, 'u'))
  if (!match) return null
  const name = match[1].replace(TRAILING_UNIT, '').trim()
  if (name.length < 2 || name.length > MAX_LENGTH || /^[0-9０-９]/u.test(name)) return null
  return name
}

/** Building name from the description's opening, else from the public address. */
export function buildingNameOf(listing: { descriptionJa?: string | null; addressPublic?: string | null }): string | null {
  return extractBuildingName(listing.descriptionJa) ?? buildingNameFromAddress(listing.addressPublic)
}
