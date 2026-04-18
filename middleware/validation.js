const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

// Input sanitization helper
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

// Strict sanitizer for plain text fields (strips all HTML)
const sanitizePlainText = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

const validateFileType = (mimetype) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return allowedTypes.includes(mimetype);
};

const validateFileSize = (size, maxSize = 5 * 1024 * 1024) => { // 5MB default
  return size <= maxSize;
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
      .optional()
      .trim()
      .isLength({ min: 1, max: 1500 })
      .customSanitizer(sanitizeInput),
    body('phone')
      .optional()
      .trim()
      .matches(/^[\+]?[0-9\s\-\(\)]{7,20}$/)
      .withMessage('Invalid phone number'),
    body('hourlyRate')
      .optional()
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
  sanitizeInput,
  sanitizePlainText,
  validateEmail,
  validatePassword,
  validateFileType,
  validateFileSize
};
