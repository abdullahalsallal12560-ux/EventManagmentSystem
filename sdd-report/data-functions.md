# Data-layer exported functions

Source: every file in `src/data/`. Only exported functions (and named constants worth knowing about) are listed — module-private helpers without an `export` keyword are omitted.

## checkinsStore.js

| Function | Description | Firestore collection(s) touched |
|---|---|---|
| `checkInByRegistrationId({ registrationId, eventId, scannedBy })` | Full check-in validation chain: registration must exist, belong to the selected event, and not already be checked in; then creates the check-in and bumps the event's `attendeeCount`. Returns `{ success, status, ... }` where `status` is one of `"valid"`, `"invalid"`, `"wrong-event"`, `"duplicate"`. | `checkins` (write), `registrations` (read), `events` (write, via `incrementAttendeeCount`) |
| `getCheckinsByEvent(eventId, allRegistrations)` | Filters all check-in records down to those whose `registrationId` belongs to the given event (needs the caller's already-fetched registration list). | `checkins` (read) |
| `getAllCheckins()` | Fetches every check-in document. | `checkins` (read) |
| `getCheckinByRegistration(registrationId)` | Fetches the check-in (if any) for a given registration; used for the duplicate-scan guard. | `checkins` (read) |

## clubMembershipsStore.js

| Function | Description | Firestore collection(s) touched |
|---|---|---|
| `requestToJoinClub({ userId, clubId, applicationData })` | Creates a pending membership request with the submitted application form; blocks a duplicate while one is already pending or approved (a rejected request can be resubmitted). | `club_memberships` |
| `getMembershipsByUser(userId)` | Returns all membership documents for a given user. | `club_memberships` |
| `getMembershipsByClub(clubId)` | Returns all membership documents for a given club. | `club_memberships` |
| `updateMembershipStatus(membershipId, status)` | Updates a membership document's `status` field. | `club_memberships` |
| `removeMember(membershipId)` | Deletes a membership document. | `club_memberships` |

*(Also exports the constant `MEMBERSHIP_STATUS`, not a function.)*

## clubsStore.js

| Function | Description | Firestore collection(s) touched |
|---|---|---|
| `createClub({ name, description, adminId, imageUrl })` | Creates a new club document; defaults `imageUrl` to a generated placeholder if omitted. | `clubs` |
| `getClubById(id)` | Fetches a single club document by id. | `clubs` |
| `getAllClubs()` | Fetches all club documents. | `clubs` |
| `getClubsByAdmin(adminId)` | Fetches clubs whose `adminId` field matches. | `clubs` |
| `assignAdminToClub(clubId, adminId)` | Updates a club document's `adminId` field. | `clubs` |
| `updateClub(clubId, { name, description })` | Partial update of a club's `name`/`description`, used by the Club Admin from their own Club Profile page. | `clubs` |
| `deleteClub(clubId)` | Deletes a club document. | `clubs` |

## commentsStore.js

| Function | Description | Firestore collection(s) touched |
|---|---|---|
| `getCommentsByEvent(eventId)` | Fetches comments/questions for an event, newest first. | `event_comments` |
| `addComment(eventId, authorId, authorName, content, type)` | Creates a comment or question (content truncated to 500 chars); returns the created document. | `event_comments` |
| `addAnswer(commentId, answeredBy, answer)` | Attaches a club admin's reply to an existing question. | `event_comments` |

*(Also exports the constant `COMMENT_TYPE`, not a function.)*

## eventApprovalsStore.js

| Function | Description | Firestore collection(s) touched |
|---|---|---|
| `recordEventApproval({ eventId, reviewerId, decision, feedback })` | Creates an approval/rejection decision record for an event. | `event_approvals` |
| `getApprovalsByEvent(eventId)` | Fetches approval records for a given event. | `event_approvals` |
| `getApprovalsByReviewer(reviewerId)` | Fetches approval records made by a given reviewer. | `event_approvals` |

*(Also exports the constant `DECISION`, not a function.)*

## eventsStore.js

| Function | Description | Firestore collection(s) touched |
|---|---|---|
| `createEvent({ clubId, title, description, proposedDate, createdBy, imageUrl, status, startTime, endTime, location, maxAttendees })` | Creates a new event document; defaults `status` to `"pending"` and `imageUrl` to a generated placeholder if omitted. | `events` |
| `incrementAttendeeCount(eventId)` | Atomically increments `attendeeCount` by 1. | `events` |
| `getEventById(id)` | Fetches a single event document by id. | `events` |
| `getAllEvents()` | Fetches all event documents. | `events` |
| `getEventsByClub(clubId)` | Fetches events whose `clubId` field matches. | `events` |
| `getEventsByStatus(status)` | Fetches events whose `status` field matches. | `events` |
| `updateEventStatus(eventId, status)` | Updates an event document's `status` field. | `events` |

*(Also exports the constant `EVENT_STATUS`, not a function.)*

## mockUsers.js

No exported functions; no Firestore access. Exports the constants `ROLES`, `ROLE_LABELS`, `ROLE_COLORS` (fixed badge colors per role), and `MOCK_USERS` (the 5 fixed demo accounts, `u1`–`u5`).

## onboardingSteps.js

No exported functions; no Firestore access. Exports `ONBOARDING_STEPS`, a per-`ROLES` array of `{ target, text }` steps consumed by `OnboardingTour`.

## placeholderImages.js

| Function | Description | Firestore collection(s) touched |
|---|---|---|
| `slugify(text)` | Converts a string into a lowercase, hyphen-separated, URL-safe slug. | none (pure string utility) |
| `placeholderImageUrl(seed)` | Builds a deterministic `picsum.photos` cover-image URL from a seed string. | none (pure string utility) |

## profilesStore.js

| Function | Description | Firestore collection(s) touched |
|---|---|---|
| `getProfile(userId)` | Fetches a user's profile document by id (doc id == userId). | `profiles` |
| `upsertProfile(userId, data)` | Merge-writes a profile document (`bio`, `avatarUrl`, `socialLinks`, `interests`). | `profiles` |

## registrationsStore.js

| Function | Description | Firestore collection(s) touched |
|---|---|---|
| `registerForEvent({ eventId, userId })` | Registers a user for an event with a generated QR code; blocks a duplicate active registration and rejects once the event's `maxAttendees` cap is reached. | `registrations`, `events` (read) |
| `getRegistrationsByEvent(eventId)` | Fetches registrations for a given event. | `registrations` |
| `getRegistrationsByUser(userId)` | Fetches registrations for a given user. | `registrations` |
| `getAllRegistrations()` | Fetches every registration document at once — used where a page needs a per-event registration count across every event without one query per card. | `registrations` |
| `getRegistrationById(registrationId)` | Fetches a single registration by id; this is what a ticket's QR code actually encodes, so check-in scanning resolves through this, not `qrCode`. | `registrations` |

## seedDemoData.js

| Function | Description | Firestore collection(s) touched |
|---|---|---|
| `seedDemoDataIfNeeded()` | First-wave one-time seed: base + 7 new clubs, a club admin per unassigned club, 2 extra event-staff/facility-manager accounts, 100 students round-robined across clubs with approved memberships, and 10 `EVENT_PLAN` events (mixed pending/approved/rejected) with registrations for the approved ones. Gated by the `"demoDataSeed"` lock. | `clubs`, `users`, `club_memberships`, `events`, `registrations`, `_seed_locks` |

*(Also exports the constants `NEW_CLUB_CANDIDATES` and `EVENT_PLAN`, not functions.)*

## seedExpanded.js

| Function | Description | Firestore collection(s) touched |
|---|---|---|
| `seedExpandedDataIfNeeded()` | Second-wave one-time seed, gated by the `"expandedDataSeed"` lock (skipped outright if ≥15 events already exist): backfills `startTime`/`endTime`/`location`/`maxAttendees` onto pre-existing events, creates 8 `NEW_EVENT_PLAN` events (3 past with simulated attendance, 5 upcoming) with registrations pulled from each club's own approved members, seeds 4 fixed user profiles, creates 3 venues if none exist, and requests 2 venue reservations against upcoming events. | `events`, `registrations`, `checkins`, `profiles`, `venues`, `venue_reservations`, `_seed_locks` |

*(Also exports the constant `NEW_EVENT_PLAN`, not a function.)*

## seedDemoContent.js

Third-wave content seed plus several always-safe backfill/adjustment steps. The first function below is gated by the `"demoContentSeed"` lock; the rest are intentionally **not** lock-gated (see the `_seed_locks` note in `collections.md`) — each guards itself per-item so it's safe to call on every app load and can retroactively fix data written before the guard existed.

| Function | Description | Firestore collection(s) touched |
|---|---|---|
| `seedDemoContentIfNeeded()` | Seeds Q&A on the first 5 upcoming approved events, backfills/creates pending club-membership applications with realistic form data, and tops up student profiles to at least 8. Gated by the `"demoContentSeed"` lock. | `event_comments`, `club_memberships`, `profiles`, `_seed_locks` |
| `seedNearCapacityEventIfNeeded()` | Finds the upcoming approved event with the most existing registrations and sets its `maxAttendees` to `registrationCount + 2`, so its capacity bar reads as almost full in a live demo. Guarded by the `nearCapacityDemo` marker field — runs at most once, ever. | `events` |
| `seedRejectionFeedbackIfNeeded()` | Backfills an `event_approvals` rejection record (with feedback text, reviewed by the university admin) for the two seeded rejected events, so `ProposeEvent.jsx`'s "Reviewer feedback" block has something to show. Guarded by checking whether a rejection record already exists per event. | `event_approvals` |
| `backfillEventCapacityIfNeeded()` | Sets `maxAttendees` on any seed event (matched by title against `EVENT_PLAN` + `NEW_EVENT_PLAN`) that's still missing the field entirely. Scoped to the fixed seed title list so a real, intentionally-uncapped student-submitted proposal is never touched. | `events` |
| `backfillEventDescriptionsIfNeeded()` | Replaces the old generic `"<title> — hosted by <club>."` auto-generated description with the real per-event description now defined on each seed plan entry. Guarded by matching that exact old pattern, so a genuinely hand-written description is never overwritten. | `events` |

## usersStore.js

| Function | Description | Firestore collection(s) touched |
|---|---|---|
| `seedUsersIfEmpty()` | Upserts the fixed `MOCK_USERS` demo accounts (u1–u5), seeds base clubs if the clubs collection is empty, then runs the full seed chain in order: `seedDemoDataIfNeeded` → `seedExpandedDataIfNeeded` → `seedDemoContentIfNeeded` → `backfillEventCapacityIfNeeded` → `backfillEventDescriptionsIfNeeded` → `seedNearCapacityEventIfNeeded` → `seedRejectionFeedbackIfNeeded`, each independently try/caught so one failing step never blocks the rest. Called from `AuthContext` on mount. | `users` (and indirectly every collection touched by the seed chain) |
| `getAllUsers()` | Fetches all user documents. | `users` |
| `usernameExists(username)` | Checks whether a username is already taken. | `users` |
| `findUserByCredentials(username, password)` | Looks up a user document matching a username/password pair, used for login. | `users` |
| `createUserByAdmin({ name, username, phone, role, clubId, universityId })` | Creates a new user account with the default password; assigns it as a club's admin if the role is Club Admin (rejects if that club already has one). | `users` (and `clubs`) |
| `getUsersByIds(ids)` | Batches Firestore's 30-id `"in"` query limit to fetch several user records at once (member/attendee lists), instead of one read per id. | `users` |
| `deleteUser(userId)` | Deletes a user document. | `users` |
| `changePassword(userId, newPassword)` | Updates a user document's `password` field. | `users` |

## venueReservationsStore.js

| Function | Description | Firestore collection(s) touched |
|---|---|---|
| `requestVenueReservation({ eventId, venueId, startTime, endTime })` | Creates a venue reservation after checking for a time-overlap conflict. | `venue_reservations` |
| `hasConflict(venueId, startTime, endTime)` | Checks whether a proposed time range overlaps an existing non-cancelled reservation for a venue. | `venue_reservations` |
| `getReservationsByVenue(venueId)` | Fetches reservations for a given venue. | `venue_reservations` |
| `getReservationsByEvent(eventId)` | Fetches reservations for a given event. | `venue_reservations` |
| `getAllVenueReservations()` | Fetches every reservation document at once. | `venue_reservations` |

## venuesStore.js

| Function | Description | Firestore collection(s) touched |
|---|---|---|
| `createVenue({ name, capacity, location })` | Creates a new venue document with `status: "available"`. | `venues` |
| `getVenueById(id)` | Fetches a single venue document by id. | `venues` |
| `getAllVenues()` | Fetches all venue documents. | `venues` |

## `src/firebase/firestoreHelpers.js` *(not in `src/data/`, but underlies every store above)*

| Function | Description |
|---|---|
| `generateId(prefix)` | Returns `"<prefix>_<Date.now()>_<random 0-999>"`. |
| `createDoc(collectionName, id, data)` | `setDoc` at a specific id, returns `{ id, ...data }`. |
| `getDocById(collectionName, id)` | `getDoc` by id, returns `null` if it doesn't exist. |
| `getAllDocs(collectionName)` | Reads an entire collection. |
| `getDocsWhere(collectionName, field, operator, value)` | Single-field-equality query helper wrapping `query`/`where`. |
