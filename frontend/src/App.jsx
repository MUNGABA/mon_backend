import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AgentDashboard from "./pages/AgentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Profile from "./pages/Profile";
import AgentProfile from "./pages/AgentProfile";
import Notifications from "./pages/Notifications";
import BannerManagement from "./pages/BannerManagement";
import NotificationManagement from "./pages/NotificationManagement";
import UserManagement from "./pages/UserManagement";
import CandidateDetail from "./pages/CandidateDetail";
import FriendsList from "./pages/FriendsPage";
import HomePage from "./pages/HomePage";


// ✅ Route privée avec rôle optionnel
function PrivateRoute({ children, role }) {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");

  if (!token || !user) return <Navigate to="/login" replace />;

  if (role && user.role !== role) {
    // Redirection selon rôle actuel
    switch (user.role) {
      case "CANDIDAT":
        return <Navigate to="/dashboard" replace />;
      case "AGENT":
        return <Navigate to="/agent" replace />;
      case "ADMIN":
        return <Navigate to="/admin" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  // Injection du user en prop dans la page
  return React.cloneElement(children, { user });
}

export default function App() {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/candidat/dashboard" element={<Dashboard />} />

      {/* === ADMIN === */}
      <Route
        path="/admin"
        element={
          <PrivateRoute role="ADMIN">
            <AdminDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/banners"
        element={
          <PrivateRoute role="ADMIN">
            <BannerManagement />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <PrivateRoute role="ADMIN">
            <UserManagement />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/notifications"
        element={
          <PrivateRoute role="ADMIN">
            <NotificationManagement />
          </PrivateRoute>
        }
      />

        <Route
        path="/admin/candidats/:id"
        element={
          <PrivateRoute role="ADMIN">
            <CandidateDetail />
          </PrivateRoute>
        }
      />


      {/* === AGENT === */}
      <Route
        path="/agent"
        element={
          <PrivateRoute role="AGENT">
            <AgentDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/agent/profile"
        element={
          <PrivateRoute role="AGENT">
            <AgentProfile />
          </PrivateRoute>
        }
      />
        
        <Route
          path="/agent/candidats/:id"
          element={
            <PrivateRoute role="AGENT">
              <CandidateDetail />
            </PrivateRoute>
          }
        />


      {/* === CANDIDAT === */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute role="CANDIDAT">
            <Dashboard />
          </PrivateRoute>
        }
      />
      
          {/* Admin / Agent */}
          <Route
            path="/admin"
            element={
              <PrivateRoute role="ADMIN">
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/agent"
            element={
              <PrivateRoute role="AGENT">
                <AgentDashboard />
              </PrivateRoute>
            }
          />

 

      <Route
        path="/profile"
        element={
          <PrivateRoute role="CANDIDAT">
            <Profile />
          </PrivateRoute>
        }
      />
        <Route
          path="/amis"
          element={
          <PrivateRoute role="CANDIDAT">
            <FriendsList />
          </PrivateRoute>
        }
      />

      {/* === Notifications (tous rôles connectés) === */}
      <Route
        path="/notifications"
        element={
          <PrivateRoute>
            <Notifications />
          </PrivateRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
