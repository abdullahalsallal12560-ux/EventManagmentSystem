import { COLLECTIONS } from "../firebase/collections";
import { createDoc, getDocById, getAllDocs, generateId } from "../firebase/firestoreHelpers";

// Fields: id (PK), name, capacity, location, status
export async function createVenue({ name, capacity, location }) {
  const id = generateId("venue");
  return createDoc(COLLECTIONS.VENUES, id, {
    name,
    capacity: Number(capacity),
    location,
    status: "available",
  });
}

export async function getVenueById(id) {
  return getDocById(COLLECTIONS.VENUES, id);
}

export async function getAllVenues() {
  return getAllDocs(COLLECTIONS.VENUES);
}
