import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loginInteractive, DEMO, expectToast, uniqueSuffix } from "./helpers.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_PATH = path.join(__dirname, ".fixtures.json");

test.describe("06a Facility Manager — TC-041, TC-042", () => {
  test("TC-041 View venues list on the dashboard", async ({ page }) => {
    await loginInteractive(page, DEMO.facManager.username, DEMO.facManager.password);
    await page.goto("/dashboard");
    await expect(page.locator('[data-tour="venues-section"]')).toBeVisible();
    await expect(page.locator('[data-tour="venues-section"]').getByText("Capacity:").first()).toBeVisible();
  });

  test("TC-042 View upcoming venue reservations on the dashboard", async ({ page }) => {
    await loginInteractive(page, DEMO.facManager.username, DEMO.facManager.password);
    await page.goto("/dashboard");
    await expect(page.locator('[data-tour="reservations-section"]')).toBeVisible();
  });
});

test.describe.serial("06b Profile — TC-043, TC-044, TC-045 (throwaway QA Student A account)", () => {
  let context, page, fixtures;

  test.beforeAll(async ({ browser }) => {
    fixtures = JSON.parse(fs.readFileSync(FIXTURES_PATH, "utf8"));
    context = await browser.newContext();
    page = await context.newPage();
    await loginInteractive(page, fixtures.studentA.username, fixtures.password);
    await page.goto("/profile");
  });
  test.afterAll(async () => {
    await context.close();
  });

  test("TC-043 Update bio text and save", async () => {
    const bioText = `QA automated bio ${uniqueSuffix()}`;
    await page.locator("textarea").fill(bioText);
    await page.getByRole("button", { name: "Save bio" }).click();
    await expectToast(page, "Bio saved.");
  });

  test("TC-044 Add an interest tag and save interests", async () => {
    const tag = `QA-Tag-${uniqueSuffix()}`;
    await page.getByPlaceholder("Type an interest and press Enter").fill(tag);
    await page.getByPlaceholder("Type an interest and press Enter").press("Enter");
    await expect(page.getByText(tag)).toBeVisible();
    await page.getByRole("button", { name: "Save interests" }).click();
    await expectToast(page, "Interests saved.");
  });

  test("TC-045 Change password with a valid, matching new password", async () => {
    const newPassword = "qa12345";
    await page.getByPlaceholder("At least 4 characters").fill(newPassword);
    await page.getByPlaceholder("Repeat password").fill(newPassword);
    await page.getByRole("button", { name: "Update password" }).click();
    await expectToast(page, "Password updated.");
  });
});
