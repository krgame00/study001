// backend/index.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// เปิดให้เข้าถึงไฟล์ที่อัปโหลดผ่าน URL เช่น http://localhost:3000/uploads/ชื่อไฟล์
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ลงทะเบียน Router
app.use('/api', authRoutes);
app.use('/api', itemRoutes);

// จัดการกรณีเรียกเส้นทาง API ที่ไม่มีอยู่ (404)
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `ไม่พบ API เส้นทาง ${req.method} ${req.originalUrl}`,
    data: null
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});