import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import UserContext from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";

const API_URL = "http://localhost:5000/api";

const defaultCenter = [30.3398, 76.3869];

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Coordinates se address nikalta hai (fail ho to coordinates hi text banta hai)
const reverseGeocode = async (lat, lon) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
    );
    const data = await response.json();
    return data.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  }
};

// Poore shehar/district ka result sirf area ka center hota hai, exact jagah nahi
const BROAD_TYPES = [
  "city",
  "town",
  "village",
  "county",
  "state_district",
  "district",
  "state",
  "country",
];

const isBroadResult = (result) =>
  result.category === "boundary" || BROAD_TYPES.includes(result.addresstype);

// zoom null ho to user ka current zoom hi rehne do
const MapController = ({ position, zoom }) => {
  const map = useMap();

  useEffect(() => {
    if (position && position.length === 2) {
      map.flyTo(position, zoom ?? map.getZoom(), { duration: 1 });
    }
  }, [position, zoom, map]);

  return null;
};

// Map par click ya pin drag karne par exact point chunta hai
const LocationMarker = ({ position, onPick }) => {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });

  if (!position) return null;

  return (
    <Marker
      position={position}
      icon={markerIcon}
      draggable
      eventHandlers={{
        dragend(event) {
          const point = event.target.getLatLng();
          onPick(point.lat, point.lng);
        },
      }}
    />
  );
};

