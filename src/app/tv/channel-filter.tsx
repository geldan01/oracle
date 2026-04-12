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
      className="rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm text-stone-900 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none dark:border-violet-800 dark:bg-stone-900 dark:text-stone-100"
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
