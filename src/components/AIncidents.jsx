




import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api/incidents";
const REFRESH_MS = 30000;

const formatStatus = (status) => {
  const value = String(status || "reported").toLowerCase();

  const map = {
    reported: "Pending",
    pending: "Pending",
    acknowledged: "Acknowledged",
    responding: "Responding",
    "in-progress": "Responding",
    resolved: "Resolved",
  };

  return map[value] || "Pending";
};

const formatSeverity = (severity) => {
  if (!severity) return "Medium";
  const value = String(severity);
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

const formatType = (type) => {
  if (!type) return "Other";
  return String(type)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatDate = (date) => {
  if (!date) return "Unknown";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Unknown";

  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const severityClass = (severity) => {
  if (severity === "Critical") {
    return "bg-red-600/10 text-red-300 border-red-500/40";
  }
  if (severity === "High") {
    return "bg-red-500/10 text-red-400 border-red-500/30";
  }
  if (severity === "Medium") {
    return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
  }
  return "bg-green-500/10 text-green-400 border-green-500/30";
};

const statusClass = (status) => {
  if (status === "Pending") {
    return "bg-orange-500/10 text-orange-400 border-orange-500/30";
  }
  if (status === "Acknowledged") {
    return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
  }
  if (status === "Responding") {
    return "bg-blue-500/10 text-blue-400 border-blue-500/30";
  }
  return "bg-green-500/10 text-green-400 border-green-500/30";
};

const AIncidents = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // silent = true: background refresh, loading screen nahi dikhegi
  const fetchIncidents = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError("");

      const response = await fetch(API_URL, { cache: "no-store" });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch incidents.");
      }

      setIncidents(data.incidents || []);
    } catch (err) {
      console.error("Fetch incidents error:", err);
      setError(
        "Unable to load incidents. Please make sure backend is running."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();

    const timer = setInterval(() => {
      if (!document.hidden) fetchIncidents(true);
    }, REFRESH_MS);

    return () => clearInterval(timer);
  }, [fetchIncidents]);

  const filteredIncidents = useMemo(() => {
    const searchText = search.toLowerCase();

    return incidents.filter((incident) => {
      const id = String(incident._id || "");
      const type = formatType(incident.incidentType);
      const location = incident.location?.address || "";
      const status = formatStatus(incident.status);
      const severity = formatSeverity(incident.severity);

      const matchesSearch =
        id.toLowerCase().includes(searchText) ||
        type.toLowerCase().includes(searchText) ||
        location.toLowerCase().includes(searchText);

      const matchesStatus = statusFilter === "All" || status === statusFilter;
      const matchesSeverity =
        severityFilter === "All" || severity === severityFilter;

      return matchesSearch && matchesStatus && matchesSeverity;
    });
  }, [incidents, search, statusFilter, severityFilter]);

  const Header = () => (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div>
        <p className="text-cyan-400 text-sm font-medium">
          Incident Management
        </p>

        <h1 className="text-3xl font-bold mt-1">Reported Incidents</h1>

        <p className="text-slate-400 mt-2">
          Review citizen reports and manage incident response.
        </p>
      </div>

      <button
        type="button"
        onClick={() => fetchIncidents()}
        className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-sm font-semibold transition"
      >
        ↻ Refresh
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Header />

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
          <div className="text-4xl mb-3">🚦</div>
          <h2 className="font-bold text-lg">Loading incidents...</h2>
          <p className="text-slate-400 text-sm mt-1">
            Fetching citizen reports from SmartTraffic database.
          </p>
        </div>
      </div>
    );
  }

  if (error && incidents.length === 0) {
    return (
      <div className="space-y-6">
        <Header />

        <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-10 text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="font-bold text-lg text-red-400">
            Unable to load incidents
          </h2>
          <p className="text-slate-400 text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header />

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* FILTERS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Search ID, type or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-cyan-500"
          />

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

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none"
          >
            <option value="All">All Severity</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* COUNT */}
      <div className="text-sm text-slate-400">
        Showing{" "}
        <span className="text-cyan-400 font-semibold">
          {filteredIncidents.length}
        </span>{" "}
        of{" "}
        <span className="text-white font-semibold">{incidents.length}</span>{" "}
        incidents
      </div>

      {/* LIST */}
      <div className="space-y-4">
        {filteredIncidents.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <h2 className="font-bold text-lg">No incidents found</h2>
            <p className="text-slate-400 text-sm mt-1">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          filteredIncidents.map((incident) => {
            const incidentId = incident._id;
            const type = formatType(incident.incidentType);
            const location =
              incident.location?.address || "Location not available";
            const severity = formatSeverity(incident.severity);
            const status = formatStatus(incident.status);
            const note = String(incident.resolutionNote || "").trim();

            return (
              <div
                key={incidentId}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-bold text-cyan-300 break-all">
                        {incidentId}
                      </span>

                      <span className="text-slate-400">•</span>

                      <span>{type}</span>

                      <span
                        className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${severityClass(
                          severity
                        )}`}
                      >
                        {severity}
                      </span>

                      <span
                        className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${statusClass(
                          status
                        )}`}
                      >
                        {status}
                      </span>
                    </div>

                    <p className="text-slate-400 mt-3">📍 {location}</p>

                    <p className="text-slate-300 text-sm mt-2">
                      {incident.description || "No description provided."}
                    </p>

                    {note && (
                      <p className="mt-3 text-sm rounded-lg border border-green-500/20 bg-green-500/5 px-3 py-2 text-green-300">
                        📝 Resolution note: {note}
                      </p>
                    )}

                    <p className="text-xs text-slate-500 mt-3">
                      Reported: {formatDate(incident.createdAt)}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      navigate(`/authority/incidents/${incidentId}`)
                    }
                    className="px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AIncidents;