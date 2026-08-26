import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockPrisma, mockAuth } = vi.hoisted(() => ({
  mockPrisma: {
    tvShow: {
      update: vi.fn(),
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

import { getFamilyMembers, updateShowProfile } from "../tv-actions";

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
