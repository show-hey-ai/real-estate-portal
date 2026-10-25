-- Signed-in members keep their recently viewed listings, saved searches and buyer answers across devices.
-- Favorites already live in public.favorites. Server-only: no access for anon or authenticated roles.
CREATE TABLE IF NOT EXISTS public.member_lists (
  "userId" text PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  recent jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(recent) = 'array'),
  "savedSearches" jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof("savedSearches") = 'array'),
  "buyerProfile" jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof("buyerProfile") = 'object'),
  "updatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.member_lists ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.member_lists FROM PUBLIC, anon, authenticated;
