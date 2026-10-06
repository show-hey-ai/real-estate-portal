# Per-property chat

Each publicly available property detail page includes an automatic chat and, on mobile, a shortcut below the price. The current version answers selected factual topics from the property's published fields: asking price, building/land area, station access, building facts, public address and current status. Japanese, English and both Chinese variants are supported.

This is deterministic question/topic matching and factual rendering, not a generative AI or a live staff messaging service. There are no paid model calls. Viewing requests, negotiation, purchase terms, financing, legal eligibility and unknown information direct the visitor to the existing inquiry form. A chat answer does not book a viewing or send a message. The existing inquiry form still requires sign-in to submit.

## Public scope and privacy

`POST /api/listings/[id]/chat` reads the requested property afresh for every question. It uses the viewer's Supabase client, an explicit public column list and published/ad-permitted/property-category filters. It also requires the database's `is_public_listing` check, so an administrator's management RLS permission does not let chat answer for an expired property. No private address, source document, description or operational note is selected. Address replies reduce even a legacy full-address value through the same public-address formatter and do not fall back to the raw value.

The browser sends only the current question and language. Listing facts and arbitrary instructions cannot be supplied as request fields. JSON validation limits questions to 600 characters and streaming request bodies to 4 KiB. Cross-origin browser requests are denied; responses are not cached. A bounded per-instance IP limiter permits 12 requests per minute across all properties. This is abuse mitigation rather than a distributed billing limit; there are no paid provider calls to meter.

The last 24 displayed messages stay in component memory for the current page. They are not persisted, written to browser storage, sent to analytics or forwarded to the team. Navigation/reload starts a new conversation. Rendering uses React text nodes; no chat HTML is executed. Hydration gating avoids losing early input, repeated clicks cannot dispatch overlapping requests, and navigation aborts an unfinished request.

## Verification

The chat tests cover exact prices, mixed factual questions, four languages, unknown fields, missing floor counts, private/prompt requests, address reduction, per-property isolation, request validation, cross-origin rejection, limits and generic errors. Browser checks use the actual public property for price/area/access answers, explicit viewing-request deferral, language switching, mobile overflow and the inquiry anchor. No inquiry is sent during verification.

On 2026-10-03, all 41 combined regression tests passed (10 chat tests), along with full ESLint, the production build/TypeScript and the separate review. Local live-data checks returned 200 for the public property's chat and 404 for an actual draft property's chat.

## Production release — 2026-10-03

Deployment `dpl_2pWtyBASdozKK2Tdrf8y2bYqRu81` was staged and verified before promotion. Public chat/detail/search returned 200, the draft property's chat returned 404, and the anonymous admin API returned 401. After promotion to the custom domain, the public chat answered with the actual asking price and areas, the new chat rendered on the detail page, and the authenticated autonomy tick returned 200/`active`. The production chat was also used in the browser and visually inspected. No budget, database grant, publication policy or staff-contact state was changed for this release.
