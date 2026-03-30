CREATE TABLE "site_visit_events" (
  "id" TEXT NOT NULL,
  "visitorId" TEXT NOT NULL,
  "pathname" TEXT NOT NULL,
  "queryString" TEXT,
  "pageType" TEXT NOT NULL,
  "locale" TEXT,
  "referrerUrl" TEXT,
  "referrerHost" TEXT,
  "utmSource" TEXT,
  "utmMedium" TEXT,
  "utmCampaign" TEXT,
  "utmTerm" TEXT,
  "utmContent" TEXT,
  "listingId" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "site_visit_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "site_visit_events_occurredAt_idx" ON "site_visit_events"("occurredAt");
CREATE INDEX "site_visit_events_pageType_occurredAt_idx" ON "site_visit_events"("pageType", "occurredAt");
CREATE INDEX "site_visit_events_pathname_occurredAt_idx" ON "site_visit_events"("pathname", "occurredAt");
CREATE INDEX "site_visit_events_visitorId_occurredAt_idx" ON "site_visit_events"("visitorId", "occurredAt");
CREATE INDEX "site_visit_events_listingId_occurredAt_idx" ON "site_visit_events"("listingId", "occurredAt");
CREATE INDEX "site_visit_events_referrerHost_occurredAt_idx" ON "site_visit_events"("referrerHost", "occurredAt");

ALTER TABLE "site_visit_events"
ADD CONSTRAINT "site_visit_events_listingId_fkey"
FOREIGN KEY ("listingId") REFERENCES "listings"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
