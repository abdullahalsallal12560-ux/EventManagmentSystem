import { COLLECTIONS } from "../firebase/collections";
import { createDoc, getDocsWhere, generateId } from "../firebase/firestoreHelpers";

export const DECISION = {
  APPROVED: "approved",
  REJECTED: "rejected",
};

// Fields: id (PK), eventId (FK), reviewerId (FK), decision, feedback, decisionAt
export async function recordEventApproval({ eventId, reviewerId, decision, feedback }) {
  const id = generateId("appr");
  return createDoc(COLLECTIONS.EVENT_APPROVALS, id, {
    eventId,
    reviewerId,
    decision,
    feedback: feedback || "",
    decisionAt: new Date().toISOString(),
  });
}

export async function getApprovalsByEvent(eventId) {
  return getDocsWhere(COLLECTIONS.EVENT_APPROVALS, "eventId", "==", eventId);
}

export async function getApprovalsByReviewer(reviewerId) {
  return getDocsWhere(COLLECTIONS.EVENT_APPROVALS, "reviewerId", "==", reviewerId);
}
