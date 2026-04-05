const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      validate: {
        validator: function (email) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        message: "Please enter a valid email",
      },
      index: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      validate: {
        validator: function (password) {
          if (!this.isModified('password')) return true;
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
            password
          );
        },
        message:
          "Password must contain at least 8 characters with uppercase, lowercase, number and special character",
      },
      select: false,
    },
    roles: [
      {
        type: String,
        enum: ["client", "freelancer", "pending", "admin"],
      },
    ],
    primaryRole: {
      type: String,
      enum: ["client", "freelancer", "pending", "admin"],
      required: [true, "Primary role is required"],
    },
    avatar: {
      type: String,
      default: "",
    },
    intro: {
      type: String,
      maxlength: [200, "Intro cannot exceed 200 characters"],
      default: "",
    },
    bio: {
      type: String,
      maxlength: [500, "Bio cannot exceed 500 characters"],
      default: "",
    },
    title: {
      type: String,
      maxlength: [100, "Title cannot exceed 100 characters"],
      default: "",
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    location: {
      type: String,
      trim: true,
      default: "",
    },
    timezone: {
      type: String,
      default: "UTC",
    },
    experience: {
      type: String,
      enum: ["beginner", "intermediate", "expert"],
      default: "beginner",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      select: false,
    },
    otpExpires: {
      type: Date,
      select: false,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    completedProjects: {
      type: Number,
      default: 0,
    },
    companySize: {
      type: String,
      default: "",
    },
    industry: {
      type: String,
      default: "",
    },
    companyDescription: {
      type: String,
      maxlength: [500, "Company description cannot exceed 500 characters"],
      default: "",
    },
    companyLogo: {
      type: String,
      default: "",
    },
    budgetRange: {
      type: String,
      default: "",
    },
    preferredSkills: [
      {
        type: String,
        trim: true,
      },
    ],
    projectTypes: [
      {
        type: String,
        trim: true,
      },
    ],
    phone: {
      type: String,
      default: "",
      validate: {
        validator: function (phone) {
          if (!phone) return true;
          return /^[\+]?[0-9\s\-\(\)]{7,20}$/.test(phone);
        },
        message: "Please enter a valid phone number",
      },
    },
    hourlyRate: {
      type: Number,
      default: 0,
      validate: {
        validator: function (rate) {
          if (this.primaryRole !== "freelancer") return true;
          if (!rate) return true;
          return rate >= 5 && rate <= 500;
        },
        message: "Hourly rate must be between $5 and $500",
      },
    },
    googleId: {
      type: String,
      default: null,
    },
    githubId: {
      type: String,
      default: null,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    profileViews: {
      type: Number,
      default: 0,
    },
    weeklyProfileViews: {
      type: Number,
      default: 0,
    },
    lastViewsReset: {
      type: Date,
      default: Date.now,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    portfolio: [
      {
        title: String,
        description: String,
        image: String,
        url: String,
        media: [
          {
            url: String,
            type: {
              type: String,
              enum: ["image", "video"],
            },
            name: String,
          },
        ],
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    languages: [
      {
        language: String,
        proficiency: {
          type: String,
          enum: ["Basic", "Conversational", "Fluent", "Native"],
        },
      },
    ],
    education: [
      {
        school: String,
        degree: String,
        field: String,
        startYear: String,
        endYear: String,
        description: String,
      },
    ],
    kyc: {
      status: {
        type: String,
        enum: ["pending", "verified", "rejected"],
        default: "pending",
      },
      documentType: {
        type: String,
        enum: ["passport", "nationalId", "drivingLicense"],
      },
      documentNumber: {
        type: String,
        default: "",
      },
      documentImage: {
        type: String,
        default: "",
      },
      selfieImage: {
        type: String,
        default: "",
      },
      dateOfBirth: {
        type: Date,
        default: null,
      },
      country: {
        type: String,
        default: "",
      },
      address: {
        type: String,
        default: "",
      },
      city: {
        type: String,
        default: "",
      },
      postalCode: {
        type: String,
        default: "",
      },
      verifiedAt: {
        type: Date,
        default: null,
      },
      rejectionReason: {
        type: String,
        default: "",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.generateToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "2d",
  });
};

// Update last activity
userSchema.methods.updateActivity = function () {
  this.lastActivity = new Date();
  return this.save();
};

// Calculate profile completion percentage
userSchema.methods.getProfileCompletion = function () {
  if (this.primaryRole === "freelancer") {
    const requiredFields = [
      this.name,
      this.email,
      this.bio,
      this.title,
      this.location,
      this.hourlyRate > 0,
      this.phone,
      this.avatar,
      this.skills?.length > 0,
      this.languages?.length > 0,
      this.experience,
      this.timezone,
      this.kyc?.status === "verified",
    ];

    const mandatoryFields = [
      this.education?.length > 0,
      this.portfolio?.length > 0,
    ];

    const requiredCompleted = requiredFields.filter(Boolean).length;
    const mandatoryCompleted = mandatoryFields.filter(Boolean).length;

    if (mandatoryCompleted < mandatoryFields.length) {
      const maxWithoutMandatory = 85;
      return Math.min(
        Math.round(
          (requiredCompleted / requiredFields.length) * maxWithoutMandatory
        ),
        maxWithoutMandatory
      );
    }

    const allFields = [...requiredFields, ...mandatoryFields];
    const allCompleted = allFields.filter(Boolean).length;
    return Math.round((allCompleted / allFields.length) * 100);
  } else if (this.primaryRole === "client") {
    const requiredFields = [
      this.name,
      this.email,
      this.companyName,
      this.companySize,
      this.industry,
      this.phone,
      this.avatar,
    ];

    const completed = requiredFields.filter(Boolean).length;
    return Math.round((completed / requiredFields.length) * 100);
  }

  return 0;
};

// Reset weekly profile views
userSchema.methods.resetWeeklyViews = function () {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  if (this.lastViewsReset < oneWeekAgo) {
    this.weeklyProfileViews = 0;
    this.lastViewsReset = new Date();
    return this.save();
  }
};

// Increment profile views
userSchema.methods.incrementViews = function () {
  this.profileViews += 1;
  this.weeklyProfileViews += 1;
  return this.save();
};

// Generate and hash password reset token
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

// Get public user data
userSchema.methods.toPublicJSON = function () {
  const user = this.toObject();
  const fields = [
    "_id",
    "name",
    "email",
    "avatar",
    "intro",
    "bio",
    "title",
    "location",
    "timezone",
    "experience",
    "hourlyRate",
    "phone",
    "skills",
    "languages",
    "education",
    "portfolio",
    "isAvailable",
    "roles",
    "primaryRole",
    "isProfileComplete",
    "profileCompletionPercentage",
    "companyName",
    "companySize",
    "industry",
    "companyDescription",
    "companyLogo",
    "budgetRange",
    "preferredSkills",
    "projectTypes",
    "createdAt",
  ];

  const publicUser = {};
  fields.forEach((field) => {
    if (user[field] !== undefined) {
      publicUser[field] = user[field];
    }
  });

  return publicUser;
};

module.exports = mongoose.model("User", userSchema);
