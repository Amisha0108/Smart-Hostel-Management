-- =====================================================
--  QUICK FIX SCRIPT
--  Run this if admin/warden already exist in your DB
--  with the old broken password hash.
--  These are correct bcrypt hashes for password: admin123
-- =====================================================

USE hostel_management;

UPDATE users
SET password = '$2b$12$yeSHqazwxdt62/ZJJb5OcexIiiX6jeVCK9JzoOZv/9.qtF.AvFMvO'
WHERE email = 'admin@hostel.com';

UPDATE users
SET password = '$2b$12$X2ie9uVRNw73SxlC7ldMLOwBwEt4toDYPGAVhSHK1qHjFAAa4bn9i'
WHERE email = 'warden@hostel.com';

-- Ensure both accounts are active
UPDATE users SET is_active = TRUE, is_verified = TRUE
WHERE email IN ('admin@hostel.com', 'warden@hostel.com');

-- Verify the fix
SELECT id, name, email, role, is_active, is_verified FROM users
WHERE email IN ('admin@hostel.com', 'warden@hostel.com');
