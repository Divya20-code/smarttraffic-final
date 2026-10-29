

import React, { useState, useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import LogoutModal from "./LogoutModal";
import UserContext from "../context/UserContext";

const sections = [
  {
    title: "MAIN",
    items: [
      { to: "/dashboard", label: "Dashboard", end: true },
      { to: "/dashboard/report", label: "Report Incident" },
      { to: "/dashboard/reports", label: "My Reports" },
      { to: "/dashboard/traffic-map", label: "Traffic Map" },
    ],
  },
  {
    title: "INSIGHTS",
    items: [{ to: "/dashboard/analytics", label: "Analytics" }],
  },
  {
    title: "ACCOUNT",
    items: [
      { to: "/dashboard/profile", label: "Profile" },
      { to: "/dashboard/settings", label: "Settings" },
      { to: "/dashboard/help", label: "Help" },
    ],
  },
];

const Sidebar = ({ open = false, onClose = () => {} }) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { logoutUser } = useContext(UserContext);

  const isDark = theme === "dark";

  const [showLogout, setShowLogout] = useState(false);

  const linkClass = (isActive) =>
    `block rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
      isActive
        ? isDark
          ? "bg-purple-600/20 text-purple-300"
          : "bg-purple-50 text-purple-700"
        : isDark
        ? "text-gray-300 hover:bg-purple-600/10 hover:text-purple-300"
        : "text-slate-600 hover:bg-purple-50 hover:text-purple-700"
    }`;

  return (
    <>
      {/* Mobile par sidebar ke peeche ka dhundhla parda */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 h-full w-64 shrink-0 transform overflow-y-auto border-r px-5 py-6
        transition-transform duration-300
        lg:static lg:z-auto lg:h-auto lg:min-h-[calc(100vh-64px)] lg:translate-x-0
        ${open ? "translate-x-0" : "-translate-x-full"} ${
          isDark
            ? "bg-[#0F172A] border-purple-900/40 text-white"
            : "bg-white border-slate-200 text-slate-800 shadow-[4px_0_20px_rgba(15,23,42,0.03)]"
        }`}
      >
        {/* BRAND + mobile close */}
        <div className="mb-10 flex items-start justify-between px-2">
          <div>
            <h2
              className={`text-xl font-bold tracking-tight ${
                isDark ? "text-purple-400" : "text-slate-900"
              }`}
            >
              Smart
              <span className={isDark ? "text-purple-400" : "text-purple-600"}>
                Traffic
              </span>
            </h2>

            <p
              className={`mt-1 text-[11px] uppercase tracking-widest ${
                isDark ? "text-gray-500" : "text-slate-400"
              }`}
            >
              Traffic Management
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className={`rounded-lg px-2 py-1 text-lg lg:hidden ${
              isDark
                ? "text-gray-300 hover:bg-purple-600/10"
                : "text-slate-600 hover:bg-purple-50"
            }`}
          >
            ✕
          </button>
        </div>

        {sections.map((section) => (
          <div key={section.title} className="mb-8">
            <h4
              className={`mb-3 px-2 text-[10px] font-bold tracking-[0.18em] ${
                isDark ? "text-gray-500" : "text-slate-400"
              }`}
            >
              {section.title}
            </h4>

            <div className="space-y-1.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onClose}
                  className={({ isActive }) => linkClass(isActive)}
                >
                  {item.label}
                </NavLink>
              ))}

              {section.title === "ACCOUNT" && (
                <button
                  type="button"
                  onClick={() => setShowLogout(true)}
                  className={`block w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
                    isDark
                      ? "text-gray-300 hover:bg-red-500/10 hover:text-red-400"
                      : "text-slate-600 hover:bg-red-50 hover:text-red-600"
                  }`}
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        ))}
      </aside>

      {/* LOGOUT MODAL */}
      {showLogout && (
        <LogoutModal
          onCancel={() => setShowLogout(false)}
          onLogout={() => {
            logoutUser(); // session + purani key dono saaf
            setShowLogout(false);
            onClose();
            navigate("/login", { replace: true });
          }}
        />
      )}
    </>
  );
};

export default Sidebar;