import { test, expect } from '@playwright/test';

const TEST_USER = 'asd';
const TEST_PASS = '1234'; // แก้ให้ตรงกับรหัสผ่านจริงที่ใช้ทดสอบ

test.describe('E2E Workflow Tests', () => {
  test('E2E-001: ผู้ใช้เข้าสู่ระบบสำเร็จ', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.locator('#username').fill(TEST_USER);
    await page.locator('#password').fill(TEST_PASS);
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.getByText('ระบบจัดการข้อมูล (Dashboard)')).toBeVisible();
  });

  test('E2E-002: ผู้ใช้ส่งข้อมูลสำเร็จ', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.locator('#username').fill(TEST_USER);
    await page.locator('#password').fill(TEST_PASS);
    await page.locator('button[type="submit"]').click();

    const itemTitle = `ทดสอบระบบ ${Date.now()}`;
    await page.getByPlaceholder('หัวข้อรายการ *').fill(itemTitle);
    await page.getByRole('button', { name: 'บันทึกข้อมูล' }).click();

    await expect(page.getByText('บันทึกข้อมูลสำเร็จ')).toBeVisible();
  });
});
