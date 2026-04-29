-- ================================================
--  HOSTEL MANAGEMENT SYSTEM - DATABASE SCHEMA
--  FIX: Corrected bcrypt password hashes for admin/warden (password: admin123)
-- ================================================

CREATE DATABASE IF NOT EXISTS hostel_management;
USE hostel_management;

-- ─────────────────────────────
--  USERS TABLE
-- ─────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'warden', 'student') DEFAULT 'student',
  phone VARCHAR(15),
  profile_image VARCHAR(255),
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─────────────────────────────
--  STUDENTS TABLE
-- ─────────────────────────────
CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  student_id VARCHAR(30) UNIQUE NOT NULL,
  course VARCHAR(100),
  department VARCHAR(100),
  year_of_study INT,
  father_name VARCHAR(100),
  mother_name VARCHAR(100),
  permanent_address TEXT,
  emergency_contact VARCHAR(15),
  date_of_birth DATE,
  gender ENUM('male', 'female', 'other'),
  blood_group VARCHAR(5),
  id_proof_type VARCHAR(50),
  id_proof_number VARCHAR(50),
  id_proof_image VARCHAR(255),
  joining_date DATE,
  status ENUM('active', 'inactive', 'graduated', 'suspended') DEFAULT 'active',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─────────────────────────────
--  ROOMS TABLE
-- ─────────────────────────────
CREATE TABLE IF NOT EXISTS rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_number VARCHAR(20) UNIQUE NOT NULL,
  floor INT NOT NULL,
  block VARCHAR(10),
  room_type ENUM('single', 'double', 'triple', 'dormitory') NOT NULL,
  capacity INT NOT NULL DEFAULT 1,
  occupied INT DEFAULT 0,
  price_per_month DECIMAL(10,2) NOT NULL,
  amenities TEXT,
  status ENUM('available', 'full', 'maintenance', 'reserved') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─────────────────────────────
--  ROOM BOOKINGS TABLE
-- ─────────────────────────────
CREATE TABLE IF NOT EXISTS room_bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  room_id INT NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE,
  status ENUM('pending', 'approved', 'rejected', 'checked_out') DEFAULT 'pending',
  approved_by INT,
  approved_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ─────────────────────────────
--  MAINTENANCE REQUESTS TABLE
-- ─────────────────────────────
CREATE TABLE IF NOT EXISTS maintenance_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  room_id INT,
  category ENUM('electrical', 'plumbing', 'furniture', 'cleaning', 'security', 'internet', 'other') NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  status ENUM('pending', 'in_progress', 'resolved', 'closed') DEFAULT 'pending',
  image_url VARCHAR(255),
  assigned_to VARCHAR(100),
  resolved_at TIMESTAMP,
  admin_notes TEXT,
  ml_priority_score FLOAT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL
);

-- ─────────────────────────────
--  FEE PAYMENTS TABLE
-- ─────────────────────────────
CREATE TABLE IF NOT EXISTS fee_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  room_booking_id INT,
  fee_type ENUM('room_rent', 'mess_fee', 'maintenance_fee', 'security_deposit', 'other') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  payment_method ENUM('cash', 'online', 'cheque', 'upi') DEFAULT 'online',
  transaction_id VARCHAR(100),
  status ENUM('pending', 'paid', 'overdue', 'waived') DEFAULT 'pending',
  month VARCHAR(20),
  year INT,
  receipt_number VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (room_booking_id) REFERENCES room_bookings(id) ON DELETE SET NULL
);

-- ─────────────────────────────
--  MEAL PLANS TABLE
-- ─────────────────────────────
CREATE TABLE IF NOT EXISTS meal_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price_per_month DECIMAL(10,2) NOT NULL,
  breakfast BOOLEAN DEFAULT TRUE,
  lunch BOOLEAN DEFAULT TRUE,
  dinner BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────
