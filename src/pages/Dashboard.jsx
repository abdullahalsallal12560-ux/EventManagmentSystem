import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useOnboarding } from "../context/OnboardingContext";
import { ROLES, ROLE_LABELS, ROLE_COLORS } from "../data/mockUsers";
import { ONBOARDING_STEPS } from "../data/onboardingSteps";
import PageShell from "../components/PageShell";
import StatCard from "../components/StatCard";
import EventCard from "../components/EventCard";
import ClubCard from "../components/ClubCard";
import Avatar from "../components/Avatar";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import CheckInScanner from "../components/CheckInScanner";
import ClubApplicationModal from "../components/ClubApplicationModal";
import OnboardingTour from "../components/OnboardingTour";
import { StatCardSkeleton, CardSkeleton, RowSkeleton } from "../components/Skeleton";
import { useMinimumLoadingTime } from "../utils/useMinimumLoadingTime";
import { timeAgo } from "../utils/timeAgo";

import { getAllClubs, getClubsByAdmin } from "../data/clubsStore";
import {
  getMembershipsByUser,
  getMembershipsByClub,
  updateMembershipStatus,
  MEMBERSHIP_STATUS,
} from "../data/clubMembershipsStore";
import { getAllEvents, getEventsByClub, getEventsByStatus, EVENT_STATUS } from "../data/eventsStore";
import { getRegistrationsByUser, registerForEvent, getAllRegistrations } from "../data/registrationsStore";
import { getAllCheckins } from "../data/checkinsStore";
import { getAllUsers, getUsersByIds } from "../data/usersStore";
import { getAllVenues } from "../data/venuesStore";
import { getAllVenueReservations } from "../data/venueReservationsStore";

