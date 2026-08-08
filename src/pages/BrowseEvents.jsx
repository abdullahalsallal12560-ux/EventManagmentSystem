import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getEventsByStatus, EVENT_STATUS } from "../data/eventsStore";
import { getAllClubs } from "../data/clubsStore";
import { registerForEvent, getRegistrationsByUser } from "../data/registrationsStore";
import { getAllCheckins } from "../data/checkinsStore";
import PageShell from "../components/PageShell";
import EventCard from "../components/EventCard";
import EmptyState from "../components/EmptyState";
import { CardSkeleton } from "../components/Skeleton";
import { useMinimumLoadingTime } from "../utils/useMinimumLoadingTime";

const DATE_FILTERS = [
  { key: "all", label: "All" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
];

function withinFilter(dateStr, filter) {
  if (filter === "all") return true;
  const date = new Date(dateStr);
  const now = new Date();
  if (filter === "week") {
    const weekFromNow = new Date(now);
    weekFromNow.setDate(now.getDate() + 7);
    return date >= now && date <= weekFromNow;
  }
  if (filter === "month") {
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }
  return true;
}

export default function BrowseEvents() {
  const { user } = useAuth();
  const toast = useToast();

  const [tab, setTab] = useState("upcoming"); // "upcoming" | "past"
  const [dateFilter, setDateFilter] = useState("all");
  const [events, setEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [myCheckins, setMyCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyEventId, setBusyEventId] = useState(null);
  const showSkeleton = useMinimumLoadingTime(loading, 400);

  async function loadData() {
    setLoading(true);
    const [eventList, clubList, registrations, checkins] = await Promise.all([
      getEventsByStatus(EVENT_STATUS.APPROVED),
      getAllClubs(),
      getRegistrationsByUser(user.id),
      getAllCheckins(),
    ]);
    setEvents(eventList);
    setClubs(clubList);
    setMyRegistrations(registrations);
    setMyCheckins(checkins);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clubName(clubId) {
    return clubs.find((c) => c.id === clubId)?.name || "Unknown club";
  }

  function registrationFor(eventId) {
    return myRegistrations.find((r) => r.eventId === eventId && r.status !== "cancelled");
  }

  async function handleRegister(event) {
    setBusyEventId(event.id);
    const result = await registerForEvent({ eventId: event.id, userId: user.id });
    setBusyEventId(null);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(`Registered for ${event.title}.`);
    loadData();
  }

  const today = new Date().toISOString().slice(0, 10);
  const upcomingEvents = events
    .filter((e) => e.proposedDate >= today && withinFilter(e.proposedDate, dateFilter))
    .sort((a, b) => new Date(a.proposedDate) - new Date(b.proposedDate));
  const pastEvents = events
    .filter((e) => e.proposedDate < today && withinFilter(e.proposedDate, dateFilter))
    .sort((a, b) => new Date(b.proposedDate) - new Date(a.proposedDate));

  function statusForUpcoming(event) {
    if (busyEventId === event.id) return "registering";
    return registrationFor(event.id) ? "registered" : "register";
  }

  function statusForPast(event) {
    const reg = registrationFor(event.id);
    if (!reg) return null; // never registered — don't show a card CTA state
    const attended = myCheckins.some((c) => c.registrationId === reg.id);
    return attended ? "attended" : "missed";
  }

  const visibleEvents = tab === "upcoming" ? upcomingEvents : pastEvents;

  return (
    <PageShell title="Events" subtitle="Discover what's happening on campus.">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div className="flex gap-1 rounded-lg border p-1" style={{ borderColor: "var(--border)" }}>
          {[
            { key: "upcoming", label: "Upcoming" },
            { key: "past", label: "Past" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="text-sm px-4 py-1.5 rounded-md font-medium transition-colors"
              style={
                tab === t.key
                  ? { background: "var(--accent)", color: "#fff" }
                  : { color: "var(--text-muted)" }
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {DATE_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setDateFilter(f.key)}
              className="text-xs px-3 py-1.5 rounded-full border font-medium transition-colors"
              style={
                dateFilter === f.key
                  ? { background: "var(--accent-bg)", borderColor: "var(--accent-border)", color: "var(--accent-dark)" }
                  : { borderColor: "var(--border)", color: "var(--text-muted)" }
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {showSkeleton ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      ) : visibleEvents.length === 0 ? (
        <EmptyState
          title={tab === "upcoming" ? "No upcoming events" : "No past events"}
          description={tab === "upcoming" ? "Check back soon — new events show up here once approved." : "Nothing to show for this time range yet."}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              clubName={clubName(event.clubId)}
              status={tab === "upcoming" ? statusForUpcoming(event) : statusForPast(event) || "missed"}
              onRegister={handleRegister}
            />
          ))}
        </div>
      )}
    </PageShell>
  );
}
