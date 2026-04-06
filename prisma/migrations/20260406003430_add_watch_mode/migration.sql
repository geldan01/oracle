-- CreateEnum
CREATE TYPE "WatchMode" AS ENUM ('INDIVIDUAL', 'HOUSEHOLD');

-- AlterTable
ALTER TABLE "TvShow" ADD COLUMN     "watchMode" "WatchMode" NOT NULL DEFAULT 'INDIVIDUAL';
