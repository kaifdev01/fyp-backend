const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

// Input sanitization helper
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

// Validation rules
const authValidation = {
  register: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2-50 characters')
      .customSanitizer(sanitizeInput),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please enter a valid email'),
    body('password')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must be at least 8 characters with uppercase, lowercase, and number'),
    body('role')
      .isIn(['client', 'freelancer'])
      .withMessage('Role must be client or freelancer'),
    body('location')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .customSanitizer(sanitizeInput)
  ],

  login: [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required')
  ],

  forgotPassword: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required')
  ],

  resetPassword: [
    body('token').notEmpty().withMessage('Reset token required'),
    body('password')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must be at least 8 characters with uppercase, lowercase, and number')
  ],

  completeProfile: [
    body('email').isEmail().normalizeEmail(),
    body('companyName')
      .trim()
      .isLength({ min: 1, max: 100 })
      .customSanitizer(sanitizeInput),
    body('companySize').isIn(['1', '2-10', '11-50', '51-200', '200+']),
    body('website').optional().isURL().withMessage('Invalid website URL')
  ],

  completeFreelancerProfile: [
    body('email').isEmail().normalizeEmail(),
    body('bio')
      .trim()
      .isLength({ min: 10, max: 500 })
      .customSanitizer(sanitizeInput),
    body('skills')
      .trim()
      .isLength({ min: 1 })
      .customSanitizer(sanitizeInput),
    body('phone')
      .trim()
      .matches(/^[\+]?[1-9][\d]{0,15}$/)
      .withMessage('Invalid phone number'),
    body('hourlyRate')
      .isFloat({ min: 1, max: 10000 })
      .withMessage('Hourly rate must be between $1-$10000')
  ]
};

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { message: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests, please try again later' }
});

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

module.exports = {
  authValidation,
  authLimiter,
  generalLimiter,
  handleValidationErrors,
  sanitizeInput
};