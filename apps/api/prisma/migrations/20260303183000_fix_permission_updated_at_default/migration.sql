-- Ensure timestamp defaults are safe for raw SQL inserts/upserts.
ALTER TABLE "Permission"
  ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- Defensive backfill (should be no-op on healthy data).
UPDATE "Permission"
SET "updatedAt" = COALESCE("updatedAt", NOW());
