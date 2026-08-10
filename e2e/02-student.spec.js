import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loginInteractive, expectToast, uniqueSuffix } from "./helpers.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_PATH = path.join(__dirname, ".fixtures.json");
// NOT read at module top-level: Playwright imports every spec file during
// its collection phase, before any test (including 00-setup) has actually
// run, so .fixtures.json wouldn't exist yet. Read fresh inside beforeAll.
let fixtures;

test.describe.serial("02 Student — TC-006..TC-021", () => {
  let context, page;

  test.beforeAll(async ({ browser }) => {
    fixtures = JSON.parse(fs.readFileSync(FIXTURES_PATH, "utf8"));
    context = await browser.newContext();
    page = await context.newPage();
    await loginInteractive(page, fixtures.studentA.username, fixtures.password);
  });
  test.afterAll(async () => {
    await context.close();
  });

  test("TC-006 Browse upcoming events on the Discover tab", async () => {
    await page.goto("/student/events");
    await page.getByRole("button", { name: "Upcoming" }).click();
    await expect(page.getByText(fixtures.fullEventTitle)).toBeVisible();
  });

  test("TC-007 Browse past events on the Past tab", async () => {
    await page.goto("/student/events");
    await page.getByRole("button", { name: "Past" }).click();
    // Past tab should render without error; seeded past events exist.
    await expect(page.locator("main")).toBeVisible();
  });

  test("TC-008 Register for an event with open capacity", async () => {
    await page.goto("/student/events");
    await page.getByRole("button", { name: "Upcoming" }).click();
    const card = page.locator("div.rounded-xl.border.overflow-hidden").filter({ hasText: fixtures.fullEventTitle });
    const registerButton = card.getByRole("button", { name: "Register" });
    // Idempotent against a rerun of this file reusing the same fixtures
    // (this exact student may already be registered from a prior pass).
    if (await registerButton.isVisible()) {
      await registerButton.click();
      await expectToast(page, `Registered for ${fixtures.fullEventTitle}`);
    }
    await expect(card.getByRole("button", { name: "Registered ✓" })).toBeVisible();
  });

  test("TC-010 View My Tickets shows a QR code for an upcoming registration", async () => {
    await page.goto("/student/registrations");
    const ticket = page.locator("div.rounded-xl.border.p-5").filter({ hasText: fixtures.fullEventTitle });
    await expect(ticket.getByText("Full Screen")).toBeVisible();
  });

  test("TC-012 Click Join on a club opens the application modal", async () => {
    await page.goto("/student/clubs");
    await page.getByPlaceholder("Search clubs...").fill("Music Society");
    const card = page.locator("div.rounded-xl.border.overflow-hidden").filter({ hasText: "Music Society" });
    // Idempotent against a rerun reusing the same fixtures — this student
    // may already have a pending/approved application to this club.
    if (!(await card.getByRole("button", { name: "Join" }).isVisible())) {
      test.skip(true, "already applied to Music Society in a prior run of this fixture set");
    }
    await card.getByRole("button", { name: "Join" }).click();
    await expect(page.getByText("Apply to join Music Society")).toBeVisible();
  });

  test("TC-013 Submit the club application with all required fields", async () => {
    const modalOpen = await page.getByText("Apply to join Music Society").isVisible();
    if (!modalOpen) {
      test.skip(true, "already applied to Music Society in a prior run of this fixture set");
    }
    // Modal from TC-012 is still open (same page, sequential).
    await page.getByPlaceholder("e.g. 3.4").fill("3.2");
    await page.getByPlaceholder("e.g. 90").fill("75");
    await page.getByPlaceholder("e.g. Computer Engineering").fill("Software Engineering");
    await page.getByPlaceholder("e.g. Faculty of Engineering").fill("Faculty of Information Technology");
    await page.getByPlaceholder("Type a skill and press Enter").fill("JavaScript");
    await page.getByPlaceholder("Type a skill and press Enter").press("Enter");
    await page.getByText("Weekday Evenings").click();
    await page.getByPlaceholder("A few sentences about your motivation...").fill(
      `QA automated application from ${fixtures.studentA.name}.`
    );
    await page.getByRole("button", { name: "Submit application" }).click();
    await expectToast(page, "Application submitted to Music Society");
  });

  test("TC-014 Submit the club application with an invalid field fails validation", async () => {
    await page.goto("/student/clubs");
    await page.getByPlaceholder("Search clubs...").fill("Debate Club");
    const card = page.locator("div.rounded-xl.border.overflow-hidden").filter({ hasText: "Debate Club" });
    await card.getByRole("button", { name: "Join" }).click();
    await expect(page.getByText("Apply to join Debate Club")).toBeVisible();

    // GPA has a native max="4" HTML attribute, so an out-of-range value
    // would be caught by browser constraint validation before the custom
    // React validator ever runs. Leaving a required field (Major) empty
    // instead exercises the same "submission blocked" behavior via the
    // browser's own native required-field validation — still a real,
    // user-facing validation failure.
    await page.getByPlaceholder("e.g. 3.4").fill("3.0");
    await page.getByPlaceholder("e.g. 90").fill("60");
    await page.getByPlaceholder("e.g. Faculty of Engineering").fill("Test Faculty");
    await page.getByPlaceholder("A few sentences about your motivation...").fill("Testing missing-major validation.");
    await page.getByRole("button", { name: "Submit application" }).click();

    const majorInput = page.getByPlaceholder("e.g. Computer Engineering");
    const isValid = await majorInput.evaluate((el) => el.validity.valid);
    expect(isValid, "empty required Major field should be flagged invalid by the browser").toBe(false);
    // Modal must still be open — submission was blocked, not silently accepted.
    await expect(page.getByText("Apply to join Debate Club")).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
  });

  test("TC-015 View My History page", async () => {
    await page.goto("/student/history");
    await expect(page.locator("main")).toBeVisible();
  });

  test("TC-016 View an Event Detail page", async () => {
    await page.goto(`/event/${fixtures.fullEventId}`);
    await expect(page.getByRole("heading", { name: fixtures.fullEventTitle })).toBeVisible();
    await expect(page.getByText("Questions & Comments")).toBeVisible();
  });

  test("TC-017 View a Club Profile page", async () => {
    await page.goto("/student/clubs");
    await page.getByPlaceholder("Search clubs...").fill("Robotics Club");
    await page.getByText("Robotics Club", { exact: true }).first().click();
    await expect(page.getByRole("heading", { name: "Robotics Club" })).toBeVisible();
    await expect(page.getByText(/member/)).toBeVisible();
  });

  test("TC-018 Post a question on an Event Detail page", async () => {
    const questionText = `QA automated question ${uniqueSuffix()}`;
    await page.goto(`/event/${fixtures.fullEventId}`);
    await page.locator("textarea").fill(questionText);
    await page.getByRole("button", { name: "Submit" }).click();
    await expectToast(page, "Question posted.");
    await expect(page.getByText(questionText)).toBeVisible();
    fixtures.postedQuestionText = questionText;
    fs.writeFileSync(FIXTURES_PATH, JSON.stringify(fixtures, null, 2));
  });

  test("TC-019 Use global search to find an event", async () => {
    await page.goto("/dashboard");
    await page.getByPlaceholder("Search events and clubs...").first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByPlaceholder("Search events and clubs...").fill(fixtures.fullEventTitle);
    await expect(dialog.getByText("Events", { exact: true })).toBeVisible();
    await expect(dialog.getByRole("button", { name: new RegExp(fixtures.fullEventTitle) })).toBeVisible();
  });

  test("TC-020 Use global search to find a club", async () => {
    await page.goto("/dashboard");
    await page.getByPlaceholder("Search events and clubs...").first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByPlaceholder("Search events and clubs...").fill("Robotics Club");
    await expect(dialog.getByText("Clubs", { exact: true })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Robotics Club", exact: true })).toBeVisible();
  });

  test("TC-021 Toggle dark/light mode from the top bar", async () => {
    await page.goto("/dashboard");
    const before = await page.locator("html").getAttribute("data-theme");
    await page.locator('[data-tour="theme-toggle"]').click();
    await expect
      .poll(async () => page.locator("html").getAttribute("data-theme"))
      .not.toBe(before);
  });
});

test.describe.serial("02b Student — TC-009 (separate account, second side of the full-event scenario)", () => {
  test("TC-009 Registration is blocked once an event reaches capacity", async ({ browser }) => {
    if (!fixtures) fixtures = JSON.parse(fs.readFileSync(FIXTURES_PATH, "utf8"));
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginInteractive(page, fixtures.studentB.username, fixtures.password);

    await page.goto("/student/events");
    await page.getByRole("button", { name: "Upcoming" }).click();
    const card = page.locator("div.rounded-xl.border.overflow-hidden").filter({ hasText: fixtures.fullEventTitle });
    const fullButton = card.getByRole("button", { name: "Event Full" });
    await expect(fullButton).toBeVisible();
    await expect(fullButton).toBeDisabled();

    await context.close();
  });
});
