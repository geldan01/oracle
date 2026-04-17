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
    new Set([...GROCERY_SECTIONS, ...allExistingTags, ...selectedTags]),
  ).sort();

  function toggleTag(tag: string) {
    setSaved(false);
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
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
        {allOptions.map((tag) => {
          const active = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`rounded-full px-2.5 py-0.5 text-xs transition-all active:scale-[0.96] ${
                active
                  ? "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-stone-900"
                  : "text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
              }`}
            >
              {active ? "" : "+"}#{tag}
            </button>
          );
        })}
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
          className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
          placeholder="Custom section…"
        />
        <button
          type="button"
          onClick={addCustomTag}
          className="rounded-lg px-3 py-1.5 text-sm text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 active:scale-[0.98] dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
        >
          Add
        </button>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 dark:bg-emerald-500 dark:text-stone-900 dark:hover:bg-emerald-400"
      >
        {isPending ? "Saving…" : saved ? "Saved" : "Save sections"}
      </button>
    </div>
  );
}
