const User = require("../models/User");
const TemporaryUser = require("../models/TemporaryUser");
const Notification = require("../models/Notification");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const { asyncHandler } = require("../middleware/errorHandler");
const { sanitizeInput = (val) => val } = require("../middleware/validation");

// Valid roles
const VALID_ROLES = ["freelancer", "client"];

// Register user
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, location } = req.body;

  // Validate required fields
  if (!name || !email || !password || !role) {
    return res.status(400).json({
      success: false,
      message: "Name, email, password, and role are required",
    });
  }

  // Validate role
  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({
      success: false,
      message: "Invalid role. Must be 'freelancer' or 'client'",
    });
  }

  // Sanitize inputs
  const sanitizedName = sanitizeInput(name);
  const sanitizedEmail = sanitizeInput(email.toLowerCase());
  const sanitizedLocation = sanitizeInput(location || "");

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
    const otp = crypto.randomBytes(3).toString("hex").toUpperCase();
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
  const otp = crypto.randomBytes(3).toString("hex").toUpperCase();
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
      message: "Email and password are required",
    });
  }

  const sanitizedEmail = sanitizeInput(email.toLowerCase());

  // Check if user exists and get password
  const user = await User.findOne({ email: sanitizedEmail }).select(
    "+password"
  );
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  }

  // Check if user is verified
  if (!user.isVerified) {
    return res.status(401).json({
      success: false,
      message: "Please verify your email before logging in",
    });
  }

  // Generate 2FA OTP
  const otp = crypto.randomBytes(3).toString("hex").toUpperCase();
  const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Store OTP in temporary collection
  await TemporaryUser.findOneAndUpdate(
    { email: sanitizedEmail },
    {
      email: sanitizedEmail,
      otp,
      otpExpires,
      registrationData: {
        userId: user._id,
        is2FA: true,
      },
    },
    { upsert: true, new: true }
  );

  // Send 2FA OTP via email
  try {
    await sendEmail({
      email: sanitizedEmail,
      subject: "WorkDeck - Login Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Login Verification</h2>
          <p>Someone is trying to log in to your WorkDeck account.</p>
          <p>Your verification code is:</p>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #1f2937; font-size: 32px; margin: 0;">${otp}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't attempt to log in, please ignore this email and change your password immediately.</p>
        </div>
      `,
    });
  } catch (emailError) {
    console.log(`Email failed, 2FA OTP for ${sanitizedEmail}: ${otp}`);
  }

  res.json({
    success: true,
    requires2FA: true,
    message: "Verification code sent to your email",
  });
});

// Verify 2FA OTP for login
const verify2FA = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: "Email and OTP are required",
    });
  }

  const sanitizedEmail = sanitizeInput(email.toLowerCase());
  const tempUser = await TemporaryUser.findOne({ email: sanitizedEmail });

  if (!tempUser || !tempUser.registrationData?.is2FA) {
    return res.status(404).json({
      success: false,
      message: "2FA session not found or expired",
    });
  }

  if (tempUser.otp !== otp.toUpperCase() || Date.now() > tempUser.otpExpires) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired OTP",
    });
  }

  // Get user
  const user = await User.findById(tempUser.registrationData.userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // Update last activity on login
  user.lastActivity = new Date();
  await user.save({ validateBeforeSave: false });

  // Remove from temporary users
  await TemporaryUser.deleteOne({ email: sanitizedEmail });

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
      message: "Email and OTP are required",
    });
  }

  const sanitizedEmail = sanitizeInput(email.toLowerCase());
  const tempUser = await TemporaryUser.findOne({ email: sanitizedEmail });

  if (!tempUser) {
    return res.status(404).json({
      success: false,
      message: "Registration not found or expired",
    });
  }

  if (tempUser.otp !== otp.toUpperCase() || Date.now() > tempUser.otpExpires) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired OTP",
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
        message: "User not found",
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

// Resend 2FA OTP
const resend2FA = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });
  }

  const sanitizedEmail = sanitizeInput(email.toLowerCase());
  
  // Check if user exists
  const user = await User.findOne({ email: sanitizedEmail });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // Generate new OTP
  const otp = crypto.randomBytes(3).toString("hex").toUpperCase();
  const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Update OTP on existing 2FA session, or create a new one
  const existing = await TemporaryUser.findOne({ email: sanitizedEmail });
  if (existing && existing.registrationData?.is2FA) {
    existing.otp = otp;
    existing.otpExpires = otpExpires;
    await existing.save();
  } else {
    await TemporaryUser.findOneAndUpdate(
      { email: sanitizedEmail },
      {
        email: sanitizedEmail,
        otp,
        otpExpires,
        registrationData: {
          userId: user._id,
          is2FA: true,
        },
      },
      { upsert: true, new: true }
    );
  }

  // Send new OTP via email
  try {
    await sendEmail({
      email: sanitizedEmail,
      subject: "WorkDeck - Login Verification Code (Resent)",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Login Verification</h2>
          <p>Your new verification code is:</p>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #1f2937; font-size: 32px; margin: 0;">${otp}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `,
    });
  } catch (emailError) {
    console.log(`Email failed, 2FA OTP for ${sanitizedEmail}: ${otp}`);
  }

  res.json({ success: true, message: "New verification code sent to your email" });
});

