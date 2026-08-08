import { useState, useEffect } from "react";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getClubsByAdmin } from "../data/clubsStore";
import { getUsersByIds } from "../data/usersStore";
import {
  getMembershipsByClub,
  updateMembershipStatus,
  removeMember,
  MEMBERSHIP_STATUS,
} from "../data/clubMembershipsStore";
import PageShell from "../components/PageShell";
import Avatar from "../components/Avatar";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import ConfirmDialog from "../components/ConfirmDialog";
import { RowSkeleton } from "../components/Skeleton";
import { useMinimumLoadingTime } from "../utils/useMinimumLoadingTime";

export default function ManageClubMembers() {
  const { user } = useAuth();
  const toast = useToast();

  const [club, setClub] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [search, setSearch] = useState("");
  const [removeTarget, setRemoveTarget] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const showSkeleton = useMinimumLoadingTime(loading, 400);

  async function loadData() {
    setLoading(true);
    setError(false);
    try {
      const clubs = await getClubsByAdmin(user.id);
      const myClub = clubs[0] || null;
      setClub(myClub);

      if (myClub) {
        const membershipList = await getMembershipsByClub(myClub.id);
        const userList = await getUsersByIds(membershipList.map((m) => m.userId));
        setMemberships(membershipList);
        setUsers(userList);
      }
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

  function userFor(userId) {
    return users.find((u) => u.id === userId);
  }

  function toggleExpanded(membershipId) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(membershipId)) next.delete(membershipId);
      else next.add(membershipId);
      return next;
    });
  }

  async function handleDecision(membership, status) {
    setBusyId(membership.id);
    await updateMembershipStatus(membership.id, status);
    toast.success(status === MEMBERSHIP_STATUS.APPROVED ? "Request approved." : "Request rejected.");
    setBusyId(null);
    loadData();
  }

  async function confirmRemove() {
    if (!removeTarget) return;
    setBusyId(removeTarget.id);
    await removeMember(removeTarget.id);
    toast.success("Member removed.");
    setBusyId(null);
    setRemoveTarget(null);
    loadData();
  }

  const pending = memberships.filter((m) => m.status === MEMBERSHIP_STATUS.PENDING);
  const approvedAll = memberships.filter((m) => m.status === MEMBERSHIP_STATUS.APPROVED);
  const approved = approvedAll.filter((m) => {
    const member = userFor(m.userId);
    return !search.trim() || member?.name.toLowerCase().includes(search.trim().toLowerCase());
  });

  return (
    <PageShell title={club ? club.name : "Members"} subtitle="Manage who's part of your club.">
      {showSkeleton ? (
        <div className="space-y-3"><RowSkeleton /><RowSkeleton /></div>
      ) : error ? (
        <ErrorState onRetry={loadData} />
      ) : !club ? (
        <EmptyState title="No club assigned yet" description="Ask the University Admin to assign you to manage a club." />
      ) : (
        <>
          <section className="mb-10">
            <h2 className="text-sm font-medium uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>
              Pending requests
            </h2>
            {pending.length === 0 ? (
              <EmptyState title="No pending requests" />
            ) : (
              <div className="rounded-xl border divide-y" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
                {pending.map((m) => {
                  const member = userFor(m.userId);
                  const busy = busyId === m.id;
                  const expanded = expandedIds.has(m.id);
                  const app = m.applicationData;
                  return (
                    <div key={m.id}>
                      <div className="flex items-center gap-3 px-4 py-3 flex-wrap">
                        <button
                          type="button"
                          onClick={() => toggleExpanded(m.id)}
                          className="flex items-center gap-3 flex-1 min-w-[10rem] text-left"
                          aria-expanded={expanded}
                        >
                          {expanded ? (
                            <ChevronDown size={16} style={{ color: "var(--text-faint)" }} />
                          ) : (
                            <ChevronRight size={16} style={{ color: "var(--text-faint)" }} />
                          )}
                          <Avatar name={member?.name} color={member?.avatarColor} size="sm" />
                          <div>
                            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{member ? member.name : "Unknown user"}</p>
                            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                              {member ? `@${member.username}` : ""} · Requested {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : ""}
                            </p>
                          </div>
                        </button>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => handleDecision(m, MEMBERSHIP_STATUS.APPROVED)}
                            disabled={busy}
                            className="text-xs text-white rounded-lg px-3 py-1.5 font-medium disabled:opacity-60"
                            style={{ background: "var(--success)" }}
                          >
                            {busy ? "Saving..." : "Approve"}
                          </button>
                          <button
                            onClick={() => handleDecision(m, MEMBERSHIP_STATUS.REJECTED)}
                            disabled={busy}
                            className="text-xs rounded-lg px-3 py-1.5 font-medium border disabled:opacity-60"
                            style={{ borderColor: "var(--accent-border)", color: "var(--accent-dark)" }}
                          >
                            {busy ? "Saving..." : "Reject"}
                          </button>
                        </div>
                      </div>

                      {expanded && (
                        <div className="px-4 pb-4 pl-11 space-y-3">
                          {!app ? (
                            <p className="text-xs" style={{ color: "var(--text-faint)" }}>No application details submitted.</p>
                          ) : (
                            <>
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className="text-xs font-medium px-2.5 py-1 rounded-full"
                                  style={{ background: "var(--accent-bg)", color: "var(--accent-dark)" }}
                                >
                                  GPA {app.gpa?.toFixed ? app.gpa.toFixed(1) : app.gpa}
                                </span>
                                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                                  {app.creditHours} credit hours completed
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs" style={{ color: "var(--text)" }}>
                                <p><span style={{ color: "var(--text-muted)" }}>Major:</span> {app.major}</p>
                                <p><span style={{ color: "var(--text-muted)" }}>Faculty:</span> {app.faculty}</p>
                              </div>

                              {app.skills?.length > 0 && (
                                <div>
                                  <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Skills</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {app.skills.map((skill) => (
                                      <span
                                        key={skill}
                                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                                        style={{ background: "var(--bg-subtle)", color: "var(--text)" }}
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {app.availability?.length > 0 && (
                                <div>
                                  <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Availability</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {app.availability.map((slot) => (
                                      <span
                                        key={slot}
                                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                                        style={{ background: "var(--success-bg)", color: "var(--success)" }}
                                      >
                                        {slot}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {app.why && (
                                <div>
                                  <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Why they want to join</p>
                                  <p className="text-sm italic" style={{ color: "var(--text)" }}>&ldquo;{app.why}&rdquo;</p>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
              <h2 className="text-sm font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                Members ({approvedAll.length})
              </h2>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search members..."
                  className="rounded-lg border pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ borderColor: "var(--border)", background: "var(--bg-card)", color: "var(--text)", "--tw-ring-color": "var(--accent)" }}
                />
              </div>
            </div>
            {approvedAll.length === 0 ? (
              <EmptyState title="No members yet" description="Be the first to invite members." />
            ) : approved.length === 0 ? (
              <EmptyState title="No members match your search" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {approved.map((m) => {
                  const member = userFor(m.userId);
                  const busy = busyId === m.id;
                  return (
                    <div key={m.id} className="rounded-xl border p-4 flex items-center gap-3" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
                      <Avatar name={member?.name} color={member?.avatarColor} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{member ? member.name : "Unknown user"}</p>
                        <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                          {member ? `@${member.username}` : ""}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>
                          Joined {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : "—"}
                        </p>
                      </div>
                      <button
                        onClick={() => setRemoveTarget(m)}
                        disabled={busy}
                        className="text-xs px-3 py-1.5 rounded-md border shrink-0 disabled:opacity-60"
                        style={{ borderColor: "var(--accent-border)", color: "var(--accent-dark)" }}
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      <ConfirmDialog
        open={!!removeTarget}
        title="Remove member?"
        description={`${userFor(removeTarget?.userId)?.name || "This member"} will lose access to ${club?.name || "this club"}'s events and membership.`}
        confirmLabel="Remove"
        busy={busyId === removeTarget?.id}
        onConfirm={confirmRemove}
        onCancel={() => setRemoveTarget(null)}
      />
    </PageShell>
  );
}
