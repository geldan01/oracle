"use client";

import { useRouter } from "next/navigation";

interface ChannelFilterProps {
  channels: { id: string; name: string }[];
  currentChannel: string | null;
  currentFilter: string;
}

export default function ChannelFilter({
  channels,
  currentChannel,
  currentFilter,
}: ChannelFilterProps) {
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams();
    if (currentFilter !== "mine") params.set("filter", currentFilter);
    if (e.target.value) params.set("channel", e.target.value);
    const qs = params.toString();
    router.push(qs ? `/tv?${qs}` : "/tv");
  }

  return (
    <select
      value={currentChannel ?? ""}
      onChange={handleChange}
      className="rounded-full border-0 bg-stone-100 px-3 py-1 text-sm text-stone-700 outline-none transition-colors hover:bg-stone-200 focus:ring-2 focus:ring-emerald-500/30 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
    >
      <option value="">All channels</option>
      {channels.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
