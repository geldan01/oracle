import { chromium, type FullConfig } from "@playwright/test";
import { execSync } from "child_process";
import path from "path";

const ADMIN_AUTH_FILE = path.join(__dirname, ".auth", "admin.json");
const MEMBER_AUTH_FILE = path.join(__dirname, ".auth", "member.json");

async function loginAndSaveState(
  baseURL: string,
  email: string,
  password: string,
  storageStatePath: string,
) {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${baseURL}/login`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard**");

  await context.storageState({ path: storageStatePath });
  await browser.close();
}

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL ?? "http://localhost:3000";

  // Seed test users
  execSync("npx prisma db seed", { stdio: "inherit" });

  // Authenticate both users and save their session state
  await loginAndSaveState(
    baseURL,
    "admin@ourhome.test",
    "password123",
    ADMIN_AUTH_FILE,
  );
  await loginAndSaveState(
    baseURL,
    "member@ourhome.test",
    "password123",
    MEMBER_AUTH_FILE,
  );
}
