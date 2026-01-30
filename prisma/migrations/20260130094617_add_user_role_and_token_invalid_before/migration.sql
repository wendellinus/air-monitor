-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'operator', 'admin');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'user',
ADD COLUMN     "tokenInvalidBefore" TIMESTAMP(3);
