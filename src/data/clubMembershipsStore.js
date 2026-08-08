import { COLLECTIONS } from "../firebase/collections";
import { createDoc, getDocsWhere, generateId } from "../firebase/firestoreHelpers";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase/config";

export const MEMBERSHIP_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

// Fields: id (PK), userId (FK), clubId (FK), status, joinedAt, plus
// applicationData — the membership application form (GPA, major, faculty,
// credit hours, skills, why, availability) captured at request time and
// shown to the Club Admin alongside the pending request. Not a separate
// collection: it's just an object field on this same document.
// A student requests to join; the Club Admin later approves/rejects via
// updateMembershipStatus. Blocks a duplicate request while one is already
// pending or approved (a rejected request can be resubmitted).
export async function requestToJoinClub({ userId, clubId, applicationData }) {
  const existing = await getDocsWhere(COLLECTIONS.CLUB_MEMBERSHIPS, "clubId", "==", clubId);
  const duplicate = existing.find(
    (m) => m.userId === userId && m.status !== MEMBERSHIP_STATUS.REJECTED
  );
  if (duplicate) {
    return { success: false, error: "You've already requested to join this club." };
  }

  const id = generateId("mem");
  const membership = await createDoc(COLLECTIONS.CLUB_MEMBERSHIPS, id, {
    userId,
    clubId,
    status: MEMBERSHIP_STATUS.PENDING,
    joinedAt: new Date().toISOString(),
    applicationData: applicationData || null,
  });
  return { success: true, membership };
}

export async function getMembershipsByUser(userId) {
  return getDocsWhere(COLLECTIONS.CLUB_MEMBERSHIPS, "userId", "==", userId);
}

export async function getMembershipsByClub(clubId) {
  return getDocsWhere(COLLECTIONS.CLUB_MEMBERSHIPS, "clubId", "==", clubId);
}

// Used by the Club Admin's Member Management page to approve/reject a
// pending request.
export async function updateMembershipStatus(membershipId, status) {
  await updateDoc(doc(db, COLLECTIONS.CLUB_MEMBERSHIPS, membershipId), { status });
}

// Removes an approved member from the club (or withdraws any request).
export async function removeMember(membershipId) {
  await deleteDoc(doc(db, COLLECTIONS.CLUB_MEMBERSHIPS, membershipId));
}
