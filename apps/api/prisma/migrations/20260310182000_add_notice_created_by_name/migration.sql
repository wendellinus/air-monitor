-- Add creator display name to preserve the specific operator shown in admin notice lists.
ALTER TABLE "Notice"
ADD COLUMN "createdByName" VARCHAR(20);
