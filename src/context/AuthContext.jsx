import { createContext, useContext, useState, useEffect } from "react";
import {
  findUserByCredentials,
  seedUsersIfEmpty,
  changePassword as changePasswordInDb,
} from "../data/usersStore";

const AuthContext = createContext(null);
const STORAGE_KEY = "campus_events_session"; // session only, not the database

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      await seedUsersIfEmpty(); // populate Firestore with demo accounts once

      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          setUser(JSON.parse(saved));
        } catch {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }
      setLoading(false);
    }
    init();
  }, []);

  async function login(username, password) {
    const found = await findUserByCredentials(username, password);
    if (!found) {
      return { success: false, error: "Incorrect username or password." };
    }
    const safeUser = { ...found };
    delete safeUser.password;
    setUser(safeUser);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(safeUser));
    return { success: true, user: safeUser };
  }

  function logout() {
    setUser(null);
    window.localStorage.removeItem(STORAGE_KEY);
  }

  // Self-service password change from the Profile page. Updates the
  // Firestore record and keeps the local session user unaffected
  // (password is never stored in local session state anyway).
  async function changePassword(newPassword) {
    if (!user) return { success: false, error: "Not logged in." };
    await changePasswordInDb(user.id, newPassword);
    return { success: true };
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook is intentionally colocated with its provider; splitting adds a file
// for no behavioral benefit in this app.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside an AuthProvider");
  return ctx;
}
