const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Web Development',
      'Mobile Development',
      'Design & Creative',
      'Writing & Translation',
      'Marketing & Sales',
      'Admin & Customer Support',
      'Data Science & Analytics',
      'Engineering & Architecture',
      'Legal',
      'Accounting & Finance',
      'Other'
    ]
  },
  subcategory: {
    type: String,
    trim: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  budget: {
    type: {
      type: String,
      enum: ['fixed', 'hourly'],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    minAmount: Number,
    maxAmount: Number
  },
  duration: {
    type: String,
    enum: ['less-than-week', '1-2-weeks', '2-4-weeks', '1-3-months', '3-6-months', 'more-than-6-months'],
    required: true
  },
  experienceLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'expert'],
    required: true
  },
  projectType: {
    type: String,
    enum: ['one-time', 'ongoing'],
    default: 'one-time'
  },
  location: {
    type: String,
    default: 'Remote'
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'completed', 'cancelled', 'closed'],
    default: 'open'
  },
  proposals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proposal'
  }],
  proposalCount: {
    type: Number,
    default: 0
  },
  hiredFreelancer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  attachments: [{
    name: String,
    url: String,
    type: String
  }],
  visibility: {
    type: String,
    enum: ['public', 'private', 'invite-only'],
    default: 'public'
  },
  featured: {
    type: Boolean,
    default: false
  },
  urgent: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  savedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  deadline: {
    type: Date
  },
  startDate: {
    type: Date
  },
  completedDate: {
    type: Date
  },
  // For recommendation algorithm
  matchScore: {
    type: Map,
    of: Number
  }
}, {
  timestamps: true
});

// Indexes for better query performance
jobSchema.index({ clientId: 1, status: 1 });
jobSchema.index({ skills: 1 });
jobSchema.index({ category: 1, status: 1 });
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ experienceLevel: 1 });

// Calculate match score for a freelancer
jobSchema.methods.calculateMatchScore = function(freelancer) {
  let score = 0;
  let maxScore = 100;

  // Skills match (60 points) - MOST CRITICAL FACTOR
  let skillScore = 0;
  let hasAnySkillMatch = false;
  
  if (this.skills && this.skills.length > 0 && freelancer.skills && freelancer.skills.length > 0) {
    const jobSkills = this.skills.map(s => s.toLowerCase().trim());
    const freelancerSkills = freelancer.skills.map(s => s.toLowerCase().trim());
    const matchingSkills = jobSkills.filter(skill => freelancerSkills.includes(skill));
    
    if (matchingSkills.length > 0) {
      hasAnySkillMatch = true;
      const skillMatchPercentage = (matchingSkills.length / jobSkills.length) * 100;
      skillScore = (skillMatchPercentage / 100) * 60;
      score += skillScore;
    }
  }

  // If NO skills match at all, cap maximum score at 15%
  if (!hasAnySkillMatch) {
    maxScore = 15;
  }

  // Category match (20 points) - Ensure job category aligns with freelancer expertise
  const categoryScore = this.calculateCategoryMatch(freelancer.skills || []);
  score += categoryScore;

  // If category doesn't match AND skill match is low, heavily penalize
  if (categoryScore === 0 && skillScore < 20) {
    maxScore = Math.min(maxScore, 25);
  }

  // Experience level match (10 points)
  if (this.experienceLevel === freelancer.experience) {
    score += 10;
  } else if (
    (this.experienceLevel === 'intermediate' && freelancer.experience === 'expert') ||
    (this.experienceLevel === 'beginner' && ['intermediate', 'expert'].includes(freelancer.experience))
  ) {
    score += 7;
  } else if (
    (this.experienceLevel === 'expert' && freelancer.experience === 'intermediate')
  ) {
    score += 3;
  }

  // Budget/Rate match (5 points)
  if (this.budget.type === 'hourly' && freelancer.hourlyRate) {
    const budgetRate = this.budget.amount;
    const freelancerRate = freelancer.hourlyRate;
    
    if (freelancerRate <= budgetRate) {
      score += 5;
    } else if (freelancerRate <= budgetRate * 1.2) {
      score += 3;
    }
  } else if (this.budget.type === 'fixed') {
    // For fixed budget, compare with freelancer's hourly rate estimate
    if (freelancer.hourlyRate && this.budget.amount) {
      const estimatedHours = this.budget.amount / freelancer.hourlyRate;
      // If the job budget suggests 20-200 hours of work at their rate, it's reasonable
      if (estimatedHours >= 20 && estimatedHours <= 200) {
        score += 5;
      } else if (estimatedHours >= 10 && estimatedHours <= 300) {
        score += 3;
      } else {
        score += 1;
      }
    } else {
      score += 3;
    }
  } else {
    score += 3;
  }

  // Location preference (3 points)
  if (this.location === 'Remote' || freelancer.location === this.location) {
    score += 3;
  }

  // Profile completion bonus (2 points)
  const completionPercentage = freelancer.getProfileCompletion ? freelancer.getProfileCompletion() : 0;
  score += (completionPercentage / 100) * 2;

  // Apply cap at the very end after all additions
  return Math.round(Math.min(score, maxScore));
};

