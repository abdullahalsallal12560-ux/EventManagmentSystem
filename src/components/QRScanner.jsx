import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CameraOff } from "lucide-react";

const SCANNER_ELEMENT_ID = "qr-scanner-region";

// Thin wrapper around html5-qrcode's camera-driven scanner. Fully controlled
// UI (Start/Stop buttons styled to match the app) instead of the library's
// own chrome. Calls `onDecode(decodedText)` for every successfully decoded
// frame — the caller is responsible for debouncing repeat scans of the same
// code, since the camera keeps firing the success callback every frame the
// code is in view.
export default function QRScanner({ enabled, onDecode }) {
  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const instanceRef = useRef(null);
  const onDecodeRef = useRef(onDecode);

  useEffect(() => {
    onDecodeRef.current = onDecode;
  }, [onDecode]);

  useEffect(() => {
    return () => {
      const instance = instanceRef.current;
      if (instance && instance.isScanning) {
        instance.stop().then(() => instance.clear()).catch(() => {});
      }
    };
  }, []);

  async function startScanner() {
    setError("");
    setStarting(true);
    const instance = new Html5Qrcode(SCANNER_ELEMENT_ID);
    instanceRef.current = instance;
    try {
      await instance.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => onDecodeRef.current(decodedText),
        () => {} // per-frame "no code found" — expected constantly, ignore
      );
      setActive(true);
    } catch {
      setError("Couldn't access the camera. Check permissions and try again.");
      instanceRef.current = null;
    }
    setStarting(false);
  }

  async function stopScanner() {
    const instance = instanceRef.current;
    instanceRef.current = null;
    if (instance && instance.isScanning) {
      try {
        await instance.stop();
        instance.clear();
      } catch {
        // already stopped — nothing to clean up
      }
    }
    setActive(false);
  }

  return (
    <div
      className="rounded-xl border p-6 flex flex-col items-center text-center"
      style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}
    >
      <div
        id={SCANNER_ELEMENT_ID}
        className="w-full max-w-sm overflow-hidden rounded-lg"
        style={{ display: active ? "block" : "none" }}
      />

      {!active && (
        <>
          <span className="text-4xl mb-3">📷</span>
          <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
            {enabled ? "Ready to scan tickets" : "Select an event to begin"}
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Point the camera at a student's ticket QR code.
          </p>
        </>
      )}

      {error && (
        <p className="text-sm rounded-md px-3 py-2 border mt-3" style={{ color: "var(--accent-dark)", background: "var(--accent-bg)", borderColor: "var(--accent-border)" }}>
          {error}
        </p>
      )}

      <button
        onClick={active ? stopScanner : startScanner}
        disabled={!enabled || starting}
        className="mt-4 flex items-center gap-2 text-sm rounded-lg px-5 py-2.5 font-medium text-white disabled:opacity-60"
        style={{ background: active ? "var(--accent)" : "var(--success)" }}
      >
        {active ? <CameraOff size={16} /> : <Camera size={16} />}
        {starting ? "Starting..." : active ? "Stop Scanner" : "Start Scanner"}
      </button>
    </div>
  );
}
