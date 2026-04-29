## 👥 Team Members
- Amisha
- Kanika
- Ritika

## 📌 Note
This project was developed as a team effort and submitted individually.

# 🏠 Hostel Management System

A full-stack hostel management system built with React (frontend) and Node.js + Express + MySQL (backend).

---

## 🐛 Bugs Fixed in This Version

### Bug 1 — CRITICAL: Wrong bcrypt password hash (Admin & Warden login broken)
**File:** `backend/config/schema.sql`
**Problem:** The seed data for admin and warden users contained a bcrypt hash of the word `"password"`, not `"admin123"`. Every login attempt failed at the password comparison step.
**Fix:** Replaced with correctly generated bcrypt hashes for `"admin123"`.

### Bug 2 — Warden role not handled in login navigation
**File:** `frontend/src/pages/AuthPage.js`
**Problem:** Login redirect used `role === 'student' ? '/student/...' : '/admin/...'` — worked, but added explicit `getDashboardPath()` function for clarity and safety across all 3 roles.
**Fix:** Explicit role-to-path mapping function covering `admin`, `warden`, and `student`.

### Bug 3 — ProtectedRoute didn't explicitly document warden access
**File:** `frontend/src/App.js`
**Fix:** Made role guard logic explicit with comments, and fixed `homePath` to be a variable (was calling a function that didn't exist as a variable).

### Bug 4 — Duplicate/dead commented code in api.js
**File:** `frontend/src/utils/api.js`
**Fix:** Removed 100+ lines of duplicate commented-out code. Added `getMy` alias on `feeAPI` for compatibility with components using either `feeAPI.getMy()` or `feeAPI.getMyFees()`.

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js v16+
- MySQL 8.0+
- npm

---

### Step 1 — Database Setup

```bash
# Login to MySQL
mysql -u root -p

# Run the schema (creates DB, tables, and seeds admin/warden/rooms/meals)
source /path/to/hostel-management/backend/config/schema.sql
```

**If admin/warden already exist in your DB with the old broken hash, run:**
```sql
UPDATE users SET password = '$2b$12$yeSHqazwxdt62/ZJJb5OcexIiiX6jeVCK9JzoOZv/9.qtF.AvFMvO'
  WHERE email = 'admin@hostel.com';

UPDATE users SET password = '$2b$12$X2ie9uVRNw73SxlC7ldMLOwBwEt4toDYPGAVhSHK1qHjFAAa4bn9i'
  WHERE email = 'warden@hostel.com';
```

---

### Step 2 — Backend Setup

```bash
cd hostel-management/backend

# Install dependencies
npm install

# Configure environment
# Edit .env and set your MySQL password:
# DB_PASSWORD=your_mysql_password_here
```

Edit `backend/.env`:
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=hostel_management
JWT_SECRET=hostelms_super_secret_jwt_key_change_in_production_2024
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
```

```bash
# Start the backend server
npm run dev
# OR
npm start
```

Backend runs at: http://localhost:5000

---

### Step 3 — Frontend Setup

```bash
cd hostel-management/frontend

# Install dependencies
npm install

# Start the React dev server
npm start
```

Frontend runs at: http://localhost:3000

---

## 🔐 Login Credentials

| Role    | Email                  | Password  |
|---------|------------------------|-----------|
| Admin   | admin@hostel.com       | admin123  |
| Warden  | warden@hostel.com      | admin123  |
| Student | Register via signup form | (set during registration) |

---

## 📁 Project Structure

```
hostel-management/
├── backend/
│   ├── config/
│   │   ├── db.js              # MySQL connection pool
│   │   └── schema.sql         # ✅ FIXED - correct password hashes
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── adminController.js
│   │   ├── roomController.js
│   │   ├── feeController.js
│   │   ├── maintenanceController.js
│   │   ├── mealController.js
│   │   └── complaintNoticeController.js
│   ├── middleware/
│   │   └── auth.js            # JWT protect + adminOnly middleware
│   ├── routes/
│   │   └── index.js           # All API routes
│   ├── .env                   # ⚠️ Set your DB_PASSWORD here
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── Sidebar.js
    │   │   └── Topbar.js
    │   ├── context/
    │   │   └── AuthContext.js
    │   ├── pages/
    │   │   ├── AuthPage.js       # ✅ FIXED - role-aware navigation
    │   │   ├── admin/
    │   │   │   ├── AdminDashboard.js
    │   │   │   ├── AdminPages.js
    │   │   │   ├── AdminRooms.js
    │   │   │   └── AdminStudents.js
    │   │   └── student/
    │   │       └── StudentPages.js
    │   ├── styles/
    │   │   └── global.css
    │   ├── utils/
    │   │   └── api.js            # ✅ FIXED - clean, no dead code
    │   ├── App.js                # ✅ FIXED - warden route handling
    │   └── index.js
    └── package.json
```

---

## 🛠 Features

**Admin / Warden:**
- Dashboard with stats (students, rooms, revenue, pending bookings)
- Room management (add, edit, delete, status)
- Student management (view, verify, activate/deactivate)
- Booking approvals / rejections
- Fee management (create, track, stats)
- Maintenance request management
- Complaints handling
- Notice board management

**Student:**
- Dashboard with personal info and room status
- Room browsing and booking
- Fee payment and history
- Meal plan subscription
- Maintenance request submission
- Complaint filing
- Notice board viewing
