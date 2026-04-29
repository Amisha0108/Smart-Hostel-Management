import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
});

// Request interceptor – attach token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor – handle 401
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── AUTH ──────────────────────────────────────
export const authAPI = {
  register:       (data) => API.post('/auth/register', data),
  login:          (data) => API.post('/auth/login', data),
  getProfile:     ()     => API.get('/auth/profile'),
  updateProfile:  (data) => API.put('/auth/profile', data),
  changePassword: (data) => API.put('/auth/change-password', data),
};

// ─── ROOMS ─────────────────────────────────────
export const roomAPI = {
  getAll:  (params)   => API.get('/rooms', { params }),
  getOne:  (id)       => API.get(`/rooms/${id}`),
  create:  (data)     => API.post('/rooms', data),
  update:  (id, data) => API.put(`/rooms/${id}`, data),
  delete:  (id)       => API.delete(`/rooms/${id}`),
};

// ─── BOOKINGS ──────────────────────────────────
export const bookingAPI = {
  book:          (data)     => API.post('/bookings', data),
  getMyBookings: ()         => API.get('/bookings/my'),
  getAll:        (params)   => API.get('/bookings', { params }),
  updateStatus:  (id, data) => API.put(`/bookings/${id}/status`, data),
};

// ─── MAINTENANCE ───────────────────────────────
export const maintenanceAPI = {
  create:   (data)     => API.post('/maintenance', data),
  getMy:    ()         => API.get('/maintenance/my'),
  getAll:   (params)   => API.get('/maintenance', { params }),
  update:   (id, data) => API.put(`/maintenance/${id}`, data),
  getStats: ()         => API.get('/maintenance/stats'),
};

// ─── FEES ──────────────────────────────────────
// FIX: both getMyFees and getMy point to same endpoint for compatibility
export const feeAPI = {
  getMyFees: ()         => API.get('/fees/my'),
  getMy:     ()         => API.get('/fees/my'),
  pay:       (data)     => API.post('/fees/pay', data),
  getAll:    (params)   => API.get('/fees', { params }),
  create:    (data)     => API.post('/fees', data),
  getStats:  ()         => API.get('/fees/stats'),
};

// ─── MEALS ─────────────────────────────────────
export const mealAPI = {
  getPlans:           ()       => API.get('/meals/plans'),
  subscribe:          (data)   => API.post('/meals/subscribe', data),
  getMyPlan:          ()       => API.get('/meals/my-plan'),
  getMyAttendance:    (params) => API.get('/meals/my-attendance', { params }),
  markAttendance:     (data)   => API.post('/meals/attendance', data),
  getAllSubscriptions: ()       => API.get('/meals/subscriptions'),
  getTodayAttendance: ()       => API.get('/meals/today'),
};

// ─── COMPLAINTS ────────────────────────────────
export const complaintAPI = {
  create:  (data)     => API.post('/complaints', data),
  getMy:   ()         => API.get('/complaints/my'),
  getAll:  (params)   => API.get('/complaints', { params }),
  respond: (id, data) => API.put(`/complaints/${id}`, data),
};

// ─── NOTICES ───────────────────────────────────
export const noticeAPI = {
  getAll: ()         => API.get('/notices'),
  create: (data)     => API.post('/notices', data),
  update: (id, data) => API.put(`/notices/${id}`, data),
  delete: (id)       => API.delete(`/notices/${id}`),
};

// ─── NOTIFICATIONS ─────────────────────────────
export const notificationAPI = {
  getAll:      () => API.get('/notifications'),
  markAllRead: () => API.put('/notifications/read-all'),
};

// ─── ADMIN ─────────────────────────────────────
export const adminAPI = {
  getDashboard:  ()         => API.get('/admin/dashboard'),
  getStudents:   (params)   => API.get('/admin/students', { params }),
  getStudent:    (id)       => API.get(`/admin/students/${id}`),
  verifyStudent: (id, data) => API.put(`/admin/students/${id}/verify`, data),
  toggleStudent: (id)       => API.put(`/admin/students/${id}/toggle`),
};

export default API;
