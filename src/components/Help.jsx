

import React, { useContext, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import UserContext from "../context/UserContext";

const SUPPORT_EMAIL = "divyadd.0913@gmail.com";

const topics = [
  "Problem while reporting an incident",
  "Report status question",
  "Login or account issue",
  "Map or location issue",
  "Other",
];

const Help = () => {
  const { theme } = useTheme();
  const { user } = useContext(UserContext) || {};
  const isDark = theme === "dark";

  const [topic, setTopic] = useState(topics[0]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [opened, setOpened] = useState(false);

  const card = isDark
    ? "border-purple-900/40 bg-[#151B2E]"
    : "border-[#E9D5FF] bg-white";

  const muted = isDark ? "text-gray-400" : "text-slate-500";

  const input = `w-full rounded-xl border px-4 py-3 text-sm outline-none ${
    isDark
      ? "border-gray-700 bg-[#0B1020] text-white focus:border-purple-500"
      : "border-[#E9D5FF] bg-white text-[#1E1B4B] focus:border-[#7C3AED]"
  }`;

  const handleSend = (event) => {
    event.preventDefault();
    setError("");
    setOpened(false);

    if (message.trim().length < 10) {
      setError("Please write at least 10 characters in your message.");
      return;
    }

    const subject = `SmartTraffic Support: ${topic}`;

    const body = [
      message.trim(),
      "",
      "---",
      `Name: ${user?.fullName || "Not available"}`,
      `Username: ${user?.username || "Not available"}`,
      `Email: ${user?.email || "Not available"}`,
    ].join("\n");

    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    setOpened(true);
  };

  return (
    <div className={`mx-auto max-w-3xl pb-10 ${isDark ? "text-white" : "text-[#1E1B4B]"}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl">Help & Support</h1>
        <p className={`mt-2 ${muted}`}>
          Need help using SmartTraffic? We're here to help.
        </p>
      </div>

      {/* Contact card */}
      <div className={`mb-6 rounded-2xl border p-5 sm:p-6 ${card}`}>
        <h2 className="mb-3 text-xl font-semibold">Need Help?</h2>

        <p className={`text-sm leading-6 ${muted}`}>
          If you're facing any issue while reporting an incident, tracking your
          report, or using SmartTraffic, feel free to contact us.
        </p>

        <div
          className={`mt-5 rounded-xl border p-5 ${
            isDark
              ? "border-gray-700 bg-[#0B1020]"
              : "border-[#E9D5FF] bg-[#FAF5FF]"
          }`}
        >
          <p className={`text-sm ${muted}`}>Support Contact</p>

          <h3 className="mt-1 text-lg font-semibold">Founder Divya</h3>

          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className={`mt-3 inline-block break-all transition ${
              isDark
                ? "text-purple-400 hover:text-purple-300"
                : "text-[#7C3AED] hover:text-[#6D28D9]"
            }`}
          >
            📧 {SUPPORT_EMAIL}
          </a>
        </div>
      </div>

      {/* Message form */}
      <form onSubmit={handleSend} className={`rounded-2xl border p-5 sm:p-6 ${card}`}>
        <h2 className="mb-1 text-xl font-semibold">Send us a message</h2>
        <p className={`mb-5 text-sm ${muted}`}>
          Write your issue and we will open an email to our support team with
          your details filled in.
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
            setMessage(event.target.value);
            setError("");
          }}
          rows={5}
          placeholder="Describe your issue in detail..."
          className={`${input} resize-y`}
        />

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        {opened && (
          <p
            className={`mt-3 text-sm ${
              isDark ? "text-green-400" : "text-green-700"
            }`}
          >
            Your email app should have opened. Press Send there to contact us.
          </p>
        )}

        <button
          type="submit"
          className="mt-5 w-full rounded-xl bg-[#7C3AED] px-6 py-3 font-semibold text-white transition hover:bg-[#6D28D9] sm:w-auto"
        >
          ✉️ Send Email
        </button>
      </form>
    </div>
  );
};

export default Help;