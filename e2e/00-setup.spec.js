import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loginInteractive, DEMO, uniqueSuffix, expectToast } from "./helpers.js";
import { findEventByTitle, setEventMaxAttendees } from "./firestoreAdmin.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_PATH = path.join(__dirname, ".fixtures.json");
const SUFFIX = uniqueSuffix();

const fixtures = {
  suffix: SUFFIX,
  studentA: { name: `QA Student A ${SUFFIX}`, username: `qa_a_${SUFFIX}` },
  studentB: { name: `QA Student B ${SUFFIX}`, username: `qa_b_${SUFFIX}` },
  studentC: { name: `QA Student C ${SUFFIX}`, username: `qa_c_${SUFFIX}` },
  studentD: { name: `QA Student D ${SUFFIX}`, username: `qa_d_${SUFFIX}` },
  qaClubAdminUsername: `qa_admin_${SUFFIX}`,
  qaClubName: `QA Club ${SUFFIX}`,
  fullEventTitle: `QA Full Event ${SUFFIX}`,
  rejectEventTitle: `QA Reject Event ${SUFFIX}`,
  rejectFeedback: `QA automated rejection feedback ${SUFFIX} — please revise and resubmit.`,
  password: "12345",
};

test.describe.serial("00 setup — fixture creation (also real tests for TC-034, TC-036, TC-022, TC-031, TC-032, TC-033)", () => {
  test("TC-034 University Admin creates a new user account", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginInteractive(page, DEMO.uniAdmin.username, DEMO.uniAdmin.password);

    await page.goto("/admin/users");
    await page.getByRole("button", { name: "Add account" }).click();
    await page.getByPlaceholder("Student or staff name").fill(fixtures.studentA.name);
    await page.getByPlaceholder(/university ID for students/).fill(fixtures.studentA.username);
    await page.getByRole("button", { name: "Create account" }).click();
    await expectToast(page, "Account created for");
    await expect(page.getByText(fixtures.studentA.name, { exact: true })).toBeVisible();

    // Fixture-only (not separately asserted as its own TC): students B, C, D.
    for (const student of [fixtures.studentB, fixtures.studentC, fixtures.studentD]) {
      await page.getByRole("button", { name: "Add account" }).click();
      await page.getByPlaceholder("Student or staff name").fill(student.name);
      await page.getByPlaceholder(/university ID for students/).fill(student.username);
      await page.getByRole("button", { name: "Create account" }).click();
      await expectToast(page, "Account created for");
    }

    await context.close();
  });

  test("TC-036 University Admin assigns an admin to an unassigned club", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginInteractive(page, DEMO.uniAdmin.username, DEMO.uniAdmin.password);

    // 1. Create a club with no admin.
    await page.goto("/admin/clubs");
    await page.getByPlaceholder("Club name", { exact: true }).fill(fixtures.qaClubName);
    await page.getByRole("button", { name: "Add club" }).click();
    await expectToast(page, `Club "${fixtures.qaClubName}" created.`);
    const clubRow = page.locator("div.rounded-xl.border.p-4").filter({ hasText: fixtures.qaClubName });
    await expect(clubRow.getByText("No admin")).toBeVisible();

    // 2. Create a Club Admin account and assign it to that club.
    await page.goto("/admin/users");
    await page.getByRole("button", { name: "Add account" }).click();
    await page.getByPlaceholder("Student or staff name").fill(`QA Club Admin ${SUFFIX}`);
    await page.getByPlaceholder(/university ID for students/).fill(fixtures.qaClubAdminUsername);
    await page.locator("select").first().selectOption("club_admin");
    await page.locator("select").nth(1).selectOption({ label: fixtures.qaClubName });
    await page.getByRole("button", { name: "Create account" }).click();
    await expectToast(page, "Account created for");

    // 3. Verify the club now shows that admin as manager.
    await page.goto("/admin/clubs");
    const updatedRow = page.locator("div.rounded-xl.border.p-4").filter({ hasText: fixtures.qaClubName });
    await expect(updatedRow.getByText(`Managed by QA Club Admin ${SUFFIX}`)).toBeVisible();

    await context.close();
  });

  test("TC-022 Club Admin proposes new events", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginInteractive(page, DEMO.clubAdmin.username, DEMO.clubAdmin.password);

    await page.goto("/club/propose-event");
    const futureDate = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);
    const form = page.locator("form");

    // Event 1: to be approved, then its capacity is shrunk directly in
    // Firestore afterward (form enforces maxAttendees >= 10) so the
    // "register for a full event" scenario (TC-009) is reachable with just
    // 2 students instead of 10 real registrations.
    await form.locator('input[type="text"]').first().fill(fixtures.fullEventTitle);
    await form.locator("textarea").fill("QA automated test event — full capacity scenario.");
    await form.locator('input[type="date"]').fill(futureDate);
    await form.locator('input[type="number"]').fill("10");
    await page.getByRole("button", { name: "Submit for approval" }).click();
    await expectToast(page, "Event submitted for approval.");
    await expect(page.getByText(fixtures.fullEventTitle)).toBeVisible();

    // Event 2: to be rejected with feedback.
    await form.locator('input[type="text"]').first().fill(fixtures.rejectEventTitle);
    await form.locator("textarea").fill("QA automated test event — rejection scenario.");
    await form.locator('input[type="date"]').fill(futureDate);
    await form.locator('input[type="number"]').fill("10");
    await page.getByRole("button", { name: "Submit for approval" }).click();
    await expect(page.getByText(fixtures.rejectEventTitle)).toBeVisible();

    await context.close();
  });

  test("TC-031 University Admin views pending event proposals", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginInteractive(page, DEMO.uniAdmin.username, DEMO.uniAdmin.password);

    await page.goto("/admin/events");
    await page.getByRole("button", { name: "Pending" }).click();
    await expect(page.getByText(fixtures.fullEventTitle)).toBeVisible();
    await expect(page.getByText(fixtures.rejectEventTitle)).toBeVisible();

    await context.close();
  });

  test("TC-032 University Admin approves an event proposal", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginInteractive(page, DEMO.uniAdmin.username, DEMO.uniAdmin.password);

    await page.goto("/admin/events");
    await page.getByRole("button", { name: "Pending" }).click();
    const card = page.locator("div.rounded-xl.border.p-4").filter({ hasText: fixtures.fullEventTitle });
    await card.getByRole("button", { name: "Approve" }).click();
    await expectToast(page, `Approved "${fixtures.fullEventTitle}"`);

    await page.getByRole("button", { name: "Approved" }).click();
    await expect(
      page.locator("div.rounded-xl.border.p-4").filter({ hasText: fixtures.fullEventTitle }).first()
    ).toBeVisible();

    await context.close();
  });

  test("TC-033 University Admin rejects an event proposal with feedback", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginInteractive(page, DEMO.uniAdmin.username, DEMO.uniAdmin.password);

    await page.goto("/admin/events");
    await page.getByRole("button", { name: "Pending" }).click();
    const card = page.locator("div.rounded-xl.border.p-4").filter({ hasText: fixtures.rejectEventTitle });
    await card.locator("textarea").fill(fixtures.rejectFeedback);
    await card.getByRole("button", { name: "Reject" }).click();
    await expectToast(page, `Rejected "${fixtures.rejectEventTitle}"`);

    await page.getByRole("button", { name: "Rejected" }).click();
    await expect(
      page.locator("div.rounded-xl.border.p-4").filter({ hasText: fixtures.rejectEventTitle }).first()
    ).toBeVisible();

    await context.close();
  });

  test("fixture: shrink QA Full Event capacity to 1 (direct Firestore, precondition for TC-009)", async () => {
    const event = await findEventByTitle(fixtures.fullEventTitle);
    expect(event).not.toBeNull();
    await setEventMaxAttendees(event.id, 1);
    fixtures.fullEventId = event.id;
  });

  test("fixture: students C and D request to join Robotics Club", async ({ browser }) => {
    for (const student of [fixtures.studentC, fixtures.studentD]) {
      const context = await browser.newContext();
      const page = await context.newPage();
      await loginInteractive(page, student.username, fixtures.password);

      await page.goto("/student/clubs");
      await page.getByPlaceholder("Search clubs...").fill("Robotics Club");
      const card = page.locator("div.rounded-xl.border.overflow-hidden").filter({ hasText: "Robotics Club" });
      await card.getByRole("button", { name: "Join" }).click();

      await page.getByPlaceholder("e.g. 3.4").fill("3.5");
      await page.getByPlaceholder("e.g. 90").fill("90");
      await page.getByPlaceholder("e.g. Computer Engineering").fill("Computer Science");
      await page.getByPlaceholder("e.g. Faculty of Engineering").fill("Faculty of Information Technology");
      await page.getByPlaceholder("Type a skill and press Enter").fill("Python");
      await page.getByPlaceholder("Type a skill and press Enter").press("Enter");
      await page.getByPlaceholder("A few sentences about your motivation...").fill(`QA automated application from ${student.name}.`);
      await page.getByRole("button", { name: "Submit application" }).click();
      await expectToast(page, "Application submitted to Robotics Club");

      await context.close();
    }

    fs.writeFileSync(FIXTURES_PATH, JSON.stringify(fixtures, null, 2));
  });
});
