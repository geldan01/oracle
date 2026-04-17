import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { auth } from "@/lib/auth";
import { getChannels, createChannel } from "@/lib/tv-actions";
import ChannelRow from "./channel-row";

export default async function ChannelsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const channels = await getChannels();
  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <Link
        href="/tv"
        className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400 transition-colors hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-300"
      >
        ← Television
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
        Channels
      </h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        Streaming services and TV providers.
      </p>

      <form action={createChannel} className="mt-8 flex gap-2">
        <input
          type="text"
          name="name"
          placeholder="Add a channel (Netflix, Prime, Bell…)"
          required
          className="flex-1 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-400 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:placeholder-stone-500"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.98] dark:bg-emerald-500 dark:text-stone-900 dark:hover:bg-emerald-400"
        >
          <Plus size={14} weight="bold" />
          Add
        </button>
      </form>

      {channels.length > 0 ? (
        <ul className="mt-8 divide-y divide-stone-100 dark:divide-stone-800">
          {channels.map((channel) => (
            <ChannelRow
              key={channel.id}
              id={channel.id}
              name={channel.name}
              isAdmin={isAdmin}
            />
          ))}
        </ul>
      ) : (
        <p className="mt-12 text-sm text-stone-400 dark:text-stone-500">
          No channels yet. Add your first one above.
        </p>
      )}
    </div>
  );
}
