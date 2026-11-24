# AI Working Notes & Verification Log

## Project: Full-Stack Web Application (Node.js + Vue 3 + MySQL)

### Active Status & Components
- **MySQL Service (`MYSQL80`)**: `VERIFIED WORKING` (Running on port 3306).
- **DBeaver Database Connection**: `VERIFIED WORKING` (Connected to MySQL 8.0.46 in 25ms).
- **Backend (`backend/index.js`)**: `VERIFIED WORKING` on port 3000.
- **Frontend (`frontend`)**: `VERIFIED WORKING` on port 5173.
- **Database (`node-jwt`)**: `VERIFIED WORKING` (Schema created via `init.sql`).

### Incident 1: DBeaver "Connection refused: getsockopt"
- **Status**: `VERIFIED RESOLVED`
- **Resolution**: Service `MYSQL80` started and confirmed `Running`.

### Incident 2: DBeaver "Public Key Retrieval is not allowed"
- **Status**: `VERIFIED RESOLVED`
- **Resolution**: Enabled `allowPublicKeyRetrieval = TRUE` in Driver properties. Connection test passed with `Connected (25 ms)`.

### Incident 3: Non-admin users cannot see admin tasks
- **Status**: `VERIFIED WORKING / FIXED`
- **Root Cause**: `GET /items` had an extra `WHERE i.user_id = ?` check that isolated items to their author only.
- **Resolution**: 
  1. Removed `where.push('i.user_id = ?')` from `GET /items` in both `goofy-faraday` and `New folder`. Now all users view all items.
  2. Updated `DashboardView.vue` so everyone sees the "เจ้าของข้อมูล" (owner) column.
  3. Action buttons dynamically adapt to role and ownership:
     - `admin`: Edit & Delete on all rows.
     - `user1`: Edit & Delete on own rows; "ดูได้อย่างเดียว" on others' rows.
     - `user2`: Edit only on own rows (cannot delete); "ดูได้อย่างเดียว" on others' rows.
  4. Backend tests passed (4/4).

### Role Naming: Corporate/Office Theme (Option 1)
- **Status**: `VERIFIED WORKING`
- **Roles Configured**:
  - `admin`: ผู้ดูแลระบบ (Administrator / Admin)
  - `user1`: เจ้าหน้าที่ปฏิบัติการ (Officer / User 1)
  - `user2`: พนักงานทั่วไป (Staff / User 2)
- **UI Updated**: `RegisterView.vue` and `DashboardView.vue` updated across both projects. Frontend builds with 0 errors.

### DBeaver GUI Guide added to GUIDE.md
- **Status**: `DOCUMENTED & VERIFIED`
- **Details**: Added Section 1.1 with step-by-step GUI instructions in DBeaver (Create DB, create 3 tables, setup constraints, insert seed data, save & persist). Kept Section 1.2 for quick SQL script execution. Aligned `init.sql` schema.
