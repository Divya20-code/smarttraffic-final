

import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

const ALayout = () => {
  const navigate = useNavigate();

  // Mobile par sidebar drawer ki tarah khulta hai
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = () => setSidebarOpen(false);

  const officer = JSON.parse(
    localStorage.getItem("authorityUser") || "{}"
  );

  const handleLogout = () => {
    localStorage.removeItem("authorityUser");
    closeSidebar();
    navigate("/authority-login");
  };

  const goTo = (path) => {
    closeSidebar();
    navigate(path);
  };

  const navItems = [
    {
      name: "Dashboard",
      path: "/authority/dashboard",
      icon: "📊",
    },
    {
      name: "Incidents",
      path: "/authority/incidents",
      icon: "🚨",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        ></div>
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transform transition-transform duration-300 md:static md:z-auto md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >

        {/* BRAND */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🚦</div>

            <div className="flex-1">
              <h1 className="font-bold text-lg">
                SmartTraffic
              </h1>

              <p className="text-xs text-cyan-400">
                Authority Panel
              </p>
            </div>

            {/* CLOSE (mobile only) */}
            <button
              onClick={closeSidebar}
              aria-label="Close menu"
              className="md:hidden text-slate-400 hover:text-white text-xl px-2"
            >
              ✕
            </button>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">

          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                  isActive
                    ? "bg-cyan-500 text-slate-950 font-semibold"
                    : "text-slate-300 hover:bg-slate-800"
                }`
              }
            >
              <span>{item.icon}</span>
              <span>{item.name}</span>
            </NavLink>
          ))}

          {/* SWITCH TO CITIZEN */}
          <button
            onClick={() => goTo("/dashboard")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 transition text-left"
          >
            <span>👤</span>
            <span>Citizen Panel</span>
          </button>

          {/* SWITCH TO ADMIN */}
          <button
            onClick={() => goTo("/admin-login")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 transition text-left"
          >
            <span>🛡️</span>
            <span>Admin Panel</span>
          </button>

        </nav>

        {/* BOTTOM */}
        <div className="p-4 border-t border-slate-800">

          <div className="bg-slate-800 rounded-xl p-3 mb-3">
            <p className="text-xs text-slate-400">
              Logged in as
            </p>

            <p className="text-sm font-semibold mt-1">
              {officer.officerId || "Authority Officer"}
            </p>

            <p className="text-xs text-cyan-400 mt-1">
              {officer.name || "Traffic Officer"}
            </p>
          </div>

          {/* LOGOUT */}
          <button
            onClick={handleLogout}
            className="w-full py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition"
          >
            Logout
          </button>

        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 min-w-0">

        {/* HEADER */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-5 md:px-8">

          <div className="flex items-center gap-3 min-w-0">

            {/* HAMBURGER (mobile only) */}
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="md:hidden text-2xl text-slate-300 hover:text-white"
            >
              ☰
            </button>

            <p className="text-sm text-slate-400 truncate">
              Authority Control Center
            </p>

          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="w-2.5 h-2.5 bg-green-400 rounded-full"></span>

            <span className="text-sm text-slate-300">
              System Online
            </span>
          </div>

        </header>

        {/* PAGE */}
        <section className="p-5 md:p-8">
          <Outlet />
        </section>

      </main>
    </div>
  );
};

export default ALayout;