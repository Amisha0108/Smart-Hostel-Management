const { pool } = require('../config/db');

// @desc Get all students (Admin)
exports.getAllStudents = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = `
      SELECT s.*, u.name, u.email, u.phone, u.is_active,
             r.room_number, r.block
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN room_bookings rb ON s.id = rb.student_id AND rb.status = 'approved'
      LEFT JOIN rooms r ON rb.room_id = r.id
      WHERE 1=1`;
    const params = [];
    if (status) { query += ' AND s.status = ?'; params.push(status); }
    if (search) {
      query += ' AND (u.name LIKE ? OR u.email LIKE ? OR s.student_id LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    query += ' ORDER BY u.name ASC';
    const [students] = await pool.execute(query, params);
    res.json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Get single student (Admin)
exports.getStudent = async (req, res) => {
  try {
    const [students] = await pool.execute(
      `SELECT s.*, u.name, u.email, u.phone, u.is_active, u.created_at AS registered_at
       FROM students s JOIN users u ON s.user_id = u.id WHERE s.id = ?`, [req.params.id]
    );
    if (!students.length) return res.status(404).json({ success: false, message: 'Student not found' });

    const student = students[0];

    const [booking] = await pool.execute(
      `SELECT rb.*, r.room_number, r.block, r.room_type, r.price_per_month
       FROM room_bookings rb JOIN rooms r ON rb.room_id = r.id
       WHERE rb.student_id = ? AND rb.status = 'approved'`, [student.id]
    );
    const [fees] = await pool.execute(
      "SELECT SUM(amount) AS total, SUM(CASE WHEN status='paid' THEN amount ELSE 0 END) AS paid FROM fee_payments WHERE student_id = ?",
      [student.id]
    );
    const [complaints] = await pool.execute(
      'SELECT COUNT(*) AS total, SUM(status="open") AS open FROM complaints WHERE student_id = ?', [student.id]
    );
    const [maintenance] = await pool.execute(
      'SELECT COUNT(*) AS total FROM maintenance_requests WHERE student_id = ?', [student.id]
    );

    res.json({
      success: true,
      data: { ...student, booking: booking[0] || null, fees: fees[0], complaints: complaints[0], maintenance: maintenance[0] }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Verify student (Admin)
exports.verifyStudent = async (req, res) => {
  try {
    const { is_verified, status } = req.body;
    await pool.execute('UPDATE users SET is_verified = ? WHERE id = (SELECT user_id FROM students WHERE id = ?)',
      [is_verified, req.params.id]);
    if (status) {
      await pool.execute('UPDATE students SET status = ? WHERE id = ?', [status, req.params.id]);
    }
    res.json({ success: true, message: 'Student verification updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Deactivate student account
exports.toggleStudentStatus = async (req, res) => {
  try {
    const [students] = await pool.execute('SELECT user_id FROM students WHERE id = ?', [req.params.id]);
    if (!students.length) return res.status(404).json({ success: false, message: 'Student not found' });
    await pool.execute('UPDATE users SET is_active = NOT is_active WHERE id = ?', [students[0].user_id]);
    res.json({ success: true, message: 'Student status toggled' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Admin dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const [[studentStats]] = await pool.execute(`
      SELECT COUNT(*) AS total,
        SUM(status='active') AS active,
        SUM(status='inactive') AS inactive
      FROM students`);

    const [[roomStats]] = await pool.execute(`
      SELECT COUNT(*) AS total,
        SUM(status='available') AS available,
        SUM(status='full') AS full_count,
        SUM(status='maintenance') AS maintenance,
        SUM(occupied) AS total_occupied,
        SUM(capacity) AS total_capacity
      FROM rooms`);

    const [[bookingStats]] = await pool.execute(`
      SELECT COUNT(*) AS total,
        SUM(status='pending') AS pending,
        SUM(status='approved') AS approved
      FROM room_bookings`);

    const [[feeStats]] = await pool.execute(`
      SELECT SUM(amount) AS total_billed,
        SUM(CASE WHEN status='paid' THEN amount ELSE 0 END) AS collected,
        SUM(CASE WHEN status='overdue' THEN amount ELSE 0 END) AS overdue
      FROM fee_payments`);

    const [[complaintStats]] = await pool.execute(`
      SELECT COUNT(*) AS total,
        SUM(status='open') AS open_count,
        SUM(status='resolved') AS resolved
      FROM complaints`);

    const [[maintenanceStats]] = await pool.execute(`
      SELECT COUNT(*) AS total,
        SUM(status='pending') AS pending,
        SUM(priority='urgent') AS urgent
      FROM maintenance_requests`);

    const [recentBookings] = await pool.execute(`
      SELECT rb.id, rb.status, rb.created_at, u.name AS student_name, r.room_number
      FROM room_bookings rb
      JOIN students s ON rb.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN rooms r ON rb.room_id = r.id
      ORDER BY rb.created_at DESC LIMIT 5`);

    const [recentComplaints] = await pool.execute(`
      SELECT c.id, c.title, c.priority, c.status, c.created_at,
        CASE WHEN c.is_anonymous THEN 'Anonymous' ELSE u.name END AS student_name
      FROM complaints c
      JOIN students s ON c.student_id = s.id
      JOIN users u ON s.user_id = u.id
      ORDER BY c.created_at DESC LIMIT 5`);

    // ML Insight: room utilization rate
    const occupancyRate = roomStats.total_capacity > 0
      ? ((roomStats.total_occupied / roomStats.total_capacity) * 100).toFixed(1)
      : 0;

    // Fee collection rate
    const feeCollectionRate = feeStats.total_billed > 0
      ? ((feeStats.collected / feeStats.total_billed) * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        students: studentStats,
        rooms: { ...roomStats, occupancyRate },
        bookings: bookingStats,
        fees: { ...feeStats, feeCollectionRate },
        complaints: complaintStats,
        maintenance: maintenanceStats,
        recentBookings,
        recentComplaints,
        mlInsights: {
          occupancyRate,
          feeCollectionRate,
          urgentMaintenanceCount: maintenanceStats.urgent,
          openComplaints: complaintStats.open_count
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
