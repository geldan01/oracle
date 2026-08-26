-- AlterTable
ALTER TABLE "TvShow" ADD COLUMN     "profileUserId" TEXT;

-- AddForeignKey
ALTER TABLE "TvShow" ADD CONSTRAINT "TvShow_profileUserId_fkey" FOREIGN KEY ("profileUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
