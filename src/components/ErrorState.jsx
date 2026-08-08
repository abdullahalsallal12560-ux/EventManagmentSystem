import { RefreshCw } from "lucide-react";

// Shown in place of a page's content when its initial data fetch throws
// (a failed Firestore read, offline, etc.) instead of leaving a blank page
// or an infinite skeleton.
export default function ErrorState({ title = "Something went wrong", description = "We couldn't load this page. Check your connection and try again.", onRetry }) {
  return (
    <div
      className="flex flex-col items-center text-center py-14 px-6 rounded-xl border"
      style={{ borderColor: "var(--accent-border)", background: "var(--accent-bg)" }}
    >
      <p className="text-sm font-medium" style={{ color: "var(--accent-dark)" }}>{title}</p>
      {description && (
        <p className="text-sm mt-1 max-w-xs" style={{ color: "var(--text-muted)" }}>{description}</p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 flex items-center gap-1.5 text-sm text-white rounded-lg px-4 py-2 font-medium transition-colors"
          style={{ background: "var(--accent)" }}
        >
          <RefreshCw size={14} /> Try again
        </button>
      )}
    </div>
  );
}
