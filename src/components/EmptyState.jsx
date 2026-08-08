// Generic empty-state block for any list/grid that can come back empty.
// `action` is optional JSX (e.g. a Link/button) rendered below the message.
export default function EmptyState({ title, description, action }) {
  return (
    <div
      className="flex flex-col items-center text-center py-14 px-6 rounded-xl border"
      style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}
    >
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true" className="mb-4">
        <rect x="8" y="16" width="48" height="36" rx="4" stroke="var(--border)" strokeWidth="2" />
        <path d="M8 26h48" stroke="var(--border)" strokeWidth="2" />
        <circle cx="32" cy="38" r="7" stroke="var(--text-faint)" strokeWidth="2" />
        <path d="M29 38h6M32 35v6" stroke="var(--text-faint)" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{title}</p>
      {description && (
        <p className="text-sm mt-1 max-w-xs" style={{ color: "var(--text-muted)" }}>{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
