

import React, { useEffect, useState } from "react";

const AdminDash = () => {
  const [stats, setStats] = useState({
    totalCitizens: 0,
    totalAuthorities: 0,
    totalIncidents: 0,
    pending: 0,
    highPriority: 0,
    resolved: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/admin/stats"
      );

      const data = await response.json();

      console.log("Admin Stats:", data);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load admin statistics."
        );
      }

      setStats(data.stats);
    } catch (error) {
      console.error("Admin Dashboard Error:", error);

      setError(
        "Unable to load dashboard data. Make sure backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      title: "Total Citizens",
      value: stats.totalCitizens,
      icon: "👥",
      description: "Registered citizens",
    },
    {
      title: "Total Authorities",
      value: stats.totalAuthorities,
      icon: "👮",
      description: "Active authority accounts",
    },
    {
      title: "Total Incidents",
      value: stats.totalIncidents,
      icon: "🚨",
      description: "All reported incidents",
    },
    {
      title: "Pending Incidents",
      value: stats.pending,
      icon: "⏳",
      description: "Waiting for action",
    },
    {
      title: "High Priority",
      value: stats.highPriority,
      icon: "🔴",
      description: "High severity incidents",
    },
    {
      title: "Resolved",
      value: stats.resolved,
      icon: "✅",
      description: "Successfully resolved",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-4xl mb-3">⏳</div>

          <p className="text-slate-300">
            Loading Admin Dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>

      {/* HEADER */}
      <div className="mb-8">

        <p className="text-purple-400 text-sm font-medium mb-2">
          ADMIN DASHBOARD
        </p>

        <h1 className="text-3xl md:text-4xl font-bold">
          SmartTraffic Overview
        </h1>

        <p className="text-slate-400 mt-2">
          Monitor incidents, authorities and overall
          system activity.
        </p>

      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">

        {cards.map((card) => (
          <div
            key={card.title}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-purple-500/40 transition"
          >

            <div className="flex items-start justify-between">

              <div>

                <p className="text-slate-400 text-sm">
                  {card.title}
                </p>

                <h2 className="text-3xl font-bold mt-3">
                  {card.value}
                </h2>

                <p className="text-xs text-slate-500 mt-2">
                  {card.description}
                </p>

              </div>

              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-2xl">
                {card.icon}
              </div>

            </div>

          </div>
        ))}

      </div>

      {/* SYSTEM STATUS */}
      <div className="mt-8 bg-slate-900 border border-slate-800 rounded-2xl p-6">

        <div className="flex items-center justify-between">

          <div>

            <h2 className="text-xl font-semibold">
              System Status
            </h2>

            <p className="text-slate-400 text-sm mt-1">
              SmartTraffic backend and monitoring system
            </p>

          </div>

          <div className="flex items-center gap-2">

            <span className="w-3 h-3 bg-green-400 rounded-full"></span>

            <span className="text-green-400 font-medium">
              Operational
            </span>

          </div>

        </div>

      </div>

    </div>
  );
};

export default AdminDash;