// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your-secret-key-change-in-production';

// Middleware ตรวจสอบ JWT Token ก่อนเข้าถึง API ที่ต้องยืนยันตัวตน
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'กรุณาเข้าสู่ระบบ (ไม่พบ Token)',
      data: null
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // เก็บ userId, username และ role ไว้ใช้ตรวจสอบสิทธิ์
    next();
  } catch (err) {
    return res.status(403).json({
      status: 'error',
      message: 'Token ไม่ถูกต้องหรือหมดอายุ',
      data: null
    });
  }
}

module.exports = { verifyToken, JWT_SECRET };