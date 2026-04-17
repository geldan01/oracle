import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import EpisodeWatchedToggle from "./episode-watched-toggle";

export default async function EpisodeDetailPage({
  params,
}: {
  params: Promise<{ id: string; seasonNum: string; episodeNum: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id: showId, seasonNum, episodeNum } = await params;
  const user = session.user;

  const show = await prisma.tvShow.findUnique({
    where: { id: showId },
    select: { id: true, name: true, posterPath: true },
  });
  if (!show) notFound();

  const season = await prisma.tvSeason.findUnique({
    where: {
      showId_seasonNumber: { showId, seasonNumber: parseInt(seasonNum) },
    },
    select: { id: true, seasonNumber: true, name: true },
  });
  if (!season) notFound();

  const episode = await prisma.tvEpisode.findUnique({
    where: {
      seasonId_episodeNumber: {
        seasonId: season.id,
        episodeNumber: parseInt(episodeNum),
      },
    },
    include: {
      watchedBy: { where: { userId: user.id } },
    },
  });
  if (!episode) notFound();

  const watched = episode.watchedBy.length > 0;
  const aired = episode.airDate && episode.airDate <= new Date();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500">
        <Link
          href="/tv"
          className="transition-colors hover:text-stone-700 dark:hover:text-stone-300"
        >
          Television
        </Link>
        <span>/</span>
        <Link
          href={`/tv/${show.id}`}
          className="transition-colors hover:text-stone-700 dark:hover:text-stone-300"
        >
          {show.name}
        </Link>
        <span>/</span>
        <span className="text-stone-700 tabular-nums dark:text-stone-300">
          S{season.seasonNumber}E{episode.episodeNumber}
        </span>
      </div>

      <div className="mt-6 space-y-6">
        {episode.stillPath && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`https://image.tmdb.org/t/p/w500${episode.stillPath}`}
            alt={episode.name ?? `Episode ${episode.episodeNumber}`}
            className="w-full rounded-lg object-cover"
            style={{ maxHeight: 360 }}
          />
        )}

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {show.name} ·{" "}
              {season.name ?? `Season ${season.seasonNumber}`}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
              <span className="text-emerald-600 dark:text-emerald-400">
                E{episode.episodeNumber}
              </span>{" "}
              · {episode.name ?? `Episode ${episode.episodeNumber}`}
            </h1>
          </div>
          <EpisodeWatchedToggle episodeId={episode.id} watched={watched} />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
          {episode.airDate && (
            <span>
              {aired ? "Aired" : "Airs"} {episode.airDate.toLocaleDateString()}
            </span>
          )}
          {episode.tmdbRating != null && episode.tmdbRating > 0 && (
            <span className="tabular-nums">
              TMDB {episode.tmdbRating.toFixed(1)}
            </span>
          )}
          {watched && (
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              Watched
            </span>
          )}
          {!aired && (
            <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600 dark:bg-stone-800 dark:text-stone-300">
              Not yet aired
            </span>
          )}
        </div>

        {episode.overview && (
          <p className="max-w-[65ch] text-sm leading-relaxed text-stone-600 dark:text-stone-300">
            {episode.overview}
          </p>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-12 flex items-center justify-between border-t border-stone-200 pt-6 dark:border-stone-800">
        {episode.episodeNumber > 1 ? (
          <Link
            href={`/tv/${show.id}/season/${season.seasonNumber}/episode/${episode.episodeNumber - 1}`}
            className="text-sm text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            ← Previous
          </Link>
        ) : (
          <span />
        )}
        <Link
          href={`/tv/${show.id}`}
          className="text-sm text-stone-400 transition-colors hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-300"
        >
          Back to show
        </Link>
        <Link
          href={`/tv/${show.id}/season/${season.seasonNumber}/episode/${episode.episodeNumber + 1}`}
          className="text-sm text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
        >
          Next →
        </Link>
      </div>
    </div>
  );
}
