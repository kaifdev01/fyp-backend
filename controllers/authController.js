const User = require("../models/User");
const TemporaryUser = require("../models/TemporaryUser");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const { asyncHandler } = require("../middleware/errorHandler");
const { sanitizeInput } = require("../middleware/validation");

// Valid roles
const VALID_ROLES = ['freelancer', 'client'];

// Register user
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, location } = req.body;

  // Validate required fields
  if (!name || !email || !password || !role) {
    return res.status(400).json({
      success: false,
      message: "Name, email, password, and role are required"
    });
  }

  // Validate role
  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({
      success: false,
      message: "Invalid role. Must be 'freelancer' or 'client'"
    });
  }

  // Sanitize inputs
  const sanitizedName = sanitizeInput(name);
  const sanitizedEmail = sanitizeInput(email.toLowerCase());
  const sanitizedLocation = sanitizeInput(location || '');

  // Check if user exists
  const existingUser = await User.findOne({ email: sanitizedEmail });
  if (existingUser) {
    // Check if user already has this role
    if (existingUser.roles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `You already have a ${role} account. Please login instead.`,
      });
    }

    // User wants to add a new role - send OTP for verification
    const otp = crypto.randomBytes(3).toString('hex').toUpperCase();
    const otpExpires = Date.now() + 10 * 60 * 1000;

    await TemporaryUser.findOneAndUpdate(
      { email: sanitizedEmail },
      {
        email: sanitizedEmail,
        otp,
        otpExpires,
        registrationData: {
          name: existingUser.name,
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
        email: sanitizedEmail,
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
      console.log(`Email failed, OTP for ${sanitizedEmail}: ${otp}`);
    }

    return res.status(201).json({
      success: true,
      message: `OTP sent to add ${role} role to your existing account.`,
      isAddingRole: true,
    });
  }

  // Generate OTP and store user data temporarily
  const otp = crypto.randomBytes(3).toString('hex').toUpperCase();
  const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  await TemporaryUser.findOneAndUpdate(
    { email: sanitizedEmail },
    {
      email: sanitizedEmail,
      otp,
      otpExpires,
      registrationData: {
        name: sanitizedName,
        password,
        role,
        location: sanitizedLocation,
      },
    },
    { upsert: true, new: true }
  );

  // Send OTP via email
  try {
    await sendEmail({
      email: sanitizedEmail,
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
    console.log(`Email failed, OTP for ${sanitizedEmail}: ${otp}`);
  }

  res.status(201).json({
    success: true,
    message: "OTP sent to your email. Please verify to complete registration.",
  });
});

// Login user
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required"
    });
  }

  const sanitizedEmail = sanitizeInput(email.toLowerCase());

  // Check if user exists and get password
  const user = await User.findOne({ email: sanitizedEmail }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ 
      success: false,
      message: "Invalid credentials" 
    });
  }

  // Check if user is verified
  if (!user.isVerified) {
    return res.status(401).json({
      success: false,
      message: "Please verify your email before logging in"
    });
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
});

// Verify OTP
const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: "Email and OTP are required"
    });
  }

  const sanitizedEmail = sanitizeInput(email.toLowerCase());
  const tempUser = await TemporaryUser.findOne({ email: sanitizedEmail });

  if (!tempUser) {
    return res.status(404).json({
      success: false,
      message: "Registration not found or expired"
    });
  }

  if (tempUser.otp !== otp.toUpperCase() || Date.now() > tempUser.otpExpires) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired OTP"
    });
  }

  const { registrationData } = tempUser;

  // Handle role addition or new user creation
  let user;
  if (registrationData.isAddingRole) {
    // Add new role to existing user
    user = await User.findById(registrationData.existingUserId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
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
  await TemporaryUser.deleteOne({ email: sanitizedEmail });

  const message = registrationData.isAddingRole
    ? `${registrationData.role} role added successfully`
    : "Email verified and account created successfully";

  res.json({
    success: true,
    message,
    isAddingRole: registrationData.isAddingRole || false,
    newRole: registrationData.isAddingRole ? registrationData.role : null,
  });
});

// Resend OTP
const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required"
    });
  }

  const sanitizedEmail = sanitizeInput(email.toLowerCase());
  const tempUser = await TemporaryUser.findOne({ email: sanitizedEmail });

  if (!tempUser) {
    return res.status(404).json({
      success: false,
      message: "Registration not found"
    });
  }

  // Generate new OTP
  const otp = crypto.randomBytes(3).toString('hex').toUpperCase();
  const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Update pending registration with new OTP
  tempUser.otp = otp;
  tempUser.otpExpires = otpExpires;
  await tempUser.save();

  // Send new OTP via email
  try {
    await sendEmail({
      email: sanitizedEmail,
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
    console.log(`Email failed, OTP for ${sanitizedEmail}: ${otp}`);
  }

  res.json({ success: true, message: "New OTP sent to your email" });
});

// Complete profile for clients
const completeProfile = asyncHandler(async (req, res) => {
  const { email, companyName, companySize, website } = req.body;

  if (!email || !companyName || !companySize) {
    return res.status(400).json({
      success: false,
      message: "Email, company name, and company size are required"
    });
  }

  const sanitizedEmail = sanitizeInput(email.toLowerCase());
  const user = await User.findOne({ email: sanitizedEmail });
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found"
    });
  }

  // Update user profile
  user.companySize = sanitizeInput(companySize);
  user.industry = sanitizeInput(companyName);
  if (website) {
    user.bio = sanitizeInput(website);
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
});

// Complete profile for freelancers
const completeFreelancerProfile = asyncHandler(async (req, res) => {
  const { email, skills, experience, hourlyRate, bio, title, description } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required"
    });
  }

  const sanitizedEmail = sanitizeInput(email.toLowerCase());
  const user = await User.findOne({ email: sanitizedEmail });
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found"
    });
  }

  // Update freelancer profile with flexible field handling
  if (skills) {
    user.skills = Array.isArray(skills) ? skills.map(skill => sanitizeInput(skill)) : [sanitizeInput(skills)];
  }
  if (experience) {
    user.experience = sanitizeInput(experience);
  }
  if (hourlyRate) {
    user.hourlyRate = parseFloat(hourlyRate);
  }
  if (bio || description) {
    user.bio = sanitizeInput(bio || description);
  }
  if (title) {
    user.title = sanitizeInput(title);
  }

  await user.save();

  const token = user.generateToken();

  res.json({
    success: true,
    message: "Freelancer profile completed successfully",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      roles: user.roles,
      primaryRole: user.primaryRole,
    },
  });
});

// Switch user role
const switchRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const userId = req.user.id;

  if (!role) {
    return res.status(400).json({
      success: false,
      message: "Role is required"
    });
  }

  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({
      success: false,
      message: "Invalid role"
    });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found"
    });
  }

  if (!user.roles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: "You don't have access to this role"
    });
  }

  user.primaryRole = role;
  await user.save();

  res.json({
    success: true,
    message: "Role switched successfully",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      roles: user.roles,
      primaryRole: user.primaryRole,
    },
  });
});

module.exports = {
  register,
  login,
  verifyOTP,
  resendOTP,
  completeProfile,
  completeFreelancerProfile,
  switchRole,
};