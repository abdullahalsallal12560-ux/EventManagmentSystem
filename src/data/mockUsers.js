// Seed accounts for the demo. Closed system: the university provisions
// every account (see Manage Users page) — there is no self sign-up.
// Every account, including newly admin-created ones, starts with the
// default password "12345"; users change it themselves from Profile.

export const ROLES = {
  STUDENT: "student",
  CLUB_ADMIN: "club_admin",
  UNIVERSITY_ADMIN: "university_admin",
  EVENT_STAFF: "event_staff",
  FACILITY_MANAGER: "facility_manager",
};

export const ROLE_LABELS = {
  [ROLES.STUDENT]: "Student",
  [ROLES.CLUB_ADMIN]: "Club Admin",
  [ROLES.UNIVERSITY_ADMIN]: "University Admin",
  [ROLES.EVENT_STAFF]: "Event Staff",
  [ROLES.FACILITY_MANAGER]: "Facility Manager",
};

// Role badge colors used for pills across ManageUsers, Dashboard, etc.
// Fixed (not theme-swapped) so a role reads the same color in both modes.
export const ROLE_COLORS = {
  [ROLES.STUDENT]: { text: "#2563EB", bg: "#EFF6FF" },
  [ROLES.CLUB_ADMIN]: { text: "#B45309", bg: "#FEF3C7" },
  [ROLES.UNIVERSITY_ADMIN]: { text: "#B01E1E", bg: "#FDF0F0" },
  [ROLES.EVENT_STAFF]: { text: "#15803D", bg: "#EAF4EE" },
  [ROLES.FACILITY_MANAGER]: { text: "#78350F", bg: "#F5EDE4" },
};

// Demo / fast-testing accounts. All passwords: "12345"
export const MOCK_USERS = [
  {
    id: "u1",
    name: "Layla Haddad",
    username: "220101", // students log in with their university ID
    universityId: "220101",
    phone: "0790000001",
    password: "12345",
    role: ROLES.STUDENT,
    club: null,
  },
  {
    id: "u2",
    name: "Omar Nasser",
    username: "club_admin",
    universityId: "220102",
    phone: "0790000002",
    password: "12345",
    role: ROLES.CLUB_ADMIN,
    club: "Robotics Club",
  },
  {
    id: "u3",
    name: "Dr. Rana Youssef",
    username: "uni_admin",
    universityId: "220103",
    phone: "0790000003",
    password: "12345",
    role: ROLES.UNIVERSITY_ADMIN,
    club: null,
  },
  {
    id: "u4",
    name: "Karim Sami",
    username: "event_staff",
    universityId: "220104",
    phone: "0790000004",
    password: "12345",
    role: ROLES.EVENT_STAFF,
    club: null,
  },
  {
    id: "u5",
    name: "Huda Amin",
    username: "fac_manager",
    universityId: "220105",
    phone: "0790000005",
    password: "12345",
    role: ROLES.FACILITY_MANAGER,
    club: null,
  },
];
