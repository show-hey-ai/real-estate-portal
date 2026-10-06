-- Enable Row-Level Security for every table exposed through the public schema.
-- Public visitors can only read published, ad-approved listing data. Admins keep
-- full access through authenticated Supabase sessions and server-side service role usage.

CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT u.id
  FROM public.users u
  WHERE lower(u.email) = lower(auth.jwt() ->> 'email')
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE lower(u.email) = lower(auth.jwt() ->> 'email')
      AND u.role::text = 'ADMIN'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_public_listing(listing_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.listings l
    WHERE l.id = listing_id
      AND l.status::text = 'PUBLISHED'
      AND l."adAllowed" = true
  )
$$;

CREATE OR REPLACE FUNCTION public.increment_view_count(listing_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.listings
  SET "viewCount" = COALESCE("viewCount", 0) + 1
  WHERE id = listing_id
    AND status::text = 'PUBLISHED'
    AND "adAllowed" = true;
END;
$$;

REVOKE ALL ON FUNCTION public.current_app_user_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_public_listing(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_view_count(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.current_app_user_id() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_public_listing(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_view_count(text) TO anon, authenticated, service_role;

ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extraction_evidences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_visit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transit_line_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transit_station_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage migration history" ON public._prisma_migrations;
CREATE POLICY "Admins can manage migration history"
ON public._prisma_migrations
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage admin logs" ON public.admin_logs;
CREATE POLICY "Admins can manage admin logs"
ON public.admin_logs
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage extraction evidences" ON public.extraction_evidences;
CREATE POLICY "Admins can manage extraction evidences"
ON public.extraction_evidences
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage users" ON public.users;
CREATE POLICY "Admins can manage users"
ON public.users
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
CREATE POLICY "Users can read own profile"
ON public.users
FOR SELECT
TO authenticated
USING (lower(email) = lower(auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS "Public can read published listings" ON public.listings;
CREATE POLICY "Public can read published listings"
ON public.listings
FOR SELECT
TO anon, authenticated
USING (status::text = 'PUBLISHED' AND "adAllowed" = true);

DROP POLICY IF EXISTS "Admins can manage listings" ON public.listings;
CREATE POLICY "Admins can manage listings"
ON public.listings
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public can read adopted media for published listings" ON public.media;
CREATE POLICY "Public can read adopted media for published listings"
ON public.media
FOR SELECT
TO anon, authenticated
USING ("isAdopted" = true AND public.is_public_listing("listingId"));

DROP POLICY IF EXISTS "Admins can manage media" ON public.media;
CREATE POLICY "Admins can manage media"
ON public.media
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users can read own favorites" ON public.favorites;
CREATE POLICY "Users can read own favorites"
ON public.favorites
FOR SELECT
TO authenticated
USING ("userId" = public.current_app_user_id());

DROP POLICY IF EXISTS "Users can add own favorites" ON public.favorites;
CREATE POLICY "Users can add own favorites"
ON public.favorites
FOR INSERT
TO authenticated
WITH CHECK (
  "userId" = public.current_app_user_id()
  AND public.is_public_listing("listingId")
);

DROP POLICY IF EXISTS "Users can delete own favorites" ON public.favorites;
CREATE POLICY "Users can delete own favorites"
ON public.favorites
FOR DELETE
TO authenticated
USING ("userId" = public.current_app_user_id());

DROP POLICY IF EXISTS "Admins can manage favorites" ON public.favorites;
CREATE POLICY "Admins can manage favorites"
ON public.favorites
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users can read own leads" ON public.leads;
CREATE POLICY "Users can read own leads"
ON public.leads
FOR SELECT
TO authenticated
USING ("userId" = public.current_app_user_id());

DROP POLICY IF EXISTS "Users can create own leads" ON public.leads;
CREATE POLICY "Users can create own leads"
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK (
  "userId" = public.current_app_user_id()
  AND public.is_public_listing("listingId")
);

DROP POLICY IF EXISTS "Admins can manage leads" ON public.leads;
CREATE POLICY "Admins can manage leads"
ON public.leads
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage site visit events" ON public.site_visit_events;
CREATE POLICY "Admins can manage site visit events"
ON public.site_visit_events
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public can read active transit lines" ON public.transit_line_master;
CREATE POLICY "Public can read active transit lines"
ON public.transit_line_master
FOR SELECT
TO anon, authenticated
USING ("isActive" = true);

DROP POLICY IF EXISTS "Admins can manage transit lines" ON public.transit_line_master;
CREATE POLICY "Admins can manage transit lines"
ON public.transit_line_master
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public can read active transit stations" ON public.transit_station_master;
CREATE POLICY "Public can read active transit stations"
ON public.transit_station_master
FOR SELECT
TO anon, authenticated
USING (
  "isActive" = true
  AND EXISTS (
    SELECT 1
    FROM public.transit_line_master line
    WHERE line.id = "lineId"
      AND line."isActive" = true
  )
);

DROP POLICY IF EXISTS "Admins can manage transit stations" ON public.transit_station_master;
CREATE POLICY "Admins can manage transit stations"
ON public.transit_station_master
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
