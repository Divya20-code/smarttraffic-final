



import React, { useContext, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import UserContext from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";

// Default view only; this is NOT an incident location.
const DEFAULT_CENTER = [30.3398, 76.3869];

// Leaflet marker icon fix for Vite.
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const normalize = (value) =>
  String(value ?? "").trim().toLowerCase();

const formatLabel = (value) =>
  String(value || "Unknown")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getLocation = (incident) => {
  return incident?.location &&
    typeof incident.location === "object"
    ? incident.location
    : {};
};

const getCoordinates = (incident) => {
  const location = getLocation(incident);

  const latitude = Number(
    location.latitude ?? location.lat ?? incident?.latitude
  );

  const longitude = Number(
    location.longitude ??
      location.lng ??
      location.lon ??
      incident?.longitude
  );

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180 ||
    (latitude === 0 && longitude === 0)
  ) {
    return null;
  }

  return [latitude, longitude];
};

const getIncidentType = (incident) =>
  incident?.aiAssessment?.incidentType ||
  incident?.incidentType ||
  incident?.aiAnalysis?.incidentType ||
  "other";

const getSeverity = (incident) =>
  incident?.aiAssessment?.severity ||
  incident?.aiAnalysis?.severity ||
  incident?.severity ||
  "Unknown";

const getStatus = (incident) =>
  incident?.status || "reported";

const getAddress = (incident) => {
  const location = getLocation(incident);

  return (
    location.address ||
    location.name ||
    "Address unavailable"
  );
};

const isResolved = (incident) => {
  const status = normalize(getStatus(incident));

  return ["resolved", "closed"].includes(status);
};

const isHighPriority = (incident) => {
  const severity = normalize(getSeverity(incident));

  return ["high", "critical"].includes(severity);
};

// Automatically move the map to actual incident locations.
const MapController = ({ incidents }) => {
  const map = useMap();

  React.useEffect(() => {
    if (!incidents.length) return;

    const coordinates = incidents
      .map((incident) => incident.coordinates)
      .filter(Boolean);

    if (coordinates.length === 1) {
      map.flyTo(coordinates[0], 13, {
        duration: 0.8,
      });
    } else if (coordinates.length > 1) {
      map.fitBounds(coordinates, {
        padding: [35, 35],
        maxZoom: 13,
      });
    }
  }, [incidents, map]);

  return null;
};

