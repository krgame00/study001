import { describe, it, expect } from 'vitest';
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../index');
const { JWT_SECRET } = require('../middleware/auth');

describe('Integration Test: RESTful API', () => {
  it('INT-001: POST /api/login คืนค่า 400 เมื่อส่งข้อมูลไม่ครบ', async () => {
    const res = await request(app).post('/api/login').send({ username: '' });
    expect(res.statusCode).toBe(400);
  });

  it('INT-002: GET /api/profile คืนค่า 200 เมื่อแนบ Bearer Token ถูกต้อง', async () => {
    const token = jwt.sign({ userId: 'u-001', username: 'asd', role: 'admin' }, JWT_SECRET);
    const res = await request(app).get('/api/profile').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.username).toBe('asd');
  });
});