const STATUS_PILL = {
  [EVENT_STATUS.PENDING]: { bg: "var(--warning-bg)", text: "var(--warning)", label: "Pending" },
  [EVENT_STATUS.APPROVED]: { bg: "var(--success-bg)", text: "var(--success)", label: "Approved" },
  [EVENT_STATUS.REJECTED]: { bg: "var(--accent-bg)", text: "var(--accent-dark)", label: "Rejected" },
};

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function RoleBadge({ role }) {
  const colors = ROLE_COLORS[role];
  return (
    <span
      className="inline-block text-xs font-medium px-2.5 py-1 rounded-full"
      style={{ background: colors.bg, color: colors.text }}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 className="text-sm font-medium uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>
      {children}
    </h2>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const { pendingStart, clearPendingStart } = useOnboarding();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [tourOpen, setTourOpen] = useState(false);
  const showSkeleton = useMinimumLoadingTime(loading, 400);

  async function loadData() {
    if (!user) return;
    setLoading(true);
    setLoadFailed(false);

    try {
      if (user.role === ROLES.STUDENT) {
        const [clubs, myMemberships, allEvents, myRegistrations, allCheckins, allRegistrations] = await Promise.all([
          getAllClubs(),
          getMembershipsByUser(user.id),
          getAllEvents(),
          getRegistrationsByUser(user.id),
          getAllCheckins(),
          getAllRegistrations(),
        ]);
        const registrationCounts = {};
        allRegistrations.forEach((r) => {
          if (r.status === "cancelled") return;
          registrationCounts[r.eventId] = (registrationCounts[r.eventId] || 0) + 1;
        });
        setData({ clubs, myMemberships, allEvents, myRegistrations, allCheckins, registrationCounts });
      } else if (user.role === ROLES.CLUB_ADMIN) {
        const clubs = await getClubsByAdmin(user.id);
        const club = clubs[0] || null;
        if (club) {
          const [memberships, events] = await Promise.all([
            getMembershipsByClub(club.id),
            getEventsByClub(club.id),
          ]);
          const approvedIds = memberships.filter((m) => m.status === MEMBERSHIP_STATUS.APPROVED).map((m) => m.userId);
          const pendingIds = memberships.filter((m) => m.status === MEMBERSHIP_STATUS.PENDING).map((m) => m.userId);
          const memberUsers = await getUsersByIds([...approvedIds, ...pendingIds]);
          setData({ club, memberships, events, memberUsers });
        } else {
          setData({ club: null });
        }
      } else if (user.role === ROLES.UNIVERSITY_ADMIN) {
        const [clubs, users, events] = await Promise.all([getAllClubs(), getAllUsers(), getAllEvents()]);
        setData({ clubs, users, events });
      } else if (user.role === ROLES.FACILITY_MANAGER) {
        const [venues, reservations, events] = await Promise.all([
          getAllVenues(),
          getAllVenueReservations(),
          getAllEvents(),
        ]);
        setData({ venues, reservations, events });
      } else {
        setData({});
      }
    } catch (err) {
      console.error(err);
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // First-ever visit: auto-start the tour once this page's own data has
  // loaded (so every step's target actually exists in the DOM).
  useEffect(() => {
    if (!user || showSkeleton) return;
    if (!window.localStorage.getItem(`onboarding_done_${user.id}`)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTourOpen(true);
    }
  }, [user, showSkeleton]);

  // The "?" button in TopBar sets this from any page, possibly navigating
  // here first — wait for data to load, then open regardless of the
  // "already done" flag (the whole point of a manual replay).
  useEffect(() => {
    if (pendingStart && !showSkeleton) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTourOpen(true);
      clearPendingStart();
    }
  }, [pendingStart, showSkeleton, clearPendingStart]);

  function handleTourClose() {
    setTourOpen(false);
    if (user) window.localStorage.setItem(`onboarding_done_${user.id}`, "true");
  }

  if (!user) return null;

  async function handleMembershipDecision(membership, status) {
    setBusyId(membership.id);
    await updateMembershipStatus(membership.id, status);
    toast.success(status === MEMBERSHIP_STATUS.APPROVED ? "Member request approved." : "Member request rejected.");
    setBusyId(null);
    loadData();
  }

  return (
    <PageShell>
      <div className="mb-8">
        <RoleBadge role={user.role} />
        <h1 className="text-3xl font-serif mt-3" style={{ color: "var(--text)" }}>
          {greeting()}, {user.name.split(" ")[0]}
        </h1>
      </div>

      {loadFailed ? (
        <ErrorState onRetry={loadData} />
      ) : (
        <>
          {user.role === ROLES.STUDENT && (
            <StudentDashboard data={data} loading={showSkeleton} user={user} onRefresh={loadData} />
          )}
          {user.role === ROLES.CLUB_ADMIN && (
            <ClubAdminDashboard data={data} loading={showSkeleton} busyId={busyId} onDecision={handleMembershipDecision} user={user} />
          )}
          {user.role === ROLES.UNIVERSITY_ADMIN && (
            <UniversityAdminDashboard data={data} loading={showSkeleton} />
          )}
          {user.role === ROLES.EVENT_STAFF && <EventStaffDashboard user={user} />}
          {user.role === ROLES.FACILITY_MANAGER && (
            <FacilityManagerDashboard data={data} loading={showSkeleton} />
          )}
        </>
      )}

      <OnboardingTour
        open={tourOpen}
        steps={ONBOARDING_STEPS[user.role] || []}
        onFinish={handleTourClose}
        onSkip={handleTourClose}
      />
    </PageShell>
  );
}

// ---------------------------------------------------------------- Student

function StudentDashboard({ data, loading, user, onRefresh }) {
  const toast = useToast();
  const [busyId, setBusyId] = useState(null);
  const [applyClub, setApplyClub] = useState(null);

  async function handleRegister(event) {
    setBusyId(event.id);
    const result = await registerForEvent({ eventId: event.id, userId: user.id });
    setBusyId(null);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(`Registered for ${event.title}.`);
    onRefresh();
  }

  if (loading || !data) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      </div>
    );
  }

  const { clubs, myMemberships, allEvents, myRegistrations, allCheckins, registrationCounts } = data;
  const today = new Date().toISOString().slice(0, 10);

  const approvedMemberships = myMemberships.filter((m) => m.status === MEMBERSHIP_STATUS.APPROVED);
  const myRegistrationIds = new Set(myRegistrations.map((r) => r.id));
  const myCheckins = allCheckins.filter((c) => myRegistrationIds.has(c.registrationId));

  const registeredEventIds = new Set(myRegistrations.filter((r) => r.status !== "cancelled").map((r) => r.eventId));
  const upcomingApproved = allEvents.filter(
    (e) => e.status === EVENT_STATUS.APPROVED && e.proposedDate >= today
  );
  const upcomingCount = upcomingApproved.filter((e) => registeredEventIds.has(e.id)).length;

  const suggestedEvents = upcomingApproved.filter((e) => !registeredEventIds.has(e.id)).slice(0, 3);

  const myClubIds = new Set(myMemberships.map((m) => m.clubId));
  const suggestedClubs = clubs.filter((c) => !myClubIds.has(c.id)).slice(0, 3);

  function clubName(clubId) {
    return clubs.find((c) => c.id === clubId)?.name || "Unknown club";
  }
  function eventFor(eventId) {
    return allEvents.find((e) => e.id === eventId);
  }

  // Activity feed built from existing membership/registration/checkin data.
  const feed = [
    ...myMemberships
      .filter((m) => m.status !== MEMBERSHIP_STATUS.REJECTED)
      .map((m) => ({
        ts: m.joinedAt,
        icon: m.status === MEMBERSHIP_STATUS.APPROVED ? "🎉" : "⏳",
        text: `${m.status === MEMBERSHIP_STATUS.APPROVED ? "Joined" : "Requested to join"} ${clubName(m.clubId)}`,
      })),
    ...myRegistrations.map((r) => ({
      ts: r.registeredAt,
      icon: "🎫",
      text: `Registered for ${eventFor(r.eventId)?.title || "an event"}`,
    })),
    ...myCheckins.map((c) => {
      const reg = myRegistrations.find((r) => r.id === c.registrationId);
      return {
        ts: c.scannedAt,
        icon: "✅",
        text: `Attended ${eventFor(reg?.eventId)?.title || "an event"}`,
      };
    }),
  ]
    .sort((a, b) => new Date(b.ts) - new Date(a.ts))
    .slice(0, 8);

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Clubs Joined" value={approvedMemberships.length} icon="🏛️" />
        <StatCard label="Events Attended" value={myCheckins.length} icon="✅" />
        <StatCard label="Upcoming Events" value={upcomingCount} icon="🗓️" />
      </div>

      <section>
        <SectionTitle>Upcoming for you</SectionTitle>
        {suggestedEvents.length === 0 ? (
          <EmptyState title="No new events right now" description="Check back soon, or browse everything on offer." action={<Link to="/student/events" className="text-sm font-medium" style={{ color: "var(--accent)" }}>Browse events →</Link>} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {suggestedEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                clubName={clubName(event.clubId)}
                status={busyId === event.id ? "registering" : "register"}
                onRegister={handleRegister}
                registrationCount={registrationCounts[event.id] || 0}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionTitle>Your activity feed</SectionTitle>
        {feed.length === 0 ? (
          <EmptyState title="No activity yet" description="Join a club or register for an event to get started." />
        ) : (
          <div className="rounded-xl border divide-y" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
            {feed.map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <span className="text-lg leading-none">{item.icon}</span>
                <p className="text-sm flex-1" style={{ color: "var(--text)" }}>{item.text}</p>
                <span className="text-xs shrink-0" style={{ color: "var(--text-faint)" }}>{timeAgo(item.ts)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionTitle>Clubs you might like</SectionTitle>
        {suggestedClubs.length === 0 ? (
          <EmptyState title="You're in every club!" description="There's nothing new to suggest right now." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {suggestedClubs.map((club) => (
              <ClubCard key={club.id} club={club} membershipStatus="none" onRequest={setApplyClub} />
            ))}
          </div>
        )}
      </section>

      <ClubApplicationModal
        open={!!applyClub}
        club={applyClub}
        userId={user.id}
        onClose={() => setApplyClub(null)}
        onSuccess={onRefresh}
      />
    </div>
  );
}

// -------------------------------------------------------------- Club Admin

function ClubAdminDashboard({ data, loading, busyId, onDecision, user }) {
  if (loading || !data) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
        </div>
        <RowSkeleton />
      </div>
    );
  }

  if (!data.club) {
    return (
      <EmptyState
        title="No club assigned yet"
        description="Ask the University Admin to assign you to manage a club."
      />
    );
  }

  const { memberships, events, memberUsers } = data;
  const approved = memberships.filter((m) => m.status === MEMBERSHIP_STATUS.APPROVED);
  const pending = memberships.filter((m) => m.status === MEMBERSHIP_STATUS.PENDING);
  const recentEvents = [...events].sort((a, b) => new Date(b.proposedDate) - new Date(a.proposedDate)).slice(0, 3);

  const today = new Date().toISOString().slice(0, 10);
  const scannableEvents = events
    .filter((e) => e.status === EVENT_STATUS.APPROVED && e.proposedDate >= today)
    .sort((a, b) => new Date(a.proposedDate) - new Date(b.proposedDate));

  function userFor(userId) {
    return memberUsers.find((u) => u.id === userId);
  }

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Club Members" value={approved.length} icon="👥" />
        <StatCard label="Pending Requests" value={pending.length} icon="⏳" />
        <StatCard label="Events Proposed" value={events.length} icon="🗓️" />
      </div>

      {pending.length > 0 && (
        <section>
          <SectionTitle>Member requests</SectionTitle>
          <div className="rounded-xl border divide-y" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
            {pending.map((m) => {
              const member = userFor(m.userId);
              const busy = busyId === m.id;
              return (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                  <Avatar name={member?.name} size="sm" color={member?.avatarColor} />
                  <p className="text-sm flex-1" style={{ color: "var(--text)" }}>{member ? member.name : "Unknown user"}</p>
                  <button
                    onClick={() => onDecision(m, MEMBERSHIP_STATUS.APPROVED)}
                    disabled={busy}
                    className="text-xs text-white rounded-lg px-3 py-1.5 font-medium disabled:opacity-60"
                    style={{ background: "var(--success)" }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => onDecision(m, MEMBERSHIP_STATUS.REJECTED)}
                    disabled={busy}
                    className="text-xs rounded-lg px-3 py-1.5 font-medium border disabled:opacity-60"
                    style={{ borderColor: "var(--accent-border)", color: "var(--accent-dark)" }}
                  >
                    Reject
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <SectionTitle>Your events</SectionTitle>
        {recentEvents.length === 0 ? (
          <EmptyState title="No events proposed yet" action={<Link to="/club/propose-event" className="text-sm font-medium" style={{ color: "var(--accent)" }}>Propose an event →</Link>} />
        ) : (
          <div className="space-y-3">
            {recentEvents.map((ev) => {
              const pill = STATUS_PILL[ev.status];
              return (
                <div key={ev.id} className="rounded-xl border p-4 flex items-center justify-between gap-3" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{ev.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{ev.proposedDate}</p>
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0" style={{ background: pill.bg, color: pill.text }}>
                    {pill.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <SectionTitle>Club members</SectionTitle>
        {approved.length === 0 ? (
          <EmptyState title="No members yet" description="Be the first to invite members." />
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            {approved.slice(0, 8).map((m) => (
              <Avatar key={m.id} name={userFor(m.userId)?.name} color={userFor(m.userId)?.avatarColor} />
            ))}
            {approved.length > 8 && (
              <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>+{approved.length - 8} more</span>
            )}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <SectionTitle>Check in attendees</SectionTitle>
        <CheckInScanner
          events={scannableEvents}
          scannedBy={user.id}
          emptyEventsMessage="No approved upcoming events to check in right now."
        />
      </section>
    </div>
  );
}

// -------------------------------------------------------- University Admin

function UniversityAdminDashboard({ data, loading }) {
  if (loading || !data) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
        </div>
        <RowSkeleton />
      </div>
    );
  }

  const { clubs, users, events } = data;
  const now = new Date();
  const pendingEvents = events.filter((e) => e.status === EVENT_STATUS.PENDING);
  const eventsThisMonth = events.filter((e) => {
    const d = new Date(e.proposedDate);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const recentUsers = [...users]
    .filter((u) => u.createdAt)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  function clubName(clubId) {
    return clubs.find((c) => c.id === clubId)?.name || "Unknown club";
  }

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Clubs" value={clubs.length} icon="🏛️" />
        <StatCard label="Total Users" value={users.length} icon="👥" />
        <StatCard label="Pending Approvals" value={pendingEvents.length} icon="⏳" />
        <StatCard label="Events This Month" value={eventsThisMonth.length} icon="🗓️" />
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <SectionTitle>Pending event proposals</SectionTitle>
          <Link to="/admin/events" className="text-sm font-medium" style={{ color: "var(--accent)" }}>View all →</Link>
        </div>
        {pendingEvents.length === 0 ? (
          <EmptyState title="Nothing pending" description="All caught up — new proposals will show up here." />
        ) : (
          <div className="space-y-3">
            {pendingEvents.slice(0, 5).map((ev) => (
              <div key={ev.id} className="rounded-xl border p-4 flex items-center justify-between gap-3" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{ev.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{clubName(ev.clubId)} · {ev.proposedDate}</p>
                </div>
                <Link to="/admin/events" className="text-xs font-medium px-3 py-1.5 rounded-lg border shrink-0" style={{ borderColor: "var(--border)", color: "var(--text)" }}>
                  Review →
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionTitle>Recent activity</SectionTitle>
        {recentUsers.length === 0 ? (
          <EmptyState title="No recent accounts" />
        ) : (
          <div className="rounded-xl border divide-y" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
            {recentUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={u.name} size="sm" color={u.avatarColor} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm" style={{ color: "var(--text)" }}>{u.name}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{ROLE_LABELS[u.role]}</p>
                </div>
                <span className="text-xs shrink-0" style={{ color: "var(--text-faint)" }}>{timeAgo(u.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ------------------------------------------------------------- Event Staff

function EventStaffDashboard({ user }) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    async function loadEvents() {
      const approved = await getEventsByStatus(EVENT_STATUS.APPROVED);
      const today = new Date().toISOString().slice(0, 10);
      const upcoming = approved
        .filter((e) => e.proposedDate >= today)
        .sort((a, b) => new Date(a.proposedDate) - new Date(b.proposedDate));
      setEvents(upcoming);
    }
    loadEvents();
  }, []);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Events Assigned" value={0} icon="🎫" />
      </div>

      <div className="rounded-xl border p-6" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
        <p className="text-sm font-medium mb-2" style={{ color: "var(--text)" }}>How to check in attendees</p>
        <ol className="text-sm space-y-1.5 list-decimal list-inside" style={{ color: "var(--text-muted)" }}>
          <li>Select the event you're staffing below.</li>
          <li>Start the scanner and point it at the attendee's ticket QR code.</li>
          <li>A green toast confirms check-in — duplicates and wrong-event scans are flagged automatically.</li>
        </ol>
      </div>

      <CheckInScanner
        events={events}
        scannedBy={user.id}
        emptyEventsMessage="No approved upcoming events to staff right now."
      />
    </div>
  );
}

// -------------------------------------------------------- Facility Manager

function FacilityManagerDashboard({ data, loading }) {
  if (loading || !data) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCardSkeleton /><StatCardSkeleton />
        </div>
        <RowSkeleton />
      </div>
    );
  }

  const { venues, reservations, events } = data;
  const now = new Date();
  const reservationsThisMonth = reservations.filter((r) => {
    const d = new Date(r.startTime);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const upcoming = reservations
    .filter((r) => new Date(r.endTime) >= now && r.status !== "cancelled")
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    .slice(0, 6);

  function eventTitle(eventId) {
    return events.find((e) => e.id === eventId)?.title || "Unknown event";
  }
  function venueName(venueId) {
    return venues.find((v) => v.id === venueId)?.name || "Unknown venue";
  }
  function formatRange(start, end) {
    const s = new Date(start);
    const e = new Date(end);
    const date = s.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const time = (d) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    return `${date} · ${time(s)} – ${time(e)}`;
  }

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard label="Venues Managed" value={venues.length} icon="🏟️" />
        <StatCard label="Reservations This Month" value={reservationsThisMonth.length} icon="📋" />
      </div>

      <section data-tour="reservations-section">
        <SectionTitle>Venue reservations</SectionTitle>
        {upcoming.length === 0 ? (
          <EmptyState title="No upcoming reservations" description="Reservations will show up here once events book a venue." />
        ) : (
          <div className="rounded-xl border divide-y" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
            {upcoming.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{eventTitle(r.eventId)}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{venueName(r.venueId)}</p>
                </div>
                <span className="text-xs shrink-0" style={{ color: "var(--text-faint)" }}>{formatRange(r.startTime, r.endTime)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section data-tour="venues-section">
        <SectionTitle>Venues</SectionTitle>
        {venues.length === 0 ? (
          <EmptyState title="No venues yet" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {venues.map((v) => (
              <div key={v.id} className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{v.name}</p>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0" style={{ background: "var(--success-bg)", color: "var(--success)" }}>
                    {v.status || "available"}
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{v.location}</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Capacity: {v.capacity}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
