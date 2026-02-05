-- This migration is created manually to keep the repository self-contained.
-- You can regenerate it using: pnpm prisma:migrate:dev

CREATE TABLE "User" (
  "id" SERIAL NOT NULL,
  "username" VARCHAR(20) NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "email" VARCHAR(64),
  "phone" VARCHAR(16),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

CREATE TABLE "RefreshToken" (
  "id" TEXT NOT NULL,
  "userId" INTEGER NOT NULL,
  "jti" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RefreshToken_jti_key" ON "RefreshToken"("jti");
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

ALTER TABLE "RefreshToken"
ADD CONSTRAINT "RefreshToken_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "City" (
  "id" SERIAL NOT NULL,
  "cityId" VARCHAR(20) NOT NULL,
  "name" VARCHAR(50) NOT NULL,
  "lat" VARCHAR(20) NOT NULL,
  "lon" VARCHAR(20) NOT NULL,
  "adm2" VARCHAR(50) NOT NULL,
  "adm1" VARCHAR(50) NOT NULL,
  "country" VARCHAR(50) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "City_cityId_key" ON "City"("cityId");

CREATE TABLE "AirQualityLog" (
  "id" SERIAL NOT NULL,
  "cityId" VARCHAR(20) NOT NULL,
  "pubTime" TIMESTAMP(3) NOT NULL,
  "aqi" INTEGER NOT NULL,
  "level" VARCHAR(10) NOT NULL,
  "category" VARCHAR(20) NOT NULL,
  "primary" VARCHAR(50),
  "pm10" DOUBLE PRECISION NOT NULL,
  "pm2p5" DOUBLE PRECISION NOT NULL,
  "no2" DOUBLE PRECISION NOT NULL,
  "so2" DOUBLE PRECISION NOT NULL,
  "co" DOUBLE PRECISION NOT NULL,
  "o3" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AirQualityLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AirQualityLog_cityId_idx" ON "AirQualityLog"("cityId");
CREATE INDEX "AirQualityLog_pubTime_idx" ON "AirQualityLog"("pubTime");

CREATE TABLE "Notice" (
  "id" SERIAL NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "content" TEXT,
  "startTime" TIMESTAMP(3) NOT NULL,
  "endTime" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "level" TEXT NOT NULL DEFAULT 'info',
  "alertId" VARCHAR(50),
  "eventType" VARCHAR(50),
  "severity" VARCHAR(20),
  "colorCode" VARCHAR(20),
  "source" VARCHAR(20) NOT NULL DEFAULT 'manual',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Notice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Notice_alertId_key" ON "Notice"("alertId");

