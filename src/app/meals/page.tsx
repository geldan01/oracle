import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface MealsPageProps {
  searchParams: Promise<{ tag?: string }>;
}

export default async function MealsPage({ searchParams }: MealsPageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const params = await searchParams;
  const activeTag = params.tag ?? null;

  const allTags = await prisma.mealTag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { meals: true } } },
  });

  const meals = await prisma.meal.findMany({
    where: activeTag
      ? { tags: { some: { name: activeTag } } }
      : undefined,
    include: {
      tags: true,
      ratings: true,
      _count: { select: { ingredients: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex min-h-full flex-1 items-start justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-200/60 pb-6 dark:border-amber-900/30">
          <div>
            <Link
              href="/dashboard"
              className="text-sm text-stone-500 transition-colors hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
            >
              &larr; Dashboard
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-stone-800 dark:text-stone-100">
              Meals
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {meals.length} {meals.length === 1 ? "meal" : "meals"}
              {activeTag ? ` tagged "${activeTag}"` : ""}
            </p>
          </div>
          <Link
            href="/meals/new"
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-amber-700"
          >
            + New Meal
          </Link>
        </div>

        {/* Tag filters */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Link
              href="/meals"
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                !activeTag
                  ? "bg-amber-600 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
              }`}
            >
              All
            </Link>
            {allTags.map((tag) => (
              <Link
                key={tag.id}
                href={`/meals?tag=${encodeURIComponent(tag.name)}`}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  activeTag === tag.name
                    ? "bg-amber-600 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
                }`}
              >
                {tag.name} ({tag._count.meals})
              </Link>
            ))}
          </div>
        )}

        {/* Meal grid */}
        {meals.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {meals.map((meal) => {
              const avgRating =
                meal.ratings.length > 0
                  ? meal.ratings.reduce((sum, r) => sum + r.rating, 0) /
                    meal.ratings.length
                  : null;

              return (
                <Link
                  key={meal.id}
                  href={`/meals/${meal.id}`}
                  className="group overflow-hidden rounded-xl border border-stone-200/80 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-stone-700/60 dark:bg-stone-900"
                >
                  {/* Image */}
                  {meal.imageUrl ? (
                    <div className="relative aspect-video w-full overflow-hidden bg-stone-100 dark:bg-stone-800">
                      <Image
                        src={meal.imageUrl}
                        alt={meal.name}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-video w-full items-center justify-center bg-stone-100 text-4xl dark:bg-stone-800">
                      <span className="text-stone-300 dark:text-stone-600">
                        &#127858;
                      </span>
                    </div>
                  )}

                  <div className="p-4">
                    <h3 className="font-semibold text-stone-800 dark:text-stone-100">
                      {meal.name}
                    </h3>

                    {/* Rating */}
                    {avgRating !== null && (
                      <div className="mt-1 flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-sm ${
                              star <= Math.round(avgRating)
                                ? "text-amber-400"
                                : "text-stone-300 dark:text-stone-600"
                            }`}
                          >
                            &#9733;
                          </span>
                        ))}
                        <span className="ml-1 text-xs text-stone-400">
                          ({meal.ratings.length})
                        </span>
                      </div>
                    )}

                    {/* Tags */}
                    {meal.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {meal.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500 dark:bg-stone-800 dark:text-stone-400"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Ingredients count */}
                    {meal._count.ingredients > 0 && (
                      <p className="mt-2 text-xs text-stone-400">
                        {meal._count.ingredients} ingredient
                        {meal._count.ingredients !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-300 py-16 dark:border-stone-700">
            <p className="text-lg text-stone-400 dark:text-stone-500">
              No meals yet
            </p>
            <p className="mt-1 text-sm text-stone-300 dark:text-stone-600">
              Add your first meal to get started
            </p>
            <Link
              href="/meals/new"
              className="mt-4 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-amber-700"
            >
              + New Meal
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
