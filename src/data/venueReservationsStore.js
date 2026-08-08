import { COLLECTIONS } from "../firebase/collections";
import { createDoc, getDocsWhere, getAllDocs, generateId } from "../firebase/firestoreHelpers";

// Fields: id (PK), eventId (FK), venueId (FK), startTime, endTime, status
export async function requestVenueReservation({ eventId, venueId, startTime, endTime }) {
  const conflict = await hasConflict(venueId, startTime, endTime);
  if (conflict) {
    return { success: false, error: "This venue is already reserved for an overlapping time." };
  }

  const id = generateId("resv");
  const reservation = await createDoc(COLLECTIONS.VENUE_RESERVATIONS, id, {
    eventId,
    venueId,
    startTime,
    endTime,
    status: "confirmed",
  });
  return { success: true, reservation };
}

// Simple overlap check: two ranges conflict if start1 < end2 AND start2 < end1
export async function hasConflict(venueId, startTime, endTime) {
  const existing = await getDocsWhere(COLLECTIONS.VENUE_RESERVATIONS, "venueId", "==", venueId);
  const newStart = new Date(startTime).getTime();
  const newEnd = new Date(endTime).getTime();

  return existing.some((r) => {
    if (r.status === "cancelled") return false;
    const start = new Date(r.startTime).getTime();
    const end = new Date(r.endTime).getTime();
    return newStart < end && start < newEnd;
  });
}

export async function getReservationsByVenue(venueId) {
  return getDocsWhere(COLLECTIONS.VENUE_RESERVATIONS, "venueId", "==", venueId);
}

export async function getReservationsByEvent(eventId) {
  return getDocsWhere(COLLECTIONS.VENUE_RESERVATIONS, "eventId", "==", eventId);
}

export async function getAllVenueReservations() {
  return getAllDocs(COLLECTIONS.VENUE_RESERVATIONS);
}
