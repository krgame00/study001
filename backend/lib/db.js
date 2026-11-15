// backend/lib/db.js
const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'node-jwt',
  password: '1234'
});

connection.connect((err) => {
  if (err) {
    console.error('เชื่อมต่อฐานข้อมูล MySQL ไม่สำเร็จ:', err);
    return;
  }
  console.log('เชื่อมต่อฐานข้อมูล MySQL สำเร็จ!');
});

module.exports = connection;