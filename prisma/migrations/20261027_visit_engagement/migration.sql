-- Tell people from simple bots: a page view is marked engaged when the visitor scrolls, taps,
-- clicks or types on it, and each view records the kind of device (from the browser's User-Agent).
ALTER TABLE public.site_visit_events
  ADD COLUMN IF NOT EXISTS "engagedAt" timestamp(3),
  ADD COLUMN IF NOT EXISTS "deviceType" text CHECK ("deviceType" IN ('mobile', 'tablet', 'desktop'));

-- The view lists the table's columns as they were when it was created; recreate it to add the new ones.
CREATE OR REPLACE VIEW public.external_site_visit_events WITH (security_invoker = true) AS
SELECT event.* FROM public.site_visit_events event
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_analytics_exclusions excluded
  WHERE excluded."visitorId" = event."visitorId"
)
AND COALESCE(event."referrerHost", '') !~* '(^localhost$|\.localhost$|^127\.[0-9]+\.[0-9]+\.[0-9]+$|^\[?::1\]?$)';
REVOKE ALL ON public.external_site_visit_events FROM PUBLIC, anon, authenticated;
