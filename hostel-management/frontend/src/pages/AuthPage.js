import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Mail, Lock, Phone, AlertCircle, ShieldCheck, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [regForm, setRegForm] = useState({
    name: '', email: '', password: '', phone: '', course: '',
    department: '', year_of_study: 1, gender: 'male', date_of_birth: '',
    father_name: '', mother_name: '', permanent_address: '',
    emergency_contact: '', blood_group: ''
  });
  const [regStep, setRegStep] = useState(1);

  // FIX: Correct role-based navigation covering admin AND warden
  const getDashboardPath = (role) => {
    if (role === 'student') return '/student/dashboard';
    if (role === 'admin' || role === 'warden') return '/admin/dashboard';
    return '/login';
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authAPI.login(loginForm);
      if (!data.success) {
        setError(data.message || 'Login failed');
        return;
      }
      login(data.token, data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate(getDashboardPath(data.user.role));
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (regStep === 1) { setRegStep(2); return; }
    setError('');
    setLoading(true);
    try {
      const { data } = await authAPI.register(regForm);
      if (!data.success) {
        setError(data.message || 'Registration failed');
        return;
      }
      login(data.token, data.user);
      toast.success('Registration successful! Welcome!');
      navigate('/student/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      setRegStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-icon"><Building2 /></div>
          <h1>HostelMS</h1>
          <p>Smart Hostel Management System</p>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setError(''); }}>Sign In</button>
          <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => { setTab('register'); setError(''); setRegStep(1); }}>Register</button>
        </div>

        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: 8, padding: '10px 14px', marginBottom: 16,
            fontSize: 13, color: '#991b1b'
          }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {tab === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input type="email" placeholder="your@email.com" required
                  style={{ paddingLeft: 36 }}
                  value={loginForm.email}
                  onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input type="password" placeholder="••••••••" required
                  style={{ paddingLeft: 36 }}
                  value={loginForm.password}
                  onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg"
              disabled={loading} style={{ marginTop: 8 }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <div style={{ background: '#f0f4f8', borderRadius: 8, padding: '12px 16px', marginTop: 16, fontSize: 12, lineHeight: 1.8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontWeight: 700, color: '#334155' }}>
                <ShieldCheck size={13} /> Demo Credentials
              </div>
              <div><span style={{ background: '#dbeafe', color: '#1e40af', borderRadius: 4, padding: '1px 6px', fontSize: 11, fontWeight: 600, marginRight: 6 }}>ADMIN</span>admin@hostel.com / admin123</div>
              <div><span style={{ background: '#d1fae5', color: '#065f46', borderRadius: 4, padding: '1px 6px', fontSize: 11, fontWeight: 600, marginRight: 6 }}>WARDEN</span>warden@hostel.com / admin123</div>
              <div style={{ color: '#94a3b8', marginTop: 2 }}><span style={{ background: '#fef3c7', color: '#92400e', borderRadius: 4, padding: '1px 6px', fontSize: 11, fontWeight: 600, marginRight: 6 }}>STUDENT</span>Register to create an account</div>
            </div>
          </form>
        )}

        {tab === 'register' && (
          <form onSubmit={handleRegister}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>
                <GraduationCap size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                Step {regStep} of 2
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                <div style={{ width: 32, height: 4, borderRadius: 2, background: '#1e40af' }} />
                <div style={{ width: 32, height: 4, borderRadius: 2, background: regStep === 2 ? '#1e40af' : '#e2e8f0' }} />
              </div>
            </div>

            {regStep === 1 && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input placeholder="John Doe" required value={regForm.name}
                      onChange={e => setRegForm({ ...regForm, name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input placeholder="+91 9876543210" style={{ paddingLeft: 36 }}
                        value={regForm.phone}
                        onChange={e => setRegForm({ ...regForm, phone: e.target.value })} />
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label>Email Address *</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input type="email" placeholder="your@email.com" required style={{ paddingLeft: 36 }}
                      value={regForm.email}
                      onChange={e => setRegForm({ ...regForm, email: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Password *</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input type="password" placeholder="Min 6 characters" required minLength={6} style={{ paddingLeft: 36 }}
                      value={regForm.password}
                      onChange={e => setRegForm({ ...regForm, password: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Course *</label>
                    <input placeholder="B.Tech, MBA..." required value={regForm.course}
                      onChange={e => setRegForm({ ...regForm, course: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Department</label>
                    <input placeholder="Computer Science..." value={regForm.department}
                      onChange={e => setRegForm({ ...regForm, department: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Year of Study</label>
                    <select value={regForm.year_of_study}
                      onChange={e => setRegForm({ ...regForm, year_of_study: e.target.value })}>
                      {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Gender</label>
                    <select value={regForm.gender}
                      onChange={e => setRegForm({ ...regForm, gender: e.target.value })}>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {regStep === 2 && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>Father's Name</label>
                    <input placeholder="Father's full name" value={regForm.father_name}
                      onChange={e => setRegForm({ ...regForm, father_name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Mother's Name</label>
                    <input placeholder="Mother's full name" value={regForm.mother_name}
                      onChange={e => setRegForm({ ...regForm, mother_name: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Date of Birth</label>
                    <input type="date" value={regForm.date_of_birth}
                      onChange={e => setRegForm({ ...regForm, date_of_birth: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Blood Group</label>
                    <select value={regForm.blood_group}
                      onChange={e => setRegForm({ ...regForm, blood_group: e.target.value })}>
                      <option value="">Select</option>
                      {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Permanent Address</label>
                  <textarea placeholder="Full permanent address..." value={regForm.permanent_address}
                    onChange={e => setRegForm({ ...regForm, permanent_address: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Emergency Contact *</label>
                  <input placeholder="Emergency phone number" required value={regForm.emergency_contact}
                    onChange={e => setRegForm({ ...regForm, emergency_contact: e.target.value })} />
                </div>
                <button type="button" className="btn btn-outline btn-sm"
                  onClick={() => setRegStep(1)} style={{ marginBottom: 8 }}>
                  ← Back
                </button>
              </>
            )}

            <button type="submit" className="btn btn-primary btn-block"
              disabled={loading} style={{ marginTop: 8 }}>
              {loading ? 'Processing...' : regStep === 1 ? 'Continue →' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
