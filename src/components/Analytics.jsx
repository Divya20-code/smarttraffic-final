import React, { useContext, useMemo } from "react";
import UserContext from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";

const normalize = (value) =>
  String(value ?? "").trim().toLowerCase();

const getStatus = (incident) => {
  const status = normalize(
    incident?.status || incident?.incidentStatus || "reported"
  ).replace(/[_\s]+/g, "-");

  if (["resolved", "completed", "closed"].includes(status)) {
    return "Resolved";
  }

  if (
    [
      "in-progress",
      "responding",
      "assigned",
      "under-review",
      "reviewing",
    ].includes(status)
  ) {
    return "In Progress";
  }

  return "Pending";
};

const getType = (incident) =>
  incident?.aiAssessment?.incidentType ||
  incident?.incidentType ||
  incident?.type ||
  "Other";

const getSeverity = (incident) =>
  normalize(
    incident?.aiAssessment?.severity ||
      incident?.severity ||
      "medium"
  );

const getDate = (incident) => {
  const value = incident?.createdAt || incident?.updatedAt;
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (incident) => {
  const date = getDate(incident);

  if (!date) return "Date unavailable";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function Analytics() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const {
    user,
    reports = [],
    refreshReports,
    reportsLoading = false,
    reportsError = "",
  } = useContext(UserContext);

  const incidents = Array.isArray(reports) ? reports : [];

  const stats = useMemo(() => {
    let pending = 0;
    let inProgress = 0;
    let resolved = 0;
    let highPriority = 0;

    const typeCounts = {};

    incidents.forEach((incident) => {
      const status = getStatus(incident);

      if (status === "Resolved") {
        resolved++;
      } else if (status === "In Progress") {
        inProgress++;
      } else {
        pending++;
      }

      if (
        ["high", "critical", "urgent"].includes(
          getSeverity(incident)
        )
      ) {
        highPriority++;
      }

      const type = String(getType(incident))
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());

      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const types = Object.entries(typeCounts).sort(
      (a, b) => b[1] - a[1]
    );

    const recent = [...incidents]
      .sort(
        (a, b) =>
          (getDate(b)?.getTime() || 0) -
          (getDate(a)?.getTime() || 0)
      )
      .slice(0, 5);

    return {
      total: incidents.length,
      pending,
      inProgress,
      resolved,
      highPriority,
      types,
      recent,
    };
  }, [incidents]);

  const page = isDark
    ? "min-h-screen bg-[#0B1020] text-white"
    : "min-h-screen bg-[#FAF5FF] text-[#1E1B4B]";

  const card = isDark
    ? "border border-[#29304a] bg-[#151B2E] text-white shadow-lg shadow-black/10"
    : "border border-[#E9D5FF] bg-white text-[#1E1B4B] shadow-sm";

  const muted = isDark ? "text-slate-400" : "text-slate-500";
  const track = isDark ? "bg-[#272e46]" : "bg-[#F3E8FF]";
  const innerBox = isDark ? "bg-[#0B1020]" : "bg-[#FAF5FF]";

  const cards = [
    {
      label: "Total Reports",
      value: stats.total,
      icon: "📋",
      accent: "border-l-cyan-400",
    },
    {
      label: "Pending Reports",
      value: stats.pending,
      icon: "⏳",
      accent: "border-l-amber-400",
    },
    {
      label: "In Progress",
      value: stats.inProgress,
      icon: "🚧",
      accent: "border-l-purple-400",
    },
    {
      label: "Resolved Reports",
      value: stats.resolved,
      icon: "✅",
      accent: "border-l-emerald-400",
    },
  ];

  const statusRows = [
    {
      label: "Pending",
      count: stats.pending,
      color: "bg-amber-400",
    },
    {
      label: "In Progress",
      count: stats.inProgress,
      color: "bg-purple-500",
    },
    {
      label: "Resolved",
      count: stats.resolved,
      color: "bg-emerald-400",
    },
  ];

  const handleRefresh = async () => {
    if (typeof refreshReports !== "function") {
      console.error("refreshReports is not available in UserContext.");
      return;
    }

    try {
      await refreshReports();
    } catch (error) {
      console.error("Analytics refresh failed:", error);
    }
  };

  return (
    <div className={page}>
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p
              className={`text-sm font-semibold uppercase tracking-widest ${
                isDark ? "text-cyan-400" : "text-[#7C3AED]"
              }`}
            >
              SmartTraffic
            </p>

            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
              Traffic Analytics
            </h1>

            <p className={`mt-2 text-sm ${muted}`}>
              Track your incident reports and their progress.
            </p>

            <p className={`mt-1 text-xs ${muted}`}>
              Account: {user?.email || user?.username || "Not available"}
            </p>
          </div>

          <button
            type="button"
            disabled={reportsLoading}
            onClick={handleRefresh}
            className="rounded-xl bg-[#7C3AED] px-5 py-3 font-semibold text-white transition hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {reportsLoading ? "Refreshing..." : "↻ Refresh Analytics"}
          </button>
        </header>

        {/* Error */}
        {reportsError && (
          <div
            className={`rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm ${
              isDark ? "text-red-300" : "text-red-700"
            }`}
          >
            <p className="font-semibold">Unable to load reports</p>
            <p className="mt-1">{reportsError}</p>
          </div>
        )}

        {!user && (
          <div
            className={`rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm ${
              isDark ? "text-amber-300" : "text-amber-800"
            }`}
          >
            Please log in to view your analytics.
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((item) => (
            <div
              key={item.label}
              className={`rounded-2xl border-l-4 ${item.accent} ${card} p-5`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className={`text-sm ${muted}`}>{item.label}</p>
                <span className="text-2xl">{item.icon}</span>
              </div>

              <p className="mt-4 text-3xl font-bold">
                {item.value}
              </p>

              <p className={`mt-2 text-xs ${muted}`}>
                Calculated from your reports
              </p>
            </div>
          ))}
        </div>

        {/* Status and incident types */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className={`${card} rounded-2xl p-5`}>
            <h2 className="text-lg font-bold">
              Report Status Overview
            </h2>

            <p className={`mt-1 text-sm ${muted}`}>
              Current status of your reports
            </p>

            <div className="mt-6 space-y-6">
              {statusRows.map((item) => {
                const percentage =
                  stats.total > 0
                    ? (item.count / stats.total) * 100
                    : 0;

                return (
                  <div key={item.label}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span>{item.label}</span>
                      <span className="font-semibold">
                        {item.count} · {Math.round(percentage)}%
                      </span>
                    </div>

                    <div className={`h-3 overflow-hidden rounded-full ${track}`}>
                      <div
                        className={`h-full rounded-full transition-all ${item.color}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={`mt-7 rounded-xl p-4 ${innerBox}`}>
              <p className={`text-sm ${muted}`}>
                High Priority Reports
              </p>

              <p
                className={`mt-1 text-2xl font-bold ${
                  isDark ? "text-red-400" : "text-red-500"
                }`}
              >
                {stats.highPriority}
              </p>
            </div>
          </section>

          <section className={`${card} rounded-2xl p-5`}>
            <h2 className="text-lg font-bold">Incident Types</h2>

            <p className={`mt-1 text-sm ${muted}`}>
              Categories from your submitted reports
            </p>

            {stats.types.length === 0 ? (
              <p className={`py-10 text-center text-sm ${muted}`}>
                {reportsLoading
                  ? "Loading reports..."
                  : "No reports available for this account."}
              </p>
            ) : (
              <div className="mt-6 space-y-5">
                {stats.types.map(([name, count]) => {
                  const percentage =
                    stats.total > 0
                      ? (count / stats.total) * 100
                      : 0;

                  return (
                    <div key={name}>
                      <div className="mb-2 flex justify-between gap-3 text-sm">
                        <span>{name}</span>
                        <span className="font-semibold">{count}</span>
                      </div>

                      <div className={`h-2.5 overflow-hidden rounded-full ${track}`}>
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-400"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Recent reports */}
        <section className={`${card} rounded-2xl p-5`}>
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold">Recent Reports</h2>
              <p className={`mt-1 text-sm ${muted}`}>
                Your latest five incidents
              </p>
            </div>

            <span className={`text-sm ${muted}`}>
              {stats.total} total
            </span>
          </div>

          {stats.recent.length === 0 ? (
            <p className={`py-10 text-center text-sm ${muted}`}>
              {reportsLoading
                ? "Loading reports..."
                : "No reports available for this account."}
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {stats.recent.map((incident, index) => {
                const status = getStatus(incident);
                const severity = getSeverity(incident);

                const title = String(getType(incident))
                  .replace(/[-_]/g, " ")
                  .replace(/\b\w/g, (char) => char.toUpperCase());

                const id = incident?._id || incident?.id || index;

                const statusColor =
                  status === "Resolved"
                    ? isDark
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-emerald-100 text-emerald-700"
                    : status === "In Progress"
                    ? isDark
                      ? "bg-purple-500/15 text-purple-400"
                      : "bg-purple-100 text-purple-700"
                    : isDark
                    ? "bg-amber-500/15 text-amber-400"
                    : "bg-amber-100 text-amber-700";

                const location =
                  typeof incident?.location === "string"
                    ? incident.location
                    : incident?.location?.address ||
                      "Location unavailable";

                return (
                  <article
                    key={id}
                    className={`flex flex-col justify-between gap-3 rounded-xl border p-4 sm:flex-row sm:items-center ${
                      isDark
                        ? "border-[#29304a] bg-[#0B1020]/70"
                        : "border-[#E9D5FF] bg-[#FAF5FF]"
                    }`}
                  >
                    <div className="min-w-0">
                      <h3 className="font-semibold">{title}</h3>

                      <p className={`mt-1 truncate text-sm ${muted}`}>
                        {location}
                      </p>

                      <p className={`mt-2 text-xs ${muted}`}>
                        {formatDate(incident)} · Severity: {severity}
                      </p>
                    </div>

                    <span
                      className={`w-fit shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${statusColor}`}
                    >
                      {status}
                    </span>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <p className={`pb-3 text-center text-xs ${muted}`}>
          SmartTraffic · Analytics uses your shared report data
        </p>
      </div>
    </div>
  );
}
