// Third-wave demo seed: fills in the collections that are thin or empty for
// a live presentation — event Q&A, pending club-membership applications
// with realistic form data, and student profiles. Guarded the same way as
// seedExpanded.js: an atomic lock document so StrictMode's double effect
// invoke (or two tabs) can't run it twice, plus per-item existence checks
// before writing anything.

import { db } from "../firebase/config";
import { doc, getDoc, setDoc, updateDoc, runTransaction } from "firebase/firestore";
import { COLLECTIONS } from "../firebase/collections";
import { getAllDocs } from "../firebase/firestoreHelpers";
import { ROLES } from "./mockUsers";
import { getAllUsers } from "./usersStore";
import { getAllClubs } from "./clubsStore";
import { getAllEvents, EVENT_STATUS } from "./eventsStore";
import { getRegistrationsByEvent } from "./registrationsStore";
import { getMembershipsByClub, requestToJoinClub, MEMBERSHIP_STATUS } from "./clubMembershipsStore";
import { getProfile, upsertProfile } from "./profilesStore";
import { addComment, addAnswer, COMMENT_TYPE } from "./commentsStore";
import { getApprovalsByEvent, recordEventApproval, DECISION } from "./eventApprovalsStore";

const SEED_LOCK_COLLECTION = "_seed_locks";
const SEED_LOCK_DOC_ID = "demoContentSeed";

// ---------------------------------------------------------------- helpers

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomGpa() {
  return Math.round((2.5 + Math.random() * 1.4) * 10) / 10; // 2.5–3.9
}

function pickOne(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

function pickSome(arr, count) {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, count);
}

function rotate(arr, offset) {
  const n = offset % arr.length;
  return [...arr.slice(n), ...arr.slice(0, n)];
}

// ---------------------------------------------------------- content pools

const MAJORS = [
  "Computer Science", "Software Engineering", "Business Administration",
  "Mechanical Engineering", "Civil Engineering", "Graphic Design",
  "Communications", "Architecture", "Electrical Engineering", "Marketing",
];

const FACULTIES = [
  "Faculty of Information Technology",
  "Faculty of Business",
  "Faculty of Engineering",
  "Faculty of Arts and Design",
];

const SKILLS_POOL = [
  "Python", "Public Speaking", "Design", "Leadership", "JavaScript",
  "Photography", "Video Editing", "Project Management", "Data Analysis", "Arabic Calligraphy",
];

const AVAILABILITY_OPTIONS = ["Weekday Mornings", "Weekday Afternoons", "Weekday Evenings", "Weekends"];

const WHY_TEMPLATES = [
  (club) => `I've always been interested in this field and I think ${club} is the perfect place to grow my skills and meet like-minded students.`,
  (club) => `I want to get more involved in campus life, and ${club}'s activities really match my interests.`,
  (club) => `A friend recommended ${club} to me, and after seeing their events I'd love to be part of the team.`,
  (club) => `أرغب بالانضمام إلى ${club} لأنني شغوف بهذا المجال وأريد اكتساب خبرة عملية مع فريق متحمس.`,
  (club) => `I'm looking to build my resume with real project experience, and ${club} seems like a great fit for that.`,
];

const BIO_TEMPLATES = [
  "Second-year Computer Science student at HTU, passionate about building things and learning new technologies.",
  "Business student interested in entrepreneurship and startups. Always up for a good discussion about market trends.",
  "Engineering student who loves problem-solving and is happiest with a hard bug to fix or a hike to finish.",
  "Design student obsessed with clean interfaces and good typography — also runs a small photography side project.",
  "Third-year student balancing coursework with campus clubs. Big fan of trivia nights and board games.",
  "Aspiring software engineer, contributes to open-source projects in my free time, and enjoys mentoring first-year students.",
  "Communications student who loves storytelling, campus radio, and a strong cup of Arabic coffee.",
  "Architecture student sketching campus buildings between lectures — always looking for the next design competition.",
];

const INTERESTS_POOL = ["AI", "Photography", "Debate", "Gaming", "Music", "Robotics", "Reading", "Volunteering", "Football", "Chess"];

// Fixed Q/A pairs so the demo reliably shows answered questions (not left
// to chance which random pairing happens to line up).
const QA_PAIRS = [
  { q: "What's the dress code for this event?", a: "Smart casual is perfect — no need for anything formal." },
  { q: "Do I need to bring any materials, or will everything be provided?", a: "Everything will be provided, just bring yourself!" },
  { q: "Is this event open to all students or just club members?", a: "Open to all HTU students — you don't need to be a club member to attend." },
  { q: "Will there be food or refreshments?", a: "Yes, light refreshments will be served during the event." },
  { q: "هل يوجد موقف سيارات بالقرب من مكان الفعالية؟", a: "نعم، يوجد موقف سيارات مجاني بجانب المبنى مباشرة." },
  { q: "Can I bring a friend who isn't registered?", a: "They're welcome to join, but please ask them to register first so we can plan seating." },
];

