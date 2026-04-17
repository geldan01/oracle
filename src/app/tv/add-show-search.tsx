"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlass, Television } from "@phosphor-icons/react";
import { addShowFromTmdb, searchTmdbShows } from "@/lib/tv-actions";

interface SearchResult {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  first_air_date: string;
  vote_average: number;
  existingId: string | null;
}

export default function AddShowSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!value.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await searchTmdbShows(value);
        setResults(res);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 400);
  }

  async function handleClick(show: SearchResult) {
    if (show.existingId) {
      setQuery("");
      setResults([]);
      setOpen(false);
      router.push(`/tv/${show.existingId}`);
      return;
    }
    setAdding(show.id);
    try {
      await addShowFromTmdb(show.id);
      setQuery("");
      setResults([]);
      setOpen(false);
    } finally {
      setAdding(null);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MagnifyingGlass
          size={16}
          weight="regular"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Search TMDB to add a show…"
          className="w-full rounded-lg border border-stone-200 bg-white py-2.5 pl-9 pr-3 text-sm text-stone-900 placeholder-stone-400 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:placeholder-stone-500"
        />
        {loading && (
          <div className="absolute top-3 right-3 text-xs text-stone-400">
            Searching…
          </div>
        )}
      </div>
      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-80 w-full overflow-y-auto rounded-lg border border-stone-200 bg-white shadow-lg dark:border-stone-700 dark:bg-stone-900">
          {results.map((show) => (
            <li key={show.id}>
              <button
                type="button"
                disabled={adding === show.id}
                onClick={() => handleClick(show)}
                className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-stone-50 disabled:opacity-50 dark:hover:bg-stone-800"
              >
                {show.poster_path ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`https://image.tmdb.org/t/p/w92${show.poster_path}`}
                    alt=""
                    className="h-16 w-11 shrink-0 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-11 shrink-0 items-center justify-center rounded bg-stone-100 dark:bg-stone-800">
                    <Television size={14} className="text-stone-400" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-stone-900 dark:text-stone-100">
                    {show.name}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {show.first_air_date?.slice(0, 4) ?? "Unknown"} · TMDB{" "}
                    {show.vote_average.toFixed(1)}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-stone-400 dark:text-stone-500">
                    {show.overview}
                  </p>
                </div>
                <div className="ml-auto flex shrink-0 items-center">
                  {show.existingId ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      Already added ›
                    </span>
                  ) : adding === show.id ? (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400">
                      Adding…
                    </span>
                  ) : null}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
