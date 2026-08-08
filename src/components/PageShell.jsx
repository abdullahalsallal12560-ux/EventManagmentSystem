import TopBar from "./TopBar";

// Every authenticated page renders through this: consistent TopBar, heading,
// optional subtitle/actions, and a max-width content area.
export default function PageShell({ title, subtitle, actions, children, maxWidth = "max-w-6xl" }) {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <TopBar />
      <main className={`${maxWidth} mx-auto px-4 sm:px-6 py-8 sm:py-10`}>
        {(title || actions) && (
          <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
            <div>
              {title && (
                <h1 className="text-3xl font-serif" style={{ color: "var(--text)" }}>{title}</h1>
              )}
              {subtitle && (
                <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{subtitle}</p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
