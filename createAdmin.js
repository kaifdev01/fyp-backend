const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/workdeck");
    console.log("Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "admin@gmail.com" });
    if (existingAdmin) {
      console.log("Admin user already exists");
      process.exit(0);
    }

    // Create admin user
    const adminUser = await User.create({
      name: "Admin User",
      email: "admin@gmail.com",
      password: "Admin@123",
      roles: ["admin"],
      primaryRole: "admin",
      isVerified: true,
      location: "Pakistan",
    });

    console.log("Admin user created successfully!");
    console.log("Email: admin@gmail.com");
    console.log("Password: Admin@123");
    console.log("User ID:", adminUser._id);

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  }
};

createAdminUser();
