import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { getAllEvents } from "../data/eventsStore";
import { getAllClubs } from "../data/clubsStore";

// Full-width overlay, not a page. Events + clubs are fetched once when the
// overlay opens; every keystroke after that just filters those two arrays
// in memory — no repeated Firestore queries while typing.
export default function SearchOverlay({ open, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [events, setEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuery("");
    setLoading(true);
    Promise.all([getAllEvents(), getAllClubs()]).then(([e, c]) => {
      setEvents(e);
      setClubs(c);
      setLoading(false);
    });
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(focusTimer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const q = query.trim().toLowerCase();
  const matchedEvents = q
    ? events
        .filter((e) => e.title?.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q))
        .slice(0, 8)
    : [];
  const matchedClubs = q
    ? clubs
        .filter((c) => c.name?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q))
        .slice(0, 8)
    : [];
  const hasResults = matchedEvents.length > 0 || matchedClubs.length > 0;

  function goToEvent(id) {
    onClose();
    navigate(`/event/${id}`);
  }
  function goToClub(id) {
    onClose();
    navigate(`/club/${id}`);
  }

  return (
    <div
      className="fixed inset-0 z-[95]"
      style={{ background: "rgba(0,0,0,0.5)" }}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full border-b"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)", boxShadow: "var(--shadow-lg)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center gap-3">
            <Search size={20} style={{ color: "var(--text-faint)" }} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search events and clubs..."
              className="flex-1 min-w-0 bg-transparent text-lg focus:outline-none"
              style={{ color: "var(--text)" }}
            />
            <button onClick={onClose} aria-label="Close search" className="shrink-0 p-1 rounded-lg transition-colors hover:opacity-70" style={{ color: "var(--text-muted)" }}>
              <X size={20} />
            </button>
          </div>

          {q && (
            <div className="mt-5 max-h-[60vh] overflow-y-auto space-y-6">
              {loading ? (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading...</p>
              ) : !hasResults ? (
                <div className="text-center py-10">
                  <p className="text-sm font-medium" style={{ color: "var(--text)" }}>No results for &ldquo;{query}&rdquo;</p>
                  <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Try a different search term.</p>
                </div>
              ) : (
                <>
                  {matchedEvents.length > 0 && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>
                        Events
                      </p>
                      <div className="space-y-1">
                        {matchedEvents.map((ev) => (
                          <button
                            key={ev.id}
                            onClick={() => goToEvent(ev.id)}
                            className="w-full text-left px-3 py-2.5 rounded-lg transition-colors hover:opacity-80"
                            style={{ background: "var(--bg-subtle)" }}
                          >
                            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{ev.title}</p>
                            {ev.description && (
                              <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--text-muted)" }}>{ev.description}</p>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {matchedClubs.length > 0 && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>
                        Clubs
                      </p>
                      <div className="space-y-1">
                        {matchedClubs.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => goToClub(c.id)}
                            className="w-full text-left px-3 py-2.5 rounded-lg transition-colors hover:opacity-80"
                            style={{ background: "var(--bg-subtle)" }}
                          >
                            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{c.name}</p>
                            {c.description && (
                              <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--text-muted)" }}>{c.description}</p>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
