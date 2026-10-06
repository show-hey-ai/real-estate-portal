-- Full approved addresses may be public. Advertising-denied or consent-pending rows may not.
-- Keep the existing column projection; no grants to private address/source columns.
DROP POLICY IF EXISTS "Public can read published listings" ON public.listings;
CREATE POLICY "Public can read published listings" ON public.listings FOR SELECT TO anon, authenticated
USING (status::text='PUBLISHED' AND "adAllowed"=true AND "adConsentRequired"=false
  AND ("conditionsExpiry" IS NULL OR "conditionsExpiry">now())
  AND ("autonomyValidUntil" IS NULL OR "autonomyValidUntil">now()));

CREATE OR REPLACE FUNCTION public.is_public_listing(listing_id text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM public.listings l WHERE l.id=listing_id AND l.status::text='PUBLISHED'
    AND l."adAllowed"=true AND l."adConsentRequired"=false
    AND (l."conditionsExpiry" IS NULL OR l."conditionsExpiry">now())
    AND (l."autonomyValidUntil" IS NULL OR l."autonomyValidUntil">now()))
$$;
REVOKE ALL ON FUNCTION public.is_public_listing(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_public_listing(text) TO anon, authenticated, service_role;
