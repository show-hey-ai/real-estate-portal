CREATE TABLE buyer_search_profiles (
  id uuid PRIMARY KEY,
  "buyerSubject" uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  active boolean NOT NULL DEFAULT true,
  criteria jsonb NOT NULL CHECK (jsonb_typeof(criteria) = 'object'),
  "matchGeneration" uuid,
  "lastMatchedAt" timestamptz,
  "lastSourceAttemptAt" timestamptz,
  "lastSourceAt" timestamptz,
  "sourceCursor" integer NOT NULL DEFAULT 0 CHECK ("sourceCursor" >= 0),
  "sourceState" text NOT NULL DEFAULT 'waiting' CHECK ("sourceState" IN ('waiting','acquiring','review_pending','failed')),
  "sourcePlan" jsonb,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CHECK ((criteria->>'active')::boolean = active)
);
CREATE INDEX buyer_search_due ON buyer_search_profiles (active, "lastMatchedAt", "lastSourceAttemptAt");
CREATE TABLE buyer_recommendations (
  "profileId" uuid NOT NULL REFERENCES buyer_search_profiles(id) ON DELETE CASCADE,
  "listingId" text NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  "profileRevision" integer NOT NULL CHECK ("profileRevision" > 0),
  "matchGeneration" uuid NOT NULL,
  "listingUpdatedAt" timestamp(3) NOT NULL,
  "listingHash" text NOT NULL CHECK ("listingHash" ~ '^[a-f0-9]{64}$'),
  evaluation jsonb NOT NULL,
  score integer NOT NULL CHECK (score BETWEEN 0 AND 100),
  status text NOT NULL CHECK (status IN ('aligned','needs_check','outside')),
  "suggestedAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("profileId","listingId")
);
CREATE TABLE buyer_feedback (
  "profileId" uuid NOT NULL,
  "listingId" text NOT NULL,
  rating integer CHECK (rating BETWEEN 1 AND 5),
  status text NOT NULL CHECK (status IN ('neutral','like','shortlist','dismiss')),
  reason text NOT NULL CHECK (reason IN ('none','price','area','size','occupancy','yield','condition','other')),
  "lastNonce" uuid NOT NULL,
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("profileId","listingId"),
  FOREIGN KEY ("profileId","listingId") REFERENCES buyer_recommendations("profileId","listingId") ON DELETE CASCADE
);
ALTER TABLE buyer_search_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_feedback ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON buyer_search_profiles, buyer_recommendations, buyer_feedback FROM PUBLIC, anon, authenticated;
GRANT SELECT ON buyer_search_profiles, buyer_recommendations, buyer_feedback TO authenticated;
GRANT ALL ON buyer_search_profiles, buyer_recommendations, buyer_feedback TO service_role;
CREATE POLICY buyer_profile_owner ON buyer_search_profiles FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = "buyerSubject");
-- Guarded boolean avoids requiring browser access to private freshness columns.
CREATE FUNCTION public.buyer_recommendation_visible(p_profile uuid,p_listing text,p_revision integer,p_updated timestamp,p_generation uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
  SELECT EXISTS (SELECT 1 FROM public.buyer_search_profiles p WHERE p.id=p_profile AND p."buyerSubject"=(SELECT auth.uid()) AND p.active AND p.revision=p_revision AND p."matchGeneration"=p_generation)
    AND EXISTS (SELECT 1 FROM public.listings l WHERE l.id=p_listing AND l."updatedAt"=p_updated AND l.status='PUBLISHED' AND l."adAllowed" AND NOT l."adConsentRequired" AND l."hospitalityCategory" IS NULL
      AND l."propertyType" IN ('区分マンション','戸建','土地','一棟マンション','一棟アパート','一棟ビル','店舗・事務所')
      AND (l."conditionsExpiry" IS NULL OR l."conditionsExpiry">now()) AND (l."autonomyValidUntil" IS NULL OR l."autonomyValidUntil">now()));
$$;
REVOKE ALL ON FUNCTION public.buyer_recommendation_visible(uuid,text,integer,timestamp,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.buyer_recommendation_visible(uuid,text,integer,timestamp,uuid) TO authenticated, service_role;
CREATE POLICY buyer_recommendation_owner ON buyer_recommendations FOR SELECT TO authenticated
  USING (public.buyer_recommendation_visible("profileId","listingId","profileRevision","listingUpdatedAt","matchGeneration"));
CREATE POLICY buyer_feedback_owner ON buyer_feedback FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM buyer_search_profiles p WHERE p.id="profileId" AND p."buyerSubject"=(SELECT auth.uid())));
