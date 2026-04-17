import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Star } from "@phosphor-icons/react/dist/ssr";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteMeal } from "@/lib/meal-actions";
import StarRating from "./star-rating";
import ImageUpload from "./image-upload";

interface MealDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function MealDetailPage({ params }: MealDetailPageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  const meal = await prisma.meal.findUnique({
    where: { id },
    include: {
      tags: { orderBy: { name: "asc" } },
      ratings: true,
      ingredients: { orderBy: { position: "asc" } },
      createdBy: { select: { name: true, email: true } },
    },
  });

  if (!meal) notFound();

  const userRating = meal.ratings.find((r) => r.userId === session.user.id);
  const avgRating =
    meal.ratings.length > 0
      ? meal.ratings.reduce((sum, r) => sum + r.rating, 0) / meal.ratings.length
      : null;

  const deleteWithId = deleteMeal.bind(null, meal.id);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <Link
        href="/meals"
        className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400 transition-colors hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-300"
      >
        ← Meals
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
            {meal.name}
          </h1>

          {avgRating !== null && (
            <div className="mt-2 flex items-center gap-2">
              <span className="flex items-center gap-0.5 text-amber-500 dark:text-amber-400">
                {Array.from({ length: Math.round(avgRating) }).map((_, i) => (
                  <Star key={i} size={12} weight="fill" />
                ))}
                {Array.from({ length: 5 - Math.round(avgRating) }).map(
                  (_, i) => (
                    <Star
                      key={`o-${i}`}
                      size={12}
                      weight="regular"
                      className="text-stone-300 dark:text-stone-600"
                    />
                  ),
                )}
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400">
                {avgRating.toFixed(1)} · {meal.ratings.length}{" "}
                {meal.ratings.length === 1 ? "rating" : "ratings"}
              </span>
            </div>
          )}

          {meal.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {meal.tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/meals?tag=${encodeURIComponent(tag.name)}`}
                  className="text-xs text-stone-500 transition-colors hover:text-emerald-600 dark:text-stone-400 dark:hover:text-emerald-400"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex shrink-0 gap-1">
          <Link
            href={`/meals/${meal.id}/edit`}
            className="rounded-full px-3 py-1.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 active:scale-[0.98] dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
          >
            Edit
          </Link>
          <form action={deleteWithId}>
            <button
              type="submit"
              className="rounded-full px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 active:scale-[0.98] dark:text-red-400 dark:hover:bg-red-900/20"
            >
              Delete
            </button>
          </form>
        </div>
      </div>

      {/* Image */}
      <div className="mt-8">
        <ImageUpload mealId={meal.id} currentImage={meal.imageUrl} />
      </div>

      {/* Your rating */}
      <div className="mt-8">
        <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
          Your Rating
        </h2>
        <div className="mt-2">
          <StarRating
            mealId={meal.id}
            currentRating={userRating?.rating ?? null}
          />
        </div>
      </div>

      {/* Ingredients */}
      {meal.ingredients.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
              Ingredients
            </h2>
            <Link
              href="/ingredients"
              className="text-xs text-stone-400 transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              All ingredients →
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-stone-100 dark:divide-stone-800">
            {meal.ingredients.map((ing) => (
              <li
                key={ing.id}
                className="flex items-baseline gap-3 py-2 text-sm text-stone-700 dark:text-stone-300"
              >
                {ing.quantity && (
                  <span className="min-w-12 shrink-0 font-mono text-xs text-stone-500 dark:text-stone-400">
                    {ing.quantity}
                  </span>
                )}
                {ing.ingredientId ? (
                  <Link
                    href={`/ingredients/${ing.ingredientId}`}
                    className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
                  >
                    {ing.name}
                  </Link>
                ) : (
                  <span>{ing.name}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recipe */}
      {meal.recipe && (
        <div className="mt-8">
          <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
            Recipe
          </h2>
          <div className="mt-3 max-w-[65ch] whitespace-pre-wrap text-sm leading-relaxed text-stone-700 dark:text-stone-300">
            {meal.recipe}
          </div>
        </div>
      )}

      {/* Metadata */}
      <p className="mt-12 border-t border-stone-200 pt-4 text-xs text-stone-400 dark:border-stone-800 dark:text-stone-500">
        Added by {meal.createdBy.name ?? meal.createdBy.email} ·{" "}
        {meal.createdAt.toLocaleDateString()}
      </p>
    </div>
  );
}
