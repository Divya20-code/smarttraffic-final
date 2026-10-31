const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    citizen: {
      userId: { type: String, default: "", trim: true },
      name: { type: String, default: "Citizen", trim: true },
      username: { type: String, default: "", trim: true, lowercase: true },
      email: { type: String, default: "", trim: true, lowercase: true },
    },
    topic: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ["open", "in-progress", "resolved"],
      default: "open",
    },
    adminReply: { type: String, default: "", trim: true, maxlength: 2000 },
    repliedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Complaint || mongoose.model("Complaint", complaintSchema);