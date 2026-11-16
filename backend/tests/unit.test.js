import { describe, it, expect, vi } from 'vitest';
const jwt = require('jsonwebtoken');
const { verifyToken, JWT_SECRET } = require('../middleware/auth');

describe('Unit Test: verifyToken Middleware', () => {
  it('UNIT-001: ปฏิเสธคำขอด้วยสถานะ 401 เมื่อไม่มี Token', () => {
    const req = { headers: {} };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    verifyToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('UNIT-002: ถอดรหัส Token ที่ถูกต้องและเรียก next() ได้', () => {
    const token = jwt.sign({ userId: 'u-001', username: 'asd', role: 'admin' }, JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    verifyToken(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user.role).toBe('admin');
  });
});
