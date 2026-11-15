// backend/routes/items.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const uuid = require('uuid');
const db = require('../lib/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// ตั้งค่าโฟลเดอร์เก็บไฟล์อัปโหลด (สร้างอัตโนมัติถ้ายังไม่มี)
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uuid.v4()}${ext}`);
  }
});
const upload = multer({ storage });

/**
 * @api {GET} /api/categories ดึงรายการหมวดหมู่ทั้งหมด
 */
router.get('/categories', verifyToken, (req, res) => {
  db.query('SELECT * FROM categories ORDER BY id ASC;', (err, results) => {
    if (err) {
      return res.status(500).json({ status: 'error', message: 'ไม่สามารถดึงข้อมูลหมวดหมู่ได้', data: null });
    }
    res.json({ status: 'success', message: 'ดึงข้อมูลหมวดหมู่สำเร็จ', data: results });
  });
});

/**
 * @api {GET} /api/items ดึงรายการข้อมูล (รองรับการค้นหาและแยกสิทธิ์ตาม role)
 * @query {String} [search] คำค้นหาในหัวข้อหรือรายละเอียด
 * @query {String} [category_id] รหัสหมวดหมู่ที่ต้องการกรอง
 */
router.get('/items', verifyToken, (req, res) => {
  const { search, category_id } = req.query;
  const conditions = [];

  // หากไม่ใช่ admin ให้เห็นเฉพาะข้อมูลของตนเอง (admin เห็นข้อมูลของทุกคน)
  if (req.user.role !== 'admin') {
    conditions.push(`i.user_id = ${db.escape(req.user.userId)}`);
  }

  if (search && search.trim()) {
    const keyword = `%${search.trim()}%`;
    conditions.push(`(i.title LIKE ${db.escape(keyword)} OR i.description LIKE ${db.escape(keyword)})`);
  }

  if (category_id && category_id.trim()) {
    conditions.push(`i.category_id = ${db.escape(category_id.trim())}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `
    SELECT i.*, u.username AS owner_name, c.name AS category_name
    FROM items i
    LEFT JOIN users u ON i.user_id = u.id
    LEFT JOIN categories c ON i.category_id = c.id
    ${whereClause}
    ORDER BY i.created_at DESC;
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ status: 'error', message: 'ไม่สามารถดึงข้อมูลรายการได้', data: null });
    }
    res.json({ status: 'success', message: 'ดึงข้อมูลรายการสำเร็จ', data: results });
  });
});

/**
 * @api {POST} /api/items เพิ่มรายการใหม่พร้อมแนบไฟล์ (multipart/form-data)
 * @body {String} title หัวข้อรายการ
 * @body {String} [description] รายละเอียด
 * @body {String} [category_id] รหัสหมวดหมู่
 * @file {File} [file] ไฟล์แนบ
 */
router.post('/items', verifyToken, upload.single('file'), (req, res) => {
  const { title, description, category_id } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ status: 'error', message: 'กรุณากรอกหัวข้อรายการ', data: null });
  }

  const newId = uuid.v4();
  const filePath = req.file ? `/uploads/${req.file.filename}` : null;
  const catValue = category_id && category_id.trim() ? db.escape(category_id.trim()) : 'NULL';

  const sql = `
    INSERT INTO items (id, user_id, category_id, title, description, file_path, completed, created_at)
    VALUES (${db.escape(newId)}, ${db.escape(req.user.userId)}, ${catValue}, ${db.escape(title.trim())}, ${db.escape(
    description || ''
  )}, ${db.escape(filePath)}, 0, now());
  `;

  db.query(sql, (err) => {
    if (err) {
      return res.status(500).json({ status: 'error', message: 'ไม่สามารถเพิ่มรายการได้', data: null });
    }
    res.status(201).json({
      status: 'success',
      message: 'บันทึกข้อมูลสำเร็จ',
      data: { id: newId, file_path: filePath }
    });
  });
});

/**
 * @api {PUT} /api/items/:id แก้ไขรายการและไฟล์แนบตามรหัสรายการ
 * @param {String} id รหัสรายการ
 */
router.put('/items/:id', verifyToken, upload.single('file'), (req, res) => {
  const { id } = req.params;
  const { title, description, category_id, completed } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ status: 'error', message: 'กรุณากรอกหัวข้อรายการ', data: null });
  }

  const completedValue = completed === 'true' || completed === true || completed === '1' || completed === 1 ? 1 : 0;
  const catValue = category_id && category_id.trim() ? db.escape(category_id.trim()) : 'NULL';
  const fileUpdateSql = req.file ? `, file_path = ${db.escape(`/uploads/${req.file.filename}`)}` : '';
  const ownerFilter = req.user.role === 'admin' ? '' : `AND user_id = ${db.escape(req.user.userId)}`;

  const sql = `
    UPDATE items
    SET title = ${db.escape(title.trim())},
        description = ${db.escape(description || '')},
        category_id = ${catValue},
        completed = ${completedValue}
        ${fileUpdateSql}
    WHERE id = ${db.escape(id)} ${ownerFilter};
  `;

  db.query(sql, (err, result) => {
    if (err) {
      return res.status(500).json({ status: 'error', message: 'ไม่สามารถแก้ไขรายการได้', data: null });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบรายการหรือไม่มีสิทธิ์แก้ไข', data: null });
    }
    res.json({ status: 'success', message: 'อัปเดตรายการสำเร็จ', data: null });
  });
});

/**
 * @api {DELETE} /api/items/:id ลบรายการตามรหัสรายการ
 * @param {String} id รหัสรายการ
 */
router.delete('/items/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const ownerFilter = req.user.role === 'admin' ? '' : `AND user_id = ${db.escape(req.user.userId)}`;

  db.query(`DELETE FROM items WHERE id = ${db.escape(id)} ${ownerFilter};`, (err, result) => {
    if (err) {
      return res.status(500).json({ status: 'error', message: 'ไม่สามารถลบรายการได้', data: null });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบรายการหรือไม่มีสิทธิ์ลบ', data: null });
    }
    res.json({ status: 'success', message: 'ลบรายการสำเร็จ', data: null });
  });
});

module.exports = router;