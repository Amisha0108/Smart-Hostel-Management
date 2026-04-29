import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import './styles/global.css';

import AuthPage from './pages/AuthPage';
import Sidebar from './components/Sidebar';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRooms from './pages/admin/AdminRooms';
import AdminStudents from './pages/admin/AdminStudents';
import { AdminBookings, AdminComplaints, AdminMaintenance, AdminNotices, AdminFees } from './pages/admin/AdminPages';

import {
  StudentDashboard, StudentRooms, StudentMaintenance,
  StudentFees, StudentMeals, StudentComplaints, StudentNotices
} from './pages/student/StudentPages';

// FIX: ProtectedRoute correctly allows warden on admin routes
function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="loading-page">
      <div className="spinner" />
      <p style={{ color: '#94a3b8', marginTop: 12 }}>Loading...</p>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (role === 'admin' && user.role === 'student') return <Navigate to="/student/dashboard" replace />;
  if (role === 'student' && (user.role === 'admin' || user.role === 'warden')) return <Navigate to="/admin/dashboard" replace />;
  return children;
}

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">{children}</div>
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  const homePath = !user ? '/login'
    : user.role === 'student' ? '/student/dashboard'
    : '/admin/dashboard';

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={homePath} replace /> : <AuthPage />} />
      <Route path="/" element={<Navigate to={homePath} replace />} />

      <Route path="/student/dashboard"   element={<ProtectedRoute role="student"><AppLayout><StudentDashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/student/rooms"       element={<ProtectedRoute role="student"><AppLayout><StudentRooms /></AppLayout></ProtectedRoute>} />
      <Route path="/student/maintenance" element={<ProtectedRoute role="student"><AppLayout><StudentMaintenance /></AppLayout></ProtectedRoute>} />
      <Route path="/student/fees"        element={<ProtectedRoute role="student"><AppLayout><StudentFees /></AppLayout></ProtectedRoute>} />
      <Route path="/student/meals"       element={<ProtectedRoute role="student"><AppLayout><StudentMeals /></AppLayout></ProtectedRoute>} />
      <Route path="/student/complaints"  element={<ProtectedRoute role="student"><AppLayout><StudentComplaints /></AppLayout></ProtectedRoute>} />
      <Route path="/student/notices"     element={<ProtectedRoute role="student"><AppLayout><StudentNotices /></AppLayout></ProtectedRoute>} />

      <Route path="/admin/dashboard"     element={<ProtectedRoute role="admin"><AppLayout><AdminDashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/admin/students"      element={<ProtectedRoute role="admin"><AppLayout><AdminStudents /></AppLayout></ProtectedRoute>} />
      <Route path="/admin/rooms"         element={<ProtectedRoute role="admin"><AppLayout><AdminRooms /></AppLayout></ProtectedRoute>} />
      <Route path="/admin/bookings"      element={<ProtectedRoute role="admin"><AppLayout><AdminBookings /></AppLayout></ProtectedRoute>} />
      <Route path="/admin/maintenance"   element={<ProtectedRoute role="admin"><AppLayout><AdminMaintenance /></AppLayout></ProtectedRoute>} />
      <Route path="/admin/fees"          element={<ProtectedRoute role="admin"><AppLayout><AdminFees /></AppLayout></ProtectedRoute>} />
      <Route path="/admin/complaints"    element={<ProtectedRoute role="admin"><AppLayout><AdminComplaints /></AppLayout></ProtectedRoute>} />
      <Route path="/admin/notices"       element={<ProtectedRoute role="admin"><AppLayout><AdminNotices /></AppLayout></ProtectedRoute>} />
      <Route path="/admin/meals"         element={<ProtectedRoute role="admin"><AppLayout><div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Meal Management</div></AppLayout></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{
          duration: 4000,
          style: { fontFamily: 'Sora, sans-serif', fontSize: '13px', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,.12)' },
          success: { style: { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' } },
          error:   { style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' } },
        }} />
      </Router>
    </AuthProvider>
  );
}
