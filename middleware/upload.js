const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { validateFileType, validateFileSize } = require('./validation');

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/avatars/');
  },
  filename: (req, file, cb) => {
    // Generate secure random filename
    const randomName = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${req.user.id}-${randomName}${ext}`;
    cb(null, uniqueName);
  }
});

// Enhanced file filter with security checks
const fileFilter = (req, file, cb) => {
  // Check file type
  if (!validateFileType(file.mimetype)) {
    return cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed'), false);
  }
  
  // Check file extension matches mimetype
  const ext = path.extname(file.originalname).toLowerCase();
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  if (!validExtensions.includes(ext)) {
    return cb(new Error('Invalid file extension'), false);
  }
  
  // Additional security: check for double extensions
  const filename = file.originalname.toLowerCase();
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return cb(new Error('Invalid filename'), false);
  }
  
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1, // Only 1 file at a time
    fieldSize: 1024 * 1024 // 1MB field size limit
  }
});

module.exports = upload;