// Resend OTP
const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });
  }

  const sanitizedEmail = sanitizeInput(email.toLowerCase());
  const tempUser = await TemporaryUser.findOne({ email: sanitizedEmail });

  if (!tempUser) {
    return res.status(404).json({
      success: false,
      message: "Registration not found",
    });
  }

  // Generate new OTP
  const otp = crypto.randomBytes(3).toString("hex").toUpperCase();
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
  const {
    email,
    companyName,
    companySize,
    website,
    industry,
    companyDescription,
    companyLogo,
    phone,
    budgetRange,
    preferredSkills,
    projectTypes,
  } = req.body;

  if (!email || !companyName || !companySize) {
    return res.status(400).json({
      success: false,
      message: "Email, company name, and company size are required",
    });
  }

  const sanitizedEmail = sanitizeInput(email.toLowerCase());
  const user = await User.findOne({ email: sanitizedEmail });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // Update user profile
  user.companySize = sanitizeInput(companySize);
  user.industry = sanitizeInput(industry || companyName);
  if (website) {
    user.bio = sanitizeInput(website);
  }
  if (companyDescription) {
    user.companyDescription = sanitizeInput(companyDescription);
  }
  if (companyLogo) {
    user.companyLogo = sanitizeInput(companyLogo);
  }
  if (phone) {
    user.phone = sanitizeInput(phone);
  }
  if (budgetRange) {
    user.budgetRange = sanitizeInput(budgetRange);
  }
  if (preferredSkills && Array.isArray(preferredSkills)) {
    user.preferredSkills = preferredSkills.map((skill) =>
      sanitizeInput(skill)
    );
  }
  if (projectTypes && Array.isArray(projectTypes)) {
    user.projectTypes = projectTypes.map((type) => sanitizeInput(type));
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
  const {
    email,
    skills,
    experience,
    hourlyRate,
    bio,
    title,
    phone,
    avatar,
    timezone,
    languages,
    education,
    portfolio,
    isAvailable,
    kyc,
  } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });
  }

  // Validate hourly rate
  if (hourlyRate && (hourlyRate < 5 || hourlyRate > 500)) {
    return res.status(400).json({
      success: false,
      message: "Hourly rate must be between $5 and $500",
    });
  }

  const sanitizedEmail = sanitizeInput(email.toLowerCase());
  const user = await User.findOne({ email: sanitizedEmail });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // Update freelancer profile
  if (skills) {
    user.skills = Array.isArray(skills)
      ? skills.map((skill) => sanitizeInput(skill))
      : [sanitizeInput(skills)];
  }
  if (experience) {
    if (!["beginner", "intermediate", "expert"].includes(experience)) {
      return res.status(400).json({
        success: false,
        message: "Invalid experience level",
      });
    }
    user.experience = experience;
  }
  if (hourlyRate) {
    user.hourlyRate = parseFloat(hourlyRate);
  }
  if (bio) {
    if (bio.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Bio cannot exceed 500 characters",
      });
    }
    user.bio = sanitizeInput(bio);
  }
  if (title) {
    user.title = sanitizeInput(title);
  }
  if (phone) {
    user.phone = sanitizeInput(phone);
  }
  if (avatar) {
    user.avatar = sanitizeInput(avatar);
  }
  if (timezone) {
    user.timezone = sanitizeInput(timezone);
  }
  if (isAvailable !== undefined) {
    user.isAvailable = isAvailable;
  }

  // Update languages
  if (languages && Array.isArray(languages)) {
    user.languages = languages.map((lang) => ({
      language: sanitizeInput(lang.language),
      proficiency: lang.proficiency,
    }));
  }

  // Update education
  if (education && Array.isArray(education)) {
    user.education = education.map((edu) => ({
      school: sanitizeInput(edu.school),
      degree: sanitizeInput(edu.degree),
      field: sanitizeInput(edu.field),
      startYear: sanitizeInput(edu.startYear),
      endYear: sanitizeInput(edu.endYear),
      description: sanitizeInput(edu.description),
    }));
  }

  // Update portfolio
  if (portfolio && Array.isArray(portfolio)) {
    user.portfolio = portfolio.map((item) => ({
      title: sanitizeInput(item.title),
      description: sanitizeInput(item.description),
      image: sanitizeInput(item.image),
      url: sanitizeInput(item.url),
      media: Array.isArray(item.media)
        ? item.media.map((media) => ({
            url: sanitizeInput(media.url),
            type: media.type,
            name: sanitizeInput(media.name),
          }))
        : [],
      createdAt: item.createdAt || new Date(),
    }));
  }

  // Update KYC data if provided
  if (kyc) {
    user.kyc = {
      status: "pending",
      documentType: sanitizeInput(kyc.documentType),
      documentNumber: sanitizeInput(kyc.documentNumber),
      documentImage: sanitizeInput(kyc.documentImage),
      selfieImage: sanitizeInput(kyc.selfieImage),
      dateOfBirth: kyc.dateOfBirth ? new Date(kyc.dateOfBirth) : null,
      country: sanitizeInput(kyc.country),
      address: sanitizeInput(kyc.address),
      city: sanitizeInput(kyc.city),
      postalCode: sanitizeInput(kyc.postalCode),
    };

    // Create notification for admins
    await Notification.create({
      userId: user._id,
      recipientType: "admin",
      type: "kyc_submitted",
      title: "New KYC Submission",
      message: `${user.name} has submitted KYC for verification`,
      data: {
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
      },
    });
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
      message: "Role is required",
    });
  }

  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({
      success: false,
      message: "Invalid role",
    });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  if (!user.roles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: "You don't have access to this role",
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

// OAuth login handler
const oauthLogin = asyncHandler(async (req, res) => {
  const { email, name, provider, providerId, role } = req.body;

  if (!email || !name || !provider) {
    return res.status(400).json({
      success: false,
      message: "Email, name, and provider are required",
    });
  }

  const sanitizedEmail = sanitizeInput(email.toLowerCase());
  const sanitizedName = sanitizeInput(name);

  // Check if user exists
  let user = await User.findOne({ email: sanitizedEmail });

  if (user) {
    // Existing user - handle role addition or login
    if (role && !user.roles.includes(role)) {
      // Adding new role
      user.roles.push(role);
      await user.save();

      const token = user.generateToken();
      return res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          roles: user.roles,
          primaryRole: user.primaryRole,
        },
        needsProfileCompletion: true,
      });
    }

    // Regular login
    const token = user.generateToken();
    return res.json({
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
  }

  // New user
  if (!role) {
    return res.json({
      success: true,
      needsRoleSelection: true,
    });
  }

  // Create new user with role
  user = await User.create({
    name: sanitizedName,
    email: sanitizedEmail,
    roles: [role],
    primaryRole: role,
    isVerified: true,
    oauthProvider: provider,
    oauthId: providerId,
  });

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
    needsProfileCompletion: true,
  });
});

