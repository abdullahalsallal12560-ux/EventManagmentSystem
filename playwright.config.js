import { defineConfig } from "@playwright/test";

// Real E2E suite against the live dev server + live Firestore (no mocks).
// workers: 1 / fullyParallel: false — deliberate: several specs share
// throwaway fixture accounts/clubs created in 00-setup.spec.js, and
// concurrent runs against the same live Firestore data would race.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [
    ["list"],
    ["json", { outputFile: "e2e/results.json" }],
  ],
  use: {
    baseURL: "http://localhost:5173",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
