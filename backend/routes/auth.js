// backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const uuid = require('uuid');
const db = require('../lib/db');
const { verifyToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

/**
 * @api {POST} /api/register สมัครสมาชิกใหม่
 * @body {String} username ชื่อผู้ใช้
 * @body {String} password รหัสผ่าน
 * @body {String} [role=user1] ระดับสิทธิ์ (admin, user1, user2)
 */
router.post('/register', (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      status: 'error',
      message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน',
      data: null
    });
  }

  // กำหนดสิทธิ์ให้อยู่ใน 3 ระดับที่อนุญาต (ค่าเริ่มต้นคือ user1)
  const allowedRoles = ['admin', 'user1', 'user2'];
  const userRole = allowedRoles.includes(role) ? role : 'user1';

  db.query(
    `SELECT id FROM users WHERE LOWER(username) = LOWER(${db.escape(username)});`,
    (err, result) => {
      if (err) {
        return res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในฐานข้อมูล', data: null });
      }
      if (result.length) {
        return res.status(409).json({ status: 'error', message: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว', data: null });
      }

      bcrypt.hash(password, 10, (hashErr, hash) => {
        if (hashErr) {
          return res.status(500).json({ status: 'error', message: 'ไม่สามารถเข้ารหัสรหัสผ่านได้', data: null });
        }

        const newId = uuid.v4();
        db.query(
          `INSERT INTO users (id, username, password, role, registered) VALUES (${db.escape(newId)}, ${db.escape(
            username
          )}, ${db.escape(hash)}, ${db.escape(userRole)}, now())`,
          (insertErr) => {
            if (insertErr) {
              return res.status(400).json({ status: 'error', message: 'บันทึกข้อมูลผู้ใช้ไม่สำเร็จ', data: null });
            }
            return res.status(201).json({
              status: 'success',
              message: 'สมัครสมาชิกสำเร็จ',
              data: { id: newId, username, role: userRole }
            });
          }
        );
      });
    }
  );
});

/**
 * @api {POST} /api/login เข้าสู่ระบบและรับ JWT Token
 * @body {String} username ชื่อผู้ใช้
 * @body {String} password รหัสผ่าน
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ status: 'error', message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน', data: null });
  }

  db.query(
    `SELECT * FROM users WHERE username = ${db.escape(username)};`,
    (err, result) => {
      if (err) {
        return res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในฐานข้อมูล', data: null });
      }
      if (!result.length) {
        return res.status(401).json({ status: 'error', message: 'ไม่พบชื่อผู้ใช้นี้', data: null });
      }

      const user = result[0];
      bcrypt.compare(password, user.password, (bErr, isMatch) => {
        if (bErr || !isMatch) {
          return res.status(401).json({ status: 'error', message: 'รหัสผ่านไม่ถูกต้อง', data: null });
        }

        // ลงนาม JWT พร้อมแนบ userId, username และ role
        const token = jwt.sign(
          { userId: user.id, username: user.username, role: user.role },
          JWT_SECRET,
          { expiresIn: '2h' }
        );

        db.query(`UPDATE users SET last_login = now() WHERE id = ${db.escape(user.id)}`);

        return res.status(200).json({
          status: 'success',
          message: 'เข้าสู่ระบบสำเร็จ',
          data: {
            token,
            user: { id: user.id, username: user.username, role: user.role }
          }
        });
      });
    }
  );
});

/**
 * @api {GET} /api/profile ดึงข้อมูลผู้ใช้งานปัจจุบันจาก JWT
 * @header {String} Authorization Bearer <token>
 */
router.get('/profile', verifyToken, (req, res) => {
  res.json({
    status: 'success',
    message: 'ยืนยันตัวตนสำเร็จ',
    data: req.user
  });
});

module.exports = router;