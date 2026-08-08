// Modal confirmation used in place of window.confirm() for destructive
// actions (delete user, remove member, reject proposal). Controlled: render
// it always, pass `open` to control visibility.
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = true,
  busy = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl border p-6"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)", boxShadow: "var(--shadow-lg)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-serif mb-2" style={{ color: "var(--text)" }}>{title}</h2>
        {description && (
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>{description}</p>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="text-sm px-4 py-2 rounded-lg border font-medium disabled:opacity-60 transition-colors"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="text-sm px-4 py-2 rounded-lg font-medium text-white disabled:opacity-60 transition-colors"
            style={{ background: danger ? "var(--accent)" : "var(--success)" }}
          >
            {busy ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
