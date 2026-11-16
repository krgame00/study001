CREATE DATABASE IF NOT EXISTS `node-jwt` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `node-jwt`;

-- 1. ตารางผู้ใช้งาน (รองรับสิทธิ์ 3 ระดับ: admin, user1, user2)
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `username` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(20) NOT NULL DEFAULT 'user1',
  `registered` DATETIME NOT NULL,
  `last_login` DATETIME NULL
);

-- 2. ตารางหมวดหมู่ (สำหรับทำตัวกรอง Filter และให้ครบอย่างน้อย 3 ตาราง)
CREATE TABLE IF NOT EXISTS `categories` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `created_at` DATETIME NOT NULL
);

INSERT IGNORE INTO `categories` (`id`, `name`, `created_at`) VALUES
('cat-001', 'งานทั่วไป', NOW()),
('cat-002', 'งานด่วน', NOW()),
('cat-003', 'เอกสารรายงาน', NOW());

-- 3. ตารางรายการข้อมูล (เชื่อม Foreign Key กับ users และ categories พร้อมเก็บไฟล์แนบ)
CREATE TABLE IF NOT EXISTS `items` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `category_id` VARCHAR(36) NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `file_path` VARCHAR(255) NULL,
  `completed` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL,
  CONSTRAINT `fk_items_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_items_category` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
);
