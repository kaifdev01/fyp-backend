const express = require('express');
const { uploadAvatar, updateProfile, getProfile } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Protected routes
router.get('/profile', protect, getProfile);
router.post('/upload-avatar', protect, upload.single('avatar'), uploadAvatar);
router.put('/profile', protect, updateProfile);

module.exports = router;