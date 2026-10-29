


import "./App.css";
import { useContext } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// =========================
// CITIZEN COMPONENTS
// =========================
import Login from "./components/Login";
import CreateAccount from "./components/CreateAccount";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./components/Dashboard";
import ReportIncident from "./components/ReportIncident";
import MyReports from "./components/MyReports";
import Analytics from "./components/Analytics";
import TrafficMap from "./components/TrafficMap";
import Profile from "./components/Profile";
import Settings from "./components/Settings";
import Help from "./components/Help";

// =========================
// AUTHORITY COMPONENTS
// =========================
import ALogin from "./components/ALogin";
import ALayout from "./components/ALayout";
import ADash from "./components/ADash";
import AIncidents from "./components/AIncidents";
import ADetails from "./components/ADetails";

// =========================
// ADMIN COMPONENTS
// =========================
import AdminLogin from "./components/AdminLogin";
import AdminLayout from "./components/AdminLayout";
import AdminDash from "./components/AdminDash";
import AdminIncidents from "./components/AdminIncidents";
import AdminAuthorities from "./components/AdminAuthorities";
import AdminCitizens from "./components/AdminCitizens";
import AdminAnalytics from "./components/AdminAnalytics";
import AdminMap from "./components/AdminMap";

// =========================
// CONTEXT
// =========================
import UserContext from "./context/UserContext";

// =========================
// HELPERS
// =========================
const readJSON = (key) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const getHomePath = (citizenUser) => {
  if (citizenUser) return "/dashboard";
  if (readJSON("adminUser")) return "/admin/dashboard";
  if (readJSON("authorityUser")) return "/authority/dashboard";
  return "/login";
};

// =========================
// ROUTE GUARDS
// Ye har baar route khulne par chalte hain, isliye
// login/logout ke baad hamesha latest state milti hai.
// =========================
const RequireCitizen = ({ children }) => {
  const { user } = useContext(UserContext);
  return user ? children : <Navigate to="/login" replace />;
};

const RequireAuthority = ({ children }) =>
  readJSON("authorityUser") ? (
    children
  ) : (
    <Navigate to="/authority-login" replace />
  );

const RequireAdmin = ({ children }) =>
  readJSON("adminUser") ? (
    children
  ) : (
    <Navigate to="/admin-login" replace />
  );

// "/" aur unknown URL dono yahi use karte hain
const HomeRedirect = () => {
  const { user } = useContext(UserContext);
  return <Navigate to={getHomePath(user)} replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* =========================
            HOME / FALLBACK
        ========================= */}
        <Route path="/" element={<HomeRedirect />} />

        {/* =========================
            CITIZEN AUTH
        ========================= */}
        <Route path="/login" element={<Login />} />
        <Route path="/create-account" element={<CreateAccount />} />

        {/* Navbar ka Help link "/help" pe jata hai */}
        <Route
          path="/help"
          element={<Navigate to="/dashboard/help" replace />}
        />

        {/* =========================
            CITIZEN DASHBOARD
        ========================= */}
        <Route
          path="/dashboard"
          element={
            <RequireCitizen>
              <DashboardLayout />
            </RequireCitizen>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="report" element={<ReportIncident />} />
          <Route path="reports" element={<MyReports />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="traffic-map" element={<TrafficMap />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="help" element={<Help />} />
        </Route>

        {/* =========================
            AUTHORITY
        ========================= */}
        <Route path="/authority-login" element={<ALogin />} />

        <Route
          path="/authority"
          element={
            <RequireAuthority>
              <ALayout />
            </RequireAuthority>
          }
        >
          <Route
            index
            element={<Navigate to="/authority/dashboard" replace />}
          />
          <Route path="dashboard" element={<ADash />} />
          <Route path="incidents" element={<AIncidents />} />
          <Route path="incidents/:id" element={<ADetails />} />
        </Route>

        {/* =========================
            ADMIN
        ========================= */}
        <Route path="/admin-login" element={<AdminLogin />} />

        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route
            index
            element={<Navigate to="/admin/dashboard" replace />}
          />
          <Route path="dashboard" element={<AdminDash />} />
          <Route path="incidents" element={<AdminIncidents />} />
          <Route path="authorities" element={<AdminAuthorities />} />
          <Route path="citizens" element={<AdminCitizens />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="map" element={<AdminMap />} />
        </Route>

        {/* =========================
            FALLBACK
        ========================= */}
        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;