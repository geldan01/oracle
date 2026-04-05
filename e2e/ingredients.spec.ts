import { test, expect } from "./fixtures";

test.describe("Ingredients", () => {
  // Helper: create a meal with an ingredient so the ingredients page has data
  async function createMealWithIngredient(
    page: import("@playwright/test").Page,
    mealName: string,
    ingredientName: string
  ) {
    await page.goto("/meals/new");
    await page.getByLabel("Meal Name").fill(mealName);
    await page.getByPlaceholder("Ingredient name").fill(ingredientName);
    await page.getByPlaceholder("Qty").fill("1 cup");
    await page.getByRole("button", { name: "Create Meal" }).click();
    await expect(
      page.getByRole("heading", { name: mealName })
    ).toBeVisible();
  }

  test.describe("/ingredients page", () => {
    test("shows ingredients list with back link to meals", async ({
      adminPage,
    }) => {
      await adminPage.goto("/ingredients");

      await expect(
        adminPage.getByRole("heading", { name: "Ingredients" })
      ).toBeVisible();
      await expect(
        adminPage.getByRole("link", { name: "← Meals" })
      ).toHaveAttribute("href", "/meals");
    });

    test("displays ingredient count", async ({ adminPage }) => {
      await adminPage.goto("/ingredients");

      await expect(
        adminPage.getByText(/\d+ ingredients?/)
      ).toBeVisible();
    });

    test("clicking an ingredient navigates to detail page", async ({
      adminPage,
    }) => {
      // Create a meal with a unique ingredient
      const ingName = `IngNav ${Date.now()}`;
      await createMealWithIngredient(adminPage, `NavMeal ${Date.now()}`, ingName);

      await adminPage.goto("/ingredients");
      await adminPage.getByRole("link", { name: new RegExp(ingName) }).click();

      await expect(
        adminPage.getByRole("heading", { name: ingName })
      ).toBeVisible();
    });

    test("shows tag filter pills when tags exist", async ({ adminPage }) => {
      await adminPage.goto("/ingredients");

      // "All" pill should always be visible
      await expect(
        adminPage.getByRole("link", { name: "All" }).first()
      ).toBeVisible();
    });

    test("can filter ingredients by tag", async ({ adminPage }) => {
      // First create an ingredient and tag it
      const ingName = `FilterIng ${Date.now()}`;
      await createMealWithIngredient(
        adminPage,
        `FilterMeal ${Date.now()}`,
        ingName
      );

      // Navigate to the ingredient and tag it
      await adminPage.goto("/ingredients");
      await adminPage
        .getByRole("link", { name: new RegExp(ingName) })
        .click();

      // Tag it as "produce"
      await adminPage.getByRole("button", { name: "produce" }).click();
      await adminPage.getByRole("button", { name: "Save Tags" }).click();
      await expect(adminPage.getByText("Saved!")).toBeVisible();

      // Go back to ingredients list and filter by produce
      await adminPage.goto("/ingredients");
      const produceFilter = adminPage.getByRole("link", {
        name: /^produce \(\d+\)$/,
      });
      if (await produceFilter.isVisible()) {
        await produceFilter.click();
        await expect(adminPage).toHaveURL(/tag=produce/);
        await expect(
          adminPage.getByText(ingName).first()
        ).toBeVisible();
      }
    });
  });

  test.describe("/ingredients/[id] detail page", () => {
    test("shows ingredient name and meal count", async ({ adminPage }) => {
      const ingName = `DetailIng ${Date.now()}`;
      const mealName = `DetailMeal ${Date.now()}`;
      await createMealWithIngredient(adminPage, mealName, ingName);

      await adminPage.goto("/ingredients");
      await adminPage
        .getByRole("link", { name: new RegExp(ingName) })
        .click();

      await expect(
        adminPage.getByRole("heading", { name: ingName })
      ).toBeVisible();
      await expect(adminPage.getByText("Used in 1 meal")).toBeVisible();
    });

    test("back link navigates to /ingredients", async ({ adminPage }) => {
      const ingName = `BackIng ${Date.now()}`;
      await createMealWithIngredient(
        adminPage,
        `BackMeal ${Date.now()}`,
        ingName
      );

      await adminPage.goto("/ingredients");
      await adminPage
        .getByRole("link", { name: new RegExp(ingName) })
        .click();

      await adminPage
        .getByRole("link", { name: "← Ingredients" })
        .click();
      await expect(adminPage).toHaveURL(/\/ingredients$/);
    });

    test("shows grocery section tag picker", async ({ adminPage }) => {
      const ingName = `TagPicker ${Date.now()}`;
      await createMealWithIngredient(
        adminPage,
        `TagMeal ${Date.now()}`,
        ingName
      );

      await adminPage.goto("/ingredients");
      await adminPage
        .getByRole("link", { name: new RegExp(ingName) })
        .click();

      await expect(
        adminPage.getByRole("heading", { name: "Grocery Section" })
      ).toBeVisible();

      // Common grocery tags should be visible
      await expect(
        adminPage.getByRole("button", { name: "produce" })
      ).toBeVisible();
      await expect(
        adminPage.getByRole("button", { name: "meat" })
      ).toBeVisible();
      await expect(
        adminPage.getByRole("button", { name: "dairy" })
      ).toBeVisible();
    });

    test("can save grocery section tags", async ({ adminPage }) => {
      const ingName = `SaveTag ${Date.now()}`;
      await createMealWithIngredient(
        adminPage,
        `SaveTagMeal ${Date.now()}`,
        ingName
      );

      await adminPage.goto("/ingredients");
      await adminPage
        .getByRole("link", { name: new RegExp(ingName) })
        .click();

      // Select a tag
      await adminPage.getByRole("button", { name: "dairy" }).click();
      await adminPage.getByRole("button", { name: "Save Tags" }).click();

      await expect(adminPage.getByText("Saved!")).toBeVisible();
    });

    test("can add a custom tag", async ({ adminPage }) => {
      const ingName = `CustomTag ${Date.now()}`;
      await createMealWithIngredient(
        adminPage,
        `CustomTagMeal ${Date.now()}`,
        ingName
      );

      await adminPage.goto("/ingredients");
      await adminPage
        .getByRole("link", { name: new RegExp(ingName) })
        .click();

      // Add a custom section tag
      await adminPage.getByPlaceholder("Custom section...").fill("organic");
      await adminPage
        .getByRole("button", { name: "Add" })
        .click();

      // The custom tag pill should now appear as selected
      await expect(
        adminPage.getByRole("button", { name: "organic" })
      ).toBeVisible();
    });

    test("shows meals that use the ingredient", async ({ adminPage }) => {
      const ingName = `MealList ${Date.now()}`;
      const mealName = `MealListMeal ${Date.now()}`;
      await createMealWithIngredient(adminPage, mealName, ingName);

      await adminPage.goto("/ingredients");
      await adminPage
        .getByRole("link", { name: new RegExp(ingName) })
        .click();

      await expect(
        adminPage.getByRole("heading", { name: "Meals" })
      ).toBeVisible();
      await expect(
        adminPage.getByRole("link", { name: new RegExp(mealName) })
      ).toBeVisible();
    });

    test("meal link navigates to meal detail page", async ({ adminPage }) => {
      const ingName = `MealNav ${Date.now()}`;
      const mealName = `MealNavTarget ${Date.now()}`;
      await createMealWithIngredient(adminPage, mealName, ingName);

      await adminPage.goto("/ingredients");
      await adminPage
        .getByRole("link", { name: new RegExp(ingName) })
        .click();

      await adminPage
        .getByRole("link", { name: new RegExp(mealName) })
        .click();

      await expect(
        adminPage.getByRole("heading", { name: mealName })
      ).toBeVisible();
    });
  });
});
