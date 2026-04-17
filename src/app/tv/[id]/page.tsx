import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Television, Star } from "@phosphor-icons/react/dist/ssr";
import { auth } from "@/lib/auth";
import { getShowById, getChannels } from "@/lib/tv-actions";
import ShowStarRating from "./show-star-rating";
import ChannelSelector from "./channel-selector";
import ShowActions from "./show-actions";
import SeasonSection from "./season-section";

export default async function ShowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;
  const [show, channels] = await Promise.all([getShowById(id), getChannels()]);
  if (!show) notFound();

  const user = session.user;
  const isOwner = !show.ownerId || show.ownerId === user.id;
  const isReadOnly = show.watchMode === "INDIVIDUAL" && !isOwner;
  const userRating = show.ratings.find((r) => r.userId === user.id);
  const otherRatings = show.ratings.filter((r) => r.userId !== user.id);
  const avgRating =
    show.ratings.length > 0
      ? show.ratings.reduce((sum, r) => sum + r.rating, 0) / show.ratings.length
      : null;

  let autoOpenSeason: number | null = null;
  for (const season of show.seasons) {
    const hasUnwatched = season.episodes.some(
      (ep) =>
        ep.airDate && ep.airDate <= new Date() && ep.watchedBy.length === 0,
    );
    if (hasUnwatched) {
      autoOpenSeason = season.seasonNumber;
      break;
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
      {/* Breadcrumb */}
      <Link
        href="/tv"
        className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400 transition-colors hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-300"
      >
        ← Television
      </Link>

      {/* Show header */}
      <div className="mt-6 flex flex-col gap-8 md:flex-row">
        {show.posterPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`https://image.tmdb.org/t/p/w342${show.posterPath}`}
            alt={show.name}
            className="h-72 w-48 shrink-0 self-start rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-72 w-48 shrink-0 items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-800">
            <Television size={32} className="text-stone-400" />
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
              {show.name}
            </h1>
            {isReadOnly && show.owner && (
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                {show.owner.name ?? "Another member"}&apos;s show — read only
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500 dark:text-stone-400">
              {show.tmdbRating != null && (
                <span className="tabular-nums">
                  TMDB {show.tmdbRating.toFixed(1)}
                </span>
              )}
              {show.imdbId && (
                <a
                  href={`https://www.imdb.com/title/${show.imdbId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 underline-offset-2 hover:underline dark:text-emerald-400"
                >
                  IMDb
                </a>
              )}
              {avgRating != null && (
                <span className="tabular-nums">
                  Household {avgRating.toFixed(1)}
                </span>
              )}
              {show.firstAirDate && (
                <span>
                  First aired {show.firstAirDate.toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Your rating */}
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
              Your Rating
            </p>
            <div className="mt-2">
              <ShowStarRating
                showId={show.id}
                currentRating={userRating?.rating ?? null}
              />
            </div>
            {otherRatings.length > 0 && (
              <ul className="mt-3 space-y-1">
                {otherRatings.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400"
                  >
                    <span className="min-w-20 truncate">
                      {r.user.name ?? r.user.email}
                    </span>
                    <span className="flex items-center gap-0.5 text-amber-500 dark:text-amber-400">
                      {Array.from({ length: r.rating }).map((_, i) => (
                        <Star key={i} size={11} weight="fill" />
                      ))}
                      {Array.from({ length: 5 - r.rating }).map((_, i) => (
                        <Star
                          key={`o-${i}`}
                          size={11}
                          weight="regular"
                          className="text-stone-300 dark:text-stone-600"
                        />
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Channel */}
          {!isReadOnly && (
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                Watching on
              </p>
              <div className="mt-2">
                <ChannelSelector
                  showId={show.id}
                  currentChannelId={show.channelId}
                  channels={channels}
                />
              </div>
            </div>
          )}

          {/* Status and actions */}
          {!isReadOnly && (
            <ShowActions
              showId={show.id}
              currentStatus={show.status}
              watchMode={show.watchMode}
            />
          )}
        </div>
      </div>

      {/* Overview */}
      {show.overview && (
        <div className="mt-12">
          <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
            Overview
          </h2>
          <p className="mt-3 max-w-[65ch] text-sm leading-relaxed text-stone-600 dark:text-stone-300">
            {show.overview}
          </p>
        </div>
      )}

      {/* Seasons */}
      <div className="mt-12">
        <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
          Seasons ({show.seasons.length})
        </h2>
        <div className="mt-4 space-y-2">
          {show.seasons.map((season) => (
            <SeasonSection
              key={season.id}
              showId={show.id}
              season={{
                id: season.id,
                seasonNumber: season.seasonNumber,
                name: season.name,
                episodeCount: season.episodes.length,
                episodes: season.episodes.map((ep) => ({
                  id: ep.id,
                  episodeNumber: ep.episodeNumber,
                  name: ep.name,
                  airDate: ep.airDate,
                  tmdbRating: ep.tmdbRating,
                  watched: ep.watchedBy.length > 0,
                })),
              }}
              defaultOpen={season.seasonNumber === autoOpenSeason}
              readOnly={isReadOnly}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
