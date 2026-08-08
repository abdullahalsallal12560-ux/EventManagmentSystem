// One-time demo dataset seed. Guarded by an atomic Firestore transaction on
// a lock document (not a plain count check) — React StrictMode double-fires
// effects in dev, and a read-then-write guard races under that; the
// transaction is what actually makes "only one caller ever proceeds" true,
// regardless of StrictMode, page reloads, or multiple tabs. Called from
// usersStore.js's seedUsersIfEmpty() flow.

import { COLLECTIONS } from "../firebase/collections";
import { db } from "../firebase/config";
import { writeBatch, doc, getDoc, setDoc, runTransaction } from "firebase/firestore";
import { getAllDocs, generateId } from "../firebase/firestoreHelpers";
import { ROLES } from "./mockUsers";
import { getAllClubs, createClub } from "./clubsStore";
import { getAllUsers, createUserByAdmin } from "./usersStore";
import { createEvent, getAllEvents, EVENT_STATUS } from "./eventsStore";
import { MEMBERSHIP_STATUS } from "./clubMembershipsStore";

const DEFAULT_PASSWORD = "12345";
const STUDENT_COUNT = 100;
const STUDENTS_REGISTERED_PER_EVENT = 8;

// Not part of the ERD-aligned COLLECTIONS registry on purpose — this is a
// pure implementation-detail lock for this one-time script, not a domain
// entity, so it stays local instead of polluting firebase/collections.js.
const SEED_LOCK_COLLECTION = "_seed_locks";
const SEED_LOCK_DOC_ID = "demoDataSeed";

// These two are assumed to exist already (created by the original
// seedClubsIfEmpty flow) in the common case, but are created here too if
// missing — matching descriptions from that original flow.
const REQUIRED_BASE_CLUBS = [
  { name: "Photography Club", description: "Campus photography and media." },
  { name: "Debate Club", description: "Public speaking and debate." },
];

export const NEW_CLUB_CANDIDATES = [
  { name: "Coding & AI Club", description: "Software, machine learning, and hackathon prep." },
  { name: "Music Society", description: "Jam sessions, campus concerts, and music production." },
  { name: "Entrepreneurship Club", description: "Startup pitches, mentorship, and business case competitions." },
  { name: "Environmental Club", description: "Campus sustainability projects and clean-up drives." },
  { name: "Drama & Theatre Club", description: "Stage productions, improv nights, and script workshops." },
  { name: "Chess Club", description: "Weekly matches, tournaments, and a rating ladder." },
  { name: "Community Volunteering Club", description: "Outreach programs and volunteering placements." },
];

export const EVENT_PLAN = [
  { club: "Robotics Club", title: "Robotics Open House", status: EVENT_STATUS.APPROVED, date: "2026-08-15",
    description: "Tour the Robotics Club's workshop, see our current builds in action, and get hands-on with our competition-ready robots. No experience needed — just curiosity." },
  { club: "Photography Club", title: "Campus Photo Walk", status: EVENT_STATUS.APPROVED, date: "2026-08-18",
    description: "A relaxed walk around campus with fellow photography enthusiasts, hunting for the best light and angles. Bring any camera, phone included — we'll share tips along the way." },
  { club: "Debate Club", title: "Inter-Faculty Debate Night", status: EVENT_STATUS.APPROVED, date: "2026-08-20",
    description: "Faculties go head-to-head in a fast-paced debate on current campus and social issues, judged live by a panel. Come cheer on your faculty or just enjoy the arguments." },
  { club: "Coding & AI Club", title: "AI Hackathon Kickoff", status: EVENT_STATUS.APPROVED, date: "2026-08-22",
    description: "The opening session for our 48-hour AI hackathon — team formation, problem statements, and a crash-course talk on the tools you'll have access to." },
  { club: "Music Society", title: "Open Mic Night", status: EVENT_STATUS.APPROVED, date: "2026-08-25",
    description: "Sign up on the night or in advance to perform — music, poetry, comedy, anything goes. Otherwise just come, relax, and enjoy the lineup." },
  { club: "Entrepreneurship Club", title: "Startup Pitch Day", status: EVENT_STATUS.APPROVED, date: "2026-08-28",
    description: "Student founders pitch their ideas to a panel of alumni and local investors for feedback and a shot at seed funding. Open to all students, not just presenters." },
  { club: "Environmental Club", title: "Campus Clean-Up Drive", status: EVENT_STATUS.PENDING, date: "2026-09-02",
    description: "Join us for a morning of cleaning up campus grounds and nearby green spaces. Gloves, bags, and refreshments provided — just bring comfortable shoes." },
  { club: "Drama & Theatre Club", title: "Spring Play Auditions", status: EVENT_STATUS.PENDING, date: "2026-09-05",
    description: "Auditions for this semester's spring production — all roles and backstage crew positions open, no prior acting experience required." },
  { club: "Chess Club", title: "Chess Rating Tournament", status: EVENT_STATUS.REJECTED, date: "2026-09-08",
    description: "A rated Swiss-format tournament open to all skill levels, with prizes for the top three finishers. Boards and clocks provided." },
  { club: "Community Volunteering Club", title: "Blood Donation Drive", status: EVENT_STATUS.REJECTED, date: "2026-09-10",
    description: "A campus-wide blood drive run in partnership with the national blood bank. Walk-ins welcome, but registering ahead helps us plan supplies." },
];

