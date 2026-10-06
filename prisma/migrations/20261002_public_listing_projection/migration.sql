-- Row-level permission does not hide columns. Browser roles may only read public facts.
-- Private admin reads use an explicitly authenticated server service client.
REVOKE SELECT ON public.listings FROM PUBLIC, anon, authenticated;
DO $$ DECLARE columns text; BEGIN
  SELECT string_agg(quote_ident(column_name), ',') INTO columns FROM information_schema.columns WHERE table_schema='public' AND table_name='listings';
  EXECUTE 'REVOKE SELECT (' || columns || ') ON public.listings FROM PUBLIC, anon, authenticated';
END $$;
GRANT SELECT (
  id, status, "propertyType", price, "priceCurrency", prefecture, city, "addressPublic",
  stations, "builtYear", "builtMonth", "currentStatus", "buildingArea", "landArea", "floorCount",
  structure, zoning, "yieldGross", features, "featuresEn", "featuresZhTw", "featuresZhCn",
  "descriptionJa", "descriptionEn", "descriptionZhTw", "descriptionZhCn",
  "publishedAt", "updatedAt", "createdAt", "viewCount", "adAllowed", "hospitalityCategory"
) ON public.listings TO anon, authenticated;

-- Public rows expire without waiting for an archive job.
DROP POLICY IF EXISTS "Public can read published listings" ON public.listings;
CREATE POLICY "Public can read published listings" ON public.listings FOR SELECT TO anon, authenticated
USING (status::text='PUBLISHED' AND "adAllowed"=true
  AND ("conditionsExpiry" IS NULL OR "conditionsExpiry">now())
  AND ("autonomyValidUntil" IS NULL OR "autonomyValidUntil">now()));

CREATE OR REPLACE FUNCTION public.is_public_listing(listing_id text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM public.listings l WHERE l.id=listing_id AND l.status::text='PUBLISHED' AND l."adAllowed"=true
    AND (l."conditionsExpiry" IS NULL OR l."conditionsExpiry">now())
    AND (l."autonomyValidUntil" IS NULL OR l."autonomyValidUntil">now()))
$$;
REVOKE ALL ON FUNCTION public.is_public_listing(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_public_listing(text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.increment_view_count(listing_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  UPDATE public.listings SET "viewCount"=COALESCE("viewCount",0)+1 WHERE id=listing_id AND public.is_public_listing(id);
END $$;
