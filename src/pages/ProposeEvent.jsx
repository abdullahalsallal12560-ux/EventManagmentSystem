import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getClubsByAdmin } from "../data/clubsStore";
import { createEvent, getEventsByClub, EVENT_STATUS } from "../data/eventsStore";
import { getApprovalsByEvent, DECISION } from "../data/eventApprovalsStore";
import PageShell from "../components/PageShell";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import { RowSkeleton } from "../components/Skeleton";
import { useMinimumLoadingTime } from "../utils/useMinimumLoadingTime";

const STATUS_STYLE = {
  [EVENT_STATUS.PENDING]: { bg: "var(--warning-bg)", text: "var(--warning)", label: "Pending review" },
  [EVENT_STATUS.APPROVED]: { bg: "var(--success-bg)", text: "var(--success)", label: "Approved" },
  [EVENT_STATUS.REJECTED]: { bg: "var(--accent-bg)", text: "var(--accent-dark)", label: "Rejected" },
};

const inputStyle = { borderColor: "var(--border)", background: "var(--bg-card)", color: "var(--text)", "--tw-ring-color": "var(--accent)" };

export default function ProposeEvent() {
  const { user } = useAuth();
  const toast = useToast();

  const [club, setClub] = useState(null);
  const [events, setEvents] = useState([]);
  const [feedbackByEvent, setFeedbackByEvent] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const showSkeleton = useMinimumLoadingTime(loading, 400);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [proposedDate, setProposedDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [maxAttendees, setMaxAttendees] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    setLoading(true);
    setLoadError(false);
    try {
      const clubs = await getClubsByAdmin(user.id);
      const myClub = clubs[0] || null;
      setClub(myClub);

      if (myClub) {
        const eventList = await getEventsByClub(myClub.id);
        eventList.sort((a, b) => new Date(b.proposedDate) - new Date(a.proposedDate));
        setEvents(eventList);

        const rejected = eventList.filter((e) => e.status === EVENT_STATUS.REJECTED);
        const approvalsByEvent = {};
        await Promise.all(
          rejected.map(async (ev) => {
            const approvals = await getApprovalsByEvent(ev.id);
            const decision = approvals.find((a) => a.decision === DECISION.REJECTED && a.feedback);
            if (decision) approvalsByEvent[ev.id] = decision.feedback;
          })
        );
        setFeedbackByEvent(approvalsByEvent);
      }
    } catch (err) {
      console.error(err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Enter an event title.");
      return;
    }
    if (!proposedDate) {
      setError("Choose a proposed date.");
      return;
    }
    const maxAttendeesNum = parseInt(maxAttendees, 10);
    if (!maxAttendees || Number.isNaN(maxAttendeesNum) || maxAttendeesNum < 10) {
      setError("Enter a maximum attendee capacity of at least 10.");
      return;
    }

    setSubmitting(true);
    await createEvent({
      clubId: club.id,
      title: title.trim(),
      description: description.trim(),
      proposedDate,
      startTime,
      endTime,
      location: location.trim(),
      maxAttendees: maxAttendeesNum,
      createdBy: user.id,
    });
    setTitle("");
    setDescription("");
    setProposedDate("");
    setStartTime("");
    setEndTime("");
    setLocation("");
    setMaxAttendees("");
    setSubmitting(false);
    toast.success("Event submitted for approval.");
    loadData();
  }

  return (
    <PageShell title={club ? club.name : "Propose Event"} subtitle="Submit a new event for university approval.">
      {showSkeleton ? (
        <RowSkeleton />
      ) : loadError ? (
        <ErrorState onRetry={loadData} />
      ) : !club ? (
        <EmptyState title="No club assigned yet" description="Ask the University Admin to assign you to manage a club." />
      ) : (
        <>
          <form onSubmit={handleSubmit} className="rounded-xl border p-5 mb-10 space-y-3" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
            <p className="text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Propose an event</p>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Event title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Robotics Open House"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent" style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                placeholder="What's the event about?"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent" style={inputStyle} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Proposed date</label>
                <input type="date" value={proposedDate} onChange={(e) => setProposedDate(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent" style={inputStyle} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Start time</label>
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent" style={inputStyle} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>End time</label>
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent" style={inputStyle} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Location</label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Main Hall, Building A"
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent" style={inputStyle} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Maximum attendees</label>
                <input type="number" min="10" required value={maxAttendees} onChange={(e) => setMaxAttendees(e.target.value)}
                  placeholder="e.g. 100"
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent" style={inputStyle} />
              </div>
            </div>

            {error && (
              <p className="text-sm rounded-md px-3 py-2 border" style={{ color: "var(--accent-dark)", background: "var(--accent-bg)", borderColor: "var(--accent-border)" }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={submitting}
              className="text-sm text-white rounded-lg px-4 py-2 font-medium disabled:opacity-60" style={{ background: "var(--accent)" }}>
              {submitting ? "Submitting..." : "Submit for approval"}
            </button>
          </form>

          <h2 className="text-sm font-medium uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>
            Your club's events
          </h2>
          {events.length === 0 ? (
            <EmptyState title="No events proposed yet" description="Use the form above to submit your first event." />
          ) : (
            <div className="space-y-3">
              {events.map((ev) => {
                const style = STATUS_STYLE[ev.status];
                return (
                  <div key={ev.id} className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{ev.title}</p>
                        {ev.description && (
                          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>{ev.description}</p>
                        )}
                        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                          Proposed date: {ev.proposedDate}
                        </p>
                      </div>
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0" style={{ background: style.bg, color: style.text }}>
                        {style.label}
                      </span>
                    </div>
                    {ev.status === EVENT_STATUS.REJECTED && feedbackByEvent[ev.id] && (
                      <p className="text-xs mt-2 pt-2 border-t" style={{ borderColor: "var(--border)", color: "var(--accent-dark)" }}>
                        Reviewer feedback: {feedbackByEvent[ev.id]}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}
