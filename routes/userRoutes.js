const express = require('express');
const { uploadAvatar, updateProfile } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Protected routes
router.post('/upload-avatar', protect, upload.single('avatar'), uploadAvatar);
router.put('/profile', protect, updateProfile);

module.exports = router;