const User = require("../models/User");
const Notification = require("../models/Notification");
const sendEmail = require("../utils/sendEmail");
const { asyncHandler } = require("../middleware/errorHandler");

// Get KYC submissions
const getKycSubmissions = asyncHandler(async (req, res) => {
  const { status = "pending", page = 1, limit = 10 } = req.query;

  const skip = (page - 1) * limit;

  const query = {};
  if (status) {
    query["kyc.status"] = status;
  }

  const kycs = await User.find(query)
    .select("name email kyc createdAt")
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await User.countDocuments(query);

  const formattedKycs = kycs.map((user) => ({
    _id: user._id,
    user: {
      name: user.name,
      email: user.email,
    },
    kyc: user.kyc,
    createdAt: user.createdAt,
  }));

  res.json({
    success: true,
    kycs: formattedKycs,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    },
  });
});

// Approve KYC
const approveKyc = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  if (!user.kyc) {
    return res.status(400).json({
      success: false,
      message: "No KYC data found for this user",
    });
  }

  // Update KYC status
  user.kyc.status = "verified";
  user.kyc.verifiedAt = new Date();
  user.kyc.rejectionReason = "";

  await user.save();

  // Create notification for user
  await Notification.create({
    userId: user._id,
    type: "kyc_approved",
    title: "KYC Verification Approved",
    message: "Your identity has been successfully verified",
    data: {
      status: "verified",
    },
  });

  // Send approval email
  try {
    await sendEmail({
      email: user.email,
      subject: "WorkDeck - KYC Verification Approved",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">KYC Verification Approved</h2>
          <p>Congratulations ${user.name}!</p>
          <p>Your KYC verification has been approved. You can now access all features on WorkDeck.</p>
          <div style="margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/freelancer-dashboard" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Go to Dashboard</a>
          </div>
          <p>Thank you for verifying your identity!</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Error sending approval email:", error);
  }

  res.json({
    success: true,
    message: "KYC approved successfully",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      kyc: user.kyc,
    },
  });
});

// Reject KYC
const rejectKyc = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({
      success: false,
      message: "Rejection reason is required",
    });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  if (!user.kyc) {
    return res.status(400).json({
      success: false,
      message: "No KYC data found for this user",
    });
  }

  // Update KYC status
  user.kyc.status = "rejected";
  user.kyc.rejectionReason = reason;

  await user.save();

  // Create notification for user
  await Notification.create({
    userId: user._id,
    type: "kyc_rejected",
    title: "KYC Verification Rejected",
    message: `Your verification was rejected: ${reason}`,
    data: {
      status: "rejected",
      reason: reason,
    },
  });

  // Send rejection email
  try {
    await sendEmail({
      email: user.email,
      subject: "WorkDeck - KYC Verification Rejected",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">KYC Verification Rejected</h2>
          <p>Hello ${user.name},</p>
          <p>Unfortunately, your KYC verification has been rejected for the following reason:</p>
          <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
            <p style="color: #991b1b; margin: 0;">${reason}</p>
          </div>
          <p>Please review the feedback and resubmit your KYC with the correct documents.</p>
          <div style="margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/verify-identity" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Resubmit KYC</a>
          </div>
          <p>If you have any questions, please contact our support team.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Error sending rejection email:", error);
  }

  res.json({
    success: true,
    message: "KYC rejected successfully",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      kyc: user.kyc,
    },
  });
});

module.exports = {
  getKycSubmissions,
  approveKyc,
  rejectKyc,
};
