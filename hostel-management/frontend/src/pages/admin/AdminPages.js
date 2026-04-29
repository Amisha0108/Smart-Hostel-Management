import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, MessageSquare, Bell, Plus, Wrench, X, Zap, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import Topbar from '../../components/Topbar';
import { bookingAPI, complaintAPI, maintenanceAPI, noticeAPI, feeAPI } from '../../utils/api';
import { formatDistanceToNow } from 'date-fns';

// ─── BOOKINGS PAGE ────────────────────────────────────────────
export function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [actionModal, setActionModal] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await bookingAPI.getAll({ status: filter });
      setBookings(data.data);
    } catch { toast.error('Failed to load bookings'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [filter]);

  const handleAction = async (status) => {
    try {
      await bookingAPI.updateStatus(actionModal.id, { status, admin_notes: adminNotes });
      toast.success(`Booking ${status}`);
      setActionModal(null);
      setAdminNotes('');
      fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
  };

  const statusMap = {
    pending: { class: 'badge-warning', icon: <Clock size={12} /> },
    approved: { class: 'badge-success', icon: <CheckCircle size={12} /> },
    rejected: { class: 'badge-danger', icon: <XCircle size={12} /> },
  };

  return (
    <div>
      <Topbar title="Booking Requests" subtitle="Manage student room bookings" />
      <div className="page-content">
        <div className="tabs" style={{ marginBottom: 20 }}>
          {['pending', 'approved', 'rejected'].map(s => (
            <button key={s} className={`tab-btn ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)} style={{ textTransform: 'capitalize' }}>
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div>
        ) : (
          <div className="card">
            <div className="table-container">
              <table>
                <thead><tr>
                  <th>Student</th>
                  <th>Room</th>
                  <th>Check-in Date</th>
                  <th>Requested</th>
                  <th>Status</th>
                  {filter === 'pending' && <th>Actions</th>}
                </tr></thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{b.student_name}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{b.student_id}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{b.room_number}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>Block {b.block} · {b.room_type} · ₹{Number(b.price_per_month).toLocaleString()}/mo</div>
                      </td>
                      <td>{b.check_in_date}</td>
                      <td style={{ fontSize: 12, color: '#64748b' }}>{b.created_at ? formatDistanceToNow(new Date(b.created_at), { addSuffix: true }) : '–'}</td>
                      <td>
                        <span className={`badge ${statusMap[b.status]?.class || 'badge-secondary'}`}>
                          {statusMap[b.status]?.icon} {b.status}
                        </span>
                      </td>
                      {filter === 'pending' && (
                        <td>
                          <button className="btn btn-success btn-sm" style={{ marginRight: 6 }} onClick={() => setActionModal({ ...b, action: 'approve' })}>
                            <CheckCircle size={13} /> Approve
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => setActionModal({ ...b, action: 'reject' })}>
                            <XCircle size={13} /> Reject
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {bookings.length === 0 && <div className="empty-state"><Clock /><h3>No {filter} bookings</h3></div>}
            </div>
          </div>
        )}

        {actionModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>{actionModal.action === 'approve' ? 'Approve' : 'Reject'} Booking</h3>
                <button className="btn btn-icon btn-ghost" onClick={() => setActionModal(null)}><X size={18} /></button>
              </div>
              <div className="modal-body">
                <p style={{ marginBottom: 16, color: '#475569' }}>
                  {actionModal.action === 'approve' ? 'Approve' : 'Reject'} booking request for <strong>{actionModal.student_name}</strong> for room <strong>{actionModal.room_number}</strong>?
                </p>
                <div className="form-group">
                  <label>Admin Notes (optional)</label>
                  <textarea placeholder="Add any notes for the student..." value={adminNotes} onChange={e => setAdminNotes(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setActionModal(null)}>Cancel</button>
                <button className={`btn ${actionModal.action === 'approve' ? 'btn-success' : 'btn-danger'}`} onClick={() => handleAction(actionModal.action === 'approve' ? 'approved' : 'rejected')}>
                  Confirm {actionModal.action === 'approve' ? 'Approval' : 'Rejection'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── COMPLAINTS PAGE ──────────────────────────────────────────
export function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open');
  const [selected, setSelected] = useState(null);
  const [response, setResponse] = useState('');
  const [newStatus, setNewStatus] = useState('in_review');

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await complaintAPI.getAll({ status: filter });
      setComplaints(data.data);
    } catch { toast.error('Failed to load complaints'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [filter]);

  const handleRespond = async () => {
    try {
      await complaintAPI.respond(selected.id, { status: newStatus, admin_response: response });
      toast.success('Complaint updated');
      setSelected(null);
      fetch();
    } catch { toast.error('Failed to update complaint'); }
  };

  const priorityColors = { high: 'badge-danger', medium: 'badge-warning', low: 'badge-secondary' };

  return (
    <div>
      <Topbar title="Complaint Management" subtitle="Handle student complaints with ML priority" />
      <div className="page-content">
        <div className="tabs" style={{ marginBottom: 20 }}>
          {['open', 'in_review', 'resolved', 'closed'].map(s => (
            <button key={s} className={`tab-btn ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)} style={{ textTransform: 'capitalize', fontSize: 12 }}>
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>

        {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
          <div className="card">
            <div className="table-container">
              <table>
                <thead><tr>
                  <th>Student</th>
                  <th>Category</th>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>ML Score</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr></thead>
                <tbody>
                  {complaints.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 500 }}>{c.student_name}</td>
                      <td><span className="badge badge-info">{c.category}</span></td>
                      <td style={{ maxWidth: 200, fontSize: 13 }}>{c.title}</td>
                      <td><span className={`badge ${priorityColors[c.priority]}`}>{c.priority}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div className="progress-bar" style={{ width: 50 }}>
                            <div className="progress-fill" style={{ width: `${(c.ml_urgency_score / 10) * 100}%`, background: '#8b5cf6' }} />
                          </div>
                          <span className="ml-badge">{Number(c.ml_urgency_score).toFixed(1)}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: '#64748b' }}>{c.created_at ? formatDistanceToNow(new Date(c.created_at), { addSuffix: true }) : '–'}</td>
                      <td>
                        <button className="btn btn-outline btn-sm" onClick={() => { setSelected(c); setResponse(c.admin_response || ''); setNewStatus(c.status); }}>
                          Respond
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {complaints.length === 0 && <div className="empty-state"><MessageSquare /><h3>No {filter.replace('_', ' ')} complaints</h3></div>}
            </div>
          </div>
        )}

        {selected && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Respond to Complaint</h3>
                <button className="btn btn-icon btn-ghost" onClick={() => setSelected(null)}><X size={18} /></button>
              </div>
              <div className="modal-body">
                <div style={{ background: '#f8fafc', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>{selected.title}</div>
                  <p style={{ fontSize: 13, color: '#475569' }}>{selected.description}</p>
                  <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                    <span className={`badge ${priorityColors[selected.priority]}`}>{selected.priority}</span>
                    <span className="ml-badge"><Zap size={10} /> ML Score: {Number(selected.ml_urgency_score).toFixed(1)}</span>
                    <span className="badge badge-info">{selected.ml_sentiment}</span>
                  </div>
                </div>
                <div className="form-group">
                  <label>Update Status</label>
                  <select value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                    <option value="in_review">In Review</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Your Response</label>
                  <textarea placeholder="Describe the action taken or resolution..." value={response} onChange={e => setResponse(e.target.value)} style={{ minHeight: 110 }} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setSelected(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleRespond}>Submit Response</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAINTENANCE PAGE ─────────────────────────────────────────
export function AdminMaintenance() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ status: 'in_progress', assigned_to: '', admin_notes: '' });

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await maintenanceAPI.getAll({ status: filter });
      setRequests(data.data);
    } catch { toast.error('Failed to load requests'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [filter]);

  const handleUpdate = async () => {
    try {
      await maintenanceAPI.update(selected.id, form);
      toast.success('Request updated');
      setSelected(null);
      fetch();
    } catch { toast.error('Update failed'); }
  };

  const priorityColors = { urgent: 'badge-danger', high: 'badge-warning', medium: 'badge-info', low: 'badge-secondary' };
  const categoryIcons = { electrical: '⚡', plumbing: '🔧', furniture: '🪑', cleaning: '🧹', security: '🔒', internet: '📡', other: '📋' };

  return (
    <div>
      <Topbar title="Maintenance Requests" subtitle="ML-powered priority management" />
      <div className="page-content">
        <div className="tabs" style={{ marginBottom: 20 }}>
          {['pending', 'in_progress', 'resolved', 'closed'].map(s => (
            <button key={s} className={`tab-btn ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)} style={{ textTransform: 'capitalize', fontSize: 12 }}>
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>

        {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
          <div className="card">
            <div className="table-container">
              <table>
                <thead><tr>
                  <th>Student</th>
                  <th>Room</th>
                  <th>Category</th>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>ML Score</th>
                  <th>Assigned</th>
                  <th>Actions</th>
                </tr></thead>
                <tbody>
                  {requests.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 500, fontSize: 13 }}>{r.student_name}</td>
                      <td>{r.room_number || '–'}</td>
                      <td><span>{categoryIcons[r.category] || '📋'} {r.category}</span></td>
                      <td style={{ fontSize: 13, maxWidth: 180 }}>{r.title}</td>
                      <td><span className={`badge ${priorityColors[r.priority]}`}>{r.priority}</span></td>
                      <td><span className="ml-badge"><Zap size={10} /> {Number(r.ml_priority_score).toFixed(1)}</span></td>
                      <td style={{ fontSize: 12 }}>{r.assigned_to || <span style={{ color: '#94a3b8' }}>Unassigned</span>}</td>
                      <td>
                        <button className="btn btn-outline btn-sm" onClick={() => { setSelected(r); setForm({ status: r.status, assigned_to: r.assigned_to || '', admin_notes: r.admin_notes || '' }); }}>
                          Update
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {requests.length === 0 && <div className="empty-state"><Wrench /><h3>No {filter.replace('_', ' ')} requests</h3></div>}
            </div>
          </div>
        )}

        {selected && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Update Maintenance Request</h3>
                <button className="btn btn-icon btn-ghost" onClick={() => setSelected(null)}><X size={18} /></button>
              </div>
              <div className="modal-body">
                <div style={{ background: '#f8fafc', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
                  <div style={{ fontWeight: 700 }}>{selected.title}</div>
                  <p style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>{selected.description}</p>
                  <div style={{ marginTop: 8 }}>
                    <span className={`badge ${priorityColors[selected.priority]}`}>{selected.priority}</span>
                    &nbsp;<span className="ml-badge"><Zap size={10} /> {Number(selected.ml_priority_score).toFixed(1)}</span>
                  </div>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Assigned To</label>
                  <input placeholder="Staff name or department" value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Admin Notes</label>
                  <textarea placeholder="Notes about the maintenance work..." value={form.admin_notes} onChange={e => setForm({ ...form, admin_notes: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setSelected(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleUpdate}>Update Request</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── NOTICES PAGE ─────────────────────────────────────────────
export function AdminNotices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editNotice, setEditNotice] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', category: 'general', priority: 'normal', target_audience: 'all', is_pinned: false, expires_at: '' });

  const { noticeAPI: api } = require('../../utils/api');

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await noticeAPI.getAll();
      setNotices(data.data);
    } catch { toast.error('Failed to load notices'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setEditNotice(null); setForm({ title: '', content: '', category: 'general', priority: 'normal', target_audience: 'all', is_pinned: false, expires_at: '' }); setShowModal(true); };
  const openEdit = (n) => { setEditNotice(n); setForm({ title: n.title, content: n.content, category: n.category, priority: n.priority, target_audience: n.target_audience, is_pinned: n.is_pinned, expires_at: n.expires_at || '' }); setShowModal(true); };

  const handleSave = async () => {
    try {
      if (editNotice) { await noticeAPI.update(editNotice.id, form); toast.success('Notice updated'); }
      else { await noticeAPI.create(form); toast.success('Notice published'); }
      setShowModal(false);
      fetch();
    } catch { toast.error('Operation failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this notice?')) return;
    try { await noticeAPI.delete(id); toast.success('Notice deleted'); fetch(); }
    catch { toast.error('Delete failed'); }
  };

  const priorityStyle = { urgent: 'notice-card urgent', important: 'notice-card important', normal: 'notice-card' };

  return (
    <div>
      <Topbar title="Notice Board" subtitle="Manage hostel notices and announcements" />
      <div className="page-content">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Post Notice</button>
        </div>

        {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
          notices.length === 0
            ? <div className="empty-state"><Bell /><h3>No notices posted</h3><p>Click "Post Notice" to add your first notice</p></div>
            : notices.map(n => (
              <div key={n.id} className={priorityStyle[n.priority] || 'notice-card'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      {n.is_pinned && <span style={{ fontSize: 11, fontWeight: 700, color: '#1e40af' }}>📌 PINNED</span>}
                      <span className={`badge ${n.priority === 'urgent' ? 'badge-danger' : n.priority === 'important' ? 'badge-warning' : 'badge-secondary'}`}>{n.priority}</span>
                      <span className="badge badge-info">{n.category}</span>
                      <span className="badge badge-secondary">{n.target_audience}</span>
                    </div>
                    <h4 style={{ fontWeight: 700, marginBottom: 6 }}>{n.title}</h4>
                    <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{n.content}</p>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>By {n.created_by_name} · {n.created_at ? new Date(n.created_at).toLocaleDateString() : ''}{n.expires_at ? ` · Expires ${n.expires_at}` : ''}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginLeft: 12 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(n)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(n.id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))
        )}

        {showModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>{editNotice ? 'Edit Notice' : 'Post New Notice'}</h3>
                <button className="btn btn-icon btn-ghost" onClick={() => setShowModal(false)}><X size={18} /></button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Title</label>
                  <input placeholder="Notice title..." required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Content</label>
                  <textarea placeholder="Notice details..." style={{ minHeight: 120 }} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Category</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                      {['general','maintenance','fees','events','rules','emergency'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Priority</label>
                    <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                      <option value="normal">Normal</option>
                      <option value="important">Important</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Target Audience</label>
                    <select value={form.target_audience} onChange={e => setForm({ ...form, target_audience: e.target.value })}>
                      <option value="all">All</option>
                      <option value="students">Students Only</option>
                      <option value="wardens">Wardens Only</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Expires On (optional)</label>
                    <input type="date" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" id="pin" style={{ width: 'auto' }} checked={form.is_pinned} onChange={e => setForm({ ...form, is_pinned: e.target.checked })} />
                  <label htmlFor="pin" style={{ marginBottom: 0, textTransform: 'none', fontSize: 13, cursor: 'pointer' }}>📌 Pin this notice to the top</label>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave}>{editNotice ? 'Save Changes' : 'Publish Notice'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── FEES PAGE ────────────────────────────────────────────────
export function AdminFees() {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ student_id: '', fee_type: 'room_rent', amount: '', due_date: '', month: '', year: new Date().getFullYear(), notes: '' });

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await feeAPI.getAll({ status: filter });
      setFees(data.data);
    } catch { toast.error('Failed to load fees'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [filter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await feeAPI.create(form);
      toast.success('Fee record created');
      setShowModal(false);
      fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create fee'); }
  };

  return (
    <div>
      <Topbar title="Fee Management" subtitle="Track and manage student fees" />
      <div className="page-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div className="tabs" style={{ marginBottom: 0, border: 'none' }}>
            {['pending', 'paid', 'overdue'].map(s => (
              <button key={s} className={`tab-btn ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)} style={{ textTransform: 'capitalize', fontSize: 12 }}>{s}</button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Add Fee</button>
        </div>

        {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div> : (
          <div className="card">
            <div className="table-container">
              <table>
                <thead><tr>
                  <th>Student</th>
                  <th>Fee Type</th>
                  <th>Amount</th>
                  <th>Month</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Receipt</th>
                </tr></thead>
                <tbody>
                  {fees.map(f => (
                    <tr key={f.id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{f.student_name}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{f.student_id}</div>
                      </td>
                      <td><span className="badge badge-info">{f.fee_type.replace('_', ' ')}</span></td>
                      <td><span style={{ fontWeight: 700 }}>₹{Number(f.amount).toLocaleString()}</span></td>
                      <td>{f.month || '–'} {f.year}</td>
                      <td>{f.due_date}</td>
                      <td><span className={`badge ${f.status === 'paid' ? 'badge-success' : f.status === 'overdue' ? 'badge-danger' : 'badge-warning'}`}>{f.status}</span></td>
                      <td style={{ fontSize: 12, fontFamily: 'monospace' }}>{f.receipt_number || '–'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {fees.length === 0 && <div className="empty-state"><CreditCard /><h3>No {filter} fees</h3></div>}
            </div>
          </div>
        )}

        {showModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Add Fee Record</h3>
                <button className="btn btn-icon btn-ghost" onClick={() => setShowModal(false)}><X size={18} /></button>
              </div>
              <form onSubmit={handleCreate}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Student ID (DB ID)</label>
                    <input type="number" required placeholder="Enter student database ID" value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })} />
                    <p className="form-hint">Use the numeric ID from the students table</p>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Fee Type</label>
                      <select value={form.fee_type} onChange={e => setForm({ ...form, fee_type: e.target.value })}>
                        {['room_rent','mess_fee','maintenance_fee','security_deposit','other'].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Amount (₹)</label>
                      <input type="number" required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Month</label>
                      <select value={form.month} onChange={e => setForm({ ...form, month: e.target.value })}>
                        {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => <option key={m}>{m}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Due Date</label>
                      <input type="date" required value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Create Fee Record</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
