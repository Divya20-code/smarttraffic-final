
import React, {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/ChatGPT Image Oct 3, 2026, 07_39_03 AM.png";
import { useTheme } from "../context/ThemeContext";
import UserContext from "../context/UserContext";

const SEEN_KEY = "smartTrafficNotificationsSeenAt";

const readSeenAt = () => {
  try {
    const saved = Number(localStorage.getItem(SEEN_KEY));
    if (saved) return saved;

    // Pehli baar: purani reports ko "naya" mat ginna
    const now = Date.now();
    localStorage.setItem(SEEN_KEY, String(now));
    return now;
  } catch {
    return Date.now();
  }
};

const getTime = (report) =>
  new Date(report.updatedAt || report.createdAt || 0).getTime() || 0;

const typeLabel = (value) => String(value || "incident").replace(/-/g, " ");

const shortPlace = (report) =>
  String(report.location?.address || "")
    .split(",")
    .slice(0, 2)
    .join(",")
    .trim();

const statusInfo = (status) => {
  const s = String(status || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");

  if (s === "resolved") return { icon: "✅", title: "Report Resolved" };
  if (["responding", "in-progress"].includes(s)) {
    return { icon: "🚓", title: "Team Responding" };
  }
  if (["acknowledged", "pending"].includes(s)) {
    return { icon: "📍", title: "Report Under Review" };
  }
  return { icon: "🚨", title: "Report Submitted" };
};

const timeAgo = (timestamp) => {
  if (!timestamp) return "";

  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  return `${Math.floor(seconds / 86400)} day(s) ago`;
};

const Navbar = ({ onMenuClick = () => {} }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, reports } = useContext(UserContext);
  const navigate = useNavigate();

  const isDark = theme === "dark";

  const [showNotifications, setShowNotifications] = useState(false);
  const [seenAt, setSeenAt] = useState(readSeenAt);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const notifRef = useRef(null);
  const searchRef = useRef(null);

  // Bahar click karne par dono dropdown band, aur Esc dabane par bhi
  useEffect(() => {
    const handleOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowNotifications(false);
        setSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // Notifications: aapki reports ka latest status
  const notifications = useMemo(
    () =>
      [...(reports || [])]
        .sort((a, b) => getTime(b) - getTime(a))
        .slice(0, 5)
        .map((report) => ({
          id: report._id || report.id,
          at: getTime(report),
          ...statusInfo(report.status),
          text: `${typeLabel(report.incidentType)}${
            shortPlace(report) ? ` at ${shortPlace(report)}` : ""
          }`,
        })),
    [reports]
  );

  const unreadCount = notifications.filter((item) => item.at > seenAt).length;

  const toggleNotifications = () => {
    const next = !showNotifications;

    setShowNotifications(next);
    setSearchOpen(false);

    if (next) {
      const now = Date.now();
      setSeenAt(now);

      try {
        localStorage.setItem(SEEN_KEY, String(now));
      } catch {
        // storage band ho to ignore
      }
    }
  };

  // Search: aapki reports me type, location, description, status se dhoondho
  const results = useMemo(() => {
    const text = query.trim().toLowerCase();

    if (text.length < 2) return [];

    return (reports || [])
      .filter((report) =>
        [
          report.incidentType,
          report.description,
          report.location?.address,
          report.status,
          report.severity,
          report._id,
        ]
          .join(" ")
          .toLowerCase()
          .includes(text)
      )
      .slice(0, 6);
  }, [query, reports]);

  const openReports = () => {
    setQuery("");
    setSearchOpen(false);
    navigate("/dashboard/reports");
  };

  const iconButton = `rounded-lg px-3 py-2 text-lg transition-all duration-200 ${
    isDark
      ? "text-gray-300 hover:bg-purple-600/10 hover:text-purple-300"
      : "text-gray-600 hover:bg-purple-50 hover:text-purple-600"
  }`;

  const dropdownBox = `z-50 rounded-xl border shadow-2xl ${
    isDark ? "bg-[#151B2E] border-purple-900/40" : "bg-white border-gray-200"
  }`;

  const mutedText = isDark ? "text-gray-400" : "text-gray-500";

  return (
    <nav
      className={`sticky top-0 z-30 flex h-16 w-full items-center justify-between gap-2 border-b px-3 transition-colors duration-300 sm:px-6 ${
        isDark
          ? "bg-[#0B1020] border-purple-900/40 text-white"
          : "bg-white border-gray-200 text-gray-800 shadow-sm"
      }`}
    >
      {/* Menu button (sirf mobile) + Logo */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          className={`${iconButton} lg:hidden`}
        >
          ☰
        </button>

        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 sm:gap-3"
        >
          <img
            src={logo}
            alt="SmartTraffic Logo"
            className="h-9 w-9 object-contain sm:h-10 sm:w-10"
          />

          <span
            className={`hidden text-xl font-bold transition-colors sm:inline ${
              isDark ? "text-purple-400" : "text-purple-600"
            }`}
          >
            SmartTraffic
          </span>
        </button>
      </div>

      {/* Search */}
      <div
        ref={searchRef}
        className="relative mx-1 min-w-0 max-w-md flex-1 sm:mx-6"
      >
        <input
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setSearchOpen(true);
          }}
          onFocus={() => setSearchOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && results.length) openReports();
          }}
          placeholder="Search your reports..."
          className={`w-full rounded-lg border px-4 py-2 text-sm outline-none transition-all duration-200 ${
            isDark
              ? "bg-[#151B2E] border-purple-900/40 text-white placeholder-gray-500 focus:border-purple-500"
              : "bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:border-purple-400 focus:bg-white"
          }`}
        />

        {searchOpen && query.trim().length >= 2 && (
          <div
            className={`absolute left-0 right-0 top-12 max-h-80 overflow-y-auto ${dropdownBox}`}
          >
            {results.length === 0 ? (
              <p className={`px-4 py-3 text-sm ${mutedText}`}>
                No matching reports found.
              </p>
            ) : (
              results.map((report) => (
                <button
                  key={report._id || report.id}
                  type="button"
                  onClick={openReports}
                  className={`block w-full border-b px-4 py-3 text-left last:border-b-0 ${
                    isDark
                      ? "border-gray-700/30 hover:bg-purple-600/10"
                      : "border-gray-100 hover:bg-purple-50"
                  }`}
                >
                  <p className="text-sm font-medium capitalize">
                    {typeLabel(report.incidentType)}
                  </p>

                  <p className={`truncate text-xs ${mutedText}`}>
                    {report.location?.address || "No location"}
                  </p>

                  <p className="mt-1 text-[10px] uppercase tracking-wide text-purple-400">
                    {report.status || "reported"}
                  </p>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Right Side */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-3">
        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className={iconButton}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? "☀️" : "🌙"}
        </button>

        {/* Notification */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={toggleNotifications}
            aria-label="Notifications"
            className={`relative ${iconButton} text-sm`}
          >
            🔔
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div
              className={`fixed left-4 right-4 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-80 ${dropdownBox}`}
            >
              <div className="flex items-center justify-between border-b border-gray-700/30 px-4 py-3">
                <h3 className="font-semibold">Notifications</h3>

                <button
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  aria-label="Close notifications"
                  className="text-sm text-purple-400 hover:text-purple-300"
                >
                  ✕
                </button>
              </div>

              {notifications.length === 0 ? (
                <p className={`px-4 py-6 text-center text-sm ${mutedText}`}>
                  No notifications yet.
                </p>
              ) : (
                notifications.map((item) => (
                  <div
                    key={`${item.id}-${item.at}`}
                    className={`border-b px-4 py-3 ${
                      isDark
                        ? "border-gray-700/30 hover:bg-purple-600/5"
                        : "border-gray-100 hover:bg-purple-50"
                    }`}
                  >
                    <div className="flex gap-3">
                      <span className="text-lg">{item.icon}</span>

                      <div className="min-w-0">
                        <p className="text-sm font-medium">{item.title}</p>

                        <p
                          className={`mt-1 truncate text-xs capitalize ${mutedText}`}
                        >
                          {item.text}
                        </p>

                        <p className="mt-1 text-[10px] text-gray-500">
                          {timeAgo(item.at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}

              <div className="px-4 py-3 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifications(false);
                    navigate("/dashboard/reports");
                  }}
                  className="text-xs text-purple-400 hover:text-purple-300"
                >
                  View all reports
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <button
          type="button"
          onClick={() => navigate("/dashboard/profile")}
          className={`flex items-center gap-3 rounded-lg px-1 py-1.5 transition-all duration-200 sm:px-3 ${
            isDark ? "hover:bg-purple-600/10" : "hover:bg-purple-50"
          }`}
        >
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full border sm:h-10 sm:w-10 ${
              isDark
                ? "bg-[#151B2E] border-purple-500/50"
                : "bg-purple-50 border-purple-300"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className={`h-6 w-6 ${
                isDark ? "text-purple-300" : "text-purple-600"
              }`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.25a8.25 8.25 0 0 1 15 0"
              />
            </svg>
          </div>

          <div className="hidden text-left lg:block">
            <p
              className={`text-sm font-medium ${
                isDark ? "text-white" : "text-gray-800"
              }`}
            >
              {user?.username || "User"}
            </p>

            <p className={`text-xs ${mutedText}`}>Welcome back 👋</p>
          </div>
        </button>

        {/* Help (chhoti screen par sidebar mein milta hai) */}
        <NavLink
          to="/dashboard/help"
          className={`hidden rounded-lg px-3 py-2 text-sm transition-all duration-200 sm:block ${
            isDark
              ? "text-gray-300 hover:bg-purple-600/10 hover:text-purple-300"
              : "text-gray-600 hover:bg-purple-50 hover:text-purple-600"
          }`}
        >
          Help
        </NavLink>
      </div>
    </nav>
  );
};

export default Navbar;