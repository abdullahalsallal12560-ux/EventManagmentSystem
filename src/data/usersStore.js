// Real database layer using Firebase Firestore.
// Closed-registration model: only University Admin creates accounts
// (via createUserByAdmin below). There is no public Sign Up anymore.
// Login is by "username" now, not email. universityId is kept as a
// separate real-world identifier (matches the ERD), it is no longer
// used as the login credential for every role — students happen to
// log in with their universityId as their username, but the field
// itself stays independent so an admin's username can be anything.

import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  documentId,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { MOCK_USERS, ROLES } from "./mockUsers";
import { createClub, assignAdminToClub, getClubById } from "./clubsStore";
import { seedDemoDataIfNeeded } from "./seedDemoData";
import { seedExpandedDataIfNeeded } from "./seedExpanded";
import {
  seedDemoContentIfNeeded,
  seedNearCapacityEventIfNeeded,
  seedRejectionFeedbackIfNeeded,
  backfillEventCapacityIfNeeded,
  backfillEventDescriptionsIfNeeded,
} from "./seedDemoContent";
import { colorForName } from "../utils/avatarColor";

const USERS_COLLECTION = "users";
const DEFAULT_PASSWORD = "12345";

export async function seedUsersIfEmpty() {
  // Keep the demo accounts (fixed ids u1-u5) in sync with mockUsers.js.
  // This upserts only those specific ids, so real accounts created by
  // the University Admin are never touched or overwritten.
  for (const user of MOCK_USERS) {
    const userForDb = { ...user };
    delete userForDb.club; // legacy field, not stored
    await setDoc(doc(db, USERS_COLLECTION, user.id), { avatarColor: colorForName(user.name), ...userForDb });
  }
  await seedClubsIfEmpty();

  try {
    await seedDemoDataIfNeeded();
  } catch (err) {
    console.error("Demo data seeding failed:", err);
  }

  try {
    await seedExpandedDataIfNeeded();
  } catch (err) {
    console.error("Expanded demo data seeding failed:", err);
  }

  try {
    await seedDemoContentIfNeeded();
  } catch (err) {
    console.error("Demo content seeding failed:", err);
  }

  try {
    await backfillEventCapacityIfNeeded();
  } catch (err) {
    console.error("Event capacity backfill failed:", err);
  }

  try {
    await backfillEventDescriptionsIfNeeded();
  } catch (err) {
    console.error("Event description backfill failed:", err);
  }

  try {
    await seedNearCapacityEventIfNeeded();
  } catch (err) {
    console.error("Near-capacity demo event seeding failed:", err);
  }

  try {
    await seedRejectionFeedbackIfNeeded();
  } catch (err) {
    console.error("Rejection feedback seeding failed:", err);
  }
}

async function seedClubsIfEmpty() {
  const clubsSnapshot = await getDocs(collection(db, "clubs"));
  if (!clubsSnapshot.empty) return;

  for (const user of MOCK_USERS) {
    if (user.role === ROLES.CLUB_ADMIN && user.club) {
      await createClub({ name: user.club, description: "A student club.", adminId: user.id });
    }
  }
  await createClub({ name: "Photography Club", description: "Campus photography and media.", adminId: null });
  await createClub({ name: "Debate Club", description: "Public speaking and debate.", adminId: null });
}

export async function getAllUsers() {
  const snapshot = await getDocs(collection(db, USERS_COLLECTION));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function usernameExists(username) {
  const q = query(collection(db, USERS_COLLECTION), where("username", "==", username));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

export async function findUserByCredentials(username, password) {
  const q = query(
    collection(db, USERS_COLLECTION),
    where("username", "==", username),
    where("password", "==", password)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return { id: d.id, ...d.data() };
}

// Used only by the University Admin's "Manage Users" page. New accounts
// always start on the fixed default password; the user changes it
// themselves later from their Profile page.
export async function createUserByAdmin({ name, username, phone, role, clubId, universityId }) {
  const exists = await usernameExists(username);
  if (exists) {
    return { success: false, error: "This username is already taken." };
  }

  if (role === ROLES.CLUB_ADMIN) {
    if (!clubId) {
      return { success: false, error: "Please select a club to manage." };
    }
    const club = await getClubById(clubId);
    if (!club) {
      return { success: false, error: "Selected club no longer exists." };
    }
    if (club.adminId) {
      return { success: false, error: "This club already has a manager. Please choose another club." };
    }
  }

  const id = `u_${Date.now()}`;
  const newUser = {
    name,
    username,
    password: DEFAULT_PASSWORD,
    role,
    universityId: universityId || null,
    phone: phone || null,
    avatarColor: colorForName(name),
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(db, USERS_COLLECTION, id), newUser);

  if (role === ROLES.CLUB_ADMIN) {
    await assignAdminToClub(clubId, id);
  }

  return { success: true, user: { id, ...newUser }, defaultPassword: DEFAULT_PASSWORD };
}

// Batches Firestore's 30-id "in" query limit, used by member/attendee lists
// that need several user records at once instead of N individual reads.
export async function getUsersByIds(ids) {
  const uniqueIds = [...new Set(ids)].filter(Boolean);
  if (uniqueIds.length === 0) return [];

  const chunks = [];
  for (let i = 0; i < uniqueIds.length; i += 30) {
    chunks.push(uniqueIds.slice(i, i + 30));
  }

  const results = await Promise.all(
    chunks.map(async (chunk) => {
      const q = query(collection(db, USERS_COLLECTION), where(documentId(), "in", chunk));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    })
  );

  return results.flat();
}

export async function deleteUser(userId) {
  await deleteDoc(doc(db, USERS_COLLECTION, userId));
}

// Lets a logged-in user change their own password from the Profile page.
export async function changePassword(userId, newPassword) {
  await setDoc(doc(db, USERS_COLLECTION, userId), { password: newPassword }, { merge: true });
}

