


import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

import L from "leaflet";

// ==================================================
// LEAFLET MARKER FIX
// ==================================================

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",

  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",

  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// ==================================================
// COMPONENT
// ==================================================

const AdminMap = () => {
  const [incidents, setIncidents] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // Punjab as default center
  const defaultPosition = [30.3398, 76.3869];

  // ==================================================
  // FETCH INCIDENTS
  // ==================================================

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/incidents"
      );

      const data = await response.json();

      console.log("Admin Map Incidents:", data);

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to fetch incidents."
        );
      }

      const incidentList = Array.isArray(data)
        ? data
        : data.incidents || [];

      // Only incidents having valid coordinates
      const mappedIncidents = incidentList.filter(
        (incident) => {
          const lat =
            incident.location?.latitude;

          const lon =
            incident.location?.longitude;

          return (
            typeof lat === "number" &&
            typeof lon === "number"
          );
        }
      );

      setIncidents(mappedIncidents);
    } catch (error) {
      console.error(
        "Admin Map Error:",
        error
      );

      setError(
        "Unable to load map data. Make sure backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // SEVERITY
  // ==================================================

  const getSeverity = (incident) => {
    return (
      incident.aiAssessment?.severity ||
      incident.severity ||
      "Unknown"
    );
  };

  // ==================================================
  // INCIDENT TYPE
  // ==================================================

  const getType = (incident) => {
    return (
      incident.aiAssessment?.incidentType ||
      incident.incidentType ||
      "Unknown"
    );
  };

  // ==================================================
  // SEVERITY BADGE
  // ==================================================

  const getSeverityClass = (severity) => {
    const value =
      String(severity || "").toLowerCase();

    if (value === "critical") {
      return "bg-red-500/20 text-red-400";
    }

    if (value === "high") {
      return "bg-orange-500/20 text-orange-400";
    }

    if (value === "medium") {
      return "bg-yellow-500/20 text-yellow-400";
    }

    return "bg-green-500/20 text-green-400";
  };

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">
            🗺️
          </div>

          <p className="text-slate-300">
            Loading traffic map...
          </p>
        </div>
      </div>
    );
  }

  // ==================================================
  // UI
  // ==================================================

  return (
    <div>
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <p className="text-purple-400 text-sm font-medium mb-2">
            TRAFFIC MONITORING
          </p>

          <h1 className="text-3xl md:text-4xl font-bold">
            Overall Traffic Map
          </h1>

          <p className="text-slate-400 mt-2">
            Monitor reported traffic incidents across
            their geographical locations.
          </p>
        </div>

        <button
          onClick={fetchIncidents}
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
          🔄 Refresh Map
        </button>
      </div>

      {/* ==================================================
          ERROR
      ================================================== */}

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* ==================================================
          MAP INFO
      ================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-slate-400 text-sm">
            Incidents on Map
          </p>

          <p className="text-3xl font-bold mt-2">
            {incidents.length}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-slate-400 text-sm">
            High / Critical
          </p>

          <p className="text-3xl font-bold mt-2 text-red-400">
            {
              incidents.filter((incident) => {
                const severity =
                  getSeverity(incident).toLowerCase();

                return (
                  severity === "high" ||
                  severity === "critical"
                );
              }).length
            }
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-slate-400 text-sm">
            Resolved
          </p>

          <p className="text-3xl font-bold mt-2 text-green-400">
            {
              incidents.filter(
                (incident) =>
                  String(
                    incident.status || ""
                  ).toLowerCase() === "resolved"
              ).length
            }
          </p>
        </div>
      </div>

      {/* ==================================================
          MAP
      ================================================== */}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="h-[600px]">
          <MapContainer
            center={defaultPosition}
            zoom={7}
            scrollWheelZoom={true}
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {incidents.map((incident) => {
              const latitude =
                incident.location.latitude;

              const longitude =
                incident.location.longitude;

              const severity =
                getSeverity(incident);

              const type =
                getType(incident);

              const status =
                incident.status || "reported";

              const location =
                incident.location?.address ||
                "Location unavailable";

              const citizen =
                incident.citizen?.name ||
                "Citizen";

              return (
                <Marker
                  key={incident._id}
                  position={[
                    latitude,
                    longitude,
                  ]}
                >
                  <Popup>
                    <div className="min-w-[220px] text-slate-900">
                      <h3 className="font-bold text-base mb-2">
                        🚨 Traffic Incident
                      </h3>

                      <p className="text-sm mb-1">
                        <strong>Type:</strong>{" "}
                        {type}
                      </p>

                      <p className="text-sm mb-1">
                        <strong>Severity:</strong>{" "}
                        <span
                          className={`px-2 py-0.5 rounded ${getSeverityClass(
                            severity
                          )}`}
                        >
                          {severity}
                        </span>
                      </p>

                      <p className="text-sm mb-1">
                        <strong>Status:</strong>{" "}
                        {status}
                      </p>

                      <p className="text-sm mb-1">
                        <strong>Citizen:</strong>{" "}
                        {citizen}
                      </p>

                      <p className="text-sm mt-2">
                        📍 {location}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>

      {/* ==================================================
          NO COORDINATES MESSAGE
      ================================================== */}

      {incidents.length === 0 && (
        <div className="mt-5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-xl px-5 py-4">
          No incidents with valid geographical
          coordinates are currently available on the
          map.
        </div>
      )}

      {/* ==================================================
          LEGEND
      ================================================== */}

      <div className="mt-5 bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h2 className="font-semibold mb-4">
          Map Information
        </h2>

        <div className="flex flex-wrap gap-5 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-slate-300">
              Low
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            <span className="text-slate-300">
              Medium
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500"></span>
            <span className="text-slate-300">
              High
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="text-slate-300">
              Critical
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMap;