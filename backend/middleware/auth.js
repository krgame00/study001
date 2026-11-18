const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ status: 'error', message: 'กรุณาเข้าสู่ระบบ (ไม่พบ Token)', data: null });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ status: 'error', message: 'Token ไม่ถูกต้องหรือหมดอายุ', data: null });
  }
}

module.exports = { verifyToken, JWT_SECRET };
