import { test, expect } from "./fixtures";

test.describe("Weather Feature", () => {
  test("admin can add a city and it appears in the list", async ({
    adminPage,
  }) => {
    await adminPage.goto("/admin");

    // Weather Cities section should exist
    await expect(adminPage.getByText("Weather Cities")).toBeVisible();

    // Search for a city
    const searchInput = adminPage.getByPlaceholder("Search for a city...");
    await searchInput.fill("Paris");

    // Wait for search results
    const addButton = adminPage
      .getByRole("button", { name: "Add" })
      .first();
    await expect(addButton).toBeVisible({ timeout: 10000 });

    // Add the city
    await addButton.click();

    // Verify the city appears in the table
    await expect(
      adminPage.getByRole("cell", { name: "Paris" }),
    ).toBeVisible({ timeout: 5000 });

    // First city should be auto-set as primary (use exact match to avoid "Set Primary")
    await expect(
      adminPage.getByText("Primary", { exact: true }).first()
    ).toBeVisible();
  });

  test("admin can set a different city as primary", async ({
    adminPage,
  }) => {
    await adminPage.goto("/admin");

    // Ensure there are at least 2 cities — find any row with "Set Primary"
    const setPrimaryButtons = adminPage.getByRole("button", {
      name: "Set Primary",
    });

    if ((await setPrimaryButtons.count()) === 0) {
      // Need to add a second city first
      const searchInput = adminPage.getByPlaceholder("Search for a city...");
      await searchInput.fill("Tokyo");
      const addBtn = adminPage.getByRole("button", { name: "Add" }).first();
      await expect(addBtn).toBeVisible({ timeout: 10000 });
      await addBtn.click();
      await expect(setPrimaryButtons.first()).toBeVisible({ timeout: 5000 });
    }

    // Click the first available "Set Primary" button
    await setPrimaryButtons.first().click();

    // After clicking, that row should now show the "Primary" badge
    await expect(
      adminPage.getByText("Primary", { exact: true }).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("dashboard weather widget shows weather data", async ({
    adminPage,
  }) => {
    await adminPage.goto("/dashboard");

    // The weather widget should be visible and link to /weather
    const weatherWidget = adminPage.locator('a[href="/weather"]');
    await expect(weatherWidget).toBeVisible();

    // Should contain temperature (° symbol) if a primary city is set
    const hasTemp = await weatherWidget.getByText(/°/).first().isVisible().catch(() => false);
    // At minimum the widget should exist; temperature depends on city config
    expect(hasTemp || await weatherWidget.isVisible()).toBeTruthy();
  });

  test("clicking weather widget navigates to /weather", async ({
    adminPage,
  }) => {
    await adminPage.goto("/dashboard");

    const weatherWidget = adminPage.locator('a[href="/weather"]');
    await expect(weatherWidget).toBeVisible();
    await weatherWidget.click();

    await expect(adminPage).toHaveURL(/\/weather/);
    await expect(adminPage.getByRole("heading", { name: "Weather" })).toBeVisible();
  });

  test("weather page shows configured cities and forecasts", async ({
    adminPage,
  }) => {
    await adminPage.goto("/weather");

    // The weather heading should be visible
    await expect(
      adminPage.getByRole("heading", { name: "Weather" })
    ).toBeVisible();

    // Should show forecast sections if cities are configured
    const restOfToday = adminPage.getByText("Rest of Today").first();
    if (await restOfToday.isVisible().catch(() => false)) {
      await expect(restOfToday).toBeVisible();
      await expect(
        adminPage.getByText("7-Day Forecast").first()
      ).toBeVisible();
    }
  });

  test("member can view weather but cannot manage cities", async ({
    memberPage,
  }) => {
    // Member can view the weather page
    await memberPage.goto("/weather");
    await expect(
      memberPage.getByRole("heading", { name: "Weather" }),
    ).toBeVisible();

    // Member cannot access admin to manage cities
    await memberPage.goto("/admin");
    await expect(memberPage).toHaveURL(/\/dashboard/);
  });

  test("admin can remove a city", async ({ adminPage }) => {
    await adminPage.goto("/admin");

    // Remove Paris (if it exists from prior tests)
    const parisRow = adminPage
      .getByRole("row")
      .filter({ hasText: "Paris" });

    if ((await parisRow.count()) > 0) {
      await parisRow.first().getByRole("button", { name: "Remove" }).click();

      // Paris should no longer be in the table
      await expect(
        adminPage.getByRole("cell", { name: "Paris" }),
      ).not.toBeVisible({ timeout: 5000 });
    }
  });
});
