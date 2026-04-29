const { pool } = require('../config/db');

// @desc Get student fees
exports.getMyFees = async (req, res) => {
  try {
    const [students] = await pool.execute('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (!students.length) return res.status(404).json({ success: false, message: 'Student not found' });

    const [fees] = await pool.execute(
      'SELECT * FROM fee_payments WHERE student_id = ? ORDER BY due_date DESC', [students[0].id]
    );
    const [summary] = await pool.execute(
      `SELECT 
        SUM(amount) AS total_amount,
        SUM(CASE WHEN status='paid' THEN amount ELSE 0 END) AS paid_amount,
        SUM(CASE WHEN status='pending' OR status='overdue' THEN amount ELSE 0 END) AS pending_amount,
        COUNT(CASE WHEN status='overdue' THEN 1 END) AS overdue_count
       FROM fee_payments WHERE student_id = ?`, [students[0].id]
    );
    res.json({ success: true, data: fees, summary: summary[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Pay fee (Student)
exports.payFee = async (req, res) => {
  try {
    const { fee_id, payment_method, transaction_id } = req.body;
    const [students] = await pool.execute('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (!students.length) return res.status(404).json({ success: false, message: 'Student not found' });

    const [fees] = await pool.execute(
      'SELECT * FROM fee_payments WHERE id = ? AND student_id = ?', [fee_id, students[0].id]
    );
    if (!fees.length) return res.status(404).json({ success: false, message: 'Fee record not found' });
    if (fees[0].status === 'paid') {
      return res.status(400).json({ success: false, message: 'Fee already paid' });
    }

    const receiptNumber = 'RCP' + Date.now();
    await pool.execute(
      'UPDATE fee_payments SET status="paid", paid_date=CURDATE(), payment_method=?, transaction_id=?, receipt_number=? WHERE id=?',
      [payment_method, transaction_id || receiptNumber, receiptNumber, fee_id]
    );

    // Create notification
    await pool.execute(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [req.user.id, 'Payment Successful', `Payment of ₹${fees[0].amount} received. Receipt: ${receiptNumber}`, 'success']
    );

    res.json({ success: true, message: 'Payment recorded successfully', receipt: receiptNumber });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Get all fees (Admin)
exports.getAllFees = async (req, res) => {
  try {
    const { status, month, year } = req.query;
    let query = `
      SELECT fp.*, u.name AS student_name, s.student_id, u.email
      FROM fee_payments fp
      JOIN students s ON fp.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE 1=1`;
    const params = [];
    if (status) { query += ' AND fp.status = ?'; params.push(status); }
    if (month) { query += ' AND fp.month = ?'; params.push(month); }
    if (year) { query += ' AND fp.year = ?'; params.push(year); }
    query += ' ORDER BY fp.due_date DESC';
    const [fees] = await pool.execute(query, params);
    res.json({ success: true, data: fees });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Create fee record (Admin)
exports.createFee = async (req, res) => {
  try {
    const { student_id, fee_type, amount, due_date, month, year, notes } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO fee_payments (student_id, fee_type, amount, due_date, month, year, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [student_id, fee_type, amount, due_date, month, year, notes]
    );

    // Notify student
    const [students] = await pool.execute(
      'SELECT user_id FROM students WHERE id = ?', [student_id]
    );
    if (students.length) {
      await pool.execute(
        'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
        [students[0].user_id, 'New Fee Added', `A ${fee_type} fee of ₹${amount} has been added, due ${due_date}`, 'warning']
      );
    }

    res.status(201).json({ success: true, message: 'Fee record created', feeId: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Fee summary stats (Admin)
exports.getFeeStats = async (req, res) => {
  try {
    const [stats] = await pool.execute(`
      SELECT 
        SUM(amount) AS total_billed,
        SUM(CASE WHEN status='paid' THEN amount ELSE 0 END) AS total_collected,
        SUM(CASE WHEN status IN ('pending','overdue') THEN amount ELSE 0 END) AS total_pending,
        COUNT(CASE WHEN status='overdue' THEN 1 END) AS overdue_count,
        COUNT(CASE WHEN status='paid' THEN 1 END) AS paid_count
      FROM fee_payments`
    );
    const [monthly] = await pool.execute(`
      SELECT month, year, 
        SUM(amount) AS total,
        SUM(CASE WHEN status='paid' THEN amount ELSE 0 END) AS collected
      FROM fee_payments GROUP BY year, month ORDER BY year DESC, month DESC LIMIT 12`
    );
    res.json({ success: true, data: { ...stats[0], monthly } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
