const express = require("express");
const {
  getNotifications,
  getAdminNotifications,
  getPendingKycNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require("../controllers/notificationController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Protected routes
router.get("/", protect, getNotifications);
router.post("/:notificationId/read", protect, markAsRead);
router.post("/read-all", protect, markAllAsRead);
router.delete("/:notificationId", protect, deleteNotification);

// Admin routes
router.get("/admin/notifications", protect, getAdminNotifications);
router.get("/admin/pending-kyc", protect, getPendingKycNotifications);

module.exports = router;
