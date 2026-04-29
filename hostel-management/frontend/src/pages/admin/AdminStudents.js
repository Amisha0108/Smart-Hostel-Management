import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, Eye, Users, ShieldCheck, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Topbar from '../../components/Topbar';
import { adminAPI } from '../../utils/api';

function StudentModal({ student, onClose }) {
  if (!student) return null;
  return (
    <div className="modal-overlay">
      <div className="modal modal-lg">
        <div className="modal-header">
          <h3>Student Profile – {student.student_id}</h3>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="form-row" style={{ marginBottom: 16 }}>
            <div><label>Full Name</label><p style={{ fontWeight: 600 }}>{student.name}</p></div>
            <div><label>Email</label><p>{student.email}</p></div>
          </div>
          <div className="form-row" style={{ marginBottom: 16 }}>
            <div><label>Course / Department</label><p>{student.course} – {student.department}</p></div>
            <div><label>Year of Study</label><p>Year {student.year_of_study}</p></div>
          </div>
          <div className="form-row" style={{ marginBottom: 16 }}>
            <div><label>Phone</label><p>{student.phone || '–'}</p></div>
            <div><label>Blood Group</label><p>{student.blood_group || '–'}</p></div>
          </div>
          <div style={{ marginBottom: 16 }}><label>Permanent Address</label><p>{student.permanent_address || '–'}</p></div>
          {student.booking && (
            <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
              <strong>Room:</strong> {student.booking.room_number} (Block {student.booking.block}) – {student.booking.room_type}
            </div>
          )}
          {student.fees && (
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ background: '#eff6ff', borderRadius: 8, padding: '10px 16px', flex: 1 }}>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Total Billed</div>
                <div style={{ fontWeight: 700 }}>₹{Number(student.fees.total || 0).toLocaleString()}</div>
              </div>
              <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '10px 16px', flex: 1 }}>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Paid</div>
                <div style={{ fontWeight: 700, color: '#10b981' }}>₹{Number(student.fees.paid || 0).toLocaleString()}</div>
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer"><button className="btn btn-outline" onClick={onClose}>Close</button></div>
      </div>
    </div>
  );
}

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getStudents({ search });
      setStudents(data.data);
    } catch { toast.error('Failed to load students'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStudents(); }, []);

  const handleSearch = (e) => { e.preventDefault(); fetchStudents(); };

  const viewStudent = async (id) => {
    try {
      const { data } = await adminAPI.getStudent(id);
      setSelected(data.data);
      setShowModal(true);
    } catch { toast.error('Failed to load student details'); }
  };

  const verifyStudent = async (id, verified) => {
    try {
      await adminAPI.verifyStudent(id, { is_verified: verified });
      toast.success(`Student ${verified ? 'verified' : 'unverified'}`);
      fetchStudents();
    } catch { toast.error('Action failed'); }
  };

  const toggleStatus = async (id) => {
    try {
      await adminAPI.toggleStudent(id);
      toast.success('Status updated');
      fetchStudents();
    } catch { toast.error('Action failed'); }
  };

  return (
    <div>
      <Topbar title="Student Management" subtitle={`${students.length} registered students`} />
      <div className="page-content">
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flex: 1 }}>
            <div className="search-bar" style={{ flex: 1 }}>
              <Search size={15} />
              <input placeholder="Search by name, email, or student ID..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary">Search</button>
          </form>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div>
        ) : (
          <div className="card">
            <div className="table-container">
              <table>
                <thead><tr>
                  <th>Student</th>
                  <th>ID</th>
                  <th>Course</th>
                  <th>Room</th>
                  <th>Status</th>
                  <th>Verified</th>
                  <th>Actions</th>
                </tr></thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="avatar">{s.name?.slice(0, 2).toUpperCase()}</div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span style={{ fontFamily: 'monospace', fontSize: 12 }}>{s.student_id}</span></td>
                      <td><div style={{ fontSize: 13 }}>{s.course}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>{s.department}</div></td>
                      <td>{s.room_number ? <span className="badge badge-success">{s.room_number} ({s.block})</span> : <span className="badge badge-secondary">No room</span>}</td>
                      <td><span className={`badge ${s.status === 'active' ? 'badge-success' : 'badge-warning'}`}>{s.status}</span></td>
                      <td>
                        {s.is_verified
                          ? <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}><CheckCircle size={14} /> Verified</span>
                          : <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}><XCircle size={14} /> Pending</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-icon btn-ghost btn-sm" title="View Details" onClick={() => viewStudent(s.id)}><Eye size={14} /></button>
                          <button className="btn btn-icon btn-sm" style={{ background: s.is_verified ? '#fef9c3' : '#dcfce7', color: s.is_verified ? '#854d0e' : '#166534' }}
                            title={s.is_verified ? 'Unverify' : 'Verify'}
                            onClick={() => verifyStudent(s.id, !s.is_verified)}>
                            <ShieldCheck size={14} />
                          </button>
                          <button className="btn btn-sm" style={{ background: s.is_active ? '#fee2e2' : '#dcfce7', color: s.is_active ? '#991b1b' : '#166534', fontSize: 11 }}
                            onClick={() => toggleStatus(s.id)}>
                            {s.is_active ? 'Suspend' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {students.length === 0 && <div className="empty-state"><Users /><h3>No students found</h3></div>}
            </div>
          </div>
        )}
      </div>
      {showModal && <StudentModal student={selected} onClose={() => setShowModal(false)} />}
    </div>
  );
}
