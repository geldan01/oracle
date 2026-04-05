import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import IngredientTags from "./ingredient-tags";

interface IngredientDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function IngredientDetailPage({
  params,
}: IngredientDetailPageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  const ingredient = await prisma.ingredient.findUnique({
    where: { id },
    include: {
      tags: { orderBy: { name: "asc" } },
      usages: {
        include: {
          meal: {
            select: { id: true, name: true, imageUrl: true },
          },
        },
        orderBy: { meal: { name: "asc" } },
      },
    },
  });

  if (!ingredient) notFound();

  const allTags = await prisma.ingredientTag.findMany({
    orderBy: { name: "asc" },
  });

  // Deduplicate meals (same ingredient can appear in a meal only once, but just in case)
  const uniqueMeals = Array.from(
    new Map(ingredient.usages.map((u) => [u.meal.id, u.meal])).values()
  );

  return (
    <div className="flex min-h-full flex-1 items-start justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-3xl space-y-8">
        {/* Header */}
        <div>
          <Link
            href="/ingredients"
            className="text-sm text-stone-500 transition-colors hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
          >
            &larr; Ingredients
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-stone-800 dark:text-stone-100">
            {ingredient.name}
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Used in {uniqueMeals.length}{" "}
            {uniqueMeals.length === 1 ? "meal" : "meals"}
          </p>
        </div>

        {/* Tags / Grocery sections */}
        <div>
          <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300">
            Grocery Section
          </h2>
          <div className="mt-3">
            <IngredientTags
              ingredientId={ingredient.id}
              currentTags={ingredient.tags.map((t) => t.name)}
              allExistingTags={allTags.map((t) => t.name)}
            />
          </div>
        </div>

        {/* Meals that use this ingredient */}
        <div>
          <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300">
            Meals
          </h2>
          {uniqueMeals.length > 0 ? (
            <div className="mt-3 space-y-2">
              {uniqueMeals.map((meal) => (
                <Link
                  key={meal.id}
                  href={`/meals/${meal.id}`}
                  className="group flex items-center gap-3 rounded-lg border border-stone-200 bg-white px-4 py-3 transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-stone-700 dark:bg-stone-900"
                >
                  {meal.imageUrl ? (
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-stone-100 dark:bg-stone-800">
                      <Image
                        src={meal.imageUrl}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-lg dark:bg-stone-800">
                      <span className="text-stone-300 dark:text-stone-600">
                        &#127858;
                      </span>
                    </div>
                  )}
                  <span className="text-sm font-medium text-stone-700 group-hover:text-amber-700 dark:text-stone-300 dark:group-hover:text-amber-400">
                    {meal.name}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-stone-400">
              Not used in any meals yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
