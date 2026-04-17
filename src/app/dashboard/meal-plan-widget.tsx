"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import { ForkKnife, X } from "@phosphor-icons/react";
import {
  addMealToPlan,
  removeMealFromPlan,
  searchMeals,
  quickAddMeal,
} from "@/lib/meal-actions";

interface PlanEntry {
  id: string;
  meal: { id: string; name: string };
}

interface MealPlanWidgetProps {
  todayEntries: PlanEntry[];
  todayDate: string;
}

export default function MealPlanWidget({
  todayEntries,
  todayDate,
}: MealPlanWidgetProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<
    { id: string; name: string }[]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleInputChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const results = await searchMeals(value);
      setSuggestions(results);
      setShowSuggestions(true);
    }, 200);
  }

  function handleSelectMeal(mealId: string) {
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    startTransition(async () => {
      await addMealToPlan(todayDate, mealId);
    });
  }

  function handleAddNew() {
    if (!query.trim()) return;
    const name = query.trim();
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    startTransition(async () => {
      const meal = await quickAddMeal(name);
      await addMealToPlan(todayDate, meal.id);
    });
  }

  function handleRemove(entryId: string) {
    startTransition(async () => {
      await removeMealFromPlan(entryId);
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0) {
        handleSelectMeal(suggestions[0].id);
      } else if (query.trim()) {
        handleAddNew();
      }
    }
  }

  return (
    <section>
      <Link
        href="/meals"
        className="group flex items-center gap-3 transition-opacity hover:opacity-70"
      >
        <ForkKnife size={20} weight="regular" className="text-rose-600 dark:text-rose-400" />
        <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
          Today&apos;s Meals
        </h2>
      </Link>

      <div className="mt-4 min-h-10 divide-y divide-stone-100 dark:divide-stone-800">
        {todayEntries.length > 0 ? (
          todayEntries.map((entry) => (
            <div
              key={entry.id}
              className="group flex items-center justify-between py-2"
            >
              <span className="text-sm text-stone-900 dark:text-stone-100">
                {entry.meal.name}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(entry.id)}
                disabled={isPending}
                className="text-stone-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                aria-label={`Remove ${entry.meal.name}`}
              >
                <X size={14} weight="bold" />
              </button>
            </div>
          ))
        ) : (
          <p className="py-2 text-sm text-stone-400 dark:text-stone-500">
            Nothing planned yet
          </p>
        )}
      </div>

      <div ref={wrapperRef} className="relative mt-3">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Add a meal…"
          className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-400 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:placeholder-stone-500"
        />

        {showSuggestions && (
          <div className="absolute top-full right-0 left-0 z-10 mt-1 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-lg dark:border-stone-700 dark:bg-stone-900">
            {suggestions.map((meal) => (
              <button
                key={meal.id}
                type="button"
                onClick={() => handleSelectMeal(meal.id)}
                className="block w-full px-3 py-2 text-left text-sm text-stone-900 transition-colors hover:bg-stone-50 dark:text-stone-100 dark:hover:bg-stone-800"
              >
                {meal.name}
              </button>
            ))}
            {query.trim() && (
              <button
                type="button"
                onClick={handleAddNew}
                className="block w-full border-t border-stone-200 px-3 py-2 text-left text-sm text-emerald-600 transition-colors hover:bg-stone-50 dark:border-stone-700 dark:text-emerald-400 dark:hover:bg-stone-800"
              >
                + Add &quot;{query.trim()}&quot; as new meal
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
