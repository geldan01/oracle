import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface IngredientsPageProps {
  searchParams: Promise<{ tag?: string }>;
}

export default async function IngredientsPage({
  searchParams,
}: IngredientsPageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const params = await searchParams;
  const activeTag = params.tag ?? null;

  const allTags = await prisma.ingredientTag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { ingredients: true } } },
  });

  const ingredients = await prisma.ingredient.findMany({
    where: activeTag
      ? { tags: { some: { name: activeTag } } }
      : undefined,
    include: {
      tags: { orderBy: { name: "asc" } },
      _count: { select: { usages: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex min-h-full flex-1 items-start justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-3xl space-y-8">
        {/* Header */}
        <div className="border-b border-amber-200/60 pb-6 dark:border-amber-900/30">
          <Link
            href="/meals"
            className="text-sm text-stone-500 transition-colors hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
          >
            &larr; Meals
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-stone-800 dark:text-stone-100">
            Ingredients
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {ingredients.length} ingredient{ingredients.length !== 1 ? "s" : ""}
            {activeTag ? ` tagged "${activeTag}"` : ""}
          </p>
        </div>

        {/* Tag filters */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Link
              href="/ingredients"
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
                href={`/ingredients?tag=${encodeURIComponent(tag.name)}`}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  activeTag === tag.name
                    ? "bg-amber-600 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
                }`}
              >
                {tag.name} ({tag._count.ingredients})
              </Link>
            ))}
          </div>
        )}

        {/* Ingredient list */}
        {ingredients.length > 0 ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {ingredients.map((ing) => (
              <Link
                key={ing.id}
                href={`/ingredients/${ing.id}`}
                className="group flex items-center justify-between rounded-lg border border-stone-200 bg-white px-4 py-3 transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-stone-700 dark:bg-stone-900"
              >
                <div className="min-w-0">
                  <span className="block text-sm font-medium text-stone-700 group-hover:text-amber-700 dark:text-stone-300 dark:group-hover:text-amber-400">
                    {ing.name}
                  </span>
                  {ing.tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {ing.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-500 dark:bg-stone-800 dark:text-stone-400"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="ml-2 shrink-0 text-xs text-stone-400">
                  {ing._count.usages} {ing._count.usages === 1 ? "meal" : "meals"}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-300 py-16 dark:border-stone-700">
            <p className="text-lg text-stone-400 dark:text-stone-500">
              No ingredients yet
            </p>
            <p className="mt-1 text-sm text-stone-300 dark:text-stone-600">
              Ingredients are added when you create meals
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
