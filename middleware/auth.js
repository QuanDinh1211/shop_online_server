const jwt = require('jsonwebtoken');
const db = require('../database/connection');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    const token = authHeader.substring(7);
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify admin still exists
    const [rows] = await db.execute(
      'SELECT id, name, email FROM admins WHERE id = ?',
      [decoded.adminId]
    );
    
    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Admin not found'
      });
    }
    
    req.admin = rows[0];
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

module.exports = authMiddleware;