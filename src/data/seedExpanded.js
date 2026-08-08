// Second-wave demo seed: past events with real attendance, richer event
// details (time/location), profiles, venues and a couple of reservations.
// Runs after seedDemoDataIfNeeded() (see usersStore.seedUsersIfEmpty), and
// is guarded the same way — an atomic lock document so StrictMode's double
// effect invoke (or two tabs) can't run it twice — plus an explicit "fewer
// than 15 events" check so it never re-runs against a store that already
// has this data.

import { COLLECTIONS } from "../firebase/collections";
import { db } from "../firebase/config";
import { doc, getDoc, setDoc, runTransaction, writeBatch, increment } from "firebase/firestore";
import { generateId } from "../firebase/firestoreHelpers";
import { getAllClubs } from "./clubsStore";
import { createEvent, getAllEvents, EVENT_STATUS } from "./eventsStore";
import { getMembershipsByClub, MEMBERSHIP_STATUS } from "./clubMembershipsStore";
import { getAllVenues, createVenue } from "./venuesStore";
import { requestVenueReservation } from "./venueReservationsStore";
import { upsertProfile } from "./profilesStore";

const SEED_LOCK_COLLECTION = "_seed_locks";
const SEED_LOCK_DOC_ID = "expandedDataSeed";
const MIN_EVENTS_BEFORE_SKIP = 15;

// Inclusive random int, used only for one-time seed/backfill writes.
function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const DEFAULT_TIME_SLOTS = [
  { startTime: "10:00", endTime: "12:00", location: "Main Hall, Building A" },
  { startTime: "14:00", endTime: "16:00", location: "Room 204" },
  { startTime: "17:00", endTime: "19:00", location: "Outdoor Plaza" },
  { startTime: "18:30", endTime: "20:30", location: "Main Auditorium" },
];

export const NEW_EVENT_PLAN = [
  // Past (already happened) — approved, with simulated attendance.
  { club: "Robotics Club", title: "Robotics Winter Showcase", date: "2026-06-12", startTime: "14:00", endTime: "17:00", location: "Main Auditorium", past: true,
    description: "An end-of-semester showcase of everything the Robotics Club built this term, from line-followers to our competition arm. Live demos all afternoon." },
  { club: "Music Society", title: "Spring Concert Series", date: "2026-07-03", startTime: "18:00", endTime: "21:00", location: "Outdoor Plaza", past: true,
    description: "An evening of live performances from student bands and solo acts, closing out the spring semester on the Outdoor Plaza stage." },
  { club: "Debate Club", title: "Alumni Debate Showcase", date: "2026-07-25", startTime: "16:00", endTime: "18:00", location: "Room 204", past: true,
    description: "Former Debate Club members return to campus for an exhibition match against our current top team — good-natured rivalry guaranteed." },
  // Upcoming — approved.
  { club: "Coding & AI Club", title: "Machine Learning Workshop", date: "2026-08-24", startTime: "10:00", endTime: "13:00", location: "Room 204", past: false,
    description: "A hands-on introduction to machine learning fundamentals — building and training your first model, no prior ML background required. Bring a laptop." },
  { club: "Entrepreneurship Club", title: "Investor Networking Night", date: "2026-09-10", startTime: "18:30", endTime: "21:00", location: "Main Auditorium", past: false,
    description: "An evening of structured networking between student entrepreneurs and local investors, with short pitch slots and open mingling after." },
  { club: "Environmental Club", title: "Sustainability Fair", date: "2026-09-22", startTime: "11:00", endTime: "15:00", location: "Outdoor Plaza", past: false,
    description: "Stalls, talks, and hands-on activities from campus sustainability initiatives and local eco-friendly vendors — learn what's changing on campus this year." },
  { club: "Photography Club", title: "Golden Hour Photo Walk", date: "2026-10-02", startTime: "17:00", endTime: "19:00", location: "Outdoor Plaza", past: false,
    description: "Chase the best light of the day on a guided photo walk through campus's most scenic corners, timed for golden hour." },
  { club: "Chess Club", title: "Fall Chess Championship", date: "2026-10-15", startTime: "09:00", endTime: "17:00", location: "Room 204", past: false,
    description: "Our biggest tournament of the year — an all-day Swiss-format championship with trophies for the top finishers and casual boards for spectators." },
];

const VENUE_PLAN = [
  { name: "Main Auditorium", capacity: 300, location: "Building A, Ground Floor" },
  { name: "Room 204", capacity: 40, location: "Building B, 2nd Floor" },
  { name: "Outdoor Plaza", capacity: 500, location: "Central Campus" },
];

const PROFILE_SEED = [
  { userId: "u1", bio: "Third-year CS student. Big fan of hackathons and campus photography.", interests: ["Robotics", "Photography", "Hackathons"] },
  { userId: "u2", bio: "Robotics Club lead — I run our weekly build nights and open house events.", interests: ["Robotics", "Engineering", "Mentoring"] },
  { userId: "u3", bio: "University Admin overseeing club activities and event approvals.", interests: ["Campus Life", "Operations"] },
  { userId: "u4", bio: "Event Staff — usually the one scanning your ticket at the door.", interests: ["Live Events", "Logistics"] },
];

