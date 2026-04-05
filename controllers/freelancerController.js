const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');

// Get freelancer dashboard data
const getFreelancerDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found"
    });
  }

  // Calculate profile completion using the same logic as User model
  const profileCompletion = user.getProfileCompletion();

  const dashboardData = {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      intro: user.intro,
      bio: user.bio,
      location: user.location,
      hourlyRate: user.hourlyRate,
      phone: user.phone,
      avatar: user.avatar,
      skills: user.skills,
      languages: user.languages,
      isAvailable: user.isAvailable,
      roles: user.roles,
      primaryRole: user.primaryRole,
      rating: user.rating || 0,
      completedProjects: user.completedProjects || 0,
      totalEarnings: user.totalEarnings || 0,
      kyc: user.kyc || { status: 'not_started' }
    },
    analytics: {
      profileCompletion: profileCompletion,
      profileViews: user.profileViews || 0,
      weeklyProfileViews: user.weeklyProfileViews || 0,
      isAvailable: user.isAvailable || false
    },
    stats: {
      activeProjects: 0, // You can implement this later
      totalProposals: 0   // You can implement this later
    },
    portfolio: user.portfolio || []
  };

  res.json({
    success: true,
    data: dashboardData
  });
});

module.exports = {
  getFreelancerDashboard
};