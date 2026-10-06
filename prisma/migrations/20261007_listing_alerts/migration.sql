-- New-listing email alerts (double opt-in). Server-only: no access for anon or authenticated roles.
CREATE TABLE IF NOT EXISTS public.listing_alert_subscriptions (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE CHECK (length(email) BETWEEN 6 AND 254),
  locale text NOT NULL DEFAULT 'en' CHECK (locale IN ('ja', 'en', 'zh-TW', 'zh-CN')),
  criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'unsubscribed')),
  token text NOT NULL UNIQUE CHECK (length(token) BETWEEN 32 AND 128),
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "confirmationSentAt" timestamp(3),
  "confirmedAt" timestamp(3),
  "lastDigestAt" timestamp(3),
  "unsubscribedAt" timestamp(3)
);
CREATE INDEX IF NOT EXISTS listing_alert_subscriptions_status_idx ON public.listing_alert_subscriptions (status);
ALTER TABLE public.listing_alert_subscriptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.listing_alert_subscriptions FROM PUBLIC, anon, authenticated;
