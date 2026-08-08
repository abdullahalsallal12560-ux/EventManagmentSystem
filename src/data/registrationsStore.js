import { COLLECTIONS } from "../firebase/collections";
import { createDoc, getDocById, getAllDocs, getDocsWhere, generateId } from "../firebase/firestoreHelpers";
import { getEventById } from "./eventsStore";

// Fields: id (PK), eventId (FK), userId (FK), qrCode, status, registeredAt
export async function registerForEvent({ eventId, userId }) {
  const [event, already] = await Promise.all([
    getEventById(eventId),
    getDocsWhere(COLLECTIONS.REGISTRATIONS, "eventId", "==", eventId),
  ]);
  const activeRegistrations = already.filter((r) => r.status !== "cancelled");

  const duplicate = activeRegistrations.find((r) => r.userId === userId);
  if (duplicate) {
    return { success: false, error: "You're already registered for this event." };
  }

  if (typeof event?.maxAttendees === "number" && activeRegistrations.length >= event.maxAttendees) {
    return { success: false, error: "This event is full." };
  }

  const id = generateId("reg");
  const qrCode = generateId("qr").toUpperCase();
  const registration = await createDoc(COLLECTIONS.REGISTRATIONS, id, {
    eventId,
    userId,
    qrCode,
    status: "registered",
    registeredAt: new Date().toISOString(),
  });
  return { success: true, registration };
}

export async function getRegistrationsByEvent(eventId) {
  return getDocsWhere(COLLECTIONS.REGISTRATIONS, "eventId", "==", eventId);
}

export async function getRegistrationsByUser(userId) {
  return getDocsWhere(COLLECTIONS.REGISTRATIONS, "userId", "==", userId);
}

// Used where a page needs a registration count per event across every
// student at once (capacity badges on event grids) instead of one query
// per card.
export async function getAllRegistrations() {
  return getAllDocs(COLLECTIONS.REGISTRATIONS);
}

// The registrationId is what's actually encoded in a ticket's QR code
// (see MyRegistrations/EventDetail), so check-in scanning looks it up by id.
export async function getRegistrationById(registrationId) {
  return getDocById(COLLECTIONS.REGISTRATIONS, registrationId);
}
