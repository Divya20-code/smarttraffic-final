


import React, { useContext, useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
import UserContext from "../context/UserContext";

const normalizeStatus = (status) => {
  const value = String(status || "reported")
    .toLowerCase()
    .replace(/_/g, "-")
    .trim();

  if (["resolved", "closed", "completed"].includes(value)) {
    return "resolved";
  }

  if (
    ["responding", "in-progress", "in progress", "processing"].includes(value)
  ) {
    return "responding";
  }

  return "pending";
};

const formatStatus = (status) => {
  return String(status || "reported")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatDate = (incident) => {
  const value = incident?.createdAt || incident?.createdAtDate;

  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const Dashboard = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const context = useContext(UserContext) || {};
  const user = context.user;
  const reports = Array.isArray(context.reports) ? context.reports : [];
  const reportsLoading = Boolean(context.reportsLoading);
  const reportsError = context.reportsError || "";
  const refreshReports = context.refreshReports;

  const myReports = useMemo(() => {
    return [...reports].sort((a, b) => {
      const dateA = new Date(a?.createdAt || a?.createdAtDate || 0).getTime();
      const dateB = new Date(b?.createdAt || b?.createdAtDate || 0).getTime();

      return dateB - dateA;
    });
  }, [reports]);

  const stats = useMemo(() => {
    return {
      totalReports: myReports.length,
      pending: myReports.filter(
        (report) => normalizeStatus(report?.status) === "pending"
      ).length,
      responding: myReports.filter(
        (report) => normalizeStatus(report?.status) === "responding"
      ).length,
      resolved: myReports.filter(
        (report) => normalizeStatus(report?.status) === "resolved"
      ).length,
    };
  }, [myReports]);

  const recentIncidents = myReports.slice(0, 5);

  const cardClass = `rounded-2xl border p-5 shadow-sm ${
    isDark
      ? "border-white/10 bg-[#151B2E] text-white"
      : "border-[#E9D5FF] bg-white text-[#1E1B4B]"
  }`;

  const mutedText = isDark ? "text-gray-400" : "text-slate-500";

  const getStatusColor = (status) => {
    const normalized = normalizeStatus(status);

    if (normalized === "resolved") {
      return isDark
        ? "bg-green-500/10 text-green-500"
        : "bg-green-100 text-green-700";
    }

    if (normalized === "responding") {
      return isDark
        ? "bg-blue-500/10 text-blue-500"
        : "bg-blue-100 text-blue-700";
    }

    return isDark
      ? "bg-orange-500/10 text-orange-500"
      : "bg-orange-100 text-orange-700";
  };

  return (
    // Background aur padding DashboardLayout deta hai, yahan nahi
    <div className={isDark ? "text-white" : "text-[#1E1B4B]"}>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Dashboard</h1>

          <p className={`mt-2 text-sm ${mutedText}`}>
            Welcome{user?.fullName ? `, ${user.fullName}` : ""} to your
            SmartTraffic dashboard.
          </p>

          <p className={`mt-1 text-xs ${mutedText}`}>
            Showing reports associated with your account.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (typeof refreshReports === "function") {
              refreshReports();
            }
          }}
          disabled={reportsLoading || typeof refreshReports !== "function"}
          className="rounded-xl bg-[#7C3AED] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {reportsLoading ? "Refreshing..." : "↻ Refresh"}
        </button>
      </div>

      {reportsError && (
        <div
          className={`mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm ${
            isDark ? "text-red-500" : "text-red-700"
          }`}
        >
          <p>{reportsError}</p>
          <p className="mt-1 text-xs">
            Check your account details and make sure the backend is running.
          </p>
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${mutedText}`}>Total Reports</p>
              <h2 className="mt-3 text-3xl font-bold">
                {reportsLoading ? "..." : stats.totalReports}
              </h2>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-2xl">
              🚦
            </div>
          </div>
          <p className={`mt-4 text-xs ${mutedText}`}>Your submitted incidents</p>
        </div>

        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${mutedText}`}>Pending</p>
              <h2 className="mt-3 text-3xl font-bold">
                {reportsLoading ? "..." : stats.pending}
              </h2>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-2xl">
              ⏳
            </div>
          </div>
          <p className={`mt-4 text-xs ${mutedText}`}>Awaiting action</p>
        </div>

        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${mutedText}`}>In Progress</p>
              <h2 className="mt-3 text-3xl font-bold">
                {reportsLoading ? "..." : stats.responding}
              </h2>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-2xl">
              🚑
            </div>
          </div>
          <p className={`mt-4 text-xs ${mutedText}`}>Being handled</p>
        </div>

        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${mutedText}`}>Resolved</p>
              <h2 className="mt-3 text-3xl font-bold">
                {reportsLoading ? "..." : stats.resolved}
              </h2>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 text-2xl">
              ✅
            </div>
          </div>
          <p className={`mt-4 text-xs ${mutedText}`}>Successfully resolved</p>
        </div>
      </div>

      <div className={cardClass}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">My Recent Reports</h2>
            <p className={`mt-1 text-sm ${mutedText}`}>
              Your five most recent incidents
            </p>
          </div>

          <span
            className={`rounded-full bg-purple-500/10 px-3 py-1 text-xs font-medium ${
              isDark ? "text-purple-500" : "text-[#7C3AED]"
            }`}
          >
            {stats.totalReports} total
          </span>
        </div>

        <div className="space-y-3">
          {reportsLoading && (
            <p className={`py-5 text-center text-sm ${mutedText}`}>
              Loading your reports...
            </p>
          )}

          {!reportsLoading && !reportsError && recentIncidents.length === 0 && (
            <div className="py-10 text-center">
              <div className="mb-3 text-4xl">🛣️</div>
              <p className="font-semibold">No reports found</p>
              <p className={`mt-2 text-sm ${mutedText}`}>
                Your submitted traffic incidents will appear here.
              </p>
            </div>
          )}

          {!reportsLoading &&
            recentIncidents.map((incident, index) => (
              <div
                key={incident?._id || incident?.id || `incident-${index}`}
                className={`flex flex-col justify-between gap-3 rounded-xl p-4 sm:flex-row sm:items-center ${
                  isDark
                    ? "bg-white/5"
                    : "border border-purple-100 bg-[#FAF5FF]"
                }`}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${
                      isDark ? "bg-[#ff1e00]" : "bg-[#7C3AED]"
                    }`}
                  />

                  <div className="min-w-0">
                    <p className="break-words text-sm font-medium">
                      {incident?.aiAssessment?.summary ||
                        incident?.description ||
                        incident?.incidentType ||
                        incident?.type ||
                        "Traffic incident"}
                    </p>

                    <p className={`mt-1 break-words text-xs ${mutedText}`}>
                      {incident?.location?.address ||
                        (typeof incident?.location === "string"
                          ? incident.location
                          : "Location unavailable")}
                    </p>

                    <p className={`mt-1 text-xs ${mutedText}`}>
                      Type:{" "}
                      {incident?.aiAssessment?.incidentType ||
                        incident?.incidentType ||
                        incident?.type ||
                        "Unknown"}
                      {" · "}
                      Severity:{" "}
                      {incident?.aiAssessment?.severity ||
                        incident?.severity ||
                        "Unknown"}
                    </p>

                    <p className={`mt-1 text-xs ${mutedText}`}>
                      Reported: {formatDate(incident)}
                    </p>
                  </div>
                </div>

                <span
                  className={`w-fit shrink-0 rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                    incident?.status
                  )}`}
                >
                  {formatStatus(incident?.status)}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;