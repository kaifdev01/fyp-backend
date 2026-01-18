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
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Validation rules
const registerValidation = [
  body("name")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters"),
  body("email").isEmail().withMessage("Please enter a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("role")
    .isIn(["client", "freelancer"])
    .withMessage("Role must be client or freelancer"),
];

const loginValidation = [
  body("email").isEmail().withMessage("Please enter a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

// Routes
router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/complete-profile", completeProfile);
router.post("/complete-freelancer-profile", completeFreelancerProfile);
router.post("/complete-oauth-profile", completeFreelancerProfile);
router.post("/switch-role", protect, switchRole);

module.exports = router;
