const { pool } = require('../config/db');

// @desc Get all meal plans
exports.getMealPlans = async (req, res) => {
  try {
    const [plans] = await pool.execute('SELECT * FROM meal_plans WHERE is_active = TRUE');
    res.json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Subscribe to meal plan (Student)
exports.subscribeMeal = async (req, res) => {
  try {
    const { meal_plan_id, start_date } = req.body;
    const [students] = await pool.execute('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (!students.length) return res.status(404).json({ success: false, message: 'Student not found' });

    // Cancel existing subscriptions
    await pool.execute(
      "UPDATE student_meals SET status='cancelled', end_date=CURDATE() WHERE student_id=? AND status='active'",
      [students[0].id]
    );

    const [result] = await pool.execute(
      'INSERT INTO student_meals (student_id, meal_plan_id, start_date) VALUES (?, ?, ?)',
      [students[0].id, meal_plan_id, start_date]
    );
    res.status(201).json({ success: true, message: 'Meal plan subscribed successfully', subscriptionId: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Get student meal subscription
exports.getMyMealPlan = async (req, res) => {
  try {
    const [students] = await pool.execute('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (!students.length) return res.status(404).json({ success: false, message: 'Student not found' });

    const [subscription] = await pool.execute(
      `SELECT sm.*, mp.name AS plan_name, mp.price_per_month, mp.breakfast, mp.lunch, mp.dinner
       FROM student_meals sm
       JOIN meal_plans mp ON sm.meal_plan_id = mp.id
       WHERE sm.student_id = ? AND sm.status = 'active'
       ORDER BY sm.created_at DESC LIMIT 1`, [students[0].id]
    );
    res.json({ success: true, data: subscription[0] || null });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Mark meal attendance (Admin/Student)
exports.markAttendance = async (req, res) => {
  try {
    const { student_id, meal_type, date, status } = req.body;
    await pool.execute(
      `INSERT INTO meal_attendance (student_id, meal_type, date, status)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE status = ?`,
      [student_id, meal_type, date, status, status]
    );
    res.json({ success: true, message: 'Attendance marked' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Get meal attendance for student
exports.getMyAttendance = async (req, res) => {
  try {
    const [students] = await pool.execute('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (!students.length) return res.status(404).json({ success: false, message: 'Student not found' });

    const { month, year } = req.query;
    const [attendance] = await pool.execute(
      `SELECT date, meal_type, status FROM meal_attendance
       WHERE student_id = ?
       AND MONTH(date) = ? AND YEAR(date) = ?
       ORDER BY date ASC`,
      [students[0].id, month || new Date().getMonth() + 1, year || new Date().getFullYear()]
    );

    // Summary
    const [summary] = await pool.execute(
      `SELECT meal_type, 
        SUM(status='present') AS present, 
        SUM(status='absent') AS absent
       FROM meal_attendance
       WHERE student_id = ? AND MONTH(date) = ? AND YEAR(date) = ?
       GROUP BY meal_type`,
      [students[0].id, month || new Date().getMonth() + 1, year || new Date().getFullYear()]
    );

    res.json({ success: true, data: attendance, summary });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Get all subscriptions (Admin)
exports.getAllSubscriptions = async (req, res) => {
  try {
    const [subscriptions] = await pool.execute(
      `SELECT sm.*, mp.name AS plan_name, mp.price_per_month,
              u.name AS student_name, s.student_id
       FROM student_meals sm
       JOIN students s ON sm.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN meal_plans mp ON sm.meal_plan_id = mp.id
       WHERE sm.status = 'active'
       ORDER BY sm.created_at DESC`
    );
    res.json({ success: true, data: subscriptions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Get today's meal attendance (Admin)
exports.getTodayAttendance = async (req, res) => {
  try {
    const [attendance] = await pool.execute(
      `SELECT ma.*, u.name AS student_name, s.student_id
       FROM meal_attendance ma
       JOIN students s ON ma.student_id = s.id
       JOIN users u ON s.user_id = u.id
       WHERE ma.date = CURDATE()
       ORDER BY ma.meal_type, u.name`
    );
    res.json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
