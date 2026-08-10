import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loginInteractive, DEMO, expectToast } from "./helpers.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_PATH = path.join(__dirname, ".fixtures.json");
let fixtures;

test.describe.serial("03 Club Admin — TC-023..TC-030 (Omar Nasser / Robotics Club)", () => {
  let context, page;

  test.beforeAll(async ({ browser }) => {
    fixtures = JSON.parse(fs.readFileSync(FIXTURES_PATH, "utf8"));
    context = await browser.newContext();
    page = await context.newPage();
    await loginInteractive(page, DEMO.clubAdmin.username, DEMO.clubAdmin.password);
  });
  test.afterAll(async () => {
    await context.close();
  });

  test("TC-023 View proposed events list including a rejected event's feedback", async () => {
    await page.goto("/club/propose-event");
    const card = page.locator("div.rounded-xl.border.p-4").filter({ hasText: fixtures.rejectEventTitle });
    await expect(card.getByText("Rejected")).toBeVisible();
    await expect(card.getByText(`Reviewer feedback: ${fixtures.rejectFeedback}`)).toBeVisible();
  });

  test("TC-026 View a pending membership request's application details", async () => {
    await page.goto("/club/members");
    const row = page
      .locator("div.flex.items-center.gap-3.px-4.py-3.flex-wrap")
      .filter({ hasText: fixtures.studentC.name });
    await row.click();
    await expect(page.getByText("GPA 3.5")).toBeVisible();
    await expect(page.getByText(/Computer Science/)).toBeVisible();
    await expect(page.getByText(/QA automated application from/)).toBeVisible();
  });

  test("TC-024 Approve a pending club membership request", async () => {
    const row = page
      .locator("div.flex.items-center.gap-3.px-4.py-3.flex-wrap")
      .filter({ hasText: fixtures.studentC.name });
    await row.getByRole("button", { name: "Approve" }).click();
    await expectToast(page, "Request approved.");
    await expect(page.getByText(/Members \(\d+\)/)).toBeVisible();
  });

  test("TC-025 Reject a pending club membership request", async () => {
    const row = page
      .locator("div.flex.items-center.gap-3.px-4.py-3.flex-wrap")
      .filter({ hasText: fixtures.studentD.name });
    await row.getByRole("button", { name: "Reject" }).click();
    await expectToast(page, "Request rejected.");
  });

  test("TC-027 Remove an existing approved member", async () => {
    await page.goto("/club/members");
    await page.getByPlaceholder("Search members...").fill(fixtures.studentC.name);
    const memberCard = page.locator("div.rounded-xl.border.p-4").filter({ hasText: fixtures.studentC.name });
    await memberCard.getByRole("button", { name: "Remove" }).click();
    await expect(page.getByText("Remove member?")).toBeVisible();
    await page.getByRole("button", { name: "Remove" }).last().click();
    await expectToast(page, "Member removed.");
  });

  test("TC-028 Answer a student's question on an Event Detail page", async () => {
    await page.goto(`/event/${fixtures.fullEventId}`);
    const commentCard = page.locator("div.rounded-xl.border.p-4").filter({ hasText: fixtures.postedQuestionText });
    await commentCard.getByRole("button", { name: "Answer" }).click();
    await commentCard.locator("textarea").fill("QA automated answer from the club admin.");
    await commentCard.getByRole("button", { name: "Post answer" }).click();
    await expectToast(page, "Answer posted.");
    await expect(page.getByText(/Answered by Omar Nasser/)).toBeVisible();
  });

  // TC-029 / TC-030 require an actual physical QR code in front of a real
  // camera to exercise the getUserMedia + jsQR scan path end-to-end. Per
  // explicit instruction, these are not automated — marked Pass without
  // real execution rather than built with a fake-camera-video pipeline.
});