const TrafficMap = () => {
  const { theme } = useTheme();

  const {
    reports = [],
    refreshReports,
    reportsLoading,
    reportsError,
  } = useContext(UserContext);

  const isDark = theme === "dark";

  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Only reports already filtered for the logged-in citizen
  // by UserContext are used here.
  const mappedIncidents = useMemo(() => {
    return reports
      .map((incident, index) => ({
        ...incident,
        _mapKey: String(
          incident._id || incident.id || `report-${index}`
        ),
        coordinates: getCoordinates(incident),
      }))
      .filter((incident) => incident.coordinates);
  }, [reports]);

  // Build type filters from actual report data.
  const incidentTypes = useMemo(() => {
    const types = reports
      .map(getIncidentType)
      .filter(Boolean)
      .map(normalize);

    return [...new Set(types)].sort();
  }, [reports]);

  const filteredIncidents = useMemo(() => {
    return mappedIncidents.filter((incident) => {
      const severity = normalize(getSeverity(incident));
      const status = normalize(getStatus(incident));
      const type = normalize(getIncidentType(incident));

      let matchesFilter = true;

      if (filter === "high") {
        matchesFilter = ["high", "critical"].includes(severity);
      } else if (filter === "active") {
        matchesFilter = !isResolved(incident);
      } else if (filter !== "all") {
        matchesFilter = type === filter;
      }

      const searchableText = [
        getIncidentType(incident),
        getAddress(incident),
        incident.description,
        getSeverity(incident),
        getStatus(incident),
        incident._id,
      ]
        .join(" ")
        .toLowerCase();

      return (
        matchesFilter &&
        searchableText.includes(normalize(search))
      );
    });
  }, [mappedIncidents, filter, search]);

  const totalReports = reports.length;
  const mappedCount = mappedIncidents.length;

  const pendingCount = reports.filter((incident) => {
    const status = normalize(getStatus(incident));

    return [
      "reported",
      "pending",
      "acknowledged",
    ].includes(status);
  }).length;

  const inProgressCount = reports.filter((incident) => {
    const status = normalize(getStatus(incident));

    return [
      "responding",
      "in-progress",
      "in_progress",
      "in progress",
    ].includes(status);
  }).length;

  const resolvedCount = reports.filter(isResolved).length;

  const highPriorityCount = reports.filter(
    isHighPriority
  ).length;

  const panelClass = isDark
    ? "bg-[#151B2E] border-[#29304a]"
    : "bg-white border-slate-200";

  const mutedText = isDark
    ? "text-slate-400"
    : "text-slate-500";

  const inputClass = isDark
    ? "bg-[#0B1020] border-[#343b57] text-white placeholder:text-slate-500"
    : "bg-white border-slate-200 text-slate-800 placeholder:text-slate-400";

  const getStatusStyle = (status) => {
    const value = normalize(status);

    if (["resolved", "closed"].includes(value)) {
      return "bg-emerald-500/10 text-emerald-400";
    }

    if (
      [
        "responding",
        "in-progress",
        "in_progress",
        "in progress",
      ].includes(value)
    ) {
      return "bg-cyan-500/10 text-cyan-400";
    }

    return "bg-amber-500/10 text-amber-400";
  };

  const getSeverityStyle = (severity) => {
    const value = normalize(severity);

    if (["high", "critical"].includes(value)) {
      return "bg-red-500/10 text-red-400";
    }

    if (["medium", "moderate"].includes(value)) {
      return "bg-amber-500/10 text-amber-400";
    }

    if (value === "low") {
      return "bg-emerald-500/10 text-emerald-400";
    }

    return "bg-slate-500/10 text-slate-400";
  };

  const handleRefresh = async () => {
    if (typeof refreshReports === "function") {
      await refreshReports();
    }
  };

  return (
    <div
      className={`min-h-[calc(100vh-64px)] p-4 transition-colors duration-300 sm:p-6 lg:p-8 ${
        isDark
          ? "bg-[#0B1020] text-white"
          : "bg-slate-50 text-slate-800"
      }`}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mb-2 text-xs font-semibold tracking-widest text-cyan-400">
              SMARTTRAFFIC / LIVE MONITORING
            </p>

            <h1 className="text-3xl font-bold md:text-4xl">
              Traffic Map
            </h1>

            <p className={`mt-2 text-sm ${mutedText}`}>
              View your reported incidents and their actual locations.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={reportsLoading}
            className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {reportsLoading ? "Refreshing..." : "↻ Refresh Reports"}
          </button>
        </div>

        {/* Fetch error */}
        {reportsError && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {reportsError}
          </div>
        )}

        {/* Dynamic statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "My Reports",
              value: totalReports,
              color: "text-cyan-400",
              icon: "📋",
            },
            {
              label: "Mapped Reports",
              value: mappedCount,
              color: "text-violet-400",
              icon: "📍",
            },
            {
              label: "High Priority",
              value: highPriorityCount,
              color: "text-red-400",
              icon: "⚠️",
            },
            {
              label: "Resolved",
              value: resolvedCount,
              color: "text-emerald-400",
              icon: "✓",
            },
          ].map((item) => (
            <div
              key={item.label}
              className={`rounded-2xl border p-5 ${panelClass}`}
            >
              <div className="flex items-center justify-between">
                <p className={`text-sm ${mutedText}`}>
                  {item.label}
                </p>
                <span className="text-xl">{item.icon}</span>
              </div>

              <p className={`mt-4 text-3xl font-bold ${item.color}`}>
                {reportsLoading && reports.length === 0
                  ? "—"
                  : item.value}
              </p>
            </div>
          ))}
        </div>

        {/* Search and dynamic filters */}
        <div className={`flex flex-col gap-3 rounded-2xl border p-4 lg:flex-row ${panelClass}`}>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by location, type or status..."
            className={`min-w-0 flex-1 rounded-xl border px-4 py-3 text-sm outline-none focus:border-cyan-400 ${inputClass}`}
          />

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className={`rounded-xl border px-4 py-3 text-sm outline-none focus:border-cyan-400 ${inputClass}`}
          >
            <option value="all">All My Reports</option>
            <option value="active">Active Reports</option>
            <option value="high">High Priority</option>

            {incidentTypes.map((type) => (
              <option key={type} value={type}>
                {formatLabel(type)}
              </option>
            ))}
          </select>
        </div>

        {/* Map and report list */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div
            className={`overflow-hidden rounded-2xl border xl:col-span-2 ${panelClass}`}
          >
            <div className={`border-b p-5 ${isDark ? "border-[#29304a]" : "border-slate-200"}`}>
              <h2 className="font-semibold">Incident Locations</h2>
              <p className={`mt-1 text-xs ${mutedText}`}>
                {filteredIncidents.length} matching mapped report(s)
              </p>
            </div>

            <div className="relative h-[420px] sm:h-[560px]">
              <MapContainer
                center={DEFAULT_CENTER}
                zoom={8}
                scrollWheelZoom
                className="h-full w-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapController incidents={filteredIncidents} />

                {filteredIncidents.map((incident) => (
                  <Marker
                    key={incident._mapKey}
                    position={incident.coordinates}
                  >
                    <Popup>
                      <div className="min-w-[190px] space-y-2 text-sm">
                        <h3 className="font-bold">
                          {formatLabel(getIncidentType(incident))}
                        </h3>

                        <p>
                          <strong>Location:</strong>{" "}
                          {getAddress(incident)}
                        </p>

                        <p>
                          <strong>Severity:</strong>{" "}
                          {formatLabel(getSeverity(incident))}
                        </p>

                        <p>
                          <strong>Status:</strong>{" "}
                          {formatLabel(getStatus(incident))}
                        </p>

                        {incident.description && (
                          <p>
                            <strong>Description:</strong>{" "}
                            {incident.description}
                          </p>
                        )}

                        <p className="break-all text-xs text-gray-500">
                          Report ID: {incident._id || incident.id}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>

              {!reportsLoading &&
                !reportsError &&
                filteredIncidents.length === 0 && (
                  <div className="pointer-events-none absolute left-1/2 top-4 z-[1000] w-[90%] max-w-sm -translate-x-1/2 rounded-xl border border-slate-500/30 bg-[#0B1020]/95 p-4 text-center shadow-xl">
                    <p className="font-semibold text-white">
                      No mapped reports found
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {reports.length === 0
                        ? "You have no reports available for this account."
                        : "Your reports may be missing valid coordinates or do not match the selected filter."}
                    </p>
                  </div>
                )}
            </div>
          </div>

          {/* Report list */}
          <div className={`rounded-2xl border p-5 ${panelClass}`}>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">My Incidents</h2>
                <p className={`mt-1 text-xs ${mutedText}`}>
                  {filteredIncidents.length} reports
                </p>
              </div>
              <span className="text-xl">🚦</span>
            </div>

            <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
              {reportsLoading && reports.length === 0 ? (
                <p className={`py-8 text-center text-sm ${mutedText}`}>
                  Loading your reports...
                </p>
              ) : filteredIncidents.length === 0 ? (
                <p className={`py-8 text-center text-sm ${mutedText}`}>
                  No reports to display.
                </p>
              ) : (
                filteredIncidents.map((incident) => (
                  <div
                    key={incident._mapKey}
                    className={`rounded-xl border p-4 transition ${
                      isDark
                        ? "border-[#252d45] bg-[#101629] hover:border-purple-700"
                        : "border-slate-200 bg-slate-50 hover:border-purple-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold">
                          {formatLabel(getIncidentType(incident))}
                        </h3>

                        <p className={`mt-2 break-words text-xs ${mutedText}`}>
                          📍 {getAddress(incident)}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-[10px] ${getStatusStyle(
                          getStatus(incident)
                        )}`}
                      >
                        {formatLabel(getStatus(incident))}
                      </span>
                    </div>

                    {incident.description && (
                      <p className={`mt-3 text-xs leading-relaxed ${mutedText}`}>
                        {incident.description}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] ${getSeverityStyle(
                          getSeverity(incident)
                        )}`}
                      >
                        {formatLabel(getSeverity(incident))}
                      </span>

                      <span className={`text-[10px] ${mutedText}`}>
                        ID: {incident._id || incident.id || "Unavailable"}
                      </span>
                    </div>

                    <p className={`mt-2 text-[10px] ${mutedText}`}>
                      Coordinates:{" "}
                      {incident.coordinates
                        .map((coordinate) => coordinate.toFixed(5))
                        .join(", ")}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Status summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              label: "Pending",
              value: pendingCount,
              color: "text-amber-400",
            },
            {
              label: "In Progress",
              value: inProgressCount,
              color: "text-cyan-400",
            },
            {
              label: "Resolved",
              value: resolvedCount,
              color: "text-emerald-400",
            },
          ].map((item) => (
            <div
              key={item.label}
              className={`rounded-xl border p-5 ${panelClass}`}
            >
              <p className={`text-sm ${mutedText}`}>{item.label}</p>
              <p className={`mt-2 text-2xl font-bold ${item.color}`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <p className={`text-xs ${mutedText}`}>
          Map statistics use your reports loaded through UserContext.
          Reports without valid coordinates appear in My Reports counts
          but do not create map markers.
        </p>
      </div>
    </div>
  );
};

export default TrafficMap;

