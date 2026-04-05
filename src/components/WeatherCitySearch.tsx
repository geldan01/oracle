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

  const doSearch = useCallback(
    (value: string) => {
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
    },
    [],
  );

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
          placeholder="Search for a city..."
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
        />
        {isSearching && (
          <div className="absolute right-3 top-2.5 text-xs text-zinc-400">
            Searching...
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="rounded-md border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
          {results.map((city) => (
            <div
              key={city.id}
              className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 last:border-b-0 dark:border-zinc-700"
            >
              <div>
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {city.name}
                </span>
                {city.admin1 && (
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    , {city.admin1}
                  </span>
                )}
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  {" "}
                  &mdash; {city.country}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleAdd(city)}
                disabled={isAdding && addingId === city.id}
                className="rounded-md bg-sky-600 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-sky-500 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
              >
                {isAdding && addingId === city.id ? "Adding..." : "Add"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
