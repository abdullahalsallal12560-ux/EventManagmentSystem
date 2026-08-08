import { Link } from "react-router-dom";

// HTU dot-grid mark: three squares, the third dimmed — used on Login and
// in TopBar so the brand mark stays visually identical everywhere.
export function DotMark({ className = "" }) {
  return (
    <div className={`flex items-center gap-1 ${className}`} aria-hidden="true">
      <span className="w-2.5 h-2.5 rounded-[2px]" style={{ background: "var(--accent)" }} />
      <span className="w-2.5 h-2.5 rounded-[2px]" style={{ background: "var(--accent)" }} />
      <span className="w-2.5 h-2.5 rounded-[2px] opacity-40" style={{ background: "var(--accent)" }} />
    </div>
  );
}

export default function Logo({ to = "/dashboard" }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 shrink-0">
      <DotMark />
      <span className="text-base font-serif" style={{ color: "var(--text)" }}>Campus Events</span>
    </Link>
  );
}
