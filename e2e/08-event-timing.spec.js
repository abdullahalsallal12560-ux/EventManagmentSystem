// Regression tests for the past-event registration bug.
//
// The defect: registerForEvent() and the Register button on the event detail
// page had no date check at all, so a student could register for an event
// whose date had already passed. The ticket view *did* compare against the
// current date, so the resulting ticket immediately rendered as "Missed".
//
// These tests cover the three cases named in the fix:
//   TC-046  registering for a past event must be rejected
//   TC-047  an event happening today must still be registerable
//   TC-048  a ticket for a valid future registration must not read "Missed"

import { test, expect } from "@playwright/test";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, deleteDoc, getDocs, collection, query, where } from "firebase/firestore";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loginInteractive, DEMO } from "./helpers.js";

// The Playwright runner does not load .env the way Vite does for the app, so
// the fixture writes below would otherwise hit an unconfigured Firebase app
// and hang. Parse it here instead of adding a dependency.
const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".env");
const env = Object.fromEntries(
  fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.trim().startsWith("#") && line.includes("="))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
    })
);

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig, "timing-spec");
const db = getFirestore(app);

// Same Asia/Amman calculation the application uses, so the fixtures line up
// with what the app considers "today" rather than with the runner's own clock.
function campusDate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Amman",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

const suffix = `${Date.now()}`;
const PAST_EVENT_ID = `evt_timing_past_${suffix}`;
const TODAY_EVENT_ID = `evt_timing_today_${suffix}`;
const FUTURE_EVENT_ID = `evt_timing_future_${suffix}`;
const createdRegistrationIds = [];

async function makeEvent(id, proposedDate, title) {
  const clubs = await getDocs(collection(db, "clubs"));
  const club = clubs.docs[0];
  await setDoc(doc(db, "events", id), {
    clubId: club.id,
    title,
    description: "Fixture created by the event-timing regression suite.",
    proposedDate,
    status: "approved",
    createdBy: "u2",
    imageUrl: "https://picsum.photos/seed/timing-fixture/400/250",
    startTime: "10:00",
    endTime: "12:00",
    location: "Fixture Hall",
    maxAttendees: 50,
    attendeeCount: 0,
  });
}

test.describe.serial("08 Event timing - past-event registration guard", () => {
  test.beforeAll(async () => {
    await makeEvent(PAST_EVENT_ID, campusDate(-7), `TIMING Past Event ${suffix}`);
    await makeEvent(TODAY_EVENT_ID, campusDate(0), `TIMING Today Event ${suffix}`);
    await makeEvent(FUTURE_EVENT_ID, campusDate(14), `TIMING Future Event ${suffix}`);
  });

  test.afterAll(async () => {
    for (const id of createdRegistrationIds) {
      await deleteDoc(doc(db, "registrations", id)).catch(() => {});
    }
    for (const id of [PAST_EVENT_ID, TODAY_EVENT_ID, FUTURE_EVENT_ID]) {
      await deleteDoc(doc(db, "events", id)).catch(() => {});
    }
  });

  test("TC-046 A past event shows no Register button and cannot be registered for", async ({ page }) => {
    await loginInteractive(page, DEMO.student.username, DEMO.student.password);
    await page.goto(`/event/${PAST_EVENT_ID}`);

    // The CTA must be replaced by the closed-registration message.
    await expect(
      page.getByText("This event has already taken place, so registration is closed.")
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Register" })).toHaveCount(0);

    // And no registration document may exist for this student on that event.
    const regs = await getDocs(
      query(collection(db, "registrations"), where("eventId", "==", PAST_EVENT_ID))
    );
    expect(regs.size).toBe(0);
  });

  test("TC-047 An event happening today is still open for registration", async ({ page }) => {
    await loginInteractive(page, DEMO.student.username, DEMO.student.password);
    await page.goto(`/event/${TODAY_EVENT_ID}`);

    const registerButton = page.getByRole("button", { name: "Register" });
    await expect(registerButton).toBeVisible();
    await registerButton.click();
    await expect(page.getByText("Registered ✓")).toBeVisible({ timeout: 15000 });

    const regs = await getDocs(
      query(collection(db, "registrations"), where("eventId", "==", TODAY_EVENT_ID))
    );
    expect(regs.size).toBe(1);
    regs.forEach((d) => createdRegistrationIds.push(d.id));
  });

  test("TC-048 A ticket for a valid future registration does not read Missed", async ({ page }) => {
    await loginInteractive(page, DEMO.student.username, DEMO.student.password);
    await page.goto(`/event/${FUTURE_EVENT_ID}`);
    await page.getByRole("button", { name: "Register" }).click();
    await expect(page.getByText("Registered ✓")).toBeVisible({ timeout: 15000 });

    const regs = await getDocs(
      query(collection(db, "registrations"), where("eventId", "==", FUTURE_EVENT_ID))
    );
    regs.forEach((d) => createdRegistrationIds.push(d.id));

    // The ticket must appear under upcoming tickets, with a QR code, and must
    // not be labelled Missed anywhere on the page.
    await page.goto("/student/registrations");
    const ticket = page
      .locator("div.rounded-xl.border.p-5")
      .filter({ hasText: `TIMING Future Event ${suffix}` });
    await expect(ticket).toBeVisible();
    await expect(ticket.getByText("Full Screen")).toBeVisible();
    await expect(ticket.getByText("Missed")).toHaveCount(0);
  });
});
