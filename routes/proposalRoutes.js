const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  submitProposal,
  getFreelancerProposals,
  getJobProposals,
  getProposal,
  updateProposal,
  withdrawProposal,
  acceptProposal,
  rejectProposal,
  getProposalStats
} = require('../controllers/proposalController');

// All routes are protected
router.use(protect);

// Proposal CRUD
router.post('/', submitProposal);
router.get('/my-proposals', getFreelancerProposals);
router.get('/job/:jobId', getJobProposals);
router.get('/stats', getProposalStats);
router.get('/:id', getProposal);
router.put('/:id', updateProposal);
router.delete('/:id/withdraw', withdrawProposal);

// Client actions
router.post('/:id/accept', acceptProposal);
router.post('/:id/reject', rejectProposal);

module.exports = router;
