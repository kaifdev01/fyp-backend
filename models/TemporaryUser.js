const mongoose = require('mongoose');

const temporaryUserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
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
        isAddingRole: { type: Boolean, default: false },
        existingUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600 // Document automatically deleted after 600 seconds (10 minutes)
    }
});

module.exports = mongoose.model('TemporaryUser', temporaryUserSchema);
