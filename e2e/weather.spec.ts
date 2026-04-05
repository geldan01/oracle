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

    // First city should be auto-set as primary
    await expect(adminPage.getByText("Primary")).toBeVisible();
  });

  test("admin can set a different city as primary", async ({
    adminPage,
  }) => {
    await adminPage.goto("/admin");

    // Add a second city
    const searchInput = adminPage.getByPlaceholder("Search for a city...");
    await searchInput.fill("London");

    const addButton = adminPage
      .getByRole("button", { name: "Add" })
      .first();
    await expect(addButton).toBeVisible({ timeout: 10000 });
    await addButton.click();

    // Wait for London to appear
    await expect(
      adminPage.getByRole("cell", { name: "London" }),
    ).toBeVisible({ timeout: 5000 });

    // Set London as primary
    const setPrimaryButton = adminPage.getByRole("button", {
      name: "Set Primary",
    });
    await setPrimaryButton.click();

    // Verify London now has the Primary badge in its row
    const londonRow = adminPage
      .getByRole("row")
      .filter({ hasText: "London" });
    await expect(londonRow.getByText("Primary")).toBeVisible({ timeout: 5000 });
  });

  test("dashboard weather widget shows weather data", async ({
    adminPage,
  }) => {
    await adminPage.goto("/dashboard");

    // The weather widget should show temperature data (contains °)
    const weatherLink = adminPage.getByRole("link", { name: /Weather/ });
    await expect(weatherLink).toBeVisible();

    // Should contain temperature
    await expect(weatherLink.getByText(/°/)).toBeVisible({ timeout: 10000 });
  });

  test("clicking weather widget navigates to /weather", async ({
    adminPage,
  }) => {
    await adminPage.goto("/dashboard");

    const weatherLink = adminPage.getByRole("link", { name: /Weather/ });
    await weatherLink.click();

    await expect(adminPage).toHaveURL(/\/weather/);
    await expect(adminPage.getByRole("heading", { name: "Weather" })).toBeVisible();
  });

  test("weather page shows all configured cities", async ({
    adminPage,
  }) => {
    await adminPage.goto("/weather");

    // Should show both Paris and London
    await expect(adminPage.getByText("Paris")).toBeVisible();
    await expect(adminPage.getByText("London")).toBeVisible();

    // Should show forecast sections
    await expect(
      adminPage.getByText("Rest of Today").first(),
    ).toBeVisible({ timeout: 10000 });
    await expect(
      adminPage.getByText("7-Day Forecast").first(),
    ).toBeVisible();
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

    // Remove Paris
    const parisRow = adminPage
      .getByRole("row")
      .filter({ hasText: "Paris" });
    await parisRow.getByRole("button", { name: "Remove" }).click();

    // Paris should no longer be in the table
    await expect(
      adminPage.getByRole("cell", { name: "Paris" }),
    ).not.toBeVisible({ timeout: 5000 });
  });
});
