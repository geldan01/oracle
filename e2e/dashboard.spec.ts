import { test, expect } from "./fixtures";

test.describe("Dashboard", () => {
  test("displays the Our Home heading and widgets", async ({ adminPage }) => {
    await adminPage.goto("/dashboard");

    await expect(
      adminPage.getByRole("heading", { name: "Our Home" })
    ).toBeVisible();

    await expect(adminPage.getByText("Shared Todos")).toBeVisible();
    await expect(adminPage.getByText("TV Shows")).toBeVisible();
    await expect(adminPage.getByText("Meal Planner")).toBeVisible();
    await expect(adminPage.getByText("Weather")).toBeVisible();
    await expect(adminPage.getByText("Projects")).toBeVisible();
  });

  test("shows welcome message with user name", async ({ adminPage }) => {
    await adminPage.goto("/dashboard");

    await expect(adminPage.getByText(/Welcome back/)).toBeVisible();
  });

  test("admin sees the Admin button", async ({ adminPage }) => {
    await adminPage.goto("/dashboard");

    await expect(
      adminPage.getByRole("link", { name: "Admin" })
    ).toBeVisible();
  });

  test("member does not see the Admin button", async ({ memberPage }) => {
    await memberPage.goto("/dashboard");

    await expect(
      memberPage.getByRole("link", { name: "Admin" })
    ).not.toBeVisible();
  });

  test("todos widget links to /dashboard/todos", async ({ adminPage }) => {
    await adminPage.goto("/dashboard");

    const todosWidget = adminPage.getByRole("link", { name: /Shared Todos/ });
    await expect(todosWidget).toHaveAttribute("href", "/dashboard/todos");
  });

  test("root page redirects authenticated user to dashboard", async ({
    adminPage,
  }) => {
    await adminPage.goto("/");
    await expect(adminPage).toHaveURL(/\/dashboard/);
  });

  test("root page redirects unauthenticated user to login", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });
});
