"use client";

import { useTransition } from "react";
import {
  updateShowStatus,
  removeShow,
  refreshShowData,
  updateWatchMode,
} from "@/lib/tv-actions";
import { useRouter } from "next/navigation";
import { TvShowStatus, WatchMode } from "@/generated/prisma";

interface ShowActionsProps {
  showId: string;
  currentStatus: TvShowStatus;
  watchMode: WatchMode;
}

const statuses: { value: TvShowStatus; label: string }[] = [
  { value: "WATCHING", label: "Watching" },
  { value: "PAUSED", label: "Paused" },
  { value: "COMPLETED", label: "Completed" },
  { value: "DROPPED", label: "Dropped" },
  { value: "PLAN_TO_WATCH", label: "Plan to Watch" },
];

export default function ShowActions({
  showId,
  currentStatus,
  watchMode,
}: ShowActionsProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    startTransition(async () => {
      await updateShowStatus(showId, e.target.value as TvShowStatus);
    });
  }

  function handleWatchModeChange(mode: WatchMode) {
    startTransition(async () => {
      await updateWatchMode(showId, mode);
    });
  }

  function handleRefresh() {
    startTransition(async () => {
      await refreshShowData(showId);
    });
  }

  function handleRemove() {
    if (!confirm("Remove this show and all its data?")) return;
    startTransition(async () => {
      await removeShow(showId);
      router.push("/tv");
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={currentStatus}
        onChange={handleStatusChange}
        disabled={isPending}
        className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 disabled:opacity-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
      >
        {statuses.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      {/* Watch mode toggle */}
      <div className="inline-flex rounded-full bg-stone-100 p-0.5 dark:bg-stone-800">
        <button
          type="button"
          onClick={() => handleWatchModeChange("INDIVIDUAL")}
          disabled={isPending}
          className={`rounded-full px-3 py-1 text-sm font-medium transition-colors active:scale-[0.98] disabled:opacity-50 ${
            watchMode === "INDIVIDUAL"
              ? "bg-white text-stone-900 shadow-sm dark:bg-stone-700 dark:text-stone-100"
              : "text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
          }`}
        >
          Just Me
        </button>
        <button
          type="button"
          onClick={() => handleWatchModeChange("HOUSEHOLD")}
          disabled={isPending}
          className={`rounded-full px-3 py-1 text-sm font-medium transition-colors active:scale-[0.98] disabled:opacity-50 ${
            watchMode === "HOUSEHOLD"
              ? "bg-white text-stone-900 shadow-sm dark:bg-stone-700 dark:text-stone-100"
              : "text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
          }`}
        >
          Household
        </button>
      </div>

      <button
        type="button"
        onClick={handleRefresh}
        disabled={isPending}
        className="rounded-full px-3 py-1.5 text-sm text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 active:scale-[0.98] disabled:opacity-50 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
      >
        {isPending ? "Syncing…" : "Refresh from TMDB"}
      </button>
      <button
        type="button"
        onClick={handleRemove}
        disabled={isPending}
        className="rounded-full px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50 active:scale-[0.98] disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/20"
      >
        Remove
      </button>
    </div>
  );
}
