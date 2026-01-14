const User = require("../models/User");
const TemporaryUser = require("../models/TemporaryUser");
const { validationResult } = require("express-validator");
const sendEmail = require("../utils/sendEmail");

// Register user
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role, location } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // Check if user already has this role
      if (existingUser.roles.includes(role)) {
        return res.status(400).json({
          message: `You already have a ${role} account. Please login instead.`,
        });
      }

      // User wants to add a new role - send OTP for verification
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = Date.now() + 10 * 60 * 1000;

      await TemporaryUser.findOneAndUpdate(
        { email },
        {
          email,
          otp,
          otpExpires,
          registrationData: {
            name: existingUser.name,
            password: existingUser.password,
            role,
            location: existingUser.location,
            isAddingRole: true,
            existingUserId: existingUser._id,
          },
        },
        { upsert: true, new: true }
      );

      try {
        await sendEmail({
          email,
          subject: "WorkDeck - Add New Role Verification",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Add ${role} Role to Your Account</h2>
              <p>You're adding a ${role} role to your existing WorkDeck account.</p>
              <p>Your verification code is:</p>
              <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
                <h1 style="color: #1f2937; font-size: 32px; margin: 0;">${otp}</h1>
              </div>
              <p>This code will expire in 10 minutes.</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.log(`Email failed, OTP for ${email}: ${otp}`);
      }

      return res.status(201).json({
        success: true,
        message: `OTP sent to add ${role} role to your existing account.`,
        isAddingRole: true,
      });
    }

    // Generate OTP and store user data temporarily
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await TemporaryUser.findOneAndUpdate(
      { email },
      {
        email,
        otp,
        otpExpires,
        registrationData: {
          name,
          password,
          role,
          location,
        },
      },
      { upsert: true, new: true }
    );

    // Send OTP via email
    try {
      await sendEmail({
        email,
        subject: "WorkDeck - Email Verification",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Welcome to WorkDeck!</h2>
            <p>Your email verification code is:</p>
            <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #1f2937; font-size: 32px; margin: 0;">${otp}</h1>
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.log(`Email failed, OTP for ${email}: ${otp}`);
    }

    res.status(201).json({
      success: true,
      message:
        "OTP sent to your email. Please verify to complete registration.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists and get password
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = user.generateToken();

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        primaryRole: user.primaryRole,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify OTP
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const tempUser = await TemporaryUser.findOne({ email });

    if (!tempUser) {
      return res
        .status(404)
        .json({ message: "Registration not found or expired" });
    }

    if (tempUser.otp !== otp || Date.now() > tempUser.otpExpires) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const { registrationData } = tempUser;

    // Handle role addition or new user creation
    let user;
    if (registrationData.isAddingRole) {
      // Add new role to existing user
      user = await User.findById(registrationData.existingUserId);
      if (!user.roles.includes(registrationData.role)) {
        user.roles.push(registrationData.role);
        await user.save();
      }
    } else {
      // Create new user
      user = await User.create({
        name: registrationData.name,
        email: tempUser.email,
        password: registrationData.password,
        roles: [registrationData.role],
        primaryRole: registrationData.role,
        location: registrationData.location,
        isVerified: true,
      });
    }

    // Remove from temporary users
    await TemporaryUser.deleteOne({ email });

    const message = registrationData.isAddingRole
      ? `${registrationData.role} role added successfully`
      : "Email verified and account created successfully";

    res.json({
      success: true,
      message,
      isAddingRole: registrationData.isAddingRole || false,
      newRole: registrationData.isAddingRole ? registrationData.role : null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Resend OTP
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const tempUser = await TemporaryUser.findOne({ email });

    if (!tempUser) {
      return res.status(404).json({ message: "Registration not found" });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Update pending registration with new OTP
    tempUser.otp = otp;
    tempUser.otpExpires = otpExpires;
    await tempUser.save();

    // Send new OTP via email
    try {
      await sendEmail({
        email,
        subject: "WorkDeck - Email Verification (Resent)",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">WorkDeck Email Verification</h2>
            <p>Your new verification code is:</p>
            <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #1f2937; font-size: 32px; margin: 0;">${otp}</h1>
            </div>
            <p>This code will expire in 10 minutes.</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.log(`Email failed, OTP for ${email}: ${otp}`);
    }

    res.json({ success: true, message: "New OTP sent to your email" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Complete profile for clients
const completeProfile = async (req, res) => {
  try {
    const { email, companyName, companySize, website } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user profile
    user.companySize = companySize;
    user.industry = companyName; // Using industry field for company name
    if (website) {
      user.bio = website; // Using bio field for website
    }

    await user.save();

    const token = user.generateToken();

    res.json({
      success: true,
      message: "Profile completed successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        primaryRole: user.primaryRole,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Complete profile for freelancers
const completeFreelancerProfile = async (req, res) => {
  try {
    const { email, bio, skills, phone, hourlyRate } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user profile
    user.bio = bio;
    user.skills = skills.split(",").map((skill) => skill.trim());
    user.phone = phone;
    user.hourlyRate = hourlyRate;

    await user.save();

    const token = user.generateToken();

    res.json({
      success: true,
      message: "Profile completed successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        primaryRole: user.primaryRole,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Complete profile for OAuth users
const completeOAuthProfile = async (req, res) => {
  try {
    const {
      email,
      companyName,
      companySize,
      website,
      role = "client",
      bio,
      skills,
      phone,
      hourlyRate,
    } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user for OAuth
      const userData = {
        name: email.split("@")[0],
        email,
        password: "oauth-user",
        roles: [role],
        primaryRole: role,
        isVerified: true,
      };

      // Add role-specific fields
      if (role === "client") {
        userData.companySize = companySize;
        userData.industry = companyName;
        userData.bio = website || "";
      } else if (role === "freelancer") {
        userData.bio = bio;
        userData.skills = skills
          ? skills.split(",").map((skill) => skill.trim())
          : [];
        userData.phone = phone;
        userData.hourlyRate = hourlyRate;
      }

      user = await User.create(userData);
    } else {
      // User exists - check if role already exists
      if (user.roles.includes(role)) {
        // Role already exists, just update profile
      } else {
        // Add new role
        user.roles.push(role);
      }

      // Update existing user with new profile data
      if (role === "client") {
        user.companySize = companySize;
        user.industry = companyName;
        if (website) user.bio = website;
      } else if (role === "freelancer") {
        user.bio = bio;
        user.skills = skills
          ? skills.split(",").map((skill) => skill.trim())
          : user.skills;
        user.phone = phone;
        user.hourlyRate = hourlyRate;
      }

      // If primary role is pending, update it
      if (user.primaryRole === "pending") {
        user.primaryRole = role;
      }

      await user.save();
    }

    const token = user.generateToken();

    res.json({
      success: true,
      message: "Profile completed successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        primaryRole: user.primaryRole,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// OAuth login/signup with account linking
const oauthLogin = async (req, res) => {
  try {
    const { email, name, provider, providerId, role } = req.body;

    // Normalize email (case-insensitive)
    const normalizedEmail = email.toLowerCase();

    // Check if user exists by email
    let user = await User.findOne({ email: normalizedEmail });
    let isNewUser = false;
    let needsRoleSelection = false;
    let needsProfileCompletion = false;

    if (user) {
      // User exists - link OAuth account if not already linked
      const providerField = provider === "google" ? "googleId" : "githubId";

      if (!user[providerField]) {
        // Link OAuth account to existing user
        user[providerField] = providerId;
        await user.save();
      }

      // If user has pending role and role is provided, update it
      if ((user.primaryRole === "pending" || !user.primaryRole) && role) {
        user.primaryRole = role;
        if (!user.roles.includes(role)) {
          user.roles.push(role);
        }
        await user.save();
        needsProfileCompletion = true;
      } else if (user.primaryRole === "pending" || !user.primaryRole) {
        // No role provided and user has pending role
        needsRoleSelection = true;
      } else {
        // User has a valid role - check if profile is complete based on role
        let isProfileComplete = false;

        if (user.primaryRole === "client") {
          // Client profile is complete if they have companySize
          isProfileComplete = !!user.companySize;
        } else if (user.primaryRole === "freelancer") {
          // Freelancer profile is complete if they have skills and hourlyRate
          isProfileComplete = user.skills?.length > 0 && user.hourlyRate;
        }

        if (!isProfileComplete) {
          needsProfileCompletion = true;
        }
      }
    } else {
      // Create new OAuth user
      const userData = {
        name,
        email: normalizedEmail,
        password: "oauth-user",
        roles: role ? [role] : ["pending"],
        primaryRole: role || "pending",
        isVerified: true,
      };

      // Set provider ID
      if (provider === "google") {
        userData.googleId = providerId;
      } else if (provider === "github") {
        userData.githubId = providerId;
      }

      user = await User.create(userData);
      isNewUser = true;

      if (role) {
        needsProfileCompletion = true;
      } else {
        needsRoleSelection = true;
      }
    }

    const token = user.generateToken();

    res.json({
      success: true,
      token,
      isNewUser,
      needsRoleSelection,
      needsProfileCompletion,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        primaryRole: user.primaryRole,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get current user
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Switch primary role
const switchRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.user.id);

    if (!user.roles.includes(role)) {
      return res
        .status(400)
        .json({ message: "You do not have access to this role" });
    }

    user.primaryRole = role;
    await user.save();

    res.json({
      success: true,
      message: `Switched to ${role} role`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        primaryRole: user.primaryRole,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user role (for role-selection page)
const updateRole = async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ message: "Email and role are required" });
    }

    if (!["client", "freelancer"].includes(role)) {
      return res
        .status(400)
        .json({ message: "Invalid role. Must be client or freelancer" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update primary role
    user.primaryRole = role;

    // Add role to roles array if not already present
    if (!user.roles.includes(role)) {
      user.roles.push(role);
    }

    await user.save();

    const token = user.generateToken();

    res.json({
      success: true,
      message: "Role updated successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        primaryRole: user.primaryRole,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create account without role (Upwork-style)
const createAccount = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, country } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        message: "An account with this email already exists. Please log in instead." 
      });
    }

    // Create user with pending role
    const user = await User.create({
      name,
      email,
      password,
      roles: [],
      primaryRole: "pending",
      location: country,
      isVerified: true // Skip email verification for now
    });

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        primaryRole: user.primaryRole
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
  verifyOTP,
  resendOTP,
  completeProfile,
  completeFreelancerProfile,
  completeOAuthProfile,
  oauthLogin,
  getMe,
  switchRole,
  updateRole,
  createAccount,
};
