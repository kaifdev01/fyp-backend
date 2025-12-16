const User = require('../models/User');

// Upload avatar
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    
    await User.findByIdAndUpdate(req.user.id, { avatar: avatarUrl });

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatar: avatarUrl
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update profile
const updateProfile = async (req, res) => {
  try {
    const { name, bio, skills, location } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, bio, skills, location },
      { new: true, runValidators: true }
    );

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { uploadAvatar, updateProfile };