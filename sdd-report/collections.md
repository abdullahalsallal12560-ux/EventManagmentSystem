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
| `qrCode` | string | uppercased generated id, e.g. `QR_<timestamp>_<rand>`; seed-created ones suffixed `_<idx>` |
| `status` | string | written as `"registered"`; `"cancelled"` is also checked for in duplicate-detection logic but never set in code |
| `registeredAt` | string (ISO datetime) | |

## checkins

Collection name constant: `COLLECTIONS.CHECKINS` = `"checkins"`

| Field | Type | Notes |
|---|---|---|
| `id` | string (doc id) | `chk_<timestamp>_<rand>` |
| `registrationId` | string | FK → `registrations` |
| `scannedBy` | string | FK → `users` |
| `scannedAt` | string (ISO datetime) | |
| `status` | string | only value ever written in code: `"valid"` |

## _seed_locks *(internal — not part of the `COLLECTIONS` registry / ERD)*

Used only by `seedDemoData.js` as an atomic run-once guard; not a domain entity.

| Field | Type | Notes |
|---|---|---|
| `id` | string (doc id) | fixed value: `"demoDataSeed"` |
| `status` | string | `"in_progress"` then `"complete"` |
| `startedAt` | string (ISO datetime) | |
| `completedAt` | string (ISO datetime) | set only once `status` becomes `"complete"` |
