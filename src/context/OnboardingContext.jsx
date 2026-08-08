import { createContext, useContext, useState } from "react";

const OnboardingContext = createContext(null);

// Coordinates the "?" help button in TopBar (rendered on every page) with
// the actual tour overlay, which only lives on Dashboard.jsx — that's the
// one page guaranteed to contain every role's tour targets (nav links,
// theme toggle, QR scanner, venues/reservations sections). Clicking "?"
// from elsewhere sets `pendingStart`; Dashboard navigates there via a
// normal route change, notices `pendingStart` once its own data has
// loaded, and opens the tour itself.
export function OnboardingProvider({ children }) {
  const [pendingStart, setPendingStart] = useState(false);

  function requestTour() {
    setPendingStart(true);
  }

  function clearPendingStart() {
    setPendingStart(false);
  }

  return (
    <OnboardingContext.Provider value={{ pendingStart, requestTour, clearPendingStart }}>
      {children}
    </OnboardingContext.Provider>
  );
}

// Hook is intentionally colocated with its provider; splitting adds a file
// for no behavioral benefit in this app.
// eslint-disable-next-line react-refresh/only-export-components
export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used inside an OnboardingProvider");
  return ctx;
}