export async function seedExpandedDataIfNeeded() {
  const lockRef = doc(db, SEED_LOCK_COLLECTION, SEED_LOCK_DOC_ID);

  const existingLock = await getDoc(lockRef);
  if (existingLock.exists()) return;

  const acquired = await runTransaction(db, async (tx) => {
    const snap = await tx.get(lockRef);
    if (snap.exists()) return false;
    tx.set(lockRef, { status: "in_progress", startedAt: new Date().toISOString() });
    return true;
  });
  if (!acquired) return;

  const existingEvents = await getAllEvents();
  if (existingEvents.length >= MIN_EVENTS_BEFORE_SKIP) {
    await setDoc(lockRef, { status: "skipped", completedAt: new Date().toISOString() }, { merge: true });
    return;
  }

  // 1. Backfill startTime/endTime/location/maxAttendees onto events that
  // predate these fields.
  const backfillBatch = writeBatch(db);
  let backfillCount = 0;
  existingEvents.forEach((ev, i) => {
    if (ev.startTime && ev.endTime && ev.location && typeof ev.maxAttendees === "number") return;
    const slot = DEFAULT_TIME_SLOTS[i % DEFAULT_TIME_SLOTS.length];
    backfillBatch.update(doc(db, COLLECTIONS.EVENTS, ev.id), {
      startTime: ev.startTime || slot.startTime,
      endTime: ev.endTime || slot.endTime,
      location: ev.location || slot.location,
      attendeeCount: typeof ev.attendeeCount === "number" ? ev.attendeeCount : 0,
      maxAttendees: typeof ev.maxAttendees === "number" ? ev.maxAttendees : randomBetween(30, 150),
    });
    backfillCount++;
  });
  if (backfillCount > 0) await backfillBatch.commit();

  // 2. Create the 8 new events, each with registrations pulled from that
  // club's own approved members; past events additionally get checkins for
  // 60-80% of those registrations.
  const allClubs = await getAllClubs();

  for (const plan of NEW_EVENT_PLAN) {
    const club = allClubs.find((c) => c.name === plan.club);
    if (!club) continue;

    const createdEvent = await createEvent({
      clubId: club.id,
      title: plan.title,
      description: plan.description,
      proposedDate: plan.date,
      createdBy: club.adminId,
      status: EVENT_STATUS.APPROVED,
      startTime: plan.startTime,
      endTime: plan.endTime,
      location: plan.location,
      maxAttendees: randomBetween(30, 150),
    });

    const clubMemberships = await getMembershipsByClub(club.id);
    const approvedMemberIds = clubMemberships
      .filter((m) => m.status === MEMBERSHIP_STATUS.APPROVED)
      .map((m) => m.userId)
      .slice(0, 8);

    if (approvedMemberIds.length === 0) continue;

    const regBatch = writeBatch(db);
    const registrationIds = [];
    approvedMemberIds.forEach((userId, idx) => {
      const registrationId = `reg_${createdEvent.id}_${idx}_${Date.now()}`;
      const qrCode = `${generateId("qr").toUpperCase()}_${idx}`;
      regBatch.set(doc(db, COLLECTIONS.REGISTRATIONS, registrationId), {
        eventId: createdEvent.id,
        userId,
        qrCode,
        status: "registered",
        registeredAt: new Date().toISOString(),
      });
      registrationIds.push(registrationId);
    });
    await regBatch.commit();

    if (plan.past) {
      // 60-80% attendance, deterministic per event so re-reads are stable.
      const attendanceRate = 0.6 + (0.2 * (createdEvent.id.length % 5)) / 4;
      const attendedCount = Math.max(1, Math.round(registrationIds.length * attendanceRate));

      const checkinBatch = writeBatch(db);
      registrationIds.slice(0, attendedCount).forEach((registrationId, idx) => {
        const checkinId = `chk_${createdEvent.id}_${idx}_${Date.now()}`;
        checkinBatch.set(doc(db, COLLECTIONS.CHECKINS, checkinId), {
          registrationId,
          scannedBy: club.adminId || null,
          scannedAt: new Date(`${plan.date}T${plan.endTime || "18:00"}:00`).toISOString(),
          status: "valid",
          note: "",
        });
      });
      checkinBatch.update(doc(db, COLLECTIONS.EVENTS, createdEvent.id), {
        attendeeCount: increment(attendedCount),
      });
      await checkinBatch.commit();
    }
  }

  // 3. Profiles for 4 seeded users.
  for (const profile of PROFILE_SEED) {
    await upsertProfile(profile.userId, {
      bio: profile.bio,
      avatarUrl: null,
      socialLinks: { instagram: "", linkedin: "", twitter: "" },
      interests: profile.interests,
    });
  }

  // 4. Venues, if none exist yet.
  const existingVenues = await getAllVenues();
  let venues = existingVenues;
  if (existingVenues.length === 0) {
    for (const v of VENUE_PLAN) {
      await createVenue(v);
    }
    venues = await getAllVenues();
  }

  // 5. A couple of venue reservations against 2 of the new upcoming events.
  const refreshedEvents = await getAllEvents();
  const upcomingNewEvents = NEW_EVENT_PLAN.filter((p) => !p.past)
    .map((p) => refreshedEvents.find((e) => e.title === p.title))
    .filter(Boolean)
    .slice(0, 2);

  for (const ev of upcomingNewEvents) {
    const venue = venues.find((v) => v.name === ev.location) || venues[0];
    if (!venue) continue;
    await requestVenueReservation({
      eventId: ev.id,
      venueId: venue.id,
      startTime: `${ev.proposedDate}T${ev.startTime || "10:00"}:00`,
      endTime: `${ev.proposedDate}T${ev.endTime || "12:00"}:00`,
    });
  }

  await setDoc(lockRef, { status: "complete", completedAt: new Date().toISOString() }, { merge: true });
}
