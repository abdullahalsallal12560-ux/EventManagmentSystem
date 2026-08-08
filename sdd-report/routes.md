# Routes

Source: `src/App.jsx`

| Path | Component | Allowed role(s) (`ProtectedRoute` `roles` prop) |
|---|---|---|
| `/` | *(redirect to `/login` via `<Navigate>`)* | — |
| `/login` | `Login` | — (not wrapped in `ProtectedRoute`) |
| `/unauthorized` | `Unauthorized` | — (not wrapped in `ProtectedRoute`) |
| `/dashboard` | `Dashboard` | Any authenticated user (`ProtectedRoute` with no `roles` prop) — renders a different sub-dashboard per role internally (`StudentDashboard`, `ClubAdminDashboard`, `UniversityAdminDashboard`, `EventStaffDashboard`, `FacilityManagerDashboard`); Event Staff and Facility Manager have no dedicated routes below because their whole workflow lives on this one page |
| `/profile` | `Profile` | Any authenticated user (`ProtectedRoute` with no `roles` prop) |
| `/club/:clubId` | `ClubProfile` | Any authenticated user |
| `/event/:eventId` | `EventDetail` | Any authenticated user |
| `/admin/clubs` | `ManageClubs` | `university_admin` |
| `/admin/users` | `ManageUsers` | `university_admin` |
| `/admin/events` | `ApproveEvents` | `university_admin` |
| `/club/propose-event` | `ProposeEvent` | `club_admin` |
| `/club/members` | `ManageClubMembers` | `club_admin` |
| `/student/clubs` | `BrowseClubs` | `student` |
| `/student/events` | `BrowseEvents` | `student` |
| `/student/registrations` | `MyRegistrations` | `student` |
| `/student/history` | `EventHistory` | `student` |

Not a route: the global search overlay (`SearchOverlay`, opened from `TopBar`) and the demo-accounts quick-fill panel on `Login` are both in-page overlays, not separate URLs.
