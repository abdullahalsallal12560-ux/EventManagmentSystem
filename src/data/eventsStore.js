import { COLLECTIONS } from "../firebase/collections";
import { createDoc, getDocById, getAllDocs, getDocsWhere, generateId } from "../firebase/firestoreHelpers";
import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebase/config";
import { placeholderImageUrl } from "./placeholderImages";

export const EVENT_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

// Fields: id (PK), clubId (FK), title, description, proposedDate, status,
// createdBy (FK), plus imageUrl — a plain cover-image URL (no upload flow);
// when the caller doesn't pass one we fall back to a deterministic picsum
// placeholder. `status` can be overridden so the demo seed can create events
// that are already approved/rejected; normal proposals still start pending.
// startTime/endTime (HH:MM) and location are free-text details shown on the
// event detail page; attendeeCount is maintained by checkin logic.
// maxAttendees is the registration cap — registerForEvent enforces it.
export async function createEvent({
  clubId,
  title,
  description,
  proposedDate,
  createdBy,
  imageUrl,
  status,
  startTime,
  endTime,
  location,
  maxAttendees,
}) {
  const id = generateId("evt");
  return createDoc(COLLECTIONS.EVENTS, id, {
    clubId,
    title,
    description: description || "",
    proposedDate,
    status: status || EVENT_STATUS.PENDING,
    createdBy,
    imageUrl: imageUrl || placeholderImageUrl(`event-${title}`),
    startTime: startTime || "",
    endTime: endTime || "",
    location: location || "",
    attendeeCount: 0,
    maxAttendees: typeof maxAttendees === "number" ? maxAttendees : Number(maxAttendees) || null,
  });
}

export async function incrementAttendeeCount(eventId) {
  await updateDoc(doc(db, COLLECTIONS.EVENTS, eventId), { attendeeCount: increment(1) });
}

export async function getEventById(id) {
  return getDocById(COLLECTIONS.EVENTS, id);
}

export async function getAllEvents() {
  return getAllDocs(COLLECTIONS.EVENTS);
}

export async function getEventsByClub(clubId) {
  return getDocsWhere(COLLECTIONS.EVENTS, "clubId", "==", clubId);
}

export async function getEventsByStatus(status) {
  return getDocsWhere(COLLECTIONS.EVENTS, "status", "==", status);
}

// Used by the University Admin's Approve Events page after recording
// a decision in EVENT_APPROVALS — keeps the event's own status field
// (used everywhere else for quick filtering) in sync with that decision.
export async function updateEventStatus(eventId, status) {
  await updateDoc(doc(db, COLLECTIONS.EVENTS, eventId), { status });
}
