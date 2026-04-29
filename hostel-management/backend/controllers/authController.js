const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// @desc Register student
exports.register = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { name, email, password, phone, course, department, year_of_study,
            father_name, mother_name, permanent_address, emergency_contact,
            date_of_birth, gender, blood_group } = req.body;

    const [existing] = await conn.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const [userResult] = await conn.execute(
      'INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, 'student', phone]
    );
    const userId = userResult.insertId;

    const studentId = 'STU' + Date.now().toString().slice(-6);
    await conn.execute(
      `INSERT INTO students (user_id, student_id, course, department, year_of_study,
        father_name, mother_name, permanent_address, emergency_contact,
        date_of_birth, gender, blood_group, joining_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())`,
      [userId, studentId, course, department, year_of_study,
       father_name, mother_name, permanent_address, emergency_contact,
       date_of_birth, gender, blood_group]
    );

    await conn.commit();
    const token = generateToken(userId);
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: { id: userId, name, email, role: 'student', studentId }
    });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  } finally {
    conn.release();
  }
};

// @desc Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const [users] = await pool.execute(
      'SELECT id, name, email, password, role, is_active FROM users WHERE email = ?', [email]
    );

    if (!users.length) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = users[0];
    if (!user.is_active) {
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    let studentData = null;
    if (user.role === 'student') {
      const [students] = await pool.execute(
        'SELECT id, student_id, course, department, status FROM students WHERE user_id = ?', [user.id]
      );
      if (students.length) studentData = students[0];
    }

    const token = generateToken(user.id);
    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, student: studentData }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Get profile
exports.getProfile = async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, name, email, role, phone, profile_image, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    let profile = users[0];

    if (req.user.role === 'student') {
      const [students] = await pool.execute(
        `SELECT s.*, r.room_number, r.block, r.floor, r.room_type
         FROM students s
         LEFT JOIN room_bookings rb ON s.id = rb.student_id AND rb.status = 'approved'
         LEFT JOIN rooms r ON rb.room_id = r.id
         WHERE s.user_id = ?`, [req.user.id]
      );
      profile.student = students[0] || null;
    }

    res.json({ success: true, data: profile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Update profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    await pool.execute('UPDATE users SET name = ?, phone = ? WHERE id = ?', [name, phone, req.user.id]);

    if (req.user.role === 'student') {
      const { course, department, year_of_study, emergency_contact, permanent_address } = req.body;
      await pool.execute(
        'UPDATE students SET course=?, department=?, year_of_study=?, emergency_contact=?, permanent_address=? WHERE user_id=?',
        [course, department, year_of_study, emergency_contact, permanent_address, req.user.id]
      );
    }

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const [users] = await pool.execute('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const isMatch = await bcrypt.compare(currentPassword, users[0].password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    const hashed = await bcrypt.hash(newPassword, 12);
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
