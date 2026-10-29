import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserContext from "../context/UserContext";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { user, updateUser } = useContext(UserContext);
  const navigate = useNavigate();

  // Pehle se logged in hai to login page dikhane ki zaroorat nahi
  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Please enter your username and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.user) {
        setError(data.message || "Invalid username or password.");
        return;
      }

      const account = data.user;

      const loggedInUser = {
        userId: account.userId || account._id || account.id || "",
        fullName: account.fullName || account.name || "",
        username: account.username || "",
        email: account.email || "",
      };

      if (data.token) {
        localStorage.setItem("citizenToken", data.token);
      }

      // Session localStorage me provider khud save karta hai
      updateUser(loggedInUser);
      navigate("/dashboard", { replace: true });
    } catch (loginError) {
      console.error("Login error:", loginError);
      setError(
        "Unable to connect to the server. Please ensure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="
        min-h-screen flex items-center justify-center p-6
        bg-gradient-to-br from-[#12002b] via-[#1b0645] to-[#090018]
      "
    >
      <div
        className="
          w-full max-w-4xl h-[92vh] min-h-0
          rounded-3xl overflow-hidden
          bg-[#151035]/95
          border border-purple-500/20
          shadow-2xl shadow-purple-900/50
          flex
        "
      >
        <div
          className="
            w-full md:w-1/2 p-10 md:p-14
            flex flex-col justify-center
          "
        >
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-white">
              Smart<span className="text-cyan-400">Traffic</span>
            </h1>

            <p className="text-purple-300/70 text-sm mt-2">
              Smart Traffic Incident Reporting System
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white">Welcome Back ..</h2>

            <p className="text-purple-200/60 mt-2 text-sm">
              Login to continue to SmartTraffic
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label className="block text-sm text-purple-100 mb-2">
                Username
              </label>

              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError("");
                }}
                placeholder="Enter your username"
                className="
                  w-full px-4 py-3 rounded-lg
                  bg-[#0c0820] border border-purple-500/30
                  text-white placeholder-purple-300/30
                  outline-none focus:border-cyan-400
                  focus:ring-1 focus:ring-cyan-400 transition
                "
              />
            </div>

            <div className="mb-5">
              <label className="block text-sm text-purple-100 mb-2">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Enter your password"
                className="
                  w-full px-4 py-3 rounded-lg
                  bg-[#0c0820] border border-purple-500/30
                  text-white placeholder-purple-300/30
                  outline-none focus:border-cyan-400
                  focus:ring-1 focus:ring-cyan-400 transition
                "
              />
            </div>

            {error && <p className="text-red-400 text-sm mb-5">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="
                w-full py-3 rounded-lg font-semibold text-white
                bg-gradient-to-r from-purple-600 to-cyan-500
                hover:from-purple-500 hover:to-cyan-400
                shadow-lg shadow-purple-600/30
                transition duration-300
                disabled:opacity-60 disabled:cursor-not-allowed
              "
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="text-center text-sm text-purple-200/60 mt-6">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/create-account")}
              className="text-cyan-400 hover:text-cyan-300 font-medium"
            >
              Create Account
            </button>
          </p>

          <div className="mt-7">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px bg-purple-500/20 flex-1"></div>
              <span className="text-xs text-purple-300/50">STAFF ACCESS</span>
              <div className="h-px bg-purple-500/20 flex-1"></div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/authority-login")}
              className="
                w-full py-3 rounded-lg font-semibold
                text-cyan-300 border border-cyan-400/30
                bg-cyan-400/5 hover:bg-cyan-400/10
                hover:border-cyan-400/60 transition duration-300
              "
            >
              👮 Authority Login
            </button>

            <button
              type="button"
              onClick={() => navigate("/admin-login")}
              className="
                w-full py-3 mt-3 rounded-lg font-semibold
                text-purple-300 border border-purple-400/30
                bg-purple-400/5 hover:bg-purple-400/10
                hover:border-purple-400/60 transition duration-300
              "
            >
              👑 Admin Login
            </button>
          </div>

          <div className="flex items-center gap-3 mt-8">
            <div className="h-px bg-purple-500/20 flex-1"></div>
            <p className="text-xs text-purple-300/50">
              Report. Respond. Save Lives.
            </p>
            <div className="h-px bg-purple-500/20 flex-1"></div>
          </div>
        </div>

        <div className="hidden md:block w-1/2 relative overflow-hidden">
          <img
            src="https://i.pinimg.com/736x/82/c4/db/82c4db63e73f66a8efe5f1ad67ddee93.jpg"
            alt="Traffic"
            className="absolute inset-0 w-full h-full object-cover"
          />

          <div
            className="
              absolute inset-0 bg-gradient-to-br
              from-purple-900/40 via-transparent to-[#080019]/70
            "
          ></div>

          <div
            className="
              absolute w-72 h-72 bg-purple-600/30
              blur-[100px] rounded-full -top-20 -right-20
            "
          ></div>

          <div className="absolute bottom-10 left-10 right-10 text-white">
            <p className="text-cyan-300 text-sm mb-2">SMART TRAFFIC SYSTEM</p>

            <h2 className="text-4xl font-bold leading-tight">
              Safer Roads.
              <br />
              <span className="text-cyan-300">Smarter Response.</span>
            </h2>

            <p className="text-purple-100/70 text-sm mt-4 max-w-sm">
              Report traffic incidents and help create safer roads through
              faster response.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;