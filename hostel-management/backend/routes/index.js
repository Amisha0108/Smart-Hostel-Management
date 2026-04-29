const express = require('express');
const router = express.Router();

// ─── AUTH ROUTES ─────────────────────────────────────────
const { register, login, getProfile, updateProfile, changePassword } = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/profile', protect, getProfile);
router.put('/auth/profile', protect, updateProfile);
router.put('/auth/change-password', protect, changePassword);

// ─── ROOM ROUTES ─────────────────────────────────────────
const {
  getRooms, getRoom, bookRoom, getMyBookings, getAllBookings,
  updateBookingStatus, createRoom, updateRoom, deleteRoom
} = require('../controllers/roomController');

router.get('/rooms', protect, getRooms);
router.get('/rooms/:id', protect, getRoom);
router.post('/rooms', protect, adminOnly, createRoom);
router.put('/rooms/:id', protect, adminOnly, updateRoom);
router.delete('/rooms/:id', protect, adminOnly, deleteRoom);

router.post('/bookings', protect, bookRoom);
router.get('/bookings/my', protect, getMyBookings);
router.get('/bookings', protect, adminOnly, getAllBookings);
router.put('/bookings/:id/status', protect, adminOnly, updateBookingStatus);

// ─── MAINTENANCE ROUTES ──────────────────────────────────
const {
  createRequest, getMyRequests, getAllRequests, updateRequest, getStats: getMaintStats
} = require('../controllers/maintenanceController');

router.post('/maintenance', protect, createRequest);
router.get('/maintenance/my', protect, getMyRequests);
router.get('/maintenance/stats', protect, adminOnly, getMaintStats);
router.get('/maintenance', protect, adminOnly, getAllRequests);
router.put('/maintenance/:id', protect, adminOnly, updateRequest);

// ─── FEE ROUTES ──────────────────────────────────────────
const {
  getMyFees, payFee, getAllFees, createFee, getFeeStats
} = require('../controllers/feeController');

router.get('/fees/my', protect, getMyFees);
router.post('/fees/pay', protect, payFee);
router.get('/fees/stats', protect, adminOnly, getFeeStats);
router.get('/fees', protect, adminOnly, getAllFees);
router.post('/fees', protect, adminOnly, createFee);

// ─── MEAL ROUTES ─────────────────────────────────────────
const {
  getMealPlans, subscribeMeal, getMyMealPlan, markAttendance,
  getMyAttendance, getAllSubscriptions, getTodayAttendance
} = require('../controllers/mealController');

router.get('/meals/plans', protect, getMealPlans);
router.post('/meals/subscribe', protect, subscribeMeal);
router.get('/meals/my-plan', protect, getMyMealPlan);
router.get('/meals/my-attendance', protect, getMyAttendance);
router.post('/meals/attendance', protect, adminOnly, markAttendance);
router.get('/meals/subscriptions', protect, adminOnly, getAllSubscriptions);
router.get('/meals/today', protect, adminOnly, getTodayAttendance);

// ─── COMPLAINT ROUTES ────────────────────────────────────
const {
  createComplaint, getMyComplaints, getAllComplaints, respondComplaint,
  getNotices, createNotice, updateNotice, deleteNotice,
  getNotifications, markNotificationsRead
} = require('../controllers/complaintNoticeController');

router.post('/complaints', protect, createComplaint);
router.get('/complaints/my', protect, getMyComplaints);
router.get('/complaints', protect, adminOnly, getAllComplaints);
router.put('/complaints/:id', protect, adminOnly, respondComplaint);

// ─── NOTICE ROUTES ───────────────────────────────────────
router.get('/notices', protect, getNotices);
router.post('/notices', protect, adminOnly, createNotice);
router.put('/notices/:id', protect, adminOnly, updateNotice);
router.delete('/notices/:id', protect, adminOnly, deleteNotice);

// ─── NOTIFICATION ROUTES ─────────────────────────────────
router.get('/notifications', protect, getNotifications);
router.put('/notifications/read-all', protect, markNotificationsRead);

// ─── ADMIN ROUTES ─────────────────────────────────────────
const {
  getAllStudents, getStudent, verifyStudent, toggleStudentStatus, getDashboardStats
} = require('../controllers/adminController');

router.get('/admin/dashboard', protect, adminOnly, getDashboardStats);
router.get('/admin/students', protect, adminOnly, getAllStudents);
router.get('/admin/students/:id', protect, adminOnly, getStudent);
router.put('/admin/students/:id/verify', protect, adminOnly, verifyStudent);
router.put('/admin/students/:id/toggle', protect, adminOnly, toggleStudentStatus);

module.exports = router;
