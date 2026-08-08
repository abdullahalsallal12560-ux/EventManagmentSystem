import { Link } from "react-router-dom";
import { placeholderImageUrl } from "../data/placeholderImages";

const STATUS_CTA = {
  register: { label: "Register", disabled: false, style: "solid" },
  registering: { label: "Registering...", disabled: true, style: "solid" },
  registered: { label: "Registered ✓", disabled: true, style: "success" },
  attended: { label: "Attended", disabled: true, style: "muted" },
  missed: { label: "Missed", disabled: true, style: "muted" },
  pending: { label: "Pending approval", disabled: true, style: "muted" },
  readonly: { label: "Students only", disabled: true, style: "muted" },
};

// Cover image (16:9), club pill + date pill, title, 2-line description, and
// a status-aware CTA. `status` drives the CTA: one of STATUS_CTA's keys.
export default function EventCard({ event, clubName, status = "register", onRegister }) {
  const cta = STATUS_CTA[status] || STATUS_CTA.register;

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
      <Link to={`/event/${event.id}`} className="block aspect-video overflow-hidden">
        <img
          src={event.imageUrl || placeholderImageUrl(event.title)}
          alt={event.title}
          className="w-full h-full object-cover"
        />
      </Link>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          {clubName && (
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ background: "var(--accent-bg)", color: "var(--accent-dark)" }}
            >
              {clubName}
            </span>
          )}
          <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: "var(--bg-subtle)", color: "var(--text-muted)" }}>
            {event.proposedDate}
          </span>
        </div>
        <Link to={`/event/${event.id}`}>
          <p className="text-sm font-medium font-serif" style={{ color: "var(--text)" }}>{event.title}</p>
        </Link>
        {event.description && (
          <p className="text-sm mt-1.5 line-clamp-2 flex-1" style={{ color: "var(--text-muted)" }}>
            {event.description}
          </p>
        )}
        <button
          onClick={() => onRegister && onRegister(event)}
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
