import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { findUserByCredentials } from "../data/usersStore";
import { MOCK_USERS, ROLE_LABELS } from "../data/mockUsers";
import SmsOtpToast from "../components/SmsOtpToast";
import { DotMark } from "../components/Logo";

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Full-panel animated dot-grid, pure CSS (no JS) — echoes the HTU dot mark.
function AnimatedDotGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <style>{`
        @keyframes dotDrift {
          from { background-position: 0 0; }
          to { background-position: 32px 32px; }
        }
      `}</style>
      <div
        className="absolute -inset-8"
        style={{
          backgroundImage: "radial-gradient(var(--accent) 1.5px, transparent 1.5px)",
          backgroundSize: "16px 16px",
          opacity: 0.08,
          animation: "dotDrift 6s linear infinite",
        }}
      />
    </div>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState("credentials"); // "credentials" | "otp"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const [pendingUser, setPendingUser] = useState(null);
  const [otp, setOtp] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [devPanelOpen, setDevPanelOpen] = useState(false);
  const devPanelRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (devPanelRef.current && !devPanelRef.current.contains(e.target)) setDevPanelOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Only VALIDATE credentials here — do not commit the session yet. The
  // session is only created after the OTP step passes below. Shared by the
  // real sign-in form and the dev quick-fill panel so both go through the
  // exact same OTP flow.
  async function submitCredentials(candidateUsername, candidatePassword) {
    setError("");
    setChecking(true);
    const found = await findUserByCredentials(candidateUsername, candidatePassword);
    setChecking(false);

    if (!found) {
      setError("Incorrect username or password.");
      return;
    }

    setPendingUser(found);
    const code = generateOtp();
    setOtp(code);
    setOtpInput("");
    setOtpError("");
    setShowToast(true);
    setStep("otp");
  }

  async function handleCredentialsSubmit(e) {
    e.preventDefault();
    await submitCredentials(username, password);
  }

  async function handleDevQuickFill(role) {
    const demoUser = MOCK_USERS.find((u) => u.role === role);
    if (!demoUser) return;
    setUsername(demoUser.username);
    setPassword(demoUser.password);
    setDevPanelOpen(false);
    await submitCredentials(demoUser.username, demoUser.password);
  }

  function resendOtp() {
    const code = generateOtp();
    setOtp(code);
    setOtpInput("");
    setOtpError("");
    setShowToast(true);
  }

  async function handleOtpSubmit(e) {
    e.preventDefault();
    if (otpInput.trim() !== otp) {
      setOtpError("Incorrect code. Check the SMS notification and try again.");
      return;
    }
    // OTP passed — now actually commit the session.
    setSubmitting(true);
    const result = await login(username, password);
    setSubmitting(false);

    if (!result.success) {
      setOtpError(result.error);
      return;
    }
    navigate("/dashboard");
  }

  const inputStyle = { borderColor: "var(--border)", "--tw-ring-color": "var(--accent)" };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: "var(--bg)" }}>
      {showToast && step === "otp" && (
        <SmsOtpToast phone={pendingUser?.phone || "your phone"} code={otp} onClose={() => setShowToast(false)} />
      )}

      <div
        className="w-full max-w-4xl grid md:grid-cols-2 rounded-2xl overflow-hidden border"
        style={{ borderColor: "var(--border)", boxShadow: "var(--shadow-lg)" }}
      >
        {/* Left: brand panel */}
        <div
          className="hidden md:flex flex-col justify-between p-10 relative overflow-hidden border-r"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <AnimatedDotGrid />
          <div className="relative z-10">
            <DotMark className="mb-6" />
            <p className="text-xs tracking-[0.3em] uppercase font-medium" style={{ color: "var(--accent)" }}>
              Campus Life, One Place
            </p>
            <h1 className="mt-4 text-4xl font-serif leading-tight" style={{ color: "var(--text)" }}>
              Student Events<br />Management System
            </h1>
          </div>
          <p className="relative z-10 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Accounts are provisioned by the university. If you don't have
            a username and password yet, contact your University Admin.
          </p>
        </div>

        {/* Right: form */}
        <div className="p-8 md:p-10" style={{ background: "var(--bg-card)" }}>
          {step === "credentials" && (
            <>
              <h2 className="text-2xl font-serif mb-1" style={{ color: "var(--text)" }}>Sign in</h2>
              <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>Use the account provided by your university.</p>

              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Username</label>
                  <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. 220101" className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                    style={inputStyle} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Password</label>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                    style={inputStyle} />
                </div>

                {error && (
                  <p className="text-sm rounded-md px-3 py-2 border" style={{ color: "var(--accent-dark)", background: "var(--accent-bg)", borderColor: "var(--accent-border)" }}>
                    {error}
                  </p>
                )}

                <button type="submit" disabled={checking}
                  className="w-full text-white rounded-lg py-2.5 text-sm font-medium transition-colors disabled:opacity-60"
                  style={{ background: checking ? "var(--accent-dark)" : "var(--accent)" }}>
                  {checking ? "Checking..." : "Sign in"}
                </button>
              </form>
            </>
          )}

          {step === "otp" && (
            <>
              <h2 className="text-2xl font-serif mb-1" style={{ color: "var(--text)" }}>Verify it's you</h2>
              <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
                We sent a code by SMS to <strong>{pendingUser?.phone}</strong>.
              </p>
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <input type="text" inputMode="numeric" required value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="6-digit code" className="w-full rounded-lg border px-3 py-2 text-sm tracking-widest focus:outline-none focus:ring-2 focus:border-transparent"
                  style={inputStyle} />
                {otpError && (
                  <p className="text-sm rounded-md px-3 py-2 border" style={{ color: "var(--accent-dark)", background: "var(--accent-bg)", borderColor: "var(--accent-border)" }}>
                    {otpError}
                  </p>
                )}
                <button type="submit" disabled={submitting}
                  className="w-full text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-60" style={{ background: "var(--accent)" }}>
                  {submitting ? "Signing in..." : "Verify & sign in"}
                </button>
                <div className="flex items-center justify-between text-sm">
                  <button type="button" onClick={resendOtp} className="font-medium" style={{ color: "var(--accent)" }}>Resend code</button>
                  <button type="button" onClick={() => setStep("credentials")} style={{ color: "var(--text-muted)" }}>← Back</button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>

      <div ref={devPanelRef} className="fixed bottom-3 left-3 z-40">
        {devPanelOpen && (
          <div
            className="mb-2 rounded-lg border p-2 space-y-1 w-40"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)", boxShadow: "var(--shadow-md)" }}
          >
            {Object.keys(ROLE_LABELS).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => handleDevQuickFill(role)}
                className="block w-full text-left text-xs px-2 py-1.5 rounded hover:opacity-70"
                style={{ color: "var(--text-muted)" }}
              >
                {ROLE_LABELS[role]}
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => setDevPanelOpen((o) => !o)}
          className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors hover:opacity-80"
          style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "var(--bg-card)" }}
        >
          Demo Accounts
        </button>
      </div>
    </div>
  );
}
