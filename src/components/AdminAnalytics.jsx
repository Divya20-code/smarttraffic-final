


import React, { useEffect, useState } from "react";

const emptyAnalytics = {
  total: 0,
  byType: [],
  bySeverity: [],
  byStatus: [],
  byLocation: [],
};

// Backend object bhejta hai ({ accident: 3 }), UI ko array chahiye ([{ name, count }]).
// Ye array bhi sambhalta hai, aur "High" / "high" ko ek mein jod deta hai.
const toList = (value, { mergeCase = false } = {}) => {
  let entries = [];

  if (Array.isArray(value)) {
    entries = value.map((item) => [item?.name, item?.count]);
  } else if (value && typeof value === "object") {
    entries = Object.entries(value);
  }

  const merged = new Map();

  entries.forEach(([rawName, rawCount]) => {
    const name = String(rawName ?? "").trim() || "Unknown";
    const key = mergeCase ? name.toLowerCase() : name;
    const count = Number(rawCount || 0);

    if (merged.has(key)) {
      merged.get(key).count += count;
    } else {
      merged.set(key, { name: mergeCase ? key : name, count });
    }
  });

  return [...merged.values()].sort((a, b) => b.count - a.count);
};

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState(emptyAnalytics);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/admin/analytics"
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load analytics.");
      }

      const raw = data.analytics || {};

      setAnalytics({
        total: Number(raw.total || 0),
        byType: toList(raw.byType, { mergeCase: true }),
        bySeverity: toList(raw.bySeverity, { mergeCase: true }),
        byStatus: toList(raw.byStatus, { mergeCase: true }),
        byLocation: toList(raw.byLocation),
      });
    } catch (err) {
      console.error("Analytics Error:", err);

      setError(
        err.message || "Unable to load analytics. Make sure backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const getMaxValue = (items) => {
    if (!items || items.length === 0) return 1;

    return Math.max(...items.map((item) => Number(item.count || 0)), 1);
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">📊</div>

          <p className="text-slate-300">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* HEADER */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <p className="text-purple-400 text-sm font-medium mb-2">
            SYSTEM ANALYTICS
          </p>

          <h1 className="text-3xl md:text-4xl font-bold">Traffic Analytics</h1>

          <p className="text-slate-400 mt-2">
            Analyze incidents, severity, status and locations across
            SmartTraffic.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="
            px-5 py-3
            rounded-xl
            bg-purple-500
            hover:bg-purple-400
            text-white
            font-semibold
            transition
          "
        >
          🔄 Refresh
        </button>
      </div>

      {/* ERROR */}

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* TOTAL */}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm">Total Incidents Analyzed</p>

            <h2 className="text-4xl font-bold mt-2">{analytics.total || 0}</h2>

            <p className="text-xs text-slate-500 mt-2">
              Based on incidents stored in MongoDB
            </p>
          </div>

          <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center text-3xl">
            📈
          </div>
        </div>
      </div>

      {/* GRIDS */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* INCIDENT TYPE */}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold">Incidents by Type</h2>

          <p className="text-slate-400 text-sm mt-1 mb-6">
            Distribution of reported incident categories.
          </p>

          {analytics.byType.length === 0 ? (
            <p className="text-slate-500">No type data available.</p>
          ) : (
            <div className="space-y-5">
              {analytics.byType.map((item) => {
                const max = getMaxValue(analytics.byType);
                const width = (Number(item.count) / max) * 100;

                return (
                  <div key={item.name}>
                    <div className="flex justify-between mb-2">
                      <span className="text-slate-300 capitalize">
                        {item.name}
                      </span>

                      <span className="text-cyan-400 font-semibold">
                        {item.count}
                      </span>
                    </div>

                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 rounded-full"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SEVERITY */}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold">Severity Distribution</h2>

          <p className="text-slate-400 text-sm mt-1 mb-6">
            AI-assessed incident severity.
          </p>

          {analytics.bySeverity.length === 0 ? (
            <p className="text-slate-500">No severity data available.</p>
          ) : (
            <div className="space-y-5">
              {analytics.bySeverity.map((item) => {
                const max = getMaxValue(analytics.bySeverity);
                const width = (Number(item.count) / max) * 100;

                const severity = String(item.name || "").toLowerCase();

                let barClass = "bg-green-500";

                if (severity === "medium") {
                  barClass = "bg-yellow-500";
                }

                if (severity === "high") {
                  barClass = "bg-orange-500";
                }

                if (severity === "critical") {
                  barClass = "bg-red-500";
                }

                return (
                  <div key={item.name}>
                    <div className="flex justify-between mb-2">
                      <span className="text-slate-300 capitalize">
                        {item.name}
                      </span>

                      <span className="text-white font-semibold">
                        {item.count}
                      </span>
                    </div>

                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barClass} rounded-full`}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* STATUS */}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold">Incident Status</h2>

          <p className="text-slate-400 text-sm mt-1 mb-6">
            Current workflow status of incidents.
          </p>

          {analytics.byStatus.length === 0 ? (
            <p className="text-slate-500">No status data available.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {analytics.byStatus.map((item) => {
                const status = String(item.name || "").toLowerCase();

                let icon = "⏳";
                let textClass = "text-yellow-400";

                if (status === "resolved") {
                  icon = "✅";
                  textClass = "text-green-400";
                }

                if (status === "in-progress" || status === "responding") {
                  icon = "🚓";
                  textClass = "text-blue-400";
                }

                return (
                  <div key={item.name} className="bg-slate-800/70 rounded-xl p-5">
                    <div className="text-2xl mb-3">{icon}</div>

                    <p className="text-slate-400 text-sm capitalize">
                      {item.name}
                    </p>

                    <p className={`text-2xl font-bold mt-1 ${textClass}`}>
                      {item.count}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* LOCATION */}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold">Location-wise Incidents</h2>

          <p className="text-slate-400 text-sm mt-1 mb-6">
            Areas with reported traffic incidents.
          </p>

          {analytics.byLocation.length === 0 ? (
            <p className="text-slate-500">No location data available.</p>
          ) : (
            <div className="space-y-3">
              {analytics.byLocation.map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  className="flex items-center justify-between bg-slate-800/70 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span>📍</span>

                    <span
                      className="text-slate-300 truncate"
                      title={item.name}
                    >
                      {item.name || "Unknown Location"}
                    </span>
                  </div>

                  <span className="text-purple-400 font-bold ml-4">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI SECTION */}

      <div className="mt-8 bg-slate-900 border border-purple-500/20 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-2xl">
            🤖
          </div>

          <div>
            <h2 className="text-xl font-semibold">
              AI-Assisted Incident Intelligence
            </h2>

            <p className="text-slate-400 text-sm mt-2 leading-6">
              SmartTraffic uses AI assessment to identify incident type,
              estimate severity, highlight risk indicators and recommend an
              appropriate response. AI output is advisory and does not replace
              human authority decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;