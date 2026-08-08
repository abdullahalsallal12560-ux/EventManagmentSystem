import { QRCodeSVG } from "qrcode.react";
import { X } from "lucide-react";

// Full-screen presentation of a ticket's QR code, easy for a scanner to
// read across a room. Controlled: render always, pass `open` to show/hide.
export default function QRCodeModal({ open, value, title, subtitle, onClose }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-8 flex flex-col items-center text-center"
        style={{ background: "#fff", boxShadow: "var(--shadow-lg)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="self-end -mt-2 -mr-2 mb-2 p-1.5 rounded-full"
          style={{ color: "#6B6B6B" }}
        >
          <X size={20} />
        </button>

        <QRCodeSVG value={value} size={260} />

        {title && <p className="text-base font-medium font-serif mt-6" style={{ color: "#111111" }}>{title}</p>}
        {subtitle && <p className="text-sm mt-1" style={{ color: "#6B6B6B" }}>{subtitle}</p>}
      </div>
    </div>
  );
}
