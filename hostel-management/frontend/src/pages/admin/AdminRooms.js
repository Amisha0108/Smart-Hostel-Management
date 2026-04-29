import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, BedDouble, Search, Filter, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Topbar from '../../components/Topbar';
import { roomAPI } from '../../utils/api';

const typeColors = { single: 'badge-info', double: 'badge-success', triple: 'badge-warning', dormitory: 'badge-purple' };
const statusColors = { available: 'badge-success', full: 'badge-danger', maintenance: 'badge-warning', reserved: 'badge-secondary' };

function RoomModal({ room, onClose, onSave }) {
  const [form, setForm] = useState(room || { room_number: '', floor: 1, block: 'A', room_type: 'single', capacity: 1, price_per_month: '', amenities: '', status: 'available' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (room) {
        await roomAPI.update(room.id, form);
        toast.success('Room updated successfully');
      } else {
        await roomAPI.create(form);
        toast.success('Room created successfully');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>{room ? 'Edit Room' : 'Add New Room'}</h3>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label>Room Number</label>
                <input placeholder="A101" required value={form.room_number} onChange={e => setForm({ ...form, room_number: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Block</label>
                <select value={form.block} onChange={e => setForm({ ...form, block: e.target.value })}>
                  {['A', 'B', 'C', 'D', 'E'].map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Floor</label>
                <select value={form.floor} onChange={e => setForm({ ...form, floor: e.target.value })}>
                  {[1,2,3,4,5,6].map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Room Type</label>
                <select value={form.room_type} onChange={e => setForm({ ...form, room_type: e.target.value })}>
                  <option value="single">Single</option>
                  <option value="double">Double</option>
                  <option value="triple">Triple</option>
                  <option value="dormitory">Dormitory</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Capacity</label>
                <input type="number" min="1" max="10" required value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Price/Month (₹)</label>
                <input type="number" required value={form.price_per_month} onChange={e => setForm({ ...form, price_per_month: e.target.value })} />
              </div>
            </div>
            {room && (
              <div className="form-group">
                <label>Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="available">Available</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="reserved">Reserved</option>
                </select>
              </div>
            )}
            <div className="form-group">
              <label>Amenities</label>
              <input placeholder="WiFi, AC, Attached Bathroom..." value={form.amenities} onChange={e => setForm({ ...form, amenities: e.target.value })} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Room'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editRoom, setEditRoom] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterType) params.type = filterType;
      const { data } = await roomAPI.getAll(params);
      setRooms(data.data);
    } catch { toast.error('Failed to load rooms'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRooms(); }, [filterStatus, filterType]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this room?')) return;
    try {
      await roomAPI.delete(id);
      toast.success('Room deleted');
      fetchRooms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const filtered = rooms.filter(r =>
    r.room_number.toLowerCase().includes(search.toLowerCase()) ||
    r.block.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Topbar title="Room Management" subtitle={`${rooms.length} rooms total`} />
      <div className="page-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div className="filters-bar" style={{ marginBottom: 0 }}>
            <div className="search-bar" style={{ width: 220 }}>
              <Search size={15} />
              <input placeholder="Search rooms..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13 }}>
              <option value="">All Status</option>
              <option value="available">Available</option>
              <option value="full">Full</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13 }}>
              <option value="">All Types</option>
              <option value="single">Single</option>
              <option value="double">Double</option>
              <option value="triple">Triple</option>
              <option value="dormitory">Dormitory</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={() => { setEditRoom(null); setShowModal(true); }}>
            <Plus size={16} /> Add Room
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Room</th>
                    <th>Block/Floor</th>
                    <th>Type</th>
                    <th>Occupancy</th>
                    <th>Price/Month</th>
                    <th>Amenities</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(room => (
                    <tr key={room.id}>
                      <td><div style={{ fontWeight: 700 }}>{room.room_number}</div></td>
                      <td><span>Block {room.block}, Floor {room.floor}</span></td>
                      <td><span className={`badge ${typeColors[room.room_type] || 'badge-secondary'}`}>{room.room_type}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="progress-bar" style={{ width: 60 }}>
                            <div className="progress-fill" style={{ width: `${(room.occupied / room.capacity) * 100}%`, background: room.occupied >= room.capacity ? '#ef4444' : '#10b981' }} />
                          </div>
                          <span style={{ fontSize: 12, color: '#64748b' }}>{room.occupied}/{room.capacity}</span>
                        </div>
                      </td>
                      <td><span style={{ fontWeight: 600 }}>₹{Number(room.price_per_month).toLocaleString()}</span></td>
                      <td><span style={{ fontSize: 12, color: '#64748b' }}>{room.amenities || '–'}</span></td>
                      <td><span className={`badge ${statusColors[room.status]}`}>{room.status}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-icon btn-ghost btn-sm" onClick={() => { setEditRoom(room); setShowModal(true); }}><Edit2 size={14} /></button>
                          <button className="btn btn-icon btn-ghost btn-sm" style={{ color: '#ef4444' }} onClick={() => handleDelete(room.id)}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && <div className="empty-state"><BedDouble /><h3>No rooms found</h3><p>Try adjusting your filters</p></div>}
            </div>
          </div>
        )}

        {showModal && <RoomModal room={editRoom} onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); fetchRooms(); }} />}
      </div>
    </div>
  );
}
