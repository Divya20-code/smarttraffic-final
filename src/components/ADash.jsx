



import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const STATS_API_URL = "http://localhost:5000/api/incidents/stats";
const INCIDENTS_API_URL = "http://localhost:5000/api/incidents";
const REFRESH_INTERVAL = 10000;

const INITIAL_STATS = {
  totalReports: 0,
  pending: 0,
  responding: 0,
  resolved: 0,
  highPriority: 0,
};

const formatType = (value) =>
  String(value || "Other")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

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

  return map[value] || formatType(value);
};

const formatDate = (date) => {
  if (!date) return "Date unavailable";

  const parsed = new Date(date);

  return Number.isNaN(parsed.getTime())
    ? "Date unavailable"
    : parsed.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
};

const severityClass = (severity) => {
  const value = String(severity || "medium").toLowerCase();

  if (["critical", "high"].includes(value)) {
    return "text-red-400 bg-red-500/10 border-red-500/30";
  }

  if (value === "medium") {
    return "text-amber-400 bg-amber-500/10 border-amber-500/30";
  }

  return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
};

const statusClass = (status) => {
  const value = String(status || "reported").toLowerCase();

  if (value === "resolved") {
    return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
  }

  if (["responding", "in-progress"].includes(value)) {
    return "text-blue-400 bg-blue-500/10 border-blue-500/30";
  }

  if (value === "acknowledged") {
    return "text-cyan-400 bg-cyan-500/10 border-cyan-500/30";
  }

  return "text-orange-400 bg-orange-500/10 border-orange-500/30";
};

