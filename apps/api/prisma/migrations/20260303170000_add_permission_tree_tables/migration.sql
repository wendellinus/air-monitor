-- CreateTable
CREATE TABLE "Permission" (
    "key" VARCHAR(100) NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "parentKey" VARCHAR(100),
    "sort" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "role" "UserRole" NOT NULL,
    "permissionKey" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("role","permissionKey")
);

-- CreateIndex
CREATE INDEX "Permission_parentKey_idx" ON "Permission"("parentKey");

-- CreateIndex
CREATE INDEX "Permission_sort_idx" ON "Permission"("sort");

-- CreateIndex
CREATE INDEX "RolePermission_permissionKey_idx" ON "RolePermission"("permissionKey");

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_parentKey_fkey" FOREIGN KEY ("parentKey") REFERENCES "Permission"("key") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionKey_fkey" FOREIGN KEY ("permissionKey") REFERENCES "Permission"("key") ON DELETE CASCADE ON UPDATE CASCADE;
