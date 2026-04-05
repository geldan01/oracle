"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

async function ensureIngredient(name: string): Promise<string> {
  const normalized = name.trim();
  const existing = await prisma.ingredient.findUnique({
    where: { name: normalized },
  });
  if (existing) return existing.id;

  const created = await prisma.ingredient.create({
    data: { name: normalized },
  });
  return created.id;
}

// ── Meals ──

export async function createMeal(formData: FormData) {
  const user = await requireAuth();
  const name = formData.get("name") as string | null;
  const recipe = formData.get("recipe") as string | null;
  const tagNames = formData.getAll("tags") as string[];
  const ingredientNames = formData.getAll("ingredientName") as string[];
  const ingredientQuantities = formData.getAll("ingredientQuantity") as string[];

  if (!name?.trim()) {
    throw new Error("Meal name is required");
  }

  // Ensure Ingredient records exist for each ingredient name
  const validIngredients = ingredientNames
    .map((n, i) => ({
      name: n.trim(),
      quantity: ingredientQuantities[i]?.trim() || null,
      position: i,
    }))
    .filter((ing) => ing.name);

  const ingredientIds = await Promise.all(
    validIngredients.map((ing) => ensureIngredient(ing.name))
  );

  const meal = await prisma.meal.create({
    data: {
      name: name.trim(),
      recipe: recipe?.trim() || null,
      createdById: user.id,
      tags: {
        connectOrCreate: tagNames
          .filter((t) => t.trim())
          .map((t) => ({
            where: { name: t.trim().toLowerCase() },
            create: { name: t.trim().toLowerCase() },
          })),
      },
      ingredients: {
        create: validIngredients.map((ing, i) => ({
          name: ing.name,
          quantity: ing.quantity,
          position: ing.position,
          ingredientId: ingredientIds[i],
        })),
      },
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/meals");
  revalidatePath("/ingredients");
  redirect(`/meals/${meal.id}`);
}

export async function updateMeal(mealId: string, formData: FormData) {
  await requireAuth();
  const name = formData.get("name") as string | null;
  const recipe = formData.get("recipe") as string | null;
  const tagNames = formData.getAll("tags") as string[];
  const ingredientNames = formData.getAll("ingredientName") as string[];
  const ingredientQuantities = formData.getAll("ingredientQuantity") as string[];

  if (!name?.trim()) {
    throw new Error("Meal name is required");
  }

  // Replace tags
  await prisma.meal.update({
    where: { id: mealId },
    data: {
      name: name.trim(),
      recipe: recipe?.trim() || null,
      tags: {
        set: [],
        connectOrCreate: tagNames
          .filter((t) => t.trim())
          .map((t) => ({
            where: { name: t.trim().toLowerCase() },
            create: { name: t.trim().toLowerCase() },
          })),
      },
    },
  });

  // Replace ingredients
  await prisma.mealIngredient.deleteMany({ where: { mealId } });
  const ingredients = ingredientNames
    .map((n, i) => ({
      name: n.trim(),
      quantity: ingredientQuantities[i]?.trim() || null,
      position: i,
      mealId,
    }))
    .filter((ing) => ing.name);

  if (ingredients.length > 0) {
    const ingredientIds = await Promise.all(
      ingredients.map((ing) => ensureIngredient(ing.name))
    );
    await prisma.mealIngredient.createMany({
      data: ingredients.map((ing, i) => ({
        ...ing,
        ingredientId: ingredientIds[i],
      })),
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/meals");
  revalidatePath("/ingredients");
  revalidatePath(`/meals/${mealId}`);
  redirect(`/meals/${mealId}`);
}

export async function deleteMeal(mealId: string) {
  await requireAuth();

  const meal = await prisma.meal.findUnique({
    where: { id: mealId },
    select: { imageUrl: true },
  });

  if (meal?.imageUrl) {
    const filePath = path.join(process.cwd(), "public", meal.imageUrl);
    try {
      await unlink(filePath);
    } catch {
      // File may already be gone
    }
  }

  await prisma.meal.delete({ where: { id: mealId } });

  revalidatePath("/dashboard");
  revalidatePath("/meals");
  redirect("/meals");
}

// ── Ratings ──

export async function rateMeal(mealId: string, rating: number) {
  const user = await requireAuth();

  if (rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  await prisma.mealRating.upsert({
    where: { mealId_userId: { mealId, userId: user.id } },
    update: { rating },
    create: { mealId, userId: user.id, rating },
  });

  revalidatePath(`/meals/${mealId}`);
  revalidatePath("/meals");
}

// ── Image upload ──

export async function uploadMealImage(mealId: string, formData: FormData) {
  await requireAuth();

  const file = formData.get("image") as File | null;
  if (!file || file.size === 0) {
    throw new Error("No image provided");
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Invalid image type. Use JPEG, PNG, WebP, or GIF.");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Image must be under 5MB");
  }

  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${mealId}-${Date.now()}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "meals");
  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  // Remove old image if exists
  const existing = await prisma.meal.findUnique({
    where: { id: mealId },
    select: { imageUrl: true },
  });
  if (existing?.imageUrl) {
    const oldPath = path.join(process.cwd(), "public", existing.imageUrl);
    try {
      await unlink(oldPath);
    } catch {
      // ignore
    }
  }

  await prisma.meal.update({
    where: { id: mealId },
    data: { imageUrl: `/uploads/meals/${filename}` },
  });

  revalidatePath(`/meals/${mealId}`);
  revalidatePath("/meals");
}

// ── Meal Plan (dashboard widget) ──

export async function addMealToPlan(date: string, mealId: string) {
  const user = await requireAuth();

  await prisma.mealPlanEntry.upsert({
    where: { date_mealId: { date: new Date(date), mealId } },
    update: {},
    create: {
      date: new Date(date),
      mealId,
      addedById: user.id,
    },
  });

  revalidatePath("/dashboard");
}

export async function removeMealFromPlan(entryId: string) {
  await requireAuth();

  await prisma.mealPlanEntry.delete({ where: { id: entryId } });

  revalidatePath("/dashboard");
}

export async function searchMeals(query: string) {
  await requireAuth();

  if (!query.trim()) return [];

  const meals = await prisma.meal.findMany({
    where: {
      name: { contains: query.trim(), mode: "insensitive" },
    },
    select: { id: true, name: true },
    take: 8,
    orderBy: { name: "asc" },
  });

  return meals;
}

export async function quickAddMeal(name: string) {
  const user = await requireAuth();

  if (!name.trim()) {
    throw new Error("Meal name is required");
  }

  const meal = await prisma.meal.create({
    data: {
      name: name.trim(),
      createdById: user.id,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/meals");
  return { id: meal.id, name: meal.name };
}

// ── Ingredients ──

export async function getAllIngredientNames(): Promise<string[]> {
  await requireAuth();

  const ingredients = await prisma.ingredient.findMany({
    select: { name: true },
    orderBy: { name: "asc" },
  });

  return ingredients.map((i) => i.name);
}

export async function updateIngredientTags(
  ingredientId: string,
  tagNames: string[]
) {
  await requireAuth();

  await prisma.ingredient.update({
    where: { id: ingredientId },
    data: {
      tags: {
        set: [],
        connectOrCreate: tagNames
          .filter((t) => t.trim())
          .map((t) => ({
            where: { name: t.trim().toLowerCase() },
            create: { name: t.trim().toLowerCase() },
          })),
      },
    },
  });

  revalidatePath("/ingredients");
  revalidatePath(`/ingredients/${ingredientId}`);
}
