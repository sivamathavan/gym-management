const jwt = require('jsonwebtoken');
const { queryOne, getIsConnected } = require('../config/db');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user;
    if (!getIsConnected()) {
      // Mock user for demo
      user = { id: 1, name: 'Demo Admin', email: 'admin@fitcore.in', role: 'super_admin', branch_id: 1, is_active: true };
    } else {
      user = await queryOne(
        'SELECT id, name, email, role, branch_id, is_active FROM users WHERE id = $1',
        [decoded.userId]
      );
    }

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Role-based access control
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

// Branch scoping — non-super-admins only see their branch
const scopeBranch = (req, res, next) => {
  if (req.user.role === 'super_admin') {
    if (req.query.branch_id) {
      req.branchFilter = req.query.branch_id;
    }
  } else if (req.user.branch_id) {
    req.branchFilter = req.user.branch_id;
  }
  next();
};

module.exports = { authenticate, requireRole, scopeBranch };
