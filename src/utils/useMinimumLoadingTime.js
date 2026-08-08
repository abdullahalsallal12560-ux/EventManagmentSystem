import { useEffect, useRef, useState } from "react";

// Keeps a loading/skeleton state visible for at least `minMs` once it starts,
// so fast responses don't produce a jarring flash of a loading skeleton.
export function useMinimumLoadingTime(loading, minMs = 400) {
  const [visible, setVisible] = useState(loading);
  const startedAt = useRef(null);

  useEffect(() => {
    if (loading) {
      startedAt.current = Date.now();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
      return;
    }
    if (startedAt.current == null) {
      setVisible(false);
      return;
    }
    const elapsed = Date.now() - startedAt.current;
    const remaining = Math.max(0, minMs - elapsed);
    const timer = window.setTimeout(() => setVisible(false), remaining);
    return () => window.clearTimeout(timer);
  }, [loading, minMs]);

  return visible;
}