// Helper method to calculate category match
jobSchema.methods.calculateCategoryMatch = function(freelancerSkills) {
  const skills = freelancerSkills.map(s => s.toLowerCase().trim());
  
  // Define skill categories with comprehensive keywords
  const categorySkills = {
    'Web Development': [
      'javascript', 'typescript', 'react', 'angular', 'vue.js', 'vue', 'node.js', 'nodejs', 'node',
      'express', 'next.js', 'nextjs', 'html', 'css', 'sass', 'tailwind', 'bootstrap',
      'php', 'laravel', 'symfony', 'wordpress', 'drupal', 'django', 'flask',
      'asp.net', '.net', 'c#', 'ruby', 'rails', 'rest api', 'graphql', 'api',
      'webpack', 'vite', 'redux', 'mongodb', 'mysql', 'postgresql', 'sql',
      'frontend', 'backend', 'full stack', 'fullstack', 'web development'
    ],
    'Mobile Development': [
      'react native', 'flutter', 'dart', 'swift', 'swiftui', 'kotlin', 'java',
      'ios', 'android', 'mobile', 'xamarin', 'ionic', 'cordova',
      'mobile development', 'app development'
    ],
    'Data Science & Analytics': [
      'python', 'r', 'machine learning', 'ml', 'deep learning', 'ai',
      'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'pandas', 'numpy',
      'data analysis', 'data science', 'statistics', 'jupyter',
      'tableau', 'power bi', 'data visualization', 'sql', 'big data',
      'spark', 'hadoop', 'nlp', 'computer vision'
    ],
    'Design & Creative': [
      'figma', 'sketch', 'adobe xd', 'photoshop', 'illustrator', 'indesign',
      'ui design', 'ux design', 'ui/ux', 'graphic design', 'logo design',
      'branding', 'typography', 'color theory', 'wireframing', 'prototyping',
      'after effects', 'premiere pro', 'video editing', 'motion graphics',
      '3d modeling', 'blender', '3ds max', 'maya', 'cinema 4d',
      'illustration', 'digital art', 'procreate'
    ],
    'Engineering & Architecture': [
      'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'google cloud',
      'devops', 'ci/cd', 'jenkins', 'gitlab', 'github actions',
      'terraform', 'ansible', 'linux', 'bash', 'shell scripting',
      'monitoring', 'prometheus', 'grafana', 'nginx', 'apache',
      'unity', 'c#', 'game development', 'unreal engine', 'c++'
    ],
    'Marketing & Sales': [
      'seo', 'sem', 'google ads', 'facebook ads', 'social media marketing',
      'content marketing', 'email marketing', 'digital marketing',
      'google analytics', 'marketing automation', 'copywriting',
      'conversion optimization', 'growth hacking'
    ],
    'Writing & Translation': [
      'content writing', 'copywriting', 'technical writing', 'blog writing',
      'translation', 'proofreading', 'editing', 'creative writing',
      'ghostwriting'
    ]
  };

  // Check if freelancer skills match the job category
  const jobCategory = this.category;
  const relevantSkills = categorySkills[jobCategory] || [];
  
  // Count how many freelancer skills are relevant to this job category
  const matchingCategorySkills = skills.filter(skill => 
    relevantSkills.some(catSkill => 
      skill.includes(catSkill) || catSkill.includes(skill)
    )
  );

  if (matchingCategorySkills.length === 0) {
    return 0;
  } else if (matchingCategorySkills.length >= 3) {
    return 20;
  } else if (matchingCategorySkills.length >= 2) {
    return 15;
  } else {
    return 10;
  }
};

