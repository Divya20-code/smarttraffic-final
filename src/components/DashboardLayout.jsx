

import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { useTheme } from "../context/ThemeContext";

const DashboardLayout = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Mobile par sidebar drawer ki tarah khulta hai
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDark ? "bg-[#0B1020] text-white" : "bg-[#e8f9fd] text-slate-800"
      }`}
    >
      {/* Navbar */}
      <Navbar onMenuClick={() => setSidebarOpen(true)} />

      {/* Sidebar + Page Content */}
      <div className="flex">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* relative z-0: map jaisi cheezein navbar ke dropdown ke upar na aayein */}
        <main className="relative z-0 min-w-0 flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;