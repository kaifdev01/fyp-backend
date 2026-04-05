const Notification = require("../models/Notification");
const User = require("../models/User");
const { asyncHandler } = require("../middleware/errorHandler");

// Get user notifications
const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { limit = 20, skip = 0 } = req.query;

  const notifications = await Notification.find({ userId, recipientType: "user" })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(skip));

  const total = await Notification.countDocuments({ userId, recipientType: "user" });
  const unreadCount = await Notification.countDocuments({ userId, recipientType: "user", read: false });

  res.json({
    success: true,
    notifications,
    pagination: {
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
    },
    unreadCount,
  });
});

// Get admin notifications
const getAdminNotifications = asyncHandler(async (req, res) => {
  const { limit = 20, skip = 0 } = req.query;

  const notifications = await Notification.find({ recipientType: "admin" })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(skip))
    .populate("userId", "name email");

  const total = await Notification.countDocuments({ recipientType: "admin" });
  const unreadCount = await Notification.countDocuments({ recipientType: "admin", read: false });

  res.json({
    success: true,
    notifications,
    pagination: {
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
    },
    unreadCount,
  });
});

// Get pending KYC submissions for admin
const getPendingKycNotifications = asyncHandler(async (req, res) => {
  const { limit = 10, skip = 0 } = req.query;

  const notifications = await Notification.find({
    type: "kyc_submitted",
    recipientType: "admin",
  })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(skip))
    .populate("userId", "name email kyc");

  const total = await Notification.countDocuments({
    type: "kyc_submitted",
    recipientType: "admin",
  });

  res.json({
    success: true,
    notifications,
    pagination: {
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
    },
  });
});

// Mark notification as read
const markAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;

  const notification = await Notification.findByIdAndUpdate(
    notificationId,
    {
      read: true,
      readAt: new Date(),
    },
    { new: true }
  );

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: "Notification not found",
    });
  }

  res.json({
    success: true,
    notification,
  });
});

// Mark all notifications as read
const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  await Notification.updateMany(
    { userId, read: false },
    {
      read: true,
      readAt: new Date(),
    }
  );

  res.json({
    success: true,
    message: "All notifications marked as read",
  });
});

// Delete notification
const deleteNotification = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;

  const notification = await Notification.findByIdAndDelete(notificationId);

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: "Notification not found",
    });
  }

  res.json({
    success: true,
    message: "Notification deleted",
  });
});

module.exports = {
  getNotifications,
  getAdminNotifications,
  getPendingKycNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
