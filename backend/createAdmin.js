

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("./models/Admin");

const createAdmin = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017/smarttraffic"
    );
    console.log("MongoDB Connected");

    const existingAdmin = await Admin.findOne({ adminId: "ADMIN001" });

    if (existingAdmin) {
      console.log("Admin account already exists.");
      process.exit();
    }

    const hashedPassword = await bcrypt.hash("Admin@123", 10);

    const admin = await Admin.create({
      adminId: "ADMIN001",
      password: hashedPassword,
      name: "SmartTraffic Administrator",
      role: "admin",
      isActive: true,
    });

    console.log("✅ Admin account created successfully!");
    console.log("Admin ID:", admin.adminId);

    process.exit();
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

createAdmin();