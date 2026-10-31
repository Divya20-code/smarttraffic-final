


import React, { useCallback, useEffect, useMemo, useState } from "react";

const API = "http://localhost:5000/api";

const STATUS = [
  { value: "open", label: "Open" },
  { value: "in-progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
];

const statusStyle = (status) => {
  if (status === "resolved") return "bg-green-500/10 text-green-400";
  if (status === "in-progress") return "bg-blue-500/10 text-blue-400";
  return "bg-yellow-500/10 text-yellow-400";
};

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("en-IN");
};

const ComplaintCard = ({ complaint, onSaved }) => {
  const [status, setStatus] = useState(complaint.status);
  const [reply, setReply] = useState(complaint.adminReply || "");
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState({ type: "", text: "" });

  const save = async (nextReply, successText) => {
    setSaving(true);
    setNote({ type: "", text: "" });

    try {
      const response = await fetch(
        `${API}/admin/complaints/${complaint._id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, adminReply: nextReply }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to save.");
      }

      setStatus(data.complaint.status);
      setReply(data.complaint.adminReply || "");
      setNote({ type: "ok", text: successText });
      onSaved(data.complaint);
    } catch (err) {
      setNote({ type: "error", text: err.message || "Unable to save." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-white">{complaint.topic}</p>

          <p className="mt-1 break-words text-xs text-slate-400">
            {complaint.citizen?.name || "Citizen"}
            {complaint.citizen?.username
              ? ` (@${complaint.citizen.username})`
              : ""}
            {complaint.citizen?.email ? ` · ${complaint.citizen.email}` : ""}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {formatDate(complaint.createdAt)}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(
            complaint.status
          )}`}
        >
          {STATUS.find((s) => s.value === complaint.status)?.label || "Open"}
        </span>
      </div>

      <p className="mt-4 whitespace-pre-wrap break-words rounded-xl bg-slate-800/70 p-4 text-sm leading-6 text-slate-200">
        {complaint.message}
      </p>

      <label className="mb-2 mt-4 block text-sm text-slate-300">
        Your reply (you can edit or delete it later)
      </label>

      <textarea
        value={reply}
        onChange={(event) => setReply(event.target.value.slice(0, 2000))}
        rows={3}
        placeholder="Write a reply to the citizen..."
        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none"
        >
          {STATUS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          disabled={saving}
          onClick={() =>
            save(reply, reply.trim() ? "Saved." : "Status saved.")
          }
          className="rounded-xl bg-cyan-500 px-5 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>

        {complaint.adminReply && (
          <button
            type="button"
            disabled={saving}
            onClick={() => {
              if (window.confirm("Delete this reply?")) {
                save("", "Reply deleted.");
              }
            }}
            className="rounded-xl bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
          >
            Delete reply
          </button>
        )}
      </div>

      {note.text && (
        <p
          className={`mt-3 text-sm ${
            note.type === "ok" ? "text-green-400" : "text-red-400"
          }`}
        >
          {note.text}
        </p>
      )}
    </div>
  );
};

const AdminComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/admin/complaints`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load complaints.");
      }

      setComplaints(data.complaints || []);
    } catch (err) {
      setError(err.message || "Unable to load complaints.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(
    () => ({
      all: complaints.length,
      open: complaints.filter((c) => c.status === "open").length,
      "in-progress": complaints.filter((c) => c.status === "in-progress")
        .length,
      resolved: complaints.filter((c) => c.status === "resolved").length,
    }),
    [complaints]
  );

  const visible =
    filter === "all"
      ? complaints
      : complaints.filter((c) => c.status === filter);

  const handleSaved = (updated) => {
    setComplaints((current) =>
      current.map((c) => (c._id === updated._id ? updated : c))
    );
  };

  const tabs = [
    { value: "all", label: "All" },
    { value: "open", label: "Open" },
    { value: "in-progress", label: "In Progress" },
    { value: "resolved", label: "Resolved" },
  ];

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-2 text-sm font-medium text-purple-400">
            HELP & SUPPORT
          </p>

          <h1 className="text-3xl font-bold md:text-4xl">Complaints</h1>

          <p className="mt-2 text-slate-400">
            Complaints registered by citizens. Reply, edit or delete your reply
            and update the status.
          </p>
        </div>

        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="rounded-xl bg-purple-500 px-5 py-3 font-semibold text-white transition hover:bg-purple-400 disabled:opacity-50"
        >
          {loading ? "Loading..." : "🔄 Refresh"}
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400">
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setFilter(tab.value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              filter === tab.value
                ? "bg-cyan-500 text-slate-950"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {tab.label} ({counts[tab.value]})
          </button>
        ))}
      </div>

      {!loading && visible.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
          <div className="mb-4 text-5xl">📭</div>
          <h2 className="text-xl font-semibold">No complaints here</h2>
          <p className="mt-2 text-slate-400">
            Complaints from citizens will appear on this page.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {visible.map((complaint) => (
            <ComplaintCard
              key={complaint._id}
              complaint={complaint}
              onSaved={handleSaved}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminComplaints;