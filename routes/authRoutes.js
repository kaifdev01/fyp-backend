const express = require("express");
const { body } = require("express-validator");
const {
  register,
  login,
  verifyOTP,
  resendOTP,
  completeProfile,
  completeFreelancerProfile,
  switchRole,
  oauthLogin,
  updateRole,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const {
  authValidation,
  handleValidationErrors,
} = require("../middleware/validation");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Routes
router.post(
  "/register",
  authValidation.register,
  handleValidationErrors,
  register
);
router.post("/login", authValidation.login, handleValidationErrors, login);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post(
  "/complete-profile",
  authValidation.completeProfile,
  handleValidationErrors,
  completeProfile
);
router.post(
  "/complete-freelancer-profile",
  authValidation.completeFreelancerProfile,
  handleValidationErrors,
  completeFreelancerProfile
);
router.post(
  "/complete-oauth-profile",
  authValidation.completeFreelancerProfile,
  handleValidationErrors,
  completeFreelancerProfile
);
router.post("/switch-role", protect, switchRole);
router.post("/oauth-login", oauthLogin);
router.post("/update-role", updateRole);

// Password recovery
router.post(
  "/forgot-password",
  authValidation.forgotPassword,
  handleValidationErrors,
  forgotPassword
);
router.post(
  "/reset-password/:token",
  authValidation.resetPassword,
  handleValidationErrors,
  resetPassword
);

module.exports = router;
