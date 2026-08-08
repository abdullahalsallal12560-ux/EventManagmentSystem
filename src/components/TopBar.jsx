import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { HelpCircle, Menu, Moon, Search, Sun, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useOnboarding } from "../context/OnboardingContext";
import { ROLES } from "../data/mockUsers";
import Logo from "./Logo";
import Avatar from "./Avatar";
import SearchOverlay from "./SearchOverlay";

const NAV_LINKS = {
  [ROLES.STUDENT]: [
    { label: "Discover", to: "/student/events", tourId: "nav-discover" },
    { label: "My Clubs", to: "/student/clubs", tourId: "nav-my-clubs" },
    { label: "My Tickets", to: "/student/registrations", tourId: "nav-my-tickets" },
    { label: "My History", to: "/student/history" },
  ],
  [ROLES.CLUB_ADMIN]: [
    { label: "My Events", to: "/club/propose-event", tourId: "nav-my-events" },
    { label: "Members", to: "/club/members", tourId: "nav-members" },
  ],
  [ROLES.UNIVERSITY_ADMIN]: [
    { label: "Clubs", to: "/admin/clubs", tourId: "nav-clubs" },
    { label: "Users", to: "/admin/users", tourId: "nav-users" },
    { label: "Approvals", to: "/admin/events", tourId: "nav-approvals" },
  ],
  [ROLES.EVENT_STAFF]: [],
  [ROLES.FACILITY_MANAGER]: [],
};

const navLinkClass = ({ isActive }) =>
  `text-sm font-medium px-3 py-2 rounded-lg transition-colors ${isActive ? "" : "hover:opacity-70"}`;

export default function TopBar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { requestTour } = useOnboarding();
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState("");
  const menuRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (!user) return null;

  const links = NAV_LINKS[user.role] || [];

  function handleLogout() {
    setMenuOpen(false);
    setDrawerOpen(false);
    logout();
    navigate("/login");
  }

  function handleHelpClick() {
    requestTour();
    if (location.pathname !== "/dashboard") navigate("/dashboard");
  }

  function handleSearchDraftChange(value) {
    setSearchDraft(value);
    setSearchOpen(true);
  }

  function closeSearch() {
    setSearchOpen(false);
    setSearchDraft("");
  }

  return (
    <header
      className="sticky top-0 z-40 border-b px-4 sm:px-6 py-3 flex items-center justify-between gap-4"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center gap-3">
        <button
          className="md:hidden p-2 -ml-2 rounded-lg"
          style={{ color: "var(--text)" }}
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <Logo />

        <div className="hidden md:flex items-center gap-2 relative">
          <Search size={15} className="absolute left-3 pointer-events-none" style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            value={searchDraft}
            onFocus={() => setSearchOpen(true)}
            onChange={(e) => handleSearchDraftChange(e.target.value)}
            placeholder="Search events and clubs..."
            aria-label="Search events and clubs"
            className="w-[280px] text-sm pl-9 pr-3 py-2 focus:outline-none placeholder:text-[var(--text-muted)]"
            style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              color: "var(--text)",
            }}
          />
        </div>
      </div>

      {links.length > 0 && (
        <nav className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              data-tour={link.tourId}
              className={navLinkClass}
              style={({ isActive }) => ({
                color: isActive ? "var(--accent)" : "var(--text-muted)",
                background: isActive ? "var(--accent-bg)" : "transparent",
              })}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      )}

      <div className="flex items-center gap-1">
        <button
          onClick={() => setSearchOpen(true)}
          className="md:hidden p-2 rounded-lg transition-colors hover:opacity-70"
          style={{ color: "var(--text-muted)" }}
          aria-label="Search events and clubs"
        >
          <Search size={18} />
        </button>

        <button
          onClick={handleHelpClick}
          className="p-2 rounded-lg transition-colors hover:opacity-70"
          style={{ color: "var(--text-muted)" }}
          aria-label="Replay the onboarding tour"
          title="Help"
        >
          <HelpCircle size={18} />
        </button>

        <button
          data-tour="theme-toggle"
          onClick={toggleTheme}
          className="p-2 rounded-lg transition-colors hover:opacity-70"
          style={{ color: "var(--text-muted)" }}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="relative ml-1" ref={menuRef}>
          <button onClick={() => setMenuOpen((o) => !o)} aria-label="Account menu" className="block">
            <Avatar name={user.name} imageUrl={user.avatarUrl} color={user.avatarColor} size="sm" />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 mt-2 w-44 rounded-lg border py-1 z-50"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)", boxShadow: "var(--shadow-lg)" }}
            >
              <p className="px-3 py-2 text-xs truncate border-b" style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}>
                {user.name}
              </p>
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 text-sm hover:opacity-70"
                style={{ color: "var(--text)" }}
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm hover:opacity-70"
                style={{ color: "var(--accent)" }}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setDrawerOpen(false)} />
          <div
            className="absolute bottom-0 left-0 right-0 rounded-t-2xl border-t p-5 pb-8"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)", boxShadow: "var(--shadow-lg)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium" style={{ color: "var(--text)" }}>Menu</p>
              <button onClick={() => setDrawerOpen(false)} aria-label="Close menu" style={{ color: "var(--text-muted)" }}>
                <X size={20} />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setDrawerOpen(false)}
                  className="text-sm font-medium px-3 py-2.5 rounded-lg"
                  style={({ isActive }) => ({
                    color: isActive ? "var(--accent)" : "var(--text)",
                    background: isActive ? "var(--accent-bg)" : "transparent",
                  })}
                >
                  {link.label}
                </NavLink>
              ))}
              <Link
                to="/profile"
                onClick={() => setDrawerOpen(false)}
                className="text-sm font-medium px-3 py-2.5 rounded-lg"
                style={{ color: "var(--text)" }}
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="text-left text-sm font-medium px-3 py-2.5 rounded-lg"
                style={{ color: "var(--accent)" }}
              >
                Sign out
              </button>
            </nav>
          </div>
        </div>
      )}

      <SearchOverlay open={searchOpen} onClose={closeSearch} initialQuery={searchDraft} />
    </header>
  );
}