const FIRST_NAMES = [
  "Sara", "Yousef", "Dina", "Khalid", "Rania", "Tariq", "Lina", "Ahmad", "Noor", "Zaid",
  "Maya", "Fadi", "Reem", "Hassan", "Salma", "Bassel", "Aya", "Marwan", "Hala", "Kareem",
];
const LAST_NAMES = [
  "Barakat", "Khalil", "Farouk", "Odeh", "Zayed", "Mansour", "Qasem", "Rahman", "Saleh",
  "Hijazi", "Aweidah", "Btoush", "Freihat", "Halabi", "Jaber",
];
// Stride chosen coprime with LAST_NAMES.length (7 and 15 share no common
// factor) so the last-name index advances by a full "lap" each step instead
// of incrementing by 1 — consecutive indices never share a last name, and
// the pairing doesn't repeat until lcm(20, 15) = 60 steps, instead of
// clustering into 20-long blocks that all share one last name.
const LAST_NAME_STRIDE = 7;

function nameForIndex(i) {
  const first = FIRST_NAMES[i % FIRST_NAMES.length];
  const last = LAST_NAMES[(i * LAST_NAME_STRIDE) % LAST_NAMES.length];
  return `${first} ${last}`;
}

function phoneForIndex(i) {
  return `079${String(1000000 + i).slice(-7)}`;
}

// Returns the first "<base>_<n>" (n starting at 2) not already in usedUsernames,
// and reserves it. Independent per `base`, since each call restarts at n=2 and
// only skips entries this run (or a prior partial run) already claimed.
function nextAvailableUsername(base, usedUsernames) {
  let n = 2;
  let candidate = `${base}_${n}`;
  while (usedUsernames.has(candidate)) {
    n++;
    candidate = `${base}_${n}`;
  }
  usedUsernames.add(candidate);
  return candidate;
}

