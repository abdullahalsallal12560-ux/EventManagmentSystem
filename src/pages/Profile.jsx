import { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { ROLES, ROLE_LABELS } from "../data/mockUsers";
import { getProfile, upsertProfile } from "../data/profilesStore";
import { getMembershipsByUser, MEMBERSHIP_STATUS } from "../data/clubMembershipsStore";
import { getRegistrationsByUser } from "../data/registrationsStore";
import { getAllCheckins } from "../data/checkinsStore";
import PageShell from "../components/PageShell";
import Avatar from "../components/Avatar";
import { RowSkeleton } from "../components/Skeleton";

const inputStyle = { borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)", "--tw-ring-color": "var(--accent)" };

export default function Profile() {
  const { user, changePassword } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [savingBio, setSavingBio] = useState(false);

  const [interests, setInterests] = useState([]);
  const [interestDraft, setInterestDraft] = useState("");
  const [savingInterests, setSavingInterests] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submittingPassword, setSubmittingPassword] = useState(false);

  async function loadData() {
    if (!user) return;
    setLoading(true);
    const existing = await getProfile(user.id);
    setBio(existing?.bio || "");
    setAvatarUrl(existing?.avatarUrl || "");
    setInterests(existing?.interests || []);

    if (user.role === ROLES.STUDENT) {
      const [memberships, registrations, checkins] = await Promise.all([
        getMembershipsByUser(user.id),
        getRegistrationsByUser(user.id),
        getAllCheckins(),
      ]);
      const registrationIds = new Set(registrations.map((r) => r.id));
      setStats({
        clubsJoined: memberships.filter((m) => m.status === MEMBERSHIP_STATUS.APPROVED).length,
        eventsAttended: checkins.filter((c) => registrationIds.has(c.registrationId)).length,
      });
    }
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!user) return null;

  async function handleSaveAvatar() {
    await upsertProfile(user.id, { avatarUrl: avatarUrl.trim() || null });
    toast.success("Profile photo updated.");
    setEditingAvatar(false);
  }

  async function handleSaveBio(e) {
    e.preventDefault();
    setSavingBio(true);
    await upsertProfile(user.id, { bio: bio.trim() });
    setSavingBio(false);
    toast.success("Bio saved.");
  }

  function addInterest() {
    const value = interestDraft.trim();
    if (!value || interests.includes(value)) {
      setInterestDraft("");
      return;
    }
    setInterests((prev) => [...prev, value]);
    setInterestDraft("");
  }

  function removeInterest(value) {
    setInterests((prev) => prev.filter((i) => i !== value));
  }

  async function handleSaveInterests() {
    setSavingInterests(true);
    await upsertProfile(user.id, { interests });
    setSavingInterests(false);
    toast.success("Interests saved.");
  }

  async function handleSubmitPassword(e) {
    e.preventDefault();
    if (newPassword.length < 4) {
      toast.error("Password must be at least 4 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match.");
      return;
    }

    setSubmittingPassword(true);
    const result = await changePassword(newPassword);
    setSubmittingPassword(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Password updated.");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <PageShell title="Your account" maxWidth="max-w-4xl">
      {loading ? (
        <RowSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <div className="rounded-xl border p-6 text-center" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
              <div className="relative inline-block group">
                <Avatar name={user.name} size="lg" imageUrl={avatarUrl} color={user.avatarColor} />
                <button
                  onClick={() => setEditingAvatar((v) => !v)}
                  className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "rgba(0,0,0,0.45)" }}
                  aria-label="Edit profile photo"
                >
                  <Pencil size={18} color="#fff" />
                </button>
              </div>

              {editingAvatar && (
                <div className="mt-3 space-y-2">
                  <input
                    type="text"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="Paste an image URL"
                    className="w-full rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:border-transparent"
                    style={inputStyle}
                  />
                  <button
                    onClick={handleSaveAvatar}
                    className="w-full text-xs text-white rounded-lg py-1.5 font-medium"
                    style={{ background: "var(--accent)" }}
                  >
                    Save photo
                  </button>
                </div>
              )}

              <p className="text-sm font-medium mt-4" style={{ color: "var(--text)" }}>{user.name}</p>
              <span
                className="inline-block text-xs font-medium px-2.5 py-1 rounded-full mt-2"
                style={{ background: "var(--accent-bg)", color: "var(--accent-dark)" }}
              >
                {ROLE_LABELS[user.role]}
              </span>
              <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>@{user.username}</p>
              {user.phone && <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{user.phone}</p>}
              {user.createdAt && (
                <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                </p>
              )}

              {stats && (
                <div className="mt-6 pt-6 border-t grid grid-cols-2 gap-3" style={{ borderColor: "var(--border)" }}>
                  <div>
                    <p className="text-xl font-serif" style={{ color: "var(--text)" }}>{stats.clubsJoined}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Clubs joined</p>
                  </div>
                  <div>
                    <p className="text-xl font-serif" style={{ color: "var(--text)" }}>{stats.eventsAttended}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Events attended</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <form onSubmit={handleSaveBio} className="rounded-xl border p-5" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
              <p className="text-sm font-medium mb-3" style={{ color: "var(--text)" }}>About</p>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Say a little about yourself..."
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                style={inputStyle}
              />
              <button type="submit" disabled={savingBio}
                className="mt-3 text-sm text-white rounded-lg px-4 py-2 font-medium disabled:opacity-60" style={{ background: "var(--accent)" }}>
                {savingBio ? "Saving..." : "Save bio"}
              </button>
            </form>

            <div className="rounded-xl border p-5" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
              <p className="text-sm font-medium mb-3" style={{ color: "var(--text)" }}>Interests</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {interests.map((interest) => (
                  <span
                    key={interest}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ background: "var(--bg-subtle)", color: "var(--text)" }}
                  >
                    {interest}
                    <button onClick={() => removeInterest(interest)} aria-label={`Remove ${interest}`} style={{ color: "var(--text-faint)" }}>×</button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={interestDraft}
                onChange={(e) => setInterestDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addInterest();
                  }
                }}
                placeholder="Type an interest and press Enter"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                style={inputStyle}
              />
              <button onClick={handleSaveInterests} disabled={savingInterests}
                className="mt-3 text-sm text-white rounded-lg px-4 py-2 font-medium disabled:opacity-60" style={{ background: "var(--accent)" }}>
                {savingInterests ? "Saving..." : "Save interests"}
              </button>
            </div>

            <form onSubmit={handleSubmitPassword} className="rounded-xl border p-5 space-y-3" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
              <p className="text-sm font-medium" style={{ color: "var(--text)" }}>Change password</p>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>New password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 4 characters" className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent" style={inputStyle} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Confirm new password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password" className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent" style={inputStyle} />
              </div>
              <button type="submit" disabled={submittingPassword}
                className="text-sm text-white rounded-lg px-4 py-2 font-medium disabled:opacity-60" style={{ background: "var(--accent)" }}>
                {submittingPassword ? "Saving..." : "Update password"}
              </button>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
}
