import { useState, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import { useToast } from "../context/ToastContext";
import { ROLES, ROLE_LABELS, ROLE_COLORS } from "../data/mockUsers";
import { getAllUsers, createUserByAdmin, deleteUser } from "../data/usersStore";
import { getAllClubs } from "../data/clubsStore";
import PageShell from "../components/PageShell";
import Avatar from "../components/Avatar";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import ConfirmDialog from "../components/ConfirmDialog";
import { RowSkeleton } from "../components/Skeleton";
import { useMinimumLoadingTime } from "../utils/useMinimumLoadingTime";

const ROLE_OPTIONS = Object.values(ROLES);
const inputStyle = { borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)", "--tw-ring-color": "var(--accent)" };

export default function ManageUsers() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const showSkeleton = useMinimumLoadingTime(loading, 400);

  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [universityId, setUniversityId] = useState("");
  const [role, setRole] = useState(ROLES.STUDENT);
  const [clubId, setClubId] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  async function loadData() {
    setLoading(true);
    setLoadError(false);
    try {
      const [usersData, clubsData] = await Promise.all([getAllUsers(), getAllClubs()]);
      setUsers(usersData);
      setClubs(clubsData);
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
  }, []);

  function resetForm() {
    setName("");
    setUsername("");
    setPhone("");
    setUniversityId("");
    setRole(ROLES.STUDENT);
    setClubId("");
  }

  async function handleAdd(e) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !username.trim()) {
      setError("Name and username are required.");
      return;
    }

    setSubmitting(true);
    const result = await createUserByAdmin({
      name: name.trim(),
      username: username.trim(),
      phone: phone.trim(),
      universityId: universityId.trim(),
      role,
      clubId: role === ROLES.CLUB_ADMIN ? clubId : null,
    });
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    toast.success(`Account created for ${result.user.name}. Username "${result.user.username}", default password "${result.defaultPassword}".`);
    resetForm();
    setFormOpen(false);
    loadData();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await deleteUser(deleteTarget.id);
    toast.success(`Removed ${deleteTarget.name}'s account.`);
    setDeleteTarget(null);
    loadData();
  }

  const visibleUsers = users.filter((u) => {
    const matchesSearch =
      !search.trim() ||
      u.name.toLowerCase().includes(search.trim().toLowerCase()) ||
      u.username.toLowerCase().includes(search.trim().toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <PageShell
      title="Accounts"
      subtitle="Provision and manage university accounts."
      actions={
        !formOpen && (
          <button
            onClick={() => setFormOpen(true)}
            className="flex items-center gap-1.5 text-sm text-white rounded-lg px-4 py-2 font-medium"
            style={{ background: "var(--accent)" }}
          >
            <Plus size={16} /> Add account
          </button>
        )
      }
    >
      {formOpen && (
        <form onSubmit={handleAdd} className="rounded-xl border p-5 mb-8 space-y-3" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>Provision a new account</p>
            <button type="button" onClick={() => setFormOpen(false)} className="text-xs" style={{ color: "var(--text-muted)" }}>
              Cancel
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Full name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Student or staff name" className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent" style={inputStyle} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. university ID for students, or a short handle for staff"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent" style={inputStyle} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>University ID</label>
              <input type="text" value={universityId} onChange={(e) => setUniversityId(e.target.value)}
                placeholder="e.g. 220106" className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent" style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Phone number</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="07XXXXXXXX" className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent" style={inputStyle} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent" style={inputStyle}>
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>

          {role === ROLES.CLUB_ADMIN && (
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Club to manage</label>
              <select required value={clubId} onChange={(e) => setClubId(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent" style={inputStyle}>
                <option value="">-- Choose a club --</option>
                {clubs.map((c) => (
                  <option key={c.id} value={c.id} disabled={!!c.adminId}>
                    {c.name}{c.adminId ? " (already has a manager)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <p className="text-sm rounded-md px-3 py-2 border" style={{ color: "var(--accent-dark)", background: "var(--accent-bg)", borderColor: "var(--accent-border)" }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting}
            className="text-sm text-white rounded-lg px-4 py-2 font-medium disabled:opacity-60" style={{ background: "var(--accent)" }}>
            {submitting ? "Creating..." : "Create account"}
          </button>
        </form>
      )}

      <h2 className="text-sm font-medium uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>
        All accounts
      </h2>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or username"
            className="w-full rounded-lg border pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
            style={inputStyle}
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full sm:w-56 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
          style={inputStyle}
        >
          <option value="all">All roles</option>
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
      </div>

      {showSkeleton ? (
        <div className="space-y-3"><RowSkeleton /><RowSkeleton /><RowSkeleton /></div>
      ) : loadError ? (
        <ErrorState onRetry={loadData} />
      ) : visibleUsers.length === 0 ? (
        <EmptyState title="No accounts match your search" />
      ) : (
        <div className="space-y-3">
          {visibleUsers.map((u) => {
            const colors = ROLE_COLORS[u.role];
            return (
              <div key={u.id} className="rounded-xl border p-4 flex items-center gap-3" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
                <Avatar name={u.name} color={u.avatarColor} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{u.name}</p>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: colors.bg, color: colors.text }}>
                      {ROLE_LABELS[u.role]}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    @{u.username}{u.phone ? ` · ${u.phone}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => setDeleteTarget(u)}
                  className="text-xs px-3 py-1.5 rounded-md border shrink-0"
                  style={{ borderColor: "var(--accent-border)", color: "var(--accent-dark)" }}
                >
                  Delete
                </button>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this account?"
        description={`This permanently removes ${deleteTarget?.name || "this account"}. This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </PageShell>
  );
}
