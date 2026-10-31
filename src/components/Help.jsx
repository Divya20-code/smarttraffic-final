import React, { useCallback, useContext, useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import UserContext from "../context/UserContext";

const API = "http://localhost:5000/api";
const SUPPORT_EMAIL = "divyadd.0193@gmail.com";

const topics = [
  "Problem while reporting an incident",
  "Report status question",
  "Login or account issue",
  "Map or location issue",
  "Other",
];

const statusLabel = (status) =>
  status === "resolved"
    ? "Resolved"
    : status === "in-progress"
    ? "In Progress"
    : "Open";

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("en-IN");
};

const Help = () => {
  const { theme } = useTheme();
  const { user } = useContext(UserContext) || {};
  const isDark = theme === "dark";

  const [topic, setTopic] = useState(topics[0]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [complaints, setComplaints] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");

  const card = isDark
    ? "border-purple-900/40 bg-[#151B2E]"
    : "border-[#E9D5FF] bg-white";

  const muted = isDark ? "text-gray-400" : "text-slate-500";

  const input = `w-full rounded-xl border px-4 py-3 text-sm outline-none ${
    isDark
      ? "border-gray-700 bg-[#0B1020] text-white focus:border-purple-500"
      : "border-[#E9D5FF] bg-white text-[#1E1B4B] focus:border-[#7C3AED]"
  }`;

  const loadComplaints = useCallback(async () => {
    setListLoading(true);
    setListError("");

    try {
      const response = await fetch(`${API}/complaints/mine`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load your complaints.");
      }

      setComplaints(data.complaints || []);
    } catch (err) {
      setListError(err.message || "Unable to load your complaints.");
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (sending) return;

    setError("");
    setSuccess("");

    if (message.trim().length < 10) {
      setError("Please write at least 10 characters in your message.");
      return;
    }

    setSending(true);

    try {
      const response = await fetch(`${API}/complaints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, message: message.trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to register your complaint.");
      }

      setSuccess(
        "Your complaint has been registered. Our team will reply here soon."
      );
      setMessage("");
      loadComplaints();
    } catch (err) {
      setError(err.message || "Unable to register your complaint.");
    } finally {
      setSending(false);
    }
  };

  const statusClass = (status) => {
    if (status === "resolved") {
      return isDark
        ? "bg-green-500/10 text-green-400"
        : "bg-green-100 text-green-700";
    }

    if (status === "in-progress") {
      return isDark
        ? "bg-blue-500/10 text-blue-400"
        : "bg-blue-100 text-blue-700";
    }

    return isDark
      ? "bg-yellow-500/10 text-yellow-400"
      : "bg-yellow-100 text-yellow-800";
  };

  return (
    <div
      className={`mx-auto max-w-3xl pb-10 ${
        isDark ? "text-white" : "text-[#1E1B4B]"
      }`}
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl">Help & Support</h1>
        <p className={`mt-2 ${muted}`}>
          Facing a problem? Register a complaint and our team will reply here.
        </p>
      </div>

      {/* Contact */}
      <div className={`mb-6 rounded-2xl border p-5 sm:p-6 ${card}`}>
        <p className={`text-sm ${muted}`}>Support Contact</p>
        <h3 className="mt-1 text-lg font-semibold">Founder Divya</h3>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className={`mt-2 inline-block break-all ${
            isDark ? "text-purple-400" : "text-[#7C3AED]"
          }`}
        >
          📧 {SUPPORT_EMAIL}
        </a>
      </div>

      {/* Complaint form */}
      <form
        onSubmit={handleSubmit}
        className={`mb-6 rounded-2xl border p-5 sm:p-6 ${card}`}
      >
        <h2 className="mb-1 text-xl font-semibold">Register a complaint</h2>
        <p className={`mb-5 text-sm ${muted}`}>
          Signed in as {user?.fullName || user?.username || "you"}. We will
          reply on this page
          {user?.email ? ` and by email at ${user.email}` : ""}.
        </p>

        <label className={`mb-2 block text-sm ${muted}`}>Topic</label>
        <select
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          className={input}
        >
          {topics.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <label className={`mb-2 mt-4 block text-sm ${muted}`}>Message</label>
        <textarea
          value={message}
          onChange={(event) => {
            setMessage(event.target.value.slice(0, 2000));
            setError("");
          }}
          rows={5}
          placeholder="Describe your problem in detail..."
          className={`${input} resize-y`}
        />
        <p className={`mt-1 text-right text-xs ${muted}`}>
          {message.length}/2000
        </p>

        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

        {success && (
          <p
            className={`mt-2 text-sm ${
              isDark ? "text-green-400" : "text-green-700"
            }`}
          >
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={sending}
          className="mt-4 w-full rounded-xl bg-[#7C3AED] px-6 py-3 font-semibold text-white transition hover:bg-[#6D28D9] disabled:opacity-60 sm:w-auto"
        >
          {sending ? "Sending..." : "Submit Complaint"}
        </button>
      </form>

      {/* My complaints */}
      <div className={`rounded-2xl border p-5 sm:p-6 ${card}`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">My complaints</h2>

          <button
            type="button"
            onClick={loadComplaints}
            disabled={listLoading}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-50 ${
              isDark
                ? "border-gray-700 hover:border-purple-500"
                : "border-[#D8B4FE] text-[#7C3AED] hover:bg-[#F3E8FF]"
            }`}
          >
            {listLoading ? "Loading..." : "↻ Refresh"}
          </button>
        </div>

        {listError && <p className="mb-3 text-sm text-red-500">{listError}</p>}

        {!listLoading && !listError && complaints.length === 0 && (
          <p className={`py-6 text-center text-sm ${muted}`}>
            You have not registered any complaint yet.
          </p>
        )}

        <div className="space-y-4">
          {complaints.map((item) => (
            <div
              key={item._id}
              className={`rounded-xl border p-4 ${
                isDark
                  ? "border-gray-700 bg-[#0B1020]"
                  : "border-[#E9D5FF] bg-[#FAF5FF]"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-semibold">{item.topic}</p>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                    item.status
                  )}`}
                >
                  {statusLabel(item.status)}
                </span>
              </div>

              <p className={`mt-1 text-xs ${muted}`}>
                {formatDate(item.createdAt)}
              </p>

              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6">
                {item.message}
              </p>

              {item.adminReply ? (
                <div
                  className={`mt-3 rounded-lg border p-3 ${
                    isDark
                      ? "border-green-500/20 bg-green-500/5"
                      : "border-green-300 bg-green-50"
                  }`}
                >
                  <p
                    className={`text-xs font-semibold ${
                      isDark ? "text-green-400" : "text-green-700"
                    }`}
                  >
                    Reply from support
                  </p>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">
                    {item.adminReply}
                  </p>
                </div>
              ) : (
                <p className={`mt-3 text-xs ${muted}`}>
                  Waiting for a reply from our team.
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Help;