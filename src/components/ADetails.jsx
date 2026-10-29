import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_URL = "http://localhost:5000/api";

// Backend status -> UI status
const toUiStatus = (backendStatus) => {
  const value = String(backendStatus || "reported").toLowerCase();

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

const statusBadgeClass = (status) => {
  if (status === "Acknowledged") {
    return "bg-cyan-500/10 border-cyan-500/30 text-cyan-400";
  }
  if (status === "Responding") {
    return "bg-blue-500/10 border-blue-500/30 text-blue-400";
  }
  if (status === "Resolved") {
    return "bg-green-500/10 border-green-500/30 text-green-400";
  }
  return "bg-orange-500/10 border-orange-500/30 text-orange-400";
};

const ADetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [incident, setIncident] = useState(null);
  const [status, setStatus] = useState("Pending");
  const [resolutionNote, setResolutionNote] = useState("");

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // Fetch Single Incident
  // ==========================================

  useEffect(() => {
    const fetchIncident = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/incidents/${id}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to fetch incident.");
        }

        setIncident(data.incident);
        setStatus(toUiStatus(data.incident.status));
        setResolutionNote(data.incident.resolutionNote || "");
      } catch (err) {
        console.error("Fetch incident details error:", err);

        setError(err.message || "Unable to load incident details.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchIncident();
    }
  }, [id]);

  // ==========================================
  // Format Helpers
  // ==========================================

  const formatType = (type) => {
    if (!type) return "Other";

    return type
      .replace(/-/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const formatDate = (date) => {
    if (!date) return "Unknown";

    const formattedDate = new Date(date);

    if (Number.isNaN(formattedDate.getTime())) {
      return "Unknown";
    }

    return formattedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ==========================================
  // Authority Actions (database mein save hote hain)
  // ==========================================

  const updateStatus = async (newStatus) => {
    setActionError("");
    setSuccess("");

    if (newStatus === "resolved" && !resolutionNote.trim()) {
      setActionError("Please enter a resolution note first.");
      return;
    }

    try {
      setUpdating(true);

      const body = { status: newStatus };

      if (newStatus === "resolved") {
        body.resolutionNote = resolutionNote.trim();
      }

      const response = await fetch(`${API_URL}/incidents/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not update status.");
      }

      setIncident(data.incident);
      setStatus(toUiStatus(data.incident.status));
      setSuccess(
        `Status updated to ${toUiStatus(data.incident.status)}. Citizen ko ab ye status dikhega.`
      );
    } catch (err) {
      console.error("Update status error:", err);

      if (err instanceof TypeError) {
        setActionError(
          "Cannot connect to the server. Please make sure the backend is running."
        );
      } else {
        setActionError(err.message || "Could not update status.");
      }
    } finally {
      setUpdating(false);
    }
  };

  const isResolved = status === "Resolved";

  // ==========================================
  // Loading
  // ==========================================

  if (loading) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate("/authority/incidents")}
          className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold"
        >
          ← Back to Incidents
        </button>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
          <div className="text-5xl mb-3">🚦</div>

          <h2 className="text-xl font-bold">Loading Incident...</h2>

          <p className="text-slate-400 mt-2">
            Fetching incident details from MongoDB.
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // Error
  // ==========================================

  if (error || !incident) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate("/authority/incidents")}
          className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold"
        >
          ← Back to Incidents
        </button>

        <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-10 text-center">
          <div className="text-5xl mb-3">⚠️</div>

          <h2 className="text-xl font-bold text-red-400">
            Incident Not Found
          </h2>

          <p className="text-slate-400 mt-2">
            {error || "The requested incident could not be found."}
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // Real Incident Data
  // ==========================================

  const incidentId = incident._id;
  const incidentType = formatType(incident.incidentType);

  const severity = incident.severity
    ? incident.severity.charAt(0).toUpperCase() +
      incident.severity.slice(1).toLowerCase()
    : "Medium";

  const location = incident.location?.address || "Location not available";
  const citizenName = incident.citizen?.name || "Citizen";
  const description = incident.description || "No description provided.";
  const image = incident.image || "";
  const aiAssessment = incident.aiAssessment || {};

  return (
    <div className="space-y-6">
      {/* BACK */}
      <button
        onClick={() => navigate("/authority/incidents")}
        className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold"
      >
        ← Back to Incidents
      </button>

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
        <div>
          <p className="text-cyan-400 text-sm font-medium">
            Incident Details
          </p>

          <h1 className="text-3xl font-bold mt-1">{incidentId}</h1>

          <p className="text-slate-400 mt-2">
            Reported on {formatDate(incident.createdAt)}
          </p>
        </div>

        <div
          className={`px-4 py-2 rounded-xl border font-semibold ${statusBadgeClass(
            status
          )}`}
        >
          {status}
        </div>
      </div>

      {/* MESSAGES */}
      {actionError && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
        >
          {actionError}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-300"
        >
          {success}
        </div>
      )}

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="xl:col-span-2 space-y-6">
          {/* INCIDENT INFORMATION */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-5">Incident Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <p className="text-xs text-slate-500">Incident Type</p>
                <p className="font-semibold mt-1">{incidentType}</p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Severity</p>
                <p className="font-semibold mt-1 text-red-400">{severity}</p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Location</p>
                <p className="font-semibold mt-1">📍 {location}</p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Reported By</p>
                <p className="font-semibold mt-1">{citizenName}</p>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs text-slate-500">Description</p>

              <p className="text-slate-300 mt-2 leading-7">{description}</p>
            </div>
          </div>

          {/* IMAGE */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-5">Incident Evidence</h2>

            {image ? (
              <img
                src={image}
                alt="Incident"
                className="w-full max-h-[450px] object-contain rounded-xl bg-slate-800"
              />
            ) : (
              <div className="h-64 rounded-xl bg-slate-800 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl mb-3">📷</div>

                  <p className="text-slate-400">No incident image available</p>
                </div>
              </div>
            )}
          </div>

          {/* AI ASSESSMENT */}
          <div className="bg-slate-900 border border-cyan-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-3xl">🤖</div>

              <div>
                <h2 className="text-xl font-bold">AI Assessment</h2>

                <p className="text-sm text-slate-400">
                  AI-generated analysis of the incident
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-500">AI Incident Type</p>

                <p className="font-semibold mt-2">
                  {formatType(aiAssessment.incidentType)}
                </p>
              </div>

              <div className="bg-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-500">AI Severity</p>

                <p className="font-semibold mt-2 text-yellow-400">
                  {aiAssessment.severity || "Not available"}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-sm font-semibold mb-3">Risk Indicators</p>

              <div className="flex flex-wrap gap-2">
                {aiAssessment.riskIndicators?.length > 0 ? (
                  aiAssessment.riskIndicators.map((risk, index) => (
                    <span
                      key={`${risk}-${index}`}
                      className="px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                    >
                      {risk}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 text-sm">
                    No risk indicators available.
                  </span>
                )}
              </div>
            </div>

            <div className="mt-5">
              <p className="text-sm font-semibold">AI Summary</p>

              <p className="text-slate-400 mt-2 leading-6">
                {aiAssessment.summary || "No AI summary available."}
              </p>
            </div>

            <div className="mt-5">
              <p className="text-sm font-semibold">Recommended Response</p>

              <p className="text-slate-400 mt-2 leading-6">
                {aiAssessment.recommendation ||
                  "No recommendation available."}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          {/* ACTION PANEL */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-5">Authority Actions</h2>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => updateStatus("acknowledged")}
                disabled={updating || isResolved || status === "Acknowledged"}
                className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? "Updating..." : "✓ Acknowledge Incident"}
              </button>

              <button
                type="button"
                onClick={() => updateStatus("responding")}
                disabled={updating || isResolved || status === "Responding"}
                className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? "Updating..." : "🚔 Mark as Responding"}
              </button>
            </div>
          </div>

          {/* RESOLUTION */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-2">Resolve Incident</h2>

            <p className="text-sm text-slate-400 mb-5">
              Add a note describing the action taken.
            </p>

            <textarea
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              disabled={isResolved}
              rows="5"
              placeholder="Enter resolution note..."
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white resize-none outline-none focus:border-cyan-500 disabled:opacity-60"
            />

            <button
              type="button"
              onClick={() => updateStatus("resolved")}
              disabled={updating || isResolved}
              className="w-full mt-3 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-slate-950 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResolved ? "✓ Already Resolved" : "✓ Resolve Incident"}
            </button>
          </div>

          {/* LOCATION */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4">Incident Location</h2>

            <div className="h-48 rounded-xl bg-slate-800 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">📍</div>

                <p className="text-sm text-slate-400">{location}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ADetails;