import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MealForm from "../../meal-form";

interface EditMealPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditMealPage({ params }: EditMealPageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  const meal = await prisma.meal.findUnique({
    where: { id },
    include: {
      tags: { orderBy: { name: "asc" } },
      ingredients: { orderBy: { position: "asc" } },
    },
  });

  if (!meal) notFound();

  const [allTags, allIngredients] = await Promise.all([
    prisma.mealTag.findMany({ orderBy: { name: "asc" } }),
    prisma.mealIngredient.findMany({
      select: { name: true },
      distinct: ["name"],
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="flex min-h-full flex-1 items-start justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-2xl space-y-6">
        <div>
          <Link
            href={`/meals/${meal.id}`}
            className="text-sm text-stone-500 transition-colors hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
          >
            &larr; Back to {meal.name}
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-stone-800 dark:text-stone-100">
            Edit Meal
          </h1>
        </div>

        <MealForm
          meal={{
            id: meal.id,
            name: meal.name,
            recipe: meal.recipe,
            tags: meal.tags,
            ingredients: meal.ingredients,
          }}
          allTags={allTags.map((t) => t.name)}
          allIngredientNames={allIngredients.map((i) => i.name)}
        />
      </div>
    </div>
  );
}
