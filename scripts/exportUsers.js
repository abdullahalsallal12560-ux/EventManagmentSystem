// Standalone export script — run with:
//   node --env-file=.env scripts/exportUsers.js
//
// 1. users-export.csv: every demo account from src/data/mockUsers.js
//    (username, password, role, name).
// 2. clubs-admins.csv: every club from the live Firestore `clubs`
//    collection, joined against `users` on club.adminId
//    (clubName, adminUsername, adminName). Clubs without an assigned
//    admin yet are skipped.
//
// Reads the live database (not just the static mockUsers.js) for the
// second CSV because most club admins are assigned at seed time to
// dynamically created accounts that never get written back to
// mockUsers.js — only Firestore has the real clubId -> adminId mapping.

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { MOCK_USERS } from "../src/data/mockUsers.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function toCsvField(value) {
  const str = String(value ?? "");
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function toCsv(headers, rows) {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => toCsvField(row[h])).join(","));
  }
  return lines.join("\n") + "\n";
}

function writeCsv(filename, headers, rows) {
  const csv = toCsv(headers, rows);
  const outPath = join(__dirname, filename);
  writeFileSync(outPath, csv, "utf8");
  console.log(`Wrote ${rows.length} row(s) to scripts/${filename}`);
}

// --- 1. users-export.csv ---------------------------------------------

const userRows = MOCK_USERS.map((u) => ({
  username: u.username,
  password: u.password,
  role: u.role,
  name: u.name,
}));
writeCsv("users-export.csv", ["username", "password", "role", "name"], userRows);

// --- 2. clubs-admins.csv ------------------------------------------------

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error(
    "Missing Firebase config. Run this script with your env vars loaded, e.g.:\n" +
      "  node --env-file=.env scripts/exportUsers.js"
  );
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const [clubsSnapshot, usersSnapshot] = await Promise.all([
  getDocs(collection(db, "clubs")),
  getDocs(collection(db, "users")),
]);

const clubs = clubsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
const usersById = new Map(usersSnapshot.docs.map((d) => [d.id, d.data()]));

const clubAdminRows = clubs
  .filter((club) => club.adminId && usersById.has(club.adminId))
  .map((club) => {
    const admin = usersById.get(club.adminId);
    return {
      clubName: club.name,
      adminUsername: admin.username,
      adminName: admin.name,
    };
  });

writeCsv("clubs-admins.csv", ["clubName", "adminUsername", "adminName"], clubAdminRows);

if (clubAdminRows.length < clubs.length) {
  console.log(
    `Note: ${clubs.length - clubAdminRows.length} of ${clubs.length} club(s) have no admin assigned yet and were skipped.`
  );
}

process.exit(0);
