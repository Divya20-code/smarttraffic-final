

const mongoose = require("mongoose");

const authoritySchema = new mongoose.Schema(
  {
    officerId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    department: {
      type: String,
      default: "Traffic Authority",
      trim: true,
    },

    area: {
      type: String,
      default: "",
      trim: true,
    },

    role: {
      type: String,
      default: "authority",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Authority", authoritySchema);