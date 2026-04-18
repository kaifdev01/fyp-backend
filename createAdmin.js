const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/workdeck");
    console.log("Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "admin@workdesk.com" });
    if (existingAdmin) {
      console.log("Admin user already exists");
      process.exit(0);
    }

    // Create admin user
    const adminUser = await User.create({
      name: "Admin",
      email: "admin@workdesk.com",
      password: "Admin@1234",
      roles: ["admin"],
      primaryRole: "admin",
      isVerified: true,
      location: "Pakistan",
    });

    console.log("Admin user created successfully!");
    console.log("Email: admin@workdesk.com");
    console.log("Password: Admin@1234");
    console.log("User ID:", adminUser._id);

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  }
};

createAdminUser();
