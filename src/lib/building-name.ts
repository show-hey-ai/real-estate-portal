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
  if (/丁目|番地|木造|鉄骨|中古|戸建|区分マンション|一棟/u.test(name)) return null
  if (/^[^\s]{1,4}区/u.test(name)) return null
  return name
}
