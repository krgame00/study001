const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../lib/db');
const { verifyToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// สมัครสมาชิกใหม่
router.post('/register', async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) {
    return res.status(400).json({ status: 'error', message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน', data: null });
  }

  try {
    const [existing] = await db.query('SELECT id FROM users WHERE LOWER(username) = LOWER(?)', [username]);
    if (existing.length) {
      return res.status(409).json({ status: 'error', message: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว', data: null });
    }

    const id = crypto.randomUUID();
    const userRole = ['admin', 'user1', 'user2'].includes(role) ? role : 'user1';
    const hash = await bcrypt.hash(password, 10);

    await db.query(
      'INSERT INTO users (id, username, password, role, registered) VALUES (?, ?, ?, ?, NOW())',
      [id, username, hash, userRole]
    );

    res.status(201).json({ status: 'success', message: 'สมัครสมาชิกสำเร็จ', data: { id, username, role: userRole } });
  } catch {
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในฐานข้อมูล', data: null });
  }
});

// เข้าสู่ระบบและรับ JWT Token
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ status: 'error', message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน', data: null });
  }

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ status: 'error', message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', data: null });
    }

    const payload = { userId: user.id, username: user.username, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' });
    await db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    res.json({
      status: 'success',
      message: 'เข้าสู่ระบบสำเร็จ',
      data: { token, user: { id: user.id, username: user.username, role: user.role } }
    });
  } catch {
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในฐานข้อมูล', data: null });
  }
});

// ดึงข้อมูลผู้ใช้งานปัจจุบันจาก JWT
router.get('/profile', verifyToken, (req, res) => {
  res.json({ status: 'success', message: 'ยืนยันตัวตนสำเร็จ', data: req.user });
});

module.exports = router;
