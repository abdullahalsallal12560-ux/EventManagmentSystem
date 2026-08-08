import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle, Maximize2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getRegistrationsByUser } from "../data/registrationsStore";
import { getAllEvents } from "../data/eventsStore";
import { getAllClubs } from "../data/clubsStore";
import { getAllCheckins } from "../data/checkinsStore";
import PageShell from "../components/PageShell";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import QRCodeModal from "../components/QRCodeModal";
import { RowSkeleton } from "../components/Skeleton";
import { useMinimumLoadingTime } from "../utils/useMinimumLoadingTime";
import { timeUntil } from "../utils/timeAgo";
import { Link } from "react-router-dom";

export default function MyRegistrations() {
  const { user } = useAuth();

  const [registrations, setRegistrations] = useState([]);
  const [events, setEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [fullScreenTicket, setFullScreenTicket] = useState(null); // { reg, event } | null
  const showSkeleton = useMinimumLoadingTime(loading, 400);

  async function loadData() {
    setLoading(true);
    setError(false);
    try {
      const [registrationList, eventList, clubList, checkinList] = await Promise.all([
        getRegistrationsByUser(user.id),
        getAllEvents(),
        getAllClubs(),
        getAllCheckins(),
      ]);
      setRegistrations(registrationList.filter((r) => r.status !== "cancelled"));
      setEvents(eventList);
      setClubs(clubList);
      setCheckins(checkinList);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function eventFor(eventId) {
    return events.find((e) => e.id === eventId);
  }
  function clubName(clubId) {
    return clubs.find((c) => c.id === clubId)?.name || "Unknown club";
  }

  const today = new Date().toISOString().slice(0, 10);
  const withEvent = registrations.map((r) => ({ reg: r, event: eventFor(r.eventId) })).filter((x) => x.event);
  const upcoming = withEvent
    .filter((x) => x.event.proposedDate >= today)
    .sort((a, b) => new Date(a.event.proposedDate) - new Date(b.event.proposedDate));
  const past = withEvent
    .filter((x) => x.event.proposedDate < today)
    .sort((a, b) => new Date(b.event.proposedDate) - new Date(a.event.proposedDate));

  return (
    <PageShell title="My Tickets" subtitle="Your event registrations and digital tickets.">
      {showSkeleton ? (
        <div className="space-y-3">
          <RowSkeleton /><RowSkeleton /><RowSkeleton />
        </div>
      ) : error ? (
        <ErrorState onRetry={loadData} />
      ) : registrations.length === 0 ? (
        <EmptyState
          title="No tickets yet"
          description="You haven't registered for any events yet."
          action={<Link to="/student/events" className="text-sm font-medium" style={{ color: "var(--accent)" }}>Browse events →</Link>}
        />
      ) : (
        <div className="space-y-10">
          <section>
            <h2 className="text-sm font-medium uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>
              Upcoming
            </h2>
            {upcoming.length === 0 ? (
              <EmptyState title="No upcoming tickets" />
            ) : (
              <div className="space-y-4">
                {upcoming.map(({ reg, event }) => {
                  const checkedIn = checkins.some((c) => c.registrationId === reg.id);
                  return (
                    <div
                      key={reg.id}
                      className="rounded-xl border p-5 flex flex-col sm:flex-row sm:items-center gap-5"
                      style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}
                    >
                      <div className="flex-1 min-w-0">
                        <Link to={`/event/${event.id}`}>
                          <p className="text-sm font-medium font-serif" style={{ color: "var(--text)" }}>{event.title}</p>
                        </Link>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {clubName(event.clubId)} · {event.proposedDate}
                          {event.location ? ` · ${event.location}` : ""}
                        </p>
                        <span
                          className="inline-block text-xs font-medium px-2.5 py-1 rounded-full mt-2"
                          style={{ background: "var(--accent-bg)", color: "var(--accent-dark)" }}
                        >
                          {timeUntil(event.proposedDate)}
                        </span>
                      </div>
                      {checkedIn ? (
                        <div className="text-center shrink-0 px-4">
                          <CheckCircle size={48} style={{ color: "var(--success)" }} className="mx-auto" />
                          <p className="text-sm font-medium mt-2" style={{ color: "var(--success)" }}>You're checked in!</p>
                          <p className="text-xs mt-0.5 max-w-[10rem]" style={{ color: "var(--text-muted)" }}>{event.title}</p>
                        </div>
                      ) : (
                        <div className="text-center shrink-0">
                          <div className="p-2 rounded-lg border inline-block" style={{ borderColor: "var(--border)", background: "#fff" }}>
                            <QRCodeSVG value={reg.id} size={120} />
                          </div>
                          <button
                            onClick={() => setFullScreenTicket({ reg, event })}
                            className="flex items-center gap-1 text-xs font-medium mt-2 mx-auto"
                            style={{ color: "var(--accent)" }}
                          >
                            <Maximize2 size={12} /> Full Screen
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-sm font-medium uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>
              Past
            </h2>
            {past.length === 0 ? (
              <EmptyState title="No past tickets" />
            ) : (
              <div className="space-y-3">
                {past.map(({ reg, event }) => {
                  const attended = checkins.some((c) => c.registrationId === reg.id);
                  return (
                    <div
                      key={reg.id}
                      className="rounded-xl border p-4 flex items-center justify-between gap-3 opacity-70"
                      style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}
                    >
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{event.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {clubName(event.clubId)} · {event.proposedDate}
                        </p>
                      </div>
                      <span
                        className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
                        style={
                          attended
                            ? { background: "var(--success-bg)", color: "var(--success)" }
                            : { background: "var(--bg-subtle)", color: "var(--text-faint)" }
                        }
                      >
                        {attended ? "Attended ✓" : "Missed"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      <QRCodeModal
        open={!!fullScreenTicket}
        value={fullScreenTicket?.reg.id}
        title={fullScreenTicket?.event.title}
        subtitle={fullScreenTicket ? `${clubName(fullScreenTicket.event.clubId)} · ${fullScreenTicket.event.proposedDate}` : ""}
        onClose={() => setFullScreenTicket(null)}
      />
    </PageShell>
  );
}
