// Dashboard summary number. `trend` is optional: { delta: "+12", direction: "up" | "down" }.
export default function StatCard({ label, value, trend, icon }) {
  return (
    <div
      className="rounded-xl border p-5"
      style={{ borderColor: "var(--border)", background: "var(--bg-card)", boxShadow: "var(--shadow-sm)" }}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
          {label}
        </p>
        {icon && <span className="text-lg leading-none">{icon}</span>}
      </div>
      <div className="flex items-end gap-2 mt-2">
        <p className="text-3xl font-serif" style={{ color: "var(--text)" }}>{value}</p>
        {trend && (
          <span
            className="text-xs font-medium pb-1"
            style={{ color: trend.direction === "down" ? "var(--accent)" : "var(--success)" }}
          >
            {trend.direction === "down" ? "↓" : "↑"} {trend.delta}
          </span>
        )}
      </div>
    </div>
  );
}
