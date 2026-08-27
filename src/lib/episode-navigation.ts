export type EpisodeRef = { seasonNumber: number; episodeNumber: number };

export type SeasonEpisodes = {
  seasonNumber: number;
  episodeNumbers: number[];
};

export type AdjacentEpisodes = {
  previous: EpisodeRef | null;
  next: EpisodeRef | null;
};

/**
 * Flatten the show into a single ordered list of episodes (season order, then
 * episode order) and return the episodes immediately before and after the
 * current one. When the current episode is the last of its season, `next`
 * rolls over to the first episode of the following season; at the very end of
 * the show `next` is null (and symmetrically for `previous`).
 */
export function getAdjacentEpisodes(
  seasons: SeasonEpisodes[],
  current: EpisodeRef,
): AdjacentEpisodes {
  const ordered: EpisodeRef[] = [...seasons]
    .sort((a, b) => a.seasonNumber - b.seasonNumber)
    .flatMap((season) =>
      [...season.episodeNumbers]
        .sort((a, b) => a - b)
        .map((episodeNumber) => ({
          seasonNumber: season.seasonNumber,
          episodeNumber,
        })),
    );

  const index = ordered.findIndex(
    (ep) =>
      ep.seasonNumber === current.seasonNumber &&
      ep.episodeNumber === current.episodeNumber,
  );

  if (index === -1) {
    return { previous: null, next: null };
  }

  return {
    previous: index > 0 ? ordered[index - 1] : null,
    next: index < ordered.length - 1 ? ordered[index + 1] : null,
  };
}
