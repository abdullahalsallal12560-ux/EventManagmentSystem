import { useState } from "react";
import { requestToJoinClub } from "../data/clubMembershipsStore";
import { useToast } from "../context/ToastContext";

const AVAILABILITY_OPTIONS = ["Weekday Mornings", "Weekday Afternoons", "Weekday Evenings", "Weekends"];
const WHY_MAX_LENGTH = 300;

const inputStyle = { borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)", "--tw-ring-color": "var(--accent)" };

const EMPTY_FORM = { gpa: "", major: "", faculty: "", creditHours: "", skills: [], skillDraft: "", why: "", availability: [] };

// Membership application form shown before a "Join" click actually creates
// the club_memberships request. Self-contained: calls requestToJoinClub
// itself (with the collected answers as applicationData) and shows its own
// toast, so every entry point (BrowseClubs, ClubProfile, Dashboard) just
// needs to open it and react to `onSuccess`.
export default function ClubApplicationModal({ open, club, userId, onClose, onSuccess }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open || !club) return null;

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleClose() {
    setForm(EMPTY_FORM);
    setError("");
    onClose();
  }

  function addSkill() {
    const value = form.skillDraft.trim();
    if (!value || form.skills.includes(value)) {
      set("skillDraft", "");
      return;
    }
    setForm((prev) => ({ ...prev, skills: [...prev.skills, value], skillDraft: "" }));
  }

  function removeSkill(value) {
    setForm((prev) => ({ ...prev, skills: prev.skills.filter((s) => s !== value) }));
  }

  function toggleAvailability(option) {
    setForm((prev) => ({
      ...prev,
      availability: prev.availability.includes(option)
        ? prev.availability.filter((a) => a !== option)
        : [...prev.availability, option],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const gpaNum = parseFloat(form.gpa);
    const creditsNum = parseInt(form.creditHours, 10);

    if (form.gpa === "" || Number.isNaN(gpaNum) || gpaNum < 0 || gpaNum > 4) {
      setError("Enter a valid GPA between 0.0 and 4.0.");
      return;
    }
    if (!form.major.trim()) {
      setError("Enter your major or specialization.");
      return;
    }
    if (!form.faculty.trim()) {
      setError("Enter your faculty or college.");
      return;
    }
    if (form.creditHours === "" || Number.isNaN(creditsNum) || creditsNum < 0 || creditsNum > 160) {
      setError("Enter valid completed credit hours (0-160).");
      return;
    }
    if (!form.why.trim()) {
      setError("Tell the club why you want to join.");
      return;
    }

    setSubmitting(true);
    const result = await requestToJoinClub({
      userId,
      clubId: club.id,
      applicationData: {
        gpa: gpaNum,
        major: form.major.trim(),
        faculty: form.faculty.trim(),
        creditHours: creditsNum,
        skills: form.skills,
        why: form.why.trim(),
        availability: form.availability,
      },
    });
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    toast.success(`Application submitted to ${club.name}`);
    setForm(EMPTY_FORM);
    onSuccess && onSuccess();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center px-4 py-8"
      style={{ background: "rgba(0,0,0,0.5)" }}
      role="dialog"
      aria-modal="true"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border max-h-[90vh] overflow-y-auto"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)", boxShadow: "var(--shadow-lg)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <h2 className="text-lg font-serif" style={{ color: "var(--text)" }}>Apply to join {club.name}</h2>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Tell the club a bit about yourself.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>GPA</label>
              <input
                type="number" min="0" max="4" step="0.1" required
                value={form.gpa}
                onChange={(e) => set("gpa", e.target.value)}
                placeholder="e.g. 3.4"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Credit hours completed</label>
              <input
                type="number" min="0" max="160" required
                value={form.creditHours}
                onChange={(e) => set("creditHours", e.target.value)}
                placeholder="e.g. 90"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Major / Specialization</label>
            <input
              type="text" required
              value={form.major}
              onChange={(e) => set("major", e.target.value)}
              placeholder="e.g. Computer Engineering"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Faculty / College</label>
            <input
              type="text" required
              value={form.faculty}
              onChange={(e) => set("faculty", e.target.value)}
              placeholder="e.g. Faculty of Engineering"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Skills</label>
            {form.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {form.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ background: "var(--bg-subtle)", color: "var(--text)" }}
                  >
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)} aria-label={`Remove ${skill}`} style={{ color: "var(--text-faint)" }}>×</button>
                  </span>
                ))}
              </div>
            )}
            <input
              type="text"
              value={form.skillDraft}
              onChange={(e) => set("skillDraft", e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkill();
                }
              }}
              placeholder="Type a skill and press Enter"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Availability</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABILITY_OPTIONS.map((option) => {
                const active = form.availability.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleAvailability(option)}
                    className="text-xs px-3 py-1.5 rounded-full border font-medium transition-colors"
                    style={
                      active
                        ? { background: "var(--accent)", borderColor: "var(--accent)", color: "#fff" }
                        : { borderColor: "var(--border)", color: "var(--text-muted)" }
                    }
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>
              Why do you want to join this club?
            </label>
            <textarea
              required
              rows={3}
              maxLength={WHY_MAX_LENGTH}
              value={form.why}
              onChange={(e) => set("why", e.target.value)}
              placeholder="A few sentences about your motivation..."
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              style={inputStyle}
            />
            <p className="text-xs mt-1 text-right" style={{ color: "var(--text-faint)" }}>{form.why.length}/{WHY_MAX_LENGTH}</p>
          </div>

          {error && (
            <p className="text-sm rounded-md px-3 py-2 border" style={{ color: "var(--accent-dark)", background: "var(--accent-bg)", borderColor: "var(--accent-border)" }}>
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="text-sm px-4 py-2 rounded-lg border font-medium disabled:opacity-60 transition-colors"
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="text-sm px-4 py-2 rounded-lg font-medium text-white disabled:opacity-60 transition-colors"
              style={{ background: "var(--accent)" }}
            >
              {submitting ? "Submitting..." : "Submit application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
