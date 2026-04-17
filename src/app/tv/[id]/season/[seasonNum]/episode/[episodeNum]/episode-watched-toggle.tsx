"use client";

import { useTransition } from "react";
import { toggleWatchedEpisode } from "@/lib/tv-actions";

interface EpisodeWatchedToggleProps {
  episodeId: string;
  watched: boolean;
}

export default function EpisodeWatchedToggle({ episodeId, watched }: EpisodeWatchedToggleProps) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      await toggleWatchedEpisode(episodeId);
    });
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className={`rounded-full px-4 py-2 text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-50 ${
        watched
          ? "bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
          : "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-stone-900 dark:hover:bg-emerald-400"
      }`}
    >
      {isPending ? "Updating…" : watched ? "Mark unwatched" : "Mark watched"}
    </button>
  );
}
