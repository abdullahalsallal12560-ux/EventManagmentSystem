import { COLLECTIONS } from "../firebase/collections";
import { getDocById } from "../firebase/firestoreHelpers";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";

// Fields: userId (FK), bio, avatarUrl, socialLinks ({ instagram, linkedin,
// twitter }), interests (array of strings). The document id IS the userId
// (one profile per user), so lookups are a direct get, not a query.
export async function getProfile(userId) {
  return getDocById(COLLECTIONS.PROFILES, userId);
}

export async function upsertProfile(userId, data) {
  await setDoc(doc(db, COLLECTIONS.PROFILES, userId), { userId, ...data }, { merge: true });
  return { id: userId, userId, ...data };
}
