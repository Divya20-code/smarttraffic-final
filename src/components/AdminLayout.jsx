
import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

const AdminLayout = () => {
  const navigate = useNavigate();

  // Mobile par sidebar drawer ki tarah khulta hai
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = () => setSidebarOpen(false);

  const admin = JSON.parse(
    localStorage.getItem("adminUser") || "{}"
  );

  const handleLogout = () => {
    localStorage.removeItem("adminUser");
    closeSidebar();
    navigate("/admin-login");
  };

  const goTo = (path) => {
    closeSidebar();
    navigate(path);
  };

  const navItems = [
    {
      name: "Dashboard",
      path: "/admin/dashboard",
      icon: "📊",
    },
    {
      name: "All Incidents",
      path: "/admin/incidents",
      icon: "🚨",
    },
    {
      name: "Authority Management",
      path: "/admin/authorities",
      icon: "👮",
    },
    {
      name: "Citizens",
      path: "/admin/citizens",
      icon: "👥",
    },
    {
      name: "Analytics",
      path: "/admin/analytics",
      icon: "📈",
    },
    {
      name: "Traffic Map",
      path: "/admin/map",
      icon: "🗺️",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">

      {/* ================= MOBILE OVERLAY ================= */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        ></div>
      )}

      {/* ================= SIDEBAR ================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transform transition-transform duration-300 md:static md:z-auto md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >

        {/* LOGO */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">

            <div className="text-3xl">
              🚦
            </div>

            <div className="flex-1">
              <h1 className="font-bold text-lg">
                SmartTraffic
              </h1>

              <p className="text-xs text-purple-400">
                Admin Panel
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

        {/* ================= NAVIGATION ================= */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">

          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                  isActive
                    ? "bg-purple-500 text-white font-semibold"
                    : "text-slate-300 hover:bg-slate-800"
                }`
              }
            >
              <span className="text-lg">
                {item.icon}
              </span>

              <span>
                {item.name}
              </span>
            </NavLink>
          ))}

          {/* ================= SWITCH PANELS ================= */}

          <div className="pt-5 mt-4 border-t border-slate-800">

            <p className="text-[10px] uppercase tracking-widest text-slate-500 px-4 mb-3">
              Switch Panel
            </p>

            {/* CITIZEN PANEL */}
            <button
              onClick={() => goTo("/dashboard")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 transition text-left"
            >
              <span className="text-lg">
                👤
              </span>

              <span>
                Citizen Panel
              </span>
            </button>

            {/* AUTHORITY PANEL */}
            <button
              onClick={() => goTo("/authority-login")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 transition text-left"
            >
              <span className="text-lg">
                🚦
              </span>

              <span>
                Authority Panel
              </span>
            </button>

          </div>

        </nav>

        {/* ================= ADMIN INFO ================= */}
        <div className="p-4 border-t border-slate-800">

          <div className="bg-slate-800 rounded-xl p-3 mb-3">

            <p className="text-xs text-slate-400">
              Logged in as
            </p>

            <p className="text-sm font-semibold mt-1">
              {admin.adminId || "Administrator"}
            </p>

            <p className="text-xs text-purple-400 mt-1">
              {admin.name || "SmartTraffic Admin"}
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

      {/* ================= MAIN AREA ================= */}
      <main className="flex-1 min-w-0">

        {/* TOP BAR */}
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

            <div className="min-w-0">

              <p className="text-sm text-slate-400 truncate">
                SmartTraffic Administration
              </p>

              <p className="font-semibold truncate">
                System Control Center
              </p>

            </div>

          </div>

          <div className="flex items-center gap-2 shrink-0">

            <span className="w-2.5 h-2.5 bg-green-400 rounded-full"></span>

            <span className="text-sm text-slate-300">
              System Online
            </span>

          </div>

        </header>

        {/* PAGE CONTENT */}
        <section className="p-5 md:p-8">
          <Outlet />
        </section>

      </main>

    </div>
  );
};

export default AdminLayout;