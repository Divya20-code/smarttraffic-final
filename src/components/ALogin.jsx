

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ALogin = () => {
  const navigate = useNavigate();

  const [officerId, setOfficerId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!officerId.trim() || !password.trim()) {
      setError("Please enter Officer ID and Password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/authority/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            officerId: officerId.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Invalid Officer ID or password.");
        return;
      }

      localStorage.setItem("authorityUser", JSON.stringify(data.authority));

      if (data.token) {
        localStorage.setItem("authorityToken", data.token);
      }

      navigate("/authority/dashboard", {
        replace: true,
      });
    } catch (err) {
      console.error("Authority login error:", err);

      setError(
        "Unable to connect to server. Please make sure backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-[#12002b] via-[#1b0645] to-[#090018]">
      {/* Main Login Card */}
      <div className="w-full max-w-5xl min-h-[650px] md:h-[90vh] md:min-h-[650px] rounded-3xl overflow-hidden bg-[#151035]/95 border border-purple-500/20 shadow-2xl shadow-purple-900/50 flex">
        {/* LEFT SIDE - AUTHORITY LOGIN */}
        <div className="w-full md:w-1/2 p-7 sm:p-10 lg:p-12 flex flex-col justify-center">
          {/* Logo / Branding */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">
              Smart
              <span className="text-cyan-400">Traffic</span>
            </h1>

            <p className="text-purple-300/70 text-sm mt-2">
              Smart Traffic Incident Reporting System
            </p>
          </div>

          {/* Welcome Section */}
          <div className="mb-7">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/5 mb-4">
              <span className="text-cyan-400">🛡️</span>
              <span className="text-xs font-semibold tracking-wider text-cyan-300">
                AUTHORIZED PERSONNEL
              </span>
            </div>

            <h2 className="text-3xl font-bold text-white">Officer Login</h2>

            <p className="text-purple-200/60 mt-2 text-sm leading-relaxed">
              Welcome back! Sign in to manage and respond to traffic incidents.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin}>
            {/* Officer ID */}
            <div className="mb-5">
              <label
                htmlFor="officerId"
                className="block text-sm text-purple-100 mb-2"
              >
                Officer ID
              </label>

              <input
                id="officerId"
                type="text"
                autoComplete="username"
                value={officerId}
                onChange={(e) => {
                  setOfficerId(e.target.value);
                  setError("");
                }}
                placeholder="Enter your Officer ID"
                className="w-full px-4 py-3 rounded-lg bg-[#0c0820] border border-purple-500/30 text-white placeholder-purple-300/30 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
              />
            </div>

            {/* Password */}
            <div className="mb-5">
              <label
                htmlFor="officerPassword"
                className="block text-sm text-purple-100 mb-2"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="officerPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-16 rounded-lg bg-[#0c0820] border border-purple-500/30 text-white placeholder-purple-300/30 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-cyan-400 hover:text-cyan-300"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div
                role="alert"
                className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
              >
                {error}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-purple-600/30 transition duration-300"
            >
              {loading
                ? "Verifying Credentials..."
                : "Login to Authority Portal"}
            </button>
          </form>

          {/* Back to Citizen Login */}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="w-full mt-4 py-3 rounded-lg font-medium text-cyan-300 border border-cyan-400/30 bg-cyan-400/5 hover:bg-cyan-400/10 hover:border-cyan-400/60 transition duration-300"
          >
            ← Back to Citizen Login
          </button>

          {/* Bottom Text */}
          <div className="flex items-center gap-3 mt-7">
            <div className="h-px bg-purple-500/20 flex-1" />

            <p className="text-xs text-purple-300/50 text-center">
              Report. Respond. Save Lives.
            </p>

            <div className="h-px bg-purple-500/20 flex-1" />
          </div>
        </div>

        {/* RIGHT SIDE - TRAFFIC IMAGE */}
        <div className="hidden md:block w-1/2 relative overflow-hidden">
          <img
            src="https://i.pinimg.com/736x/82/c4/db/82c4db63e73f66a8efe5f1ad67ddee93.jpg"
            alt="SmartTraffic road and traffic"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Image Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-transparent to-[#080019]/80" />

          {/* Purple Glow */}
          <div className="absolute w-72 h-72 bg-purple-600/30 blur-[100px] rounded-full -top-20 -right-20" />

          {/* Image Content */}
          <div className="absolute bottom-10 left-8 lg:left-10 right-8 lg:right-10 text-white">
            <p className="text-cyan-300 text-sm font-semibold tracking-widest mb-3">
              AUTHORITY CONTROL PORTAL
            </p>

            <h2 className="text-3xl lg:text-4xl font-bold leading-tight">
              Every Second
              <br />
              <span className="text-cyan-300">Matters on the Road.</span>
            </h2>

            <p className="text-purple-100/80 text-sm mt-4 max-w-sm leading-relaxed">
              Monitor reported incidents, assess priorities, coordinate
              responses and help make roads safer for everyone.
            </p>

            {/* Feature Highlights */}
            <div className="mt-7 space-y-3">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-400/15 border border-cyan-300/20">
                  🚨
                </span>
                <span className="text-sm text-purple-100">
                  Monitor traffic incidents
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-400/15 border border-cyan-300/20">
                  🤖
                </span>
                <span className="text-sm text-purple-100">
                  AI-assisted incident assessment
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-400/15 border border-cyan-300/20">
                  ✅
                </span>
                <span className="text-sm text-purple-100">
                  Track response and resolution
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ALogin;