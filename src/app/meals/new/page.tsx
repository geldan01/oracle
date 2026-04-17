import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MealForm from "../meal-form";

export default async function NewMealPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [allTags, allIngredients] = await Promise.all([
    prisma.mealTag.findMany({ orderBy: { name: "asc" } }),
    prisma.mealIngredient.findMany({
      select: { name: true },
      distinct: ["name"],
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <Link
        href="/meals"
        className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400 transition-colors hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-300"
      >
        ← Meals
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
        New meal
      </h1>

      <div className="mt-10">
        <MealForm
          allTags={allTags.map((t) => t.name)}
          allIngredientNames={allIngredients.map((i) => i.name)}
        />
      </div>
    </div>
  );
}
