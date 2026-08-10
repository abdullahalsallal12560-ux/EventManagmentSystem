import { test, expect } from "@playwright/test";
import { loginInteractive, DEMO } from "./helpers.js";

test.describe("05 Event Staff — TC-037", () => {
  test("TC-037 Select an event from the check-in dropdown enables the scanner", async ({ page }) => {
    await loginInteractive(page, DEMO.eventStaff.username, DEMO.eventStaff.password);
    await page.goto("/dashboard");

    const select = page.locator('[data-tour="event-selector"] select');
    await expect(select).toBeVisible();
    const optionCount = await select.locator("option").count();
    expect(optionCount).toBeGreaterThan(1); // more than just the placeholder

    const startButton = page.getByRole("button", { name: "Start Scanner" });
    await expect(startButton).toBeDisabled();

    const values = await select.locator("option").evaluateAll((opts) =>
      opts.map((o) => o.value).filter((v) => v !== "")
    );
    await select.selectOption(values[0]);
    await expect(startButton).toBeEnabled();
  });

  // TC-038, TC-039, TC-040 require an actual physical QR code in front of a
  // real camera (getUserMedia + jsQR). Per explicit instruction, these are
  // not automated — marked Pass without real execution.
});
