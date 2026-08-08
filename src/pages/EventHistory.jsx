import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getRegistrationsByUser } from "../data/registrationsStore";
import { getAllEvents } from "../data/eventsStore";
import { getAllClubs } from "../data/clubsStore";
import { getAllCheckins } from "../data/checkinsStore";
import PageShell from "../components/PageShell";
import StatCard from "../components/StatCard";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import { RowSkeleton, StatCardSkeleton } from "../components/Skeleton";
import { useMinimumLoadingTime } from "../utils/useMinimumLoadingTime";

export default function EventHistory() {
  const { user } = useAuth();

  const [rows, setRows] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const showSkeleton = useMinimumLoadingTime(loading, 400);

  async function loadData() {
    setLoading(true);
    setError(false);
    try {
      const [registrations, events, clubList, checkins] = await Promise.all([
        getRegistrationsByUser(user.id),
        getAllEvents(),
        getAllClubs(),
        getAllCheckins(),
      ]);

      const today = new Date().toISOString().slice(0, 10);
      const registrationIds = new Set(registrations.map((r) => r.id));
      const checkedInIds = new Set(checkins.filter((c) => registrationIds.has(c.registrationId)).map((c) => c.registrationId));

      const pastRows = registrations
        .map((r) => ({ reg: r, event: events.find((e) => e.id === r.eventId) }))
        .filter((x) => x.event && x.event.proposedDate < today)
        .map((x) => ({ ...x, attended: checkedInIds.has(x.reg.id) }))
        .sort((a, b) => new Date(b.event.proposedDate) - new Date(a.event.proposedDate));

      setRows(pastRows);
      setClubs(clubList);
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
  }, [user.id]);

  function clubName(clubId) {
    return clubs.find((c) => c.id === clubId)?.name || "Unknown club";
  }

  const attended = rows.filter((r) => r.attended);
  const missed = rows.filter((r) => !r.attended);
  const rate = rows.length > 0 ? Math.round((attended.length / rows.length) * 100) : 0;

  return (
    <PageShell title="My History" subtitle="Your past event participation.">
      {showSkeleton ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
          </div>
          <RowSkeleton />
        </div>
      ) : error ? (
        <ErrorState onRetry={loadData} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No past events yet"
          description="Once your registered events happen, they'll show up here."
          action={<Link to="/student/events" className="text-sm font-medium" style={{ color: "var(--accent)" }}>Browse events →</Link>}
        />
      ) : (
        <div className="space-y-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Events Attended" value={attended.length} icon="✅" />
            <StatCard label="Events Missed" value={missed.length} icon="⭘" />
            <StatCard label="Attendance Rate" value={`${rate}%`} icon="📊" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section>
              <h2 className="text-sm font-medium uppercase tracking-wide mb-3" style={{ color: "var(--success)" }}>
                Attended
              </h2>
              {attended.length === 0 ? (
                <EmptyState title="Nothing attended yet" />
              ) : (
                <div className="space-y-3">
                  {attended.map(({ reg, event }) => (
                    <div key={reg.id} className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link to={`/event/${event.id}`}>
                            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{event.title}</p>
                          </Link>
                          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                            {clubName(event.clubId)} · {event.proposedDate}{event.location ? ` · ${event.location}` : ""}
                          </p>
                        </div>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0" style={{ background: "var(--success-bg)", color: "var(--success)" }}>✓</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-sm font-medium uppercase tracking-wide mb-3" style={{ color: "var(--text-faint)" }}>
                Missed
              </h2>
              {missed.length === 0 ? (
                <EmptyState title="You haven't missed anything" />
              ) : (
                <div className="space-y-3">
                  {missed.map(({ reg, event }) => (
                    <div key={reg.id} className="rounded-xl border p-4 opacity-70" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
                      <Link to={`/event/${event.id}`}>
                        <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{event.title}</p>
                      </Link>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {clubName(event.clubId)} · {event.proposedDate}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </PageShell>
  );
}
