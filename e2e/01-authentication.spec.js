import { test, expect } from "@playwright/test";
import { DEMO } from "./helpers.js";

test.describe("01 Authentication — TC-001..TC-005", () => {
  test("TC-001 Login with valid student credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("e.g. 220101").fill(DEMO.student.username);
    await page.getByPlaceholder("••••••••").fill(DEMO.student.password);
    await page.getByRole("button", { name: "Sign in" }).click();

    const codeLocator = page.locator('[role="alert"] p.tracking-widest');
    await expect(codeLocator).toBeVisible();
    const code = (await codeLocator.textContent()).trim();
    await page.getByPlaceholder("6-digit code").fill(code);
    await page.getByRole("button", { name: "Verify & sign in" }).click();

    await page.waitForURL("**/dashboard");
    await expect(page.getByText("Student", { exact: true })).toBeVisible();
  });

  test("TC-002 Login with invalid password", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("e.g. 220101").fill(DEMO.student.username);
    await page.getByPlaceholder("••••••••").fill("wrong-password-123");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("Incorrect username or password.")).toBeVisible();
    expect(page.url()).toContain("/login");
    await expect(page.getByPlaceholder("6-digit code")).toHaveCount(0);
  });

  test("TC-003 Login with a non-existent username", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("e.g. 220101").fill(`no_such_user_${Date.now()}`);
    await page.getByPlaceholder("••••••••").fill("12345");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("Incorrect username or password.")).toBeVisible();
    expect(page.url()).toContain("/login");
  });

  test("TC-004 OTP verification flow rejects a wrong code and accepts the correct one", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("e.g. 220101").fill(DEMO.student.username);
    await page.getByPlaceholder("••••••••").fill(DEMO.student.password);
    await page.getByRole("button", { name: "Sign in" }).click();

    const codeLocator = page.locator('[role="alert"] p.tracking-widest');
    await expect(codeLocator).toBeVisible();
    const realCode = (await codeLocator.textContent()).trim();
    const wrongCode = realCode === "000000" ? "111111" : "000000";

    await page.getByPlaceholder("6-digit code").fill(wrongCode);
    await page.getByRole("button", { name: "Verify & sign in" }).click();
    await expect(page.getByText("Incorrect code. Check the SMS notification and try again.")).toBeVisible();
    expect(page.url()).toContain("/login");

    await page.getByPlaceholder("6-digit code").fill(realCode);
    await page.getByRole("button", { name: "Verify & sign in" }).click();
    await page.waitForURL("**/dashboard");
  });

  test("TC-005 Logout from a logged-in session", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("e.g. 220101").fill(DEMO.student.username);
    await page.getByPlaceholder("••••••••").fill(DEMO.student.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    const codeLocator = page.locator('[role="alert"] p.tracking-widest');
    await expect(codeLocator).toBeVisible();
    const code = (await codeLocator.textContent()).trim();
    await page.getByPlaceholder("6-digit code").fill(code);
    await page.getByRole("button", { name: "Verify & sign in" }).click();
    await page.waitForURL("**/dashboard");

    // First-ever dashboard visit in this fresh context auto-opens the
    // onboarding tour, whose full-viewport click-catcher would otherwise
    // swallow the clicks below.
    const skipTour = page.getByRole("button", { name: "Skip tour" });
    if (await skipTour.isVisible().catch(() => false)) {
      await skipTour.click();
    }

    await page.locator("header button[aria-label='Account menu']").click();
    await page.getByRole("button", { name: "Sign out" }).click();
    await page.waitForURL("**/login");
    expect(page.url()).toContain("/login");
  });
});
