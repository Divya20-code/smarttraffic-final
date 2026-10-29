


import React, { useEffect, useState } from "react";

const AdminAuthorities = () => {
  const [authorities, setAuthorities] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    officerId: "",
    password: "",
    name: "",
    department: "Traffic Authority",
  });

  const [formLoading, setFormLoading] = useState(false);

  // ==================================================
  // FETCH AUTHORITIES
  // ==================================================

  useEffect(() => {
    fetchAuthorities();
  }, []);

  const fetchAuthorities = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/admin/authorities"
      );

      const data = await response.json();

      console.log("Authorities:", data);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load authorities."
        );
      }

      setAuthorities(data.authorities || []);
    } catch (error) {
      console.error("Authority Fetch Error:", error);

      setError(
        "Unable to load authorities. Make sure backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // FORM CHANGE
  // ==================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==================================================
  // ADD AUTHORITY
  // ==================================================

  const handleAddAuthority = async (e) => {
    e.preventDefault();

    setError("");

    if (
      !formData.officerId ||
      !formData.password ||
      !formData.name
    ) {
      setError(
        "Please fill Officer ID, Password and Name."
      );
      return;
    }

    try {
      setFormLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/admin/authorities",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      console.log("Add Authority:", data);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to create authority."
        );
      }

      // Refresh list
      await fetchAuthorities();

      // Reset form
      setFormData({
        officerId: "",
        password: "",
        name: "",
        department: "Traffic Authority",
      });

      setShowForm(false);
    } catch (error) {
      console.error("Add Authority Error:", error);

      setError(
        error.message || "Unable to create authority."
      );
    } finally {
      setFormLoading(false);
    }
  };

  // ==================================================
  // TOGGLE ACTIVE STATUS
  // ==================================================

  const toggleAuthority = async (authority) => {
    try {
      setError("");

      const response = await fetch(
        `http://localhost:5000/api/admin/authorities/${authority._id}/status`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            isActive: !authority.isActive,
          }),
        }
      );

      const data = await response.json();

      console.log("Authority Status:", data);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to update authority status."
        );
      }

      await fetchAuthorities();
    } catch (error) {
      console.error(
        "Authority Status Error:",
        error
      );

      setError(
        error.message ||
          "Unable to update authority status."
      );
    }
  };

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">
            ⏳
          </div>

          <p className="text-slate-300">
            Loading authorities...
          </p>
        </div>
      </div>
    );
  }

  // ==================================================
  // UI
  // ==================================================

  return (
    <div>
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <p className="text-purple-400 text-sm font-medium mb-2">
            AUTHORITY MANAGEMENT
          </p>

          <h1 className="text-3xl md:text-4xl font-bold">
            Authority Management
          </h1>

          <p className="text-slate-400 mt-2">
            Manage SmartTraffic authority officers and
            their access.
          </p>
        </div>

        <button
          onClick={() => {
            setShowForm(!showForm);
            setError("");
          }}
          className="
            px-5 py-3
            rounded-xl
            bg-purple-500
            hover:bg-purple-400
            text-white
            font-semibold
            transition
          "
        >
          {showForm
            ? "✕ Close Form"
            : "➕ Add Authority"}
        </button>
      </div>

      {/* ==================================================
          ERROR
      ================================================== */}

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* ==================================================
          ADD AUTHORITY FORM
      ================================================== */}

      {showForm && (
        <div className="mb-8 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-1">
            Add New Authority
          </h2>

          <p className="text-slate-400 text-sm mb-6">
            Create login credentials for a new traffic
            authority officer.
          </p>

          <form
            onSubmit={handleAddAuthority}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            {/* Officer ID */}
            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Officer ID
              </label>

              <input
                type="text"
                name="officerId"
                value={formData.officerId}
                onChange={handleChange}
                placeholder="Example: ST-A002"
                className="
                  w-full
                  bg-slate-800
                  border border-slate-700
                  rounded-xl
                  px-4 py-3
                  text-white
                  outline-none
                  focus:border-purple-400
                "
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Password
              </label>

              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
                className="
                  w-full
                  bg-slate-800
                  border border-slate-700
                  rounded-xl
                  px-4 py-3
                  text-white
                  outline-none
                  focus:border-purple-400
                "
              />
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Officer Name
              </label>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter officer name"
                className="
                  w-full
                  bg-slate-800
                  border border-slate-700
                  rounded-xl
                  px-4 py-3
                  text-white
                  outline-none
                  focus:border-purple-400
                "
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Department
              </label>

              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="
                  w-full
                  bg-slate-800
                  border border-slate-700
                  rounded-xl
                  px-4 py-3
                  text-white
                  outline-none
                  focus:border-purple-400
                "
              >
                <option value="Traffic Authority">
                  Traffic Authority
                </option>

                <option value="Police Department">
                  Police Department
                </option>

                <option value="Municipal Authority">
                  Municipal Authority
                </option>

                <option value="Emergency Response">
                  Emergency Response
                </option>
              </select>
            </div>

            {/* Submit */}
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={formLoading}
                className="
                  px-6 py-3
                  rounded-xl
                  bg-cyan-500
                  hover:bg-cyan-400
                  disabled:opacity-50
                  text-slate-950
                  font-bold
                  transition
                "
              >
                {formLoading
                  ? "Creating..."
                  : "Create Authority"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================================================
          SUMMARY
      ================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-slate-400 text-sm">
            Total Authorities
          </p>

          <p className="text-3xl font-bold mt-2">
            {authorities.length}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-slate-400 text-sm">
            Active
          </p>

          <p className="text-3xl font-bold text-green-400 mt-2">
            {
              authorities.filter(
                (authority) => authority.isActive
              ).length
            }
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-slate-400 text-sm">
            Inactive
          </p>

          <p className="text-3xl font-bold text-red-400 mt-2">
            {
              authorities.filter(
                (authority) => !authority.isActive
              ).length
            }
          </p>
        </div>
      </div>

      {/* ==================================================
          AUTHORITY TABLE
      ================================================== */}

      {authorities.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
          <div className="text-5xl mb-4">
            👮
          </div>

          <h2 className="text-xl font-semibold">
            No authorities found
          </h2>

          <p className="text-slate-400 mt-2">
            Add your first authority officer to the
            system.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/70">
                <tr>
                  <th className="text-left px-5 py-4 text-slate-400 font-medium">
                    Officer ID
                  </th>

                  <th className="text-left px-5 py-4 text-slate-400 font-medium">
                    Name
                  </th>

                  <th className="text-left px-5 py-4 text-slate-400 font-medium">
                    Department
                  </th>

                  <th className="text-left px-5 py-4 text-slate-400 font-medium">
                    Role
                  </th>

                  <th className="text-left px-5 py-4 text-slate-400 font-medium">
                    Status
                  </th>

                  <th className="text-left px-5 py-4 text-slate-400 font-medium">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {authorities.map((authority) => (
                  <tr
                    key={authority._id}
                    className="
                      border-t border-slate-800
                      hover:bg-slate-800/40
                      transition
                    "
                  >
                    {/* Officer ID */}
                    <td className="px-5 py-4">
                      <span className="text-cyan-400 font-semibold">
                        {authority.officerId}
                      </span>
                    </td>

                    {/* Name */}
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-white font-medium">
                          {authority.name}
                        </p>

                        <p className="text-xs text-slate-500 mt-1">
                          Created{" "}
                          {authority.createdAt
                            ? new Date(
                                authority.createdAt
                              ).toLocaleDateString(
                                "en-GB"
                              )
                            : "N/A"}
                        </p>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="px-5 py-4 text-slate-300">
                      {authority.department ||
                        "Traffic Authority"}
                    </td>

                    {/* Role */}
                    <td className="px-5 py-4">
                      <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-semibold">
                        {authority.role ||
                          "authority"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      {authority.isActive ? (
                        <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-semibold">
                          ● Active
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-semibold">
                          ● Inactive
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4">
                      <button
                        onClick={() =>
                          toggleAuthority(authority)
                        }
                        className={`
                          px-4 py-2
                          rounded-lg
                          text-xs
                          font-semibold
                          transition
                          ${
                            authority.isActive
                              ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                              : "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                          }
                        `}
                      >
                        {authority.isActive
                          ? "Deactivate"
                          : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Refresh */}
      <div className="mt-5 flex justify-end">
        <button
          onClick={fetchAuthorities}
          className="
            px-5 py-2.5
            rounded-xl
            border border-slate-700
            bg-slate-900
            hover:bg-slate-800
            text-slate-300
            transition
          "
        >
          🔄 Refresh
        </button>
      </div>
    </div>
  );
};

export default AdminAuthorities;