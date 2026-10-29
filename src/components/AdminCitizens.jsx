

import React, { useCallback, useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api/admin/citizens";

const AdminCitizens = () => {
  const [citizens, setCitizens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showUnregistered, setShowUnregistered] = useState(false);

  const fetchCitizens = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL, { cache: "no-store" });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load citizens.");
      }

      setCitizens(data.citizens || []);
    } catch (err) {
      console.error("Citizens Error:", err);
      setError("Unable to load citizens. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCitizens();
  }, [fetchCitizens]);

  const registered = citizens.filter((citizen) => citizen.registered);
  const unregisteredCount = citizens.length - registered.length;
  const visible = showUnregistered ? citizens : registered;

  // Backend ke field naam: pending / resolved (purane naam bhi chalenge)
  const pendingOf = (citizen) =>
    Number(citizen.pending ?? citizen.pendingReports ?? 0);
  const resolvedOf = (citizen) =>
    Number(citizen.resolved ?? citizen.resolvedReports ?? 0);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">⏳</div>
          <p className="text-slate-300">Loading citizens...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* HEADER */}
      <div className="mb-8">
        <p className="text-purple-400 text-sm font-medium mb-2">
          CITIZEN OVERVIEW
        </p>

        <h1 className="text-3xl md:text-4xl font-bold">Citizens</h1>

        <p className="text-slate-400 mt-2">
          View citizen activity and their reported traffic incidents.
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Registered Citizens</p>
              <h2 className="text-3xl font-bold mt-2">{registered.length}</h2>
            </div>

            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-2xl">
              👥
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Active Reporters</p>
              <h2 className="text-3xl font-bold mt-2 text-cyan-400">
                {
                  visible.filter((citizen) => Number(citizen.totalReports) > 0)
                    .length
                }
              </h2>
            </div>

            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-2xl">
              📢
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Reports</p>
              <h2 className="text-3xl font-bold mt-2 text-purple-400">
                {visible.reduce(
                  (total, citizen) => total + Number(citizen.totalReports || 0),
                  0
                )}
              </h2>
            </div>

            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-2xl">
              🚨
            </div>
          </div>
        </div>
      </div>

      {/* TOGGLE: purane reporters jinka account nahi hai */}
      {unregisteredCount > 0 && (
        <label className="mb-6 flex items-center gap-3 text-sm text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={showUnregistered}
            onChange={(e) => setShowUnregistered(e.target.checked)}
            className="accent-purple-500 w-4 h-4"
          />
          Show old reporters without an account ({unregisteredCount})
        </label>
      )}

      {/* TABLE */}
      {visible.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
          <div className="text-5xl mb-4">👥</div>

          <h2 className="text-xl font-semibold">No citizens found</h2>

          <p className="text-slate-400 mt-2">
            Registered citizens will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/70">
                <tr>
                  {[
                    "Citizen",
                    "Email",
                    "Total Reports",
                    "Pending",
                    "Resolved",
                    "Last Report",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="text-left px-5 py-4 text-slate-400 font-medium whitespace-nowrap"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {visible.map((citizen, index) => (
                  <tr
                    key={`${citizen.userId || citizen.email || citizen.name}-${index}`}
                    className="border-t border-slate-800 hover:bg-slate-800/40 transition"
                  >
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-white">
                          {citizen.name || "Citizen"}
                        </p>

                        {!citizen.registered && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-600 text-slate-400">
                            No account
                          </span>
                        )}
                      </div>

                      {citizen.userId && (
                        <p className="text-xs text-slate-500 mt-1">
                          ID: {citizen.userId}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-slate-300">
                        {citizen.email || "Not available"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 font-semibold">
                        {citizen.totalReports || 0}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-yellow-400 font-medium">
                        {pendingOf(citizen)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-green-400 font-medium">
                        {resolvedOf(citizen)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      {citizen.lastReport ? (
                        <div>
                          <p className="text-slate-300">
                            {new Date(citizen.lastReport).toLocaleDateString(
                              "en-GB"
                            )}
                          </p>

                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(citizen.lastReport).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-500">No reports</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-5 flex justify-end">
        <button
          onClick={fetchCitizens}
          className="px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 transition"
        >
          🔄 Refresh Citizens
        </button>
      </div>
    </div>
  );
};

export default AdminCitizens;