const UNANSWERED_QUESTIONS = [
  "What time should I arrive to make sure I get a seat?",
  "Is there a certificate of attendance for this event?",
  "Will the session be recorded for those who can't attend?",
  "هل يمكن الحضور بدون تسجيل مسبق؟",
  "Is there a limit on how many people can register?",
];

const COMMENTS_ONLY = [
  "Really looking forward to this!",
  "Attended a similar event last semester — it was great.",
  "Can't wait to see everyone there!",
  "متحمس جداً لحضور هذه الفعالية!",
  "This is exactly what I needed this semester.",
  "شكراً لكم على التنظيم الرائع!",
];

// -------------------------------------------------------------- seed body

export async function seedDemoContentIfNeeded() {
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

  const [allUsers, allClubs, allEvents] = await Promise.all([getAllUsers(), getAllClubs(), getAllEvents()]);
  const students = allUsers.filter((u) => u.role === ROLES.STUDENT);

  await seedEventComments(allEvents, allClubs, students);
  await seedPendingApplications(allClubs, students);
  await seedProfiles(allUsers);

  await setDoc(lockRef, { status: "complete", completedAt: new Date().toISOString() }, { merge: true });
}

// 1. Q&A on the first 5 upcoming approved events, 3-5 items each, mixing
// answered questions / unanswered questions / plain comments so every
// event demoes both states.
async function seedEventComments(allEvents, allClubs, students) {
  if (students.length === 0) return;

  const today = new Date().toISOString().slice(0, 10);
  const upcomingEvents = allEvents
    .filter((e) => e.status === EVENT_STATUS.APPROVED && e.proposedDate >= today)
    .sort((a, b) => new Date(a.proposedDate) - new Date(b.proposedDate))
    .slice(0, 5);

  let authorCursor = 0;
  function nextAuthor() {
    const author = students[authorCursor % students.length];
    authorCursor++;
    return author;
  }

  for (let i = 0; i < upcomingEvents.length; i++) {
    const event = upcomingEvents[i];
    const club = allClubs.find((c) => c.id === event.clubId);

    const itemCount = 3 + (i % 3); // 3, 4, 5, 3, 4
    const questionCount = itemCount === 5 ? 3 : 2;
    const answeredCount = itemCount === 5 ? 2 : 1;
    const unansweredCount = questionCount - answeredCount;
    const commentCount = itemCount - questionCount;

    const answeredItems = rotate(QA_PAIRS, i).slice(0, answeredCount);
    const unansweredItems = rotate(UNANSWERED_QUESTIONS, i).slice(0, unansweredCount);
    const commentItems = rotate(COMMENTS_ONLY, i).slice(0, commentCount);

    for (const { q, a } of answeredItems) {
      const author = nextAuthor();
      const created = await addComment(event.id, author.id, author.name, q, COMMENT_TYPE.QUESTION);
      if (club?.adminId) {
        await addAnswer(created.id, club.adminId, a);
      }
    }
    for (const q of unansweredItems) {
      const author = nextAuthor();
      await addComment(event.id, author.id, author.name, q, COMMENT_TYPE.QUESTION);
    }
    for (const c of commentItems) {
      const author = nextAuthor();
      await addComment(event.id, author.id, author.name, c, COMMENT_TYPE.COMMENT);
    }
  }
}

// 2. Backfill applicationData on any pending membership missing it, then
// make sure there are actually some pending applications to demo by
// creating a few realistic ones against clubs that have an admin.
async function seedPendingApplications(allClubs, students) {
  const clubsWithAdmin = allClubs.filter((c) => c.adminId);

  for (const club of clubsWithAdmin) {
    const memberships = await getMembershipsByClub(club.id);
    const pending = memberships.filter((m) => m.status === MEMBERSHIP_STATUS.PENDING);

    for (const membership of pending) {
      if (membership.applicationData) continue;
      await setDoc(
        doc(db, COLLECTIONS.CLUB_MEMBERSHIPS, membership.id),
        { applicationData: generateApplicationData(club.name) },
        { merge: true }
      );
    }
  }

  // Create a couple of fresh pending requests per admin-owned club (up to
  // the first 3) so a live demo has something to review right away.
  const targetClubs = clubsWithAdmin.slice(0, 3);
  for (const club of targetClubs) {
    const memberships = await getMembershipsByClub(club.id);
    const tiedUserIds = new Set(memberships.map((m) => m.userId));
    const candidates = students.filter((s) => !tiedUserIds.has(s.id));
    const applicants = pickSome(candidates, 2);

    for (const applicant of applicants) {
      await requestToJoinClub({
        userId: applicant.id,
        clubId: club.id,
        applicationData: generateApplicationData(club.name),
      });
    }
  }
}

