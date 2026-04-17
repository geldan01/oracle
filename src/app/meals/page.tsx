import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ForkKnife, Plus, Star } from "@phosphor-icons/react/dist/ssr";
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
    where: activeTag ? { tags: { some: { name: activeTag } } } : undefined,
    include: {
      tags: true,
      ratings: true,
      _count: { select: { ingredients: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500">
            Library · {meals.length}
            {activeTag ? ` · #${activeTag}` : ""}
          </p>
          <h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
            <ForkKnife size={28} weight="duotone" className="text-rose-500 dark:text-rose-400" />
            Meals
          </h1>
        </div>
        <Link
          href="/meals/new"
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.98] dark:bg-emerald-500 dark:text-stone-900 dark:hover:bg-emerald-400"
        >
          <Plus size={14} weight="bold" />
          New
        </Link>
      </div>

      {/* Tag filters */}
      {allTags.length > 0 && (
        <div className="mt-8 flex flex-wrap items-center gap-2 border-b border-stone-200 pb-4 dark:border-stone-800">
          <Link
            href="/meals"
            className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${
              !activeTag
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                : "text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
            }`}
          >
            all
          </Link>
          {allTags.map((tag) => (
            <Link
              key={tag.id}
              href={`/meals?tag=${encodeURIComponent(tag.name)}`}
              className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${
                activeTag === tag.name
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                  : "text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
              }`}
            >
              #{tag.name}
              <span className="ml-1 text-stone-400 tabular-nums dark:text-stone-500">
                {tag._count.meals}
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* Meal grid */}
      {meals.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
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
                className="group block"
              >
                {meal.imageUrl ? (
                  <div className="relative aspect-4/3 w-full overflow-hidden rounded-lg bg-stone-100 dark:bg-stone-900">
                    <Image
                      src={meal.imageUrl}
                      alt={meal.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-[1.02]"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-4/3 w-full items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-900">
                    <ForkKnife size={28} className="text-stone-300 dark:text-stone-700" />
                  </div>
                )}

                <div className="mt-3">
                  <h3 className="text-sm font-medium text-stone-900 dark:text-stone-100">
                    {meal.name}
                  </h3>

                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500 dark:text-stone-400">
                    {avgRating !== null && (
                      <span className="flex items-center gap-0.5 text-amber-500 dark:text-amber-400">
                        {Array.from({ length: Math.round(avgRating) }).map(
                          (_, i) => (
                            <Star key={i} size={10} weight="fill" />
                          ),
                        )}
                      </span>
                    )}
                    {meal._count.ingredients > 0 && (
                      <span className="tabular-nums">
                        {meal._count.ingredients} ingredient
                        {meal._count.ingredients !== 1 ? "s" : ""}
                      </span>
                    )}
                    {meal.tags.slice(0, 2).map((tag) => (
                      <span key={tag.id}>#{tag.name}</span>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="mt-16 text-center">
          <p className="text-sm text-stone-400 dark:text-stone-500">
            No meals here yet.
          </p>
          <Link
            href="/meals/new"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.98] dark:bg-emerald-500 dark:text-stone-900 dark:hover:bg-emerald-400"
          >
            <Plus size={14} weight="bold" />
            Add your first
          </Link>
        </div>
      )}
    </div>
  );
}
