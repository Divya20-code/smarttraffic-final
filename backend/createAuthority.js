require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Authority = require("./models/Authority");

const createAuthority = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017/smarttraffic"
    );
    console.log("MongoDB Connected");

    const existingOfficer = await Authority.findOne({ officerId: "ST-A001" });

    if (existingOfficer) {
      console.log("Authority account already exists.");
      process.exit();
    }

    const hashedPassword = await bcrypt.hash("SmartTraffic@123", 10);

    const authority = await Authority.create({
      officerId: "ST-A001",
      password: hashedPassword,
      name: "Traffic Control Officer",
      department: "Traffic Authority",
      role: "authority",
      isActive: true,
    });

    console.log("✅ Authority account created successfully!");
    console.log("Officer ID:", authority.officerId);

    process.exit();
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

createAuthority();