
import React, { useContext, useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import UserContext from "../context/UserContext";

const Settings = () => {
  const { theme, lightTheme, darkTheme } = useTheme();
  const { user } = useContext(UserContext);

  const isDark = theme === "dark";

  // Unique settings key for each logged-in account
  const accountKey =
    user?.email || user?.username || user?.fullName || user?.name || "guest";

  const storageKey = `smartTrafficSettings_${String(accountKey)
    .trim()
    .toLowerCase()}`;

  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(
        `smartTrafficSettings_${String(
          user?.email ||
            user?.username ||
            user?.fullName ||
            user?.name ||
            "guest"
        )
          .trim()
          .toLowerCase()}`
      );

      if (saved) {
        const parsed = JSON.parse(saved);

        return {
          reportUpdates: parsed.reportUpdates ?? true,
          trafficAlerts: parsed.trafficAlerts ?? true,
        };
      }
    } catch (error) {
      console.error("Unable to load notification settings:", error);
    }

    return {
      reportUpdates: true,
      trafficAlerts: true,
    };
  });

  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [showDeleteConfirmation, setShowDeleteConfirmation] =
    useState(false);

  // Save preferences whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(notifications));
    } catch (error) {
      console.error("Unable to save notification settings:", error);
      setMessage("Unable to save preferences in this browser.");
    }
  }, [notifications, storageKey]);

  const toggleNotification = (name) => {
    setNotifications((previous) => ({
      ...previous,
      [name]: !previous[name],
    }));

    setMessage("Notification preferences updated.");
  };

  const cardClass = isDark
    ? "bg-[#111827] border-purple-900/40"
    : "bg-white border-gray-200";

  const inputClass = isDark
    ? "bg-[#0B1020] border-gray-700 text-gray-200"
    : "bg-gray-50 border-gray-300 text-gray-800";

  const mutedClass = isDark ? "text-gray-400" : "text-gray-500";

  const displayName =
    user?.fullName || user?.name || user?.username || "Citizen";

  const role =
    user?.role || user?.userRole || "Citizen";

  const handleChangePassword = () => {
    setMessage(
      "Password change requires a secure backend API. No password has been changed."
    );
  };

  const handleDeleteAccount = () => {
    setMessage(
      "Account deletion requires a verified backend endpoint. Your account has not been deleted."
    );
    setShowDeleteConfirmation(false);
  };

  return (
    <div
      className={`min-h-screen p-4 transition-colors duration-300 sm:p-6 md:p-8 ${
        isDark
          ? "bg-[#0B1020] text-white"
          : "bg-gray-100 text-gray-900"
      }`}
    >
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-purple-500">
            SMARTTRAFFIC
          </p>

          <h1 className="mt-2 text-3xl font-bold">Settings</h1>

          <p className={`mt-2 text-sm ${mutedClass}`}>
            Manage your account, notifications, appearance and preferences.
          </p>
        </div>

        {/* Feedback message */}
        {message && (
          <div
            role="status"
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
              isDark
                ? "border-purple-500/30 bg-purple-500/10 text-purple-300"
                : "border-purple-200 bg-purple-50 text-purple-700"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <p>{message}</p>

              <button
                type="button"
                onClick={() => setMessage("")}
                aria-label="Dismiss message"
                className="font-bold"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Account settings */}
        <section className={`mb-6 rounded-2xl border p-5 sm:p-6 ${cardClass}`}>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/15 text-xl">
              👤
            </div>

            <div>
              <h2 className="text-xl font-semibold">Account Settings</h2>
              <p className={`mt-1 text-sm ${mutedClass}`}>
                Information from your current login session.
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={`mb-2 block text-sm ${mutedClass}`}>
                Full Name
              </label>
              <input
                value={displayName}
                readOnly
                className={`w-full rounded-lg border px-4 py-3 outline-none ${inputClass}`}
              />
            </div>

            <div>
              <label className={`mb-2 block text-sm ${mutedClass}`}>
                Username
              </label>
              <input
                value={user?.username || "Not available"}
                readOnly
                className={`w-full rounded-lg border px-4 py-3 outline-none ${inputClass}`}
              />
            </div>

            <div>
              <label className={`mb-2 block text-sm ${mutedClass}`}>
                Email Address
              </label>
              <input
                value={user?.email || "Not available"}
                readOnly
                className={`w-full rounded-lg border px-4 py-3 outline-none ${inputClass}`}
              />
            </div>

            <div>
              <label className={`mb-2 block text-sm ${mutedClass}`}>
                Account Role
              </label>
              <input
                value={role}
                readOnly
                className={`w-full rounded-lg border px-4 py-3 outline-none ${inputClass}`}
              />
            </div>
          </div>

          <p className={`mt-4 text-xs ${mutedClass}`}>
            Account information is read-only here. Update functionality
            requires a backend profile API.
          </p>
        </section>

        {/* Notifications */}
        <section className={`mb-6 rounded-2xl border p-5 sm:p-6 ${cardClass}`}>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Notifications</h2>
            <p className={`mt-1 text-sm ${mutedClass}`}>
              Choose your notification preferences.
            </p>
          </div>

          {/* Report updates */}
          <div className="flex items-center justify-between gap-4 border-b border-gray-500/20 py-5">
            <div>
              <h3 className="font-medium">Report Status Updates</h3>
              <p className={`mt-1 text-sm ${mutedClass}`}>
                Preferences for incident status notifications.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={notifications.reportUpdates}
              aria-label="Report status updates"
              onClick={() => toggleNotification("reportUpdates")}
              className={`relative h-6 w-12 shrink-0 rounded-full transition ${
                notifications.reportUpdates
                  ? "bg-purple-600"
                  : "bg-gray-500"
              }`}
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                  notifications.reportUpdates ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>

          {/* Traffic alerts */}
          <div className="flex items-center justify-between gap-4 py-5">
            <div>
              <h3 className="font-medium">Traffic Alerts</h3>
              <p className={`mt-1 text-sm ${mutedClass}`}>
                Preferences for important traffic and road alerts.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={notifications.trafficAlerts}
              aria-label="Traffic alerts"
              onClick={() => toggleNotification("trafficAlerts")}
              className={`relative h-6 w-12 shrink-0 rounded-full transition ${
                notifications.trafficAlerts
                  ? "bg-purple-600"
                  : "bg-gray-500"
              }`}
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                  notifications.trafficAlerts ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>

          <p className={`text-xs ${mutedClass}`}>
            Your choices are saved in this browser. Actual push or email
            notifications need notification delivery logic in the backend.
          </p>
        </section>

        {/* Appearance */}
        <section className={`mb-6 rounded-2xl border p-5 sm:p-6 ${cardClass}`}>
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/15 text-xl">
              🎨
            </div>

            <div>
              <h2 className="text-xl font-semibold">Appearance</h2>
              <p className={`mt-1 text-sm ${mutedClass}`}>
                Current theme: {isDark ? "Dark Mode" : "Light Mode"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={darkTheme}
              aria-pressed={isDark}
              className={`rounded-xl border px-5 py-3 transition ${
                isDark
                  ? "border-purple-500 bg-purple-600/20 text-purple-300"
                  : "border-gray-300 text-gray-600 hover:border-purple-400"
              }`}
            >
              🌙 Dark Mode
              {isDark ? " ✓" : ""}
            </button>

            <button
              type="button"
              onClick={lightTheme}
              aria-pressed={!isDark}
              className={`rounded-xl border px-5 py-3 transition ${
                !isDark
                  ? "border-purple-500 bg-purple-100 text-purple-700"
                  : "border-gray-700 text-gray-400 hover:border-purple-400"
              }`}
            >
              ☀️ Light Mode
              {!isDark ? " ✓" : ""}
            </button>
          </div>
        </section>

        {/* Privacy and security */}
        <section className={`mb-6 rounded-2xl border p-5 sm:p-6 ${cardClass}`}>
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-xl">
              🔐
            </div>

            <div>
              <h2 className="text-xl font-semibold">Privacy & Security</h2>
              <p className={`mt-1 text-sm ${mutedClass}`}>
                Protect your account credentials.
              </p>
            </div>
          </div>

          <div>
            <label className={`mb-2 block text-sm ${mutedClass}`}>
              Password
            </label>

            <div className="flex items-center gap-3">
              <input
                type="password"
                value=""
                placeholder="••••••••••••"
                readOnly
                aria-label="Password protected"
                className={`min-w-0 flex-1 rounded-lg border px-4 py-3 outline-none ${inputClass}`}
              />

              <span className="text-sm text-emerald-500">
                Protected
              </span>
            </div>

            <p className={`mt-2 text-xs ${mutedClass}`}>
              Your actual password is never displayed in Settings.
            </p>

            <button
              type="button"
              onClick={handleChangePassword}
              className="mt-4 rounded-lg border border-purple-500 px-5 py-2.5 text-sm text-purple-500 transition hover:bg-purple-500/10"
            >
              Change Password
            </button>
          </div>
        </section>

        {/* Danger zone */}
        <section
          className={`rounded-2xl border p-5 sm:p-6 ${
            isDark
              ? "border-red-900/40 bg-red-950/10"
              : "border-red-200 bg-white"
          }`}
        >
          <h2 className="text-xl font-semibold text-red-500">
            Danger Zone
          </h2>

          <p className={`mb-5 mt-2 text-sm ${mutedClass}`}>
            Account deletion is permanent. Verify the account on the backend
            before performing this action.
          </p>

          {!showDeleteConfirmation ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirmation(true)}
              className="rounded-lg border border-red-500 px-5 py-2.5 text-sm text-red-500 transition hover:bg-red-500 hover:text-white"
            >
              Delete Account
            </button>
          ) : (
            <div className="rounded-xl border border-red-500/30 p-4">
              <p className="text-sm font-medium">
                Are you sure you want to continue?
              </p>

              <p className={`mt-2 text-sm ${mutedClass}`}>
                No account will be deleted until a secure backend deletion
                endpoint is implemented.
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  Continue
                </button>

                <button
                  type="button"
                  onClick={() => setShowDeleteConfirmation(false)}
                  className={`rounded-lg border border-gray-500/40 px-4 py-2 text-sm ${mutedClass}`}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>

        <p className={`mt-6 text-center text-xs ${mutedClass}`}>
          SmartTraffic · Report. Respond. Save Lives.
        </p>
      </div>
    </div>
  );
};

export default Settings;