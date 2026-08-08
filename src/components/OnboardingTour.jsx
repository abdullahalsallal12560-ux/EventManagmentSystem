import { useEffect, useState } from "react";

const SPOTLIGHT_PADDING = 8;
const TOOLTIP_WIDTH = 300;

// Simple custom step-by-step tour (no external library). Each step either
// spotlights a real DOM element — found via `[data-tour="<target>"]`,
// measured with getBoundingClientRect — or, when `target` is null, shows a
// plain centered welcome card. A full-viewport click-catcher blocks
// interaction with the rest of the page while the tour is open; the visual
// dimming + cutout around the target is done with a single box-shadow
// spread rather than four separate overlay panels.
export default function OnboardingTour({ open, steps, onFinish, onSkip }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setStepIndex(0);
  }, [open]);

  useEffect(() => {
    if (!open || !steps || steps.length === 0) return;
    const step = steps[stepIndex];
    if (!step?.target) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRect(null);
      return;
    }

    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (!el) {
      setRect(null);
      return;
    }

    el.scrollIntoView({ behavior: "smooth", block: "center" });
    const timer = setTimeout(() => setRect(el.getBoundingClientRect()), 350);
    return () => clearTimeout(timer);
  }, [open, stepIndex, steps]);

  useEffect(() => {
    if (!open) return;
    function recompute() {
      const step = steps?.[stepIndex];
      if (!step?.target) return;
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      if (el) setRect(el.getBoundingClientRect());
    }
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, [open, stepIndex, steps]);

  if (!open || !steps || steps.length === 0) return null;

  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  function handleNext() {
    if (isLast) onFinish && onFinish();
    else setStepIndex((i) => i + 1);
  }

  const spotlightStyle = rect
    ? {
        position: "fixed",
        top: rect.top - SPOTLIGHT_PADDING,
        left: rect.left - SPOTLIGHT_PADDING,
        width: rect.width + SPOTLIGHT_PADDING * 2,
        height: rect.height + SPOTLIGHT_PADDING * 2,
        borderRadius: 12,
        boxShadow: "0 0 0 9999px rgba(0,0,0,0.7)",
        border: "2px solid var(--accent)",
        pointerEvents: "none",
        zIndex: 101,
        transition: "top 200ms ease, left 200ms ease, width 200ms ease, height 200ms ease",
      }
    : null;

  let tooltipStyle = { position: "fixed", zIndex: 102, width: TOOLTIP_WIDTH };
  if (rect) {
    const spaceBelow = window.innerHeight - rect.bottom;
    const placeBelow = spaceBelow > 200;
    const top = placeBelow
      ? rect.bottom + SPOTLIGHT_PADDING + 12
      : Math.max(16, rect.top - SPOTLIGHT_PADDING - 12 - 170);
    const maxLeft = Math.max(16, window.innerWidth - TOOLTIP_WIDTH - 16);
    const left = Math.min(Math.max(16, rect.left), maxLeft);
    tooltipStyle = { ...tooltipStyle, top, left };
  } else {
    tooltipStyle = { ...tooltipStyle, top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  }

  return (
    <>
      <div
        className="fixed inset-0"
        style={{ zIndex: 100, background: rect ? "transparent" : "rgba(0,0,0,0.7)" }}
        onClick={(e) => e.preventDefault()}
      />
      {spotlightStyle && <div style={spotlightStyle} />}

      <div
        role="dialog"
        aria-modal="true"
        className="rounded-xl border p-5"
        style={{ ...tooltipStyle, background: "var(--bg-card)", borderColor: "var(--border)", boxShadow: "var(--shadow-lg)" }}
      >
        <p className="text-xs font-medium mb-2" style={{ color: "var(--text-faint)" }}>
          Step {stepIndex + 1} of {steps.length}
        </p>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{step.text}</p>
        <div className="flex items-center justify-between mt-5">
          <button type="button" onClick={onSkip} className="text-xs font-medium transition-colors hover:opacity-70" style={{ color: "var(--text-muted)" }}>
            Skip tour
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="text-sm text-white rounded-lg px-4 py-2 font-medium transition-colors hover:opacity-90"
            style={{ background: "var(--accent)" }}
          >
            {isLast ? "Got it!" : "Next"}
          </button>
        </div>
      </div>
    </>
  );
}
