import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCheck, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notificationAPI } from '../utils/api';

// import { useAuth } from '../../context/AuthContext';
// import { notificationAPI } from '../../utils/api';
import { formatDistanceToNow } from 'date-fns';

export default function Topbar({ title, subtitle }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const panelRef = useRef();

  const fetchNotifications = async () => {
    try {
      const { data } = await notificationAPI.getAll();
      if (data.success) {
        setNotifications(data.data);
        setUnread(data.unreadCount);
      }
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) setShowPanel(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setUnread(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {}
  };

  const typeColors = { success: '#10b981', error: '#ef4444', warning: '#f59e0b', info: '#3b82f6' };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="topbar">
      <div className="topbar-left">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>

      <div className="topbar-right" ref={panelRef}>
        <button className="btn btn-icon btn-ghost" onClick={fetchNotifications} title="Refresh">
          <RefreshCw size={16} />
        </button>

        <div style={{ position: 'relative' }}>
          <button className="btn btn-icon btn-ghost" onClick={() => setShowPanel(!showPanel)}>
            <Bell size={18} />
            {unread > 0 && (
              <span style={{
                position: 'absolute', top: 0, right: 0,
                width: 18, height: 18, borderRadius: '50%',
                background: '#ef4444', color: 'white',
                fontSize: 10, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid white'
              }}>{unread > 9 ? '9+' : unread}</span>
            )}
          </button>

          {showPanel && (
            <div style={{
              position: 'absolute', right: 0, top: '110%',
              width: 340, background: 'white',
              borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,.12)',
              border: '1px solid #e2e8f0', zIndex: 100, overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Notifications {unread > 0 && <span style={{ background: '#ef4444', color: 'white', padding: '1px 8px', borderRadius: 10, fontSize: 11, marginLeft: 6 }}>{unread}</span>}</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {unread > 0 && <button className="btn btn-ghost btn-sm" onClick={markAllRead}><CheckCheck size={14} /> All read</button>}
                  <button className="btn btn-icon btn-ghost btn-sm" onClick={() => setShowPanel(false)}><X size={14} /></button>
                </div>
              </div>
              <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                    <Bell size={28} style={{ marginBottom: 8, opacity: .4 }} />
                    <p>No notifications</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #f1f5f9',
                      background: n.is_read ? 'transparent' : '#f8fbff',
                      display: 'flex', gap: 10
                    }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%', marginTop: 5,
                        background: n.is_read ? '#e2e8f0' : (typeColors[n.type] || '#3b82f6'),
                        flexShrink: 0
                      }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a', marginBottom: 2 }}>{n.title}</div>
                        <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>{n.message}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#f0f4f8', borderRadius: 8 }}>
          <div className="avatar" style={{ width: 30, height: 30, fontSize: 11 }}>{initials}</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>{user?.name?.split(' ')[0]}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'capitalize' }}>{user?.role}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
