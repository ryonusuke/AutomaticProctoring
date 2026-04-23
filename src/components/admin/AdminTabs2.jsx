import { useState } from 'react';
import {
  Search, Loader2, CheckCircle2, AlertTriangle, ShieldAlert,
  Clock, X, Send, BookOpen, BarChart2, MessageSquare
} from 'lucide-react';
import api from '../../services/api';

const getExamStatus = (exam) => {
  const now = new Date();
  if (new Date(exam.startTime) > now) return 'upcoming';
  if (new Date(exam.endTime) > now) return 'live';
  return 'completed';
};

const StatusBadge = ({ status }) => {
  const map = { upcoming: 'bg-blue-100 text-blue-700', live: 'bg-green-100 text-green-700', completed: 'bg-gray-100 text-gray-500' };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${map[status] || map.completed}`}>
      {status === 'live' && <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 mr-1 animate-pulse" />}
      {status}
    </span>
  );
};

export const ExamsTab = ({ exams }) => {
  const [search, setSearch] = useState('');
  const filtered = exams.filter(e =>
    e.title?.toLowerCase().includes(search.toLowerCase()) ||
    e.courseCode?.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">All Exams</h1>
          <p className="text-sm text-gray-500 mt-0.5">{exams.length} exams across all examiners</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search exams..."
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 w-56" />
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Title', 'Course', 'Duration', 'Start Time', 'Status', 'Questions', 'Security'].map(h => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-400">No exams found.</td></tr>
              ) : filtered.map(e => (
                <tr key={e._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 font-semibold text-gray-900">{e.title}</td>
                  <td className="px-5 py-4 text-gray-500">{e.courseCode}</td>
                  <td className="px-5 py-4 text-gray-500 flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{e.durationMinutes}m</td>
                  <td className="px-5 py-4 text-xs text-gray-500">{new Date(e.startTime).toLocaleString()}</td>
                  <td className="px-5 py-4"><StatusBadge status={getExamStatus(e)} /></td>
                  <td className="px-5 py-4 text-gray-500">{e.questions?.length ?? '—'}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1 flex-wrap">
                      {e.securitySettings?.requireWebcam && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold">Webcam</span>}
                      {e.securitySettings?.strictBrowserLock && <span className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded font-bold">Lock</span>}
                      {e.negativeMarking && <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-bold">-ve</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const ResultsTab = ({ results }) => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const filtered = results.filter(r =>
    r.studentId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.examId?.title?.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">All Results</h1>
          <p className="text-sm text-gray-500 mt-0.5">{results.length} total submissions</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 w-56" />
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Student', 'Exam', 'Score', 'Trust', 'Violations', 'Status', 'Date', 'Detail'].map(h => (
                <th key={h} className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-gray-400">No results found.</td></tr>
              ) : filtered.map(r => (
                <tr key={r._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900 text-xs">{r.studentId?.name || 'Unknown'}</p>
                    <p className="text-[10px] text-gray-400">{r.studentId?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700">{r.examId?.title}</td>
                  <td className="px-4 py-3 font-bold text-gray-900 text-xs">{r.score}/{r.totalMarks}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${r.trustScore >= 80 ? 'bg-green-100 text-green-700' : r.trustScore >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {r.trustScore}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{r.violations?.length || 0}</td>
                  <td className="px-4 py-3">
                    {r.status === 'passed' && <span className="text-green-600 text-xs font-bold">✓ Passed</span>}
                    {r.status === 'failed' && <span className="text-yellow-600 text-xs font-bold">✗ Failed</span>}
                    {r.status === 'terminated_for_cheating' && <span className="text-red-600 text-xs font-bold">⚠ Disqualified</span>}
                  </td>
                  <td className="px-4 py-3 text-[10px] text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelected(r)} className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h2 className="font-extrabold text-gray-900">{selected.examId?.title} — {selected.studentId?.name}</h2>
              <button onClick={() => setSelected(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xs text-gray-400">Score</p><p className="font-extrabold text-gray-900">{selected.score}/{selected.totalMarks}</p></div>
                <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xs text-gray-400">Trust</p><p className={`font-extrabold ${selected.trustScore >= 80 ? 'text-green-600' : 'text-red-600'}`}>{selected.trustScore}%</p></div>
                <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xs text-gray-400">Time</p><p className="font-extrabold text-gray-900">{selected.timeTaken ? `${Math.floor(selected.timeTaken / 60)}m` : '—'}</p></div>
              </div>
              {selected.violations?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Violations ({selected.violations.length})</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selected.violations.map((v, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 bg-red-50 rounded-lg border border-red-100 text-xs">
                        <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                        <div><p className="font-medium text-red-800">{v.reason}</p><p className="text-red-400">{new Date(v.timestamp).toLocaleTimeString()}</p></div>
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

export const TicketsTab = ({ tickets, onRefresh }) => {
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState('open');
  const [roleFilter, setRoleFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const filtered = tickets.filter(t =>
    (filter === 'all' ? true : t.status === filter) &&
    (roleFilter === 'all' ? true : t.userRole === roleFilter) &&
    (priorityFilter === 'all' ? true : t.priority === priorityFilter)
  );

  const statusColor = { open: 'bg-blue-100 text-blue-700', in_progress: 'bg-yellow-100 text-yellow-700', resolved: 'bg-green-100 text-green-700', closed: 'bg-gray-100 text-gray-500' };
  const priorityColor = { low: 'bg-gray-100 text-gray-600', medium: 'bg-blue-100 text-blue-600', high: 'bg-orange-100 text-orange-600', urgent: 'bg-red-100 text-red-600' };

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const { data } = await api.put(`/tickets/${selected._id}/reply`, { from: 'admin', message: reply });
      setReply('');
      setSelected(data.data);
      onRefresh();
    } catch { alert('Failed to send reply.'); }
    finally { setSending(false); }
  };

  const updateStatus = async (status) => {
    try {
      const { data } = await api.put(`/tickets/${selected._id}/status`, { status });
      setSelected(data.data);
      onRefresh();
    } catch { alert('Failed to update status.'); }
  };

  const senderName = (t) => t.userId?.name || t.studentId?.name || 'Unknown';
  const senderRole = (t) => t.userRole || 'student';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Support Tickets</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {tickets.filter(t => t.status === 'open').length} open ·
            {' '}{tickets.filter(t => t.userRole === 'examiner').length} from teachers ·
            {' '}{tickets.filter(t => t.priority === 'urgent' || t.priority === 'high').length} high priority
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex flex-wrap gap-1">
            {['all', 'student', 'examiner'].map(r => (
              <button key={r} onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${
                  roleFilter === r ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}>{r === 'examiner' ? 'Teachers' : r === 'student' ? 'Students' : 'All Roles'}</button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {['all', 'urgent', 'high', 'medium', 'low'].map(p => (
              <button key={p} onClick={() => setPriorityFilter(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${
                  priorityFilter === p ? 'bg-orange-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}>{p === 'all' ? 'All Priority' : p}</button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {['open', 'in_progress', 'resolved', 'closed', 'all'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${
                  filter === f ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}>{f === 'all' ? 'All Status' : f.replace('_', ' ')}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-50">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-10 text-sm">No tickets found.</p>
          ) : filtered.map(t => (
            <div key={t._id} onClick={() => setSelected(t)} className="flex items-start justify-between px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{t.subject}</p>
                  {t.priority && t.priority !== 'medium' && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded capitalize shrink-0 ${priorityColor[t.priority]}`}>{t.priority}</span>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  <span className={`font-bold mr-1 ${senderRole(t) === 'examiner' ? 'text-purple-600' : 'text-blue-600'}`}>
                    {senderRole(t) === 'examiner' ? '👨‍🏫' : '👤'} {t.userId?.name || t.studentId?.name || 'Unknown'}
                  </span>
                  · {t.category} · {new Date(t.createdAt).toLocaleDateString()}
                  {t.replies?.length > 0 && <span className="ml-1 text-blue-500">{t.replies.length} reply(ies)</span>}
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ml-3 ${statusColor[t.status]}`}>{t.status.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="font-extrabold text-gray-900">{selected.subject}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    senderRole(selected) === 'examiner' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>{senderRole(selected) === 'examiner' ? '👨‍🏫 Teacher' : '👤 Student'}</span>
                  <span className="text-xs text-gray-400">{senderName(selected)} · {selected.category}</span>
                  {selected.priority && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded capitalize ${priorityColor[selected.priority]}`}>{selected.priority}</span>}
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full"><X className="h-4 w-4" /></button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Original message */}
              <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-700 border border-gray-200">
                <p className="text-xs font-bold text-gray-400 mb-1">ORIGINAL MESSAGE</p>
                {selected.message}
              </div>

              {/* Conversation */}
              {selected.replies?.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Conversation</p>
                  {selected.replies.map((r, i) => (
                    <div key={i} className={`p-3 rounded-xl text-sm ${
                      r.from === 'admin' ? 'bg-red-50 border border-red-100 ml-4' : 'bg-gray-50 border border-gray-100 mr-4'
                    }`}>
                      <p className="text-xs font-bold text-gray-500 mb-1">
                        {r.from === 'admin' ? '🛡 Admin' : r.from === 'examiner' ? '👨‍🏫 Teacher' : '👤 Student'} · {new Date(r.date).toLocaleString()}
                      </p>
                      <p className="text-gray-700">{r.message}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply box */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Reply</label>
                <textarea rows={3} value={reply} onChange={e => setReply(e.target.value)}
                  placeholder="Type your reply..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                <button onClick={sendReply} disabled={sending || !reply.trim()}
                  className="mt-2 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-60">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send Reply
                </button>
              </div>

              {/* Status */}
              <div>
                <p className="text-xs font-bold text-gray-600 mb-2">Update Status</p>
                <div className="flex gap-2">
                  {['open', 'in_progress', 'resolved', 'closed'].map(s => (
                    <button key={s} onClick={() => updateStatus(s)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${
                        selected.status === s ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}>{s.replace('_', ' ')}</button>
                  ))}
                </div>
              </div>
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

export const AnnouncementsTab = () => {
  const [form, setForm] = useState({ title: '', message: '', type: 'info' });
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.title || !form.message) return;
    setSending(true); setMsg({ text: '', type: '' });
    try {
      await api.post('/admin/announce', form);
      setMsg({ text: `Announcement sent to all students!`, type: 'success' });
      setForm({ title: '', message: '', type: 'info' });
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to send.', type: 'error' });
    } finally { setSending(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Announcements</h1>
        <p className="text-sm text-gray-500 mt-0.5">Broadcast a message to all students via their notification bell.</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        {msg.text && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>{msg.text}</div>
        )}
        <form onSubmit={handleSend} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Announcement Title</label>
              <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. System Maintenance Notice"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Type</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50">
                <option value="info">Info</option>
                <option value="alert">Alert</option>
                <option value="success">Success</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Message</label>
            <textarea required rows={5} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
              placeholder="Write your announcement here..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 resize-none" />
          </div>
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-700">
            This will send a notification to <strong>all registered students</strong> immediately.
          </div>
          <button type="submit" disabled={sending}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-60">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Broadcast to All Students
          </button>
        </form>
      </div>
    </div>
  );
};

export const SettingsTab = ({ admin }) => {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) return setMsg({ text: 'Passwords do not match.', type: 'error' });
    if (form.newPassword.length < 8) return setMsg({ text: 'Min 8 characters.', type: 'error' });
    setSaving(true); setMsg({ text: '', type: '' });
    try {
      const { data } = await api.put('/auth/update-password', { userId: admin.id || admin._id, currentPassword: form.currentPassword, newPassword: form.newPassword });
      setMsg({ text: data.message, type: 'success' });
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { setMsg({ text: err.response?.data?.message || 'Update failed.', type: 'error' }); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div><h1 className="text-2xl font-extrabold text-gray-900">Settings</h1><p className="text-sm text-gray-500 mt-0.5">Manage your admin account.</p></div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="h-14 w-14 rounded-full bg-red-600 text-white flex items-center justify-center font-extrabold text-xl">{admin?.name?.[0]?.toUpperCase()}</div>
          <div>
            <p className="font-extrabold text-gray-900">{admin?.name}</p>
            <p className="text-sm text-gray-500">{admin?.email}</p>
            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Administrator</span>
          </div>
        </div>
        <h2 className="font-bold text-gray-900 mb-4">Change Password</h2>
        {msg.text && <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>{msg.text}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {[['currentPassword', 'Current Password'], ['newPassword', 'New Password'], ['confirmPassword', 'Confirm New Password']].map(([field, label]) => (
            <div key={field}>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">{label}</label>
              <input type="password" required value={form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white" />
            </div>
          ))}
          <button type="submit" disabled={saving} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};
