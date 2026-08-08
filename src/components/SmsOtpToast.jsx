// Simulates a phone SMS notification — deliberately different styling
// (color, icon, position) from OutlookOtpToast so it reads as a separate
// channel (phone) rather than the same "system".

export default function SmsOtpToast({ phone, code, onClose }) {
  return (
    <div
      className="fixed bottom-4 right-4 z-50 w-80 rounded-2xl shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out]"
      style={{ background: "#1F2C24" }}
      role="alert"
    >
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(120%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      <div className="flex items-start gap-3 p-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "#25D366" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 4h16v12H7l-3 3V4z"
              stroke="white"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold" style={{ color: "#FFFFFF" }}>Messages</p>
            <button
              onClick={onClose}
              className="text-xs leading-none px-1"
              style={{ color: "#9AA69E" }}
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
          <p className="text-xs mt-0.5" style={{ color: "#C7CFC9" }}>
            SMS to {phone}
          </p>
          <p className="text-sm font-semibold mt-2 tracking-widest" style={{ color: "#25D366" }}>
            {code}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: "#8B958E" }}>
            is your HTU verification code
          </p>
        </div>
      </div>
    </div>
  );
}
