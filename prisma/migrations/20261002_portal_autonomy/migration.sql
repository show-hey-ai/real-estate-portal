-- CreateTable
-- Source identity and automatic-release freshness are private operational fields.
ALTER TABLE public.listings ADD COLUMN "sourcePropertyId" text, ADD COLUMN "autonomyValidUntil" timestamp(3);
CREATE UNIQUE INDEX listings_source_property_id_key ON public.listings ("sourcePropertyId");

CREATE TABLE "autonomy_policies" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "objective" TEXT NOT NULL,
    "intervalMinutes" INTEGER NOT NULL DEFAULT 60,
    "monthlyBudgetYen" INTEGER NOT NULL DEFAULT 0,
    "aiCallReserveYen" INTEGER NOT NULL DEFAULT 100,
    "allowAiStrategy" BOOLEAN NOT NULL DEFAULT false,
    "allowPublication" BOOLEAN NOT NULL DEFAULT false,
    "allowArchive" BOOLEAN NOT NULL DEFAULT false,
    "allowReinsIntake" BOOLEAN NOT NULL DEFAULT false,
    "allowArticles" BOOLEAN NOT NULL DEFAULT false,
    "allowSeo" BOOLEAN NOT NULL DEFAULT false,
    "reinsIntervalHours" INTEGER NOT NULL DEFAULT 24,
    "reinsBatchReserveYen" INTEGER NOT NULL DEFAULT 1000,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "lastHeartbeatAt" TIMESTAMP(3),
    "lastSourceHeartbeatAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "autonomy_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "autonomy_jobs" (
    "id" TEXT NOT NULL,
    "ventureId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dedupeKey" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "result" JSONB,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leaseToken" TEXT,
    "leaseExpiresAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "autonomy_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "autonomy_runs" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "leaseToken" TEXT NOT NULL,
    "outcome" TEXT NOT NULL DEFAULT 'running',
    "reservedCostYen" INTEGER NOT NULL DEFAULT 0,
    "actualCostYen" INTEGER,
    "providerReceipt" TEXT,
    "pendingProviderRequests" INTEGER NOT NULL DEFAULT 0,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "autonomy_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "autonomy_records" (
    "id" TEXT NOT NULL,
    "ventureId" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "recordType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "sources" JSONB NOT NULL,
    "verification" TEXT NOT NULL DEFAULT 'unverified',
    "version" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "autonomy_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "autonomy_jobs_ventureId_status_availableAt_idx" ON "autonomy_jobs"("ventureId", "status", "availableAt");

-- CreateIndex
CREATE UNIQUE INDEX "autonomy_jobs_ventureId_dedupeKey_key" ON "autonomy_jobs"("ventureId", "dedupeKey");

-- CreateIndex
CREATE UNIQUE INDEX "autonomy_runs_leaseToken_key" ON "autonomy_runs"("leaseToken");

-- CreateIndex
CREATE INDEX "autonomy_runs_startedAt_idx" ON "autonomy_runs"("startedAt");

-- CreateIndex
CREATE INDEX "autonomy_records_ventureId_recordType_createdAt_idx" ON "autonomy_records"("ventureId", "recordType", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "autonomy_records_ventureId_dedupeKey_key" ON "autonomy_records"("ventureId", "dedupeKey");

-- AddForeignKey
ALTER TABLE "autonomy_jobs" ADD CONSTRAINT "autonomy_jobs_ventureId_fkey" FOREIGN KEY ("ventureId") REFERENCES "autonomy_policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autonomy_runs" ADD CONSTRAINT "autonomy_runs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "autonomy_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autonomy_records" ADD CONSTRAINT "autonomy_records_ventureId_fkey" FOREIGN KEY ("ventureId") REFERENCES "autonomy_policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "autonomy_policies" ADD CONSTRAINT "autonomy_policy_bounds" CHECK (
  "intervalMinutes" BETWEEN 15 AND 1440 AND "monthlyBudgetYen" >= 0
  AND "aiCallReserveYen" BETWEEN 1 AND 10000 AND "maxAttempts" BETWEEN 1 AND 5
  AND "reinsIntervalHours" BETWEEN 1 AND 168 AND "reinsBatchReserveYen" BETWEEN 100 AND 10000
);
ALTER TABLE "autonomy_jobs" ADD CONSTRAINT "autonomy_job_kind" CHECK (
  "kind" IN ('observe', 'health', 'strategy', 'publication_audit', 'verify_publication', 'rollback_publication', 'reins_intake', 'maisoku_import', 'generate_article', 'seo', 'verify_article', 'rollback_article')
);
ALTER TABLE "autonomy_runs" ADD CONSTRAINT "autonomy_cost_nonnegative" CHECK (
  "reservedCostYen" >= 0 AND ("actualCostYen" IS NULL OR "actualCostYen" >= 0)
  AND "pendingProviderRequests" >= 0
);

INSERT INTO "autonomy_policies" ("id", "objective", "updatedAt") VALUES (
  'ziyou-portal',
  'Increase qualified Tokyo property purchase inquiries while maintaining accurate, permitted listings and reducing routine human work.',
  CURRENT_TIMESTAMP
);

-- The policy row serializes claims, configuration and cost reservations per venture.
-- A lost paid-call result is reconciled, never blindly called again.
CREATE FUNCTION public.claim_portal_autonomy_job(
  p_venture text, p_now timestamp, p_lease text, p_has_ai_key boolean, p_can_reins boolean DEFAULT false
) RETURNS SETOF public.autonomy_jobs
LANGUAGE plpgsql AS $$
DECLARE
  p public.autonomy_policies%ROWTYPE;
  j public.autonomy_jobs%ROWTYPE;
  reservation integer;
  committed bigint;
  month_start timestamp;
BEGIN
  SELECT * INTO p FROM public.autonomy_policies WHERE id = p_venture FOR UPDATE;
  IF NOT FOUND OR NOT p.enabled THEN RETURN; END IF;
  month_start := date_trunc('month', p_now + interval '9 hours') - interval '9 hours';

  UPDATE public.autonomy_jobs job SET status = 'needs_reconciliation',
    "lastError" = 'Paid-call result is unknown after lease expiry; no automatic duplicate call.',
    "leaseToken" = NULL, "leaseExpiresAt" = NULL, "updatedAt" = p_now
  WHERE job."ventureId" = p_venture AND job.status = 'running' AND job."leaseExpiresAt" <= p_now
    AND EXISTS (SELECT 1 FROM public.autonomy_runs r WHERE r."jobId" = job.id AND r.outcome = 'running' AND r."reservedCostYen" > 0);

  UPDATE public.autonomy_runs r SET outcome = 'needs_reconciliation', "finishedAt" = p_now
  FROM public.autonomy_jobs job
  WHERE r."jobId" = job.id AND job."ventureId" = p_venture
    AND job.status = 'needs_reconciliation' AND r.outcome = 'running';

  UPDATE public.autonomy_runs r SET outcome = 'interrupted', "finishedAt" = p_now
  FROM public.autonomy_jobs job
  WHERE r."jobId" = job.id AND job."ventureId" = p_venture AND job.status = 'running'
    AND job."leaseExpiresAt" <= p_now AND r.outcome = 'running' AND r."reservedCostYen" = 0;

  UPDATE public.autonomy_jobs SET status = 'failed', "lastError" = 'Retry limit reached.',
    "leaseToken" = NULL, "leaseExpiresAt" = NULL, "updatedAt" = p_now
  WHERE "ventureId" = p_venture AND attempts >= p."maxAttempts"
    AND (status = 'pending' OR (status = 'running' AND "leaseExpiresAt" <= p_now));

  FOR i IN 1..100 LOOP
    SELECT * INTO j FROM public.autonomy_jobs
    WHERE "ventureId" = p_venture AND "availableAt" <= p_now AND attempts < p."maxAttempts"
      AND (status = 'pending' OR (status = 'running' AND "leaseExpiresAt" <= p_now))
      AND (kind NOT IN ('reins_intake', 'maisoku_import') OR p_can_reins)
    ORDER BY priority DESC, "createdAt" ASC FOR UPDATE SKIP LOCKED LIMIT 1;
    IF NOT FOUND THEN RETURN; END IF;

    IF (j.kind = 'publication_audit' AND NOT p."allowPublication")
      OR (j.kind IN ('reins_intake', 'maisoku_import') AND NOT p."allowReinsIntake")
      OR (j.kind = 'maisoku_import' AND NOT p_has_ai_key)
      OR (j.kind = 'generate_article' AND NOT p."allowArticles")
      OR (j.kind = 'seo' AND NOT p."allowSeo")
      OR (j.kind = 'strategy' AND p."allowAiStrategy" AND NOT p_has_ai_key) THEN
      UPDATE public.autonomy_jobs SET status = 'blocked', "lastError" = 'Operating permission or connection is not configured.', "updatedAt" = p_now WHERE id = j.id;
      CONTINUE;
    END IF;

    reservation := CASE WHEN j.kind = 'maisoku_import' THEN p."reinsBatchReserveYen" WHEN j.kind = 'strategy' AND p."allowAiStrategy" THEN p."aiCallReserveYen" ELSE 0 END;
    SELECT COALESCE(SUM(COALESCE(r."actualCostYen", r."reservedCostYen")), 0) INTO committed
    FROM public.autonomy_runs r JOIN public.autonomy_jobs job ON job.id = r."jobId"
    WHERE job."ventureId" = p_venture AND (r."startedAt" >= month_start OR (r."actualCostYen" IS NULL AND r.outcome IN ('running', 'needs_reconciliation')));
    IF reservation > 0 AND committed + reservation > p."monthlyBudgetYen" THEN
      UPDATE public.autonomy_jobs SET status = 'blocked', "lastError" = 'Monthly budget or unresolved cost reservations prevent this paid job.', "updatedAt" = p_now WHERE id = j.id;
      CONTINUE;
    END IF;

    UPDATE public.autonomy_jobs SET status = 'running', attempts = attempts + 1,
      "leaseToken" = p_lease, "leaseExpiresAt" = p_now + CASE WHEN j.kind IN ('reins_intake', 'maisoku_import') THEN interval '30 minutes' ELSE interval '5 minutes' END,
      "lastError" = NULL, "updatedAt" = p_now WHERE id = j.id RETURNING * INTO j;
    INSERT INTO public.autonomy_runs (id, "jobId", "leaseToken", "reservedCostYen", "actualCostYen", "startedAt")
      VALUES (p_lease, j.id, p_lease, reservation, CASE WHEN reservation = 0 THEN 0 ELSE NULL END, p_now);
    RETURN NEXT j;
    RETURN;
  END LOOP;
END;
$$;

-- No browser role may read source evidence, operating instructions or cost records.
ALTER TABLE "autonomy_policies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "autonomy_jobs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "autonomy_runs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "autonomy_records" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "autonomy_policies", "autonomy_jobs", "autonomy_runs", "autonomy_records" FROM anon, authenticated;
GRANT ALL ON "autonomy_policies", "autonomy_jobs", "autonomy_runs", "autonomy_records" TO service_role;
REVOKE ALL ON FUNCTION public.claim_portal_autonomy_job(text, timestamp, text, boolean, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_portal_autonomy_job(text, timestamp, text, boolean, boolean) TO service_role;

CREATE TABLE public.portal_articles (
  slug text PRIMARY KEY, city text NOT NULL, status text NOT NULL DEFAULT 'DRAFT',
  locales jsonb NOT NULL, "sourceHash" text NOT NULL, "sourceIds" jsonb NOT NULL,
  version text NOT NULL, "publishedAt" timestamp(3), "updatedAt" timestamp(3) NOT NULL,
  CONSTRAINT article_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED'))
);
ALTER TABLE public.portal_articles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.portal_articles FROM anon, authenticated;
GRANT ALL ON public.portal_articles TO service_role;
