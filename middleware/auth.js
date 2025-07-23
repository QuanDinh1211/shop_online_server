import jwt from 'jsonwebtoken';
import db from '../config/database.js';

// Middleware xác thực JWT token
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token không được cung cấp',
        message: 'Vui lòng đăng nhập để tiếp tục'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Kiểm tra user có tồn tại trong database không
    const [users] = await db.execute(
      'SELECT id, name, email FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Token không hợp lệ',
        message: 'User không tồn tại'
      });
    }

    // Thêm thông tin user vào request
    req.user = {
      id: users[0].id,
      name: users[0].name,
      email: users[0].email
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token không hợp lệ',
        message: 'Token đã bị thay đổi hoặc không đúng định dạng'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token đã hết hạn',
        message: 'Vui lòng đăng nhập lại'
      });
    }

    console.error('Lỗi xác thực token:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi server',
      message: 'Không thể xác thực token'
    });
  }
};