const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const {
  getKycSubmissions,
  approveKyc,
  rejectKyc,
} = require("../controllers/adminController");

const router = express.Router();

// All routes require admin authorization
router.use(protect, authorize("admin"));

// Get KYC submissions with filtering
router.get("/kyc", getKycSubmissions);

// Approve KYC
router.post("/kyc/:userId/approve", approveKyc);

// Reject KYC
router.post("/kyc/:userId/reject", rejectKyc);

module.exports = router;
