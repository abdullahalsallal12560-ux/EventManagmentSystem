import { COLLECTIONS } from "../firebase/collections";
import { createDoc, getDocById, getAllDocs, getDocsWhere, generateId } from "../firebase/firestoreHelpers";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { placeholderImageUrl } from "./placeholderImages";

// Fields match the ERD exactly: id (PK), name, description, adminId (FK -> USERS),
// plus imageUrl — a plain cover-image URL (no upload flow); when the caller
// doesn't pass one we fall back to a deterministic picsum placeholder.
export async function createClub({ name, description, adminId, imageUrl }) {
  const id = generateId("club");
  return createDoc(COLLECTIONS.CLUBS, id, {
    name,
    description: description || "",
    adminId: adminId || null,
    imageUrl: imageUrl || placeholderImageUrl(`club-${name}`),
  });
}

export async function getClubById(id) {
  return getDocById(COLLECTIONS.CLUBS, id);
}

export async function getAllClubs() {
  return getAllDocs(COLLECTIONS.CLUBS);
}

export async function getClubsByAdmin(adminId) {
  return getDocsWhere(COLLECTIONS.CLUBS, "adminId", "==", adminId);
}

// Links an existing club to the user who just signed up as its Club Admin.
export async function assignAdminToClub(clubId, adminId) {
  await updateDoc(doc(db, COLLECTIONS.CLUBS, clubId), { adminId });
}

// Used by the Club Admin from ClubProfile to edit their own club's name/description.
export async function updateClub(clubId, { name, description }) {
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  await updateDoc(doc(db, COLLECTIONS.CLUBS, clubId), updates);
}

export async function deleteClub(clubId) {
  await deleteDoc(doc(db, COLLECTIONS.CLUBS, clubId));
}
