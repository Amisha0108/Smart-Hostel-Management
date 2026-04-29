const { pool } = require('../config/db');

// Simple ML: priority scoring based on keywords & category
const mlPriorityScore = (category, description) => {
  let score = 0;
  const urgentKeywords = ['leak', 'flood', 'fire', 'smoke', 'no water', 'broken', 'dangerous', 'electric shock', 'short circuit', 'collapse'];
  const highKeywords = ['not working', 'damage', 'crack', 'pest', 'cockroach', 'rat', 'smell', 'sewage'];
  const desc = description.toLowerCase();
  urgentKeywords.forEach(kw => { if (desc.includes(kw)) score += 3; });
  highKeywords.forEach(kw => { if (desc.includes(kw)) score += 1.5; });
  if (category === 'electrical') score += 1;
  if (category === 'plumbing') score += 0.8;
  if (category === 'security') score += 1.5;
  return Math.min(score, 10);
};

const scoreToPriority = (score) => {
  if (score >= 7) return 'urgent';
  if (score >= 4) return 'high';
  if (score >= 2) return 'medium';
  return 'low';
};

// @desc Create maintenance request (Student)
exports.createRequest = async (req, res) => {
  try {
    const { category, title, description, room_id } = req.body;
    const [students] = await pool.execute('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (!students.length) return res.status(404).json({ success: false, message: 'Student not found' });

    const score = mlPriorityScore(category, description);
    const priority = scoreToPriority(score);

    const [result] = await pool.execute(
      'INSERT INTO maintenance_requests (student_id, room_id, category, title, description, priority, ml_priority_score) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [students[0].id, room_id || null, category, title, description, priority, score]
    );

    // Notify admin if urgent
    if (priority === 'urgent') {
      await pool.execute(
        "INSERT INTO notifications (user_id, title, message, type) SELECT id, 'URGENT Maintenance Request', CONCAT('Urgent: ', ?), 'error' FROM users WHERE role IN ('admin','warden')",
        [title]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Maintenance request submitted',
      requestId: result.insertId,
      mlAnalysis: { priority, score: score.toFixed(2) }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Get student's requests
exports.getMyRequests = async (req, res) => {
  try {
    const [students] = await pool.execute('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (!students.length) return res.status(404).json({ success: false, message: 'Student not found' });
    const [requests] = await pool.execute(
      `SELECT mr.*, r.room_number FROM maintenance_requests mr
       LEFT JOIN rooms r ON mr.room_id = r.id
       WHERE mr.student_id = ? ORDER BY mr.created_at DESC`, [students[0].id]
    );
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Get all requests (Admin)
exports.getAllRequests = async (req, res) => {
  try {
    const { status, priority, category } = req.query;
    let query = `
      SELECT mr.*, r.room_number, u.name AS student_name, s.student_id
      FROM maintenance_requests mr
      JOIN students s ON mr.student_id = s.id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN rooms r ON mr.room_id = r.id
      WHERE 1=1`;
    const params = [];
    if (status) { query += ' AND mr.status = ?'; params.push(status); }
    if (priority) { query += ' AND mr.priority = ?'; params.push(priority); }
    if (category) { query += ' AND mr.category = ?'; params.push(category); }
    query += ' ORDER BY FIELD(mr.priority, "urgent","high","medium","low"), mr.created_at DESC';
    const [requests] = await pool.execute(query, params);
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Update request status (Admin)
exports.updateRequest = async (req, res) => {
  try {
    const { status, assigned_to, admin_notes } = req.body;
    const resolvedAt = status === 'resolved' ? new Date() : null;
    await pool.execute(
      'UPDATE maintenance_requests SET status=?, assigned_to=?, admin_notes=?, resolved_at=? WHERE id=?',
      [status, assigned_to, admin_notes, resolvedAt, req.params.id]
    );

    // Notify student
    const [requests] = await pool.execute(
      'SELECT mr.student_id, s.user_id FROM maintenance_requests mr JOIN students s ON mr.student_id = s.id WHERE mr.id = ?',
      [req.params.id]
    );
    if (requests.length) {
      await pool.execute(
        'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
        [requests[0].user_id, 'Maintenance Request Updated',
         `Your maintenance request status updated to: ${status}`,
         status === 'resolved' ? 'success' : 'info']
      );
    }

    res.json({ success: true, message: 'Request updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Get statistics (Admin dashboard)
exports.getStats = async (req, res) => {
  try {
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) AS total,
        SUM(status = 'pending') AS pending,
        SUM(status = 'in_progress') AS in_progress,
        SUM(status = 'resolved') AS resolved,
        SUM(priority = 'urgent') AS urgent,
        SUM(priority = 'high') AS high_priority,
        AVG(ml_priority_score) AS avg_ml_score
      FROM maintenance_requests`
    );
    const [byCategory] = await pool.execute(
      'SELECT category, COUNT(*) AS count FROM maintenance_requests GROUP BY category ORDER BY count DESC'
    );
    res.json({ success: true, data: { ...stats[0], byCategory } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
