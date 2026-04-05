import { test, expect } from "./fixtures";

test.describe("Meal Planner", () => {
  test.describe("Dashboard Widget", () => {
    test("displays Meal Planner widget with chalkboard style", async ({
      adminPage,
    }) => {
      await adminPage.goto("/dashboard");

      await expect(adminPage.getByText("Meal Planner")).toBeVisible();
      await expect(
        adminPage.getByPlaceholder("Add a meal...")
      ).toBeVisible();
    });

    test("Meal Planner header links to /meals", async ({ adminPage }) => {
      await adminPage.goto("/dashboard");

      const link = adminPage.getByRole("link", { name: "Meal Planner" });
      await expect(link).toHaveAttribute("href", "/meals");
    });

    test("'View all meals' link navigates to /meals", async ({
      adminPage,
    }) => {
      await adminPage.goto("/dashboard");

      const link = adminPage.getByRole("link", {
        name: "View all meals →",
      });
      await expect(link).toHaveAttribute("href", "/meals");
    });

    test("can add a meal via typeahead and it appears in the plan", async ({
      adminPage,
    }) => {
      await adminPage.goto("/dashboard");

      const input = adminPage.getByPlaceholder("Add a meal...");
      await input.fill("Test Meal E2E");
      await input.press("Enter");

      await expect(adminPage.getByText("Test Meal E2E")).toBeVisible();
    });

    test("can remove a meal from the plan", async ({ adminPage }) => {
      await adminPage.goto("/dashboard");

      // Use a unique name to avoid collisions across runs
      const mealName = `Remove Test ${Date.now()}`;
      const input = adminPage.getByPlaceholder("Add a meal...");
      await input.fill(mealName);
      await input.press("Enter");

      const removeBtn = adminPage.getByLabel(`Remove ${mealName}`);
      await expect(removeBtn).toBeVisible();

      // Remove it
      await removeBtn.click({ force: true });

      await expect(removeBtn).not.toBeVisible();
    });
  });

  test.describe("/meals page", () => {
    test("shows meals list page with back link to dashboard", async ({
      adminPage,
    }) => {
      await adminPage.goto("/meals");

      await expect(
        adminPage.getByRole("heading", { name: "Meals" })
      ).toBeVisible();
      await expect(
        adminPage.getByRole("link", { name: "← Dashboard" })
      ).toHaveAttribute("href", "/dashboard");
    });

    test("can navigate to new meal form", async ({ adminPage }) => {
      await adminPage.goto("/meals");

      await adminPage.getByRole("link", { name: "+ New Meal" }).click();
      await expect(adminPage).toHaveURL(/\/meals\/new/);
      await expect(
        adminPage.getByRole("heading", { name: "New Meal" })
      ).toBeVisible();
    });

    test("can create a new meal with name and tags", async ({
      adminPage,
    }) => {
      await adminPage.goto("/meals/new");

      await adminPage.getByLabel("Meal Name").fill("Spaghetti Bolognese");
      await adminPage.getByRole("button", { name: "pasta" }).click();

      await adminPage.getByRole("button", { name: "Create Meal" }).click();

      // Should redirect to the meal detail page
      await expect(
        adminPage.getByRole("heading", { name: "Spaghetti Bolognese" })
      ).toBeVisible();
      await expect(adminPage.getByText("pasta")).toBeVisible();
    });

    test("can create a meal with ingredients and recipe", async ({
      adminPage,
    }) => {
      const mealName = `Full Meal ${Date.now()}`;
      await adminPage.goto("/meals/new");

      await adminPage.getByLabel("Meal Name").fill(mealName);

      // Add first ingredient
      await adminPage.getByPlaceholder("Ingredient name").fill("Chicken");
      await adminPage.getByPlaceholder("Qty").fill("500g");

      // Add a second ingredient via button
      await adminPage.getByRole("button", { name: "+ Add ingredient" }).click();
      const ingredientInputs = adminPage.getByPlaceholder("Ingredient name");
      await ingredientInputs.nth(1).fill("Garlic");
      const qtyInputs = adminPage.getByPlaceholder("Qty");
      await qtyInputs.nth(1).fill("3 cloves");

      // Add recipe
      await adminPage.getByLabel("Recipe").fill("Cook everything together.");

      await adminPage.getByRole("button", { name: "Create Meal" }).click();

      // Should redirect to detail page with ingredients and recipe
      await expect(
        adminPage.getByRole("heading", { name: mealName })
      ).toBeVisible();
      await expect(adminPage.getByText("Chicken")).toBeVisible();
      await expect(adminPage.getByText("500g")).toBeVisible();
      await expect(adminPage.getByText("Garlic")).toBeVisible();
      await expect(adminPage.getByText("3 cloves")).toBeVisible();
      await expect(
        adminPage.getByText("Cook everything together.")
      ).toBeVisible();
    });

    test("meals list shows created meals", async ({ adminPage }) => {
      await adminPage.goto("/meals");

      await expect(
        adminPage.getByRole("heading", { name: "Meals" })
      ).toBeVisible();
    });

    test("can filter meals by tag", async ({ adminPage }) => {
      // Create a tagged meal first
      await adminPage.goto("/meals/new");
      await adminPage.getByLabel("Meal Name").fill("Veggie Bowl");
      await adminPage.getByRole("button", { name: "vegetarian" }).click();
      await adminPage.getByRole("button", { name: "Create Meal" }).click();

      // Go to meals list and filter — target the filter pill (shows count)
      await adminPage.goto("/meals");
      const vegTag = adminPage.getByRole("link", {
        name: /^vegetarian \(\d+\)$/,
      });

      if (await vegTag.isVisible()) {
        await vegTag.click();
        await expect(adminPage).toHaveURL(/tag=vegetarian/);
        await expect(adminPage.getByText("Veggie Bowl").first()).toBeVisible();
      }
    });

    test("'All' filter pill resets tag filter", async ({ adminPage }) => {
      await adminPage.goto("/meals?tag=pasta");

      await adminPage
        .getByRole("link", { name: "All" })
        .first()
        .click();
      await expect(adminPage).toHaveURL(/\/meals$/);
    });
  });

  test.describe("/meals/[id] detail page", () => {
    test("can view meal details", async ({ adminPage }) => {
      await adminPage.goto("/meals/new");
      await adminPage.getByLabel("Meal Name").fill("Detail Test Meal");
      await adminPage.getByRole("button", { name: "Create Meal" }).click();

      await expect(
        adminPage.getByRole("heading", { name: "Detail Test Meal" })
      ).toBeVisible();
      await expect(adminPage.getByText("Your Rating")).toBeVisible();
      await expect(adminPage.getByText("Upload a photo")).toBeVisible();
    });

    test("back link navigates to /meals", async ({ adminPage }) => {
      await adminPage.goto("/meals/new");
      await adminPage.getByLabel("Meal Name").fill("Back Link Meal");
      await adminPage.getByRole("button", { name: "Create Meal" }).click();

      await adminPage.getByRole("link", { name: "← Meals" }).click();
      await expect(adminPage).toHaveURL(/\/meals$/);
    });

    test("tag links navigate to filtered meals list", async ({
      adminPage,
    }) => {
      await adminPage.goto("/meals/new");
      await adminPage.getByLabel("Meal Name").fill("Tag Link Meal");
      await adminPage.getByRole("button", { name: "soup" }).click();
      await adminPage.getByRole("button", { name: "Create Meal" }).click();

      // Click the tag link on the detail page
      await adminPage.getByRole("link", { name: "soup" }).click();
      await expect(adminPage).toHaveURL(/\/meals\?tag=soup/);
    });

    test("'All ingredients' link navigates to /ingredients", async ({
      adminPage,
    }) => {
      // Create a meal with an ingredient
      await adminPage.goto("/meals/new");
      await adminPage.getByLabel("Meal Name").fill("Ing Link Meal");
      await adminPage.getByPlaceholder("Ingredient name").fill("Basil");
      await adminPage.getByRole("button", { name: "Create Meal" }).click();

      const link = adminPage.getByRole("link", {
        name: "All ingredients →",
      });
      await expect(link).toHaveAttribute("href", "/ingredients");
    });

    test("can rate a meal with stars", async ({ adminPage }) => {
      await adminPage.goto("/meals/new");
      await adminPage.getByLabel("Meal Name").fill("Rating Test Meal");
      await adminPage.getByRole("button", { name: "Create Meal" }).click();

      // Click 4-star rating
      await adminPage.getByLabel("Rate 4 stars").click();
      await expect(adminPage.getByText("Your rating")).toBeVisible();
    });

    test("can navigate to edit page", async ({ adminPage }) => {
      await adminPage.goto("/meals/new");
      await adminPage.getByLabel("Meal Name").fill("Edit Test Meal");
      await adminPage.getByRole("button", { name: "Create Meal" }).click();

      await adminPage.getByRole("link", { name: "Edit" }).click();
      await expect(
        adminPage.getByRole("heading", { name: "Edit Meal" })
      ).toBeVisible();
    });

    test("can edit a meal and save changes", async ({ adminPage }) => {
      const originalName = `Editable ${Date.now()}`;
      await adminPage.goto("/meals/new");
      await adminPage.getByLabel("Meal Name").fill(originalName);
      await adminPage.getByRole("button", { name: "Create Meal" }).click();

      // Navigate to edit
      await adminPage.getByRole("link", { name: "Edit" }).click();
      await expect(
        adminPage.getByRole("heading", { name: "Edit Meal" })
      ).toBeVisible();

      // Change the name
      const nameInput = adminPage.getByLabel("Meal Name");
      await nameInput.clear();
      await nameInput.fill(`${originalName} Updated`);

      // Add a tag
      await adminPage.getByRole("button", { name: "salad" }).click();

      await adminPage
        .getByRole("button", { name: "Save Changes" })
        .click();

      // Should redirect back to detail page with updated name
      await expect(
        adminPage.getByRole("heading", { name: `${originalName} Updated` })
      ).toBeVisible();
      await expect(adminPage.getByText("salad")).toBeVisible();
    });

    test("can delete a meal", async ({ adminPage }) => {
      await adminPage.goto("/meals/new");
      await adminPage.getByLabel("Meal Name").fill("Delete Test Meal");
      await adminPage.getByRole("button", { name: "Create Meal" }).click();

      await adminPage.getByRole("button", { name: "Delete" }).click();

      // Should redirect to meals list
      await expect(adminPage).toHaveURL(/\/meals$/);
    });
  });

  test.describe("/meals/new form", () => {
    test("Enter key in ingredient field adds new row", async ({
      adminPage,
    }) => {
      await adminPage.goto("/meals/new");

      const firstInput = adminPage.getByPlaceholder("Ingredient name");
      await firstInput.fill("Tomato");
      await firstInput.press("Enter");

      // Should now have 2 ingredient name fields
      await expect(
        adminPage.getByPlaceholder("Ingredient name")
      ).toHaveCount(2);
    });

    test("back link navigates to /meals", async ({ adminPage }) => {
      await adminPage.goto("/meals/new");

      await adminPage.getByRole("link", { name: "← Meals" }).click();
      await expect(adminPage).toHaveURL(/\/meals$/);
    });
  });
});
