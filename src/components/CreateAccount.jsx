


import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const CreateAccount = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (
      !fullName.trim() ||
      !username.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError("Please fill all the required fields.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!terms) {
      setError("Please accept the Terms & Conditions.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fullName: fullName.trim(),
            username: username.trim(),
            email: email.trim().toLowerCase(),
            password,
          }),
        }
      );

      let data;
      const responseText = await response.text();

      try {
        data = JSON.parse(responseText);
      } catch {
        console.error("Server returned non-JSON response:", responseText);

        throw new Error(
          `Backend route not found or returned HTML (HTTP ${response.status}). Check that the correct server.js is running on port 5000.`
        );
      }

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message || data.error || "Account creation failed."
        );
      }

      // Account ban gaya: login page pe bhej do
      navigate("/login");
    } catch (err) {
      if (err instanceof TypeError) {
        setError(
          "Cannot connect to the server. Please make sure the backend is running."
        );
      } else {
        setError(err.message || "Unable to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="
      min-h-screen
      flex items-center justify-center
      p-6
      bg-gradient-to-br
      from-[#12002b]
      via-[#1b0645]
      to-[#090018]
      "
    >
      <div
        className="
        w-full max-w-4xl h-[99vh] min-h-0
        rounded-3xl
        overflow-hidden
        bg-[#151035]/95
        border border-purple-500/20
        shadow-2xl shadow-purple-900/50
        flex
        "
      >
        <div className="w-full md:w-1/2 px-4 pt-6 pb-8 md:px-5 md:pt-5 md:pb-8 flex flex-col justify-center">
          <div className="mb-7">
            <h1 className="text-3xl font-bold text-white">
              Smart <span className="text-cyan-400">Traffic</span>
            </h1>

            <p className="text-purple-300/70 text-sm mt-2">
              Smart Traffic Incident Reporting System
            </p>
          </div>

          <div className="mb-6">
            <h2 className="text-3xl font-bold text-white">
              Create Account 🚦
            </h2>

            <p className="text-purple-200/60 mt-2 text-sm">
              Create your SmartTraffic account to get started.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm text-purple-100 mb-2">
                Full Name
              </label>

              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 rounded-lg bg-[#0c0820] border border-purple-500/30 text-white placeholder-purple-300/30 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm text-purple-100 mb-2">
                Username
              </label>

              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                className="w-full px-4 py-3 rounded-lg bg-[#0c0820] border border-purple-500/30 text-white placeholder-purple-300/30 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm text-purple-100 mb-2">
                Email Address
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-lg bg-[#0c0820] border border-purple-500/30 text-white placeholder-purple-300/30 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm text-purple-100 mb-2">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                className="w-full px-4 py-3 rounded-lg bg-[#0c0820] border border-purple-500/30 text-white placeholder-purple-300/30 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm text-purple-100 mb-2">
                Confirm Password
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full px-4 py-3 rounded-lg bg-[#0c0820] border border-purple-500/30 text-white placeholder-purple-300/30 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
              />
            </div>

            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                className="accent-cyan-400"
              />

              <label className="text-sm text-purple-200/70">
                I agree to the Terms & Conditions
              </label>
            </div>

            {error && (
              <p className="text-red-400 text-sm mb-4">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 shadow-lg shadow-purple-600/30 transition duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-purple-200/60 mt-6">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-cyan-400 hover:text-cyan-300 font-medium"
            >
              Login
            </button>
          </p>
        </div>

        <div className="hidden md:block w-1/2 relative overflow-hidden">
          <img
            src="https://i.pinimg.com/736x/82/c4/db/82c4db63e73f66a8efe5f1ad67ddee93.jpg"
            alt="Traffic"
            className="absolute inset-0 w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-transparent to-[#080019]/70"></div>

          <div className="absolute w-72 h-72 bg-purple-600/30 blur-[100px] rounded-full -top-20 -right-20"></div>

          <div className="absolute bottom-10 left-10 right-10 text-white">
            <p className="text-cyan-300 text-sm mb-2">JOIN SMART TRAFFIC</p>

            <h2 className="text-4xl font-bold leading-tight">
              Report Faster.
              <br />
              <span className="text-cyan-300">Respond Smarter.</span>
            </h2>

            <p className="text-purple-100/70 text-sm mt-4 max-w-sm">
              Create your account and help make roads safer through faster
              incident reporting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAccount;