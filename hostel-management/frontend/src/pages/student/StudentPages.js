import React, { useState, useEffect } from 'react';
import { BedDouble, Wrench, CreditCard, UtensilsCrossed, MessageSquare, Bell, CheckCircle, Clock, AlertTriangle, X, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import Topbar from '../../components/Topbar';
import { roomAPI, bookingAPI, maintenanceAPI, feeAPI, mealAPI, complaintAPI, noticeAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

// ─── STUDENT DASHBOARD ────────────────────────────────────────
export function StudentDashboard() {
  const { user } = useAuth();
  const [myBooking, setMyBooking] = useState(null);
  const [myFees, setMyFees] = useState({ summary: {} });
  const [myRequests, setMyRequests] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      bookingAPI.getMyBookings().catch(() => ({ data: { data: [] } })),
      feeAPI.getMyFees().catch(() => ({ data: { data: [], summary: {} } })),
      maintenanceAPI.getMy().catch(() => ({ data: { data: [] } })),
      noticeAPI.getAll().catch(() => ({ data: { data: [] } })),
    ]).then(([b, f, m, n]) => {
      setMyBooking(b.data.data?.find(bk => bk.status === 'approved') || b.data.data?.[0] || null);
      setMyFees({ data: f.data.data, summary: f.data.summary || {} });
      setMyRequests(m.data.data?.slice(0, 3) || []);
      setNotices(n.data.data?.slice(0, 3) || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div><Topbar title="Dashboard" /><div className="loading-page"><div className="spinner" /></div></div>;

  const student = user?.student;
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div>
      <Topbar title="Student Dashboard" subtitle={`Welcome back, ${user?.name?.split(' ')[0]}!`} />
      <div className="page-content">
        {/* Profile Banner */}
        <div style={{ background: 'linear-gradient(135deg, #1e40af, #0891b2)', borderRadius: 12, padding: '24px 28px', marginBottom: 24, color: 'white', display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 60, height: 60, background: 'rgba(255,255,255,.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700 }}>{initials}</div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontWeight: 800, fontSize: 20 }}>{user?.name}</h2>
            <p style={{ opacity: .85, fontSize: 13 }}>{student?.student_id} · {student?.course} – {student?.department} · Year {student?.year_of_study}</p>
          </div>
          {myBooking && myBooking.status === 'approved' && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 800 }}>Room {myBooking.room_number}</div>
              <div style={{ fontSize: 12, opacity: .8 }}>Block {myBooking.block} · {myBooking.room_type}</div>
            </div>
          )}
        </div>

        {/* Stat Cards */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-icon bg-blue"><BedDouble /></div>
            <div className="stat-info">
              <h3>{myBooking ? myBooking.room_number : '–'}</h3>
              <p>Assigned Room</p>
              {myBooking && <span className={`badge ${myBooking.status === 'approved' ? 'badge-success' : 'badge-warning'}`}>{myBooking.status}</span>}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon bg-amber"><CreditCard /></div>
            <div className="stat-info">
              <h3>₹{Number(myFees.summary?.pending_amount || 0).toLocaleString()}</h3>
              <p>Pending Fees</p>
              {myFees.summary?.overdue_count > 0 && <span className="badge badge-danger">{myFees.summary.overdue_count} overdue</span>}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon bg-teal"><Wrench /></div>
            <div className="stat-info">
              <h3>{myRequests.length}</h3>
              <p>Maintenance Requests</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Recent Requests */}
          <div className="card">
            <div className="card-header">
              <h3>Recent Maintenance</h3>
              <a href="/student/maintenance" style={{ fontSize: 12, color: '#3b82f6', textDecoration: 'none' }}>View all →</a>
            </div>
            {myRequests.length === 0
              ? <div className="empty-state" style={{ padding: 30 }}><Wrench /><p>No requests yet</p></div>
              : myRequests.map(r => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{r.title}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{r.category}</div>
                  </div>
                  <span className={`badge ${r.priority === 'urgent' ? 'badge-danger' : r.priority === 'high' ? 'badge-warning' : 'badge-info'}`}>{r.priority}</span>
                </div>
              ))
            }
          </div>

          {/* Recent Notices */}
          <div className="card">
            <div className="card-header">
              <h3>Latest Notices</h3>
              <a href="/student/notices" style={{ fontSize: 12, color: '#3b82f6', textDecoration: 'none' }}>View all →</a>
            </div>
            {notices.length === 0
              ? <div className="empty-state" style={{ padding: 30 }}><Bell /><p>No notices</p></div>
              : notices.map(n => (
                <div key={n.id} style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className={`badge ${n.priority === 'urgent' ? 'badge-danger' : n.priority === 'important' ? 'badge-warning' : 'badge-secondary'}`}>{n.priority}</span>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{n.title}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.content}</div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ROOM BOOKING ─────────────────────────────────────────────
export function StudentRooms() {
  const [rooms, setRooms] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ check_in_date: '', notes: '' });
  const [filterType, setFilterType] = useState('');
  const [filterBlock, setFilterBlock] = useState('');
  const [tab, setTab] = useState('browse');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [r, b] = await Promise.all([roomAPI.getAll({ status: 'available', type: filterType, block: filterBlock }), bookingAPI.getMyBookings()]);
      setRooms(r.data.data);
      setMyBookings(b.data.data);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [filterType, filterBlock]);

  const handleBook = async (e) => {
    e.preventDefault();
    try {
      const { data } = await bookingAPI.book({ room_id: selected.id, ...form });
      toast.success(data.message || 'Booking request submitted!');
      setSelected(null);
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Booking failed'); }
  };

  const statusColors = { pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger', checked_out: 'badge-secondary' };
  const typeLabels = { single: '1 bed', double: '2 beds', triple: '3 beds', dormitory: '6+ beds' };

  return (
    <div>
      <Topbar title="Room Booking" subtitle="Browse and book available rooms" />
      <div className="page-content">
        <div className="tabs">
          <button className={`tab-btn ${tab === 'browse' ? 'active' : ''}`} onClick={() => setTab('browse')}>Browse Rooms</button>
          <button className={`tab-btn ${tab === 'my' ? 'active' : ''}`} onClick={() => setTab('my')}>My Bookings {myBookings.length > 0 && `(${myBookings.length})`}</button>
        </div>

        {tab === 'browse' && (
          <>
            <div className="filters-bar">
              <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13 }}>
                <option value="">All Types</option>
                {['single','double','triple','dormitory'].map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t}</option>)}
              </select>
              <select value={filterBlock} onChange={e => setFilterBlock(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13 }}>
                <option value="">All Blocks</option>
                {['A','B','C','D','E'].map(b => <option key={b}>Block {b}</option>)}
              </select>
            </div>

            {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
              <div className="rooms-grid">
                {rooms.map(room => (
                  <div key={room.id} className={`room-card ${selected?.id === room.id ? 'selected' : ''} ${room.status !== 'available' ? 'unavailable' : ''}`}
                    onClick={() => room.status === 'available' && setSelected(room)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 22, fontWeight: 800 }}>Room {room.room_number}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>Block {room.block} · Floor {room.floor}</div>
                      </div>
                      <span className={`badge ${room.status === 'available' ? 'badge-success' : 'badge-warning'}`}>{room.status}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                      <span className="badge badge-info">{room.room_type}</span>
                      <span className="badge badge-secondary">{typeLabels[room.room_type]}</span>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${(room.occupied / room.capacity) * 100}%`, background: room.occupied >= room.capacity ? '#ef4444' : '#10b981' }} />
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{room.occupied}/{room.capacity} occupied</div>
                    </div>
                    {room.amenities && (
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>🏷️ {room.amenities}</div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 800, color: '#1e40af', fontSize: 16 }}>₹{Number(room.price_per_month).toLocaleString()}<span style={{ fontWeight: 400, fontSize: 11 }}>/mo</span></div>
                      {room.status === 'available' && (
                        <button className={`btn btn-sm ${selected?.id === room.id ? 'btn-primary' : 'btn-outline'}`} onClick={(e) => { e.stopPropagation(); setSelected(room); }}>
                          {selected?.id === room.id ? '✓ Selected' : 'Select'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {rooms.length === 0 && <div className="empty-state" style={{ gridColumn: '1/-1' }}><BedDouble /><h3>No available rooms</h3><p>Try different filters</p></div>}
              </div>
            )}

            {selected && (
              <div style={{ position: 'fixed', bottom: 20, right: 20, background: 'white', borderRadius: 12, padding: '20px 24px', boxShadow: '0 8px 32px rgba(0,0,0,.15)', border: '1px solid #e2e8f0', width: 340, zIndex: 50 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontWeight: 700 }}>Book Room {selected.room_number}</div>
                  <button className="btn btn-icon btn-ghost btn-sm" onClick={() => setSelected(null)}><X size={14} /></button>
                </div>
                <form onSubmit={handleBook}>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label>Check-in Date</label>
                    <input type="date" required min={new Date().toISOString().split('T')[0]} value={form.check_in_date} onChange={e => setForm({ ...form, check_in_date: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label>Notes (optional)</label>
                    <textarea rows={2} placeholder="Any special requirements..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                  </div>
                  <div style={{ background: '#eff6ff', borderRadius: 8, padding: '10px 12px', marginBottom: 12, fontSize: 12, color: '#1e40af' }}>
                    ₹{Number(selected.price_per_month).toLocaleString()}/month · Block {selected.block} · {selected.room_type}
                  </div>
                  <button type="submit" className="btn btn-primary btn-block">Submit Booking Request</button>
                </form>
              </div>
            )}
          </>
        )}

        {tab === 'my' && (
          <div>
            {myBookings.length === 0
              ? <div className="empty-state"><BedDouble /><h3>No bookings yet</h3><p>Browse rooms to make your first booking</p></div>
              : myBookings.map(b => (
                <div key={b.id} className="card" style={{ marginBottom: 12, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', gap: 0 }}>
                    <div style={{ width: 6, background: b.status === 'approved' ? '#10b981' : b.status === 'pending' ? '#f59e0b' : '#ef4444', flexShrink: 0 }} />
                    <div style={{ padding: '16px 20px', flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>Room {b.room_number} – Block {b.block}</div>
                        <div style={{ color: '#64748b', fontSize: 13 }}>{b.room_type} · ₹{Number(b.price_per_month).toLocaleString()}/month · Check-in: {b.check_in_date}</div>
                        {b.amenities && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>🏷️ {b.amenities}</div>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className={`badge ${statusColors[b.status]}`}>{b.status}</span>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>Requested {b.created_at ? formatDistanceToNow(new Date(b.created_at), { addSuffix: true }) : ''}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAINTENANCE ──────────────────────────────────────────────
export function StudentMaintenance() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: 'electrical', title: '', description: '', room_id: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data } = await maintenanceAPI.getMy();
      setRequests(data.data);
    } catch { toast.error('Failed to load requests'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await maintenanceAPI.create(form);
      toast.success(`Request submitted! ML Priority: ${data.mlAnalysis?.priority?.toUpperCase()}`);
      setShowForm(false);
      setForm({ category: 'electrical', title: '', description: '', room_id: '' });
      fetchRequests();
    } catch (err) { toast.error(err.response?.data?.message || 'Submission failed'); }
    finally { setSubmitting(false); }
  };

  const priorityColors = { urgent: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#10b981' };
  const statusIcons = { pending: <Clock size={14} color="#f59e0b" />, in_progress: <AlertTriangle size={14} color="#3b82f6" />, resolved: <CheckCircle size={14} color="#10b981" /> };
  const categoryIcons = { electrical: '⚡', plumbing: '🔧', furniture: '🪑', cleaning: '🧹', security: '🔒', internet: '📡', other: '📋' };

  return (
    <div>
      <Topbar title="Maintenance Requests" subtitle="Submit and track maintenance issues" />
      <div className="page-content">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}><Wrench size={16} /> {showForm ? 'Cancel' : 'New Request'}</button>
        </div>

        {showForm && (
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <h3>Submit Maintenance Request</h3>
              <div className="ml-badge"><Zap size={10} /> ML Priority Detection</div>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Category</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                      {['electrical','plumbing','furniture','cleaning','security','internet','other'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Title</label>
                    <input required placeholder="Brief description of issue" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Detailed Description</label>
                  <textarea required placeholder="Describe the issue in detail. Use keywords like 'urgent', 'leak', 'broken' for better ML priority detection..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ minHeight: 100 }} />
                  <p className="form-hint">💡 Our ML model analyzes your description to auto-assign priority</p>
                </div>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Request'}</button>
              </form>
            </div>
          </div>
        )}

        {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
          requests.length === 0
            ? <div className="empty-state"><Wrench /><h3>No maintenance requests</h3><p>Submit your first request above</p></div>
            : requests.map(r => (
              <div key={r.id} style={{ background: 'white', borderRadius: 12, border: `1px solid #e2e8f0`, marginBottom: 12, overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: 4, background: priorityColors[r.priority] || '#e2e8f0', flexShrink: 0 }} />
                <div style={{ padding: '16px 20px', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>{categoryIcons[r.category]} {r.title}</div>
                      <p style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>{r.description}</p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span className={`badge ${r.priority === 'urgent' ? 'badge-danger' : r.priority === 'high' ? 'badge-warning' : 'badge-info'}`}>{r.priority}</span>
                        <span className="badge badge-secondary">{r.category}</span>
                        <span className="ml-badge"><Zap size={10} /> ML: {Number(r.ml_priority_score).toFixed(1)}</span>
                      </div>
                      {r.admin_notes && <div style={{ background: '#eff6ff', borderRadius: 6, padding: '8px 12px', marginTop: 8, fontSize: 12, color: '#1e40af' }}>📋 Admin: {r.admin_notes}</div>}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>{statusIcons[r.status]}<span style={{ fontSize: 12, fontWeight: 600 }}>{r.status.replace('_', ' ')}</span></div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{r.created_at ? formatDistanceToNow(new Date(r.created_at), { addSuffix: true }) : ''}</div>
                      {r.assigned_to && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>👷 {r.assigned_to}</div>}
                    </div>
                  </div>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}

// ─── FEE PAYMENT ──────────────────────────────────────────────
export function StudentFees() {
  const [fees, setFees] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState(null);
  const [payForm, setPayForm] = useState({ payment_method: 'online', transaction_id: '' });

  const fetchFees = async () => {
    setLoading(true);
    try {
      const { data } = await feeAPI.getMyFees();
      setFees(data.data);
      setSummary(data.summary || {});
    } catch { toast.error('Failed to load fees'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchFees(); }, []);

  const handlePay = async (e) => {
    e.preventDefault();
    try {
      const { data } = await feeAPI.pay({ fee_id: payModal.id, ...payForm });
      toast.success(`Payment successful! Receipt: ${data.receipt}`);
      setPayModal(null);
      fetchFees();
    } catch (err) { toast.error(err.response?.data?.message || 'Payment failed'); }
  };

  const statusColors = { pending: 'badge-warning', paid: 'badge-success', overdue: 'badge-danger', waived: 'badge-secondary' };
  const statusIcons = { pending: '⏳', paid: '✅', overdue: '🔴', waived: '⬜' };

  return (
    <div>
      <Topbar title="Fee Payment" subtitle="View and pay your hostel fees" />
      <div className="page-content">
        {/* Summary */}
        <div className="stats-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="stat-card">
            <div className="stat-icon bg-blue"><CreditCard /></div>
            <div className="stat-info"><h3>₹{Number(summary.total_amount || 0).toLocaleString()}</h3><p>Total Billed</p></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon bg-green"><CheckCircle /></div>
            <div className="stat-info"><h3>₹{Number(summary.paid_amount || 0).toLocaleString()}</h3><p>Total Paid</p></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon bg-amber"><Clock /></div>
            <div className="stat-info"><h3>₹{Number(summary.pending_amount || 0).toLocaleString()}</h3><p>Due Amount</p>
              {summary.overdue_count > 0 && <span className="badge badge-danger">{summary.overdue_count} overdue</span>}
            </div>
          </div>
        </div>

        {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
          <div className="card">
            <div className="table-container">
              <table>
                <thead><tr>
                  <th>Fee Type</th>
                  <th>Month</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Receipt</th>
                  <th>Action</th>
                </tr></thead>
                <tbody>
                  {fees.map(f => (
                    <tr key={f.id}>
                      <td>
                        <span style={{ fontSize: 16 }}>{statusIcons[f.status]}</span>
                        {' '}<span style={{ fontWeight: 600, textTransform: 'capitalize', fontSize: 13 }}>{f.fee_type.replace('_', ' ')}</span>
                      </td>
                      <td>{f.month} {f.year}</td>
                      <td><span style={{ fontWeight: 700 }}>₹{Number(f.amount).toLocaleString()}</span></td>
                      <td>
                        <span style={{ color: f.status === 'overdue' ? '#ef4444' : 'inherit', fontWeight: f.status === 'overdue' ? 700 : 400 }}>{f.due_date}</span>
                      </td>
                      <td><span className={`badge ${statusColors[f.status]}`}>{f.status}</span></td>
                      <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{f.receipt_number || '–'}</td>
                      <td>
                        {(f.status === 'pending' || f.status === 'overdue') && (
                          <button className="btn btn-primary btn-sm" onClick={() => setPayModal(f)}>Pay Now</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {fees.length === 0 && <div className="empty-state"><CreditCard /><h3>No fee records yet</h3></div>}
            </div>
          </div>
        )}

        {payModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Pay Fee</h3>
                <button className="btn btn-icon btn-ghost" onClick={() => setPayModal(null)}><X size={18} /></button>
              </div>
              <form onSubmit={handlePay}>
                <div className="modal-body">
                  <div style={{ background: '#eff6ff', borderRadius: 8, padding: '16px', marginBottom: 20 }}>
                    <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>{payModal.fee_type.replace('_', ' ')} – {payModal.month} {payModal.year}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#1e40af' }}>₹{Number(payModal.amount).toLocaleString()}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Due: {payModal.due_date}</div>
                  </div>
                  <div className="form-group">
                    <label>Payment Method</label>
                    <select value={payForm.payment_method} onChange={e => setPayForm({ ...payForm, payment_method: e.target.value })}>
                      <option value="online">Online Transfer</option>
                      <option value="upi">UPI</option>
                      <option value="cash">Cash</option>
                      <option value="cheque">Cheque</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Transaction ID (optional)</label>
                    <input placeholder="UTR number / transaction reference" value={payForm.transaction_id} onChange={e => setPayForm({ ...payForm, transaction_id: e.target.value })} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setPayModal(null)}>Cancel</button>
                  <button type="submit" className="btn btn-success">Confirm Payment</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MEAL TRACKER ─────────────────────────────────────────────
export function StudentMeals() {
  const [plans, setPlans] = useState([]);
  const [myPlan, setMyPlan] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('plan');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year] = useState(new Date().getFullYear());

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [p, mp, att] = await Promise.all([mealAPI.getPlans(), mealAPI.getMyPlan(), mealAPI.getMyAttendance({ month, year })]);
      setPlans(p.data.data);
      setMyPlan(mp.data.data);
      setAttendance(att.data.data);
      setSummary(att.data.summary);
    } catch { toast.error('Failed to load meal data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [month]);

  const handleSubscribe = async (planId) => {
    try {
      await mealAPI.subscribe({ meal_plan_id: planId, start_date: new Date().toISOString().split('T')[0] });
      toast.success('Meal plan subscribed!');
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Subscription failed'); }
  };

  const mealTypeIcons = { breakfast: '☀️', lunch: '🌤️', dinner: '🌙' };
  const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div>
      <Topbar title="Meal Tracker" subtitle="Manage your meal plan and track attendance" />
      <div className="page-content">
        <div className="tabs">
          <button className={`tab-btn ${tab === 'plan' ? 'active' : ''}`} onClick={() => setTab('plan')}>Meal Plans</button>
          <button className={`tab-btn ${tab === 'attendance' ? 'active' : ''}`} onClick={() => setTab('attendance')}>Attendance</button>
        </div>

        {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
          <>
            {tab === 'plan' && (
              <>
                {myPlan && (
                  <div style={{ background: 'linear-gradient(135deg, #10b981, #0891b2)', borderRadius: 12, padding: '20px 24px', marginBottom: 24, color: 'white' }}>
                    <div style={{ fontSize: 12, opacity: .8, marginBottom: 4 }}>Current Plan</div>
                    <div style={{ fontWeight: 800, fontSize: 20 }}>{myPlan.plan_name}</div>
                    <div style={{ opacity: .85, fontSize: 13, marginTop: 4 }}>
                      {myPlan.breakfast && '☀️ Breakfast '}{myPlan.lunch && '🌤️ Lunch '}{myPlan.dinner && '🌙 Dinner'}
                      &nbsp;·&nbsp; ₹{Number(myPlan.price_per_month).toLocaleString()}/month
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                  {plans.map(plan => (
                    <div key={plan.id} className="card" style={{ padding: 20, border: myPlan?.meal_plan_id === plan.id ? '2px solid #10b981' : '2px solid #e2e8f0' }}>
                      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{plan.name}</div>
                      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>{plan.description}</div>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                        {plan.breakfast && <span style={{ padding: '4px 8px', background: '#fef9c3', borderRadius: 6, fontSize: 12 }}>☀️ Breakfast</span>}
                        {plan.lunch && <span style={{ padding: '4px 8px', background: '#dcfce7', borderRadius: 6, fontSize: 12 }}>🌤️ Lunch</span>}
                        {plan.dinner && <span style={{ padding: '4px 8px', background: '#ede9fe', borderRadius: 6, fontSize: 12 }}>🌙 Dinner</span>}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 800, color: '#1e40af', fontSize: 18 }}>₹{Number(plan.price_per_month).toLocaleString()}<span style={{ fontWeight: 400, fontSize: 11 }}>/mo</span></div>
                        {myPlan?.meal_plan_id === plan.id
                          ? <span className="badge badge-success">✓ Active</span>
                          : <button className="btn btn-primary btn-sm" onClick={() => handleSubscribe(plan.id)}>Subscribe</button>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {tab === 'attendance' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <select value={month} onChange={e => setMonth(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13 }}>
                    {months.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                  </select>
                  <span style={{ color: '#64748b', fontSize: 13 }}>{year}</span>
                </div>

                {summary.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
                    {summary.map(s => (
                      <div key={s.meal_type} className="stat-card">
                        <div style={{ fontSize: 24 }}>{mealTypeIcons[s.meal_type]}</div>
                        <div className="stat-info">
                          <h3>{s.present}</h3>
                          <p>{s.meal_type} attended</p>
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>{s.absent} absent</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {attendance.length === 0
                  ? <div className="empty-state"><UtensilsCrossed /><h3>No attendance data for {months[month]} {year}</h3></div>
                  : (
                    <div className="card">
                      <div className="table-container">
                        <table>
                          <thead><tr><th>Date</th><th>Breakfast</th><th>Lunch</th><th>Dinner</th></tr></thead>
                          <tbody>
                            {[...new Set(attendance.map(a => a.date))].map(date => {
                              const dayAtt = attendance.filter(a => a.date === date);
                              const get = (type) => dayAtt.find(a => a.meal_type === type);
                              return (
                                <tr key={date}>
                                  <td>{new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                                  {['breakfast', 'lunch', 'dinner'].map(m => {
                                    const a = get(m);
                                    return (
                                      <td key={m}>
                                        {a ? (a.status === 'present' ? <span className="badge badge-success">✓ Present</span> : <span className="badge badge-danger">✗ Absent</span>) : <span style={{ color: '#94a3b8', fontSize: 12 }}>–</span>}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                }
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── COMPLAINTS ───────────────────────────────────────────────
export function StudentComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: 'maintenance', title: '', description: '', is_anonymous: false });
  const [submitting, setSubmitting] = useState(false);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const { data } = await complaintAPI.getMy();
      setComplaints(data.data);
    } catch { toast.error('Failed to load complaints'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchComplaints(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await complaintAPI.create(form);
      toast.success(`Complaint filed! ML Urgency: ${data.mlAnalysis?.urgencyScore}/10`);
      setShowForm(false);
      setForm({ category: 'maintenance', title: '', description: '', is_anonymous: false });
      fetchComplaints();
    } catch (err) { toast.error(err.response?.data?.message || 'Submission failed'); }
    finally { setSubmitting(false); }
  };

  const statusColors = { open: 'badge-info', in_review: 'badge-warning', resolved: 'badge-success', closed: 'badge-secondary' };
  const priorityColors = { high: 'badge-danger', medium: 'badge-warning', low: 'badge-secondary' };

  return (
    <div>
      <Topbar title="Complaints" subtitle="File and track your complaints" />
      <div className="page-content">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}><MessageSquare size={16} /> {showForm ? 'Cancel' : 'File Complaint'}</button>
        </div>

        {showForm && (
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header"><h3>File a Complaint</h3><div className="ml-badge"><Zap size={10} /> ML Sentiment Analysis</div></div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Category</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                      {['maintenance','mess','staff','security','neighbor','facilities','other'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Title</label>
                    <input required placeholder="Brief title of complaint" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Detailed Description</label>
                  <textarea required placeholder="Describe your complaint in detail..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ minHeight: 100 }} />
                  <p className="form-hint">💡 ML model analyzes sentiment & urgency for faster resolution</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <input type="checkbox" id="anon" style={{ width: 'auto' }} checked={form.is_anonymous} onChange={e => setForm({ ...form, is_anonymous: e.target.checked })} />
                  <label htmlFor="anon" style={{ marginBottom: 0, textTransform: 'none', fontSize: 13, cursor: 'pointer' }}>🎭 Submit anonymously</label>
                </div>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Complaint'}</button>
              </form>
            </div>
          </div>
        )}

        {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
          complaints.length === 0
            ? <div className="empty-state"><MessageSquare /><h3>No complaints filed</h3><p>Use the button above to file a complaint</p></div>
            : complaints.map(c => (
              <div key={c.id} className="card" style={{ marginBottom: 12, padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span className={`badge ${priorityColors[c.priority]}`}>{c.priority}</span>
                      <span className="badge badge-info">{c.category}</span>
                      <span className="ml-badge"><Zap size={10} /> {Number(c.ml_urgency_score).toFixed(1)}</span>
                      {c.is_anonymous && <span className="badge badge-secondary">🎭 Anonymous</span>}
                    </div>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>{c.title}</div>
                    <p style={{ fontSize: 13, color: '#64748b' }}>{c.description}</p>
                    {c.admin_response && (
                      <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '10px 14px', marginTop: 10, border: '1px solid #d1fae5' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#166534', marginBottom: 4 }}>✅ Admin Response</div>
                        <p style={{ fontSize: 13, color: '#166534' }}>{c.admin_response}</p>
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', marginLeft: 16, flexShrink: 0 }}>
                    <span className={`badge ${statusColors[c.status]}`}>{c.status.replace('_', ' ')}</span>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>{c.created_at ? formatDistanceToNow(new Date(c.created_at), { addSuffix: true }) : ''}</div>
                  </div>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}

// ─── NOTICES ─────────────────────────────────────────────────
export function StudentNotices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    setLoading(true);
    noticeAPI.getAll().then(({ data }) => setNotices(data.data)).catch(() => toast.error('Failed to load notices')).finally(() => setLoading(false));
  }, []);

  const categories = ['all', 'general', 'maintenance', 'fees', 'events', 'rules', 'emergency'];
  const filtered = filter === 'all' ? notices : notices.filter(n => n.category === filter);
  const priorityBorderColors = { urgent: '#ef4444', important: '#f59e0b', normal: '#e2e8f0' };

  return (
    <div>
      <Topbar title="Notice Board" subtitle="Stay updated with hostel announcements" />
      <div className="page-content">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
          {categories.map(c => (
            <button key={c} className={`btn btn-sm ${filter === c ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter(c)} style={{ textTransform: 'capitalize' }}>{c}</button>
          ))}
        </div>

        {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
          filtered.length === 0
            ? <div className="empty-state"><Bell /><h3>No notices</h3></div>
            : filtered.map(n => (
              <div key={n.id} style={{
                background: 'white',
                borderRadius: 12,
                borderLeft: `4px solid ${priorityBorderColors[n.priority] || '#e2e8f0'}`,
                padding: '16px 20px',
                marginBottom: 12,
                boxShadow: '0 1px 3px rgba(0,0,0,.06)',
                transition: 'box-shadow .2s',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      {n.is_pinned && <span style={{ fontSize: 12, fontWeight: 700, color: '#1e40af' }}>📌 Pinned</span>}
                      <span className={`badge ${n.priority === 'urgent' ? 'badge-danger' : n.priority === 'important' ? 'badge-warning' : 'badge-secondary'}`}>{n.priority}</span>
                      <span className="badge badge-info">{n.category}</span>
                    </div>
                    <h4 style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{n.title}</h4>
                    <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.7 }}>{n.content}</p>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 10 }}>
                      Posted by {n.created_by_name} · {n.created_at ? new Date(n.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                      {n.expires_at && ` · Expires ${n.expires_at}`}
                    </div>
                  </div>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
