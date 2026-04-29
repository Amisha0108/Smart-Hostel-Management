import React, { useState, useEffect } from 'react';
import { Users, BedDouble, CreditCard, AlertTriangle, CheckCircle, Clock, TrendingUp, Zap, MessageSquare, Wrench } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import Topbar from '../../components/Topbar';
import { adminAPI } from '../../utils/api';
import { formatDistanceToNow } from 'date-fns';

const statusColors = { pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444', open: '#3b82f6', resolved: '#10b981' };
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

function StatCard({ icon: Icon, label, value, sub, colorClass, badge, badgeType }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${colorClass}`}>
        <Icon />
      </div>
      <div className="stat-info">
        <h3>{value ?? '–'}</h3>
        <p>{label}</p>
        {sub && <span style={{ fontSize: 11, color: '#64748b' }}>{sub}</span>}
        {badge && <div className={`stat-badge ${badgeType === 'good' ? 'badge-success' : 'badge-warning'}`}>{badge}</div>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getDashboard()
      .then(({ data }) => { if (data.success) setStats(data.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const pieData = stats ? [
    { name: 'Available', value: stats.rooms.available || 0 },
    { name: 'Full', value: stats.rooms.full_count || 0 },
    { name: 'Maintenance', value: stats.rooms.maintenance || 0 },
  ] : [];

  const feeMonthly = stats?.fees?.monthly?.slice(0, 6).reverse() || [];

  return (
    <div>
      <Topbar title="Admin Dashboard" subtitle="Hostel Management Overview" />
      <div className="page-content">
        {loading ? (
          <div className="loading-page"><div className="spinner" /></div>
        ) : !stats ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>Failed to load dashboard data</p>
        ) : (
          <>
            {/* ML Insights Banner */}
            <div style={{
              background: 'linear-gradient(135deg, #1e40af, #0891b2)',
              borderRadius: 12, padding: '16px 24px',
              display: 'flex', alignItems: 'center', gap: 16,
              marginBottom: 24, color: 'white'
            }}>
              <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>🤖 ML Insights</div>
                <div style={{ fontSize: 12, opacity: .85 }}>
                  Occupancy Rate: <strong>{stats.mlInsights.occupancyRate}%</strong> &nbsp;|&nbsp;
                  Fee Collection: <strong>{stats.mlInsights.feeCollectionRate}%</strong> &nbsp;|&nbsp;
                  Urgent Issues: <strong>{stats.mlInsights.urgentMaintenanceCount}</strong> &nbsp;|&nbsp;
                  Open Complaints: <strong>{stats.mlInsights.openComplaints}</strong>
                </div>
              </div>
              <div style={{ font: '10px/1 "JetBrains Mono", monospace', opacity: .6, background: 'rgba(255,255,255,.1)', padding: '4px 8px', borderRadius: 4 }}>
                ML ACTIVE
              </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
              <StatCard icon={Users} label="Total Students" value={stats.students.total} sub={`${stats.students.active} active`} colorClass="bg-blue" badge={`${stats.students.active} Active`} badgeType="good" />
              <StatCard icon={BedDouble} label="Rooms" value={stats.rooms.total} sub={`${stats.rooms.available} available`} colorClass="bg-green" badge={`${stats.mlInsights.occupancyRate}% full`} badgeType={stats.mlInsights.occupancyRate > 80 ? 'warn' : 'good'} />
              <StatCard icon={Clock} label="Pending Bookings" value={stats.bookings.pending} sub={`${stats.bookings.approved} approved`} colorClass="bg-amber" />
              <StatCard icon={CreditCard} label="Fees Collected" value={`₹${Number(stats.fees.collected || 0).toLocaleString()}`} sub={`₹${Number(stats.fees.overdue || 0).toLocaleString()} overdue`} colorClass="bg-purple" />
              <StatCard icon={MessageSquare} label="Open Complaints" value={stats.complaints.open_count} sub={`${stats.complaints.total} total`} colorClass="bg-red" />
              <StatCard icon={Wrench} label="Urgent Maintenance" value={stats.maintenance.urgent} sub={`${stats.maintenance.pending} pending`} colorClass="bg-teal" />
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
              <div className="card">
                <div className="card-header"><h3>Fee Collection (Last 6 Months)</h3></div>
                <div className="card-body" style={{ padding: '16px 8px' }}>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={feeMonthly}>
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => `₹${Number(v).toLocaleString()}`} />
                      <Bar dataKey="total" name="Billed" fill="#dbeafe" radius={[4,4,0,0]} />
                      <Bar dataKey="collected" name="Collected" fill="#3b82f6" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card">
                <div className="card-header"><h3>Room Status Distribution</h3></div>
                <div className="card-body">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Recent Activity Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div className="card">
                <div className="card-header"><h3>Recent Booking Requests</h3></div>
                <div>
                  {stats.recentBookings.length === 0 ? (
                    <div className="empty-state"><p>No recent bookings</p></div>
                  ) : (
                    <table style={{ width: '100%' }}>
                      <thead><tr>
                        <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Student</th>
                        <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Room</th>
                        <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Status</th>
                      </tr></thead>
                      <tbody>
                        {stats.recentBookings.map(b => (
                          <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 16px', fontSize: 13 }}>{b.student_name}</td>
                            <td style={{ padding: '10px 16px', fontSize: 13 }}>{b.room_number}</td>
                            <td style={{ padding: '10px 16px' }}>
                              <span className={`badge ${b.status === 'approved' ? 'badge-success' : b.status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>{b.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="card-header"><h3>Recent Complaints</h3></div>
                <div>
                  {stats.recentComplaints.length === 0 ? (
                    <div className="empty-state"><p>No recent complaints</p></div>
                  ) : (
                    <table style={{ width: '100%' }}>
                      <thead><tr>
                        <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Title</th>
                        <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Priority</th>
                        <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Status</th>
                      </tr></thead>
                      <tbody>
                        {stats.recentComplaints.map(c => (
                          <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 16px', fontSize: 13, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</td>
                            <td style={{ padding: '10px 16px' }}>
                              <span className={`badge ${c.priority === 'high' ? 'badge-danger' : c.priority === 'medium' ? 'badge-warning' : 'badge-secondary'}`}>{c.priority}</span>
                            </td>
                            <td style={{ padding: '10px 16px' }}>
                              <span className={`badge ${c.status === 'resolved' ? 'badge-success' : 'badge-info'}`}>{c.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
