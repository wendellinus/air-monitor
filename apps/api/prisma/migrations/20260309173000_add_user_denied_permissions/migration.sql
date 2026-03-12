CREATE TABLE "UserDeniedPermission" (
    "userId" INTEGER NOT NULL,
    "permissionKey" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserDeniedPermission_pkey" PRIMARY KEY ("userId","permissionKey")
);

CREATE INDEX "UserDeniedPermission_permissionKey_idx" ON "UserDeniedPermission"("permissionKey");

ALTER TABLE "UserDeniedPermission"
ADD CONSTRAINT "UserDeniedPermission_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserDeniedPermission"
ADD CONSTRAINT "UserDeniedPermission_permissionKey_fkey"
FOREIGN KEY ("permissionKey") REFERENCES "Permission"("key") ON DELETE CASCADE ON UPDATE CASCADE;
