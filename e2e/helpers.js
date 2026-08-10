import { expect } from "@playwright/test";

// Performs the REAL two-step login flow (credentials -> SMS OTP) against
// the live app. Reads the OTP code straight out of the on-screen
// SmsOtpToast (the app displays it there for the demo — there's no real
// SMS gateway), so this is a genuine end-to-end run of the actual auth
// code path, not a shortcut/mock.
export async function loginInteractive(page, username, password) {
  await page.goto("/login");
  await page.getByPlaceholder("e.g. 220101").fill(username);
  await page.getByPlaceholder("••••••••").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  const codeLocator = page.locator('[role="alert"] p.tracking-widest');
  await expect(codeLocator).toBeVisible({ timeout: 10_000 });
  const code = (await codeLocator.textContent()).trim();

  await page.getByPlaceholder("6-digit code").fill(code);
  await page.getByRole("button", { name: "Verify & sign in" }).click();
  await page.waitForURL("**/dashboard", { timeout: 10_000 });

  // Every login lands on /dashboard, which auto-opens the onboarding tour
  // on this browser context's first-ever visit (fresh localStorage every
  // test run). The tour is its own role="dialog" full-viewport overlay —
  // left open, it collides with other dialog locators (e.g. global search)
  // and its click-catcher can silently swallow clicks on the real page
  // underneath. Dismiss it once here so every spec starts from a clean
  // dashboard; Dashboard.jsx persists "onboarding_done_<userId>" to
  // localStorage so it won't re-trigger for the rest of this context.
  const skipTour = page.getByRole("button", { name: "Skip tour" });
  if (await skipTour.isVisible().catch(() => false)) {
    await skipTour.click();
  }
}

export async function loginAsRole(browser, username, password) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await loginInteractive(page, username, password);
  return { context, page };
}

export function toastLocator(page) {
  // ToastContext renders toasts as role="alert" too, same as the OTP
  // toasts, but in the fixed top-right stack — scope by container class.
  return page.locator(".fixed.top-4.right-4 [role='alert']");
}

export async function expectToast(page, textFragment) {
  const toast = toastLocator(page).filter({ hasText: textFragment });
  await expect(toast.first()).toBeVisible({ timeout: 10_000 });
}

export const DEMO = {
  student: { username: "220101", password: "12345" },
  clubAdmin: { username: "club_admin", password: "12345" },
  uniAdmin: { username: "uni_admin", password: "12345" },
  eventStaff: { username: "event_staff", password: "12345" },
  facManager: { username: "fac_manager", password: "12345" },
};

export function uniqueSuffix() {
  return `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}
