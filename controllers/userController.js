const User = require("../models/User");
const { asyncHandler } = require("../middleware/errorHandler");
const { sanitizeInput } = require("../middleware/validation");

// Upload avatar
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded",
    });
  }

  const avatarUrl = `/uploads/avatars/${req.file.filename}`;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { avatar: avatarUrl },
    { new: true }
  );

  res.json({
    success: true,
    message: "Avatar uploaded successfully",
    avatar: avatarUrl,
    user: user.toPublicJSON(),
  });
});

// Update profile
const updateProfile = asyncHandler(async (req, res) => {
  const {
    intro,
    bio,
    location,
    hourlyRate,
    phone,
    skills,
    languages,
    education,
    portfolio,
    isAvailable,
    avatar,
  } = req.body;
  const userId = req.user.id;

  console.log("Portfolio data received:", JSON.stringify(portfolio, null, 2));

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // Update user fields
  if (intro !== undefined) user.intro = sanitizeInput(intro);
  if (bio !== undefined) user.bio = sanitizeInput(bio);
  if (location !== undefined) user.location = sanitizeInput(location);
  if (hourlyRate !== undefined) user.hourlyRate = parseFloat(hourlyRate) || 0;
  if (phone !== undefined) user.phone = sanitizeInput(phone);
  if (avatar !== undefined) user.avatar = sanitizeInput(avatar);
  if (skills !== undefined)
    user.skills = Array.isArray(skills)
      ? skills.map((skill) => sanitizeInput(skill))
      : [];
  if (languages !== undefined) user.languages = languages;
  if (education !== undefined) user.education = education;
  if (portfolio !== undefined) {
    // Ensure portfolio items have proper structure
    user.portfolio = Array.isArray(portfolio)
      ? portfolio.map((item) => ({
          title: sanitizeInput(item.title || ""),
          description: sanitizeInput(item.description || ""),
          url: sanitizeInput(item.url || ""),
          image: sanitizeInput(item.image || ""),
          media: Array.isArray(item.media)
            ? item.media.map((media) => ({
                url: sanitizeInput(media.url || ""),
                type: media.type || "image",
                name: sanitizeInput(media.name || ""),
              }))
            : [],
          createdAt: item.createdAt || new Date(),
        }))
      : [];
  }
  if (isAvailable !== undefined) user.isAvailable = isAvailable;

  await user.save();

  console.log("Portfolio after save:", JSON.stringify(user.portfolio, null, 2));

  res.json({
    success: true,
    message: "Profile updated successfully",
    user: user.toPublicJSON(),
  });
});

// Get user profile
const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  res.json({
    success: true,
    user: user.toPublicJSON(),
  });
});

module.exports = { uploadAvatar, updateProfile, getProfile };
