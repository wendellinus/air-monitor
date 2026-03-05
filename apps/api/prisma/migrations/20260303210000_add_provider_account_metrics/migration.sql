-- CreateTable
CREATE TABLE "ProviderAccountSnapshot" (
    "id" SERIAL NOT NULL,
    "provider" VARCHAR(20) NOT NULL,
    "source" VARCHAR(20) NOT NULL DEFAULT 'live',
    "snapshotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "balance" DECIMAL(20,4),
    "requestCount" INTEGER,
    "quotaLimit" INTEGER,
    "quotaUsed" INTEGER,
    "usageRate" DECIMAL(8,6),
    "raw" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderAccountSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderAccountMetricPoint" (
    "id" SERIAL NOT NULL,
    "provider" VARCHAR(20) NOT NULL,
    "metricKey" VARCHAR(32) NOT NULL,
    "bucket" VARCHAR(10) NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "value" DECIMAL(20,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderAccountMetricPoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProviderAccountSnapshot_provider_snapshotAt_idx" ON "ProviderAccountSnapshot"("provider", "snapshotAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ProviderAccountMetricPoint_provider_metricKey_bucket_time_key" ON "ProviderAccountMetricPoint"("provider", "metricKey", "bucket", "time");

-- CreateIndex
CREATE INDEX "ProviderAccountMetricPoint_provider_metricKey_time_idx" ON "ProviderAccountMetricPoint"("provider", "metricKey", "time" DESC);
