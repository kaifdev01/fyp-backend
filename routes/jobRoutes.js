const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/validation');
const {
  createJob,
  getRecommendedJobs,
  getAllJobs,
  getJob,
  updateJob,
  deleteJob,
  getClientJobs,
  toggleSaveJob,
  getSavedJobs,
  getJobStats
} = require('../controllers/jobController');

// Public routes
router.get('/all', generalLimiter, getAllJobs);
router.get('/:id', generalLimiter, getJob);

// Protected routes
router.use(protect);

// Job CRUD
router.post('/', createJob);
router.put('/:id', updateJob);
router.delete('/:id', deleteJob);

// Recommendations
router.get('/recommended/for-me', getRecommendedJobs);

// Client routes
router.get('/client/my-jobs', getClientJobs);
router.get('/client/stats', getJobStats);

// Save/Unsave
router.post('/:id/save', toggleSaveJob);
router.get('/saved/my-saved', getSavedJobs);

module.exports = router;
