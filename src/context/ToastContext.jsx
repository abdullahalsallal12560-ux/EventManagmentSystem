import { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastContext = createContext(null);
const AUTO_DISMISS_MS = 4000;

const TYPE_STYLE = {
  success: { accent: "var(--success)", bg: "var(--success-bg)" },
  error: { accent: "var(--accent)", bg: "var(--accent-bg)" },
  info: { accent: "#2563EB", bg: "#EFF6FF" },
};

const TYPE_ICON = {
  success: "✓",
  error: "✕",
  info: "i",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type, message) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, type, message }]);
      window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss]
  );

  const api = {
    success: (message) => push("success", message),
    error: (message) => push("error", message),
    info: (message) => push("info", message),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }) {
  const style = TYPE_STYLE[toast.type] || TYPE_STYLE.info;
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border px-4 py-3 animate-[toastIn_0.2s_ease-out]"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <style>{`
        @keyframes toastIn {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
      <span
        className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
        style={{ background: style.bg, color: style.accent }}
      >
        {TYPE_ICON[toast.type]}
      </span>
      <p className="text-sm flex-1 min-w-0" style={{ color: "var(--text)" }}>
        {toast.message}
      </p>
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="text-xs shrink-0"
        style={{ color: "var(--text-faint)" }}
      >
        ✕
      </button>
    </div>
  );
}

// Hook is intentionally colocated with its provider; splitting adds a file
// for no behavioral benefit in this app.
// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside a ToastProvider");
  return ctx;
}
