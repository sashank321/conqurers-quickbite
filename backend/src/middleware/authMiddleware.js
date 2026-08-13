const jwt = require('jsonwebtoken');
const { prisma } = require('../config/db');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const secret = process.env.JWT_SECRET;

      if (!secret) {
        return res.status(500).json({
          success: false,
          message: 'Server security configuration error: JWT_SECRET missing'
        });
      }

      const decoded = jwt.verify(token, secret);

      req.user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true }
      });

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, user not found'
        });
      }
      
      // Map id to _id for frontend compatibility
      req.user._id = req.user.id;

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found or account disabled'
        });
      }

      return next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed or expired'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided'
    });
  }
};

module.exports = { protect };
