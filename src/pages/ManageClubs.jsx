import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { getAllClubs, createClub, deleteClub } from "../data/clubsStore";
import { getAllUsers } from "../data/usersStore";
import { ROLES } from "../data/mockUsers";
import { placeholderImageUrl } from "../data/placeholderImages";
import PageShell from "../components/PageShell";
import EmptyState from "../components/EmptyState";
import ConfirmDialog from "../components/ConfirmDialog";
import { RowSkeleton } from "../components/Skeleton";
import { useMinimumLoadingTime } from "../utils/useMinimumLoadingTime";

const inputStyle = { borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)", "--tw-ring-color": "var(--accent)" };

export default function ManageClubs() {
  const toast = useToast();
  const [clubs, setClubs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const showSkeleton = useMinimumLoadingTime(loading, 400);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [adminId, setAdminId] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [search, setSearch] = useState("");
  const [adminFilter, setAdminFilter] = useState("all"); // all | has-admin | no-admin

  async function loadData() {
    setLoading(true);
    const [clubsData, usersData] = await Promise.all([getAllClubs(), getAllUsers()]);
    setClubs(clubsData);
    setUsers(usersData);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  function adminName(adminId) {
    if (!adminId) return null;
    const user = users.find((u) => u.id === adminId);
    return user ? user.name : "Unknown";
  }

  const assignedAdminIds = new Set(clubs.map((c) => c.adminId).filter(Boolean));
  const unassignedClubAdmins = users.filter((u) => u.role === ROLES.CLUB_ADMIN && !assignedAdminIds.has(u.id));

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Enter a club name.");
      return;
    }
    if (clubs.some((c) => c.name.toLowerCase() === name.trim().toLowerCase())) {
      setError("A club with this name already exists.");
      return;
    }

    setSubmitting(true);
    await createClub({ name: name.trim(), description: description.trim(), adminId: adminId || null });
    setName("");
    setDescription("");
    setAdminId("");
    setSubmitting(false);
    toast.success(`Club "${name.trim()}" created.`);
    loadData();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await deleteClub(deleteTarget.id);
    toast.success(`Deleted "${deleteTarget.name}".`);
    setDeleteTarget(null);
    loadData();
  }

  const visibleClubs = clubs.filter((c) => {
    const matchesSearch = !search.trim() || c.name.toLowerCase().includes(search.trim().toLowerCase());
    const matchesAdmin =
      adminFilter === "all" ||
      (adminFilter === "has-admin" && !!c.adminId) ||
      (adminFilter === "no-admin" && !c.adminId);
    return matchesSearch && matchesAdmin;
  });

  return (
    <PageShell title="Clubs" subtitle="Create clubs and assign managers.">
      <form onSubmit={handleAdd} className="rounded-xl border p-5 mb-6 space-y-3" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
        <p className="text-sm font-medium" style={{ color: "var(--text)" }}>Add a new club</p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Club name"
          className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
          style={inputStyle}
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description (optional)"
          rows={2}
          className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
          style={inputStyle}
        />
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Assign admin (optional)</label>
          <select
            value={adminId}
            onChange={(e) => setAdminId(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
            style={inputStyle}
          >
            <option value="">-- No manager yet --</option>
            {unassignedClubAdmins.map((u) => (
              <option key={u.id} value={u.id}>{u.name} (@{u.username})</option>
            ))}
          </select>
          {unassignedClubAdmins.length === 0 && (
            <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>
              No unassigned Club Admin accounts — create one from Manage Users first.
            </p>
          )}
        </div>
        {error && (
          <p className="text-sm rounded-md px-3 py-2 border" style={{ color: "var(--accent-dark)", background: "var(--accent-bg)", borderColor: "var(--accent-border)" }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="text-sm text-white rounded-lg px-4 py-2 font-medium disabled:opacity-60"
          style={{ background: "var(--accent)" }}
        >
          {submitting ? "Adding..." : "Add club"}
        </button>
      </form>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by club name"
          className="w-full sm:flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
          style={inputStyle}
        />
        <div className="flex gap-2">
          {[
            { key: "all", label: "All" },
            { key: "has-admin", label: "Has admin" },
            { key: "no-admin", label: "No admin" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setAdminFilter(f.key)}
              className="text-xs px-3 py-1.5 rounded-full border font-medium transition-colors"
              style={
                adminFilter === f.key
                  ? { background: "var(--accent)", borderColor: "var(--accent)", color: "#fff" }
                  : { borderColor: "var(--border)", color: "var(--text-muted)" }
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {showSkeleton ? (
        <div className="space-y-3"><RowSkeleton /><RowSkeleton /></div>
      ) : clubs.length === 0 ? (
        <EmptyState title="No clubs yet" description="Add one above to get started." />
      ) : visibleClubs.length === 0 ? (
        <EmptyState title="No clubs match your search" />
      ) : (
        <div className="space-y-3">
          {visibleClubs.map((c) => (
            <div key={c.id} className="rounded-xl border p-4 flex items-center gap-3" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
              <img
                src={c.imageUrl || placeholderImageUrl(c.name)}
                alt={c.name}
                className="w-10 h-10 rounded-lg object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <Link to={`/club/${c.id}`} className="text-sm font-medium hover:underline" style={{ color: "var(--text)" }}>
                  {c.name}
                </Link>
                {c.description && (
                  <p className="text-sm mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{c.description}</p>
                )}
                <span
                  className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1"
                  style={
                    c.adminId
                      ? { background: "var(--success-bg)", color: "var(--success)" }
                      : { background: "var(--warning-bg)", color: "var(--warning)" }
                  }
                >
                  {c.adminId ? `Managed by ${adminName(c.adminId)}` : "No admin"}
                </span>
              </div>
              <button
                onClick={() => setDeleteTarget(c)}
                className="text-xs px-3 py-1.5 rounded-md border shrink-0"
                style={{ borderColor: "var(--accent-border)", color: "var(--accent-dark)" }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this club?"
        description={`"${deleteTarget?.name}" and its association with events/members will be removed. This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </PageShell>
  );
}
