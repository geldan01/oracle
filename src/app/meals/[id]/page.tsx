import { notFound, redirect } from "next/navigation";
import Link from "next/link";
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

  const userRating = meal.ratings.find(
    (r) => r.userId === session.user.id
  );
  const avgRating =
    meal.ratings.length > 0
      ? meal.ratings.reduce((sum, r) => sum + r.rating, 0) / meal.ratings.length
      : null;

  const deleteWithId = deleteMeal.bind(null, meal.id);

  return (
    <div className="flex min-h-full flex-1 items-start justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-3xl space-y-8">
        {/* Header */}
        <div>
          <Link
            href="/meals"
            className="text-sm text-stone-500 transition-colors hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
          >
            &larr; Meals
          </Link>

          <div className="mt-3 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
                {meal.name}
              </h1>

              {/* Average rating */}
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
                  <span className="ml-1 text-sm text-stone-400">
                    {avgRating.toFixed(1)} ({meal.ratings.length}{" "}
                    {meal.ratings.length === 1 ? "rating" : "ratings"})
                  </span>
                </div>
              )}

              {/* Tags */}
              {meal.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {meal.tags.map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/meals?tag=${encodeURIComponent(tag.name)}`}
                      className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600 transition-colors hover:bg-amber-100 hover:text-amber-700 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-amber-900/30 dark:hover:text-amber-300"
                    >
                      {tag.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Link
                href={`/meals/${meal.id}/edit`}
                className="rounded-lg bg-stone-200 px-3 py-1.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-300 dark:bg-stone-700 dark:text-stone-300 dark:hover:bg-stone-600"
              >
                Edit
              </Link>
              <form action={deleteWithId}>
                <button
                  type="submit"
                  className="rounded-lg bg-red-100 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                >
                  Delete
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Image */}
        <ImageUpload mealId={meal.id} currentImage={meal.imageUrl} />

        {/* Your rating */}
        <div>
          <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300">
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
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300">
                Ingredients
              </h2>
              <Link
                href="/ingredients"
                className="text-xs text-stone-400 transition-colors hover:text-amber-600 dark:hover:text-amber-400"
              >
                All ingredients &rarr;
              </Link>
            </div>
            <ul className="mt-3 space-y-1.5">
              {meal.ingredients.map((ing) => (
                <li
                  key={ing.id}
                  className="flex items-baseline gap-2 text-sm text-stone-600 dark:text-stone-300"
                >
                  <span className="text-amber-500">&#8226;</span>
                  <span>
                    {ing.quantity && (
                      <span className="font-medium">{ing.quantity} </span>
                    )}
                    {ing.ingredientId ? (
                      <Link
                        href={`/ingredients/${ing.ingredientId}`}
                        className="underline decoration-stone-300 underline-offset-2 transition-colors hover:text-amber-700 hover:decoration-amber-400 dark:decoration-stone-600 dark:hover:text-amber-400"
                      >
                        {ing.name}
                      </Link>
                    ) : (
                      ing.name
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recipe */}
        {meal.recipe && (
          <div>
            <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300">
              Recipe
            </h2>
            <div className="mt-3 whitespace-pre-wrap rounded-xl bg-stone-50 p-4 text-sm text-stone-700 leading-relaxed dark:bg-stone-800/50 dark:text-stone-300">
              {meal.recipe}
            </div>
          </div>
        )}

        {/* Metadata */}
        <p className="text-xs text-stone-400">
          Added by {meal.createdBy.name ?? meal.createdBy.email} &middot;{" "}
          {meal.createdAt.toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
