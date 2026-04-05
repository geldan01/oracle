"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createMeal, updateMeal } from "@/lib/meal-actions";

interface MealFormProps {
  meal?: {
    id: string;
    name: string;
    recipe: string | null;
    tags: { id: string; name: string }[];
    ingredients: { id: string; name: string; quantity: string | null; position: number }[];
  };
  allTags: string[];
  allIngredientNames: string[];
}

const COMMON_TAGS = [
  "chicken",
  "red meat",
  "pork",
  "fish",
  "vegetarian",
  "vegan",
  "soup",
  "salad",
  "pasta",
  "rice",
  "quick",
  "slow cooker",
  "bbq",
  "breakfast",
  "dessert",
];

export default function MealForm({ meal, allTags, allIngredientNames }: MealFormProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>(
    meal?.tags.map((t) => t.name) ?? []
  );
  const [customTag, setCustomTag] = useState("");
  const [ingredients, setIngredients] = useState<
    { name: string; quantity: string }[]
  >(
    meal?.ingredients.map((i) => ({
      name: i.name,
      quantity: i.quantity ?? "",
    })) ?? [{ name: "", quantity: "" }]
  );

  const allTagOptions = Array.from(
    new Set([...COMMON_TAGS, ...allTags, ...selectedTags])
  ).sort();

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function addCustomTag() {
    const tag = customTag.trim().toLowerCase();
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags((prev) => [...prev, tag]);
    }
    setCustomTag("");
  }

  const [activeIngSuggestion, setActiveIngSuggestion] = useState<number | null>(null);
  const ingredientNameRefs = useRef<(HTMLInputElement | null)[]>([]);
  const pendingFocusRef = useRef<number | null>(null);

  useEffect(() => {
    if (pendingFocusRef.current !== null) {
      ingredientNameRefs.current[pendingFocusRef.current]?.focus();
      pendingFocusRef.current = null;
    }
  }, [ingredients.length]);

  const addIngredient = useCallback(() => {
    pendingFocusRef.current = ingredients.length;
    setIngredients((prev) => [...prev, { name: "", quantity: "" }]);
  }, [ingredients.length]);

  function removeIngredient(index: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  function updateIngredient(
    index: number,
    field: "name" | "quantity",
    value: string
  ) {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing))
    );
  }

  const action = meal
    ? updateMeal.bind(null, meal.id)
    : createMeal;

  return (
    <form action={action} className="space-y-6">
      {/* Name */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-stone-700 dark:text-stone-300"
        >
          Meal Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          defaultValue={meal?.name ?? ""}
          required
          className="mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-800 shadow-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200"
          placeholder="e.g. Chicken Parmesan"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
          Tags
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {allTagOptions.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedTags.includes(tag)
                  ? "bg-amber-600 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-300 dark:hover:bg-stone-600"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomTag();
              }
            }}
            className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-800 outline-none focus:border-amber-500 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200"
            placeholder="Custom tag..."
          />
          <button
            type="button"
            onClick={addCustomTag}
            className="rounded-lg bg-stone-200 px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-300 dark:bg-stone-700 dark:text-stone-300 dark:hover:bg-stone-600"
          >
            Add
          </button>
        </div>
        {/* Hidden inputs to submit tags */}
        {selectedTags.map((tag) => (
          <input key={tag} type="hidden" name="tags" value={tag} />
        ))}
      </div>

      {/* Ingredients */}
      <div>
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
          Ingredients
        </label>
        <div className="mt-2 space-y-2">
          {ingredients.map((ing, i) => (
            <div key={i} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  ref={(el) => { ingredientNameRefs.current[i] = el; }}
                  type="text"
                  name="ingredientName"
                  value={ing.name}
                  onChange={(e) => {
                    updateIngredient(i, "name", e.target.value);
                    setActiveIngSuggestion(e.target.value.trim() ? i : null);
                  }}
                  onFocus={() => {
                    if (ing.name.trim()) setActiveIngSuggestion(i);
                  }}
                  onBlur={() => {
                    // Delay to allow click on suggestion
                    setTimeout(() => setActiveIngSuggestion((prev) => prev === i ? null : prev), 150);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setActiveIngSuggestion(null);
                      addIngredient();
                    }
                    if (e.key === "Escape") {
                      setActiveIngSuggestion(null);
                    }
                  }}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-800 outline-none focus:border-amber-500 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200"
                  placeholder="Ingredient name"
                  autoComplete="off"
                />
                {activeIngSuggestion === i && ing.name.trim() && (() => {
                  const filtered = allIngredientNames.filter(
                    (n) =>
                      n.toLowerCase().includes(ing.name.toLowerCase()) &&
                      n.toLowerCase() !== ing.name.toLowerCase()
                  );
                  if (filtered.length === 0) return null;
                  return (
                    <div className="absolute top-full right-0 left-0 z-10 mt-1 max-h-40 overflow-y-auto rounded-lg border border-stone-300 bg-white shadow-lg dark:border-stone-600 dark:bg-stone-800">
                      {filtered.slice(0, 8).map((name) => (
                        <button
                          key={name}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            updateIngredient(i, "name", name);
                            setActiveIngSuggestion(null);
                          }}
                          className="block w-full px-3 py-1.5 text-left text-sm text-stone-700 transition-colors hover:bg-amber-50 dark:text-stone-200 dark:hover:bg-stone-700"
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>
              <input
                type="text"
                name="ingredientQuantity"
                value={ing.quantity}
                onChange={(e) =>
                  updateIngredient(i, "quantity", e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addIngredient();
                  }
                }}
                className="w-28 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-800 outline-none focus:border-amber-500 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200"
                placeholder="Qty"
              />
              {ingredients.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeIngredient(i)}
                  className="px-2 text-stone-400 hover:text-red-500"
                >
                  &times;
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addIngredient}
          className="mt-2 text-sm text-amber-600 hover:text-amber-700 dark:text-amber-400"
        >
          + Add ingredient
        </button>
      </div>

      {/* Recipe */}
      <div>
        <label
          htmlFor="recipe"
          className="block text-sm font-medium text-stone-700 dark:text-stone-300"
        >
          Recipe
        </label>
        <textarea
          id="recipe"
          name="recipe"
          defaultValue={meal?.recipe ?? ""}
          rows={8}
          className="mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 shadow-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200"
          placeholder="Write the recipe steps here..."
        />
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button
          type="submit"
          className="rounded-lg bg-amber-600 px-6 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-amber-700"
        >
          {meal ? "Save Changes" : "Create Meal"}
        </button>
      </div>
    </form>
  );
}