export async function seedDemoDataIfNeeded() {
  const lockRef = doc(db, SEED_LOCK_COLLECTION, SEED_LOCK_DOC_ID);

  // Fast path: one read, no transaction, for every normal load after the
  // real seeding run already completed.
  const existingLock = await getDoc(lockRef);
  if (existingLock.exists()) return;

  // Atomically claim the lock. Under StrictMode's double-invoke (or two
  // concurrent tabs), only one of these transactions can win — Firestore
  // guarantees the read-and-conditional-write is atomic against a
  // concurrent transaction touching the same document.
  const acquired = await runTransaction(db, async (tx) => {
    const snap = await tx.get(lockRef);
    if (snap.exists()) return false;
    tx.set(lockRef, { status: "in_progress", startedAt: new Date().toISOString() });
    return true;
  });
  if (!acquired) return;

  // 1. Make sure the base clubs this plan depends on actually exist, then
  // add the 7 new ones. Unconditional (not capped by "how many are missing
  // to reach 10") — this always creates the same fixed set, regardless of
  // whatever else already happens to be in the clubs collection.
  let allClubs = await getAllClubs();
  const existingClubNames = new Set(allClubs.map((c) => c.name.toLowerCase()));

  for (const base of [...REQUIRED_BASE_CLUBS, ...NEW_CLUB_CANDIDATES]) {
    if (existingClubNames.has(base.name.toLowerCase())) continue;
    await createClub({ name: base.name, description: base.description, adminId: null });
    existingClubNames.add(base.name.toLowerCase());
  }

  const existingUsers = await getAllUsers();
  const usedUsernames = new Set(existingUsers.map((u) => u.username));

  // 2. Assign a Club Admin to every club that doesn't have one yet.
  allClubs = await getAllClubs();
  const clubsNeedingAdmin = allClubs.filter((c) => !c.adminId);
  for (let i = 0; i < clubsNeedingAdmin.length; i++) {
    const club = clubsNeedingAdmin[i];
    const username = nextAvailableUsername("club_admin", usedUsernames);
    await createUserByAdmin({
      name: nameForIndex(STUDENT_COUNT + 10 + i),
      username,
      phone: phoneForIndex(9000 + i),
      role: ROLES.CLUB_ADMIN,
      clubId: club.id,
      universityId: null,
    });
  }
  allClubs = await getAllClubs(); // refresh so adminId is populated for event creation

  // 3. A couple of extra Event Staff / Facility Manager accounts.
  async function createExtraStaff(base, role, count) {
    for (let n = 0; n < count; n++) {
      const username = nextAvailableUsername(base, usedUsernames);
      await createUserByAdmin({
        name: nameForIndex(STUDENT_COUNT + 100 + n),
        username,
        phone: phoneForIndex(9500 + n),
        role,
        clubId: null,
        universityId: null,
      });
    }
  }
  await createExtraStaff("event_staff", ROLES.EVENT_STAFF, 2);
  await createExtraStaff("fac_manager", ROLES.FACILITY_MANAGER, 2);

  // 4. 100 students, batched: round-robin across every club, plus their
  // approved club-membership docs.
  const clubCount = allClubs.length;
  let nextUniversityId = 220110;
  const studentBatch = writeBatch(db);
  const membershipBatch = writeBatch(db);
  const studentsByClub = new Map(); // clubId -> [userId, ...]

  for (let i = 0; i < STUDENT_COUNT; i++) {
    while (usedUsernames.has(String(nextUniversityId))) nextUniversityId++;
    const username = String(nextUniversityId);
    usedUsernames.add(username);
    nextUniversityId++;

    const userId = `u_stu_${i}_${Date.now()}`;
    const club = allClubs[i % clubCount];

    studentBatch.set(doc(db, COLLECTIONS.USERS, userId), {
      name: nameForIndex(i),
      username,
      password: DEFAULT_PASSWORD,
      role: ROLES.STUDENT,
      universityId: username,
      phone: phoneForIndex(i),
      createdAt: new Date().toISOString(),
    });

    const membershipId = `mem_${i}_${Date.now()}`;
    membershipBatch.set(doc(db, COLLECTIONS.CLUB_MEMBERSHIPS, membershipId), {
      userId,
      clubId: club.id,
      status: MEMBERSHIP_STATUS.APPROVED,
      joinedAt: new Date().toISOString(),
    });

    if (!studentsByClub.has(club.id)) studentsByClub.set(club.id, []);
    studentsByClub.get(club.id).push(userId);
  }

  await studentBatch.commit();
  await membershipBatch.commit();

  // 5. Events (one per club, mixed statuses) + batched registrations for
  // approved events, pulling from that club's own seeded members.
  const registrationBatch = writeBatch(db);

  for (const plan of EVENT_PLAN) {
    const club = allClubs.find((c) => c.name === plan.club);
    if (!club) continue; // defensive: skip if a planned club name wasn't created

    const createdEvent = await createEvent({
      clubId: club.id,
      title: plan.title,
      description: plan.description,
      proposedDate: plan.date,
      createdBy: club.adminId,
      status: plan.status,
    });

    if (plan.status === EVENT_STATUS.APPROVED) {
      const attendees = (studentsByClub.get(club.id) || []).slice(0, STUDENTS_REGISTERED_PER_EVENT);
      attendees.forEach((userId, idx) => {
        const registrationId = `reg_${createdEvent.id}_${idx}_${Date.now()}`;
        const qrCode = `${generateId("qr").toUpperCase()}_${idx}`;
        registrationBatch.set(doc(db, COLLECTIONS.REGISTRATIONS, registrationId), {
          eventId: createdEvent.id,
          userId,
          qrCode,
          status: "registered",
          registeredAt: new Date().toISOString(),
        });
      });
    }
  }

  await registrationBatch.commit();

  // Final state read-back, so this log line only ever prints once every
  // write above has actually landed in Firestore.
  const [finalClubs, finalUsers, finalEvents, finalRegistrations] = await Promise.all([
    getAllClubs(),
    getAllUsers(),
    getAllEvents(),
    getAllDocs(COLLECTIONS.REGISTRATIONS),
  ]);
  console.log(
    `Seed complete: ${finalClubs.length} clubs, ${finalUsers.length} users, ${finalEvents.length} events, ${finalRegistrations.length} registrations`
  );

  await setDoc(lockRef, { status: "complete", completedAt: new Date().toISOString() }, { merge: true });
}
