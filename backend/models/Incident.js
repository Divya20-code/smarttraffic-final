


const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema(
  {
    citizen: {
      userId: {
        type: String,
        default: "",
        trim: true,
      },
      name: {
        type: String,
        default: "Citizen",
        trim: true,
      },
      username: {
        type: String,
        default: "",
        trim: true,
        lowercase: true,
      },
      email: {
        type: String,
        default: "",
        trim: true,
        lowercase: true,
      },
    },

    incidentType: {
      type: String,
      required: true,
      trim: true,
    },
    severity: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    image: {
      type: String,
      default: "",
    },

    location: {
      address: {
        type: String,
        default: "",
        trim: true,
      },
      latitude: {
        type: Number,
        default: null,
      },
      longitude: {
        type: Number,
        default: null,
      },
    },

    aiAssessment: {
      incidentType: {
        type: String,
        default: "",
      },
      severity: {
        type: String,
        default: "",
      },
      riskIndicators: {
        type: [String],
        default: [],
      },
      summary: {
        type: String,
        default: "",
      },
      recommendation: {
        type: String,
        default: "",
      },
    },

    status: {
      type: String,
      default: "reported",
      trim: true,
      lowercase: true,
    },
    assignedTeam: {
      type: String,
      default: "",
      trim: true,
    },
    resolutionNote: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

module.exports =
  mongoose.models.Incident ||
  mongoose.model("Incident", incidentSchema);