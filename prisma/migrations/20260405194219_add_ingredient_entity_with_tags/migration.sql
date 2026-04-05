-- AlterTable
ALTER TABLE "MealIngredient" ADD COLUMN     "ingredientId" TEXT;

-- CreateTable
CREATE TABLE "Ingredient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngredientTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "IngredientTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_IngredientToIngredientTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_IngredientToIngredientTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ingredient_name_key" ON "Ingredient"("name");

-- CreateIndex
CREATE UNIQUE INDEX "IngredientTag_name_key" ON "IngredientTag"("name");

-- CreateIndex
CREATE INDEX "_IngredientToIngredientTag_B_index" ON "_IngredientToIngredientTag"("B");

-- AddForeignKey
ALTER TABLE "MealIngredient" ADD CONSTRAINT "MealIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IngredientToIngredientTag" ADD CONSTRAINT "_IngredientToIngredientTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Ingredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IngredientToIngredientTag" ADD CONSTRAINT "_IngredientToIngredientTag_B_fkey" FOREIGN KEY ("B") REFERENCES "IngredientTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
