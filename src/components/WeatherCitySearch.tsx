"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import { searchCitiesAction, addWeatherCity } from "@/lib/weather-actions";
import type { GeocodingResult } from "@/lib/weather";

export default function WeatherCitySearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isSearching, startSearch] = useTransition();
  const [isAdding, startAdd] = useTransition();
  const [addingId, setAddingId] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const doSearch = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      startSearch(async () => {
        const cities = await searchCitiesAction(value);
        setResults(cities);
      });
    }, 300);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);
    doSearch(value);
  }

  function handleAdd(city: GeocodingResult) {
    setAddingId(city.id);
    startAdd(async () => {
      await addWeatherCity({
        name: city.name,
        country: city.country,
        latitude: city.latitude,
        longitude: city.longitude,
        timezone: city.timezone,
      });
      setAddingId(null);
      setQuery("");
      setResults([]);
    });
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Search for a city…"
          className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-400 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:placeholder-stone-500"
        />
        {isSearching && (
          <div className="absolute right-3 top-2.5 text-xs text-stone-400">
            Searching…
          </div>
        )}
      </div>

      {results.length > 0 && (
        <ul className="overflow-hidden rounded-lg border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900">
          {results.map((city) => (
            <li
              key={city.id}
              className="flex items-center justify-between gap-3 border-b border-stone-100 px-3 py-2 last:border-b-0 dark:border-stone-800"
            >
              <div className="text-sm">
                <span className="font-medium text-stone-900 dark:text-stone-100">
                  {city.name}
                </span>
                {city.admin1 && (
                  <span className="text-stone-500 dark:text-stone-400">
                    , {city.admin1}
                  </span>
                )}
                <span className="text-stone-500 dark:text-stone-400">
                  {" "}
                  · {city.country}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleAdd(city)}
                disabled={isAdding && addingId === city.id}
                className="rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white transition-all hover:bg-emerald-700 active:scale-[0.96] disabled:opacity-50 dark:bg-emerald-500 dark:text-stone-900 dark:hover:bg-emerald-400"
              >
                {isAdding && addingId === city.id ? "Adding…" : "Add"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
