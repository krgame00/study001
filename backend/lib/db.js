const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_NAME || 'node-jwt'
});

// ตรวจสอบการเชื่อมต่อและแสดงข้อความแจ้งเตือนใน Terminal
db.getConnection()
  .then((conn) => {
    console.log('เชื่อมต่อฐานข้อมูล MySQL สำเร็จ!');
    conn.release();
  })
  .catch((err) => {
    console.error('เชื่อมต่อ MySQL ไม่สำเร็จ:', err.message);
  });

module.exports = db;
