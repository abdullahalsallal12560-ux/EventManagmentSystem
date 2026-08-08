# Firestore collections

Source: `src/firebase/collections.js` (collection name registry) cross-referenced against every `createDoc`/`setDoc`/`updateDoc`/`writeBatch` call site in `src/data/`. Field lists reflect what the code actually writes, not an idealized schema.

## users

Collection name constant: `COLLECTIONS.USERS` = `"users"`

| Field | Type | Notes |
|---|---|---|
| `id` | string (doc id) | `u_<timestamp>` (createUserByAdmin) or `u_stu_<i>_<timestamp>` (seed) or fixed `u1`–`u5` (MOCK_USERS) |
| `name` | string | |
| `username` | string | login identifier; unique (enforced in code via `usernameExists`) |
| `password` | string | plaintext, default `"12345"` for admin-created/seeded accounts |
| `role` | string | one of `"student"`, `"club_admin"`, `"university_admin"`, `"event_staff"`, `"facility_manager"` |
| `universityId` | string \| null | |
| `phone` | string \| null | |
| `avatarColor` | string | deterministic hex color derived from `name` (`colorForName`), set on every write path |
| `createdAt` | string (ISO datetime) | present on accounts created via `createUserByAdmin` or the demo seed; **absent** on the fixed `MOCK_USERS`-upserted accounts (u1–u5) |

## clubs

Collection name constant: `COLLECTIONS.CLUBS` = `"clubs"`

| Field | Type | Notes |
|---|---|---|
| `id` | string (doc id) | `club_<timestamp>_<rand>` |
| `name` | string | |
| `description` | string | defaults to `""` |
| `adminId` | string \| null | FK → `users` |
| `imageUrl` | string | cover image URL; defaults to a generated `picsum.photos` placeholder |

## club_memberships

Collection name constant: `COLLECTIONS.CLUB_MEMBERSHIPS` = `"club_memberships"`

| Field | Type | Notes |
|---|---|---|
| `id` | string (doc id) | `mem_<timestamp>_<rand>` (requestToJoinClub) or `mem_<i>_<timestamp>` (seed) |
| `userId` | string | FK → `users` |
| `clubId` | string | FK → `clubs` |
| `status` | string | one of `"pending"`, `"approved"`, `"rejected"` |
| `joinedAt` | string (ISO datetime) | |
| `applicationData` | object \| null | membership application form captured at request time: `{ gpa, major, faculty, creditHours, skills: string[], why, availability: string[] }` |

## events

Collection name constant: `COLLECTIONS.EVENTS` = `"events"`

| Field | Type | Notes |
|---|---|---|
| `id` | string (doc id) | `evt_<timestamp>_<rand>` |
| `clubId` | string | FK → `clubs` |
| `title` | string | |
| `description` | string | defaults to `""` |
| `proposedDate` | string (date, e.g. `"2026-08-15"`) | |
| `status` | string | one of `"pending"`, `"approved"`, `"rejected"` |
| `createdBy` | string \| null | FK → `users` |
| `imageUrl` | string | cover image URL; defaults to a generated `picsum.photos` placeholder |
| `startTime` | string (`"HH:MM"`) | defaults to `""` |
| `endTime` | string (`"HH:MM"`) | defaults to `""` |
| `location` | string | free text, defaults to `""` |
| `attendeeCount` | number | starts at `0`; incremented by `incrementAttendeeCount` on each valid check-in |
| `maxAttendees` | number \| null | registration cap; `registerForEvent` rejects once `activeRegistrations.length >= maxAttendees` |
| `nearCapacityDemo` | boolean | present (`true`) on at most one event — a one-time demo-seed marker so `backfillEventCapacityIfNeeded`/`seedNearCapacityEventIfNeeded` never re-adjust the same event twice; absent everywhere else |

## event_approvals

Collection name constant: `COLLECTIONS.EVENT_APPROVALS` = `"event_approvals"`

| Field | Type | Notes |
|---|---|---|
| `id` | string (doc id) | `appr_<timestamp>_<rand>` |
| `eventId` | string | FK → `events` |
| `reviewerId` | string | FK → `users` |
| `decision` | string | one of `"approved"`, `"rejected"` |
| `feedback` | string | defaults to `""` |
| `decisionAt` | string (ISO datetime) | |

## venues

Collection name constant: `COLLECTIONS.VENUES` = `"venues"`

| Field | Type | Notes |
|---|---|---|
| `id` | string (doc id) | `venue_<timestamp>_<rand>` |
| `name` | string | |
| `capacity` | number | coerced via `Number(capacity)` |
| `location` | string | |
| `status` | string | only value ever written in code: `"available"` |

## venue_reservations

Collection name constant: `COLLECTIONS.VENUE_RESERVATIONS` = `"venue_reservations"`

