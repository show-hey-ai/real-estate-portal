import { PUBLIC_PROPERTY_TYPES } from './market-category'

export function getPublicListingScope(now = new Date()) {
  return { status: 'PUBLISHED' as const, adAllowed: true, adConsentRequired: false, hospitalityCategory: null, propertyType: { in: [...PUBLIC_PROPERTY_TYPES] }, AND: [{ OR: [{ conditionsExpiry: null }, { conditionsExpiry: { gt: now } }] }, { OR: [{ autonomyValidUntil: null }, { autonomyValidUntil: { gt: now } }] }] }
}

// Only privileged server queries use these private operational columns.
export function publicFreshnessFilters(now = new Date()) {
  return [`conditionsExpiry.is.null,conditionsExpiry.gt.${now.toISOString()}`, `autonomyValidUntil.is.null,autonomyValidUntil.gt.${now.toISOString()}`]
}
