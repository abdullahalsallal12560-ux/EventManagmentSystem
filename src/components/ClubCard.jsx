import { Link } from "react-router-dom";
import { placeholderImageUrl } from "../data/placeholderImages";

const STATUS_CTA = {
  none: { label: "Join", disabled: false, style: "solid" },
  requesting: { label: "Requesting...", disabled: true, style: "solid" },
  pending: { label: "Pending", disabled: true, style: "muted" },
  approved: { label: "Member ✓", disabled: true, style: "success" },
};

export default function ClubCard({ club, memberCount = 0, membershipStatus = "none", onRequest }) {
  const cta = STATUS_CTA[membershipStatus] || STATUS_CTA.none;
  const ctaStyle =
    cta.style === "success"
      ? { background: "var(--success-bg)", color: "var(--success)" }
      : cta.style === "muted"
      ? { background: "var(--bg-subtle)", color: "var(--text-faint)" }
      : { background: "var(--accent)", color: "#fff" };

  return (
    <div
      className="rounded-xl border overflow-hidden flex flex-col transition-transform duration-[180ms] hover:-translate-y-1 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]"
      style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}
    >
      <Link to={`/club/${club.id}`} className="relative block aspect-video overflow-hidden">
        <img
          src={club.imageUrl || placeholderImageUrl(club.name)}
          alt={club.name}
          className="w-full h-full object-cover"
        />
        {membershipStatus === "approved" && (
          <span
            className="absolute top-2 right-2 text-xs font-medium px-2.5 py-1 rounded-full text-white"
            style={{ background: "var(--success)" }}
          >
            Member ✓
          </span>
        )}
      </Link>
      <div className="p-4 flex flex-col flex-1">
        <Link to={`/club/${club.id}`}>
          <p className="text-sm font-medium font-serif" style={{ color: "var(--text)" }}>{club.name}</p>
        </Link>
        {club.description && (
          <p className="text-sm mt-1.5 line-clamp-2 flex-1" style={{ color: "var(--text-muted)" }}>
            {club.description}
          </p>
        )}
        <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
          {memberCount} member{memberCount === 1 ? "" : "s"}
        </p>
        <button
          onClick={() => onRequest && onRequest(club)}
          disabled={cta.disabled}
          className="mt-3 text-sm rounded-lg px-4 py-2 font-medium disabled:cursor-default transition-colors"
          style={ctaStyle}
        >
          {cta.label}
        </button>
      </div>
    </div>
  );
}
