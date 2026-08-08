import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Pencil } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { ROLES } from "../data/mockUsers";
import { getClubById, updateClub } from "../data/clubsStore";
import { getMembershipsByClub, MEMBERSHIP_STATUS } from "../data/clubMembershipsStore";
import { getEventsByClub, EVENT_STATUS } from "../data/eventsStore";
import { getUsersByIds } from "../data/usersStore";
import { registerForEvent, getRegistrationsByUser } from "../data/registrationsStore";
import { placeholderImageUrl } from "../data/placeholderImages";
import EventCard from "../components/EventCard";
import Avatar from "../components/Avatar";
import EmptyState from "../components/EmptyState";
import TopBar from "../components/TopBar";
import { RowSkeleton } from "../components/Skeleton";
import { useMinimumLoadingTime } from "../utils/useMinimumLoadingTime";

const inputStyle = { borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)", "--tw-ring-color": "var(--accent)" };

export default function ClubProfile() {
  const { clubId } = useParams();
  const { user } = useAuth();
  const toast = useToast();

  const [club, setClub] = useState(null);
  const [members, setMembers] = useState([]);
  const [memberUsers, setMemberUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [busyEventId, setBusyEventId] = useState(null);
  const [loading, setLoading] = useState(true);
  const showSkeleton = useMinimumLoadingTime(loading, 400);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);
    const foundClub = await getClubById(clubId);
    if (!foundClub) {
      setClub(null);
      setLoading(false);
      return;
    }
    const [memberships, clubEvents] = await Promise.all([
      getMembershipsByClub(clubId),
      getEventsByClub(clubId),
    ]);
    const approvedMemberships = memberships.filter((m) => m.status === MEMBERSHIP_STATUS.APPROVED);
    const users = await getUsersByIds(approvedMemberships.map((m) => m.userId));

    if (user?.role === ROLES.STUDENT) {
      setMyRegistrations(await getRegistrationsByUser(user.id));
    }

    setClub(foundClub);
    setName(foundClub.name);
    setDescription(foundClub.description || "");
    setMembers(approvedMemberships);
    setMemberUsers(users);
    setEvents(clubEvents);
    setLoading(false);
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

  function eventStatusFor(event) {
    if (user?.role !== ROLES.STUDENT) return "readonly";
    if (busyEventId === event.id) return "registering";
    const registered = myRegistrations.some((r) => r.eventId === event.id && r.status !== "cancelled");
    return registered ? "registered" : "register";
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    await updateClub(clubId, { name: name.trim(), description: description.trim() });
    setSaving(false);
    toast.success("Club updated.");
    setEditing(false);
    loadData();
  }

  const isAdmin = club && user && club.adminId === user.id;
  const today = new Date().toISOString().slice(0, 10);
  const upcomingEvents = events
    .filter((e) => e.status === EVENT_STATUS.APPROVED && e.proposedDate >= today)
    .sort((a, b) => new Date(a.proposedDate) - new Date(b.proposedDate))
    .slice(0, 3);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <TopBar />
      {showSkeleton ? (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10"><RowSkeleton /></div>
      ) : !club ? (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
          <EmptyState title="Club not found" description="It may have been removed." />
        </div>
      ) : (
        <>
          <div className="w-full" style={{ height: 280, overflow: "hidden" }}>
            <img
              src={club.imageUrl || placeholderImageUrl(club.name)}
              alt={club.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
            {editing ? (
              <form onSubmit={handleSave} className="rounded-xl border p-5 mb-8 space-y-3" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-lg font-serif focus:outline-none focus:ring-2 focus:border-transparent"
                  style={inputStyle}
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                  style={inputStyle}
                />
                <div className="flex gap-2">
                  <button type="submit" disabled={saving} className="text-sm text-white rounded-lg px-4 py-2 font-medium disabled:opacity-60" style={{ background: "var(--accent)" }}>
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                  <button type="button" onClick={() => setEditing(false)} className="text-sm rounded-lg px-4 py-2 font-medium border" style={{ borderColor: "var(--border)", color: "var(--text)" }}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="text-3xl font-serif" style={{ color: "var(--text)" }}>{club.name}</h1>
                {isAdmin && (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 text-sm rounded-lg px-3 py-1.5 border shrink-0"
                    style={{ borderColor: "var(--border)", color: "var(--text)" }}
                  >
                    <Pencil size={14} /> Edit
                  </button>
                )}
              </div>
            )}

            {!editing && (
              <>
                {club.description && (
                  <p className="text-sm mt-2 max-w-2xl" style={{ color: "var(--text-muted)" }}>{club.description}</p>
                )}
                <p className="text-sm mt-2" style={{ color: "var(--text-faint)" }}>
                  {members.length} member{members.length === 1 ? "" : "s"}
                </p>
              </>
            )}

            <section className="mt-10">
              <h2 className="text-sm font-medium uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>
                Upcoming events
              </h2>
              {upcomingEvents.length === 0 ? (
                <EmptyState title="No upcoming events" description="This club hasn't scheduled anything yet." />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {upcomingEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      clubName={club.name}
                      status={eventStatusFor(event)}
                      onRegister={handleRegister}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="mt-10">
              <h2 className="text-sm font-medium uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>
                Members
              </h2>
              {memberUsers.length === 0 ? (
                <EmptyState title="No members yet" description="Be the first to invite members." />
              ) : (
                <div className="flex flex-wrap gap-3">
                  {memberUsers.slice(0, 12).map((u) => (
                    <div key={u.id} className="flex flex-col items-center gap-1 w-16">
                      <Avatar name={u.name} color={u.avatarColor} />
                      <span className="text-xs truncate w-full text-center" style={{ color: "var(--text-muted)" }}>{u.name.split(" ")[0]}</span>
                    </div>
                  ))}
                  {memberUsers.length > 12 && (
                    <div className="flex items-center text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                      +{memberUsers.length - 12} more
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
