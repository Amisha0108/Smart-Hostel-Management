const { pool } = require('../config/db');

// @desc Get all rooms
exports.getRooms = async (req, res) => {
  try {
    const { status, type, block } = req.query;
    let query = 'SELECT * FROM rooms WHERE 1=1';
    const params = [];
    if (status) { query += ' AND status = ?'; params.push(status); }
    if (type) { query += ' AND room_type = ?'; params.push(type); }
    if (block) { query += ' AND block = ?'; params.push(block); }
    query += ' ORDER BY block, floor, room_number';
    const [rooms] = await pool.execute(query, params);
    res.json({ success: true, data: rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Get single room
exports.getRoom = async (req, res) => {
  try {
    const [rooms] = await pool.execute(
      `SELECT r.*, 
        GROUP_CONCAT(CONCAT(u.name, ' (', s.student_id, ')') SEPARATOR ', ') AS current_occupants
       FROM rooms r
       LEFT JOIN room_bookings rb ON r.id = rb.room_id AND rb.status = 'approved'
       LEFT JOIN students s ON rb.student_id = s.id
       LEFT JOIN users u ON s.user_id = u.id
       WHERE r.id = ?
       GROUP BY r.id`, [req.params.id]
    );
    if (!rooms.length) return res.status(404).json({ success: false, message: 'Room not found' });
    res.json({ success: true, data: rooms[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Book a room (Student)
exports.bookRoom = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { room_id, check_in_date, notes } = req.body;

    // Get student id
    const [students] = await conn.execute('SELECT id, status FROM students WHERE user_id = ?', [req.user.id]);
    if (!students.length) return res.status(404).json({ success: false, message: 'Student profile not found' });
    const student = students[0];

    // Check existing active booking
    const [existing] = await conn.execute(
      "SELECT id FROM room_bookings WHERE student_id = ? AND status IN ('pending','approved')", [student.id]
    );
    if (existing.length) {
      return res.status(400).json({ success: false, message: 'You already have an active room booking' });
    }

    // Check room availability
    const [rooms] = await conn.execute('SELECT * FROM rooms WHERE id = ? FOR UPDATE', [room_id]);
    if (!rooms.length) return res.status(404).json({ success: false, message: 'Room not found' });
    const room = rooms[0];
    if (room.status === 'maintenance') {
      return res.status(400).json({ success: false, message: 'Room is under maintenance' });
    }
    if (room.occupied >= room.capacity) {
      return res.status(400).json({ success: false, message: 'Room is fully occupied' });
    }

    const [result] = await conn.execute(
      'INSERT INTO room_bookings (student_id, room_id, check_in_date, status, notes) VALUES (?, ?, ?, ?, ?)',
      [student.id, room_id, check_in_date, 'pending', notes]
    );

    // Create notification for admin
    await conn.execute(
      "INSERT INTO notifications (user_id, title, message, type) SELECT id, 'New Room Booking Request', CONCAT('Student ', ?, ' has requested room ', ?), 'info' FROM users WHERE role IN ('admin','warden')",
      [req.user.name, room.room_number]
    );

    await conn.commit();
    res.status(201).json({ success: true, message: 'Room booking request submitted successfully', bookingId: result.insertId });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    conn.release();
  }
};

// @desc Get student's bookings
exports.getMyBookings = async (req, res) => {
  try {
    const [students] = await pool.execute('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (!students.length) return res.status(404).json({ success: false, message: 'Student not found' });

    const [bookings] = await pool.execute(
      `SELECT rb.*, r.room_number, r.block, r.floor, r.room_type, r.price_per_month, r.amenities,
              u.name AS approved_by_name
       FROM room_bookings rb
       JOIN rooms r ON rb.room_id = r.id
       LEFT JOIN users u ON rb.approved_by = u.id
       WHERE rb.student_id = ?
       ORDER BY rb.created_at DESC`, [students[0].id]
    );
    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Get all bookings (Admin)
exports.getAllBookings = async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT rb.*, r.room_number, r.block, r.floor, r.room_type, r.price_per_month,
             u.name AS student_name, u.email AS student_email, s.student_id,
             au.name AS approved_by_name
      FROM room_bookings rb
      JOIN students s ON rb.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN rooms r ON rb.room_id = r.id
      LEFT JOIN users au ON rb.approved_by = au.id
      WHERE 1=1`;
    const params = [];
    if (status) { query += ' AND rb.status = ?'; params.push(status); }
    query += ' ORDER BY rb.created_at DESC';
    const [bookings] = await pool.execute(query, params);
    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Approve/Reject booking (Admin)
exports.updateBookingStatus = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { status, admin_notes } = req.body;
    const bookingId = req.params.id;

    const [bookings] = await conn.execute(
      'SELECT rb.*, r.occupied, r.capacity, r.room_number FROM room_bookings rb JOIN rooms r ON rb.room_id = r.id WHERE rb.id = ?',
      [bookingId]
    );
    if (!bookings.length) return res.status(404).json({ success: false, message: 'Booking not found' });
    const booking = bookings[0];

    if (status === 'approved') {
      if (booking.occupied >= booking.capacity) {
        return res.status(400).json({ success: false, message: 'Room is now full' });
      }
      await conn.execute(
        'UPDATE rooms SET occupied = occupied + 1, status = IF(occupied + 1 >= capacity, "full", "available") WHERE id = ?',
        [booking.room_id]
      );
    }

    await conn.execute(
      'UPDATE room_bookings SET status = ?, approved_by = ?, approved_at = NOW(), notes = CONCAT(IFNULL(notes,""), " | Admin: ", ?) WHERE id = ?',
      [status, req.user.id, admin_notes || '', bookingId]
    );

    // Notify student
    const [students] = await conn.execute(
      'SELECT s.user_id FROM students s WHERE s.id = ?', [booking.student_id]
    );
    if (students.length) {
      await conn.execute(
        'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
        [students[0].user_id, `Room Booking ${status}`,
         `Your booking for room ${booking.room_number} has been ${status}`, status === 'approved' ? 'success' : 'error']
      );
    }

    await conn.commit();
    res.json({ success: true, message: `Booking ${status} successfully` });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    conn.release();
  }
};

// @desc Add/Update room (Admin)
exports.createRoom = async (req, res) => {
  try {
    const { room_number, floor, block, room_type, capacity, price_per_month, amenities } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO rooms (room_number, floor, block, room_type, capacity, price_per_month, amenities) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [room_number, floor, block, room_type, capacity, price_per_month, amenities]
    );
    res.status(201).json({ success: true, message: 'Room created', roomId: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Room number already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Update room
exports.updateRoom = async (req, res) => {
  try {
    const { room_number, floor, block, room_type, capacity, price_per_month, amenities, status } = req.body;
    await pool.execute(
      'UPDATE rooms SET room_number=?, floor=?, block=?, room_type=?, capacity=?, price_per_month=?, amenities=?, status=? WHERE id=?',
      [room_number, floor, block, room_type, capacity, price_per_month, amenities, status, req.params.id]
    );
    res.json({ success: true, message: 'Room updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Delete room
exports.deleteRoom = async (req, res) => {
  try {
    const [bookings] = await pool.execute("SELECT id FROM room_bookings WHERE room_id = ? AND status = 'approved'", [req.params.id]);
    if (bookings.length) {
      return res.status(400).json({ success: false, message: 'Cannot delete room with active bookings' });
    }
    await pool.execute('DELETE FROM rooms WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Room deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
