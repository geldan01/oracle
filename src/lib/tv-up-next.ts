/**
 * Pure selection + ordering logic for the dashboard "Up Next" list.
 *
 * Kept free of Prisma/React so it can be unit tested in isolation. The database
 * query in `getUpNextEpisodes` is responsible for narrowing each season's
 * `episodes` to the single earliest unwatched aired episode (ordered by season
 * number, then episode number); this module turns that per-season shape into one
 * "next" episode per show, newest release first.
 */

/** Minimal shape this module needs from a queried episode. */
export interface UpNextCandidate {
  airDate: Date | null;
  season: { show: { name: string } };
}

/** Minimal shape this module needs from a queried show. */
export interface UpNextShow<E extends UpNextCandidate> {
  seasons: { episodes: E[] }[];
}

/**
 * Given watching shows whose nested `seasons.episodes` are already narrowed to
 * the earliest unwatched aired episode per season, return the single "next"
 * episode for each show, sorted by air date descending so the very latest
 * releases sit at the top of the list.
 *
 * Shows with nothing left to watch contribute no entry.
 */
export function pickNextEpisodePerShow<E extends UpNextCandidate>(
  shows: UpNextShow<E>[],
): E[] {
  const nextPerShow = shows
    .map((show) => show.seasons.flatMap((season) => season.episodes)[0])
    .filter((episode): episode is E => episode != null);

  return sortUpNextEpisodes(nextPerShow);
}

/**
 * Sort episodes newest-release-first. Episodes sharing an air date (or missing
 * one) fall back to alphabetical show name so the order stays stable.
 */
export function sortUpNextEpisodes<E extends UpNextCandidate>(episodes: E[]): E[] {
  return [...episodes].sort((a, b) => {
    const aTime = a.airDate?.getTime() ?? 0;
    const bTime = b.airDate?.getTime() ?? 0;
    if (bTime !== aTime) return bTime - aTime;
    return a.season.show.name.localeCompare(b.season.show.name);
  });
}
