import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Camera, CameraOff } from "lucide-react";

// Native getUserMedia + jsQR scanner — no third-party camera-UI library, so
// this also works in iOS Safari (html5-qrcode's internal <video> setup
// never rendered a preview there; playsInline below is what actually fixes
// that). Fully controlled UI, same props/callback shape as before. Calls
// `onDecode(decodedText)` for every successfully decoded frame — the
// caller is responsible for debouncing repeat scans of the same code,
// since a code sitting in view keeps decoding on every animation frame.
export default function QRScanner({ enabled, onDecode }) {
  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const onDecodeRef = useRef(onDecode);

  useEffect(() => {
    onDecodeRef.current = onDecode;
  }, [onDecode]);

  useEffect(() => {
    return () => stopScanner();
  }, []);

  function scanFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      if (canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code && code.data) {
        onDecodeRef.current(code.data);
      }
    }

    rafRef.current = requestAnimationFrame(scanFrame);
  }

  async function startScanner() {
    setError("");
    setStarting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setActive(true);
      rafRef.current = requestAnimationFrame(scanFrame);
    } catch {
      setError("Couldn't access the camera. Check permissions and try again.");
      streamRef.current = null;
    }
    setStarting(false);
  }

  function stopScanner() {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setActive(false);
  }

  return (
    <div
      className="rounded-xl border p-6 flex flex-col items-center text-center"
      style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full max-w-sm overflow-hidden rounded-lg"
        style={{ display: active ? "block" : "none" }}
      />
      <canvas ref={canvasRef} style={{ display: "none" }} />

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