// Update user role (for OAuth users)
const updateRole = asyncHandler(async (req, res) => {
  const { email, role } = req.body;

  if (!email || !role) {
    return res.status(400).json({
      success: false,
      message: "Email and role are required",
    });
  }

  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({
      success: false,
      message: "Invalid role",
    });
  }

  const sanitizedEmail = sanitizeInput(email.toLowerCase());
  const userName = sanitizedEmail.split("@")[0];

  const user = await User.create({
    name: userName,
    email: sanitizedEmail,
    password: crypto.randomBytes(32).toString("hex"), // Random password for OAuth users
    roles: [role],
    primaryRole: role,
    isVerified: true,
  });

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

// Update user profile
const updateProfile = asyncHandler(async (req, res) => {
  const {
    bio,
    location,
    hourlyRate,
    phone,
    skills,
    languages,
    isAvailable,
    avatar,
    title,
    timezone,
    experience,
  } = req.body;
  const userId = req.user.id;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // Update user fields
  if (bio !== undefined) user.bio = sanitizeInput(bio);
  if (location !== undefined) user.location = sanitizeInput(location);
  if (hourlyRate !== undefined) user.hourlyRate = parseFloat(hourlyRate) || 0;
  if (phone !== undefined) user.phone = sanitizeInput(phone);
  if (avatar !== undefined) user.avatar = sanitizeInput(avatar);
  if (title !== undefined) user.title = sanitizeInput(title);
  if (timezone !== undefined) user.timezone = sanitizeInput(timezone);
  if (experience !== undefined) user.experience = experience;
  if (skills !== undefined)
    user.skills = Array.isArray(skills)
      ? skills.map((skill) => sanitizeInput(skill))
      : [];
  if (languages !== undefined) user.languages = languages;
  if (isAvailable !== undefined) user.isAvailable = isAvailable;

  await user.save();

  res.json({
    success: true,
    message: "Profile updated successfully",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      bio: user.bio,
      location: user.location,
      hourlyRate: user.hourlyRate,
      phone: user.phone,
      avatar: user.avatar,
      title: user.title,
      timezone: user.timezone,
      experience: user.experience,
      skills: user.skills,
      languages: user.languages,
      isAvailable: user.isAvailable,
      roles: user.roles,
      primaryRole: user.primaryRole,
    },
  });
});

