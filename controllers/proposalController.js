const Proposal = require('../models/Proposal');
const Job = require('../models/Job');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { sanitizeInput } = require('../middleware/validation');

// Submit a proposal
const submitProposal = asyncHandler(async (req, res) => {
  const {
    jobId,
    coverLetter,
    proposedBudget,
    deliveryTime,
    milestones,
    attachments
  } = req.body;

  const freelancerId = req.user.id;

  // Validate required fields
  if (!jobId || !coverLetter || !proposedBudget || !deliveryTime) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields'
    });
  }

  // Check if job exists and is open
  const job = await Job.findById(jobId);
  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Job not found'
    });
  }

  if (job.status !== 'open') {
    return res.status(400).json({
      success: false,
      message: 'This job is no longer accepting proposals'
    });
  }

  // Check if freelancer is the job owner
  if (job.clientId.toString() === freelancerId) {
    return res.status(400).json({
      success: false,
      message: 'You cannot submit a proposal to your own job'
    });
  }

  // Check if proposal already exists
  const existingProposal = await Proposal.findOne({
    jobId,
    freelancerId,
    status: { $ne: 'withdrawn' }
  });

  if (existingProposal) {
    return res.status(400).json({
      success: false,
      message: 'You have already submitted a proposal for this job'
    });
  }

  // Create proposal
  const proposal = await Proposal.create({
    jobId,
    freelancerId,
    coverLetter: sanitizeInput(coverLetter),
    proposedBudget: {
      amount: parseFloat(proposedBudget.amount),
      type: proposedBudget.type
    },
    deliveryTime: {
      value: parseInt(deliveryTime.value),
      unit: deliveryTime.unit || 'days'
    },
    milestones: milestones || [],
    attachments: attachments || []
  });

  await proposal.populate([
    { path: 'freelancerId', select: 'name avatar rating skills hourlyRate completedProjects' },
    { path: 'jobId', select: 'title budget' }
  ]);

  res.status(201).json({
    success: true,
    message: 'Proposal submitted successfully',
    proposal
  });
});

// Get freelancer's proposals
const getFreelancerProposals = asyncHandler(async (req, res) => {
  const freelancerId = req.user.id;
  const { status, page = 1, limit = 10 } = req.query;

  const query = { freelancerId };
  if (status) query.status = status;

  const skip = (page - 1) * limit;

  const proposals = await Proposal.find(query)
    .populate('jobId', 'title budget status clientId')
    .populate({
      path: 'jobId',
      populate: {
        path: 'clientId',
        select: 'name avatar companySize'
      }
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Proposal.countDocuments(query);

  res.json({
    success: true,
    count: proposals.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    proposals
  });
});

// Get proposals for a job (client view)
const getJobProposals = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const clientId = req.user.id;

  // Verify job ownership
  const job = await Job.findOne({ _id: jobId, clientId });
  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Job not found or unauthorized'
    });
  }

  const proposals = await Proposal.find({
    jobId,
    status: { $ne: 'withdrawn' }
  })
    .populate('freelancerId', 'name avatar rating skills hourlyRate completedProjects totalEarnings bio location')
    .sort({ createdAt: -1 });

  // Mark proposals as viewed
  await Proposal.updateMany(
    { jobId, clientViewed: false },
    { clientViewed: true, clientViewedAt: new Date() }
  );

  res.json({
    success: true,
    count: proposals.length,
    proposals
  });
});

// Get single proposal
const getProposal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const proposal = await Proposal.findById(id)
    .populate('freelancerId', 'name avatar rating skills hourlyRate completedProjects totalEarnings bio location education portfolio')
    .populate('jobId');

  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  // Check authorization
  const job = await Job.findById(proposal.jobId);
  if (
    proposal.freelancerId._id.toString() !== userId &&
    job.clientId.toString() !== userId
  ) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  res.json({
    success: true,
    proposal
  });
});

// Update proposal
const updateProposal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const freelancerId = req.user.id;

  const proposal = await Proposal.findOne({ _id: id, freelancerId });

  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found or unauthorized'
    });
  }

  if (proposal.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Cannot update proposal in current status'
    });
  }

  const allowedUpdates = ['coverLetter', 'proposedBudget', 'deliveryTime', 'milestones'];

  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      if (field === 'coverLetter') {
        proposal[field] = sanitizeInput(req.body[field]);
      } else {
        proposal[field] = req.body[field];
      }
    }
  });

  await proposal.save();
  await proposal.populate('jobId', 'title budget');

  res.json({
    success: true,
    message: 'Proposal updated successfully',
    proposal
  });
});

// Withdraw proposal
const withdrawProposal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const freelancerId = req.user.id;

  const proposal = await Proposal.findOne({ _id: id, freelancerId });

  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found or unauthorized'
    });
  }

  if (proposal.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Cannot withdraw proposal in current status'
    });
  }

  proposal.status = 'withdrawn';
  proposal.withdrawnAt = new Date();
  await proposal.save();

  res.json({
    success: true,
    message: 'Proposal withdrawn successfully'
  });
});

// Accept proposal (client)
const acceptProposal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const clientId = req.user.id;

  const proposal = await Proposal.findById(id).populate('jobId');

  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  // Verify job ownership
  if (proposal.jobId.clientId.toString() !== clientId) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  if (proposal.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Proposal is not in pending status'
    });
  }

  // Accept proposal
  proposal.status = 'accepted';
  proposal.acceptedAt = new Date();
  await proposal.save();

  // Update job status
  const job = await Job.findById(proposal.jobId);
  job.status = 'in-progress';
  job.hiredFreelancer = proposal.freelancerId;
  job.startDate = new Date();
  await job.save();

  // Reject all other proposals
  await Proposal.updateMany(
    {
      jobId: proposal.jobId,
      _id: { $ne: proposal._id },
      status: 'pending'
    },
    {
      status: 'rejected',
      rejectedAt: new Date(),
      rejectionReason: 'Another proposal was accepted'
    }
  );

  await proposal.populate('freelancerId', 'name avatar email');

  res.json({
    success: true,
    message: 'Proposal accepted successfully',
    proposal
  });
});

// Reject proposal (client)
const rejectProposal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const clientId = req.user.id;

  const proposal = await Proposal.findById(id).populate('jobId');

  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  // Verify job ownership
  if (proposal.jobId.clientId.toString() !== clientId) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  if (proposal.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Proposal is not in pending status'
    });
  }

  proposal.status = 'rejected';
  proposal.rejectedAt = new Date();
  proposal.rejectionReason = reason ? sanitizeInput(reason) : undefined;
  await proposal.save();

  res.json({
    success: true,
    message: 'Proposal rejected'
  });
});

// Get proposal statistics
const getProposalStats = asyncHandler(async (req, res) => {
  const freelancerId = req.user.id;

  const stats = await Proposal.aggregate([
    { $match: { freelancerId: mongoose.Types.ObjectId(freelancerId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const total = await Proposal.countDocuments({ freelancerId });

  res.json({
    success: true,
    stats: {
      total,
      byStatus: stats
    }
  });
});

module.exports = {
  submitProposal,
  getFreelancerProposals,
  getJobProposals,
  getProposal,
  updateProposal,
  withdrawProposal,
  acceptProposal,
  rejectProposal,
  getProposalStats
};
