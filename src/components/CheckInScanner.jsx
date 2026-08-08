import { useRef, useState } from "react";
import { checkInByRegistrationId } from "../data/checkinsStore";
import { getUsersByIds } from "../data/usersStore";
import { useToast } from "../context/ToastContext";
import QRScanner from "./QRScanner";
import Avatar from "./Avatar";
import EmptyState from "./EmptyState";
import { timeAgo } from "../utils/timeAgo";

const SCAN_STATUS_STYLE = {
  valid: { bg: "var(--success-bg)", text: "var(--success)", label: "Checked In" },
  duplicate: { bg: "var(--warning-bg)", text: "var(--warning)", label: "Already Scanned" },
  "wrong-event": { bg: "var(--accent-bg)", text: "var(--accent-dark)", label: "Wrong Event" },
  invalid: { bg: "var(--bg-subtle)", text: "var(--text-faint)", label: "Invalid" },
};

// Same code stays in the camera's view for many frames in a row — the
// scanner fires a decode on every one of them. Ignore repeats of the same
// decoded value within this window so one physical scan doesn't produce a
// flood of duplicate toasts/log entries/checkins.
const RESCAN_COOLDOWN_MS = 5000;

// Shared QR check-in flow: event selector + camera scanner + session scan
// log. Used by both the Event Staff dashboard (all approved upcoming
// events) and the Club Admin dashboard (only that club's own approved
// upcoming events) — callers just pass the already-filtered event list.
export default function CheckInScanner({ events, scannedBy, emptyEventsMessage }) {
  const toast = useToast();
  const [selectedEventId, setSelectedEventId] = useState("");
  const [scanLog, setScanLog] = useState([]);
  const lastScanRef = useRef({ value: null, at: 0 });

  function pushLog(entry) {
    setScanLog((prev) => [entry, ...prev]);
  }

  // Returns the outcome status ("valid" | "duplicate" | "wrong-event" |
  // "invalid"), or undefined when the scan was ignored outright (dedupe
  // window below) — QRScanner uses that return value to drive its
  // vibration/flash feedback, skipping feedback entirely on undefined so a
  // silently-ignored repeat scan doesn't still flash red at the user.
  async function handleDecode(decodedText) {
    const now = Date.now();
    if (lastScanRef.current.value === decodedText && now - lastScanRef.current.at < RESCAN_COOLDOWN_MS) {
      return undefined;
    }
    lastScanRef.current = { value: decodedText, at: now };

    const result = await checkInByRegistrationId({
      registrationId: decodedText,
      eventId: selectedEventId,
      scannedBy,
    });

    let name = "Unknown code";
    let avatarColor;
    if (result.userId) {
      const [foundUser] = await getUsersByIds([result.userId]);
      name = foundUser?.name || "Unknown student";
      avatarColor = foundUser?.avatarColor;
    }

    if (result.success) {
      toast.success(`Checked in: ${name}`);
    } else {
      toast.error(result.error);
    }
    pushLog({ name, avatarColor, status: result.status, scannedAt: new Date().toISOString() });

    return result.status;
  }

  const selectedEvent = events.find((e) => e.id === selectedEventId) || null;

  return (
    <>
      <div data-tour="event-selector">
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Event</label>
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="w-full sm:w-96 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
          style={{ borderColor: "var(--border)", background: "var(--bg-card)", color: "var(--text)", "--tw-ring-color": "var(--accent)" }}
        >
          <option value="">-- Select an event --</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>{ev.title} · {ev.proposedDate}</option>
          ))}
        </select>
        {events.length === 0 && (
          <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>{emptyEventsMessage}</p>
        )}
      </div>

      <div data-tour="checkin-scanner">
        <QRScanner enabled={!!selectedEvent} onDecode={handleDecode} />
      </div>

      <section>
        <h2 className="text-sm font-medium uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>
          Recent scans
        </h2>
        {scanLog.length === 0 ? (
          <EmptyState title="No scans yet this session" description="Checked-in attendees will appear here as you scan." />
        ) : (
          <div className="rounded-xl border divide-y" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
            {scanLog.map((entry, i) => {
              const style = SCAN_STATUS_STYLE[entry.status] || SCAN_STATUS_STYLE.invalid;
              return (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <Avatar name={entry.name} color={entry.avatarColor} size="sm" />
                  <p className="text-sm flex-1 min-w-0 truncate" style={{ color: "var(--text)" }}>{entry.name}</p>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0" style={{ background: style.bg, color: style.text }}>
                    {style.label}
                  </span>
                  <span className="text-xs shrink-0" style={{ color: "var(--text-faint)" }}>{timeAgo(entry.scannedAt)}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
