# Routes

Source: `src/App.jsx`

| Path | Component | Allowed role(s) (`ProtectedRoute` `roles` prop) |
|---|---|---|
| `/` | *(redirect to `/login` via `<Navigate>`)* | — |
| `/login` | `Login` | — (not wrapped in `ProtectedRoute`) |
| `/unauthorized` | `Unauthorized` | — (not wrapped in `ProtectedRoute`) |
| `/dashboard` | `Dashboard` | Any authenticated user (`ProtectedRoute` with no `roles` prop) |
| `/profile` | `Profile` | Any authenticated user (`ProtectedRoute` with no `roles` prop) |
| `/admin/clubs` | `ManageClubs` | `university_admin` |
| `/admin/users` | `ManageUsers` | `university_admin` |
| `/admin/events` | `ApproveEvents` | `university_admin` |
| `/club/propose-event` | `ProposeEvent` | `club_admin` |
| `/club/members` | `ManageClubMembers` | `club_admin` |
| `/student/clubs` | `BrowseClubs` | `student` |
| `/student/events` | `BrowseEvents` | `student` |
| `/student/registrations` | `MyRegistrations` | `student` |
