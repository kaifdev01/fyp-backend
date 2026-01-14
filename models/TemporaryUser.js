const mongoose = require('mongoose');

const temporaryUserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  otp: {
    type: String,
    required: true
  },
  otpExpires: {
    type: Date,
    required: true
  },
  registrationData: {
    name: String,
    password: String,
    role: String,
    location: String,
    isAddingRole: {
      type: Boolean,
      default: false
    },
    existingUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true
});

// Auto-delete expired temporary users
temporaryUserSchema.index({ otpExpires: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('TemporaryUser', temporaryUserSchema);