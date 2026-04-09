"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
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
    <div className="relative overflow-hidden rounded-2xl border border-stone-700/60 bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 p-6 shadow-lg dark:border-stone-600/40">
      {/* Chalk dust texture overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(255,255,255,0.03)_0%,_transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(255,255,255,0.02)_0%,_transparent_50%)]" />

      {/* Header */}
      <Link href="/meals" className="flex items-center gap-3 border-b border-stone-600/40 pb-4 transition-colors hover:opacity-80">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/20 text-2xl ring-1 ring-amber-500/30">
          <span role="img" aria-label="Meals">&#127858;</span>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-amber-100">
            Meal Planner
          </h2>
          <p className="text-xs text-stone-400">Today&apos;s menu</p>
        </div>
      </Link>

      {/* Today's meals */}
      <div className="mt-4 min-h-[3rem] space-y-2">
        {todayEntries.length > 0 ? (
          todayEntries.map((entry) => (
            <div
              key={entry.id}
              className="group flex items-center justify-between rounded-lg bg-stone-700/40 px-3 py-2"
            >
              <span className="font-chalk text-sm text-stone-200">
                {entry.meal.name}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(entry.id)}
                disabled={isPending}
                className="text-stone-500 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                aria-label={`Remove ${entry.meal.name}`}
              >
                &times;
              </button>
            </div>
          ))
        ) : (
          <p className="py-2 text-center text-sm italic text-stone-500">
            No meals planned yet
          </p>
        )}
      </div>

      {/* Typeahead input */}
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
          placeholder="Add a meal..."
          className="w-full rounded-lg border border-stone-600/60 bg-stone-700/50 px-3 py-2 text-sm text-stone-200 placeholder-stone-500 outline-none transition-colors focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30"
        />

        {/* Suggestions dropdown */}
        {showSuggestions && (
          <div className="absolute top-full right-0 left-0 z-10 mt-1 overflow-hidden rounded-lg border border-stone-600/60 bg-stone-800 shadow-xl">
            {suggestions.map((meal) => (
              <button
                key={meal.id}
                type="button"
                onClick={() => handleSelectMeal(meal.id)}
                className="block w-full px-3 py-2 text-left text-sm text-stone-200 transition-colors hover:bg-stone-700"
              >
                {meal.name}
              </button>
            ))}
            {query.trim() && (
              <button
                type="button"
                onClick={handleAddNew}
                className="block w-full border-t border-stone-700 px-3 py-2 text-left text-sm text-amber-400 transition-colors hover:bg-stone-700"
              >
                + Add &quot;{query.trim()}&quot; as new meal
              </button>
            )}
          </div>
        )}
      </div>

      {/* Link to full page */}
      <Link
        href="/meals"
        className="mt-4 block text-xs font-medium text-stone-500 transition-colors hover:text-amber-400"
      >
        View all meals &rarr;
      </Link>
    </div>
  );
}
