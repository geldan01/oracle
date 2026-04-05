"use client";

import { useState, useTransition } from "react";
import { updateIngredientTags } from "@/lib/meal-actions";

const GROCERY_SECTIONS = [
  "produce",
  "meat",
  "poultry",
  "seafood",
  "dairy",
  "bakery",
  "frozen",
  "canned goods",
  "condiments",
  "spices",
  "grains",
  "pasta",
  "snacks",
  "beverages",
  "deli",
  "oils",
];

interface IngredientTagsProps {
  ingredientId: string;
  currentTags: string[];
  allExistingTags: string[];
}

export default function IngredientTags({
  ingredientId,
  currentTags,
  allExistingTags,
}: IngredientTagsProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>(currentTags);
  const [customTag, setCustomTag] = useState("");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const allOptions = Array.from(
    new Set([...GROCERY_SECTIONS, ...allExistingTags, ...selectedTags])
  ).sort();

  function toggleTag(tag: string) {
    setSaved(false);
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function addCustomTag() {
    const tag = customTag.trim().toLowerCase();
    if (tag && !selectedTags.includes(tag)) {
      setSaved(false);
      setSelectedTags((prev) => [...prev, tag]);
    }
    setCustomTag("");
  }

  function handleSave() {
    startTransition(async () => {
      await updateIngredientTags(ingredientId, selectedTags);
      setSaved(true);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {allOptions.map((tag) => (
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

      <div className="flex gap-2">
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
          placeholder="Custom section..."
        />
        <button
          type="button"
          onClick={addCustomTag}
          className="rounded-lg bg-stone-200 px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-300 dark:bg-stone-700 dark:text-stone-300 dark:hover:bg-stone-600"
        >
          Add
        </button>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="rounded-lg bg-amber-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
      >
        {isPending ? "Saving..." : saved ? "Saved!" : "Save Tags"}
      </button>
    </div>
  );
}
