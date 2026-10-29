import React from "react";

const LogoutModal = ({ onCancel, onLogout }) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">

      {/* Background */}
      <div
        onClick={onCancel}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      ></div>


      {/* Modal */}
      <div className="relative z-10 w-[90%] max-w-md rounded-2xl bg-[#151B2E] border border-purple-900/40 p-6 shadow-2xl">

        {/* Icon */}
        <div className="flex justify-center mb-5">

          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">

            <span className="text-2xl text-red-400">
              ↪
            </span>

          </div>

        </div>


        {/* Title */}
        <h2 className="text-xl font-semibold text-white text-center">
          Logout
        </h2>


        {/* Message */}
        <p className="text-gray-400 text-sm text-center mt-3">
          Are you sure you want to logout from SmartTraffic?
        </p>


        {/* Buttons */}
        <div className="flex gap-3 mt-7">

          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-700 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 transition"
          >
            Cancel
          </button>


          <button
            type="button"
            onClick={onLogout}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm text-white hover:bg-red-700 transition"
          >
            Logout
          </button>

        </div>

      </div>

    </div>
  );
};

export default LogoutModal;