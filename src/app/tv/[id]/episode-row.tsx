"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Check } from "@phosphor-icons/react";
import { toggleWatchedEpisode } from "@/lib/tv-actions";

interface EpisodeRowProps {
  showId: string;
  seasonNumber: number;
  episode: {
    id: string;
    episodeNumber: number;
    name: string | null;
    airDate: Date | null;
    tmdbRating: number | null;
    watched: boolean;
  };
  readOnly?: boolean;
}

export default function EpisodeRow({
  showId,
  seasonNumber,
  episode,
  readOnly = false,
}: EpisodeRowProps) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      await toggleWatchedEpisode(episode.id);
    });
  }

  const aired = episode.airDate && episode.airDate <= new Date();

  return (
    <div className="flex items-center gap-3 py-2">
      {readOnly ? (
        <div
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
            episode.watched
              ? "border-stone-400 bg-stone-400 dark:border-stone-500 dark:bg-stone-500"
              : "border-stone-300 dark:border-stone-700"
          }`}
        >
          {episode.watched && <Check size={10} weight="bold" className="text-white" />}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleToggle}
          disabled={isPending}
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all active:scale-90 disabled:opacity-50 ${
            episode.watched
              ? "border-emerald-500 bg-emerald-500 dark:border-emerald-400 dark:bg-emerald-400"
              : "border-stone-300 hover:border-emerald-400 dark:border-stone-600 dark:hover:border-emerald-400"
          }`}
          aria-label={episode.watched ? "Mark unwatched" : "Mark watched"}
        >
          {episode.watched && <Check size={10} weight="bold" className="text-white dark:text-stone-900" />}
        </button>
      )}
      <Link
        href={`/tv/${showId}/season/${seasonNumber}/episode/${episode.episodeNumber}`}
        className="flex min-w-0 flex-1 items-center gap-3 transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
      >
        <span className="w-7 shrink-0 text-xs text-stone-400 tabular-nums dark:text-stone-500">
          E{episode.episodeNumber}
        </span>
        <span
          className={`truncate text-sm ${
            episode.watched
              ? "text-stone-400 line-through dark:text-stone-500"
              : "text-stone-900 dark:text-stone-100"
          }`}
        >
          {episode.name ?? `Episode ${episode.episodeNumber}`}
        </span>
      </Link>
      <div className="flex items-center gap-3 text-xs text-stone-400 dark:text-stone-500">
        {episode.tmdbRating != null && episode.tmdbRating > 0 && (
          <span className="tabular-nums">{episode.tmdbRating.toFixed(1)}</span>
        )}
        {episode.airDate ? (
          <span
            className={
              !aired ? "font-medium text-emerald-600 dark:text-emerald-400" : ""
            }
          >
            {episode.airDate.toLocaleDateString()}
          </span>
        ) : (
          <span>TBA</span>
        )}
      </div>
    </div>
  );
}
