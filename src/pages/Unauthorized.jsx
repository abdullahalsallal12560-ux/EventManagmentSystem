import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
      <div className="text-center">
        <h1 className="text-2xl font-serif mb-2" style={{ color: "var(--text)" }}>Access restricted</h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          Your account role doesn't have access to this page.
        </p>
        <Link
          to="/dashboard"
          className="text-sm px-4 py-2 rounded-lg text-white transition-colors"
          style={{ background: "var(--accent)" }}
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
