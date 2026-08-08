import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { ROLES } from "../data/mockUsers";
import Logo from "./Logo";
import Avatar from "./Avatar";

const NAV_LINKS = {
  [ROLES.STUDENT]: [
    { label: "Discover", to: "/student/events" },
    { label: "My Clubs", to: "/student/clubs" },
    { label: "My Tickets", to: "/student/registrations" },
    { label: "My History", to: "/student/history" },
  ],
  [ROLES.CLUB_ADMIN]: [
    { label: "My Events", to: "/club/propose-event" },
    { label: "Members", to: "/club/members" },
  ],
  [ROLES.UNIVERSITY_ADMIN]: [
    { label: "Clubs", to: "/admin/clubs" },
    { label: "Users", to: "/admin/users" },
    { label: "Approvals", to: "/admin/events" },
  ],
  [ROLES.EVENT_STAFF]: [],
  [ROLES.FACILITY_MANAGER]: [],
};

const navLinkClass = ({ isActive }) =>
  `text-sm font-medium px-3 py-2 rounded-lg transition-colors ${isActive ? "" : "hover:opacity-70"}`;

export default function TopBar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
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
      </div>

      {links.length > 0 && (
        <nav className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
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

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg"
          style={{ color: "var(--text-muted)" }}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="relative" ref={menuRef}>
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
    </header>
  );
}
