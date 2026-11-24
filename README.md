# Full-Stack Web Application (Vue 3 + Node.js + MySQL)

โปรเจกต์เว็บแอปพลิเคชันจัดการข้อมูล สำหรับเตรียมความพร้อมการแข่งขันทักษะวิชาชีพ รายการที่ 58 (ส่วนที่ 4: ซอฟต์แวร์และการประยุกต์)

---

## โครงสร้างโปรเจกต์

```
project-root/
├── database/
│   └── init.sql                 # คำสั่ง SQL สร้างฐานข้อมูลและ 3 ตาราง
├── backend/
│   ├── lib/
│   │   └── db.js                # เชื่อมต่อฐานข้อมูล MySQL
│   ├── middleware/
│   │   └── auth.js              # ตรวจสอบ JWT Token
│   ├── routes/
│   │   ├── auth.js              # API สมัครสมาชิก, เข้าสู่ระบบ, โปรไฟล์
│   │   └── items.js             # API หมวดหมู่ และ CRUD + ค้นหา + อัปโหลดไฟล์
│   ├── tests/
│   │   ├── unit.test.js         # Unit Test (Vitest)
│   │   └── integration.test.js  # Integration Test (Supertest)
│   ├── uploads/                 # โฟลเดอร์เก็บไฟล์ที่อัปโหลด
│   ├── index.js                 # Express Application Entrypoint
│   ├── package.json
│   ├── Dockerfile               # Docker Image Configuration
│   └── .dockerignore
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   │   └── main.css         # Responsive Stylesheet
│   │   ├── router/
│   │   │   └── index.js         # Vue Router + Navigation Guard
│   │   ├── stores/
│   │   │   └── auth.js          # Pinia Auth Store (State + Token)
│   │   ├── views/
│   │   │   ├── LoginView.vue    # หน้า Login
│   │   │   ├── RegisterView.vue # หน้า Register (เลือก Role)
│   │   │   └── DashboardView.vue# หน้าจัดการข้อมูล (CRUD + Upload + Filter + Pagination)
│   │   ├── api.js               # Helper เรียก Backend API + แนบ Token อัตโนมัติ
│   │   ├── App.vue
│   │   └── main.js
│   ├── tests/
│   │   └── e2e.spec.js          # E2E Test (Playwright)
│   └── package.json
└── README.md                    # เอกสารอธิบายระบบและ RESTful API
```

---

## ขั้นตอนการติดตั้งและรันระบบ

### 1. ฐานข้อมูล (MySQL)
นำคำสั่งจาก `database/init.sql` ไปรันใน MySQL Workbench หรือ CLI:
```bash
mysql -u root -p < database/init.sql
```

### 2. ฝั่ง Back-end
```bash
cd backend
npm install
npm start       # ทำงานที่ http://localhost:3000
npm test        # รัน Unit & Integration Tests (Vitest)
```

### 3. ฝั่ง Front-end
```bash
cd frontend
npm install
npm run dev     # ทำงานที่ http://localhost:5173
npm run build   # ตรวจสอบ Type และ Build สำหรับ Production
```

---

## เอกสารอธิบาย RESTful API

ทุก Endpoint (ยกเว้น `/register` และ `/login`) ต้องแนบ Header:
`Authorization: Bearer <JWT_TOKEN>`

### 1. ระบบยืนยันตัวตน (Authentication)

| Method | Endpoint | คำอธิบาย | ตัวอย่าง Request Body |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/register` | สมัครสมาชิกใหม่ | `{ "username": "...", "password": "...", "role": "admin" \| "user1" \| "user2" }` |
| `POST` | `/api/login` | เข้าสู่ระบบและรับ Token | `{ "username": "...", "password": "..." }` |
| `GET` | `/api/profile` | ดึงข้อมูลผู้ใช้งานปัจจุบัน | *(Bearer Token)* |

### 2. หมวดหมู่และรายการข้อมูล (Categories & Items)

| Method | Endpoint | รูปแบบข้อมูล | คำอธิบาย |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/categories` | JSON | ดึงรายชื่อหมวดหมู่ทั้งหมดสำหรับตัวกรอง |
| `GET` | `/api/items` | Query Params | ค้นหาและดึงรายการ (`?search=...&category_id=...`) |
| `POST` | `/api/items` | `multipart/form-data` | เพิ่มรายการใหม่พร้อมแนบไฟล์ (`title`, `description`, `category_id`, `file`) |
| `PUT` | `/api/items/:id` | `multipart/form-data` | แก้ไขข้อมูลและไฟล์แนบ (`title`, `description`, `category_id`, `completed`, `file`) |
| `DELETE` | `/api/items/:id` | URL Param | ลบรายการข้อมูล |

---

## การแบ่งสิทธิ์การใช้งาน (Role-based Access Control)
- **admin**: ผู้ดูแลระบบ (Administrator) — มองเห็นข้อมูลของทุกคนในระบบ, สามารถสร้าง, แก้ไข และลบได้ทุกรายการ.
- **user1**: เจ้าหน้าที่ปฏิบัติการ (Officer) — มองเห็นข้อมูลของทุกคนในระบบ, สามารถสร้าง, แก้ไข และลบได้เฉพาะข้อมูลของตนเอง (ดูข้อมูลของผู้อื่นได้).
- **user2**: พนักงานทั่วไป (Staff) — มองเห็นข้อมูลของทุกคนในระบบ, สามารถสร้าง และแก้ไขได้เฉพาะข้อมูลของตนเอง แต่ไม่มีสิทธิ์ลบข้อมูลใดๆ.
