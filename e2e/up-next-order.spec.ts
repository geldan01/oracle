import "dotenv/config";
import { test, expect } from "./fixtures";
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

// Two shows whose alphabetical order is the opposite of their air-date order,
// so the assertion only passes if "Up Next" is sorted by release date.
// Keep the nonce small enough for tmdbId's 32-bit integer column.
const nonce = Date.now() % 1_000_000;
const OLD_SHOW = `AAA UpNext Old ${nonce}`;
const FRESH_SHOW = `ZZZ UpNext Fresh ${nonce}`;

async function seedShow(name: string, tmdbId: number, airDate: Date) {
  await prisma.tvShow.create({
    data: {
      tmdbId,
      name,
      status: "WATCHING",
      watchMode: "HOUSEHOLD",
      seasons: {
        create: {
          seasonNumber: 1,
          episodeCount: 1,
          episodes: {
            create: { episodeNumber: 1, name: "Pilot", airDate },
          },
        },
      },
    },
  });
}

test.beforeAll(async () => {
  // Both air more recently than anything other specs seed (real TMDB shows,
  // all aired years ago), so these two occupy the top of the list and stay
  // inside TvWidget's 5-item slice regardless of what else is being watched.
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await seedShow(OLD_SHOW, 1_000_000_000 + nonce * 2, yesterday);
  await seedShow(FRESH_SHOW, 1_000_000_000 + nonce * 2 + 1, new Date());
});

test.afterAll(async () => {
  await prisma.tvShow.deleteMany({
    where: { name: { in: [OLD_SHOW, FRESH_SHOW] } },
  });
  await prisma.$disconnect();
});

test.describe("Dashboard — Up Next ordering", () => {
  test("lists the most recently released episode first", async ({
    adminPage,
  }) => {
    await adminPage.goto("/dashboard");

    const upNext = adminPage.locator("section", {
      has: adminPage.getByRole("heading", { name: "Up Next" }),
    });

    await expect(upNext.getByText(FRESH_SHOW, { exact: true })).toBeVisible();
    await expect(upNext.getByText(OLD_SHOW, { exact: true })).toBeVisible();

    const items = await upNext.locator("li").allInnerTexts();
    const freshIndex = items.findIndex((t) => t.includes(FRESH_SHOW));
    const oldIndex = items.findIndex((t) => t.includes(OLD_SHOW));

    expect(freshIndex).toBeGreaterThanOrEqual(0);
    expect(oldIndex).toBeGreaterThan(freshIndex);
  });
});
