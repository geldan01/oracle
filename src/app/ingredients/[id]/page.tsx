import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ForkKnife } from "@phosphor-icons/react/dist/ssr";
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
          meal: { select: { id: true, name: true, imageUrl: true } },
        },
        orderBy: { meal: { name: "asc" } },
      },
    },
  });

  if (!ingredient) notFound();

  const allTags = await prisma.ingredientTag.findMany({
    orderBy: { name: "asc" },
  });

  const uniqueMeals = Array.from(
    new Map(ingredient.usages.map((u) => [u.meal.id, u.meal])).values(),
  );

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <Link
        href="/ingredients"
        className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400 transition-colors hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-300"
      >
        ← Ingredients
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
        {ingredient.name}
      </h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        Used in {uniqueMeals.length}{" "}
        {uniqueMeals.length === 1 ? "meal" : "meals"}
      </p>

      <div className="mt-10">
        <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
          Grocery section
        </h2>
        <div className="mt-3">
          <IngredientTags
            ingredientId={ingredient.id}
            currentTags={ingredient.tags.map((t) => t.name)}
            allExistingTags={allTags.map((t) => t.name)}
          />
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
          Meals
        </h2>
        {uniqueMeals.length > 0 ? (
          <ul className="mt-3 divide-y divide-stone-100 dark:divide-stone-800">
            {uniqueMeals.map((meal) => (
              <li key={meal.id}>
                <Link
                  href={`/meals/${meal.id}`}
                  className="flex items-center gap-3 py-2.5 transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
                >
                  {meal.imageUrl ? (
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded bg-stone-100 dark:bg-stone-800">
                      <Image
                        src={meal.imageUrl}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-stone-100 dark:bg-stone-800">
                      <ForkKnife size={14} className="text-stone-400" />
                    </div>
                  )}
                  <span className="text-sm text-stone-900 dark:text-stone-100">
                    {meal.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-stone-400 dark:text-stone-500">
            Not used in any meals yet.
          </p>
        )}
      </div>
    </div>
  );
}
