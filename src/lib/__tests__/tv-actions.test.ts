import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockPrisma, mockAuth } = vi.hoisted(() => ({
  mockPrisma: {
    tvShow: {
      update: vi.fn(),
    },
    tvSeason: {
      findUniqueOrThrow: vi.fn(),
    },
    tvEpisode: {
      findMany: vi.fn(),
    },
    watchedEpisode: {
      deleteMany: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
  },
  mockAuth: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

import { getFamilyMembers, updateShowProfile, unmarkSeasonWatched } from "../tv-actions";

const mockUser = { id: "user-1", email: "a@b.com", role: "MEMBER" };

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ user: mockUser });
});

describe("getFamilyMembers", () => {
  it("returns users ordered by name", async () => {
    mockPrisma.user.findMany.mockResolvedValue([
      { id: "user-1", name: "Alice", email: "alice@example.com" },
    ]);

    const result = await getFamilyMembers();

    expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    });
    expect(result).toEqual([
      { id: "user-1", name: "Alice", email: "alice@example.com" },
    ]);
  });
});

describe("updateShowProfile", () => {
  it("throws Unauthorized when no session", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(updateShowProfile("show-1", "user-2")).rejects.toThrow(
      "Unauthorized"
    );
  });

  it("sets the profile user on the show", async () => {
    mockPrisma.tvShow.update.mockResolvedValue({});

    await updateShowProfile("show-1", "user-2");

    expect(mockPrisma.tvShow.update).toHaveBeenCalledWith({
      where: { id: "show-1" },
      data: { profileUserId: "user-2" },
    });
  });

  it("clears the profile user when passed null", async () => {
    mockPrisma.tvShow.update.mockResolvedValue({});

    await updateShowProfile("show-1", null);

    expect(mockPrisma.tvShow.update).toHaveBeenCalledWith({
      where: { id: "show-1" },
      data: { profileUserId: null },
    });
  });
});

describe("unmarkSeasonWatched", () => {
  function mockSeason(watchMode: "INDIVIDUAL" | "HOUSEHOLD") {
    mockPrisma.tvSeason.findUniqueOrThrow.mockResolvedValue({
      show: { watchMode },
    });
    mockPrisma.tvEpisode.findMany.mockResolvedValue([
      { id: "ep-1" },
      { id: "ep-2" },
    ]);
  }

  it("throws Unauthorized when no session", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(unmarkSeasonWatched("season-1")).rejects.toThrow(
      "Unauthorized"
    );
  });

  it("only looks up episodes belonging to the given season", async () => {
    mockSeason("INDIVIDUAL");

    await unmarkSeasonWatched("season-1");

    expect(mockPrisma.tvEpisode.findMany).toHaveBeenCalledWith({
      where: { seasonId: "season-1" },
      select: { id: true },
    });
  });

  it("clears only the current user's watched rows for an individual-mode show", async () => {
    mockSeason("INDIVIDUAL");

    await unmarkSeasonWatched("season-1");

    expect(mockPrisma.watchedEpisode.deleteMany).toHaveBeenCalledWith({
      where: { episodeId: { in: ["ep-1", "ep-2"] }, userId: mockUser.id },
    });
  });

  it("clears watched rows for every household member for a household-mode show", async () => {
    mockSeason("HOUSEHOLD");

    await unmarkSeasonWatched("season-1");

    expect(mockPrisma.watchedEpisode.deleteMany).toHaveBeenCalledWith({
      where: { episodeId: { in: ["ep-1", "ep-2"] } },
    });
  });
});
