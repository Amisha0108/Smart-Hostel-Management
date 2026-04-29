const { pool } = require('../config/db');

// ─── COMPLAINT CONTROLLER ───────────────────────────────────────

// ML sentiment analysis simulation
const analyzeSentiment = (text) => {
  const t = text.toLowerCase();
  const urgentWords = ['urgent', 'emergency', 'immediately', 'danger', 'serious', 'worst', 'terrible', 'awful'];
  const negativeWords = ['bad', 'poor', 'broken', 'issue', 'problem', 'complaint', 'unhappy', 'disappointed'];
  const positiveWords = ['good', 'okay', 'fine', 'thank'];
  let urgencyScore = 0;
  urgentWords.forEach(w => { if (t.includes(w)) urgencyScore += 2; });
  negativeWords.forEach(w => { if (t.includes(w)) urgencyScore += 0.5; });
  positiveWords.forEach(w => { if (t.includes(w)) urgencyScore -= 0.5; });
  const sentiment = urgencyScore >= 4 ? 'negative_urgent' : urgencyScore >= 2 ? 'negative' : urgencyScore >= 0 ? 'neutral' : 'positive';
  return { sentiment, urgencyScore: Math.max(0, Math.min(urgencyScore, 10)) };
};

// @desc Create complaint (Student)
const createComplaint = async (req, res) => {
  try {
    const { category, title, description, is_anonymous } = req.body;
    const [students] = await pool.execute('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (!students.length) return res.status(404).json({ success: false, message: 'Student not found' });

    const { sentiment, urgencyScore } = analyzeSentiment(description + ' ' + title);
    const priority = urgencyScore >= 6 ? 'high' : urgencyScore >= 3 ? 'medium' : 'low';

    const [result] = await pool.execute(
      'INSERT INTO complaints (student_id, category, title, description, is_anonymous, priority, ml_sentiment, ml_urgency_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [students[0].id, category, title, description, is_anonymous || false, priority, sentiment, urgencyScore]
    );

    // Notify admin
    await pool.execute(
      "INSERT INTO notifications (user_id, title, message, type) SELECT id, 'New Complaint Filed', CONCAT(?,' - ',?), ? FROM users WHERE role IN ('admin','warden')",
      [category, title, priority === 'high' ? 'error' : 'warning']
    );

    res.status(201).json({
      success: true, message: 'Complaint submitted successfully',
      complaintId: result.insertId,
      mlAnalysis: { sentiment, urgencyScore: urgencyScore.toFixed(2), priority }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Get student's complaints
const getMyComplaints = async (req, res) => {
  try {
    const [students] = await pool.execute('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (!students.length) return res.status(404).json({ success: false, message: 'Student not found' });
    const [complaints] = await pool.execute(
      'SELECT * FROM complaints WHERE student_id = ? ORDER BY created_at DESC', [students[0].id]
    );
    res.json({ success: true, data: complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Get all complaints (Admin)
const getAllComplaints = async (req, res) => {
  try {
    const { status, priority, category } = req.query;
    let query = `
      SELECT c.*, 
        CASE WHEN c.is_anonymous THEN 'Anonymous' ELSE u.name END AS student_name,
        CASE WHEN c.is_anonymous THEN NULL ELSE s.student_id END AS student_reg_id
      FROM complaints c
      JOIN students s ON c.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE 1=1`;
    const params = [];
    if (status) { query += ' AND c.status = ?'; params.push(status); }
    if (priority) { query += ' AND c.priority = ?'; params.push(priority); }
    if (category) { query += ' AND c.category = ?'; params.push(category); }
    query += ' ORDER BY FIELD(c.priority,"high","medium","low"), c.created_at DESC';
    const [complaints] = await pool.execute(query, params);
    res.json({ success: true, data: complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Respond to complaint (Admin)
const respondComplaint = async (req, res) => {
  try {
    const { status, admin_response } = req.body;
    const resolvedAt = status === 'resolved' || status === 'closed' ? new Date() : null;
    await pool.execute(
      'UPDATE complaints SET status=?, admin_response=?, resolved_by=?, resolved_at=? WHERE id=?',
      [status, admin_response, req.user.id, resolvedAt, req.params.id]
    );

    const [complaints] = await pool.execute(
      'SELECT c.student_id, s.user_id FROM complaints c JOIN students s ON c.student_id = s.id WHERE c.id=?',
      [req.params.id]
    );
    if (complaints.length) {
      await pool.execute(
        'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
        [complaints[0].user_id, 'Complaint Updated', `Your complaint has been ${status}: ${admin_response}`,
         status === 'resolved' ? 'success' : 'info']
      );
    }
    res.json({ success: true, message: 'Complaint updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── NOTICE CONTROLLER ──────────────────────────────────────────

// @desc Get all notices (with role filter)
const getNotices = async (req, res) => {
  try {
    const audience = req.user.role === 'student' ? ['all', 'students'] : ['all', 'wardens', 'students'];
    const [notices] = await pool.execute(
      `SELECT n.*, u.name AS created_by_name
       FROM notices n JOIN users u ON n.created_by = u.id
       WHERE n.target_audience IN (${audience.map(() => '?').join(',')})
         AND (n.expires_at IS NULL OR n.expires_at >= CURDATE())
       ORDER BY n.is_pinned DESC, FIELD(n.priority,'urgent','important','normal'), n.created_at DESC`,
      audience
    );
    res.json({ success: true, data: notices });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Create notice (Admin)
const createNotice = async (req, res) => {
  try {
    const { title, content, category, priority, target_audience, is_pinned, expires_at } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO notices (title, content, category, priority, target_audience, is_pinned, created_by, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [title, content, category, priority, target_audience, is_pinned || false, req.user.id, expires_at || null]
    );

    // Notify all students
    await pool.execute(
      "INSERT INTO notifications (user_id, title, message, type) SELECT id, 'New Notice Posted', ?, ? FROM users WHERE role = 'student'",
      [title, priority === 'urgent' ? 'error' : priority === 'important' ? 'warning' : 'info']
    );

    res.status(201).json({ success: true, message: 'Notice published', noticeId: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Update notice
const updateNotice = async (req, res) => {
  try {
    const { title, content, category, priority, target_audience, is_pinned, expires_at } = req.body;
    await pool.execute(
      'UPDATE notices SET title=?, content=?, category=?, priority=?, target_audience=?, is_pinned=?, expires_at=? WHERE id=?',
      [title, content, category, priority, target_audience, is_pinned, expires_at || null, req.params.id]
    );
    res.json({ success: true, message: 'Notice updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Delete notice
const deleteNotice = async (req, res) => {
  try {
    await pool.execute('DELETE FROM notices WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Notice deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── NOTIFICATIONS ──────────────────────────────────────────────

const getNotifications = async (req, res) => {
  try {
    const [notifications] = await pool.execute(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50', [req.user.id]
    );
    const [unread] = await pool.execute(
      'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = FALSE', [req.user.id]
    );
    res.json({ success: true, data: notifications, unreadCount: unread[0].count });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const markNotificationsRead = async (req, res) => {
  try {
    await pool.execute('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [req.user.id]);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createComplaint, getMyComplaints, getAllComplaints, respondComplaint,
  getNotices, createNotice, updateNotice, deleteNotice,
  getNotifications, markNotificationsRead
};
