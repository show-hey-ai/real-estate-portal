-- Keep original events intact; exclude only verified internal browser IDs.
CREATE TABLE IF NOT EXISTS public.site_analytics_exclusions (
  "visitorId" text PRIMARY KEY CHECK (length("visitorId") BETWEEN 8 AND 128),
  reason text NOT NULL CHECK (reason IN ('administrator', 'local-development')),
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.site_analytics_exclusions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.site_analytics_exclusions FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE VIEW public.external_site_visit_events WITH (security_invoker = true) AS
SELECT event.* FROM public.site_visit_events event
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_analytics_exclusions excluded
  WHERE excluded."visitorId" = event."visitorId"
)
AND COALESCE(event."referrerHost", '') !~* '(^localhost$|\.localhost$|^127\.[0-9]+\.[0-9]+\.[0-9]+$|^\[?::1\]?$)';
REVOKE ALL ON public.external_site_visit_events FROM PUBLIC, anon, authenticated;
