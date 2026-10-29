




import React, { useContext, useMemo } from "react";
import UserContext from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";

const getStatus = (status) => {
  const value = String(status || "reported")
    .trim()
    .toLowerCase()
    .replace(/[_\s]/g, "-");

  if (["resolved", "completed", "closed"].includes(value)) {
    return "Resolved";
  }

  if (
    [
      "in-progress",
      "inprogress",
      "responding",
      "acknowledged",
      "reviewing",
      "under-review",
      "processing",
    ].includes(value)
  ) {
    return "In Progress";
  }

  return "Pending";
};

const getCitizen = (report) => {
  if (!report?.citizen) return {};

  if (typeof report.citizen === "string") {
    return { name: report.citizen };
  }

  return report.citizen;
};

const formatType = (report) =>
  String(
    report?.aiAssessment?.incidentType ||
      report?.aiAnalysis?.incidentType ||
      report?.incidentType ||
      report?.type ||
      "Traffic Incident"
  )
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const Profile = () => {
  const context = useContext(UserContext) || {};
  const { theme } = useTheme();

  const user = context.user;
  const reports = Array.isArray(context.reports) ? context.reports : [];
  const loading = Boolean(context.reportsLoading);
  const error = context.reportsError || "";
  const refreshReports = context.refreshReports;

  const isDark = theme === "dark";

  const cardClass = isDark
    ? "border-gray-700 bg-[#151B2E] text-white"
    : "border-gray-200 bg-white text-gray-800";

  const mutedClass = isDark ? "text-gray-400" : "text-gray-500";

  // Extra safety: only display reports associated with this account.
  const myReports = useMemo(() => {
    if (!user) return [];

    const userEmail = String(user.email || "").trim().toLowerCase();
    const userUsername = String(user.username || "").trim().toLowerCase();
    const userName = String(
      user.fullName || user.name || user.username || ""
    )
      .trim()
      .toLowerCase();

    return reports
      .filter((report) => {
        const citizen = getCitizen(report);

        const reportEmail = String(citizen.email || "")
          .trim()
          .toLowerCase();

        const reportUsername = String(citizen.username || "")
          .trim()
          .toLowerCase();

        const reportName = String(citizen.name || "")
          .trim()
          .toLowerCase();

        // Prefer email when both sides have an email.
        if (userEmail && reportEmail) {
          return userEmail === reportEmail;
        }

        // Otherwise match username when available.
        if (userUsername && reportUsername) {
          return userUsername === reportUsername;
        }

        // Name is a fallback only when no comparable email/username exists.
        if (
          !reportEmail &&
          !reportUsername &&
          userName &&
          reportName &&
          reportName !== "citizen"
        ) {
          return userName === reportName;
        }

        return false;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );
  }, [reports, user]);

  const stats = useMemo(() => {
    const result = {
      total: myReports.length,
      pending: 0,
      inProgress: 0,
      resolved: 0,
    };

    myReports.forEach((report) => {
      const status = getStatus(report.status);

      if (status === "Resolved") result.resolved += 1;
      else if (status === "In Progress") result.inProgress += 1;
      else result.pending += 1;
    });

    return result;
  }, [myReports]);

  const statCards = [
    {
      title: "Total Reports",
      value: stats.total,
      icon: "📋",
      color: "text-blue-500",
    },
    {
      title: "Pending",
      value: stats.pending,
      icon: "⏳",
      color: "text-amber-500",
    },
    {
      title: "In Progress",
      value: stats.inProgress,
      icon: "🚧",
      color: "text-purple-500",
    },
    {
      title: "Resolved",
      value: stats.resolved,
      icon: "✅",
      color: "text-emerald-500",
    },
  ];

  if (!user) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold">Please login first</h2>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen p-4 sm:p-6 lg:p-8 ${
        isDark
          ? "bg-[#0B1020] text-white"
          : "bg-[#F4F7FB] text-gray-800"
      }`}
    >
      <div className="mx-auto max-w-7xl">
        {/* Page heading */}
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-purple-500">
            SmartTraffic Citizen Portal
          </p>

          <h1 className="text-3xl font-bold sm:text-4xl">
            My Profile
          </h1>

          <p className={`mt-2 ${mutedClass}`}>
            Manage your profile and track your reported traffic incidents.
          </p>
        </div>

        {/* Profile information */}
        <div
          className={`mb-8 overflow-hidden rounded-2xl border shadow-sm ${cardClass}`}
        >
          <div className="h-28 bg-gradient-to-r from-purple-700 via-indigo-600 to-cyan-500" />

          <div className="px-5 pb-6 sm:px-8">
            <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-purple-600 to-indigo-700 text-4xl font-bold text-white shadow-lg">
                {String(
                  user.fullName || user.name || user.username || "U"
                )
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="flex-1 sm:pb-1">
                <h2 className="text-2xl font-bold">
                  {user.fullName || user.name || user.username || "Citizen"}
                </h2>

                <p className={`mt-1 ${mutedClass}`}>
                  {user.email || "Email not available"}
                </p>
              </div>

              <span className="w-fit rounded-full bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-700">
                🚦 Citizen Account
              </span>
            </div>

            <div className="mt-7 grid gap-4 border-t border-gray-500/20 pt-6 sm:grid-cols-2">
              <div>
                <p className={`text-sm ${mutedClass}`}>Full Name</p>
                <p className="mt-1 font-semibold">
                  {user.fullName || user.name || "Not provided"}
                </p>
              </div>

              <div>
                <p className={`text-sm ${mutedClass}`}>Username</p>
                <p className="mt-1 font-semibold">
                  {user.username || "Not provided"}
                </p>
              </div>

              <div>
                <p className={`text-sm ${mutedClass}`}>Email Address</p>
                <p className="mt-1 break-all font-semibold">
                  {user.email || "Not provided"}
                </p>
              </div>

              <div>
                <p className={`text-sm ${mutedClass}`}>Account Role</p>
                <p className="mt-1 font-semibold">Citizen</p>
              </div>
            </div>
          </div>
        </div>

        {/* Report statistics */}
        <div className="mb-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">My Report Statistics</h2>
              <p className={`mt-1 text-sm ${mutedClass}`}>
                Counts are calculated from your linked reports.
              </p>
            </div>

            <button
              type="button"
              onClick={() => refreshReports?.()}
              disabled={loading}
              className="rounded-xl bg-purple-600 px-4 py-2.5 font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "↻ Refresh Reports"}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => (
              <div
                key={card.title}
                className={`rounded-2xl border p-5 shadow-sm transition hover:-translate-y-1 ${cardClass}`}
              >
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-medium ${mutedClass}`}>
                    {card.title}
                  </p>
                  <span className="text-2xl">{card.icon}</span>
                </div>

                <p className={`mt-4 text-3xl font-bold ${card.color}`}>
                  {loading && reports.length === 0 ? "..." : card.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent reports */}
        <div
          className={`rounded-2xl border p-5 shadow-sm sm:p-6 ${cardClass}`}
        >
          <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-bold">My Recent Reports</h2>
              <p className={`mt-1 text-sm ${mutedClass}`}>
                Your latest submitted traffic incidents.
              </p>
            </div>

            <span className="w-fit rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-700">
              {myReports.length} Reports
            </span>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          {loading && reports.length === 0 ? (
            <div className={`py-10 text-center ${mutedClass}`}>
              Loading your reports...
            </div>
          ) : myReports.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-500/30 px-4 py-10 text-center">
              <div className="mb-3 text-4xl">📍</div>

              <h3 className="font-semibold">No linked reports found</h3>

              <p className={`mx-auto mt-2 max-w-lg text-sm ${mutedClass}`}>
                Reports appear here when the backend returns incidents linked
                to your account email or username. Older reports saved only
                as "Citizen" may not be linked to your profile.
              </p>

              <button
                type="button"
                onClick={() => refreshReports?.()}
                disabled={loading}
                className="mt-5 rounded-xl bg-purple-600 px-5 py-2.5 font-semibold text-white disabled:opacity-50"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myReports.slice(0, 5).map((report, index) => {
                const status = getStatus(report.status);
                const location =
                  typeof report.location === "string"
                    ? report.location
                    : report.location?.address || "Location not available";

                const statusClass =
                  status === "Resolved"
                    ? "bg-emerald-100 text-emerald-700"
                    : status === "In Progress"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-amber-100 text-amber-700";

                return (
                  <div
                    key={report._id || report.id || index}
                    className="rounded-xl border border-gray-500/20 p-4 transition hover:border-purple-500/50"
                  >
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold">{formatType(report)}</h3>

                        <p className={`mt-2 text-sm ${mutedClass}`}>
                          📍 {location}
                        </p>

                        <p className={`mt-2 text-sm ${mutedClass}`}>
                          {report.description || "No description provided"}
                        </p>

                        <p className={`mt-2 text-xs ${mutedClass}`}>
                          {report.createdAt
                            ? new Date(report.createdAt).toLocaleString("en-IN")
                            : "Date not available"}
                        </p>

                        {(report.aiAssessment || report.aiAnalysis)?.summary && (
                          <div className="mt-3 rounded-lg bg-purple-500/5 p-3">
                            <p className="text-xs font-semibold text-purple-400">
                              AI Summary
                            </p>
                            <p className={`mt-1 text-sm ${mutedClass}`}>
                              {(report.aiAssessment || report.aiAnalysis).summary}
                            </p>
                          </div>
                        )}
                      </div>

                      <span
                        className={`w-fit shrink-0 rounded-full px-3 py-1 text-xs font-bold ${statusClass}`}
                      >
                        {status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <p className={`mt-5 text-center text-xs ${mutedClass}`}>
          SmartTraffic — Report. Respond. Save Lives.
        </p>
      </div>
    </div>
  );
};

export default Profile;