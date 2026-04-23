import { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, BookOpen, BarChart2, Bell, LifeBuoy,
  UserCircle, Settings, LogOut, ShieldAlert, AlertTriangle,
  CheckCircle, Clock, PlayCircle, Lock, Loader2, Menu, X,
  ChevronRight, Camera, Fingerprint, XCircle, Activity
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';

// ── Device check ──────────────────────────────────────────────────────────
const isMobileOrTablet = () => {
  const ua = navigator.userAgent;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(ua)
    || (navigator.maxTouchPoints > 1 && /MacIntel/.test(ua)); // iPad on iOS 13+
};

// ── Helpers ────────────────────────────────────────────────────────────────
const getExamStatus = (exam) => {
  const now = new Date();
  if (new Date(exam.startTime) > now) return 'upcoming';
  if (new Date(exam.endTime) > now) return 'live';
  return 'completed';
};

const StatusBadge = ({ status }) => {
  const map = {
    upcoming: 'bg-blue-100 text-blue-700',
    live: 'bg-green-100 text-green-700',
    completed: 'bg-gray-100 text-gray-500',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${map[status] || map.completed}`}>
      {status === 'live' && <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 mr-1 animate-pulse" />}
      {status}
    </span>
  );
};

// ── Notifications Tab ─────────────────────────────────────────────────────
const NotificationsTab = ({ notifications, setNotifications }) => {
  const iconMap = { alert: '🔴', success: '🟢', info: '🔵', warning: '🟡' };
  const reversed = [...notifications].reverse();

  const markOne = async (notif) => {
    if (notif.isRead) return;
    // Optimistic update
    setNotifications(p => p.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
    api.put(`/auth/notifications/${notif._id}/read`).catch(() => {});
  };

  const markAll = async () => {
    setNotifications(p => p.map(n => ({ ...n, isRead: true })));
    api.put('/auth/notifications/read-all').catch(() => {});
  };

  const clearAll = async () => {
    setNotifications([]);
    api.delete('/auth/notifications/clear-all').catch(() => {});
  };

  const deleteOne = async (e, notif) => {
    e.stopPropagation();
    setNotifications(p => p.filter(n => n._id !== notif._id));
    api.delete(`/auth/notifications/${notif._id}`).catch(() => {});
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">{notifications.filter(n => !n.isRead).length} unread</p>
        </div>
        {notifications.some(n => !n.isRead) && (
          <button onClick={markAll} className="text-sm font-bold text-blue-600 hover:underline">Mark all read</button>
        )}
        {notifications.length > 0 && (
          <button onClick={clearAll} className="text-sm font-bold text-red-500 hover:underline">Clear all</button>
        )}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {notifications.length === 0 ? (
          <div className="text-center py-16 text-gray-400"><Bell className="h-10 w-10 mx-auto mb-3 text-gray-200" /><p>No notifications yet.</p></div>
        ) : (
          <div className="divide-y divide-gray-50">
            {reversed.map((n) => (
              <div key={n._id} onClick={() => markOne(n)}
                className={`flex items-start gap-4 px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-blue-50/40' : ''}`}>
                <span className="text-lg shrink-0 mt-0.5">{iconMap[n.type] || '🔵'}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${!n.isRead ? 'text-gray-900' : 'text-gray-600'}`}>{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{new Date(n.date).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!n.isRead && <span className="h-2 w-2 bg-blue-500 rounded-full" />}
                  <button onClick={(e) => deleteOne(e, n)}
                    className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove notification">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Support Tab ─────────────────────────────────────────────────────────────
const SupportTab = ({ user }) => {
  const [tickets, setTickets] = useState([]);
  const [loadingT, setLoadingT] = useState(true);
  const [form, setForm] = useState({ subject: '', message: '', category: 'General', examRef: '' });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get(`/tickets/user/${user.id || user._id}`)
      .then(({ data }) => { if (data.success) setTickets(data.data); })
      .catch(console.error)
      .finally(() => setLoadingT(false));
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true); setMsg({ text: '', type: '' });
    try {
      const { data } = await api.post('/tickets', { ...form, userId: user.id || user._id });
      setTickets(p => [data.data, ...p]);
      setForm({ subject: '', message: '', category: 'General', examRef: '' });
      setMsg({ text: 'Ticket submitted!', type: 'success' });
    } catch (err) { setMsg({ text: err.response?.data?.message || 'Failed.', type: 'error' }); }
    finally { setSubmitting(false); }
  };

  const statusColor = { open: 'bg-blue-100 text-blue-700', in_progress: 'bg-yellow-100 text-yellow-700', resolved: 'bg-green-100 text-green-700', closed: 'bg-gray-100 text-gray-500' };

  return (
    <div className="space-y-6 max-w-3xl">
      <div><h1 className="text-2xl font-extrabold text-gray-900">Help & Support</h1><p className="text-sm text-gray-500 mt-0.5">Submit and track your support requests.</p></div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-900 mb-4">Create New Ticket</h2>
        {msg.text && <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>{msg.text}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Category</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50">
                <option>General</option><option>Technical</option><option>Exam Issue</option><option>KYC/Verification</option><option>Grading</option><option>Account</option><option>Bug Report</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Exam Reference <span className="text-gray-400 font-normal">(optional)</span></label>
              <input value={form.examRef} onChange={e => setForm(p => ({ ...p, examRef: e.target.value }))} placeholder="Exam name or ID" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Subject</label>
            <input required value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="Brief description" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Message</label>
            <textarea required rows={4} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Describe your issue in detail..." className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 resize-none" />
          </div>
          <button type="submit" disabled={submitting} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-60">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Ticket'}
          </button>
        </form>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100"><h2 className="font-bold text-gray-900">My Tickets</h2></div>
        {loadingT ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
        : tickets.length === 0 ? <p className="text-center text-gray-400 py-10 text-sm">No tickets yet.</p>
        : <div className="divide-y divide-gray-50">
            {tickets.map(t => (
              <div key={t._id} onClick={() => setSelected(t)} className="flex items-start justify-between px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="min-w-0"><p className="text-sm font-semibold text-gray-900 truncate">{t.subject}</p><p className="text-xs text-gray-400 mt-0.5">{t.category} · {new Date(t.createdAt).toLocaleDateString()}</p></div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ml-3 ${statusColor[t.status]}`}>{t.status.replace('_',' ')}</span>
              </div>
            ))}
          </div>}
      </div>
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div><h2 className="font-extrabold text-gray-900">{selected.subject}</h2><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColor[selected.status]}`}>{selected.status.replace('_',' ')}</span></div>
              <button onClick={() => setSelected(null)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-700">{selected.message}</div>
              {selected.replies?.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Replies</p>
                  {selected.replies.map((r, i) => (
                    <div key={i} className={`p-3 rounded-xl text-sm ${r.from === 'admin' ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50 border border-gray-100'}`}>
                      <p className="text-xs font-bold text-gray-500 mb-1">{r.from === 'admin' ? '🛡 Admin' : '👤 You'} · {new Date(r.date).toLocaleString()}</p>
                      <p className="text-gray-700">{r.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 shrink-0 flex justify-end">
              <button onClick={() => setSelected(null)} className="px-5 py-2 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Profile & KYC Tab ────────────────────────────────────────────────────────
const ProfileTab = ({ user, navigate }) => {
  const kycStatus = user?.kyc?.status;
  const isVerified = kycStatus === 'approved';
  const isPending = kycStatus === 'pending';
  const isRevoked = kycStatus === 'rejected';
  return (
    <div className="space-y-6 max-w-2xl">
      <div><h1 className="text-2xl font-extrabold text-gray-900">Profile & KYC</h1><p className="text-sm text-gray-500 mt-0.5">Your identity verification and account details.</p></div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-5">
          {user?.kyc?.faceImage ? (
            <img src={user.kyc.faceImage} alt="Profile" className="h-16 w-16 rounded-full object-cover border-2 border-gray-200 scale-x-[-1]" />
          ) : (
            <div className="h-16 w-16 rounded-full bg-blue-600 text-white flex items-center justify-center font-extrabold text-2xl">{user?.name?.[0]?.toUpperCase()}</div>
          )}
          <div>
            <p className="font-extrabold text-gray-900 text-lg">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full capitalize">{user?.role}</span>
          </div>
        </div>
      </div>
      <div className={`bg-white rounded-2xl border-2 shadow-sm p-6 ${isVerified ? 'border-green-200' : isPending ? 'border-yellow-200' : 'border-red-200'}`}>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl shrink-0 ${isVerified ? 'bg-green-50' : isPending ? 'bg-yellow-50' : 'bg-red-50'}`}>
            {isVerified ? <CheckCircle className="h-6 w-6 text-green-600" /> : isPending ? <Clock className="h-6 w-6 text-yellow-600" /> : <ShieldAlert className="h-6 w-6 text-red-600" />}
          </div>
          <div className="flex-1">
            <p className={`font-bold text-base ${isVerified ? 'text-green-700' : isPending ? 'text-yellow-700' : 'text-red-700'}`}>
              {isVerified ? 'Identity Verified' : isPending ? 'Verification Pending' : isRevoked ? 'Verification Revoked' : 'Not Verified'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {isVerified ? 'Your identity has been verified. You can access all exams.'
               : isPending ? 'Your documents are under review by an administrator.'
               : isRevoked ? 'Your verification was revoked. Please re-submit your documents.'
               : 'Complete identity verification to access exams.'}
            </p>
            {!isVerified && !isPending && (
              <button onClick={() => navigate('/kyc')} className="mt-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors">
                <Camera className="h-4 w-4" />{isRevoked ? 'Re-submit Verification' : 'Start Verification'}
              </button>
            )}
          </div>
        </div>
        {isVerified && user?.kyc?.verifiedAt && (
          <p className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-100">Verified on {new Date(user.kyc.verifiedAt).toLocaleDateString()}</p>
        )}
      </div>
    </div>
  );
};

// ── Settings Tab ─────────────────────────────────────────────────────────────
const SettingsTab = ({ user }) => {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) return setMsg({ text: 'Passwords do not match.', type: 'error' });
    if (form.newPassword.length < 8) return setMsg({ text: 'Min 8 characters.', type: 'error' });
    setSaving(true); setMsg({ text: '', type: '' });
    try {
      const { data } = await api.put('/auth/update-password', { userId: user.id || user._id, currentPassword: form.currentPassword, newPassword: form.newPassword });
      setMsg({ text: data.message, type: 'success' });
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { setMsg({ text: err.response?.data?.message || 'Update failed.', type: 'error' }); }
    finally { setSaving(false); }
  };
  return (
    <div className="space-y-6 max-w-xl">
      <div><h1 className="text-2xl font-extrabold text-gray-900">Account Settings</h1><p className="text-sm text-gray-500 mt-0.5">Manage your account security.</p></div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-900 mb-4">Change Password</h2>
        {msg.text && <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>{msg.text}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {[['currentPassword','Current Password'],['newPassword','New Password'],['confirmPassword','Confirm New Password']].map(([field,label]) => (
            <div key={field}>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">{label}</label>
              <input type="password" required value={form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white" />
            </div>
          ))}
          <button type="submit" disabled={saving} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ── Exams Tab ─────────────────────────────────────────────────────────────
const ExamsTab = ({ user, exams, results, loading, navigate, isMobile }) => {
  const isKycVerified = user?.kyc?.status === 'approved';
  const [selectedExam, setSelectedExam] = useState(null);
  const submittedExamIds = new Set(results.map(r => r.examId?._id || r.examId));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">My Exams</h1>
        <p className="text-sm text-gray-500 mt-0.5">All available assessments assigned to you.</p>
      </div>

      {isMobile && (
        <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-2xl">
          <ShieldAlert className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-orange-800">Desktop Required to Start Exams</p>
            <p className="text-xs text-orange-600 mt-0.5">Anti-cheat features (fullscreen lock, webcam, tab detection) require a desktop or laptop. You can browse your exams but cannot start them on this device.</p>
          </div>
        </div>
      )}

      {!isKycVerified && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <ShieldAlert className="h-5 w-5 text-red-600 shrink-0" />
          <p className="text-sm text-red-700 font-medium">Your KYC is not verified. Exams are locked until identity verification is complete.</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
      ) : exams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 text-center">
          <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No exams available right now.</p>
        </div>
      ) : (
        <>
        {/* Mobile card list */}
        <div className="sm:hidden space-y-3">
          {exams.map(exam => {
            const status = getExamStatus(exam);
            const canStart = isKycVerified && status === 'live' && !isMobile;
            return (
              <div key={exam._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{exam.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{exam.courseCode} · <Clock className="h-3 w-3 inline" /> {exam.durationMinutes}m</p>
                  </div>
                  <StatusBadge status={status} />
                </div>
                <p className="text-xs text-gray-400">{new Date(exam.startTime).toLocaleString()}</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSelectedExam(exam)}
                    className="text-xs font-bold text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 transition-colors">
                    Details
                  </button>
                  {submittedExamIds.has(exam._id) ? (
                    <span className="text-xs text-green-600 font-bold flex items-center gap-1 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200">
                      <CheckCircle className="h-3.5 w-3.5" /> Submitted
                    </span>
                  ) : canStart ? (
                    <button onClick={() => navigate(`/exam?id=${exam._id}`)}
                      className="text-xs font-bold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                      <PlayCircle className="h-3.5 w-3.5" /> Start
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400 flex items-center gap-1 px-3 py-1.5">
                      <Lock className="h-3.5 w-3.5" />
                      {isMobile ? 'Desktop Only' : !isKycVerified ? 'KYC Required' : status === 'upcoming' ? 'Not Started' : 'Ended'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {/* Desktop table */}
        <div className="hidden sm:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{['Exam', 'Course', 'Duration', 'Starts', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {exams.map(exam => {
                  const status = getExamStatus(exam);
                  const canStart = isKycVerified && status === 'live' && !isMobile;
                  return (
                    <tr key={exam._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900">{exam.title}</p>
                        {exam.description && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{exam.description}</p>}
                      </td>
                      <td className="px-5 py-4 text-gray-500">{exam.courseCode}</td>
                      <td className="px-5 py-4 text-gray-500 flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{exam.durationMinutes}m</td>
                      <td className="px-5 py-4 text-gray-500 text-xs">{new Date(exam.startTime).toLocaleString()}</td>
                      <td className="px-5 py-4"><StatusBadge status={status} /></td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setSelectedExam(exam)}
                            className="text-xs font-bold text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 transition-colors">
                            Details
                          </button>
                          {submittedExamIds.has(exam._id) ? (
                            <span className="text-xs text-green-600 font-bold flex items-center gap-1 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200">
                              <CheckCircle className="h-3.5 w-3.5" /> Submitted
                            </span>
                          ) : canStart ? (
                            <button onClick={() => navigate(`/exam?id=${exam._id}`)}
                              className="text-xs font-bold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                              <PlayCircle className="h-3.5 w-3.5" /> Start
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400 flex items-center gap-1 px-3 py-1.5">
                              <Lock className="h-3.5 w-3.5" />
                              {isMobile ? 'Desktop Only' : !isKycVerified ? 'KYC Required' : status === 'upcoming' ? 'Not Started' : 'Ended'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}

      {/* Exam Details Modal */}
      {selectedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-extrabold text-gray-900">{selectedExam.title}</h2>
              <button onClick={() => setSelectedExam(null)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {selectedExam.description && (
                <p className="text-sm text-gray-600">{selectedExam.description}</p>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-400 mb-1">Course</p>
                  <p className="font-bold text-gray-900">{selectedExam.courseCode}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-400 mb-1">Duration</p>
                  <p className="font-bold text-gray-900">{selectedExam.durationMinutes} minutes</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-400 mb-1">Start Time</p>
                  <p className="font-bold text-gray-900 text-xs">{new Date(selectedExam.startTime).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-400 mb-1">End Time</p>
                  <p className="font-bold text-gray-900 text-xs">{new Date(selectedExam.endTime).toLocaleString()}</p>
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-xs font-bold text-blue-700 mb-2">Anti-Cheat Rules</p>
                <ul className="text-xs text-blue-600 space-y-1">
                  {selectedExam.securitySettings?.requireWebcam && <li>• Webcam required throughout exam</li>}
                  {selectedExam.securitySettings?.strictBrowserLock && <li>• Tab switching & copy-paste blocked</li>}
                  <li>• {selectedExam.securitySettings?.toleranceLimit || 3} violations allowed before termination</li>
                  {selectedExam.negativeMarking && <li>• Negative marking enabled</li>}
                </ul>
              </div>
            </div>
            <div className="px-6 pb-6 flex justify-end gap-3">
              <button onClick={() => setSelectedExam(null)} className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl">Close</button>
              {isKycVerified && getExamStatus(selectedExam) === 'live' && !isMobile && !submittedExamIds.has(selectedExam._id) && (
                <button onClick={() => navigate(`/exam?id=${selectedExam._id}`)} className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700">
                  <PlayCircle className="h-4 w-4" /> Start Exam
                </button>
              )}
              {submittedExamIds.has(selectedExam._id) && (
                <span className="flex items-center gap-2 px-5 py-2 bg-green-50 text-green-700 text-sm font-bold rounded-xl border border-green-200">
                  <CheckCircle className="h-4 w-4" /> Already Submitted
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Results Tab ────────────────────────────────────────────────────────────
const ResultsTab = ({ results, loading }) => {
  const [selected, setSelected] = useState(null);

  const statusBadge = (status) => {
    if (status === 'passed') return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">✓ Passed</span>;
    if (status === 'failed') return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">✗ Failed</span>;
    if (status === 'terminated_for_cheating') return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">⚠ Disqualified</span>;
    if (status === 'pending_review') return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 flex items-center gap-1 w-fit"><Clock className="h-3 w-3" />Under Review</span>;
    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Results & History</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your exam transcript and performance records.</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-blue-600" /></div>
        ) : results.length === 0 ? (
          <div className="text-center py-16 text-gray-400"><BarChart2 className="h-10 w-10 mx-auto mb-3 text-gray-200" /><p>No results yet.</p></div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-gray-50">
              {results.map(r => (
                <div key={r._id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{r.examId?.title || 'Unknown'}</p>
                      <p className="text-xs text-gray-400">{r.examId?.courseCode}</p>
                    </div>
                    {statusBadge(r.status)}
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-bold text-gray-900">
                      {r.status === 'pending_review' ? <span className="text-gray-400">—</span> : `${r.score}/${r.totalMarks}`}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      r.trustScore >= 80 ? 'bg-green-100 text-green-700' :
                      r.trustScore >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>{r.trustScore}%</span>
                    <span className="text-xs text-gray-400 ml-auto">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  {r.status !== 'pending_review' && (
                    <button onClick={() => setSelected(r)} className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">View Details</button>
                  )}
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>{['Exam', 'Score', 'Trust Score', 'Status', 'Date', ''].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {results.map(r => (
                    <tr key={r._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900">{r.examId?.title || 'Unknown'}</p>
                        <p className="text-xs text-gray-400">{r.examId?.courseCode}</p>
                      </td>
                      <td className="px-5 py-4 font-bold text-gray-900">
                        {r.status === 'pending_review' ? <span className="text-gray-400">—</span> : `${r.score}/${r.totalMarks}`}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          r.trustScore >= 80 ? 'bg-green-100 text-green-700' :
                          r.trustScore >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                        }`}>{r.trustScore}%</span>
                      </td>
                      <td className="px-5 py-4">{statusBadge(r.status)}</td>
                      <td className="px-5 py-4 text-gray-400 text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-4">
                        {r.status !== 'pending_review' && (
                          <button onClick={() => setSelected(r)} className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">View Details</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Detailed Result Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="font-extrabold text-gray-900">{selected.examId?.title}</h2>
                <p className="text-xs text-gray-400">{selected.examId?.courseCode}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full"><X className="h-4 w-4" /></button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 bg-gray-50 rounded-xl text-center">
                  <p className="text-xs text-gray-400 mb-1">Score</p>
                  <p className="text-2xl font-extrabold text-gray-900">{selected.score}/{selected.totalMarks}</p>
                  <p className="text-xs text-gray-500">{Math.round((selected.score/selected.totalMarks)*100)}%</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl text-center">
                  <p className="text-xs text-gray-400 mb-1">Trust Score</p>
                  <p className={`text-2xl font-extrabold ${
                    selected.trustScore >= 80 ? 'text-green-600' : selected.trustScore >= 50 ? 'text-yellow-600' : 'text-red-600'
                  }`}>{selected.trustScore}%</p>
                  {selected.trustScore < 50 && <p className="text-xs text-red-500">⚠ Low integrity</p>}
                </div>
                <div className="p-4 bg-gray-50 rounded-xl text-center">
                  <p className="text-xs text-gray-400 mb-1">Status</p>
                  <div className="flex justify-center mt-1">{statusBadge(selected.status)}</div>
                </div>
              </div>

              {/* Question-wise breakdown */}
              {selected.examId?.questions?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Question Breakdown</p>
                  <div className="space-y-3">
                    {selected.examId.questions.map((q, i) => {
                      const ans = selected.answers?.[i];
                      const manualMark = selected.manualGrades?.[i];
                      const comment = selected.comments?.[i];
                      const optLabels = ['A','B','C','D','E','F'];
                      // Compute awarded marks correctly
                      let awarded = null;
                      if (manualMark !== undefined && manualMark !== '' && manualMark !== null) {
                        awarded = Number(manualMark);
                      } else if (q.type === 'mcq') {
                        awarded = ans === q.correctOptionIndex ? q.marks : (ans !== undefined && ans !== null ? 0 : null);
                      } else if (q.type === 'multiple_correct') {
                        const correctSet = new Set(q.correctOptionIndices || []);
                        const givenArr = Array.isArray(ans) ? ans : [];
                        if (givenArr.length > 0) {
                          const perMark = q.marks / (correctSet.size || 1);
                          let partial = 0;
                          givenArr.forEach(a => { if (correctSet.has(a)) partial += perMark; else partial -= perMark; });
                          awarded = Math.round(Math.max(0, Math.min(partial, q.marks)) * 100) / 100;
                        }
                      }
                      return (
                        <div key={i} className="p-4 border border-gray-200 rounded-xl">
                          <div className="flex items-start justify-between mb-3">
                            <p className="text-sm font-semibold text-gray-800 flex-1 pr-4">Q{i+1}: {q.questionText}</p>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {awarded !== null ? (
                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                  awarded === q.marks ? 'bg-green-100 text-green-700' : awarded === 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                }`}>{awarded}/{q.marks}</span>
                              ) : q.type === 'short_answer' ? (
                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-600">Pending</span>
                              ) : null}
                            </div>
                          </div>

                          {/* MCQ / Multiple correct: show all options with highlights */}
                          {(q.type === 'mcq' || q.type === 'multiple_correct') && q.options?.length > 0 && (
                            <div className="space-y-1.5 mb-2">
                              {q.options.map((opt, oi) => {
                                const isCorrectOpt = q.type === 'mcq' ? oi === q.correctOptionIndex : (q.correctOptionIndices || []).includes(oi);
                                const isStudentPick = q.type === 'mcq' ? ans === oi : (Array.isArray(ans) && ans.includes(oi));
                                let rowClass = 'border-gray-100 bg-white text-gray-600';
                                if (isCorrectOpt && isStudentPick) rowClass = 'border-green-300 bg-green-50 text-green-800';
                                else if (isCorrectOpt) rowClass = 'border-green-200 bg-green-50/60 text-green-700';
                                else if (isStudentPick) rowClass = 'border-red-200 bg-red-50 text-red-700';
                                return (
                                  <div key={oi} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${rowClass}`}>
                                    <span className="font-bold w-4 shrink-0">{optLabels[oi]}.</span>
                                    <span className="flex-1">{opt}</span>
                                    {isStudentPick && <span className="font-bold text-blue-600 shrink-0">Your answer</span>}
                                    {isCorrectOpt && <span className="font-bold text-green-700 shrink-0">✓ Correct</span>}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Short answer: show student text */}
                          {q.type === 'short_answer' && (
                            <div className="mb-2">
                              <p className="text-xs text-gray-500 mb-1">Your answer:</p>
                              <p className="text-sm text-gray-800 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                                {ans || <span className="italic text-gray-400">Not answered</span>}
                              </p>
                            </div>
                          )}

                          {/* Teacher comment */}
                          {comment && (
                            <p className="text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 mt-2">
                              💬 Teacher: {comment}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Violations */}
              {selected.violations?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Security Events ({selected.violations.length})</p>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {selected.violations.map((v, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg text-xs">
                        <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                        <span className="text-red-700">{v.reason}</span>
                        <span className="text-red-400 ml-auto">{new Date(v.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 shrink-0 flex justify-end">
              <button onClick={() => setSelected(null)} className="px-5 py-2 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Dashboard Home Tab ─────────────────────────────────────────────────────
const DashboardHome = ({ user, exams, results, loading, onNavigate, isMobile }) => {
  const isKycVerified = user?.kyc?.status === 'approved';
  const upcoming = exams.filter(e => getExamStatus(e) === 'upcoming');
  const live = exams.filter(e => getExamStatus(e) === 'live');
  const submittedExamIds = new Set(results.map(r => r.examId?._id || r.examId));
  const avgScore = results.length
    ? Math.round(results.reduce((a, r) => a + (r.score / (r.totalMarks || 1)) * 100, 0) / results.length)
    : null;

  // Exams starting within 10 minutes
  const imminentExams = exams.filter(e => {
    const diff = new Date(e.startTime) - new Date();
    return diff > 0 && diff <= 10 * 60 * 1000;
  });

  const stats = [
    { label: 'Upcoming Exams', value: upcoming.length, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Live Now', value: live.length, icon: Activity, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Completed', value: results.length, icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Avg Score', value: avgScore !== null ? `${avgScore}%` : '—', icon: BarChart2, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-sm text-gray-500 mt-1">Here's your exam overview for today.</p>
      </div>

      {/* KYC Warning Banner */}
      {!isKycVerified && (
        <div className={`flex items-start gap-4 p-4 rounded-2xl border ${user?.kyc?.status === 'pending' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
          <ShieldAlert className={`h-5 w-5 shrink-0 mt-0.5 ${user?.kyc?.status === 'pending' ? 'text-yellow-600' : 'text-red-600'}`} />
          <div className="flex-1">
            <p className={`text-sm font-bold ${user?.kyc?.status === 'pending' ? 'text-yellow-800' : 'text-red-800'}`}>
              {user?.kyc?.status === 'pending' ? 'KYC Pending Admin Review' : user?.kyc?.status === 'rejected' ? 'KYC Revoked — Re-verification Required' : 'KYC Not Completed'}
            </p>
            <p className="text-xs text-gray-600 mt-0.5">Exams are locked until your identity is verified.</p>
          </div>
          {user?.kyc?.status !== 'pending' && (
            <button onClick={() => onNavigate('profile')} className="text-xs font-bold text-red-600 hover:underline shrink-0">Verify Now →</button>
          )}
        </div>
      )}

      {/* Imminent Exam Alerts */}
      {imminentExams.map(exam => (
        <div key={exam._id} className="flex items-center gap-4 p-4 rounded-2xl border bg-orange-50 border-orange-200 animate-pulse">
          <Clock className="h-5 w-5 text-orange-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-orange-800">
              ⏰ "{exam.title}" starts in {Math.ceil((new Date(exam.startTime) - new Date()) / 60000)} minute(s)!
            </p>
            <p className="text-xs text-orange-600 mt-0.5">Make sure your webcam and browser are ready.</p>
          </div>
          {isKycVerified && !isMobile && (
            <button onClick={() => onNavigate('exams')} className="text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 px-3 py-1.5 rounded-lg shrink-0 transition-colors">
              Go to Exam
            </button>
          )}
        </div>
      ))}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className={`h-10 w-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <p className="text-2xl font-extrabold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upcoming Exams */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" /> Upcoming Exams
          </h2>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
          ) : [...upcoming, ...live].length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No upcoming exams scheduled.</p>
          ) : (
            <div className="space-y-3">
              {[...live, ...upcoming].slice(0, 4).map(exam => (
                <div key={exam._id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{exam.title}</p>
                    <p className="text-xs text-gray-400">{exam.courseCode} · {exam.durationMinutes}m</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <StatusBadge status={getExamStatus(exam)} />
                    {isKycVerified && getExamStatus(exam) === 'live' && !submittedExamIds.has(exam._id) && (
                      <button onClick={() => onNavigate('exams')} className="text-xs font-bold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition-colors">
                        Start
                      </button>
                    )}
                    {submittedExamIds.has(exam._id) && (
                      <span className="text-xs text-green-600 font-bold">✓ Done</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button onClick={() => onNavigate('exams')} className="w-full flex items-center gap-3 p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm">
              <BookOpen className="h-4 w-4" /> My Exams
            </button>
            <button onClick={() => onNavigate('results')} className="w-full flex items-center gap-3 p-3 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-medium text-sm border border-gray-200">
              <BarChart2 className="h-4 w-4" /> View Results
            </button>
            <button onClick={() => onNavigate('notifications')} className="w-full flex items-center gap-3 p-3 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-medium text-sm border border-gray-200">
              <Bell className="h-4 w-4" /> Notifications
            </button>
            <button onClick={() => onNavigate('profile')} className="w-full flex items-center gap-3 p-3 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-medium text-sm border border-gray-200">
              <UserCircle className="h-4 w-4" /> Profile & KYC
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────
const VALID_TABS = ['dashboard', 'exams', 'results', 'notifications', 'support', 'profile', 'settings'];

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const tabFromUrl = searchParams.get('tab');
  const activeTab = VALID_TABS.includes(tabFromUrl) ? tabFromUrl : 'dashboard';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) return navigate('/');
    const parsed = JSON.parse(stored);
    if (parsed.role !== 'student') return navigate('/');
    setUser(parsed);
    setNotifications(parsed.notifications || []);
    // Fetch fresh notifications from DB
    api.get('/auth/me').then(({ data }) => {
      if (data.success) {
        setNotifications(data.user.notifications || []);
        // Update localStorage with fresh data
        const updated = { ...parsed, notifications: data.user.notifications || [], kyc: data.user.kyc };
        localStorage.setItem('user', JSON.stringify(updated));
        setUser(updated);
      }
    }).catch(() => {});
    Promise.all([fetchExams(), fetchResults()]).finally(() => setLoading(false));
  }, [navigate]);

  const fetchExams = async () => {
    try {
      const stored = localStorage.getItem('user');
      const uid = stored ? JSON.parse(stored).id || JSON.parse(stored)._id : null;
      const { data } = await api.get(`/exams${uid ? `?studentId=${uid}` : ''}`);
      if (data.success) setExams(data.data);
    } catch (e) { console.error(e); }
  };

  const fetchResults = async () => {
    try {
      const { data } = await api.get('/results/student');
      if (data.success) setResults(data.data);
    } catch (e) { setResults([]); }
  };

  const setActiveTab = (tab) => {
    setSearchParams(tab === 'dashboard' ? {} : { tab }, { replace: false });
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/', { replace: true });
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'exams', label: 'My Exams', icon: BookOpen },
    { id: 'results', label: 'Results', icon: BarChart2 },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { id: 'support', label: 'Support', icon: LifeBuoy },
    { id: 'profile', label: 'Profile & KYC', icon: UserCircle },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const tabTitles = {
    dashboard: `Welcome, ${user?.name?.split(' ')[0] || ''}`,
    exams: 'My Exams',
    results: 'Results & History',
    notifications: 'Notifications',
    support: 'Help & Support',
    profile: 'Profile & KYC',
    settings: 'Account Settings',
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 text-white flex flex-col transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="h-16 flex items-center px-6 border-b border-gray-800 shrink-0">
          <ShieldAlert className="h-6 w-6 text-blue-400 mr-2 shrink-0" />
          <span className="font-extrabold text-white tracking-tight text-sm leading-tight">Automatic Proctoring System</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 mb-3 mt-2">Menu</p>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors
                ${activeTab === item.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge > 0 && (
                <span className="h-5 w-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400 hover:bg-red-500/10 rounded-xl font-medium text-sm transition-colors">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center px-4 sm:px-6 gap-4 sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-xl">
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="font-extrabold text-gray-900 text-lg truncate">{tabTitles[activeTab]}</h1>
          <div className="ml-auto flex items-center gap-3">
            {/* Bell Dropdown */}
            {(() => {
              const BellDropdown = () => {
                const [open, setOpen] = useState(false);
                const ref = useRef(null);
                useEffect(() => {
                  const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
                  document.addEventListener('mousedown', handler);
                  return () => document.removeEventListener('mousedown', handler);
                }, []);
                const markOne = (n) => {
                  if (n.isRead) return;
                  setNotifications(p => p.map(x => x._id === n._id ? { ...x, isRead: true } : x));
                  api.put(`/auth/notifications/${n._id}/read`).catch(() => {});
                };
                const markAll = () => {
                  setNotifications(p => p.map(n => ({ ...n, isRead: true })));
                  api.put('/auth/notifications/read-all').catch(() => {});
                };
                const clearAll = () => {
                  setNotifications([]);
                  api.delete('/auth/notifications/clear-all').catch(() => {});
                };
                const deleteOne = (e, n) => {
                  e.stopPropagation();
                  setNotifications(p => p.filter(x => x._id !== n._id));
                  api.delete(`/auth/notifications/${n._id}`).catch(() => {});
                };
                const iconMap = { alert: '🔴', success: '🟢', info: '🔵', warning: '🟡' };
                return (
                  <div className="relative" ref={ref}>
                    <button onClick={() => setOpen(p => !p)}
                      className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                    {open && (
                      <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                          <span className="font-bold text-gray-900 text-sm">Notifications</span>
                          <div className="flex items-center gap-3">
                            {unreadCount > 0 && <button onClick={markAll} className="text-xs text-blue-600 hover:underline">Mark all read</button>}
                            {notifications.length > 0 && <button onClick={clearAll} className="text-xs text-red-500 hover:underline">Clear all</button>}
                          </div>
                        </div>
                        <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                          {notifications.length === 0 && <p className="text-center text-gray-400 text-xs py-6">No notifications.</p>}
                          {[...notifications].reverse().map(n => (
                            <div key={n._id} onClick={() => markOne(n)}
                              className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors flex items-start gap-3 ${!n.isRead ? 'bg-blue-50/50' : ''}`}>
                              <span className="text-base shrink-0">{iconMap[n.type] || '🔵'}</span>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold ${!n.isRead ? 'text-gray-900' : 'text-gray-600'}`}>{n.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{n.message}</p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {!n.isRead && <span className="h-2 w-2 bg-blue-500 rounded-full" />}
                                <button onClick={(e) => deleteOne(e, n)}
                                  className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              };
              return <BellDropdown key="bell" />;
            })()}
            {/* Profile */}
            <button onClick={() => setActiveTab('profile')} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors">
              {user?.kyc?.faceImage ? (
                <img src={user.kyc.faceImage} alt="Profile" className="h-8 w-8 rounded-full object-cover border-2 border-gray-200 scale-x-[-1]" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
              )}
              <span className="text-sm font-semibold text-gray-700 hidden sm:block">{user?.name}</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardHome user={user} exams={exams} results={results} loading={loading} onNavigate={setActiveTab} isMobile={isMobileOrTablet()} />
            )}
            {activeTab === 'exams' && <ExamsTab user={user} exams={exams} results={results} loading={loading} navigate={navigate} isMobile={isMobileOrTablet()} />}
            {activeTab === 'results' && <ResultsTab results={results} loading={loading} />}
            {activeTab === 'notifications' && <NotificationsTab notifications={notifications} setNotifications={setNotifications} />}
            {activeTab === 'support' && <SupportTab user={user} />}
            {activeTab === 'profile' && <ProfileTab user={user} navigate={navigate} />}
            {activeTab === 'settings' && <SettingsTab user={user} />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
