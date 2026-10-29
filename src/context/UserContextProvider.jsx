


import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import UserContext from "./UserContext";

const API_BASE_URL = "http://localhost:5000/api";

const SESSION_KEY = "smartTrafficCurrentUser";
const LEGACY_ACCOUNT_KEY = "smartTrafficAccount";

const normalize = (value) =>
  String(value ?? "").trim().toLowerCase();

const getCitizen = (report) => {
  if (!report?.citizen) return {};

  if (typeof report.citizen === "string") {
    return { name: report.citizen };
  }

  return report.citizen;
};

const getReportId = (report) =>
  String(report?._id || report?.id || "");

const getUserId = (user) =>
  String(user?.userId || user?._id || user?.id || "").trim();

// Kisi bhi user object ko ek standard session format me badalta hai
const toSessionUser = (u) => ({
  ...u,
  userId: u.userId || u._id || u.id || "",
  fullName: u.fullName || u.name || "",
  name: u.name || u.fullName || "",
  username: normalize(u.username),
  email: normalize(u.email),
});

const belongsToUser = (report, user) => {
  const citizen = getCitizen(report);

  const userId = getUserId(user);
  const reportUserId = String(citizen?.userId || "").trim();

  const userEmail = normalize(user?.email);
  const userUsername = normalize(user?.username);

  const reportEmail = normalize(citizen?.email);
  const reportUsername = normalize(citizen?.username);

  if (userId && reportUserId) {
    return userId === reportUserId;
  }

  if (userEmail && reportEmail && userEmail === reportEmail) {
    return true;
  }

  if (
    userUsername &&
    reportUsername &&
    userUsername === reportUsername
  ) {
    return true;
  }

  return false;
};

const normalizeReportsResponse = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.incidents)) return data.incidents;
  if (Array.isArray(data?.reports)) return data.reports;
  return [];
};

const readStoredUser = () => {
  try {
    const currentSession = localStorage.getItem(SESSION_KEY);

    if (currentSession) {
      const parsedSession = JSON.parse(currentSession);

      if (parsedSession && typeof parsedSession === "object") {
        return parsedSession;
      }
    }

    // Purana format (sirf tab jab current session nahi hai)
    const savedAccount = localStorage.getItem(LEGACY_ACCOUNT_KEY);

    if (!savedAccount) return null;

    const account = JSON.parse(savedAccount);

    if (!account || typeof account !== "object") {
      localStorage.removeItem(LEGACY_ACCOUNT_KEY);
      return null;
    }

    const sessionUser = toSessionUser(account);

    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    // Ek baar migrate hone ke baad purani key hamesha ke liye hata do
    localStorage.removeItem(LEGACY_ACCOUNT_KEY);

    return sessionUser;
  } catch (error) {
    console.error("Unable to restore saved user:", error);
    return null;
  }
};

const UserContextProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser);

  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState("");

  const requestIdRef = useRef(0);

  // user kisi bhi tareeke se set ho (setUser ya updateUser),
  // localStorage hamesha sync rahega, to refresh pe login nahi jayega.
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(
          SESSION_KEY,
          JSON.stringify(toSessionUser(user))
        );
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    } catch (error) {
      console.error("Unable to save session:", error);
    }
  }, [user]);

  // silent = true: background refresh, loading spinner nahi dikhega
  const fetchReports = useCallback(async (currentUser, silent = false) => {
    const requestId = ++requestIdRef.current;

    if (!currentUser) {
      setReports([]);
      setReportsError("");
      setReportsLoading(false);
      return;
    }

    const userId = getUserId(currentUser);
    const email = normalize(currentUser.email);
    const username = normalize(currentUser.username);

    if (!userId && !email && !username) {
      setReportsError("Login details missing hain. Please log in again.");
      setReportsLoading(false);
      return;
    }

    if (!silent) setReportsLoading(true);
    setReportsError("");

    try {
      const params = new URLSearchParams();

      params.set("scope", "citizen");

      if (userId) params.set("userId", userId);
      if (email) params.set("email", email);
      if (username) params.set("username", username);

      const response = await fetch(
        `${API_BASE_URL}/incidents?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const responseText = await response.text();

      let data = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(
          `Backend ne valid JSON nahi bheja (HTTP ${response.status}). Backend terminal check karo.`
        );
      }

      if (!response.ok || data?.success === false) {
        throw new Error(
          data?.message ||
            `Reports load nahi ho paayi (HTTP ${response.status}).`
        );
      }

      const allReturnedReports = normalizeReportsResponse(data);

      const ownReports = allReturnedReports.filter((report) =>
        belongsToUser(report, currentUser)
      );

      if (requestId !== requestIdRef.current) return;

      setReports(ownReports);
      setReportsError("");
    } catch (error) {
      if (requestId !== requestIdRef.current) return;

      console.error("Fetch reports error:", error);

      setReportsError(error.message || "Reports load nahi ho paayi.");
    } finally {
      if (requestId === requestIdRef.current) {
        setReportsLoading(false);
      }
    }
  }, []);

  // Pehli baar load
  useEffect(() => {
    if (!user) {
      requestIdRef.current += 1;
      setReports([]);
      setReportsError("");
      setReportsLoading(false);
      return;
    }

    fetchReports(user);
  }, [user, fetchReports]);

  // Auto refresh: har 30 second, aur sirf tab jab tab dikh raha ho
  useEffect(() => {
    if (!user) return;

    const refresh = () => {
      if (document.hidden) return;
      fetchReports(user, true);
    };

    const timer = setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [user, fetchReports]);

  const addReport = useCallback(
    (reportData) => {
      if (!reportData || !user) return;

      const savedCitizen = getCitizen(reportData);

      const normalizedReport = {
        ...reportData,
        citizen: {
          ...savedCitizen,
          userId: savedCitizen.userId || getUserId(user),
          name:
            savedCitizen.name ||
            user.fullName ||
            user.name ||
            user.username ||
            "Citizen",
          email: normalize(savedCitizen.email || user.email),
          username: normalize(savedCitizen.username || user.username),
        },
      };

      if (!belongsToUser(normalizedReport, user)) {
        console.warn(
          "Report identity does not match the logged-in citizen."
        );
        return;
      }

      setReports((previousReports) => {
        const newId = getReportId(normalizedReport);

        if (!newId) {
          console.warn(
            "Report has no MongoDB ID. Check the backend response."
          );
          return previousReports;
        }

        const existingIndex = previousReports.findIndex(
          (report) => getReportId(report) === newId
        );

        if (existingIndex === -1) {
          return [normalizedReport, ...previousReports];
        }

        return previousReports.map((report) =>
          getReportId(report) === newId
            ? { ...report, ...normalizedReport }
            : report
        );
      });
    },
    [user]
  );

  const refreshReports = useCallback(async () => {
    if (!user) {
      setReports([]);
      return;
    }

    await fetchReports(user);
  }, [user, fetchReports]);

  const updateUser = useCallback((nextUser) => {
    if (!nextUser) {
      setUser(null);
      return;
    }

    // localStorage ka kaam upar wala useEffect kar dega
    setUser(toSessionUser(nextUser));
  }, []);

  const logoutUser = useCallback(() => {
    requestIdRef.current += 1;

    try {
      localStorage.removeItem(SESSION_KEY);
      // warna refresh pe purane format se wapas auto-login ho jata tha
      localStorage.removeItem(LEGACY_ACCOUNT_KEY);
    } catch (error) {
      console.error("Unable to clear session:", error);
    }

    setUser(null);
    setReports([]);
    setReportsError("");
    setReportsLoading(false);
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        updateUser,
        reports,
        setReports,
        addReport,
        fetchReports,
        refreshReports,
        reportsLoading,
        reportsError,
        logoutUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export default UserContextProvider;