// Forgot Password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Please provide an email address",
    });
  }

  const sanitizedEmail = sanitizeInput(email.toLowerCase());
  const user = await User.findOne({ email: sanitizedEmail });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Email not registered",
    });
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  // Create reset url
  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password/${resetToken}`;

  const message = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Password Reset Request</h2>
      <p>You are receiving this email because you (or someone else) has requested the reset of a password.</p>
      <p>Please click on the link below to reset your password:</p>
      <div style="margin: 30px 0;">
        <a href="${resetUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Reset Password</a>
      </div>
      <p>This link is valid for 10 minutes only.</p>
      <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
    </div>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: "WorkDesk - Password Reset Request",
      html: message,
    });

    res.status(200).json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    console.error("Error sending reset email:", error);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(500).json({
      success: false,
      message: "Email could not be sent",
    });
  }
});

// Reset Password
const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;

  if (!password || !token) {
    return res.status(400).json({
      success: false,
      message: "Password and token are required",
    });
  }

  // Hash the received token to compare it with the stored hashed token
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  // Set new password
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Password reset successful. Please login with your new password.",
  });
});

module.exports = {
  register,
  login,
  verify2FA,
  resend2FA,
  verifyOTP,
  resendOTP,
  completeProfile,
  completeFreelancerProfile,
  switchRole,
  oauthLogin,
  updateRole,
  updateProfile,
  forgotPassword,
  resetPassword,
};