--  STUDENT MEAL SUBSCRIPTIONS
-- ─────────────────────────────
CREATE TABLE IF NOT EXISTS student_meals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  meal_plan_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  status ENUM('active', 'paused', 'cancelled') DEFAULT 'active',
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (meal_plan_id) REFERENCES meal_plans(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────
--  MEAL ATTENDANCE TABLE
-- ─────────────────────────────
CREATE TABLE IF NOT EXISTS meal_attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  meal_type ENUM('breakfast', 'lunch', 'dinner') NOT NULL,
  date DATE NOT NULL,
  status ENUM('present', 'absent') DEFAULT 'present',
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE KEY unique_meal_attendance (student_id, meal_type, date),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────
--  COMPLAINTS TABLE
-- ─────────────────────────────
CREATE TABLE IF NOT EXISTS complaints (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  category ENUM('maintenance', 'mess', 'staff', 'security', 'neighbor', 'facilities', 'other') NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  status ENUM('open', 'in_review', 'resolved', 'closed') DEFAULT 'open',
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  admin_response TEXT,
  resolved_by INT,
  resolved_at TIMESTAMP,
  ml_sentiment VARCHAR(20),
  ml_urgency_score FLOAT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ─────────────────────────────
--  NOTICES TABLE
-- ─────────────────────────────
CREATE TABLE IF NOT EXISTS notices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category ENUM('general', 'maintenance', 'fees', 'events', 'rules', 'emergency') DEFAULT 'general',
  priority ENUM('normal', 'important', 'urgent') DEFAULT 'normal',
  target_audience ENUM('all', 'students', 'wardens') DEFAULT 'all',
  is_pinned BOOLEAN DEFAULT FALSE,
  attachment_url VARCHAR(255),
  created_by INT NOT NULL,
  expires_at DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────
--  NOTIFICATIONS TABLE
-- ─────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  link VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────
--  VISITOR LOG TABLE
-- ─────────────────────────────
CREATE TABLE IF NOT EXISTS visitor_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  visitor_name VARCHAR(100) NOT NULL,
  visitor_phone VARCHAR(15),
  relation VARCHAR(50),
  purpose TEXT,
  check_in TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  check_out TIMESTAMP,
  approved_by INT,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────────────────
--  SEED DEFAULT DATA
--  BUG FIX: Replaced wrong bcrypt hash (was hash of "password")
--  with correct bcrypt hashes for "admin123"
-- ─────────────────────────────────────────────────────────

-- Default Admin & Warden users (password: admin123)
INSERT IGNORE INTO users (name, email, password, role, is_verified, is_active) VALUES
('Admin User',   'admin@hostel.com',  '$2b$12$yeSHqazwxdt62/ZJJb5OcexIiiX6jeVCK9JzoOZv/9.qtF.AvFMvO', 'admin',  TRUE, TRUE),
('Warden Singh', 'warden@hostel.com', '$2b$12$X2ie9uVRNw73SxlC7ldMLOwBwEt4toDYPGAVhSHK1qHjFAAa4bn9i', 'warden', TRUE, TRUE);

-- ─────────────────────────────────────────────────────────
--  UPDATE SCRIPT: Run this if admin/warden already exist in DB
--  with the old wrong password hash
-- ─────────────────────────────────────────────────────────
-- UPDATE users SET password = '$2b$12$yeSHqazwxdt62/ZJJb5OcexIiiX6jeVCK9JzoOZv/9.qtF.AvFMvO'
--   WHERE email = 'admin@hostel.com';
-- UPDATE users SET password = '$2b$12$X2ie9uVRNw73SxlC7ldMLOwBwEt4toDYPGAVhSHK1qHjFAAa4bn9i'
--   WHERE email = 'warden@hostel.com';

-- Default Rooms
INSERT IGNORE INTO rooms (room_number, floor, block, room_type, capacity, price_per_month, amenities, status) VALUES
('A101', 1, 'A', 'single',    1, 5000.00, 'WiFi, AC, Attached Bathroom',           'available'),
('A102', 1, 'A', 'double',    2, 3500.00, 'WiFi, Fan, Common Bathroom',             'available'),
('A103', 1, 'A', 'triple',    3, 2500.00, 'WiFi, Fan, Common Bathroom',             'available'),
('A201', 2, 'A', 'single',    1, 5500.00, 'WiFi, AC, Attached Bathroom, Balcony',   'available'),
('A202', 2, 'A', 'double',    2, 4000.00, 'WiFi, AC, Common Bathroom',              'available'),
('B101', 1, 'B', 'single',    1, 4800.00, 'WiFi, AC, Attached Bathroom',            'available'),
('B102', 1, 'B', 'double',    2, 3200.00, 'WiFi, Fan, Common Bathroom',             'available'),
('B201', 2, 'B', 'dormitory', 6, 1800.00, 'WiFi, Fan, Common Bathroom',             'available'),
('C101', 1, 'C', 'single',    1, 5200.00, 'WiFi, AC, Attached Bathroom',            'maintenance'),
('C102', 1, 'C', 'double',    2, 3800.00, 'WiFi, AC, Common Bathroom',              'available');

-- Default Meal Plans
INSERT IGNORE INTO meal_plans (name, description, price_per_month, breakfast, lunch, dinner) VALUES
('Full Board',     'All three meals included',  3500.00, TRUE,  TRUE,  TRUE),
('Half Board',     'Breakfast and Dinner only', 2500.00, TRUE,  FALSE, TRUE),
('Lunch & Dinner', 'Lunch and Dinner only',     2200.00, FALSE, TRUE,  TRUE),
('Dinner Only',    'Dinner only plan',          1500.00, FALSE, FALSE, TRUE);

-- Sample Notices (created_by = 1 = Admin)
INSERT IGNORE INTO notices (title, content, category, priority, target_audience, is_pinned, created_by) VALUES
('Welcome to Hostel Management System',
 'We are pleased to launch the new digital hostel management portal. Students can now book rooms, pay fees, and submit complaints online.',
 'general', 'important', 'all', TRUE, 1),
('Fee Payment Deadline',
 'All students are reminded that hostel fees must be paid by the 5th of each month. Late payments will incur a penalty of Rs. 100 per day.',
 'fees', 'urgent', 'students', FALSE, 1),
('Water Supply Maintenance',
 'Water supply will be interrupted on Saturday from 6 AM to 12 PM for maintenance work. Please store water accordingly.',
 'maintenance', 'important', 'all', FALSE, 2);