const ReportIncident = () => {
  const { user, addReport, refreshReports } = useContext(UserContext);
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [type, setType] = useState("accident");
  const [severity, setSeverity] = useState("Medium");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [position, setPosition] = useState(null); // jab tak user na chune, koi pin nahi
  const [mapZoom, setMapZoom] = useState(13);
  const [locationHint, setLocationHint] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const cameraRef = useRef(null);
  const fileInputRef = useRef(null);
  const submittingRef = useRef(false); // double-click / double-submit se bachne ke liye
  const pickRef = useRef(0); // purane address response ko naye pin par likhne se rokta hai
  const suggestTimer = useRef(null); // typing ruke tab hi search chalane ke liye
  const suggestReq = useRef(0); // purane suggestion response ko ignore karne ke liye

  const isDark = theme === "dark";

  const pageStyle = {
    minHeight: "100%",
    padding: "24px",
    color: isDark ? "#f8fafc" : "#0f172a",
    background: isDark ? "#0B1020" : "#e8f9fd",
  };

  const cardStyle = {
    background: isDark ? "#151B2E" : "#ffffff",
    border: `1px solid ${isDark ? "#29324a" : "#dbeafe"}`,
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "20px",
  };

  const inputStyle = {
    width: "100%",
    padding: "12px",
    marginTop: "8px",
    borderRadius: "10px",
    border: `1px solid ${isDark ? "#374151" : "#cbd5e1"}`,
    background: isDark ? "#0B1020" : "#ffffff",
    color: isDark ? "#ffffff" : "#0f172a",
    outline: "none",
  };

  const buttonStyle = {
    padding: "11px 16px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    fontWeight: "600",
  };

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }

      if (cameraRef.current?.srcObject) {
        cameraRef.current.srcObject
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, [imagePreview]);

  useEffect(() => {
    return () => clearTimeout(suggestTimer.current);
  }, []);

  // Exact point chunna (map click, pin drag, GPS sab yahin se)
  const pickPoint = async (lat, lon) => {
    const pickId = ++pickRef.current;

    setPosition([lat, lon]);
    setMapZoom(null);
    setLocationHint("");
    setShowSuggestions(false);
    setLocation(`${lat.toFixed(5)}, ${lon.toFixed(5)}`);

    const address = await reverseGeocode(lat, lon);

    if (pickId !== pickRef.current) return;

    setLocation(address);
    setLocationSearch(address);
  };

  // Search result ya suggestion chunne par map us jagah le jaata hai
  const applyResult = (result) => {
    const lat = Number(result.lat);
    const lon = Number(result.lon);
    const broad = isBroadResult(result);

    pickRef.current += 1;
    suggestReq.current += 1; // koi purana suggestion response ab dropdown na khole
    clearTimeout(suggestTimer.current);

    setPosition([lat, lon]);
    setMapZoom(broad ? 13 : 17);
    setLocation(result.display_name);
    setLocationSearch(result.display_name);
    setSuggestions([]);
    setShowSuggestions(false);
    setLocationHint(
      broad
        ? "This is the center of a large area, not an exact spot. Click on the map or drag the pin to mark the exact location."
        : ""
    );
  };

  // Type karte hi suggestions laata hai
  const fetchSuggestions = async (query) => {
    const requestId = ++suggestReq.current;

    setSuggestLoading(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&countrycodes=in&q=${encodeURIComponent(
          query
        )}`
      );

      const results = await response.json();

      if (requestId !== suggestReq.current) return;

      setSuggestions(Array.isArray(results) ? results : []);
      setShowSuggestions(true);
    } catch {
      if (requestId === suggestReq.current) setSuggestions([]);
    } finally {
      if (requestId === suggestReq.current) setSuggestLoading(false);
    }
  };

  // Har key par nahi, typing rukne ke 500 ms baad search chalta hai
  const handleSearchInput = (value) => {
    setLocationSearch(value);
    clearTimeout(suggestTimer.current);

    if (value.trim().length < 3) {
      suggestReq.current += 1;
      setSuggestions([]);
      setShowSuggestions(false);
      setSuggestLoading(false);
      return;
    }

    suggestTimer.current = setTimeout(
      () => fetchSuggestions(value.trim()),
      500
    );
  };

  const getCurrentLocation = () => {
    setError("");
    setMessage("");

    if (!navigator.geolocation) {
      setError("Your browser does not support location.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (result) => {
        const { latitude, longitude, accuracy } = result.coords;

        pickPoint(latitude, longitude);
        setMapZoom(17);

        if (accuracy > 100) {
          setLocationHint(
            `GPS accuracy is low (about ${Math.round(
              accuracy
            )} m). Drag the pin to the exact spot.`
          );
        }
      },
      () => {
        setError(
          "Unable to get your location. Allow location permission or select a point on the map."
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Search button ya Enter: pehla best match le leta hai
  const searchLocation = async (event) => {
    event?.preventDefault?.();

    if (!locationSearch.trim()) {
      setError("Please enter a location to search.");
      return;
    }

    setSearchingLocation(true);
    setError("");

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=1&countrycodes=in&q=${encodeURIComponent(
          locationSearch
        )}`
      );

      const results = await response.json();

      if (!results.length) {
        setError("Location not found. Try another search.");
        return;
      }

      applyResult(results[0]);
    } catch {
      setError("Could not search for this location. Please try again.");
    } finally {
      setSearchingLocation(false);
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image.");
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setError("Image must be smaller than 4 MB.");
      event.target.value = "";
      return;
    }

    setError("");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setAiAnalysis(null);
    setAiError("");
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      if (cameraRef.current) {
        cameraRef.current.srcObject = stream;
        await cameraRef.current.play();
      }
    } catch {
      setError("Camera permission denied or camera unavailable.");
    }
  };

  const capturePhoto = () => {
    const video = cameraRef.current;

    if (!video || !video.videoWidth) {
      setError("Camera is not ready yet.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Could not capture image.");
          return;
        }

        const file = new File([blob], "incident-photo.jpg", {
          type: "image/jpeg",
        });

        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        setAiAnalysis(null);
        setAiError("");

        if (video.srcObject) {
          video.srcObject.getTracks().forEach((track) => track.stop());
          video.srcObject = null;
        }
      },
      "image/jpeg",
      0.8
    );
  };

  const convertImageToBase64 = (file) =>
    new Promise((resolve, reject) => {
      if (!file) {
        resolve("");
        return;
      }

      const reader = new FileReader();

      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Could not read image."));

      reader.readAsDataURL(file);
    });

  const getCitizenDetails = () => {
    const currentUser =
      user ||
      JSON.parse(localStorage.getItem("smartTrafficCurrentUser") || "null") ||
      {};

    return {
      userId: String(
        currentUser.userId || currentUser._id || currentUser.id || ""
      ).trim(),
      name: String(
        currentUser.fullName || currentUser.name || "Citizen"
      ).trim(),
      username: String(currentUser.username || "")
        .trim()
        .toLowerCase(),
      email: String(currentUser.email || "")
        .trim()
        .toLowerCase(),
    };
  };

  // "Analyze with AI": sirf analysis, database me save NAHI hota
  const analyzeIncident = async () => {
    if (!description.trim()) {
      setError("Please describe the incident first.");
      return;
    }

    if (aiLoading) return;

    setAiLoading(true);
    setAiError("");
    setAiAnalysis(null);
    setError("");

    try {
      const citizen = getCitizenDetails();

      const response = await fetch(`${API_URL}/analyze-incident`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          previewOnly: true,
          citizen,
          location: location || "Location not provided",
          description: description.trim(),
          type,
          severity,
          lat: position?.[0],
          lon: position?.[1],
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "AI analysis failed.");
      }

      setAiAnalysis(data.analysis);
      setMessage("AI analysis completed. You can now submit your report.");
    } catch (err) {
      setAiError(err.message || "AI analysis failed.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Pehle se submit chal raha ho to dobara mat bhejo
    if (submittingRef.current) return;

    setError("");
    setMessage("");

    if (!description.trim()) {
      setError("Please enter incident details.");
      return;
    }

    if (!position || !location.trim()) {
      setError(
        "Please mark the incident location on the map (search and pick a suggestion, click on the map, or use your current location)."
      );
      return;
    }

    const citizen = getCitizenDetails();

    if (!citizen.userId && !citizen.email && !citizen.username) {
      setError(
        "Please log in again so your report can be linked to your account."
      );
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);

    try {
      const imageData = await convertImageToBase64(imageFile);

      const response = await fetch(`${API_URL}/analyze-incident`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          citizen,
          location,
          description: description.trim(),
          type,
          severity,
          lat: position[0],
          lon: position[1],
          image: imageData,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not save incident.");
      }

      // Backend ne duplicate pakda: pehli copy pehle hi save ho chuki hai
      if (data.duplicate) {
        setMessage("This report was already submitted.");
      } else {
        if (!data.incident?._id) {
          throw new Error("Could not save incident.");
        }

        if (typeof addReport === "function") {
          addReport(data.incident);
        }

        setMessage("Incident reported successfully and saved to the database.");
      }

      if (typeof refreshReports === "function") {
        await refreshReports();
      }

      setDescription("");
      setType("accident");
      setSeverity("Medium");
      setImageFile(null);
      setImagePreview("");
      setAiAnalysis(null);
      setAiError("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(err.message || "Could not save incident. Please try again.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "800", margin: 0 }}>
            Report Traffic Incident
          </h1>
          <p style={{ opacity: 0.75, marginTop: "8px" }}>
            Report an incident so the relevant authority can review it.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              ...cardStyle,
              borderColor: "#ef4444",
              color: "#ef4444",
            }}
          >
            {error}
          </div>
        )}

        {message && (
          <div
            role="status"
            style={{
              ...cardStyle,
              borderColor: "#22c55e",
              color: isDark ? "#86efac" : "#15803d",
            }}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={cardStyle}>
            <h2 style={{ fontSize: "19px", fontWeight: "700", marginTop: 0 }}>
              Incident Details
            </h2>

            <label>
              Incident Type
              <select
                value={type}
                onChange={(event) => setType(event.target.value)}
                style={inputStyle}
              >
                <option value="accident">Accident</option>
                <option value="road-block">Road Block</option>
                <option value="congestion">Traffic Congestion</option>
                <option value="vehicle-breakdown">Vehicle Breakdown</option>
                <option value="other">Other</option>
              </select>
            </label>

            <label style={{ display: "block", marginTop: "18px" }}>
              Reported Severity
              <select
                value={severity}
                onChange={(event) => setSeverity(event.target.value)}
                style={inputStyle}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </label>

            <label style={{ display: "block", marginTop: "18px" }}>
              Incident Description
              <textarea
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value);
                  setAiAnalysis(null);
                }}
                placeholder="Describe what happened, vehicles involved, road blockage, or any danger..."
                rows={5}
                required
                style={{
                  ...inputStyle,
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
            </label>

            <button
              type="button"
              onClick={analyzeIncident}
              disabled={aiLoading}
              style={{
                ...buttonStyle,
                marginTop: "14px",
                background: "#7c3aed",
                color: "#ffffff",
                opacity: aiLoading ? 0.7 : 1,
              }}
            >
              {aiLoading ? "Analyzing..." : "Analyze with AI"}
            </button>

            {aiError && (
              <p style={{ color: "#ef4444", marginTop: "12px" }}>{aiError}</p>
            )}

            {aiAnalysis && (
              <div
                style={{
                  marginTop: "18px",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid #7c3aed",
                }}
              >
                <h3 style={{ marginTop: 0 }}>AI Assessment</h3>
                <p>
                  <strong>Incident:</strong> {aiAnalysis.incidentType || type}
                </p>
                <p>
                  <strong>Suggested Severity:</strong>{" "}
                  {aiAnalysis.severity || severity}
                </p>
                <p>
                  <strong>Summary:</strong>{" "}
                  {aiAnalysis.summary || "No summary available."}
                </p>
                <p>
                  <strong>Recommendation:</strong>{" "}
                  {aiAnalysis.recommendation ||
                    "Authority verification required."}
                </p>

                {Array.isArray(aiAnalysis.riskIndicators) &&
                  aiAnalysis.riskIndicators.length > 0 && (
                    <div>
                      <strong>Risk Indicators:</strong>
                      <ul>
                        {aiAnalysis.riskIndicators.map((risk, index) => (
                          <li key={`${risk}-${index}`}>{risk}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                <p style={{ fontSize: "12px", opacity: 0.7 }}>
                  AI assessment is advisory only. The authority must verify the
                  incident.
                </p>
              </div>
            )}
          </div>

          <div style={cardStyle}>
            <h2 style={{ fontSize: "19px", fontWeight: "700", marginTop: 0 }}>
              Incident Location
            </h2>

            <div style={{ display: "flex", gap: "8px" }}>
              {/* Search box + suggestions dropdown */}
              <div style={{ position: "relative", flex: 1 }}>
                <input
                  value={locationSearch}
                  onChange={(event) => handleSearchInput(event.target.value)}
                  onFocus={() => {
                    if (suggestions.length) setShowSuggestions(true);
                  }}
                  onBlur={() =>
                    setTimeout(() => setShowSuggestions(false), 150)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault(); // bahar wala form submit na ho
                      searchLocation(event);
                    }

                    if (event.key === "Escape") {
                      setShowSuggestions(false);
                    }
                  }}
                  placeholder="Search a place, e.g. Patiala Bus Stand"
                  autoComplete="off"
                  style={{ ...inputStyle, marginTop: 0 }}
                />

                {showSuggestions && (
                  <ul
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      zIndex: 2000,
                      margin: "6px 0 0",
                      padding: 0,
                      listStyle: "none",
                      maxHeight: "300px",
                      overflowY: "auto",
                      borderRadius: "12px",
                      background: isDark ? "#151B2E" : "#ffffff",
                      border: `1px solid ${isDark ? "#374151" : "#cbd5e1"}`,
                      boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
                    }}
                  >
                    {suggestLoading && suggestions.length === 0 && (
                      <li style={{ padding: "12px 14px", opacity: 0.7 }}>
                        Searching...
                      </li>
                    )}

                    {!suggestLoading && suggestions.length === 0 && (
                      <li style={{ padding: "12px 14px", opacity: 0.7 }}>
                        No places found. Try a different spelling.
                      </li>
                    )}

                    {suggestions.map((item) => {
                      const parts = String(item.display_name || "").split(",");
                      const title = (item.name || parts[0] || "").trim();
                      const subtitle = parts.slice(1).join(",").trim();

                      return (
                        <li
                          key={item.place_id}
                          // onMouseDown: input ka blur hone se pehle click pakad leta hai
                          onMouseDown={(event) => {
                            event.preventDefault();
                            applyResult(item);
                          }}
                          style={{
                            display: "flex",
                            gap: "10px",
                            alignItems: "flex-start",
                            padding: "10px 14px",
                            cursor: "pointer",
                            borderBottom: `1px solid ${
                              isDark ? "#29324a" : "#e2e8f0"
                            }`,
                          }}
                          onMouseEnter={(event) => {
                            event.currentTarget.style.background = isDark
                              ? "#1f2a44"
                              : "#f1f5f9";
                          }}
                          onMouseLeave={(event) => {
                            event.currentTarget.style.background =
                              "transparent";
                          }}
                        >
                          <span aria-hidden="true">📍</span>

                          <span style={{ minWidth: 0 }}>
                            <span
                              style={{
                                display: "block",
                                fontWeight: "600",
                                overflowWrap: "anywhere",
                              }}
                            >
                              {title || item.display_name}
                            </span>

                            {subtitle && (
                              <span
                                style={{
                                  display: "block",
                                  fontSize: "12px",
                                  opacity: 0.7,
                                  overflowWrap: "anywhere",
                                }}
                              >
                                {subtitle}
                              </span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <button
                type="button"
                onClick={searchLocation}
                disabled={searchingLocation}
                style={{
                  ...buttonStyle,
                  background: "#2563eb",
                  color: "#ffffff",
                }}
              >
                {searchingLocation ? "Searching..." : "Search"}
              </button>
            </div>

            <button
              type="button"
              onClick={getCurrentLocation}
              style={{
                ...buttonStyle,
                background: "#0891b2",
                color: "#ffffff",
                marginTop: "12px",
              }}
            >
              Use My Current Location
            </button>

            <p style={{ fontSize: "13px", opacity: 0.75, marginTop: "12px" }}>
              Type a place and pick a suggestion. For the exact spot, click on
              the map or drag the pin.
            </p>

            {locationHint && (
              <div
                role="status"
                style={{
                  marginTop: "10px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid #eab308",
                  color: isDark ? "#fde047" : "#854d0e",
                  fontSize: "13px",
                }}
              >
                {locationHint}
              </div>
            )}

            <div
              style={{
                height: "350px",
                borderRadius: "12px",
                overflow: "hidden",
                marginTop: "14px",
              }}
            >
              <MapContainer
                center={position || defaultCenter}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapController position={position} zoom={mapZoom} />
                <LocationMarker position={position} onPick={pickPoint} />
              </MapContainer>
            </div>

            <p style={{ marginTop: "12px", overflowWrap: "anywhere" }}>
              <strong>Selected Location:</strong>{" "}
              {location || "Please search or select a location on the map."}
            </p>

            {position && (
              <p style={{ fontSize: "13px", opacity: 0.75, marginTop: "4px" }}>
                Coordinates: {position[0].toFixed(5)}, {position[1].toFixed(5)}
              </p>
            )}
          </div>

          <div style={cardStyle}>
            <h2 style={{ fontSize: "19px", fontWeight: "700", marginTop: 0 }}>
              Incident Photo
            </h2>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={inputStyle}
            />

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                marginTop: "14px",
              }}
            >
              <button
                type="button"
                onClick={startCamera}
                style={{
                  ...buttonStyle,
                  background: "#334155",
                  color: "#ffffff",
                }}
              >
                Open Camera
              </button>

              <button
                type="button"
                onClick={capturePhoto}
                style={{
                  ...buttonStyle,
                  background: "#334155",
                  color: "#ffffff",
                }}
              >
                Capture Photo
              </button>
            </div>

            <video
              ref={cameraRef}
              playsInline
              muted
              style={{
                display: "block",
                width: "100%",
                maxHeight: "300px",
                marginTop: "14px",
                borderRadius: "12px",
                background: "#000000",
              }}
            />

            {imagePreview && (
              <div style={{ marginTop: "16px" }}>
                <p>
                  <strong>Selected Photo Preview</strong>
                </p>
                <img
                  src={imagePreview}
                  alt="Incident preview"
                  style={{
                    width: "100%",
                    maxWidth: "500px",
                    maxHeight: "320px",
                    objectFit: "contain",
                    borderRadius: "12px",
                  }}
                />

                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview("");
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  style={{
                    ...buttonStyle,
                    display: "block",
                    marginTop: "10px",
                    background: "#dc2626",
                    color: "#ffffff",
                  }}
                >
                  Remove Photo
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              ...buttonStyle,
              width: "100%",
              padding: "15px",
              background: submitting ? "#64748b" : "#7c3aed",
              color: "#ffffff",
              fontSize: "16px",
              marginBottom: "30px",
            }}
          >
            {submitting ? "Saving Incident..." : "Submit Incident Report"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReportIncident;