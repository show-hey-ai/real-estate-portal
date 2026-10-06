import { z } from 'zod'
import { isInvestmentTenancy, getMarketCategory } from './market-category'

export const matchingVersion = 'buyer-matching-v1'
export const wards = ['千代田区','中央区','港区','新宿区','文京区','台東区','墨田区','江東区','品川区','目黒区','大田区','世田谷区','渋谷区','中野区','杉並区','豊島区','北区','荒川区','板橋区','練馬区','足立区','葛飾区','江戸川区'] as const
export const types = ['condo','house','land','whole_building','commercial'] as const
export const typeNames: Record<typeof types[number], string[]> = { condo:['区分マンション'], house:['戸建'], land:['土地'], whole_building:['一棟マンション','一棟アパート','一棟ビル'], commercial:['店舗・事務所'] }
const yen = z.number().int().min(0).max(10000000000).nullable().default(null)
export const criteriaSchema = z.object({
  purpose: z.enum(['investment','residential','land']), budgetMin: yen, budgetMax: yen,
  wards: z.array(z.enum(wards)).max(6).default([]), propertyTypes: z.array(z.enum(types)).max(5).default([]),
  timing: z.enum(['soon','this_year','later','undecided']).default('undecided'),
  financing: z.enum(['cash','loan','mixed','undecided']).default('undecided'),
  priority: z.enum(['location','space','price','commute']).default('location'),
  occupancy: z.enum(['any','vacant','tenanted']).default('any'),
  minArea: z.number().min(0).max(100000).nullable().default(null),
  minBuiltYear: z.number().int().min(1900).max(2100).nullable().default(null),
  maxWalkMinutes: z.number().int().min(1).max(120).nullable().default(null),
  minGrossYield: z.number().min(0).max(100).nullable().default(null),
  active: z.boolean().default(true), learnFromRatings: z.boolean().default(true),
}).strict().superRefine((v,c) => {
  if (v.budgetMin !== null && v.budgetMax !== null && v.budgetMin > v.budgetMax) c.addIssue({code:'custom',message:'Budget range is invalid',path:['budgetMax']})
  if (new Set(v.wards).size !== v.wards.length || new Set(v.propertyTypes).size !== v.propertyTypes.length) c.addIssue({code:'custom',message:'Duplicate criteria'})
})
export type BuyerCriteria = z.infer<typeof criteriaSchema>
export const feedbackSchema = z.object({ profileId:z.uuid(), listingId:z.string().min(1).max(100), rating:z.number().int().min(1).max(5).nullable().default(null), status:z.enum(['neutral','like','shortlist','dismiss']), reason:z.enum(['none','price','area','size','occupancy','yield','condition','other']).default('none'), revision:z.number().int().min(1), nonce:z.uuid() }).strict()
export type MatchFacts = { id:string; propertyType:string|null; price:number|null; priceCurrency:string; city:string|null; currentStatus:string|null; buildingArea:number|null; landArea:number|null; builtYear:number|null; yieldGross:number|null; stations:unknown }
export type Preference = {listingId:string; rating:number|null; city:string|null; propertyType:string|null}
export type Check = {key:string; result:'match'|'miss'|'unknown'; actual?:string|number}
export type Evaluation = {status:'aligned'|'needs_check'|'outside'; score:number; preferenceBonus:number; checks:Check[]; unconfirmed:string[]; version:string}
export function matchListing(c:BuyerCriteria,l:MatchFacts,preferences:Preference[]):Evaluation {
  const checks:Check[] = []
  const check = (key:string,known:boolean,matched:boolean,actual?:string|number) => checks.push({key,result:known ? matched ? 'match' : 'miss' : 'unknown',...(actual !== undefined ? {actual} : {})})
  const category = getMarketCategory(l)
  check('purpose',category !== null,category === c.purpose,category || undefined)
  if (c.budgetMin !== null || c.budgetMax !== null) check('budget',l.price !== null && l.priceCurrency === 'JPY',l.price !== null && (c.budgetMin === null || l.price >= c.budgetMin) && (c.budgetMax === null || l.price <= c.budgetMax),l.price ?? undefined)
  if (c.wards.length) check('area',!!l.city,c.wards.some(w=>l.city === w),l.city || undefined)
  if (c.propertyTypes.length) check('type',!!l.propertyType,c.propertyTypes.some(t=>typeNames[t].includes(l.propertyType || '')),l.propertyType || undefined)
  if (c.minArea !== null) { const area = l.propertyType === '土地' ? l.landArea : l.buildingArea;check('size',area !== null,area !== null && area >= c.minArea,area ?? undefined) }
  if (c.minBuiltYear !== null) check('year',l.builtYear !== null,l.builtYear !== null && l.builtYear >= c.minBuiltYear,l.builtYear ?? undefined)
  if (c.maxWalkMinutes !== null) {
    const minutes = Array.isArray(l.stations) ? l.stations.flatMap(s => s && typeof s === 'object' && 'walk_minutes' in s && typeof s.walk_minutes === 'number' && Number.isFinite(s.walk_minutes) && s.walk_minutes > 0 ? [s.walk_minutes] : []) : []
    const walk = minutes.length ? Math.min(...minutes) : null
    check('commute',walk !== null,walk !== null && walk <= c.maxWalkMinutes,walk ?? undefined)
  }
  if (c.minGrossYield !== null) check('yield',l.yieldGross !== null,l.yieldGross !== null && l.yieldGross >= c.minGrossYield,l.yieldGross ?? undefined)
  if (c.occupancy !== 'any') {
    const vacant = /空室|空家|空き家|更地/u.test(l.currentStatus || '')
    const tenanted = isInvestmentTenancy(l.currentStatus)
    check('occupancy',vacant !== tenanted,c.occupancy === 'vacant' ? vacant : tenanted,l.currentStatus || undefined)
  }
  const status = checks.some(x=>x.result === 'miss') ? 'outside' : checks.some(x=>x.result === 'unknown') ? 'needs_check' : 'aligned'
  const preferred = c.learnFromRatings && !!l.city && !!l.propertyType && preferences.some(p=>p.rating !== null && p.rating >= 4 && p.listingId !== l.id && p.city === l.city && p.propertyType === l.propertyType)
  const preferenceBonus = preferred ? 5 : 0
  const weight = (key:string)=>({location:'area',space:'size',price:'budget',commute:'commute'}[c.priority] === key ? 2 : 1)
  const score = Math.min(100,Math.round(checks.reduce((n,x)=>n+(x.result === 'match' ? weight(x.key) : 0),0)/checks.reduce((n,x)=>n+weight(x.key),0)*95)+preferenceBonus)
  return {status,score,preferenceBonus,checks,unconfirmed:['purchase_cost','holding_cost','handover',...(c.financing !== 'cash' ? ['financing'] : []),...(c.purpose === 'investment' ? ['net_income'] : []),...(c.purpose === 'land' ? ['development'] : [])],version:matchingVersion}
}
export type SearchPlan = {env:Record<string,string>; postFilters:string[]}
export function searchPlans(c:BuyerCriteria,preferences:Preference[]):SearchPlan[] {
  const preferredWards = c.learnFromRatings ? preferences.filter(p=>p.rating !== null && p.rating >= 4 && wards.includes(p.city as typeof wards[number])).map(p=>p.city!) : []
  const locations = c.wards.length ? [...c.wards].sort((a,b)=>Number(preferredWards.includes(b))-Number(preferredWards.includes(a))) : [...new Set(preferredWards)].slice(0,3)
  if (!locations.length) locations.push('23区')
  const selected = c.propertyTypes.length ? c.propertyTypes : c.purpose === 'land' ? ['land' as const] : c.purpose === 'residential' ? ['condo' as const,'house' as const] : ['whole_building' as const,'condo' as const]
  const mapped:Record<typeof types[number],{type:string;item:string}[]> = {condo:[{type:'売マンション',item:'中古マンション'}],house:[{type:'売一戸建',item:'中古戸建'}],land:[{type:'売土地',item:''}],whole_building:[{type:'売外全',item:'マンション'},{type:'売外全',item:'アパート'},{type:'売外全',item:'ビル'}],commercial:[{type:'売外全',item:'店舗・事務所'}]}
  const postFilters = ['purpose','timing','financing',...(['minArea','minBuiltYear','maxWalkMinutes','minGrossYield'] as const).filter(k=>c[k] !== null),'advertising_permission','source_freshness']
  return locations.flatMap(city=>selected.flatMap(type=>mapped[type].map(m=>({env:{REINS_AREA:'東京都',REINS_CITY:city,REINS_PROPERTY_TYPE:m.type,REINS_ITEM_NAME:m.item,REINS_PRICE_MIN:c.budgetMin === null ? '' : String(c.budgetMin/10000),REINS_PRICE_MAX:c.budgetMax === null ? '' : String(c.budgetMax/10000),REINS_EXCLUDE_OWNER_CHANGE:c.occupancy === 'vacant' ? 'true' : 'false'},postFilters}))))
}
