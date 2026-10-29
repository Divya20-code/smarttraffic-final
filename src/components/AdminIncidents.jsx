

import React, { useCallback, useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api/incidents";

const STATUS_LABELS = {
  reported: "Pending",
  pending: "Pending",
  acknowledged: "Acknowledged",
  responding: "Responding",
  "in-progress": "Responding",
  resolved: "Resolved",
};

const getStatusLabel = (status) =>
  STATUS_LABELS[String(status || "reported").toLowerCase()] || "Pending";

const getStatusClass = (status) => {
  const label = getStatusLabel(status);

  if (label === "Resolved") return "bg-green-500/20 text-green-400";
  if (label === "Responding") return "bg-blue-500/20 text-blue-400";
  if (label === "Acknowledged") return "bg-cyan-500/20 text-cyan-400";
  return "bg-yellow-500/20 text-yellow-400";
};

const getSeverityClass = (severity) => {
  const value = String(severity || "").toLowerCase();

  if (value === "critical") {
    return "bg-red-500/20 text-red-400 border-red-500/30";
  }
  if (value === "high") {
    return "bg-orange-500/20 text-orange-400 border-orange-500/30";
  }
  if (value === "medium") {
    return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  }
  return "bg-green-500/20 text-green-400 border-green-500/30";
};

const AdminIncidents = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchIncidents = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL, { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to fetch incidents.");
      }

      if (Array.isArray(data)) {
        setIncidents(data);
      } else if (Array.isArray(data.incidents)) {
        setIncidents(data.incidents);
      } else {
        setIncidents([]);
      }
    } catch (err) {
      console.error("Admin Incidents Error:", err);
      setError("Unable to load incidents. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const visibleIncidents = incidents.filter(
    (incident) =>
      statusFilter === "All" ||
      getStatusLabel(incident.status) === statusFilter
  );

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">⏳</div>
          <p className="text-slate-300">Loading incidents...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <p className="text-purple-400 text-sm font-medium mb-2">
          INCIDENT MANAGEMENT
        </p>

        <h1 className="text-3xl md:text-4xl font-bold">All Incidents</h1>

        <p className="text-slate-400 mt-2">
          Monitor all traffic incidents reported in the SmartTraffic system.
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Summary + filter */}
      <div className="mb-6 bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="text-3xl">🚨</div>

            <div>
              <p className="text-slate-400 text-sm">
                {statusFilter === "All" ? "Total Incidents" : statusFilter}
              </p>

              <p className="text-3xl font-bold mt-1">
                {visibleIncidents.length}
                <span className="text-sm text-slate-500 font-normal">
                  {" "}
                  / {incidents.length}
                </span>
              </p>
            </div>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Acknowledged">Acknowledged</option>
            <option value="Responding">Responding</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {visibleIncidents.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
          <div className="text-5xl mb-4">📭</div>

          <h2 className="text-xl font-semibold">No incidents found</h2>

          <p className="text-slate-400 mt-2">
            No incidents match the current filter.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/70">
                <tr>
                  {[
                    "Incident ID",
                    "Citizen",
                    "Location",
                    "Type",
                    "AI Severity",
                    "Authority",
                    "Status",
                    "Resolution Note",
                    "Date",
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
                {visibleIncidents.map((incident) => {
                  const severity =
                    incident.aiAssessment?.severity ||
                    incident.severity ||
                    "Unknown";

                  const type =
                    incident.aiAssessment?.incidentType ||
                    incident.incidentType ||
                    "Unknown";

                  const citizen = incident.citizen?.name || "Citizen";

                  const location =
                    incident.location?.address || "Location unavailable";

                  const authority = incident.assignedTeam || "Not Assigned";

                  const note = String(incident.resolutionNote || "").trim();

                  return (
                    <tr
                      key={incident._id}
                      className="border-t border-slate-800 hover:bg-slate-800/40 transition"
                    >
                      <td className="px-5 py-4">
                        <span className="text-cyan-400 font-medium">
                          {incident._id?.slice(-8) || "N/A"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-white">{citizen}</p>

                        {incident.citizen?.userId && (
                          <p className="text-xs text-slate-500 mt-1">
                            {incident.citizen.userId}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4 max-w-[220px]">
                        <p
                          className="text-slate-300 truncate"
                          title={location}
                        >
                          📍 {location}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-slate-200 capitalize">
                          {String(type).replace(/-/g, " ")}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityClass(
                            severity
                          )}`}
                        >
                          {severity}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-slate-300">{authority}</span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusClass(
                            incident.status
                          )}`}
                        >
                          {getStatusLabel(incident.status)}
                        </span>
                      </td>

                      <td className="px-5 py-4 max-w-[220px]">
                        {note ? (
                          <p className="text-slate-300 truncate" title={note}>
                            📝 {note}
                          </p>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-slate-300">
                          {incident.createdAt
                            ? new Date(incident.createdAt).toLocaleDateString(
                                "en-GB"
                              )
                            : "N/A"}
                        </p>

                        <p className="text-xs text-slate-500 mt-1">
                          {incident.createdAt
                            ? new Date(incident.createdAt).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" }
                              )
                            : ""}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-5 flex justify-end">
        <button
          onClick={fetchIncidents}
          className="px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-semibold transition"
        >
          🔄 Refresh Incidents
        </button>
      </div>
    </div>
  );
};

export default AdminIncidents;