const StatCard = ({ title, value, icon, color, border, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full text-left bg-slate-900 border ${border}
      rounded-2xl p-5 hover:bg-slate-800 hover:-translate-y-1
      transition duration-200`}
  >
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm text-slate-400">{title}</p>
        <h2 className={`text-3xl font-bold mt-3 ${color}`}>{value}</h2>
        <p className="text-xs text-slate-500 mt-2">View incidents →</p>
      </div>

      <span className="text-3xl">{icon}</span>
    </div>
  </button>
);

const ADash = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState(INITIAL_STATS);
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    setRefreshing(true);

    try {
      // 1. Fetch dashboard statistics
      const statsResponse = await fetch(STATS_API_URL, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (!statsResponse.ok) {
        throw new Error(`Stats API error: ${statsResponse.status}`);
      }

      const statsResult = await statsResponse.json();

      const statsData =
        statsResult?.stats ??
        statsResult?.data?.stats ??
        {};

      // 2. Fetch actual incidents separately
      const incidentsResponse = await fetch(INCIDENTS_API_URL, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (!incidentsResponse.ok) {
        throw new Error(`Incidents API error: ${incidentsResponse.status}`);
      }

      const incidentsResult = await incidentsResponse.json();

      const incidentsData = Array.isArray(incidentsResult)
        ? incidentsResult
        : Array.isArray(incidentsResult?.incidents)
          ? incidentsResult.incidents
          : Array.isArray(incidentsResult?.data?.incidents)
            ? incidentsResult.data.incidents
            : Array.isArray(incidentsResult?.data)
              ? incidentsResult.data
              : null;

      if (!incidentsData) {
        console.error(
          "Unexpected incidents API response:",
          incidentsResult
        );

        throw new Error(
          "Incidents API did not return an incidents array. Check GET /api/incidents."
        );
      }

      // 3. Calculate statistics from incidents as a fallback
      const countStatus = (statuses) =>
        incidentsData.filter((incident) =>
          statuses.includes(
            String(incident.status || "reported").toLowerCase()
          )
        ).length;

      const derivedStats = {
        totalReports: incidentsData.length,

        pending: countStatus(["pending", "reported"]),

        responding: countStatus([
          "responding",
          "acknowledged",
          "in-progress",
        ]),

        resolved: countStatus(["resolved"]),

        highPriority: incidentsData.filter((incident) =>
          ["high", "critical"].includes(
            String(
              incident.aiAssessment?.severity ||
                incident.severity ||
                ""
            ).toLowerCase()
          )
        ).length,
      };

      // 4. Update dashboard cards
      setStats({
        totalReports: Number(
          statsData.totalReports ??
            statsData.total ??
            derivedStats.totalReports
        ),

        pending: Number(
          statsData.pending ?? derivedStats.pending
        ),

        responding: Number(
          statsData.responding ?? derivedStats.responding
        ),

        resolved: Number(
          statsData.resolved ?? derivedStats.resolved
        ),

        highPriority: Number(
          statsData.highPriority ??
            statsData.high ??
            derivedStats.highPriority
        ),
      });

      // 5. Sort latest incidents first
      const sortedIncidents = [...incidentsData].sort((a, b) => {
        const dateA = new Date(
          a.createdAt || a.reportedAt || 0
        ).getTime();

        const dateB = new Date(
          b.createdAt || b.reportedAt || 0
        ).getTime();

        return dateB - dateA;
      });

      // Show latest five incidents
      setRecentIncidents(sortedIncidents.slice(0, 5));

      setLastUpdated(new Date());
      setError("");
    } catch (err) {
      console.error("SmartTraffic dashboard error:", err);

      setError(err.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load and automatic refresh every 10 seconds
  useEffect(() => {
    fetchDashboardData();

    const intervalId = setInterval(
      fetchDashboardData,
      REFRESH_INTERVAL
    );

    return () => clearInterval(intervalId);
  }, [fetchDashboardData]);

  const goToIncidents = () => {
    navigate("/authority/incidents");
  };

  return (
    <div className="space-y-8 text-slate-100">
      {/* HEADER */}
      <header
        className="flex flex-col lg:flex-row lg:items-center
          lg:justify-between gap-5"
      >
        <div>
          <p className="text-cyan-400 text-sm font-semibold tracking-wide">
            SMARTTRAFFIC · AUTHORITY CONTROL CENTER
          </p>

          <h1 className="text-3xl sm:text-4xl font-bold mt-2">
            Dashboard
          </h1>

          <p className="text-slate-400 mt-2">
            Monitor reports, prioritize incidents and coordinate responses.
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                error
                  ? "bg-red-400"
                  : "bg-emerald-400 animate-pulse"
              }`}
            />

            <span
              className={
                error ? "text-red-400" : "text-emerald-400"
              }
            >
              {error
                ? "Connection issue"
                : "Automatic refresh enabled"}
            </span>

            <span className="text-slate-500">
              · Every 10 seconds
              {lastUpdated &&
                ` · Updated ${lastUpdated.toLocaleTimeString("en-IN")}`}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={fetchDashboardData}
            disabled={refreshing}
            className="px-4 py-3 rounded-xl border border-slate-700
              bg-slate-900 hover:bg-slate-800 disabled:opacity-60
              font-semibold transition"
          >
            {refreshing ? "↻ Refreshing..." : "↻ Refresh Now"}
          </button>

          <button
            type="button"
            onClick={goToIncidents}
            className="px-5 py-3 rounded-xl bg-cyan-500
              hover:bg-cyan-400 text-slate-950 font-bold transition"
          >
            Manage Incidents →
          </button>
        </div>
      </header>

      {/* ERROR */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <h3 className="font-bold text-red-400">
            Dashboard update failed
          </h3>

          <p className="text-sm text-slate-300 mt-1 break-words">
            {error}
          </p>

          <button
            type="button"
            onClick={fetchDashboardData}
            className="mt-3 px-4 py-2 rounded-lg bg-red-500/20
              text-red-300 hover:bg-red-500/30 font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* HIGH PRIORITY ALERT */}
      {!loading && stats.highPriority > 0 && (
        <button
          type="button"
          onClick={goToIncidents}
          className="w-full text-left rounded-2xl border border-red-500/30
            bg-red-500/5 p-5 hover:bg-red-500/10 transition"
        >
          <div className="flex items-center gap-4">
            <span className="text-3xl">🚨</span>

            <div className="flex-1">
              <h2 className="font-bold text-red-400">
                High Priority Attention Required
              </h2>

              <p className="text-sm text-slate-400 mt-1">
                {stats.highPriority} high-priority incident(s) need review.
              </p>
            </div>

            <span className="text-red-400 font-semibold">
              Review →
            </span>
          </div>
        </button>
      )}

      {/* STATISTICS */}
      <section>
        <h2 className="text-xl font-bold mb-4">
          Incident Overview
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          <StatCard
            title="Total Reports"
            value={loading ? "—" : stats.totalReports}
            icon="📋"
            color="text-white"
            border="border-slate-800"
            onClick={goToIncidents}
          />

          <StatCard
            title="High Priority"
            value={loading ? "—" : stats.highPriority}
            icon="🚨"
            color="text-red-400"
            border="border-red-500/20"
            onClick={goToIncidents}
          />

          <StatCard
            title="Pending"
            value={loading ? "—" : stats.pending}
            icon="⏳"
            color="text-orange-400"
            border="border-orange-500/20"
            onClick={goToIncidents}
          />

          <StatCard
            title="Responding"
            value={loading ? "—" : stats.responding}
            icon="🚔"
            color="text-blue-400"
            border="border-blue-500/20"
            onClick={goToIncidents}
          />

          <StatCard
            title="Resolved"
            value={loading ? "—" : stats.resolved}
            icon="✅"
            color="text-emerald-400"
            border="border-emerald-500/20"
            onClick={goToIncidents}
          />
        </div>
      </section>

      {/* INCIDENT MANAGEMENT */}
      <section
        className="rounded-2xl border border-cyan-500/20
          bg-gradient-to-r from-cyan-500/10 to-blue-500/5 p-6"
      >
        <div
          className="flex flex-col md:flex-row md:items-center
            md:justify-between gap-5"
        >
          <div>
            <p className="text-xs font-semibold tracking-widest text-cyan-400">
              OPERATIONS CENTER
            </p>

            <h2 className="text-xl font-bold mt-2">
              Incident Management
            </h2>

            <p className="text-slate-400 mt-2">
              Review reports, inspect evidence and manage responses.
            </p>
          </div>

          <button
            type="button"
            onClick={goToIncidents}
            className="px-5 py-3 rounded-xl bg-cyan-500
              hover:bg-cyan-400 text-slate-950 font-bold transition"
          >
            Open Incident Queue →
          </button>
        </div>
      </section>

      {/* RECENT INCIDENTS */}
      <section>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-bold">
              Recent Incidents
            </h2>

            <p className="text-sm text-slate-400 mt-1">
              Latest citizen reports received by SmartTraffic.
            </p>
          </div>

          <button
            type="button"
            onClick={goToIncidents}
            className="text-sm text-cyan-400 hover:text-cyan-300 font-semibold"
          >
            View All →
          </button>
        </div>

        {loading ? (
          <div
            className="rounded-2xl bg-slate-900 border border-slate-800
              p-12 text-center text-slate-400"
          >
            <div className="text-4xl animate-pulse">🚦</div>

            <p className="mt-3 font-semibold">
              Loading live incidents...
            </p>
          </div>
        ) : recentIncidents.length === 0 ? (
          <div
            className="rounded-2xl bg-slate-900 border border-slate-800
              p-10 text-center"
          >
            <div className="text-4xl mb-3">📭</div>

            <h3 className="font-bold">
              No incidents found
            </h3>

            <p className="text-sm text-slate-400 mt-2">
              New citizen reports will appear here once received by the backend.
            </p>

            <button
              type="button"
              onClick={goToIncidents}
              className="mt-5 px-4 py-3 rounded-xl border border-cyan-500/30
                text-cyan-400 hover:bg-cyan-500/10 font-semibold"
            >
              Open All Incidents →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentIncidents.map((incident, index) => {
              const id = incident._id || incident.id;

              const severity =
                incident.aiAssessment?.severity ||
                incident.severity ||
                "Medium";

              const incidentType =
                incident.aiAssessment?.incidentType ||
                incident.incidentType ||
                incident.type ||
                "Other";

              const location =
                incident.location?.address ||
                (typeof incident.location === "string"
                  ? incident.location
                  : "Location unavailable");

              return (
                <article
                  key={id || index}
                  className="rounded-2xl bg-slate-900 border border-slate-800
                    p-5 hover:border-slate-600 transition"
                >
                  <div
                    className="flex flex-col lg:flex-row lg:items-center
                      lg:justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-cyan-300 break-all">
                          {id || "ID unavailable"}
                        </span>

                        <span className="text-slate-600">•</span>

                        <span className="font-semibold">
                          {formatType(incidentType)}
                        </span>

                        <span
                          className={`text-xs px-2.5 py-1 rounded-full
                            border font-semibold ${severityClass(severity)}`}
                        >
                          {formatType(severity)}
                        </span>

                        <span
                          className={`text-xs px-2.5 py-1 rounded-full
                            border font-semibold ${statusClass(incident.status)}`}
                        >
                          {formatStatus(incident.status)}
                        </span>
                      </div>

                      <p className="text-sm text-slate-400 mt-3 break-words">
                        📍 {location}
                      </p>

                      {incident.description && (
                        <p className="text-sm text-slate-300 mt-2">
                          {incident.description}
                        </p>
                      )}

                      {incident.aiAssessment?.summary && (
                        <p className="text-sm text-slate-400 mt-2">
                          🤖 {incident.aiAssessment.summary}
                        </p>
                      )}

                      <p className="text-xs text-slate-500 mt-3">
                        Reported:{" "}
                        {formatDate(
                          incident.createdAt || incident.reportedAt
                        )}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={!id}
                      onClick={() => {
                        if (id) {
                          navigate(`/authority/incidents/${id}`);
                        }
                      }}
                      className="shrink-0 px-4 py-3 rounded-xl border
                        border-cyan-500/30 text-cyan-400
                        hover:bg-cyan-500/10 disabled:opacity-40
                        font-semibold transition"
                    >
                      View Details →
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* AI INFORMATION */}
      <section className="rounded-2xl bg-slate-900 border border-cyan-500/20 p-6">
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 shrink-0 rounded-xl bg-cyan-500/10
              flex items-center justify-center text-2xl"
          >
            🤖
          </div>

          <div>
            <h2 className="text-lg font-bold">
              AI-Assisted Traffic Intelligence
            </h2>

            <p className="text-sm text-slate-400 mt-2 leading-6">
              AI-assisted classification and severity assessments help
              authorized personnel review traffic incidents and make informed
              operational decisions.
            </p>

            <p className="text-xs text-slate-500 mt-3">
              Recommendations are advisory; operational decisions remain
              with authorized personnel.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ADash;

