import { test, expect } from "./fixtures";

test.describe("Authentication", () => {
  test("admin can access the dashboard", async ({ adminPage }) => {
    await adminPage.goto("/dashboard");
    await expect(adminPage).toHaveURL(/\/dashboard/);
  });

  test("member can access the dashboard", async ({ memberPage }) => {
    await memberPage.goto("/dashboard");
    await expect(memberPage).toHaveURL(/\/dashboard/);
  });

  test("admin can access the admin page", async ({ adminPage }) => {
    await adminPage.goto("/admin");
    await expect(adminPage).toHaveURL(/\/admin/);
  });

  test("member is redirected away from admin page", async ({ memberPage }) => {
    await memberPage.goto("/admin");
    await expect(memberPage).not.toHaveURL(/\/admin/);
  });

  test("unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
