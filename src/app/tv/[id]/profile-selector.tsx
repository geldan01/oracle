"use client";

import { useTransition } from "react";
import { updateShowProfile } from "@/lib/tv-actions";

interface ProfileSelectorProps {
  showId: string;
  currentUserId: string | null;
  members: { id: string; name: string | null; email: string }[];
}

export default function ProfileSelector({ showId, currentUserId, members }: ProfileSelectorProps) {
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value || null;
    startTransition(async () => {
      await updateShowProfile(showId, value);
    });
  }

  return (
    <select
      value={currentUserId ?? ""}
      onChange={handleChange}
      disabled={isPending}
      className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 disabled:opacity-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
    >
      <option value="">No profile</option>
      {members.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name ?? m.email}
        </option>
      ))}
    </select>
  );
}
