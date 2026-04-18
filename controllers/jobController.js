const Job = require('../models/Job');
const User = require('../models/User');
const Proposal = require('../models/Proposal');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');
const { asyncHandler } = require('../middleware/errorHandler');
const { sanitizeInput, sanitizePlainText } = require('../middleware/validation');

// Create a new job
const createJob = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    category,
    subcategory,
    skills,
    budget,
    duration,
    experienceLevel,
    projectType,
    location,
    attachments,
    deadline,
    visibility,
    urgent
  } = req.body;

  const clientId = req.user.id;

  // Validate required fields
  if (!title || !description || !category || !skills || !budget || !duration || !experienceLevel) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields'
    });
  }

  // Create job
  const job = await Job.create({
    title: sanitizePlainText(title),
    description: sanitizeInput(description),
    category,
    subcategory: subcategory ? sanitizePlainText(subcategory) : undefined,
    skills: Array.isArray(skills) ? skills.map(s => sanitizePlainText(s)) : [],
    budget: {
      type: budget.type,
      amount: parseFloat(budget.amount),
      currency: budget.currency || 'USD',
      minAmount: budget.minAmount ? parseFloat(budget.minAmount) : undefined,
      maxAmount: budget.maxAmount ? parseFloat(budget.maxAmount) : undefined
    },
    duration,
    experienceLevel,
    projectType: projectType || 'one-time',
    location: location || 'Remote',
    clientId,
    attachments: attachments || [],
    deadline: deadline ? new Date(deadline) : undefined,
    visibility: visibility || 'public',
    urgent: urgent || false
  });

  await job.populate('clientId', 'name email avatar companySize industry');

  // Notify client
  const notification = await Notification.create({
    userId: clientId,
    type: 'job_posted',
    title: 'Job Posted Successfully',
    message: `Your job "${job.title}" is now live and visible to freelancers.`,
    data: { jobId: job._id }
  });
  
  console.log('✅ Notification created for user:', clientId);
  console.log('📝 Notification:', notification);

  // Send real-time notification via Socket.IO
  const io = req.app.get('io');
  const connectedUsers = req.app.get('connectedUsers');
  const socketId = connectedUsers.get(clientId.toString());
  
  console.log('🔌 Socket ID for user', clientId, ':', socketId);
  console.log('👥 Connected users:', Array.from(connectedUsers.keys()));
  
  if (io && socketId) {
    io.to(socketId).emit('notification', {
      type: 'job_posted',
      title: 'Job Posted Successfully',
      message: `Your job "${job.title}" is now live and visible to freelancers.`,
      data: { jobId: job._id }
    });
    console.log('✅ Socket notification sent');
  } else {
    console.log('❌ Socket notification NOT sent - io:', !!io, 'socketId:', socketId);
  }

  // Emit real-time event for new job to all freelancers
  if (io) {
    io.emit('job:created', job);
    console.log('📢 New job broadcasted to all freelancers');
  }

  res.status(201).json({
    success: true,
    message: 'Job posted successfully',
    job
  });
});

// Get recommended jobs for freelancer (AI-powered)
const getRecommendedJobs = asyncHandler(async (req, res) => {
  const freelancerId = req.user.id;
  const limit = parseInt(req.query.limit) || 50; // Increased default limit

  const recommendedJobs = await Job.getRecommendedJobs(freelancerId, limit);

  // Filter out jobs with match score below 50%
  const filteredJobs = recommendedJobs.filter(job => job.matchScore >= 50);

  res.json({
    success: true,
    count: filteredJobs.length,
    jobs: filteredJobs
  });
});

// Get all jobs with filters
const getAllJobs = asyncHandler(async (req, res) => {
  const {
    category,
    skills,
    experienceLevel,
    budgetMin,
    budgetMax,
    budgetType,
    duration,
    search,
    sort,
    page = 1,
    limit = 100
  } = req.query;

  // Build query
  const query = { status: 'open', visibility: 'public' };

  if (category) query.category = category;
  if (experienceLevel) query.experienceLevel = experienceLevel;
  if (duration) query.duration = duration;
  if (budgetType) query['budget.type'] = budgetType;

  if (budgetMin || budgetMax) {
    query['budget.amount'] = {};
    if (budgetMin) query['budget.amount'].$gte = parseFloat(budgetMin);
    if (budgetMax) query['budget.amount'].$lte = parseFloat(budgetMax);
  }

  if (skills) {
    const skillsArray = skills.split(',').map(s => s.trim());
    query.skills = { $in: skillsArray };
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // Sorting
  let sortOption = { createdAt: -1 };
  if (sort === 'budget-high') sortOption = { 'budget.amount': -1 };
  if (sort === 'budget-low') sortOption = { 'budget.amount': 1 };
  if (sort === 'proposals') sortOption = { proposalCount: -1 };

  const skip = (page - 1) * limit;

  const jobs = await Job.find(query)
    .populate('clientId', 'name avatar companySize industry rating')
    .sort(sortOption)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Job.countDocuments(query);

  res.json({
    success: true,
    count: jobs.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    jobs
  });
});

// Get single job
const getJob = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const job = await Job.findById(id)
    .populate('clientId', 'name email avatar companySize industry rating totalEarnings')
    .populate({
      path: 'proposals',
      match: { status: { $ne: 'withdrawn' } },
      select: 'freelancerId proposedBudget deliveryTime status createdAt',
      populate: {
        path: 'freelancerId',
        select: 'name avatar rating skills hourlyRate completedProjects'
      }
    });

  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Job not found'
    });
  }

  // Increment views
  job.views += 1;
  await job.save();

  // Calculate match score if user is freelancer
  let matchScore = null;
  if (req.user && req.user.primaryRole === 'freelancer') {
    const freelancer = await User.findById(req.user.id);
    matchScore = job.calculateMatchScore(freelancer);
  }

  res.json({
    success: true,
    job: {
      ...job.toObject(),
      matchScore
    }
  });
});

