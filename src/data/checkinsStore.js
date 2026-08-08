import { COLLECTIONS } from "../firebase/collections";
import { createDoc, getDocsWhere, getAllDocs, generateId } from "../firebase/firestoreHelpers";
import { getRegistrationById } from "./registrationsStore";
import { incrementAttendeeCount } from "./eventsStore";

// Fields: id (PK), registrationId (FK), eventId (FK, denormalized off the
// registration for fast per-event queries), userId (FK, denormalized off the
// registration), scannedBy (FK -> USERS), note (optional string).
//
// Called by the Event Staff QR scanner with the raw decoded text (expected
// to be a registrationId — that's what's encoded on a student's ticket) and
// the event currently selected in the scanner. Runs the full validation
// chain: registration exists -> belongs to the selected event -> not
// already checked in -> create the checkin and bump the event's live count.
export async function checkInByRegistrationId({ registrationId, eventId, scannedBy }) {
  const registration = await getRegistrationById(registrationId);
  if (!registration) {
    return { success: false, status: "invalid", error: "Invalid QR code" };
  }

  if (registration.eventId !== eventId) {
    return { success: false, status: "wrong-event", error: "Not registered for this event", userId: registration.userId };
  }

  const existing = await getCheckinByRegistration(registrationId);
  if (existing) {
    return { success: false, status: "duplicate", error: "Already checked in", userId: registration.userId };
  }

  const id = generateId("chk");
  const checkin = await createDoc(COLLECTIONS.CHECKINS, id, {
    registrationId,
    eventId,
    userId: registration.userId,
    scannedBy,
    scannedAt: new Date().toISOString(),
    status: "valid",
    note: "",
  });
  await incrementAttendeeCount(eventId);
  return { success: true, status: "valid", checkin, userId: registration.userId };
}

export async function getCheckinsByEvent(eventId, allRegistrations) {
  const eventRegistrationIds = allRegistrations
    .filter((r) => r.eventId === eventId)
    .map((r) => r.id);

  const all = await getAllCheckins();
  return all.filter((c) => eventRegistrationIds.includes(c.registrationId));
}

export async function getAllCheckins() {
  return getAllDocs(COLLECTIONS.CHECKINS);
}

export async function getCheckinByRegistration(registrationId) {
  const results = await getDocsWhere(COLLECTIONS.CHECKINS, "registrationId", "==", registrationId);
  return results[0] || null;
}
