import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Television, Star } from "@phosphor-icons/react/dist/ssr";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AddShowSearch from "./add-show-search";
import ChannelFilter from "./channel-filter";

export default async function TvPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; channel?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const user = session.user;
  const now = new Date();
  const { filter = "mine", channel: channelFilter } = await searchParams;

  const ownershipFilter =
    filter === "all"
      ? {}
      : filter === "household"
        ? { watchMode: "HOUSEHOLD" as const }
        : { watchMode: "INDIVIDUAL" as const, ownerId: user.id };

  const channelWhere = channelFilter ? { channelId: channelFilter } : {};

  const channels = await prisma.channel.findMany({ orderBy: { name: "asc" } });
  const activeChannel = channelFilter
    ? channels.find((c) => c.id === channelFilter) ?? null
    : null;

  const watchingShows = await prisma.tvShow.findMany({
    where: {
      status: "WATCHING",
      ...ownershipFilter,
      ...channelWhere,
    },
    include: {
      channel: true,
      ratings: true,
      seasons: {
        orderBy: { seasonNumber: "asc" },
        include: {
          episodes: {
            orderBy: { episodeNumber: "asc" },
            include: {
              watchedBy: { where: { userId: user.id } },
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const upNext = watchingShows
    .map((show) => {
      for (const season of show.seasons) {
        for (const ep of season.episodes) {
          if (ep.airDate && ep.airDate <= now && ep.watchedBy.length === 0) {
            return { show, episode: ep, season };
          }
        }
      }
      return null;
    })
    .filter(Boolean) as {
    show: (typeof watchingShows)[number];
    episode: (typeof watchingShows)[number]["seasons"][number]["episodes"][number];
    season: (typeof watchingShows)[number]["seasons"][number];
  }[];

  const otherShows = await prisma.tvShow.findMany({
    where: {
      status: { not: "WATCHING" },
      ...ownershipFilter,
      ...channelWhere,
    },
    include: { channel: true, ratings: true },
    orderBy: { name: "asc" },
  });

  function avgRating(ratings: { rating: number }[]) {
    if (ratings.length === 0) return null;
    return ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
  }

  function showProgress(show: (typeof watchingShows)[number]) {
    const totalEps = show.seasons.reduce((sum, s) => sum + s.episodes.length, 0);
    const watchedEps = show.seasons.reduce(
      (sum, s) =>
        sum + s.episodes.filter((e) => e.watchedBy.length > 0).length,
      0,
    );
    return { watchedEps, totalEps };
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500">
            Library
          </p>
          <h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
            <Television size={28} weight="duotone" className="text-violet-500 dark:text-violet-400" />
            Television
          </h1>
        </div>
        <Link
          href="/channels"
          className="rounded-full px-3 py-1.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 active:scale-[0.98] dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
        >
          Channels
        </Link>
      </div>

      {/* Filter row */}
      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-stone-200 pb-4 dark:border-stone-800">
        <div className="flex items-center gap-1">
          {(
            [
              { value: "mine", label: "Mine" },
              { value: "household", label: "Household" },
              { value: "all", label: "All" },
            ] as const
          ).map((btn) => {
            const params = new URLSearchParams();
            if (btn.value !== "mine") params.set("filter", btn.value);
            if (channelFilter) params.set("channel", channelFilter);
            const qs = params.toString();
            const href = qs ? `/tv?${qs}` : "/tv";
            return (
              <Link
                key={btn.value}
                href={href}
                className={`rounded-full px-3 py-1 text-sm transition-colors active:scale-[0.98] ${
                  filter === btn.value
                    ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
                }`}
              >
                {btn.label}
              </Link>
            );
          })}
        </div>

        {channels.length > 0 && (
          <div className="flex items-center gap-2">
            <ChannelFilter
              channels={channels.map((c) => ({ id: c.id, name: c.name }))}
              currentChannel={channelFilter ?? null}
              currentFilter={filter}
            />
            {activeChannel && (
              <Link
                href={filter === "mine" ? "/tv" : `/tv?filter=${filter}`}
                className="text-xs text-stone-400 underline-offset-2 hover:text-red-500 hover:underline dark:text-stone-500"
              >
                Clear
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Search */}
      <div className="mt-6">
        <AddShowSearch />
      </div>

      {/* Up Next */}
      {upNext.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
            Up Next
          </h2>
          <ul className="mt-4 divide-y divide-stone-100 dark:divide-stone-800">
            {upNext.map(({ show, episode, season }) => (
              <li key={show.id}>
                <Link
                  href={`/tv/${show.id}`}
                  className="group flex items-center gap-4 py-4 transition-colors hover:bg-stone-50 dark:hover:bg-stone-900"
                >
                  {show.posterPath ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w185${show.posterPath}`}
                      alt=""
                      width={56}
                      height={84}
                      className="h-20 w-14 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-14 shrink-0 items-center justify-center rounded bg-stone-100 dark:bg-stone-800">
                      <Television size={18} className="text-stone-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-medium text-stone-900 dark:text-stone-100">
                      {show.name}
                    </p>
                    <p className="mt-1 text-sm text-emerald-600 tabular-nums dark:text-emerald-400">
                      S{season.seasonNumber}E{episode.episodeNumber}
                      {episode.name ? (
                        <span className="text-stone-500 dark:text-stone-400">
                          {" · "}
                          {episode.name}
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">
                      {episode.airDate &&
                        `Aired ${episode.airDate.toLocaleDateString()}`}
                      {show.channel && ` · ${show.channel.name}`}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Currently Watching */}
      <section className="mt-12">
        <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
          Currently Watching
        </h2>
        {watchingShows.length > 0 ? (
          <ul className="mt-4 divide-y divide-stone-100 dark:divide-stone-800">
            {watchingShows.map((show) => {
              const { watchedEps, totalEps } = showProgress(show);
              const pct =
                totalEps > 0 ? Math.round((watchedEps / totalEps) * 100) : 0;
              const avg = avgRating(show.ratings);
              return (
                <li key={show.id}>
                  <Link
                    href={`/tv/${show.id}`}
                    className="group flex items-center gap-4 py-4 transition-colors hover:bg-stone-50 dark:hover:bg-stone-900"
                  >
                    {show.posterPath ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w185${show.posterPath}`}
                        alt=""
                        width={56}
                        height={84}
                        className="h-20 w-14 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-14 shrink-0 items-center justify-center rounded bg-stone-100 dark:bg-stone-800">
                        <Television size={18} className="text-stone-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-medium text-stone-900 dark:text-stone-100">
                        {show.name}
                      </p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
                        {show.tmdbRating != null && (
                          <span className="tabular-nums">
                            TMDB {show.tmdbRating.toFixed(1)}
                          </span>
                        )}
                        {avg != null && (
                          <span className="flex items-center gap-0.5 text-amber-500 dark:text-amber-400">
                            {Array.from({ length: Math.round(avg) }).map(
                              (_, i) => (
                                <Star key={i} size={11} weight="fill" />
                              ),
                            )}
                          </span>
                        )}
                        {show.channel && <span>{show.channel.name}</span>}
                      </div>
                      <div className="mt-2.5 flex items-center gap-3">
                        <div className="h-px flex-1 bg-stone-100 dark:bg-stone-800">
                          <div
                            className="h-px bg-emerald-500 transition-all dark:bg-emerald-400"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="shrink-0 text-xs text-stone-400 tabular-nums dark:text-stone-500">
                          {watchedEps}/{totalEps}
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-4 py-8 text-sm text-stone-400 dark:text-stone-500">
            No shows here yet. Search above to add one.
          </p>
        )}
      </section>

      {/* Plan / Paused / Completed / Dropped */}
      {(
        [
          { status: "PLAN_TO_WATCH", label: "Plan to Watch" },
          { status: "PAUSED", label: "Paused" },
          { status: "COMPLETED", label: "Completed" },
          { status: "DROPPED", label: "Dropped" },
        ] as const
      ).map(({ status, label }) => {
        const shows = otherShows.filter((s) => s.status === status);
        if (shows.length === 0) return null;
        return (
          <section key={status} className="mt-12">
            <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
              {label}
            </h2>
            <ul className="mt-4 divide-y divide-stone-100 dark:divide-stone-800">
              {shows.map((show) => {
                const avg = avgRating(show.ratings);
                return (
                  <li key={show.id}>
                    <Link
                      href={`/tv/${show.id}`}
                      className="flex items-center gap-4 py-3 transition-colors hover:bg-stone-50 dark:hover:bg-stone-900"
                    >
                      {show.posterPath ? (
                        <Image
                          src={`https://image.tmdb.org/t/p/w92${show.posterPath}`}
                          alt=""
                          width={36}
                          height={52}
                          className="h-13 w-9 shrink-0 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-13 w-9 shrink-0 items-center justify-center rounded bg-stone-100 dark:bg-stone-800">
                          <Television size={14} className="text-stone-400" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-stone-900 dark:text-stone-100">
                          {show.name}
                        </p>
                        {avg != null && (
                          <span className="mt-0.5 flex items-center gap-0.5 text-amber-500 dark:text-amber-400">
                            {Array.from({ length: Math.round(avg) }).map(
                              (_, i) => (
                                <Star key={i} size={10} weight="fill" />
                              ),
                            )}
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
