-- CreateTable
CREATE TABLE "UserSkillFavourite" (
    "id" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "UserSkillFavourite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserSkillFavourite_skillId_userId_key" ON "UserSkillFavourite"("skillId", "userId");

-- AddForeignKey
ALTER TABLE "UserSkillFavourite" ADD CONSTRAINT "UserSkillFavourite_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkillFavourite" ADD CONSTRAINT "UserSkillFavourite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
