import React, {
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import UserContext from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";

const API_URL = "http://localhost:5000/api";

const normalize = (value) =>
  String(value || "").trim().toLowerCase();

// "Road Block", "road_block", "road-block" sab ek jaise ban jate hain
const slug = (value) => normalize(value).replace(/[\s_]+/g, "-");

const formatType = (value) =>
  String(value || "Other")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

// Dashboard aur backend ke saath same: acknowledged = Pending
const getDisplayStatus = (status) => {
  const value = slug(status);

  if (value === "resolved") return "Resolved";

  if (["responding", "in-progress", "reviewing", "in-review"].includes(value)) {
    return "In Review";
  }

  return "Pending";
};

const getPersistentImage = (report) => {
  const image =
    report?.imageUrl ||
    report?.photoUrl ||
    report?.image ||
    report?.photo ||
    "";

  if (typeof image !== "string") return "";

  if (/^(blob:|javascript:)/i.test(image)) return "";

  // Only allow browser-safe image data or HTTP(S) URLs.
  if (/^data:image\//i.test(image)) return image;
  if (/^https?:\/\//i.test(image)) return image;

  return "";
};

const normalizeReport = (incident) => {
  const ai = incident?.aiAssessment || incident?.aiAnalysis || null;
  const location = incident?.location;

  const rawDate = incident?.createdAt || incident?.reportedAt;
  const parsedDate = rawDate ? new Date(rawDate) : null;

  return {
    ...incident,
    id: incident?._id || incident?.id || "",
    type:
      ai?.incidentType ||
      incident?.incidentType ||
      incident?.type ||
      "Other",
    severity:
      ai?.severity ||
      incident?.severity ||
      "Low",
    status: getDisplayStatus(incident?.status),
    location:
      typeof location === "object"
        ? location?.address || ""
        : location || "",
    latitude:
      location?.latitude ?? incident?.latitude ?? null,
    longitude:
      location?.longitude ?? incident?.longitude ?? null,
    image: getPersistentImage(incident),
    aiAnalysis: ai,
    createdAt:
      parsedDate && !Number.isNaN(parsedDate.getTime())
        ? parsedDate.toLocaleString("en-IN")
        : "Date unavailable",
    sortDate:
      parsedDate && !Number.isNaN(parsedDate.getTime())
        ? parsedDate.getTime()
        : 0,
  };
};

// List mein photo nahi aati (app tez rakhne ke liye), isliye har report ki
// photo alag se laate hain aur yaad rakhte hain (cache), taaki baar-baar na laani pade.
const imageCache = new Map();

const useReportImage = (report) => {
  const [image, setImage] = useState(
    report.image || imageCache.get(report.id) || ""
  );
  const [done, setDone] = useState(
    Boolean(report.image) || imageCache.has(report.id)
  );

  useEffect(() => {
    if (report.image) {
      setImage(report.image);
      setDone(true);
      return undefined;
    }

    if (!report.hasImage || !report.id) {
      setImage("");
      setDone(true);
      return undefined;
    }

    if (imageCache.has(report.id)) {
      setImage(imageCache.get(report.id));
      setDone(true);
      return undefined;
    }

    let cancelled = false;

    fetch(`${API_URL}/incidents/${report.id}`)
      .then((response) => response.json())
      .then((data) => {
        const found = getPersistentImage(data?.incident);
        imageCache.set(report.id, found);

        if (!cancelled) {
          setImage(found);
          setDone(true);
        }
      })
      .catch(() => {
        if (!cancelled) setDone(true);
      });

    return () => {
      cancelled = true;
    };
  }, [report.id, report.hasImage, report.image]);

  return { image, loading: Boolean(report.hasImage) && !image && !done };
};

const CardImage = ({ report, emptyClass }) => {
  const { image, loading } = useReportImage(report);

  if (image) {
    return (
      <img
        src={image}
        alt="Traffic incident"
        className="h-52 w-full object-cover lg:h-full lg:min-h-[220px]"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    );
  }

  return (
    <div
      className={`flex h-52 items-center justify-center text-center lg:h-full lg:min-h-[220px] ${emptyClass}`}
    >
      <div>
        <div className="mb-2 text-4xl">📷</div>
        <p className="text-sm">
          {loading ? "Loading photo..." : "No photo attached"}
        </p>
      </div>
    </div>
  );
};

const ModalImage = ({ report, borderClass }) => {
  const { image } = useReportImage(report);

  if (!image) return null;

  return (
    <img
      src={image}
      alt="Incident evidence"
      className={`max-h-[400px] w-full rounded-xl border object-contain ${borderClass}`}
    />
  );
};

const MyReports = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const context = useContext(UserContext);
  const {
    user,
    reports = [],
    reportsLoading = false,
    reportsError = "",
    refreshReports,
  } = context || {};

  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [selectedReport, setSelectedReport] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // ===== Theme classes =====
  const t = isDark
    ? {
        page: "text-white",
        card: "border-gray-700 bg-[#151B2E]",
        cardHover: "hover:border-purple-500/40",
        muted: "text-gray-400",
        subtle: "text-gray-500",
        body: "text-gray-300",
        accentText: "text-purple-400",
        input:
          "border-gray-700 bg-[#0B1020] text-white focus:border-purple-500",
        imageEmpty: "bg-[#0F1628] text-gray-500",
        outlineBtn: "border-gray-700 hover:border-purple-500",
        modal: "border-gray-700 bg-[#11182A]",
        modalHeader: "border-gray-700",
        closeBtn: "bg-gray-800 hover:bg-gray-700",
        inner: "bg-[#151B2E]",
        grayBtn: "bg-gray-800 hover:bg-gray-700",
        viewBtn:
          "border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20",
        aiBox: "border-purple-500/20 bg-purple-500/5",
        aiTitle: "text-purple-400",
        aiNote: "text-yellow-300",
        errorBox: "border-red-500/30 bg-red-500/10 text-red-300",
        resolveBox: "border-green-500/20 bg-green-500/5",
        resolveLabel: "text-green-400",
      }
    : {
        page: "text-[#1E1B4B]",
        card: "border-[#E9D5FF] bg-white",
        cardHover: "hover:border-[#C4B5FD]",
        muted: "text-slate-500",
        subtle: "text-slate-400",
        body: "text-slate-600",
        accentText: "text-[#7C3AED]",
        input:
          "border-[#E9D5FF] bg-white text-[#1E1B4B] focus:border-[#7C3AED]",
        imageEmpty: "bg-[#FAF5FF] text-slate-400",
        outlineBtn: "border-[#D8B4FE] text-[#7C3AED] hover:bg-[#F3E8FF]",
        modal: "border-[#E9D5FF] bg-white",
        modalHeader: "border-[#E9D5FF]",
        closeBtn: "bg-[#F3E8FF] text-[#7C3AED] hover:bg-[#E9D5FF]",
        inner: "bg-[#FAF5FF]",
        grayBtn: "bg-[#F3E8FF] text-[#7C3AED] hover:bg-[#E9D5FF]",
        viewBtn:
          "border-[#D8B4FE] bg-[#F3E8FF] text-[#7C3AED] hover:bg-[#E9D5FF]",
        aiBox: "border-[#E9D5FF] bg-[#FAF5FF]",
        aiTitle: "text-[#7C3AED]",
        aiNote: "text-amber-700",
        errorBox: "border-red-500/30 bg-red-50 text-red-700",
        resolveBox: "border-green-300 bg-green-50",
        resolveLabel: "text-green-700",
      };

  const getStatusClass = (status) => {
    if (status === "Resolved") {
      return isDark
        ? "border-green-500/30 bg-green-500/10 text-green-400"
        : "border-green-300 bg-green-100 text-green-700";
    }

    if (status === "In Review") {
      return isDark
        ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
        : "border-blue-300 bg-blue-100 text-blue-700";
    }

    return isDark
      ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
      : "border-yellow-300 bg-yellow-100 text-yellow-800";
  };

  const getSeverityClass = (severity) => {
    const value = normalize(severity);

    if (value === "critical" || value === "high") {
      return isDark
        ? "border-red-500/30 bg-red-500/10 text-red-400"
        : "border-red-300 bg-red-100 text-red-700";
    }

    if (value === "medium") {
      return isDark
        ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
        : "border-yellow-300 bg-yellow-100 text-yellow-800";
    }

    return isDark
      ? "border-green-500/30 bg-green-500/10 text-green-400"
      : "border-green-300 bg-green-100 text-green-700";
  };

  const hasIdentity = Boolean(
    normalize(user?.email) || normalize(user?.username)
  );

  // The context already fetches only the current citizen's reports.
  const myReports = useMemo(() => {
    return reports
      .map(normalizeReport)
      .sort((a, b) => b.sortDate - a.sortDate);
  }, [reports]);

  const filteredReports = useMemo(() => {
    return myReports.filter((report) => {
      const searchableText = [
        report.id,
        report.type,
        report.location,
        report.description,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchableText.includes(
        search.trim().toLowerCase()
      );

      const matchesStatus =
        statusFilter === "All" || report.status === statusFilter;

      const matchesType =
        typeFilter === "All" || slug(report.type) === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [myReports, search, statusFilter, typeFilter]);

  const pendingCount = myReports.filter(
    (report) => report.status === "Pending"
  ).length;

  const reviewingCount = myReports.filter(
    (report) => report.status === "In Review"
  ).length;

  const resolvedCount = myReports.filter(
    (report) => report.status === "Resolved"
  ).length;

  const handleRefresh = async () => {
    if (!refreshReports) return;

    setRefreshing(true);

    try {
      await refreshReports();
    } finally {
      setRefreshing(false);
    }
  };

  if (!user || !hasIdentity) {
    return (
      <div
        className={`mx-auto max-w-4xl rounded-2xl border border-red-500/20 p-8 ${
          isDark ? "bg-[#151B2E] text-white" : "bg-white text-[#1E1B4B]"
        }`}
      >
        <h1 className="text-2xl font-bold">My Reports</h1>
        <p className={`mt-3 ${t.muted}`}>
          Your account identity is missing. Please log in again.
        </p>
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="mt-5 rounded-xl bg-[#7C3AED] px-5 py-3 font-semibold text-white hover:bg-[#6D28D9]"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className={`mx-auto max-w-7xl pb-10 ${t.page}`}>
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className={`text-sm font-medium ${t.accentText}`}>
            CITIZEN PORTAL
          </p>
          <h1 className="mt-2 text-3xl font-bold">My Reports</h1>
          <p className={`mt-2 ${t.muted}`}>
            Track the traffic incidents reported from your account.
          </p>
          <p className={`mt-2 text-xs ${t.subtle}`}>
            Signed in as {user.email || user.username}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={refreshing || reportsLoading}
            onClick={handleRefresh}
            className={`rounded-xl border px-4 py-3 text-sm font-semibold disabled:opacity-50 ${t.outlineBtn}`}
          >
            {refreshing ? "Refreshing..." : "↻ Refresh"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/dashboard/report")}
            className="rounded-xl bg-[#7C3AED] px-5 py-3 font-semibold text-white hover:bg-[#6D28D9]"
          >
            + Report Incident
          </button>
        </div>
      </div>

      {(reportsError || !refreshReports) && (
        <div className={`mb-6 rounded-xl border p-4 text-sm ${t.errorBox}`}>
          {reportsError ||
            "Report refresh is not configured in UserContextProvider."}
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className={`rounded-2xl border p-5 ${t.card}`}>
          <p className={`text-sm ${t.muted}`}>Total Reports</p>
          <h2 className="mt-2 text-3xl font-bold">{myReports.length}</h2>
        </div>

        <div
          className={`rounded-2xl border p-5 ${
            isDark
              ? "border-yellow-500/20 bg-[#151B2E]"
              : "border-yellow-300 bg-white"
          }`}
        >
          <p className={`text-sm ${t.muted}`}>Pending</p>
          <h2
            className={`mt-2 text-3xl font-bold ${
              isDark ? "text-yellow-400" : "text-yellow-600"
            }`}
          >
            {pendingCount}
          </h2>
        </div>

        <div
          className={`rounded-2xl border p-5 ${
            isDark
              ? "border-blue-500/20 bg-[#151B2E]"
              : "border-blue-300 bg-white"
          }`}
        >
          <p className={`text-sm ${t.muted}`}>In Review</p>
          <h2
            className={`mt-2 text-3xl font-bold ${
              isDark ? "text-blue-400" : "text-blue-600"
            }`}
          >
            {reviewingCount}
          </h2>
        </div>

        <div
          className={`rounded-2xl border p-5 ${
            isDark
              ? "border-green-500/20 bg-[#151B2E]"
              : "border-green-300 bg-white"
          }`}
        >
          <p className={`text-sm ${t.muted}`}>Resolved</p>
          <h2
            className={`mt-2 text-3xl font-bold ${
              isDark ? "text-green-400" : "text-green-600"
            }`}
          >
            {resolvedCount}
          </h2>
        </div>
      </div>

      <div className={`mb-6 rounded-2xl border p-4 ${t.card}`}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className={`mb-2 block text-sm ${t.muted}`}>
              Search Reports
            </label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search location, type, description..."
              className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${t.input}`}
            />
          </div>

          <div>
            <label className={`mb-2 block text-sm ${t.muted}`}>
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${t.input}`}
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Review">In Review</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <div>
            <label className={`mb-2 block text-sm ${t.muted}`}>
              Incident Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${t.input}`}
            >
              <option value="All">All Types</option>
              <option value="accident">Accident</option>
              <option value="road-block">Road Block</option>
              <option value="congestion">Traffic Congestion</option>
              <option value="vehicle-breakdown">Vehicle Breakdown</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {reportsLoading ? (
        <div
          className={`rounded-2xl border p-10 text-center ${t.card} ${t.muted}`}
        >
          Loading your reports...
        </div>
      ) : myReports.length === 0 ? (
        <div className={`rounded-2xl border p-10 text-center ${t.card}`}>
          <div className="mb-4 text-5xl">🚦</div>
          <h2 className="text-xl font-semibold">No Reports Yet</h2>
          <p className={`mt-2 ${t.muted}`}>
            No reports linked to this account were returned by the backend.
          </p>
          <p className={`mt-2 text-sm ${t.subtle}`}>
            Older reports without a saved citizen email or username cannot be
            safely assigned to your account automatically.
          </p>
          <button
            type="button"
            onClick={() => navigate("/dashboard/report")}
            className="mt-6 rounded-xl bg-[#7C3AED] px-6 py-3 font-semibold text-white hover:bg-[#6D28D9]"
          >
            Report an Incident
          </button>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className={`rounded-2xl border p-10 text-center ${t.card}`}>
          <h2 className="text-xl font-semibold">No Matching Reports</h2>
          <p className={`mt-2 ${t.muted}`}>
            Try changing your search or filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatusFilter("All");
              setTypeFilter("All");
            }}
            className="mt-5 rounded-xl bg-[#7C3AED] px-5 py-2.5 font-semibold text-white hover:bg-[#6D28D9]"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredReports.map((report) => (
            <article
              key={report.id}
              className={`overflow-hidden rounded-2xl border transition ${t.card} ${t.cardHover}`}
            >
              <div className="flex flex-col lg:flex-row">
                <div className="w-full lg:w-64">
                  <CardImage report={report} emptyClass={t.imageEmpty} />
                </div>

                <div className="min-w-0 flex-1 p-5">
                  <div className="flex flex-col justify-between gap-4 md:flex-row">
                    <div className="min-w-0">
                      <p
                        className={`mb-2 break-all text-sm ${t.accentText}`}
                      >
                        Report ID: {report.id}
                      </p>
                      <h2 className="text-xl font-bold">
                        {formatType(report.type)}
                      </h2>
                      <p className={`mt-2 break-words text-sm ${t.muted}`}>
                        📍 {report.location || "Location unavailable"}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-start gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${getSeverityClass(
                          report.severity
                        )}`}
                      >
                        {formatType(report.severity)} Severity
                      </span>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(
                          report.status
                        )}`}
                      >
                        {report.status}
                      </span>
                    </div>
                  </div>

                  <p className={`mt-4 text-sm leading-6 ${t.body}`}>
                    {report.description || "No description provided."}
                  </p>

                  <div className={`mt-4 text-xs ${t.subtle}`}>
                    📅 {report.createdAt}
                  </div>

                  {report.aiAnalysis?.summary && (
                    <div className={`mt-4 rounded-xl border p-4 ${t.aiBox}`}>
                      <p className={`mb-2 text-sm font-semibold ${t.aiTitle}`}>
                        🤖 AI Summary
                      </p>
                      <p className={`text-sm leading-6 ${t.body}`}>
                        {report.aiAnalysis.summary}
                      </p>
                    </div>
                  )}

                  <div className="mt-5 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedReport(report)}
                      className={`rounded-xl border px-5 py-2.5 text-sm font-semibold ${t.viewBtn}`}
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {selectedReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setSelectedReport(null)}
        >
          <div
            className={`max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border ${t.modal}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`flex items-center justify-between border-b p-5 ${t.modalHeader}`}
            >
              <div className="min-w-0">
                <p className={`break-all text-sm ${t.accentText}`}>
                  Report ID: {selectedReport.id}
                </p>
                <h2 className="text-xl font-bold">Report Details</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className={`rounded-lg px-3 py-2 ${t.closeBtn}`}
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 p-5">
              <ModalImage
                report={selectedReport}
                borderClass={isDark ? "border-gray-700" : "border-[#E9D5FF]"}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  ["Incident Type", formatType(selectedReport.type)],
                  ["Severity", formatType(selectedReport.severity)],
                  ["Status", selectedReport.status],
                  ["Reported At", selectedReport.createdAt],
                ].map(([label, value]) => (
                  <div key={label} className={`rounded-xl p-4 ${t.inner}`}>
                    <p className={`text-xs ${t.subtle}`}>{label}</p>
                    <p className="mt-2 font-semibold">{value}</p>
                  </div>
                ))}
              </div>

              <div className={`rounded-xl p-4 ${t.inner}`}>
                <p className={`text-xs ${t.subtle}`}>Location</p>
                <p className="mt-2 break-words text-sm">
                  {selectedReport.location || "Location unavailable"}
                </p>
                {selectedReport.latitude != null &&
                  selectedReport.longitude != null && (
                    <p className={`mt-2 text-xs ${t.subtle}`}>
                      Coordinates: {selectedReport.latitude},{" "}
                      {selectedReport.longitude}
                    </p>
                  )}
              </div>

              <div className={`rounded-xl p-4 ${t.inner}`}>
                <p className={`text-xs ${t.subtle}`}>Description</p>
                <p
                  className={`mt-2 whitespace-pre-wrap text-sm leading-6 ${t.body}`}
                >
                  {selectedReport.description || "No description provided."}
                </p>
              </div>

              {selectedReport.resolutionNote && (
                <div className={`rounded-xl border p-4 ${t.resolveBox}`}>
                  <p className={`text-xs ${t.resolveLabel}`}>
                    Authority Resolution Note
                  </p>
                  <p
                    className={`mt-2 whitespace-pre-wrap text-sm leading-6 ${t.body}`}
                  >
                    {selectedReport.resolutionNote}
                  </p>
                </div>
              )}

              {selectedReport.aiAnalysis && (
                <div className={`rounded-xl border p-5 ${t.aiBox}`}>
                  <h3 className={`mb-4 font-bold ${t.aiTitle}`}>
                    🤖 AI Incident Analysis
                  </h3>

                  {selectedReport.aiAnalysis.summary && (
                    <div className="mb-4">
                      <p className="mb-2 text-sm font-semibold">Summary</p>
                      <p className={`text-sm leading-6 ${t.body}`}>
                        {selectedReport.aiAnalysis.summary}
                      </p>
                    </div>
                  )}

                  {Array.isArray(selectedReport.aiAnalysis.riskIndicators) &&
                    selectedReport.aiAnalysis.riskIndicators.length > 0 && (
                      <div className="mb-4">
                        <p className="mb-2 text-sm font-semibold">
                          Risk Indicators
                        </p>
                        <ul
                          className={`list-inside list-disc space-y-1 text-sm ${t.body}`}
                        >
                          {selectedReport.aiAnalysis.riskIndicators.map(
                            (risk, index) => (
                              <li key={`${risk}-${index}`}>{risk}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                  {(selectedReport.aiAnalysis.recommendation ||
                    selectedReport.aiAnalysis.recommendedResponse) && (
                    <div>
                      <p className="mb-2 text-sm font-semibold">
                        Recommended Response
                      </p>
                      <p className={`text-sm leading-6 ${t.body}`}>
                        {selectedReport.aiAnalysis.recommendation ||
                          selectedReport.aiAnalysis.recommendedResponse}
                      </p>
                    </div>
                  )}

                  <p className={`mt-4 text-xs ${t.aiNote}`}>
                    AI assessment is advisory. Final decisions remain with the
                    responsible authority.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className={`w-full rounded-xl px-5 py-3 font-semibold ${t.grayBtn}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReports;