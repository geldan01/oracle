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
    where: activeTag ? { tags: { some: { name: activeTag } } } : undefined,
    include: {
      tags: { orderBy: { name: "asc" } },
      _count: { select: { usages: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <Link
        href="/meals"
        className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400 transition-colors hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-300"
      >
        ← Meals
      </Link>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500">
            {ingredients.length} ingredient{ingredients.length !== 1 ? "s" : ""}
            {activeTag ? ` · #${activeTag}` : ""}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
            Ingredients
          </h1>
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="mt-8 flex flex-wrap items-center gap-2 border-b border-stone-200 pb-4 dark:border-stone-800">
          <Link
            href="/ingredients"
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
              href={`/ingredients?tag=${encodeURIComponent(tag.name)}`}
              className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${
                activeTag === tag.name
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                  : "text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
              }`}
            >
              #{tag.name}
              <span className="ml-1 text-stone-400 tabular-nums dark:text-stone-500">
                {tag._count.ingredients}
              </span>
            </Link>
          ))}
        </div>
      )}

      {ingredients.length > 0 ? (
        <ul className="mt-8 grid grid-cols-1 divide-y divide-stone-100 sm:grid-cols-2 sm:divide-y-0 sm:gap-x-8 lg:grid-cols-3 dark:divide-stone-800">
          {ingredients.map((ing) => (
            <li
              key={ing.id}
              className="border-b border-stone-100 sm:border-b dark:border-stone-800"
            >
              <Link
                href={`/ingredients/${ing.id}`}
                className="flex items-center justify-between gap-3 py-3 transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-stone-900 dark:text-stone-100">
                    {ing.name}
                  </p>
                  {ing.tags.length > 0 && (
                    <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
                      {ing.tags.map((t) => `#${t.name}`).join(" ")}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-stone-400 tabular-nums dark:text-stone-500">
                  {ing._count.usages}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-12 text-sm text-stone-400 dark:text-stone-500">
          No ingredients yet — they appear here as you create meals.
        </p>
      )}
    </div>
  );
}
