import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { ROLES } from "../data/mockUsers";
import { getEventById, EVENT_STATUS } from "../data/eventsStore";
import { getClubById } from "../data/clubsStore";
import { getRegistrationsByEvent, registerForEvent } from "../data/registrationsStore";
import { getUsersByIds } from "../data/usersStore";
import { placeholderImageUrl } from "../data/placeholderImages";
import TopBar from "../components/TopBar";
import Avatar from "../components/Avatar";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import { RowSkeleton } from "../components/Skeleton";
import { useMinimumLoadingTime } from "../utils/useMinimumLoadingTime";

const STATUS_PILL = {
  [EVENT_STATUS.PENDING]: { bg: "var(--warning-bg)", text: "var(--warning)", label: "Pending review" },
  [EVENT_STATUS.APPROVED]: { bg: "var(--success-bg)", text: "var(--success)", label: "Approved" },
  [EVENT_STATUS.REJECTED]: { bg: "var(--accent-bg)", text: "var(--accent-dark)", label: "Rejected" },
};

export default function EventDetail() {
  const { eventId } = useParams();
  const { user } = useAuth();
  const toast = useToast();

  const [event, setEvent] = useState(null);
  const [club, setClub] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [attendees, setAttendees] = useState([]);
  const [myRegistration, setMyRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const showSkeleton = useMinimumLoadingTime(loading, 400);

  async function loadData() {
    setLoading(true);
    setError(false);
    try {
      const foundEvent = await getEventById(eventId);
      if (!foundEvent) {
        setEvent(null);
        return;
      }
      const [foundClub, eventRegistrations] = await Promise.all([
        getClubById(foundEvent.clubId),
        getRegistrationsByEvent(eventId),
      ]);
      const activeRegistrations = eventRegistrations.filter((r) => r.status !== "cancelled");
      const attendeeUsers = await getUsersByIds(activeRegistrations.map((r) => r.userId));

      setEvent(foundEvent);
      setClub(foundClub);
      setRegistrations(activeRegistrations);
      setAttendees(attendeeUsers);
      setMyRegistration(user.role === ROLES.STUDENT ? activeRegistrations.find((r) => r.userId === user.id) || null : null);
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
  }, [eventId]);

  const hasCapacity = event && typeof event.maxAttendees === "number";
  const spotsLeft = hasCapacity ? event.maxAttendees - registrations.length : null;
  const isFull = hasCapacity && spotsLeft <= 0;

  async function handleRegister() {
    setBusy(true);
    const result = await registerForEvent({ eventId, userId: user.id });
    setBusy(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(`Registered for ${event.title}.`);
    loadData();
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <TopBar />
      {showSkeleton ? (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10"><RowSkeleton /></div>
      ) : error ? (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
          <ErrorState onRetry={loadData} />
        </div>
      ) : !event ? (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
          <EmptyState title="Event not found" description="It may have been removed." />
        </div>
      ) : (
        <>
          <div className="w-full" style={{ height: 320, overflow: "hidden" }}>
            <img
              src={event.imageUrl || placeholderImageUrl(event.title)}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-3xl font-serif" style={{ color: "var(--text)" }}>{event.title}</h1>
                {club && (
                  <Link to={`/club/${club.id}`} className="text-sm font-medium hover:underline" style={{ color: "var(--accent)" }}>
                    {club.name}
                  </Link>
                )}
              </div>
              <span
                className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
                style={{ background: STATUS_PILL[event.status].bg, color: STATUS_PILL[event.status].text }}
              >
                {STATUS_PILL[event.status].label}
              </span>
            </div>

            <div className="flex flex-wrap gap-4 mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
              <span>📅 {event.proposedDate}</span>
              {(event.startTime || event.endTime) && (
                <span>🕒 {event.startTime}{event.endTime ? ` – ${event.endTime}` : ""}</span>
              )}
              {event.location && <span>📍 {event.location}</span>}
              {typeof event.maxAttendees === "number" && (
                <span>👥 {registrations.length}/{event.maxAttendees} registered</span>
              )}
            </div>

            {spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 10 && (
              <span
                className="inline-block text-xs font-medium px-2.5 py-1 rounded-full mt-3"
                style={{ background: "var(--warning-bg)", color: "var(--warning)" }}
              >
                Only {spotsLeft} spot{spotsLeft === 1 ? "" : "s"} left
              </span>
            )}

            {event.description && (
              <p className="text-sm mt-6 leading-relaxed max-w-2xl" style={{ color: "var(--text)" }}>{event.description}</p>
            )}

            <div className="mt-6">
              {user.role === ROLES.STUDENT ? (
                event.status !== EVENT_STATUS.APPROVED ? (
                  <span className="inline-block text-sm font-medium px-4 py-2 rounded-lg" style={{ background: "var(--bg-subtle)", color: "var(--text-faint)" }}>
                    Registration opens once this event is approved
                  </span>
                ) : myRegistration ? (
                  <span className="inline-block text-sm font-medium px-4 py-2 rounded-lg" style={{ background: "var(--success-bg)", color: "var(--success)" }}>
                    Registered ✓
                  </span>
                ) : isFull ? (
                  <span className="inline-block text-sm font-medium px-4 py-2 rounded-lg" style={{ background: "var(--bg-subtle)", color: "var(--text-faint)" }}>
                    Event Full
                  </span>
                ) : (
                  <button
                    onClick={handleRegister}
                    disabled={busy}
                    className="text-sm text-white rounded-lg px-5 py-2.5 font-medium disabled:opacity-60"
                    style={{ background: "var(--accent)" }}
                  >
                    {busy ? "Registering..." : "Register"}
                  </button>
                )
              ) : (
                <span
                  className="inline-block text-sm font-medium px-4 py-2 rounded-lg"
                  style={{ background: STATUS_PILL[event.status].bg, color: STATUS_PILL[event.status].text }}
                >
                  {STATUS_PILL[event.status].label}
                </span>
              )}
            </div>

            <section className="mt-10">
              <h2 className="text-sm font-medium uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>
                Who's going ({registrations.length})
              </h2>
              {attendees.length === 0 ? (
                <EmptyState title="No one has registered yet" description="Be the first!" />
              ) : (
                <div className="flex flex-wrap gap-3">
                  {attendees.slice(0, 12).map((u) => (
                    <div key={u.id} className="flex flex-col items-center gap-1 w-16">
                      <Avatar name={u.name} color={u.avatarColor} />
                      <span className="text-xs truncate w-full text-center" style={{ color: "var(--text-muted)" }}>{u.name.split(" ")[0]}</span>
                    </div>
                  ))}
                  {attendees.length > 12 && (
                    <div className="flex items-center text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                      +{attendees.length - 12} more
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
