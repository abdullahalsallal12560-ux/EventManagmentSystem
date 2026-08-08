import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Unauthorized from "./pages/Unauthorized";
import ManageClubs from "./pages/ManageClubs";
import ManageUsers from "./pages/ManageUsers";
import Profile from "./pages/Profile";
import ProposeEvent from "./pages/ProposeEvent";
import ApproveEvents from "./pages/ApproveEvents";
import ManageClubMembers from "./pages/ManageClubMembers";
import BrowseClubs from "./pages/BrowseClubs";
import BrowseEvents from "./pages/BrowseEvents";
import MyRegistrations from "./pages/MyRegistrations";
import EventHistory from "./pages/EventHistory";
import ClubProfile from "./pages/ClubProfile";
import EventDetail from "./pages/EventDetail";
import { ROLES } from "./data/mockUsers";

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/club/:clubId"
                element={
                  <ProtectedRoute>
                    <ClubProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/event/:eventId"
                element={
                  <ProtectedRoute>
                    <EventDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/clubs"
                element={
                  <ProtectedRoute roles={[ROLES.UNIVERSITY_ADMIN]}>
                    <ManageClubs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute roles={[ROLES.UNIVERSITY_ADMIN]}>
                    <ManageUsers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/club/propose-event"
                element={
                  <ProtectedRoute roles={[ROLES.CLUB_ADMIN]}>
                    <ProposeEvent />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/club/members"
                element={
                  <ProtectedRoute roles={[ROLES.CLUB_ADMIN]}>
                    <ManageClubMembers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/events"
                element={
                  <ProtectedRoute roles={[ROLES.UNIVERSITY_ADMIN]}>
                    <ApproveEvents />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/clubs"
                element={
                  <ProtectedRoute roles={[ROLES.STUDENT]}>
                    <BrowseClubs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/events"
                element={
                  <ProtectedRoute roles={[ROLES.STUDENT]}>
                    <BrowseEvents />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/registrations"
                element={
                  <ProtectedRoute roles={[ROLES.STUDENT]}>
                    <MyRegistrations />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/history"
                element={
                  <ProtectedRoute roles={[ROLES.STUDENT]}>
                    <EventHistory />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
