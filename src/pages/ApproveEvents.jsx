import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getAllEvents, updateEventStatus, EVENT_STATUS } from "../data/eventsStore";
import { recordEventApproval, DECISION } from "../data/eventApprovalsStore";
import { getAllClubs } from "../data/clubsStore";
import { placeholderImageUrl } from "../data/placeholderImages";
import PageShell from "../components/PageShell";
import EmptyState from "../components/EmptyState";
import { RowSkeleton } from "../components/Skeleton";
import { useMinimumLoadingTime } from "../utils/useMinimumLoadingTime";

const STATUS_STYLE = {
  [EVENT_STATUS.PENDING]: { bg: "var(--warning-bg)", text: "var(--warning)", label: "Pending review" },
  [EVENT_STATUS.APPROVED]: { bg: "var(--success-bg)", text: "var(--success)", label: "Approved" },
  [EVENT_STATUS.REJECTED]: { bg: "var(--accent-bg)", text: "var(--accent-dark)", label: "Rejected" },
};

function ProposalCard({ ev, club, isPending, busy, feedback, onFeedbackChange, onDecide }) {
  const style = STATUS_STYLE[ev.status];
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="flex items-start gap-3 min-w-0">
          <img
            src={club?.imageUrl || placeholderImageUrl(club?.name || ev.clubId)}
            alt={club?.name}
            className="w-10 h-10 rounded-lg object-cover shrink-0"
          />
          <div className="min-w-0">
            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{ev.title}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {club ? (
                <Link to={`/club/${club.id}`} className="hover:underline">{club.name}</Link>
              ) : "Unknown club"} · Proposed date: {ev.proposedDate}
            </p>
          </div>
        </div>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0" style={{ background: style.bg, color: style.text }}>
          {style.label}
        </span>
      </div>

      {ev.description && (
        <p className="text-sm mt-2" style={{ color: "var(--text)" }}>{ev.description}</p>
      )}

      {isPending && (
        <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: "var(--border)" }}>
          <textarea
            value={feedback || ""}
            onChange={(e) => onFeedbackChange(e.target.value)}
            rows={2}
            placeholder="Optional comment (e.g. reason for rejection)"
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
            style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)", "--tw-ring-color": "var(--accent)" }}
          />
          <div className="flex gap-2">
            <button
              onClick={() => onDecide(DECISION.APPROVED)}
              disabled={busy}
              className="text-xs text-white rounded-lg px-3 py-2 font-medium disabled:opacity-60"
              style={{ background: "var(--success)" }}
            >
              {busy ? "Saving..." : "Approve"}
            </button>
            <button
              onClick={() => onDecide(DECISION.REJECTED)}
              disabled={busy}
              className="text-xs rounded-lg px-3 py-2 font-medium border disabled:opacity-60"
              style={{ borderColor: "var(--accent-border)", color: "var(--accent-dark)" }}
            >
              {busy ? "Saving..." : "Reject"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ApproveEvents() {
  const { user } = useAuth();
  const toast = useToast();

  const [events, setEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const showSkeleton = useMinimumLoadingTime(loading, 400);
  const [feedbackDrafts, setFeedbackDrafts] = useState({});
  const [busyEventId, setBusyEventId] = useState(null);
  const [filter, setFilter] = useState(EVENT_STATUS.PENDING);
  const [rejectedExpanded, setRejectedExpanded] = useState(false);

  async function loadData() {
    setLoading(true);
    const [eventList, clubList] = await Promise.all([getAllEvents(), getAllClubs()]);
    eventList.sort((a, b) => new Date(b.proposedDate) - new Date(a.proposedDate));
    setEvents(eventList);
    setClubs(clubList);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  function clubFor(clubId) {
    return clubs.find((c) => c.id === clubId) || null;
  }

  function setFeedback(eventId, value) {
    setFeedbackDrafts((prev) => ({ ...prev, [eventId]: value }));
  }

  async function handleDecision(event, decision) {
    setBusyEventId(event.id);
    const feedback = feedbackDrafts[event.id] || "";

    await recordEventApproval({ eventId: event.id, reviewerId: user.id, decision, feedback });
    await updateEventStatus(event.id, decision === DECISION.APPROVED ? EVENT_STATUS.APPROVED : EVENT_STATUS.REJECTED);

    toast.success(decision === DECISION.APPROVED ? `Approved "${event.title}".` : `Rejected "${event.title}".`);
    setBusyEventId(null);
    loadData();
  }

  const pendingEvents = events.filter((e) => e.status === EVENT_STATUS.PENDING);
  const approvedEvents = events.filter((e) => e.status === EVENT_STATUS.APPROVED);
  const rejectedEvents = events.filter((e) => e.status === EVENT_STATUS.REJECTED);

  const visibleEvents = filter === "all" ? null : events.filter((e) => e.status === filter);

  return (
    <PageShell title="Event proposals" subtitle="Review and decide on submitted events.">
      <div className="flex gap-2 mb-6">
        {[
          { key: EVENT_STATUS.PENDING, label: "Pending" },
          { key: EVENT_STATUS.APPROVED, label: "Approved" },
          { key: EVENT_STATUS.REJECTED, label: "Rejected" },
          { key: "all", label: "All" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="text-xs px-3 py-1.5 rounded-full border font-medium transition-colors"
            style={
              filter === f.key
                ? { background: "var(--accent)", borderColor: "var(--accent)", color: "#fff" }
                : { borderColor: "var(--border)", color: "var(--text-muted)" }
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {showSkeleton ? (
        <div className="space-y-3"><RowSkeleton /><RowSkeleton /></div>
      ) : filter !== "all" ? (
        visibleEvents.length === 0 ? (
          <EmptyState title="No events in this view" />
        ) : (
          <div className="space-y-3">
            {visibleEvents.map((ev) => (
              <ProposalCard
                key={ev.id}
                ev={ev}
                club={clubFor(ev.clubId)}
                isPending={ev.status === EVENT_STATUS.PENDING}
                busy={busyEventId === ev.id}
                feedback={feedbackDrafts[ev.id]}
                onFeedbackChange={(v) => setFeedback(ev.id, v)}
                onDecide={(decision) => handleDecision(ev, decision)}
              />
            ))}
          </div>
        )
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="text-sm font-medium uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>
              Pending ({pendingEvents.length})
            </h2>
            {pendingEvents.length === 0 ? (
              <EmptyState title="Nothing pending" />
            ) : (
              <div className="space-y-3">
                {pendingEvents.map((ev) => (
                  <ProposalCard
                    key={ev.id}
                    ev={ev}
                    club={clubFor(ev.clubId)}
                    isPending
                    busy={busyEventId === ev.id}
                    feedback={feedbackDrafts[ev.id]}
                    onFeedbackChange={(v) => setFeedback(ev.id, v)}
                    onDecide={(decision) => handleDecision(ev, decision)}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-sm font-medium uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>
              Approved ({approvedEvents.length})
            </h2>
            {approvedEvents.length === 0 ? (
              <EmptyState title="No approved events yet" />
            ) : (
              <div className="space-y-3">
                {approvedEvents.map((ev) => (
                  <ProposalCard key={ev.id} ev={ev} club={clubFor(ev.clubId)} isPending={false} />
                ))}
              </div>
            )}
          </section>

          <section>
            <button
              onClick={() => setRejectedExpanded((v) => !v)}
              className="text-sm font-medium uppercase tracking-wide mb-3 flex items-center gap-2"
              style={{ color: "var(--text-muted)" }}
            >
              Rejected ({rejectedEvents.length}) {rejectedEvents.length > 0 && (rejectedExpanded ? "▾" : "▸")}
            </button>
            {rejectedExpanded && (
              rejectedEvents.length === 0 ? (
                <EmptyState title="No rejected events" />
              ) : (
                <div className="space-y-3">
                  {rejectedEvents.map((ev) => (
                    <ProposalCard key={ev.id} ev={ev} club={clubFor(ev.clubId)} isPending={false} />
                  ))}
                </div>
              )
            )}
          </section>
        </div>
      )}
    </PageShell>
  );
}
