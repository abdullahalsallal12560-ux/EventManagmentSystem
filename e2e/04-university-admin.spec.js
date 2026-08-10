import { test, expect } from "@playwright/test";
import { loginInteractive, DEMO } from "./helpers.js";

// TC-031, TC-032, TC-033, TC-034, TC-036 are exercised in 00-setup.spec.js
// as part of natural fixture creation (propose -> view pending -> approve /
// reject, create account, assign admin). Only TC-035 is standalone here.
test.describe("04 University Admin — TC-035", () => {
  test("TC-035 View all clubs on the Manage Clubs page", async ({ page }) => {
    await loginInteractive(page, DEMO.uniAdmin.username, DEMO.uniAdmin.password);
    await page.goto("/admin/clubs");
    await expect(page.getByText("Robotics Club")).toBeVisible();
    await expect(page.getByText(/Managed by|No admin/).first()).toBeVisible();
  });
});
