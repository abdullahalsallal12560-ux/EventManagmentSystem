// Thin fill bar showing registrationCount / maxAttendees. Renders nothing
// when capacity data isn't available. Color steps from the brand accent to
// warning orange past 80% full, then to a darker red once full.
export default function CapacityBar({ registrationCount, maxAttendees }) {
  if (typeof registrationCount !== "number" || typeof maxAttendees !== "number" || maxAttendees <= 0) {
    return null;
  }

  const percent = Math.min(100, Math.round((registrationCount / maxAttendees) * 100));
  const isFull = registrationCount >= maxAttendees;
  const fillColor = isFull ? "var(--accent-dark)" : percent > 80 ? "var(--warning)" : "var(--accent)";

  return (
    <div className="mt-3">
      <div
        className="rounded-full overflow-hidden border"
        style={{ height: 6, background: "var(--bg-subtle)", borderColor: "var(--border)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${percent}%`, background: fillColor }}
        />
      </div>
      <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>
        {registrationCount} / {maxAttendees} spots filled
      </p>
    </div>
  );
}
