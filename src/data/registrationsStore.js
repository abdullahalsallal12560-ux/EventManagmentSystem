import { COLLECTIONS } from "../firebase/collections";
import { createDoc, getDocById, getDocsWhere, generateId } from "../firebase/firestoreHelpers";

// Fields: id (PK), eventId (FK), userId (FK), qrCode, status, registeredAt
export async function registerForEvent({ eventId, userId }) {
  const already = await getDocsWhere(COLLECTIONS.REGISTRATIONS, "eventId", "==", eventId);
  const duplicate = already.find((r) => r.userId === userId && r.status !== "cancelled");
  if (duplicate) {
    return { success: false, error: "You're already registered for this event." };
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

// The registrationId is what's actually encoded in a ticket's QR code
// (see MyRegistrations/EventDetail), so check-in scanning looks it up by id.
export async function getRegistrationById(registrationId) {
  return getDocById(COLLECTIONS.REGISTRATIONS, registrationId);
}
