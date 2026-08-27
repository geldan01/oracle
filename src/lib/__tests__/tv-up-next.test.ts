import { describe, it, expect } from "vitest";
import {
  pickNextEpisodePerShow,
  sortUpNextEpisodes,
  type UpNextCandidate,
} from "../tv-up-next";

function episode(showName: string, airDate: string | null): UpNextCandidate {
  return {
    airDate: airDate ? new Date(airDate) : null,
    season: { show: { name: showName } },
  };
}

describe("sortUpNextEpisodes", () => {
  it("orders episodes by air date descending", () => {
    const result = sortUpNextEpisodes([
      episode("Old Show", "2019-03-01"),
      episode("Fresh Show", "2026-08-20"),
      episode("Mid Show", "2023-01-15"),
    ]);

    expect(result.map((e) => e.season.show.name)).toEqual([
      "Fresh Show",
      "Mid Show",
      "Old Show",
    ]);
  });

  it("breaks air-date ties with the show name", () => {
    const result = sortUpNextEpisodes([
      episode("Zeta", "2026-01-01"),
      episode("Alpha", "2026-01-01"),
    ]);

    expect(result.map((e) => e.season.show.name)).toEqual(["Alpha", "Zeta"]);
  });

  it("sorts episodes with no air date to the bottom", () => {
    const result = sortUpNextEpisodes([
      episode("No Date", null),
      episode("Dated", "2020-01-01"),
    ]);

    expect(result.map((e) => e.season.show.name)).toEqual(["Dated", "No Date"]);
  });

  it("does not mutate the input array", () => {
    const input = [
      episode("B", "2020-01-01"),
      episode("A", "2026-01-01"),
    ];
    sortUpNextEpisodes(input);
    expect(input.map((e) => e.season.show.name)).toEqual(["B", "A"]);
  });
});

describe("pickNextEpisodePerShow", () => {
  it("takes the first available episode across a show's seasons", () => {
    const shows = [
      {
        seasons: [
          { episodes: [] },
          { episodes: [episode("Behind Show", "2019-05-01")] },
        ],
      },
    ];

    const result = pickNextEpisodePerShow(shows);

    expect(result).toHaveLength(1);
    expect(result[0].season.show.name).toBe("Behind Show");
  });

  it("returns one entry per show, newest release first", () => {
    const shows = [
      { seasons: [{ episodes: [episode("Caught Up", "2026-08-20")] }] },
      { seasons: [{ episodes: [episode("Way Behind", "2018-02-02")] }] },
      { seasons: [{ episodes: [episode("Somewhat Behind", "2024-06-06")] }] },
    ];

    const result = pickNextEpisodePerShow(shows);

    expect(result.map((e) => e.season.show.name)).toEqual([
      "Caught Up",
      "Somewhat Behind",
      "Way Behind",
    ]);
  });

  it("skips shows with nothing left to watch", () => {
    const shows = [
      { seasons: [{ episodes: [] }, { episodes: [] }] },
      { seasons: [{ episodes: [episode("Active", "2025-01-01")] }] },
    ];

    const result = pickNextEpisodePerShow(shows);

    expect(result.map((e) => e.season.show.name)).toEqual(["Active"]);
  });

  it("returns an empty list when no shows have unwatched episodes", () => {
    expect(pickNextEpisodePerShow([{ seasons: [{ episodes: [] }] }])).toEqual([]);
  });
});
