const express = require('express');
const crypto = require('crypto');
const path = require('path');
const multer = require('multer');
const db = require('../lib/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// ตั้งค่า Multer (สร้างโฟลเดอร์ uploads อัตโนมัติและเก็บนามสกุลไฟล์เดิมไว้)
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ดึงหมวดหมู่ทั้งหมด
router.get('/categories', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM categories ORDER BY id ASC');
    res.json({ status: 'success', message: 'ดึงข้อมูลหมวดหมู่สำเร็จ', data: rows });
  } catch {
    res.status(500).json({ status: 'error', message: 'ไม่สามารถดึงข้อมูลหมวดหมู่ได้', data: null });
  }
});

// ดึงรายการข้อมูล (รองรับค้นหา + กรองหมวดหมู่ + แยกสิทธิ์)
router.get('/items', verifyToken, async (req, res) => {
  const { search, category_id } = req.query;
  const where = [];
  const params = [];

  if (req.user.role !== 'admin') {
    where.push('i.user_id = ?');
    params.push(req.user.userId);
  }
  if (search?.trim()) {
    const kw = `%${search.trim()}%`;
    where.push('(i.title LIKE ? OR i.description LIKE ?)');
    params.push(kw, kw);
  }
  if (category_id?.trim()) {
    where.push('i.category_id = ?');
    params.push(category_id.trim());
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const sql = `
    SELECT i.*, u.username AS owner_name, c.name AS category_name
    FROM items i
    LEFT JOIN users u ON i.user_id = u.id
    LEFT JOIN categories c ON i.category_id = c.id
    ${whereSql}
    ORDER BY i.created_at DESC
  `;

  try {
    const [rows] = await db.query(sql, params);
    res.json({ status: 'success', message: 'ดึงข้อมูลรายการสำเร็จ', data: rows });
  } catch {
    res.status(500).json({ status: 'error', message: 'ไม่สามารถดึงข้อมูลรายการได้', data: null });
  }
});

// เพิ่มรายการใหม่พร้อมแนบไฟล์
router.post('/items', verifyToken, upload.single('file'), async (req, res) => {
  const { title, description, category_id } = req.body;
  if (!title?.trim()) {
    return res.status(400).json({ status: 'error', message: 'กรุณากรอกหัวข้อรายการ', data: null });
  }

  const id = crypto.randomUUID();
  const filePath = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    await db.query(
      'INSERT INTO items (id, user_id, category_id, title, description, file_path, completed, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, NOW())',
      [id, req.user.userId, category_id?.trim() || null, title.trim(), description || '', filePath]
    );
    res.status(201).json({ status: 'success', message: 'บันทึกข้อมูลสำเร็จ', data: { id, file_path: filePath } });
  } catch {
    res.status(500).json({ status: 'error', message: 'ไม่สามารถเพิ่มรายการได้', data: null });
  }
});

// แก้ไขรายการและไฟล์แนบ
router.put('/items/:id', verifyToken, upload.single('file'), async (req, res) => {
  const { title, description, category_id, completed } = req.body;
  if (!title?.trim()) {
    return res.status(400).json({ status: 'error', message: 'กรุณากรอกหัวข้อรายการ', data: null });
  }

  const completedVal = ['true', true, '1', 1].includes(completed) ? 1 : 0;
  const params = [title.trim(), description || '', category_id?.trim() || null, completedVal];
  const fileSql = req.file ? ', file_path = ?' : '';
  if (req.file) params.push(`/uploads/${req.file.filename}`);

  params.push(req.params.id);
  const ownerSql = req.user.role === 'admin' ? '' : 'AND user_id = ?';
  if (req.user.role !== 'admin') params.push(req.user.userId);

  try {
    const [result] = await db.query(
      `UPDATE items SET title = ?, description = ?, category_id = ?, completed = ? ${fileSql} WHERE id = ? ${ownerSql}`,
      params
    );
    if (!result.affectedRows) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบรายการหรือไม่มีสิทธิ์แก้ไข', data: null });
    }
    res.json({ status: 'success', message: 'อัปเดตรายการสำเร็จ', data: null });
  } catch {
    res.status(500).json({ status: 'error', message: 'ไม่สามารถแก้ไขรายการได้', data: null });
  }
});

// ลบรายการ
router.delete('/items/:id', verifyToken, async (req, res) => {
  if (req.user.role === 'user2') {
    return res.status(403).json({ status: 'error', message: 'สิทธิ์ user2 ไม่อนุญาตให้ลบข้อมูล', data: null });
  }

  const isAdmin = req.user.role === 'admin';
  const sql = isAdmin ? 'DELETE FROM items WHERE id = ?' : 'DELETE FROM items WHERE id = ? AND user_id = ?';
  const params = isAdmin ? [req.params.id] : [req.params.id, req.user.userId];

  try {
    const [result] = await db.query(sql, params);
    if (!result.affectedRows) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบรายการหรือไม่มีสิทธิ์ลบ', data: null });
    }
    res.json({ status: 'success', message: 'ลบรายการสำเร็จ', data: null });
  } catch {
    res.status(500).json({ status: 'error', message: 'ไม่สามารถลบรายการได้', data: null });
  }
});

module.exports = router;
