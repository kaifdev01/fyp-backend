const express = require('express');
const { getFreelancerDashboard } = require('../controllers/freelancerController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protected routes
router.get('/dashboard', protect, getFreelancerDashboard);

module.exports = router;