// Get recommended jobs for a freelancer
jobSchema.statics.getRecommendedJobs = async function(freelancerId, limit = 10) {
  const User = mongoose.model('User');
  const freelancer = await User.findById(freelancerId);
  
  if (!freelancer) {
    throw new Error('Freelancer not found');
  }

  // Pre-filter jobs by skills or category to avoid scoring thousands of irrelevant jobs
  const query = { status: 'open' };
  
  // If freelancer has skills, filter jobs that have at least one matching skill
  if (freelancer.skills && freelancer.skills.length > 0) {
    const freelancerSkills = freelancer.skills.map(s => s.toLowerCase().trim());
    query.$or = [
      { skills: { $in: freelancer.skills } },
      { category: { $in: this.getCategoriesForSkills(freelancerSkills) } }
    ];
  }

  // Get filtered jobs (up to 500 for scoring)
  const jobs = await this.find(query)
    .populate('clientId', 'name avatar companySize industry')
    .sort({ createdAt: -1 })
    .limit(500);

  // Calculate match scores
  const jobsWithScores = jobs.map(job => {
    const score = job.calculateMatchScore(freelancer);
    return {
      ...job.toObject(),
      matchScore: score
    };
  });

  // Sort by match score and return top matches
  return jobsWithScores
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
};

// Helper to get relevant categories based on skills
jobSchema.statics.getCategoriesForSkills = function(skills) {
  const categories = [];
  const skillsLower = skills.map(s => s.toLowerCase());
  
  const devSkills = ['javascript', 'typescript', 'react', 'angular', 'vue', 'node', 'php', 'python', 'java', 'html', 'css'];
  const mobileSkills = ['react native', 'flutter', 'swift', 'kotlin', 'ios', 'android'];
  const designSkills = ['figma', 'photoshop', 'illustrator', 'sketch', 'ui', 'ux'];
  const dataSkills = ['python', 'machine learning', 'tensorflow', 'data'];
  
  if (skillsLower.some(s => devSkills.some(ds => s.includes(ds)))) categories.push('Web Development');
  if (skillsLower.some(s => mobileSkills.some(ms => s.includes(ms)))) categories.push('Mobile Development');
  if (skillsLower.some(s => designSkills.some(ds => s.includes(ds)))) categories.push('Design & Creative');
  if (skillsLower.some(s => dataSkills.some(ds => s.includes(ds)))) categories.push('Data Science & Analytics');
  
  return categories;
};

// Get recommended jobs for a freelancer
jobSchema.statics.getRecommendedJobs = async function(freelancerId, limit = 10) {
  const User = mongoose.model('User');
  const freelancer = await User.findById(freelancerId);
  
  if (!freelancer) {
    throw new Error('Freelancer not found');
  }

  // Get all open jobs
  const jobs = await this.find({ status: 'open' })
    .populate('clientId', 'name avatar companySize industry')
    .sort({ createdAt: -1 })
    .limit(100); // Get more jobs to calculate scores

  // Calculate match scores
  const jobsWithScores = jobs.map(job => {
    const score = job.calculateMatchScore(freelancer);
    return {
      ...job.toObject(),
      matchScore: score
    };
  });

  // Sort by match score and return top matches
  return jobsWithScores
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
};

module.exports = mongoose.model('Job', jobSchema);