| Field | Type | Notes |
|---|---|---|
| `id` | string (doc id) | `resv_<timestamp>_<rand>` |
| `eventId` | string | FK → `events` |
| `venueId` | string | FK → `venues` |
| `startTime` | string (date/time, parsed via `new Date(...)`) | |
| `endTime` | string (date/time, parsed via `new Date(...)`) | |
| `status` | string | written as `"confirmed"`; `"cancelled"` is also checked for in conflict logic but never set in code |

## registrations

Collection name constant: `COLLECTIONS.REGISTRATIONS` = `"registrations"`

| Field | Type | Notes |
|---|---|---|
| `id` | string (doc id) | `reg_<timestamp>_<rand>` (registerForEvent) or `reg_<eventId>_<idx>_<timestamp>` (seed) |
| `eventId` | string | FK → `events` |
| `userId` | string | FK → `users` |
| `qrCode` | string | uppercased generated id; **display/legacy field only** — the actual ticket QR encodes the registration's document id, and check-in looks up by `registrationId` (`getRegistrationById`), not by this field |
| `status` | string | written as `"registered"`; `"cancelled"` is checked for everywhere active-registration counts are computed, but nothing in the current UI actually sets it |
| `registeredAt` | string (ISO datetime) | |

## checkins

Collection name constant: `COLLECTIONS.CHECKINS` = `"checkins"`

| Field | Type | Notes |
|---|---|---|
| `id` | string (doc id) | `chk_<timestamp>_<rand>` |
| `registrationId` | string | FK → `registrations` |
| `eventId` | string | FK → `events`, denormalized off the registration; **only present on check-ins created via the real scanner flow** (`checkInByRegistrationId`) — seed-created check-ins (`seedExpanded.js`) omit it |
| `userId` | string | FK → `users`, denormalized off the registration; same scanner-only caveat as `eventId` |
| `scannedBy` | string \| null | FK → `users` |
| `scannedAt` | string (ISO datetime) | |
| `status` | string | only value ever written in code: `"valid"` |
| `note` | string | defaults to `""`; not currently editable from the UI |

## profiles

Collection name constant: `COLLECTIONS.PROFILES` = `"profiles"`

| Field | Type | Notes |
|---|---|---|
| *(doc id)* | string | **is** the `userId` — one profile per user, so lookups are a direct `getDoc`, not a query |
| `userId` | string | FK → `users`, duplicated into the document body |
| `bio` | string | |
| `avatarUrl` | string \| null | no upload flow; always `null` in current code paths |
| `socialLinks` | object | `{ instagram, linkedin, twitter }`, each a string (possibly empty) |
| `interests` | string[] | |

## event_comments

Collection name constant: `COLLECTIONS.EVENT_COMMENTS` = `"event_comments"`

| Field | Type | Notes |
|---|---|---|
| `id` | string (doc id) | `cmt_<timestamp>_<rand>` |
| `eventId` | string | FK → `events` |
| `authorId` | string | FK → `users` |
| `authorName` | string | denormalized at post time |
| `content` | string | truncated to 500 chars on write |
| `createdAt` | string (ISO datetime) | |
| `type` | string | one of `"question"`, `"comment"` |
| `answeredBy` | string \| null | FK → `users`; set once the hosting club's admin replies |
| `answer` | string \| null | |
| `answeredAt` | string (ISO datetime) \| null | |

## _seed_locks *(internal — not part of the `COLLECTIONS` registry / ERD)*

One-time run-once guards, each an atomic Firestore transaction on a fixed document id so React StrictMode's double-invoke (or two tabs) can't run the same seed twice. Not a domain entity — purely an implementation detail of the demo-data pipeline in `src/data/`.

| Field | Type | Notes |
|---|---|---|
| *(doc id)* | string | one of `"demoDataSeed"` (`seedDemoData.js`), `"expandedDataSeed"` (`seedExpanded.js`), `"demoContentSeed"` (`seedDemoContent.js`) |
| `status` | string | `"in_progress"`, then `"complete"` (or `"skipped"` if `seedExpandedDataIfNeeded` found ≥15 events already present) |
| `startedAt` | string (ISO datetime) | |
| `completedAt` | string (ISO datetime) | set once `status` leaves `"in_progress"` |

Several newer seed/backfill steps (`seedNearCapacityEventIfNeeded`, `seedRejectionFeedbackIfNeeded`, `backfillEventCapacityIfNeeded`, `backfillEventDescriptionsIfNeeded` — all in `seedDemoContent.js`) intentionally do **not** use a `_seed_locks` document. They're guarded per-item instead (a marker field, or checking whether the target data already exists), which makes them safe to call unconditionally on every load — including retroactively fixing data written before that guard logic existed, which a `_seed_locks`-gated step could never do once marked `"complete"`.
