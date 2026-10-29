



require("dotenv").config();
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/smarttraffic";
    await mongoose.connect(uri);

    console.log("MongoDB Connected Successfully 🚦");
  } catch (error) {
    console.error("MongoDB Connection Failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;