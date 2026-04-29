import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Building2, LayoutDashboard, BedDouble, Wrench, CreditCard,
  UtensilsCrossed, MessageSquare, Bell, Users, ClipboardList,
  LogOut, ChevronRight, Home
} from 'lucide-react';
// import { useAuth } from '../../context/AuthContext';
import { useAuth } from '../context/AuthContext';

import toast from 'react-hot-toast';

const StudentNav = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/student/dashboard' },
  { icon: BedDouble, label: 'Room Booking', to: '/student/rooms' },
  { icon: Wrench, label: 'Maintenance', to: '/student/maintenance' },
  { icon: CreditCard, label: 'Fee Payment', to: '/student/fees' },
  { icon: UtensilsCrossed, label: 'Meal Tracker', to: '/student/meals' },
  { icon: MessageSquare, label: 'Complaints', to: '/student/complaints' },
  { icon: Bell, label: 'Notices', to: '/student/notices' },
];

const AdminNav = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/admin/dashboard' },
  { icon: Users, label: 'Student Management', to: '/admin/students' },
  { icon: BedDouble, label: 'Room Management', to: '/admin/rooms' },
  { icon: ClipboardList, label: 'Booking Requests', to: '/admin/bookings' },
  { icon: Wrench, label: 'Maintenance', to: '/admin/maintenance' },
  { icon: CreditCard, label: 'Fee Management', to: '/admin/fees' },
  { icon: UtensilsCrossed, label: 'Meal Management', to: '/admin/meals' },
  { icon: MessageSquare, label: 'Complaints', to: '/admin/complaints' },
  { icon: Bell, label: 'Notice Board', to: '/admin/notices' },
];

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const navItems = isAdmin ? AdminNav : StudentNav;

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: '#3b82f6', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={20} color="white" />
          </div>
          <div>
            <h1>Hostel<span>MS</span></h1>
            <p>{isAdmin ? 'Admin Portal' : 'Student Portal'}</p>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">Navigation</div>
        {navItems.map(({ icon: Icon, label, to }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Icon size={18} />
            <span style={{ flex: 1 }}>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '10px 12px', background: 'rgba(255,255,255,.05)', borderRadius: 8 }}>
          <div className="avatar" style={{ width: 34, height: 34, fontSize: 12 }}>{initials}</div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 600, truncate: true }}>{user?.name}</div>
            <div style={{ color: '#64748b', fontSize: 11 }}>{user?.role}</div>
          </div>
        </div>
        <button className="nav-item" onClick={handleLogout} style={{ color: '#ef4444', width: '100%' }}>
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
