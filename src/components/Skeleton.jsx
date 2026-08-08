// Animated shimmer placeholder, theme-aware via CSS variables.
export default function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-md ${className}`}
      style={{ background: "var(--bg-subtle)" }}
      aria-hidden="true"
    />
  );
}

export function CardSkeleton() {
  return (
    <div
      className="rounded-xl border overflow-hidden flex flex-col"
      style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}
    >
      <Skeleton className="w-full aspect-video rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-8 w-full mt-3" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div
      className="rounded-xl border p-5"
      style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}
    >
      <Skeleton className="h-3 w-20 mb-3" />
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

export function RowSkeleton() {
  return (
    <div
      className="rounded-xl border p-4 flex items-center gap-3"
      style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}
    >
      <Skeleton className="w-10 h-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  );
}
