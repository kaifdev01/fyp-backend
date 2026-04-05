const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    // Check if user has been inactive for more than 2 days
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    if (user.lastActivity < twoDaysAgo) {
      return res.status(401).json({
        success: false,
        message: "Session expired due to inactivity. Please login again.",
        code: "INACTIVE_LOGOUT",
      });
    }

    // Update last activity (don't await to avoid slowing down requests)
    User.findByIdAndUpdate(
      user._id,
      { lastActivity: new Date() },
      { runValidators: false }
    ).catch((err) => console.error("Failed to update activity:", err));

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Not authorized, token failed",
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if any of user's roles match allowed roles
    const userRoles = req.user.roles || [];
    const hasRole =
      roles.some((role) => userRoles.includes(role)) ||
      roles.includes(req.user.primaryRole);

    if (!hasRole) {
      return res.status(403).json({ message: "Not authorized for this role" });
    }
    next();
  };
};

module.exports = { protect, authorize };
