const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verifies the Bearer token and attaches the user to req.user
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key');
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Use after authenticate: requireRole('owner') or requireRole('owner', 'admin')
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'You do not have access to this feature'
    });
  }
  next();
};

// Parents are linked to students by phone number. Numbers are stored in
// mixed formats (+91..., 0..., plain 10 digits), so match on the last 10 digits.
const phoneSuffix = (number = '') => number.replace(/\D/g, '').slice(-10);

const phoneMatchQuery = (number) => {
  const suffix = phoneSuffix(number);
  return { $regex: `${suffix}$` };
};

module.exports = { authenticate, requireRole, phoneSuffix, phoneMatchQuery };
