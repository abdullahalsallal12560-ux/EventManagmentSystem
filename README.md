# Campus Events

A university student events management system — students discover and register for club events with QR-code tickets, club admins propose events and manage membership, and university staff approve proposals, manage venues, and check attendees in at the door.

Built as a client-only React app on top of Firebase Firestore, with realistic demo data auto-seeded on first load so it's ready to explore immediately.

## Tech stack

- **React 19** + **Vite** (no TypeScript)
- **Tailwind CSS v4**, with a light/dark theme driven by CSS custom properties (`src/styles/variables.css`, toggled via `[data-theme]`)
- **Firebase Firestore** (client SDK only — no Cloud Functions, no Admin SDK, no service account anywhere in the repo)
- **react-router-dom** for routing
- **qrcode.react** + native `getUserMedia`/`jsQR` for ticket QR generation and camera-based check-in scanning
- **lucide-react** for icons

Authentication is a custom username/password check against a `users` Firestore collection — **not** Firebase Auth. See `sdd-report/collections.md` for the full schema this implies.

## Roles

| Role | Can do |
|---|---|
| Student | Browse/join clubs, register for events, get a QR ticket, check event history, ask questions on event pages |
| Club Admin | Propose events, manage club membership requests, check in attendees at their own events, edit their club's profile |
| University Admin | Approve/reject event proposals (with feedback), manage clubs, provision user accounts |
| Event Staff | Check in attendees at any approved upcoming event |
| Facility Manager | View venues and venue reservations |

## Demo accounts

Five fixed accounts exist for quick testing (also visible from the "Demo Accounts" button on the Login page, and exportable via `scripts/exportUsers.js`):

| Username | Password | Role |
|---|---|---|
| `220101` | `12345` | Student |
| `club_admin` | `12345` | Club Admin (Robotics Club) |
| `uni_admin` | `12345` | University Admin |
| `event_staff` | `12345` | Event Staff |
| `fac_manager` | `12345` | Facility Manager |

On first run, the app also seeds ~100 additional students, several more clubs and club admins, a full set of past/pending/approved/rejected events with registrations and check-ins, venues, event Q&A, and membership applications — so every screen has realistic data without manual setup. See `src/data/usersStore.js` (`seedUsersIfEmpty`) and `sdd-report/data-functions.md` for exactly what runs and in what order.

## Getting started

**Prerequisites:** Node.js 20+ and a Firebase project with a Firestore database (test mode / open rules are fine for a demo — there's no Firebase Auth to gate reads/writes against).

1. Install dependencies:
   ```
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your Firebase Web app config (Project settings → General → Your apps in the Firebase console):
   ```
   VITE_FIREBASE_API_KEY=
   VITE_FIREBASE_AUTH_DOMAIN=
   VITE_FIREBASE_PROJECT_ID=
   VITE_FIREBASE_STORAGE_BUCKET=
   VITE_FIREBASE_MESSAGING_SENDER_ID=
   VITE_FIREBASE_APP_ID=
   VITE_FIREBASE_MEASUREMENT_ID=
   ```
3. Start the dev server:
   ```
   npm run dev
   ```
4. Open the app and log in with any demo account above — the first load seeds all the demo data automatically (takes a few seconds).

## Available scripts

| Command | Does |
|---|---|
| `npm run dev` | Starts the Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serves the production build locally |
| `npm run lint` | ESLint over the whole repo |
| `node --env-file=.env scripts/exportUsers.js` | Exports `scripts/users-export.csv` (the 5 demo accounts) and `scripts/clubs-admins.csv` (every club and its assigned admin, read live from Firestore) |

## Project structure

```
src/
  components/   Reusable UI (cards, modals, scanners, skeletons, TopBar, ...)
  context/      Auth, Theme, Toast, Onboarding React contexts
  data/         One file per Firestore collection ("*Store.js"), plus the demo-seed pipeline
  firebase/     Firebase app init, collection name registry, generic Firestore helpers
  pages/        One component per route (see sdd-report/routes.md)
  styles/       Design tokens (CSS custom properties) for the light/dark theme
  utils/        Small shared helpers (avatar colors, time formatting, loading-state timing)
scripts/
  exportUsers.js   Standalone Node script, see "Available scripts" above
sdd-report/
  collections.md      Firestore schema, generated from the actual write call sites
  data-functions.md   Every exported function in src/data/, what it does, what it touches
  routes.md           Every route in src/App.jsx and which role can access it
```

`sdd-report/` is documentation, not application code — it reflects what the code actually does (verified against the write call sites), not an idealized design. Re-check it against the code if you make schema-affecting changes, since nothing regenerates it automatically.
