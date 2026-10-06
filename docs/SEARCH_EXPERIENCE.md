# Purchase search experience

The 2026-10-03 release takes inspiration from Comfy's compact search layout while using Ziyou's own purchase listings and public data permissions. No Comfy inventory, images or code are imported.

- Desktop search uses a filter sidebar beside the result cards. Mobile filters expand above the results.
- One lookup accepts a Tokyo ward, railway line or station; stations can be selected without choosing a line first.
- Price and area support lower/upper numeric bounds and sliders. Prices are stored in yen regardless of displayed language. Land uses land area; other property types use building area. A station walking limit must be satisfied by the selected station/line.
- The result toolbar shows the exact matching count, removable criteria and sorting. Valid explicit property-type area bounds are pushed into the database query; mixed-type area/transit criteria use complete candidate evaluation.
- Up to eight criteria sets can be saved, restored and deleted in the current browser. These are local preferences, not account-synced alerts, emails or automatic recommendations.
- A price histogram is shown only when there are at least five visible priced listings. It describes listing asking prices, not transactions or a market valuation. It uses the requesting viewer's public column projection/RLS, with no private fields or service-role reads. More than 5,000 candidate prices, missing counts or a query failure omit the histogram rather than present partial statistics.
- Japanese, English, Traditional Chinese and Simplified Chinese are supported. A language change reinitializes price input units from the same yen criteria.

The existing autonomy pipeline, publication permission rules, budget controls and private/public boundary remain in place. This release does not add a map, cloud-saved criteria or notifications.

## Verification

31 isolated tests passed, including station-specific walking limits, decimal area bounds, saved-query validation and histogram boundaries, plus the autonomy regression tests. Full ESLint, the production build (including TypeScript), and the separate code review passed. Browser checks used the actual public listing to verify station selection, walking limits, area/price bounds, invalid ranges, save/reload/restore, all four languages and a 390-pixel mobile viewport. Temporary browser preferences were stored only on localhost.

## Production evidence — 2026-10-03

Deployment `dpl_CQ4oaujAeGhURpTvJ1RodE2oR2ys` was built and tested without switching the public domain, then promoted to [the portal search](https://portal.ziyou-fudosan.com/listings). Staged checks verified exact result counts for area 250/300 m², explicit building-type area bounds and Morishita walking limits 5/10 minutes. Public columns remained readable; private address access, the anonymous admin API and the anonymous scheduler endpoint were denied. An authenticated tick returned `active`.

After promotion, the custom domain served the new search toolbar, correct area counts, article index, sitemap and robots routes. The admin API still rejected anonymous access and an authenticated tick still returned `active`. The actual desktop/mobile page was visually inspected. The existing paid AI allowance was not changed by this UI release.
