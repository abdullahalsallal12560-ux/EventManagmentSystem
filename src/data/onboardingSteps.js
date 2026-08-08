import { ROLES } from "./mockUsers";

// `target` matches a `data-tour="<value>"` attribute on the real element to
// spotlight; `target: null` renders a plain centered welcome card instead.
export const ONBOARDING_STEPS = {
  [ROLES.STUDENT]: [
    { target: null, text: "Welcome! This is your dashboard — see upcoming events and your clubs at a glance" },
    { target: "nav-discover", text: "Browse and register for events happening on campus" },
    { target: "nav-my-clubs", text: "Join clubs that match your interests" },
    { target: "nav-my-tickets", text: "View your registered events and QR codes for check-in" },
    { target: "theme-toggle", text: "Switch between dark and light mode anytime" },
  ],
  [ROLES.CLUB_ADMIN]: [
    { target: null, text: "Welcome! You manage a student club. Here's how to get started" },
    { target: "nav-my-events", text: "Submit new event proposals for university approval" },
    { target: "nav-members", text: "Review and approve membership applications" },
    { target: "checkin-scanner", text: "Check in attendees at your events using their ticket QR code" },
  ],
  [ROLES.UNIVERSITY_ADMIN]: [
    { target: null, text: "Welcome! You oversee all university clubs and events" },
    { target: "nav-approvals", text: "Review and approve or reject event proposals from clubs" },
    { target: "nav-clubs", text: "Manage all registered clubs and assign admins" },
    { target: "nav-users", text: "Provision new user accounts for students and staff" },
  ],
  [ROLES.EVENT_STAFF]: [
    { target: null, text: "Welcome! Your job is to check in attendees at events" },
    { target: "event-selector", text: "Select the event you are staffing today" },
    { target: "checkin-scanner", text: "Start the scanner and point it at attendees' ticket QR codes" },
  ],
  [ROLES.FACILITY_MANAGER]: [
    { target: null, text: "Welcome! You manage campus venues and reservations" },
    { target: "venues-section", text: "View and manage all campus venues and their capacity" },
    { target: "reservations-section", text: "See all upcoming venue reservations for events" },
  ],
};
