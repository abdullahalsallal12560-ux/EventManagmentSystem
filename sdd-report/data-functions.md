# Data-layer exported functions

Source: every file in `src/data/`. Only exported functions are listed (module-private helpers without an `export` keyword are omitted).

## checkinsStore.js

| Function | Description | Firestore collection(s) touched |
|---|---|---|
| `scanQrCode(qrCode, scannedBy)` | Looks up a registration by QR code, rejects if not found or already checked in, then creates a checkin record. | `checkins` (write), `registrations` (read) |
| `getCheckinsByEvent(eventId, allRegistrations)` | Filters all checkin records down to those whose registrationId belongs to the given event. | `checkins` (read) |

## clubMembershipsStore.js

| Function | Description | Firestore collection(s) touched |
|---|---|---|
| `requestToJoinClub({ userId, clubId })` | Creates a pending membership request for a student; blocks a duplicate while one is already pending or approved. | `club_memberships` |
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
| `deleteClub(clubId)` | Deletes a club document. | `clubs` |

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
| `createEvent({ clubId, title, description, proposedDate, createdBy, imageUrl, status })` | Creates a new event document; defaults `status` to `"pending"` and `imageUrl` to a generated placeholder if omitted. | `events` |
| `getEventById(id)` | Fetches a single event document by id. | `events` |
| `getAllEvents()` | Fetches all event documents. | `events` |
| `getEventsByClub(clubId)` | Fetches events whose `clubId` field matches. | `events` |
| `getEventsByStatus(status)` | Fetches events whose `status` field matches. | `events` |
| `updateEventStatus(eventId, status)` | Updates an event document's `status` field. | `events` |

*(Also exports the constant `EVENT_STATUS`, not a function.)*

## mockUsers.js

No exported functions. Exports the constants `ROLES`, `ROLE_LABELS`, and `MOCK_USERS` (seed account data). No Firestore access.

## placeholderImages.js

| Function | Description | Firestore collection(s) touched |
|---|---|---|
| `slugify(text)` | Converts a string into a lowercase, hyphen-separated, URL-safe slug. | none (pure string utility) |
| `placeholderImageUrl(seed)` | Builds a deterministic `picsum.photos` cover-image URL from a seed string. | none (pure string utility) |

## registrationsStore.js

| Function | Description | Firestore collection(s) touched |
|---|---|---|
| `registerForEvent({ eventId, userId })` | Registers a user for an event with a generated QR code; blocks a duplicate active registration. | `registrations` |
| `getRegistrationsByEvent(eventId)` | Fetches registrations for a given event. | `registrations` |
| `getRegistrationsByUser(userId)` | Fetches registrations for a given user. | `registrations` |
| `findRegistrationByQr(qrCode)` | Fetches the registration matching a given QR code. | `registrations` |

## seedDemoData.js

| Function | Description | Firestore collection(s) touched |
|---|---|---|
| `seedDemoDataIfNeeded()` | One-time demo-data seed (clubs, club admins, staff accounts, 100 students, memberships, events, registrations), gated by an atomic transaction lock. | `clubs`, `users`, `club_memberships`, `events`, `registrations`, `_seed_locks` |

*(Also exports the constants `NEW_CLUB_CANDIDATES` and `EVENT_PLAN`, not functions.)*

## usersStore.js

| Function | Description | Firestore collection(s) touched |
|---|---|---|
| `seedUsersIfEmpty()` | Upserts the fixed `MOCK_USERS` demo accounts, seeds base clubs if the clubs collection is empty, then triggers the demo-data seed. | `users` (and indirectly `clubs`) |
| `getAllUsers()` | Fetches all user documents. | `users` |
| `usernameExists(username)` | Checks whether a username is already taken. | `users` |
| `findUserByCredentials(username, password)` | Looks up a user document matching a username/password pair, used for login. | `users` |
| `createUserByAdmin({ name, username, phone, role, clubId, universityId })` | Creates a new user account with the default password; assigns it as a club's admin if the role is Club Admin. | `users` (and `clubs`) |
| `deleteUser(userId)` | Deletes a user document. | `users` |
| `changePassword(userId, newPassword)` | Updates a user document's `password` field. | `users` |
| `exportUsersAsJSON()` | Downloads all user documents as a client-side JSON file. | `users` (read only) |

## venueReservationsStore.js

| Function | Description | Firestore collection(s) touched |
|---|---|---|
| `requestVenueReservation({ eventId, venueId, startTime, endTime })` | Creates a venue reservation after checking for a time-overlap conflict. | `venue_reservations` |
| `hasConflict(venueId, startTime, endTime)` | Checks whether a proposed time range overlaps an existing non-cancelled reservation for a venue. | `venue_reservations` |
| `getReservationsByVenue(venueId)` | Fetches reservations for a given venue. | `venue_reservations` |
| `getReservationsByEvent(eventId)` | Fetches reservations for a given event. | `venue_reservations` |

## venuesStore.js

| Function | Description | Firestore collection(s) touched |
|---|---|---|
| `createVenue({ name, capacity, location })` | Creates a new venue document with `status: "available"`. | `venues` |
| `getVenueById(id)` | Fetches a single venue document by id. | `venues` |
| `getAllVenues()` | Fetches all venue documents. | `venues` |
