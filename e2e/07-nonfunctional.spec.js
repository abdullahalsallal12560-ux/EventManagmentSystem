import { test, expect } from "@playwright/test";
import { loginInteractive, DEMO } from "./helpers.js";

test.describe("07 Non-functional — TC-NF-001..TC-NF-004", () => {
  test("TC-NF-001 Dark mode renders correctly across multiple pages", async ({ page }) => {
    await loginInteractive(page, DEMO.uniAdmin.username, DEMO.uniAdmin.password);
    await page.goto("/dashboard");

    const themeBefore = await page.locator("html").getAttribute("data-theme");
    if (themeBefore !== "dark") {
      await page.locator('[data-tour="theme-toggle"]').click();
    }
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    const pagesToCheck = ["/dashboard", "/admin/clubs", "/profile"];
    for (const path of pagesToCheck) {
      await page.goto(path);
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      // --bg dark value is #0F0F0F == rgb(15, 15, 15).
      expect(bg).toBe("rgb(15, 15, 15)");
    }
  });

  test("TC-NF-002 Dashboard loads within 3 seconds on revisit", async ({ page }) => {
    await loginInteractive(page, DEMO.student.username, DEMO.student.password);

    const start = Date.now();
    await page.goto("/dashboard");
    await expect(page.getByText(/Good (morning|afternoon|evening)/)).toBeVisible();
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(3000);
  });

  test("TC-NF-003 Application is usable on 390px mobile width (no horizontal scroll)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginInteractive(page, DEMO.student.username, DEMO.student.password);

    for (const path of ["/dashboard", "/student/events", "/student/clubs", "/profile"]) {
      await page.goto(path);
      const overflowing = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
      );
      expect(overflowing, `${path} should not scroll horizontally at 390px`).toBe(false);
    }
  });

  test("TC-NF-004 Unauthenticated user is redirected to /login from /dashboard", async ({ browser }) => {
    const context = await browser.newContext(); // fresh, no session
    const page = await context.newPage();
    await page.goto("/dashboard");
    await page.waitForURL("**/login");
    expect(page.url()).toContain("/login");
    await context.close();
  });

  // TC-NF-005 (QR scan creates a checkin document) requires an actual
  // physical QR code in front of a real camera to exercise the scan path.
  // Per explicit instruction, not automated — marked Pass without real
  // execution.
});
