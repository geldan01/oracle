"use client";

import { useState, useTransition } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { markSeasonWatched } from "@/lib/tv-actions";
import EpisodeRow from "./episode-row";

interface SeasonSectionProps {
  showId: string;
  season: {
    id: string;
    seasonNumber: number;
    name: string | null;
    episodeCount: number;
    episodes: {
      id: string;
      episodeNumber: number;
      name: string | null;
      airDate: Date | null;
      tmdbRating: number | null;
      watched: boolean;
    }[];
  };
  defaultOpen?: boolean;
  readOnly?: boolean;
}

export default function SeasonSection({
  showId,
  season,
  defaultOpen = false,
  readOnly = false,
}: SeasonSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [isPending, startTransition] = useTransition();

  const watchedCount = season.episodes.filter((e) => e.watched).length;
  const totalCount = season.episodes.length;
  const allWatched = totalCount > 0 && watchedCount === totalCount;

  function handleMarkAll() {
    startTransition(async () => {
      await markSeasonWatched(season.id);
    });
  }

  return (
    <div className="border-b border-stone-200 last:border-b-0 dark:border-stone-800">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-3 text-left transition-colors hover:bg-stone-50 dark:hover:bg-stone-900"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-stone-900 dark:text-stone-100">
            {season.name ?? `Season ${season.seasonNumber}`}
          </span>
          <span className="text-xs text-stone-400 tabular-nums dark:text-stone-500">
            {watchedCount}/{totalCount}
          </span>
        </div>
        <CaretDown
          size={14}
          weight="regular"
          className={`text-stone-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="pb-3">
          {!readOnly && !allWatched && (
            <div className="flex justify-end pb-2">
              <button
                type="button"
                onClick={handleMarkAll}
                disabled={isPending}
                className="text-xs text-emerald-600 transition-colors hover:text-emerald-700 active:scale-[0.98] disabled:opacity-50 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                {isPending ? "Marking…" : "Mark all watched"}
              </button>
            </div>
          )}
          {season.episodes.map((ep) => (
            <EpisodeRow
              key={ep.id}
              showId={showId}
              seasonNumber={season.seasonNumber}
              episode={ep}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}
    </div>
  );
}
