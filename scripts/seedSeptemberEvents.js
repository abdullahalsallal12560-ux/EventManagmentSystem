// Standalone seed script - run with:
//   node --env-file=.env scripts/seedSeptemberEvents.js
//
// Adds five approved, upcoming events: three on 2026-09-18 and two on
// 2026-09-28. Each one is written against an existing club, using exactly the
// field set the application already writes in createEvent() (eventsStore.js),
// so they behave identically to seeded and user-created events.
//
// The script is idempotent: it matches on title, and skips any event that is
// already present, so running it twice does not duplicate anything.

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const PLAN = [
  {
    title: "AI & Data Science Workshop",
    clubName: "Coding & AI Club",
    proposedDate: "2026-09-18",
    startTime: "10:00",
    endTime: "13:00",
    location: "Engineering Building, Lab 204",
    maxAttendees: 40,
    description:
      "A hands-on introduction to building and evaluating a machine learning model end to end. Bring a laptop; " +
      "no prior experience with the tooling is assumed. Covers loading a real dataset, training a first model, " +
      "and reading the results honestly rather than optimistically.",
    imageSeed: "event-ai-workshop",
  },
  {
    title: "Careers Night: Meet the Employers",
    clubName: "Entrepreneurship Club",
    proposedDate: "2026-09-18",
    startTime: "17:00",
    endTime: "20:00",
    location: "Main Auditorium",
    maxAttendees: 120,
    description:
      "An evening with recruiters and alumni from technology and engineering companies across Amman. Short " +
      "company introductions followed by open networking. Bring printed copies of your CV; a review desk will " +
      "be running throughout the evening.",
    imageSeed: "event-careers-night",
  },
  {
    title: "Inter-Club Football Tournament",
    clubName: "Community Volunteering Club",
    proposedDate: "2026-09-18",
    startTime: "15:00",
    endTime: "19:00",
    location: "Outdoor Sports Field",
    maxAttendees: 60,
    description:
      "A five-a-side knockout tournament between university clubs. Register as an individual and you will be " +
      "placed in a team on the day. Water and first aid provided; wear appropriate footwear for an outdoor pitch.",
    imageSeed: "event-football-tournament",
  },
  {
    title: "Photography Walk: Campus at Golden Hour",
    clubName: "Photography Club",
    proposedDate: "2026-09-28",
    startTime: "16:30",
    endTime: "18:30",
    location: "Meet at the Main Gate",
    maxAttendees: 25,
    description:
      "A guided walk around campus shooting in late afternoon light, finishing with a short group review of the " +
      "images taken. Any camera is welcome, including a phone. Composition and available-light technique are " +
      "covered as we go.",
    imageSeed: "event-golden-hour-walk",
  },
  {
    title: "Debate Championship: Opening Round",
    clubName: "Debate Club",
    proposedDate: "2026-09-28",
    startTime: "13:00",
    endTime: "16:00",
    location: "Lecture Hall B",
    maxAttendees: 80,
    description:
      "The opening round of the semester debate championship, open to competitors and spectators alike. Motions " +
      "are released one hour before each round. Judging criteria and speaking times are explained at the start " +
      "for anyone attending for the first time.",
    imageSeed: "event-debate-opening",
  },
];

async function main() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const [clubSnap, eventSnap, userSnap] = await Promise.all([
    getDocs(collection(db, "clubs")),
    getDocs(collection(db, "events")),
    getDocs(collection(db, "users")),
  ]);

  const clubs = [];
  clubSnap.forEach((d) => clubs.push({ id: d.id, ...d.data() }));
  const existingTitles = new Set();
  eventSnap.forEach((d) => existingTitles.add((d.data().title || "").toLowerCase()));
  const users = [];
  userSnap.forEach((d) => users.push({ id: d.id, ...d.data() }));

  let created = 0;
  let skipped = 0;

  for (const item of PLAN) {
    if (existingTitles.has(item.title.toLowerCase())) {
      console.log(`  skip (already exists): ${item.title}`);
      skipped += 1;
      continue;
    }

    const club = clubs.find((c) => c.name === item.clubName);
    if (!club) {
      console.log(`  SKIP (club not found): ${item.clubName} for "${item.title}"`);
      skipped += 1;
      continue;
    }

    // Attribute the event to the club's own admin where one is assigned, so
    // the Club Admin dashboard shows it under "my events" exactly as it would
    // for an event proposed through the interface.
    const createdBy = club.adminId || (users.find((u) => u.role === "club_admin") || {}).id || "u2";

    const id = `evt_${Date.now()}_${Math.floor(Math.random() * 900 + 100)}`;
    const payload = {
      clubId: club.id,
      title: item.title,
      description: item.description,
      proposedDate: item.proposedDate,
      status: "approved",
      createdBy,
      imageUrl: `https://picsum.photos/seed/${item.imageSeed}/400/250`,
      startTime: item.startTime,
      endTime: item.endTime,
      location: item.location,
      maxAttendees: item.maxAttendees,
      attendeeCount: 0,
    };

    await setDoc(doc(db, "events", id), payload);
    console.log(`  created ${item.proposedDate}  ${item.title}  (${club.name}, cap ${item.maxAttendees})  ->  ${id}`);
    created += 1;
    // ids embed a millisecond timestamp; a small gap keeps them distinct.
    await new Promise((r) => setTimeout(r, 40));
  }

  console.log(`\ncreated: ${created}, skipped: ${skipped}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("seed failed:", err.message);
  process.exit(1);
});
