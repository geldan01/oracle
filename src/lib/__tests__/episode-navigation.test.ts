import { describe, it, expect } from "vitest";
import { getAdjacentEpisodes, type SeasonEpisodes } from "../episode-navigation";

const show: SeasonEpisodes[] = [
  { seasonNumber: 1, episodeNumbers: [1, 2, 3] },
  { seasonNumber: 2, episodeNumbers: [1, 2] },
  { seasonNumber: 3, episodeNumbers: [1] },
];

describe("getAdjacentEpisodes", () => {
  it("moves within a season", () => {
    expect(
      getAdjacentEpisodes(show, { seasonNumber: 1, episodeNumber: 2 }),
    ).toEqual({
      previous: { seasonNumber: 1, episodeNumber: 1 },
      next: { seasonNumber: 1, episodeNumber: 3 },
    });
  });

  it("rolls over to the first episode of the next season", () => {
    expect(
      getAdjacentEpisodes(show, { seasonNumber: 1, episodeNumber: 3 }).next,
    ).toEqual({ seasonNumber: 2, episodeNumber: 1 });
  });

  it("rolls back to the last episode of the previous season", () => {
    expect(
      getAdjacentEpisodes(show, { seasonNumber: 2, episodeNumber: 1 }).previous,
    ).toEqual({ seasonNumber: 1, episodeNumber: 3 });
  });

  it("has no next after the final episode of the final season", () => {
    expect(
      getAdjacentEpisodes(show, { seasonNumber: 3, episodeNumber: 1 }).next,
    ).toBeNull();
  });

  it("has no previous before the first episode", () => {
    expect(
      getAdjacentEpisodes(show, { seasonNumber: 1, episodeNumber: 1 }).previous,
    ).toBeNull();
  });

  it("sorts unordered seasons and episodes before pairing", () => {
    const messy: SeasonEpisodes[] = [
      { seasonNumber: 2, episodeNumbers: [2, 1] },
      { seasonNumber: 1, episodeNumbers: [3, 1, 2] },
    ];
    expect(
      getAdjacentEpisodes(messy, { seasonNumber: 1, episodeNumber: 3 }),
    ).toEqual({
      previous: { seasonNumber: 1, episodeNumber: 2 },
      next: { seasonNumber: 2, episodeNumber: 1 },
    });
  });

  it("returns nulls when the current episode is unknown", () => {
    expect(
      getAdjacentEpisodes(show, { seasonNumber: 9, episodeNumber: 9 }),
    ).toEqual({ previous: null, next: null });
  });

  it("skips gaps in episode numbering", () => {
    const gapped: SeasonEpisodes[] = [
      { seasonNumber: 1, episodeNumbers: [1, 2, 5] },
    ];
    expect(
      getAdjacentEpisodes(gapped, { seasonNumber: 1, episodeNumber: 2 }).next,
    ).toEqual({ seasonNumber: 1, episodeNumber: 5 });
  });
});