// Update job
const updateJob = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const clientId = req.user.id;

  const job = await Job.findOne({ _id: id, clientId });

  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Job not found or unauthorized'
    });
  }

  // Don't allow updates if job is in progress or completed
  if (['in-progress', 'completed'].includes(job.status)) {
    return res.status(400).json({
      success: false,
      message: 'Cannot update job in current status'
    });
  }

  const allowedUpdates = [
    'title', 'description', 'category', 'skills', 'budget', 'duration',
    'experienceLevel', 'deadline', 'urgent', 'status'
  ];

  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      if (field === 'title' || field === 'category') {
        job[field] = sanitizePlainText(req.body[field]);
      } else if (field === 'description') {
        job[field] = sanitizeInput(req.body[field]);
      } else if (field === 'skills') {
        job[field] = Array.isArray(req.body[field])
          ? req.body[field].map(s => sanitizePlainText(s))
          : [];
      } else {
        job[field] = req.body[field];
      }
    }
  });

  await job.save();
  await job.populate('clientId', 'name email avatar companySize industry rating');

  // Emit real-time event for job update
  const io = req.app.get('io');
  if (io) {
    io.emit('job:updated', job);
    console.log('📢 Job update broadcasted');
  }

  res.json({
    success: true,
    message: 'Job updated successfully',
    job
  });
});

// Delete job
const deleteJob = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const clientId = req.user.id;

  const job = await Job.findOne({ _id: id, clientId });

  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Job not found or unauthorized'
    });
  }

  // Don't allow deletion if job has accepted proposals
  if (job.status === 'in-progress') {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete job that is in progress'
    });
  }

  const jobTitle = job.title;
  await job.deleteOne();

  // Notify client
  const notification = await Notification.create({
    userId: clientId,
    type: 'job_deleted',
    title: 'Job Deleted',
    message: `Your job "${jobTitle}" has been deleted successfully.`,
    data: { jobId: id }
  });
  
  console.log('✅ Delete notification created for user:', clientId);
  console.log('📝 Notification:', notification);

  // Send real-time notification via Socket.IO
  const io = req.app.get('io');
  const connectedUsers = req.app.get('connectedUsers');
  const socketId = connectedUsers.get(clientId.toString());
  
  console.log('🔌 Socket ID for user', clientId, ':', socketId);
  
  if (io && socketId) {
    io.to(socketId).emit('notification', {
      type: 'job_deleted',
      title: 'Job Deleted',
      message: `Your job "${jobTitle}" has been deleted successfully.`,
      data: { jobId: id }
    });
    console.log('✅ Socket notification sent');
  } else {
    console.log('❌ Socket notification NOT sent');
  }

  // Emit real-time event for job deletion
  if (io) {
    io.emit('job:deleted', { jobId: id });
    console.log('📢 Job deletion broadcasted');
  }

  res.json({
    success: true,
    message: 'Job deleted successfully'
  });
});

// Get client's jobs
const getClientJobs = asyncHandler(async (req, res) => {
  const clientId = req.user.id;
  const { status, page = 1, limit = 10 } = req.query;

  const query = { clientId };
  if (status) query.status = status;

  const skip = (page - 1) * limit;

  const jobs = await Job.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('hiredFreelancer', 'name avatar rating');

  const total = await Job.countDocuments(query);

  res.json({
    success: true,
    count: jobs.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    jobs
  });
});

// Save/Unsave job
const toggleSaveJob = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const job = await Job.findById(id);

  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Job not found'
    });
  }

  const isSaved = job.savedBy.includes(userId);

  if (isSaved) {
    job.savedBy = job.savedBy.filter(id => id.toString() !== userId);
  } else {
    job.savedBy.push(userId);
  }

  await job.save();

  res.json({
    success: true,
    message: isSaved ? 'Job unsaved' : 'Job saved',
    saved: !isSaved
  });
});

// Get saved jobs
const getSavedJobs = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 10 } = req.query;

  const skip = (page - 1) * limit;

  const jobs = await Job.find({ savedBy: userId, status: 'open' })
    .populate('clientId', 'name avatar companySize industry')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Job.countDocuments({ savedBy: userId, status: 'open' });

  res.json({
    success: true,
    count: jobs.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    jobs
  });
});

// Get job statistics
const getJobStats = asyncHandler(async (req, res) => {
  const clientId = req.user.id;

  const stats = await Job.aggregate([
    { $match: { clientId: new mongoose.Types.ObjectId(clientId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalBudget: { $sum: '$budget.amount' }
      }
    }
  ]);

  const totalJobs = await Job.countDocuments({ clientId });
  const totalProposals = await Proposal.countDocuments({
    jobId: { $in: await Job.find({ clientId }).distinct('_id') }
  });

  res.json({
    success: true,
    stats: {
      total: totalJobs,
      byStatus: stats,
      totalProposals
    }
  });
});

module.exports = {
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
};
