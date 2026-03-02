-- CreateTable
CREATE TABLE "UserFavoriteCity" (
    "userId" INTEGER NOT NULL,
    "cityId" VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFavoriteCity_pkey" PRIMARY KEY ("userId","cityId")
);

-- CreateIndex
CREATE INDEX "UserFavoriteCity_cityId_idx" ON "UserFavoriteCity"("cityId");

-- CreateIndex
CREATE INDEX "UserFavoriteCity_createdAt_idx" ON "UserFavoriteCity"("createdAt");

-- AddForeignKey
ALTER TABLE "UserFavoriteCity" ADD CONSTRAINT "UserFavoriteCity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFavoriteCity" ADD CONSTRAINT "UserFavoriteCity_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("cityId") ON DELETE CASCADE ON UPDATE CASCADE;
