


import React, { useState } from "react";

const AdminLogin = () => {
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    if (!adminId.trim() || !password.trim()) {
      setError("Please enter Admin ID and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("http://localhost:5000/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminId: adminId.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Admin login failed.");
        return;
      }

      // Save admin login
      localStorage.setItem("adminUser", JSON.stringify(data.admin));

      if (data.token) {
        localStorage.setItem("adminToken", data.token);
      }

      // Direct admin dashboard
      window.location.href = "/admin/dashboard";
    } catch (error) {
      console.error("Admin Login Error:", error);

      setError("Unable to connect to backend. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">👑</div>

          <h1 className="text-3xl font-bold text-white">SmartTraffic</h1>

          <p className="text-cyan-400 mt-2">Admin Control Center</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-7 shadow-2xl">
          <h2 className="text-2xl font-semibold text-white mb-2">
            Admin Login
          </h2>

          <p className="text-slate-400 text-sm mb-6">
            Login to supervise and manage the SmartTraffic system.
          </p>

          {error && (
            <div className="mb-5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Admin ID
              </label>

              <input
                type="text"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                placeholder="Enter Admin ID"
                autoComplete="username"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-cyan-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl transition"
            >
              {loading ? "Logging in..." : "Login as Admin"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;