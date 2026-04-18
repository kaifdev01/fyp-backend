const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  freelancerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coverLetter: {
    type: String,
    required: [true, 'Cover letter is required'],
    maxlength: [2000, 'Cover letter cannot exceed 2000 characters']
  },
  proposedBudget: {
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    type: {
      type: String,
      enum: ['fixed', 'hourly'],
      required: true
    }
  },
  deliveryTime: {
    value: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      enum: ['days', 'weeks', 'months'],
      default: 'days'
    }
  },
  milestones: [{
    title: String,
    description: String,
    amount: Number,
    dueDate: Date,
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'approved'],
      default: 'pending'
    }
  }],
  attachments: [{
    name: String,
    url: String,
    type: String
  }],
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
    default: 'pending'
  },
  clientViewed: {
    type: Boolean,
    default: false
  },
  clientViewedAt: {
    type: Date
  },
  acceptedAt: {
    type: Date
  },
  rejectedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  withdrawnAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
proposalSchema.index({ jobId: 1, freelancerId: 1 }, { unique: true });
proposalSchema.index({ freelancerId: 1, status: 1 });
proposalSchema.index({ jobId: 1, status: 1 });

// Prevent duplicate proposals
proposalSchema.pre('save', async function(next) {
  if (this.isNew) {
    const existingProposal = await this.constructor.findOne({
      jobId: this.jobId,
      freelancerId: this.freelancerId,
      status: { $ne: 'withdrawn' }
    });
    
    if (existingProposal) {
      throw new Error('You have already submitted a proposal for this job');
    }
  }
  next();
});

// Update job proposal count after save
proposalSchema.post('save', async function() {
  const Job = mongoose.model('Job');
  const proposalCount = await this.constructor.countDocuments({
    jobId: this.jobId,
    status: { $ne: 'withdrawn' }
  });
  
  await Job.findByIdAndUpdate(this.jobId, { proposalCount });
});

module.exports = mongoose.model('Proposal', proposalSchema);
