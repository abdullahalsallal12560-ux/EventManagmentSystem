// Single source of truth for "has this event already happened?".
//
// Before this module existed the same comparison was written out by hand in
// six different places (BrowseEvents, MyRegistrations, three spots in
// Dashboard, and the demo seed) and — critically — was missing entirely from
// registerForEvent and from the Register button on EventDetail. That let a
// student register for an event whose date had already passed, and the
// resulting ticket then rendered as "Missed" straight away, because the
// ticket view *did* compare against the current date.
//
// Every date comparison in the app now goes through this file.

import { EVENT_STATUS } from "../data/eventsStore";

// The university operates in Amman. `new Date().toISOString()` returns UTC,
// which is 3 hours behind local time, so between midnight and 03:00 local a
// UTC-derived "today" is still yesterday's date and a finished event stays
// registerable. Formatting with an explicit time zone removes that window.
// 'en-CA' is used because it formats as YYYY-MM-DD, matching how
// `proposedDate` is stored, so the values stay directly comparable as strings.
export const CAMPUS_TIME_ZONE = "Asia/Amman";

export function todayInCampusTime(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CAMPUS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

// An event is "past" only once its whole day is over, so an event happening
// today — including one already under way — is still treated as current.
// That is deliberate: someone can walk up on the day and register at the door.
export function isEventPast(event, now = new Date()) {
  if (!event?.proposedDate) return false;
  return event.proposedDate < todayInCampusTime(now);
}

export function isEventUpcoming(event, now = new Date()) {
  return !isEventPast(event, now);
}

// The one check every registration path must agree on. Returns null when the
// event can be registered for, or a human-readable reason when it cannot.
// Capacity and duplicate checks stay in registrationsStore, because those
// need the live registration list rather than just the event document.
export function registrationBlockReason(event, now = new Date()) {
  if (!event) return "This event no longer exists.";
  if (event.status !== EVENT_STATUS.APPROVED) {
    return "Registration opens once this event is approved.";
  }
  if (isEventPast(event, now)) {
    return "This event has already taken place, so registration is closed.";
  }
  return null;
}

export function isEventOpenForRegistration(event, now = new Date()) {
  return registrationBlockReason(event, now) === null;
}