function generateApplicationData(clubName) {
  return {
    gpa: randomGpa(),
    major: pickOne(MAJORS),
    faculty: pickOne(FACULTIES),
    creditHours: randomInt(30, 130),
    skills: pickSome(SKILLS_POOL, randomInt(2, 4)),
    why: pickOne(WHY_TEMPLATES)(clubName),
    availability: pickSome(AVAILABILITY_OPTIONS, randomInt(1, 2)),
  };
}

// 3. Make sure at least 8 users have a complete profile — 4 already come
// from seedExpanded.js, so top up with a handful of students here.
async function seedProfiles(allUsers) {
  const existingProfiles = await getAllDocs(COLLECTIONS.PROFILES);
  const existingIds = new Set(existingProfiles.map((p) => p.id));

  const students = allUsers.filter((u) => u.role === ROLES.STUDENT && !existingIds.has(u.id));
  const chosen = pickSome(students, Math.max(0, 8 - existingProfiles.length));
  const bios = pickSome(BIO_TEMPLATES, chosen.length);

  for (let i = 0; i < chosen.length; i++) {
    const student = chosen[i];
    // Defensive re-check — getProfile hits Firestore directly by id, in
    // case another tab created one between the batch read above and now.
    const already = await getProfile(student.id);
    if (already) continue;

    await upsertProfile(student.id, {
      bio: bios[i % bios.length],
      avatarUrl: null,
      socialLinks: { instagram: "", linkedin: "", twitter: "" },
      interests: pickSome(INTERESTS_POOL, randomInt(2, 4)),
    });
  }
}

// 4. Demo polish: shrink one upcoming approved event's cap to just 2 seats
// above its current registration count, so its capacity bar reads as
// almost full. Guarded by a marker field on the event itself rather than
// the shared lock above, so it still runs (exactly once) even if the rest
// of this file's seeding already completed in an earlier session.
export async function seedNearCapacityEventIfNeeded() {
  const allEvents = await getAllEvents();
  if (allEvents.some((e) => e.nearCapacityDemo)) return;

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = allEvents.filter((e) => e.status === EVENT_STATUS.APPROVED && e.proposedDate >= today);
  if (upcoming.length === 0) return;

  const registrationLists = await Promise.all(upcoming.map((e) => getRegistrationsByEvent(e.id)));

  let target = null;
  let targetCount = 0;
  upcoming.forEach((e, i) => {
    const activeCount = registrationLists[i].filter((r) => r.status !== "cancelled").length;
    if (activeCount > targetCount) {
      target = e;
      targetCount = activeCount;
    }
  });
  if (!target) return;

  await updateDoc(doc(db, COLLECTIONS.EVENTS, target.id), {
    maxAttendees: targetCount + 2,
    nearCapacityDemo: true,
  });
}

// 5. Backfill event_approvals rejection records for the two seeded
// rejected events (see EVENT_PLAN in seedDemoData.js) — they're created
// with status "rejected" directly, with no approvals doc behind them, so
// ProposeEvent.jsx's "Reviewer feedback" block has nothing to show. Guarded
// per-event (skip if a rejection record already exists there) rather than
// the shared lock, so it's safe to call unconditionally.
const REJECTION_FEEDBACK = {
  "Chess Rating Tournament": "This date overlaps with mid-term exam week — please resubmit once exams are over.",
  "Blood Donation Drive": "We need written confirmation from the campus health center before this can go ahead. Please attach their approval and resubmit.",
};

export async function seedRejectionFeedbackIfNeeded() {
  const [allEvents, allUsers] = await Promise.all([getAllEvents(), getAllUsers()]);
  const reviewer = allUsers.find((u) => u.role === ROLES.UNIVERSITY_ADMIN);
  if (!reviewer) return;

  const rejectedEvents = allEvents.filter(
    (e) => e.status === EVENT_STATUS.REJECTED && REJECTION_FEEDBACK[e.title]
  );

  for (const event of rejectedEvents) {
    const approvals = await getApprovalsByEvent(event.id);
    if (approvals.some((a) => a.decision === DECISION.REJECTED)) continue;

    await recordEventApproval({
      eventId: event.id,
      reviewerId: reviewer.id,
      decision: DECISION.REJECTED,
      feedback: REJECTION_FEEDBACK[event.title],
    });
  }
}
