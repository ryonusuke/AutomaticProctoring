import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Users, Settings, LogOut, Plus,
  Bell, Search, ChevronDown, ShieldAlert, BookOpen, BarChart2,
  TrendingUp, Clock, CheckCircle2, AlertOctagon, Loader2, X,
  Zap, Menu, Upload, FileUp, Image, Crop, Save, PenLine, HelpCircle
} from 'lucide-react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import api from '../services/api';

// ── Shared helpers ─────────────────────────────────────────────────────────
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
    completed: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${map[status] || map.completed}`}>
      {status === 'live' && <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 mr-1 animate-pulse" />}
      {status}
    </span>
  );
};

// ── Notification Bell ──────────────────────────────────────────────────────
const NotificationBell = ({ user }) => {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    api.get('/auth/me').then(({ data }) => {
      if (data.success) setNotifs(data.user.notifications || []);
    }).catch(() => {});
  }, []);

  const unread = notifs.filter(n => !n.isRead).length;

  const markOne = (notif) => {
    if (notif.isRead) return;
    setNotifs(p => p.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
    api.put(`/auth/notifications/${notif._id}/read`).catch(() => {});
  };

  const markAll = () => {
    setNotifs(p => p.map(n => ({ ...n, isRead: true })));
    api.put('/auth/notifications/read-all').catch(() => {});
  };

  const deleteOne = (e, notif) => {
    e.stopPropagation();
    setNotifs(p => p.filter(n => n._id !== notif._id));
    api.delete(`/auth/notifications/${notif._id}`).catch(() => {});
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(p => !p)}
        className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
            <span className="font-bold text-gray-900 text-sm">Notifications</span>
            <button onClick={markAll}
              className="text-xs text-blue-600 hover:underline">Mark all read</button>
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
            {notifs.length === 0 && <p className="text-center text-gray-400 text-xs py-6">No notifications.</p>}
            {notifs.map(n => (
              <div key={n._id} onClick={() => markOne(n)}
                className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors flex items-start gap-3 ${!n.isRead ? 'bg-blue-50/50' : ''}`}>
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

// ── Profile Dropdown ───────────────────────────────────────────────────────
const ProfileDropdown = ({ user, onNavigate, navigate }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(p => !p)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors">
        <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <span className="text-sm font-semibold text-gray-700 hidden sm:block">{user?.name}</span>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>
      {open && (
        <div className="absolute right-0 top-12 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <button onClick={() => { setOpen(false); onNavigate('settings'); }}
            className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <Settings className="h-4 w-4" /> Settings
          </button>
          <button onClick={() => { localStorage.removeItem('user'); localStorage.removeItem('token'); navigate('/'); }}
            className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-100">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

// ── Dashboard Home Tab ─────────────────────────────────────────────────────
const DashboardHome = ({ user, exams, results, onNavigate }) => {
  const totalViolations = results.reduce((acc, r) => acc + (r.violations?.length || 0), 0);
  const liveExams = exams.filter(e => getExamStatus(e) === 'live').length;

  const stats = [
    { label: 'Total Exams', value: exams.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Live Now', value: liveExams, icon: Zap, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Submissions', value: results.length, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Violations', value: totalViolations, icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  const recentActivity = [
    ...exams.slice(0, 3).map(e => ({ text: `Exam created: ${e.title}`, time: new Date(e.createdAt).toLocaleDateString(), icon: FileText, color: 'text-blue-500' })),
    ...results.slice(0, 2).map(r => ({ text: `Result submitted: ${r.examId?.title || 'Exam'}`, time: new Date(r.createdAt).toLocaleDateString(), icon: CheckCircle2, color: 'text-green-500' })),
  ].slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-gray-500 mt-1 text-sm">Here's what's happening with your exams today.</p>
      </div>

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
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4">Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No activity yet. Create your first exam!</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className={`h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0`}>
                    <a.icon className={`h-4 w-4 ${a.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{a.text}</p>
                    <p className="text-xs text-gray-400">{a.time}</p>
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
            <button onClick={() => onNavigate('exams')}
              className="w-full flex items-center gap-3 p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm">
              <Plus className="h-4 w-4" /> Create New Exam
            </button>
            <button onClick={() => onNavigate('results')}
              className="w-full flex items-center gap-3 p-3 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-medium text-sm border border-gray-200">
              <BarChart2 className="h-4 w-4" /> View Results
            </button>
            <button onClick={() => onNavigate('students')}
              className="w-full flex items-center gap-3 p-3 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-medium text-sm border border-gray-200">
              <Users className="h-4 w-4" /> Manage Students
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Students Tab ─────────────────────────────────────────────────────────────
const StudentsTab = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/admin/users?role=student')
      .then(({ data }) => { if (data.success) setStudents(data.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Students</h1>
        <p className="text-sm text-gray-500 mt-0.5">All registered students on the platform.</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students..." className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-blue-600" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400"><Users className="h-10 w-10 mx-auto mb-3 text-gray-200" /><p>No students found.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{['Name', 'Email', 'KYC Status', 'Joined'].map(h => <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(s => (
                  <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">{s.name[0]?.toUpperCase()}</div>
                        <span className="font-semibold text-gray-900">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-500">{s.email}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        s.kyc?.status === 'approved' ? 'bg-green-100 text-green-700' :
                        s.kyc?.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        s.kyc?.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
                      }`}>{s.kyc?.status || 'none'}</span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs">{new Date(s.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Results Tab with Grading Button ─────────────────────────────────────────
const ResultsTab = ({ user, results, exams, onRefresh }) => {
  const [selected, setSelected] = useState(null);
  const [grading, setGrading] = useState(null);
  const [search, setSearch] = useState('');
  const [filterExam, setFilterExam] = useState('all');
  const [grades, setGrades] = useState({});
  const [comments, setComments] = useState({});
  const [saving, setSaving] = useState(false);
  const [gradeMsg, setGradeMsg] = useState('');

  const handleGradeOpen = async (result) => {
    try {
      const { data } = await api.get(`/exams/${result.examId._id}?teacher=true`);
      setGrading({ ...result, examId: data.data });
      setGrades(result.manualGrades || {});
      setComments(result.comments || {});
    } catch (err) {
      alert('Failed to load exam questions.');
    }
  };

  const filtered = results.filter(r =>
    (r.studentId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.examId?.title?.toLowerCase().includes(search.toLowerCase())) &&
    (filterExam === 'all' || r.examId?._id === filterExam)
  );

  const exportCSV = () => {
    const rows = [['Student', 'Email', 'Exam', 'Score', 'Total', 'Trust Score', 'Status', 'Date']];
    filtered.forEach(r => {
      rows.push([r.studentId?.name || 'Unknown', r.studentId?.email || '', r.examId?.title || 'Unknown', r.score, r.totalMarks, `${r.trustScore}%`, r.status, new Date(r.createdAt).toLocaleDateString()]);
    });
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'results.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // Group results by exam
  const groupedByExam = filtered.reduce((acc, r) => {
    const examId = r.examId?._id || 'unknown';
    if (!acc[examId]) acc[examId] = [];
    acc[examId].push(r);
    return acc;
  }, {});

  const handleGradeSave = async (action = 'accept') => {
    setSaving(true); setGradeMsg('');
    try {
      await api.put(`/exams/results/${grading._id}/grade`, { manualGrades: grades, comments, action });
      setGradeMsg('Grades published!');
      setTimeout(() => {
        setGrading(null); setGradeMsg(''); setComments({});
        if (onRefresh) onRefresh();
      }, 1200);
    } catch (err) {
      setGradeMsg(err.response?.data?.message || 'Failed to save grades.');
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Results</h1>
        <p className="text-sm text-gray-500 mt-0.5">Review scores, trust scores and violation logs — sorted by exam.</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by student or exam..." className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
          </div>
          <select value={filterExam} onChange={e => setFilterExam(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50">
            <option value="all">All Exams</option>
            {exams.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
          </select>
          {filtered.length > 0 && (
            <button onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-green-700 border border-green-200 rounded-xl hover:bg-green-50 transition-colors">
              ↓ Export CSV
            </button>
          )}
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400"><BarChart2 className="h-10 w-10 mx-auto mb-3 text-gray-200" /><p>No results yet.</p></div>
        ) : (
          <div className="divide-y divide-gray-100">
            {Object.entries(groupedByExam).map(([examId, examResults]) => {
              const exam = examResults[0]?.examId;
              return (
                <div key={examId} className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <h3 className="font-bold text-gray-900">{exam?.title || 'Unknown Exam'}</h3>
                      <p className="text-xs text-gray-400">{exam?.courseCode} • {examResults.length} submission(s)</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>{['Student', 'Score', 'Trust', 'Status', 'Action'].map(h => <th key={h} className="px-4 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {examResults.map(r => (
                          <tr key={r._id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-semibold text-gray-900">{r.studentId?.name || 'Unknown'}</p>
                              <p className="text-xs text-gray-400">{r.studentId?.email}</p>
                            </td>
                            <td className="px-4 py-3 font-bold text-gray-900">{r.score}/{r.totalMarks}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                r.trustScore >= 80 ? 'bg-green-100 text-green-700' :
                                r.trustScore >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                              }`}>{r.trustScore}%</span>
                            </td>
                            <td className="px-4 py-3">
                              {r.status === 'passed' && <span className="text-green-600 font-semibold flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" />Passed</span>}
                              {r.status === 'failed' && <span className="text-yellow-600 font-semibold flex items-center gap-1"><AlertOctagon className="h-3.5 w-3.5" />Failed</span>}
                              {r.status === 'terminated_for_cheating' && <span className="text-red-600 font-bold flex items-center gap-1"><ShieldAlert className="h-3.5 w-3.5" />Disqualified</span>}
                              {r.status === 'pending_review' && <span className="text-orange-600 font-semibold flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Awaiting Grading</span>}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <button onClick={() => setSelected(r)} className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors">View Logs</button>
                                <button onClick={() => handleGradeOpen(r)}
                                  className="text-xs font-bold text-orange-600 hover:bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200 transition-colors flex items-center gap-1">
                                  <PenLine className="h-3 w-3" />Grade
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Violation Log Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-gray-500" /> Security Audit Log</h3>
              <button onClick={() => setSelected(null)} className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-full"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm mb-5">
                <div><span className="text-xs text-gray-400 block">Candidate</span><span className="font-bold text-gray-900">{selected.studentId?.name}</span></div>
                <div><span className="text-xs text-gray-400 block">Exam</span><span className="font-bold text-gray-900">{selected.examId?.title}</span></div>
                <div><span className="text-xs text-gray-400 block">Trust Score</span><span className={`font-bold ${selected.trustScore < 50 ? 'text-red-600' : 'text-green-600'}`}>{selected.trustScore}%</span></div>
                <div><span className="text-xs text-gray-400 block">Violations</span><span className="font-bold text-gray-900">{selected.violations?.length || 0}</span></div>
              </div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Timestamped Events</h4>
              <div className="max-h-56 overflow-y-auto space-y-2">
                {!selected.violations?.length ? (
                  <div className="text-center p-4 bg-green-50 text-green-700 rounded-xl border border-green-200 text-sm font-medium">
                    <CheckCircle2 className="h-5 w-5 inline mr-1" /> No violations detected.
                  </div>
                ) : selected.violations.map((v, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-xl text-sm">
                    <span className="h-5 w-5 bg-red-200 text-red-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                    <div>
                      <p className="font-medium text-red-900">{v.reason}</p>
                      <p className="text-xs text-red-400 mt-0.5">{new Date(v.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button onClick={() => setSelected(null)} className="px-5 py-2 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Grading Modal in Results Tab */}
      {grading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="font-bold text-gray-900 flex items-center gap-2"><PenLine className="h-5 w-5 text-orange-600" /> Grade Submission</h3>
                <p className="text-xs text-gray-500 mt-0.5">{grading.studentId?.name} — {grading.examId?.title}</p>
              </div>
              <button onClick={() => { setGrading(null); setGradeMsg(''); setComments({}); }} className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full"><X className="h-4 w-4" /></button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {/* Score + Trust Score bar */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Score</p>
                  <p className="text-xl font-extrabold text-gray-900">{grading.score}/{grading.totalMarks}</p>
                  <p className={`text-xs font-bold ${(grading.score/grading.totalMarks) >= 0.4 ? 'text-green-600' : 'text-red-500'}`}>{Math.round((grading.score/grading.totalMarks)*100)}% · {(grading.score/grading.totalMarks) >= 0.4 ? 'Pass' : 'Fail'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Trust Score</p>
                  <p className={`text-xl font-extrabold ${grading.trustScore >= 80 ? 'text-green-600' : grading.trustScore >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{grading.trustScore}%</p>
                  <p className="text-xs text-red-500">{grading.violations?.length || 0} violation(s)</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Trust Decision</p>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => handleGradeSave('accept')} disabled={saving} className="text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">Accept</button>
                    <button onClick={() => handleGradeSave('penalize')} disabled={saving} className="text-xs font-bold px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200">Penalize (50%)</button>
                    <button onClick={() => handleGradeSave('disqualify')} disabled={saving} className="text-xs font-bold px-2 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">Disqualify</button>
                  </div>
                </div>
              </div>

              {gradeMsg && (
                <div className={`px-4 py-3 rounded-xl text-sm font-medium ${gradeMsg.includes('published') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>{gradeMsg}</div>
              )}

              {/* Questions */}
              {grading.examId?.questions?.map((q, i) => {
                const ans = grading.answers?.[i];
                const optLabels = ['A','B','C','D','E','F'];
                // Partial marks for multiple_correct
                let autoMarks = null;
                if (q.type === 'mcq') {
                  autoMarks = ans === q.correctOptionIndex ? q.marks : 0;
                } else if (q.type === 'multiple_correct') {
                  const correctSet = new Set(q.correctOptionIndices || []);
                  const givenArr = Array.isArray(ans) ? ans : [];
                  const perMark = q.marks / (correctSet.size || 1);
                  let partial = 0;
                  givenArr.forEach(a => { if (correctSet.has(a)) partial += perMark; else partial -= perMark; });
                  autoMarks = Math.round(Math.max(0, Math.min(partial, q.marks)) * 100) / 100;
                }
                const hasOverride = grades[i] !== undefined && grades[i] !== '';
                const effectiveMarks = hasOverride ? Number(grades[i]) : autoMarks;
                const isFullCorrect = effectiveMarks === q.marks;
                const isZero = effectiveMarks === 0;
                return (
                  <div key={i} className={`rounded-xl border-2 overflow-hidden ${ hasOverride ? 'border-orange-300' : q.type === 'short_answer' ? 'border-gray-300' : 'border-blue-200'}`}>
                    <div className={`px-4 py-2 flex items-center justify-between ${ hasOverride ? 'bg-orange-50' : q.type === 'short_answer' ? 'bg-gray-50' : 'bg-blue-50'}`}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-extrabold text-gray-700">Q{i+1}</span>
                        <span className="text-xs font-bold text-gray-500">{q.type === 'mcq' ? 'MCQ' : q.type === 'multiple_correct' ? 'Multi-Correct' : 'Short Answer'}</span>
                        {q.type !== 'short_answer' && !hasOverride && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            isFullCorrect ? 'text-green-700 bg-green-100' : isZero ? 'text-red-600 bg-red-100' : 'text-yellow-700 bg-yellow-100'
                          }`}>Auto-graded: {autoMarks}/{q.marks}</span>
                        )}
                        {q.type === 'short_answer' && !hasOverride && (
                          <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded">Manual grading required</span>
                        )}
                        {hasOverride && <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded">Modified by teacher</span>}
                      </div>
                      <span className="text-xs text-gray-500 shrink-0">Max: {q.marks}</span>
                    </div>
                    <div className="p-4 space-y-3">
                      <p className="text-sm font-semibold text-gray-800">{q.questionText}</p>

                      {/* All options with student selection + correct answer highlighted */}
                      {(q.type === 'mcq' || q.type === 'multiple_correct') && q.options?.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">All Options</p>
                          {q.options.map((opt, oi) => {
                            const isCorrectOpt = q.type === 'mcq' ? oi === q.correctOptionIndex : (q.correctOptionIndices || []).includes(oi);
                            const isStudentPick = q.type === 'mcq' ? ans === oi : (Array.isArray(ans) && ans.includes(oi));
                            let rowClass = 'border-gray-200 bg-white text-gray-700';
                            if (isCorrectOpt && isStudentPick) rowClass = 'border-green-400 bg-green-50 text-green-800';
                            else if (isCorrectOpt) rowClass = 'border-green-300 bg-green-50/60 text-green-700';
                            else if (isStudentPick) rowClass = 'border-red-300 bg-red-50 text-red-700';
                            return (
                              <div key={oi} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${rowClass}`}>
                                <span className="font-bold text-xs w-5 shrink-0">{optLabels[oi]}.</span>
                                <span className="flex-1">{opt}</span>
                                <div className="flex items-center gap-1 shrink-0">
                                  {isStudentPick && <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">Student</span>}
                                  {isCorrectOpt && <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-green-200 text-green-800">✓ Correct</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Short answer student response */}
                      {q.type === 'short_answer' && (
                        <div className="p-3 bg-white border border-gray-200 rounded-lg">
                          <p className="text-xs font-bold text-gray-400 mb-1">STUDENT ANSWER</p>
                          <p className="text-sm text-gray-800">{ans || <span className="italic text-gray-400">Not answered</span>}</p>
                        </div>
                      )}

                      {/* Model answer for short answer */}
                      {q.modelAnswer && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-xs font-bold text-blue-600 mb-1">MODEL ANSWER</p>
                          <p className="text-sm text-blue-800">{q.modelAnswer}</p>
                        </div>
                      )}

                      {/* Marks + comment */}
                      <div className="flex items-start gap-3">
                        <div>
                          <p className="text-xs font-bold text-gray-600 mb-1">{q.type !== 'short_answer' ? 'Override Marks (optional)' : 'Assign Marks'}</p>
                          <div className="flex items-center gap-2">
                            <input type="number" min={0} max={q.marks} step={0.5}
                              value={grades[i] ?? ''}
                              onChange={e => setGrades(p => ({ ...p, [i]: e.target.value === '' ? '' : +e.target.value }))}
                              placeholder={autoMarks !== null ? String(autoMarks) : '0'}
                              className="w-20 px-3 py-2 border-2 border-gray-300 rounded-lg text-sm font-bold text-center outline-none focus:border-orange-400" />
                            <span className="text-sm text-gray-500">/ {q.marks}</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-gray-600 mb-1">Comment (optional)</p>
                          <input type="text" value={comments[i] ?? ''}
                            onChange={e => setComments(p => ({ ...p, [i]: e.target.value }))}
                            placeholder='e.g. "Good but missing example"'
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between shrink-0">
              <p className="text-xs text-gray-500">Student will be notified after publishing.</p>
              <div className="flex gap-2">
                <button onClick={() => { setGrading(null); setGradeMsg(''); setComments({}); }} className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl">Cancel</button>
                <button onClick={() => handleGradeSave('accept')} disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold rounded-xl disabled:opacity-60">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" />Publish Grades</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Help Tab ────────────────────────────────────────────────────────────────
const HelpTab = () => {
  const [openFaq, setOpenFaq] = useState(null);
  const [showTicket, setShowTicket] = useState(false);
  const [ticketForm, setTicketForm] = useState({ subject: '', message: '', priority: 'medium', category: 'General' });
  const [ticketSaving, setTicketSaving] = useState(false);
  const [ticketMsg, setTicketMsg] = useState('');

  const [myTickets, setMyTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const loadTickets = async () => {
    const u = JSON.parse(localStorage.getItem('user'));
    if (!u) return;
    setLoadingTickets(true);
    try {
      const { data } = await api.get(`/tickets/user/${u.id || u._id}`);
      if (data.success) setMyTickets(data.data);
    } catch (e) { console.error(e); }
    finally { setLoadingTickets(false); }
  };

  useEffect(() => { loadTickets(); }, []);

  const statusColor = { open: 'bg-blue-100 text-blue-700', in_progress: 'bg-yellow-100 text-yellow-700', resolved: 'bg-green-100 text-green-700', closed: 'bg-gray-100 text-gray-500' };

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    setTicketSaving(true); setTicketMsg('');
    try {
      const u = JSON.parse(localStorage.getItem('user'));
      await api.post('/tickets', { ...ticketForm, userId: u.id || u._id });
      setTicketMsg('Ticket submitted! Admin will respond soon.');
      setTicketForm({ subject: '', message: '', priority: 'medium', category: 'General' });
      loadTickets();
      setTimeout(() => { setShowTicket(false); setTicketMsg(''); }, 2000);
    } catch (err) {
      setTicketMsg(err.response?.data?.message || 'Failed to submit ticket.');
    } finally { setTicketSaving(false); }
  };

  const faqs = [
    {
      q: 'How do I create an exam?',
      a: 'Click the "New Exam" button in the Exams tab. Fill in the exam details (title, course code, duration, start/end times), configure security settings, and add questions. You can manually create questions or use AI generation. Click "Publish Exam" when done.'
    },
    {
      q: 'How do I assign students to an exam?',
      a: 'In the Exams tab, click the "Assign" button next to any exam. Select the students you want to assign from the list. Only assigned students will see and be able to take that exam. If no students are assigned, the exam will be hidden from all students.'
    },
    {
      q: 'How does AI question generation work?',
      a: 'When creating/editing an exam, click "AI Generate". You can generate questions by topic (e.g., "Binary Trees") or paste syllabus/document text. Select question type (MCQ, Multi-Correct, Short Answer), count, and difficulty. The AI will generate questions that you can review and edit before adding to your exam.'
    },
    {
      q: 'How do I add images to questions?',
      a: 'While creating a question, click "Add Image" below the question text. Upload an image, then use the modern cropping tool to adjust the visible area by dragging and zooming. Click "Apply Crop" to attach the cropped image to your question.'
    },
    {
      q: 'How do I grade questions?',
      a: 'In the Results tab, click the "Grade" button next to any submission. You can manually grade any question type - MCQ, Multiple Correct, or Short Answer. Enter marks for each question (up to the maximum marks), then click "Save Grades". The total score will be automatically updated.'
    },
    {
      q: 'What are security settings?',
      a: 'Security settings control proctoring strictness: "Force Webcam" requires students to enable their camera, "Browser Lock" prevents tab switching, and "Tolerance" sets how many violations are allowed before automatic termination (1=Strict, 3=Standard, 5=Lenient).'
    },
    {
      q: 'How do I notify students about an exam?',
      a: 'In the Exams tab, click the "Notify" button next to any exam. This sends an email and in-app notification to all assigned students (or all students if none are assigned) with exam details and timing.'
    },
    {
      q: 'What is the Trust Score?',
      a: 'Trust Score is a percentage (0-100%) that indicates exam integrity. It starts at 100% and decreases with each violation detected (face not visible, multiple people, tab switching, etc.). A low trust score suggests potential cheating.'
    },
    {
      q: 'How do I view detailed violation logs?',
      a: 'In the Results tab, click "View Logs" next to any submission. This shows all timestamped security violations detected during that exam session, including the reason and exact time of each violation.'
    },
    {
      q: 'Can I edit an exam after publishing?',
      a: 'Yes, click "Edit" in the Exams tab. However, be cautious when editing live or completed exams as it may affect ongoing submissions or result calculations. It\'s best to edit exams before they start.'
    },
    {
      q: 'What question types are supported?',
      a: 'Three types: (1) MCQ - single correct answer, (2) Multiple Correct - multiple correct answers, (3) Short Answer - text response requiring manual grading. You can enable negative marking for MCQ and Multiple Correct questions. Teachers can manually grade any question type if needed.'
    },
    {
      q: 'How do I delete an exam?',
      a: 'In the Exams tab, click the "Delete" button next to the exam you want to remove. Confirm the deletion. Warning: This permanently deletes the exam and cannot be undone. Associated results will remain in the system.'
    }
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Help & Documentation</h1>
        <p className="text-sm text-gray-500 mt-0.5">Everything you need to know about managing exams and proctoring.</p>
      </div>

      {/* Quick Start Guide */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-lg mb-2">Quick Start Guide</h2>
            <ol className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600 shrink-0">1.</span>
                <span><strong>Create an Exam:</strong> Go to Exams tab → Click "New Exam" → Fill details and add questions (manual or AI-generated)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600 shrink-0">2.</span>
                <span><strong>Assign Students:</strong> Click "Assign" button → Select students who should take this exam</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600 shrink-0">3.</span>
                <span><strong>Notify Students:</strong> Click "Notify" button to send email and in-app notifications</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600 shrink-0">4.</span>
                <span><strong>Monitor & Grade:</strong> View results in real-time, check violation logs, and grade subjective questions</span>
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Features Overview */}
      <div className="grid md:grid-cols-2 gap-4">
        {[
          { icon: Zap, title: 'AI Question Generation', desc: 'Generate questions from topics or documents using AI', color: 'text-purple-600', bg: 'bg-purple-50' },
          { icon: Crop, title: 'Modern Image Cropping', desc: 'Add and crop images with drag-and-zoom interface', color: 'text-green-600', bg: 'bg-green-50' },
          { icon: PenLine, title: 'Manual Grading', desc: 'Grade any question type manually with full control', color: 'text-orange-600', bg: 'bg-orange-50' },
          { icon: ShieldAlert, title: 'Advanced Proctoring', desc: 'Face detection, tab monitoring, and violation tracking', color: 'text-red-600', bg: 'bg-red-50' },
          { icon: Users, title: 'Student Assignment', desc: 'Assign specific students to each exam', color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { icon: BarChart2, title: 'Results by Exam', desc: 'View and analyze results grouped by exam', color: 'text-blue-600', bg: 'bg-blue-50' }
        ].map((f, i) => (
          <div key={i} className={`${f.bg} rounded-xl border border-gray-200 p-5`}>
            <div className={`h-10 w-10 rounded-lg bg-white flex items-center justify-center mb-3`}>
              <f.icon className={`h-5 w-5 ${f.color}`} />
            </div>
            <h3 className="font-bold text-gray-900 text-sm mb-1">{f.title}</h3>
            <p className="text-xs text-gray-600">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-gray-500" /> Frequently Asked Questions
          </h2>
        </div>
        <div className="divide-y divide-gray-100">
          {faqs.map((faq, i) => (
            <div key={i}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors">
                <span className="font-semibold text-gray-900 text-sm pr-4">{faq.q}</span>
                <ChevronDown className={`h-4 w-4 text-gray-400 shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === i && (
                <div className="px-6 pb-4 text-sm text-gray-600 leading-relaxed">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* My Tickets */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">My Support Tickets</h2>
          <button onClick={() => setShowTicket(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">
            + New Ticket
          </button>
        </div>
        {loadingTickets ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
        ) : myTickets.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">No tickets yet.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {myTickets.map(t => (
              <div key={t._id} onClick={() => setSelectedTicket(t)} className="flex items-start justify-between px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{t.subject}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t.category} · {new Date(t.createdAt).toLocaleDateString()}
                    {t.replies?.length > 0 && <span className="ml-2 text-blue-500">{t.replies.length} reply(ies)</span>}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ml-3 ${statusColor[t.status] || 'bg-gray-100 text-gray-500'}`}>{t.status.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="font-extrabold text-gray-900">{selectedTicket.subject}</h2>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColor[selectedTicket.status] || 'bg-gray-100 text-gray-500'}`}>{selectedTicket.status.replace('_', ' ')}</span>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-700 border border-gray-200">
                <p className="text-xs font-bold text-gray-400 mb-1">ORIGINAL MESSAGE</p>
                {selectedTicket.message}
              </div>
              {selectedTicket.replies?.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Replies</p>
                  {selectedTicket.replies.map((r, i) => (
                    <div key={i} className={`p-3 rounded-xl text-sm ${
                      r.from === 'admin' ? 'bg-blue-50 border border-blue-100 ml-4' : 'bg-gray-50 border border-gray-100 mr-4'
                    }`}>
                      <p className="text-xs font-bold text-gray-500 mb-1">
                        {r.from === 'admin' ? '🛡 Admin' : '👨🏫 You'} · {new Date(r.date).toLocaleString()}
                      </p>
                      <p className="text-gray-700">{r.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 shrink-0 flex justify-end">
              <button onClick={() => setSelectedTicket(null)} className="px-5 py-2 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Modal */}
      {showTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Submit Support Ticket</h3>
              <button onClick={() => setShowTicket(false)} className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-full"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleTicketSubmit} className="p-6 space-y-4">
              {ticketMsg && (
                <div className={`px-4 py-3 rounded-xl text-sm font-medium ${ticketMsg.includes('submitted') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>{ticketMsg}</div>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Category</label>
                <select value={ticketForm.category} onChange={e => setTicketForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50">
                  <option>General</option><option>Technical</option><option>Exam Issue</option><option>KYC/Verification</option><option>Grading</option><option>Account</option><option>Feature Request</option><option>Bug Report</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Subject</label>
                <input required value={ticketForm.subject} onChange={e => setTicketForm(p => ({ ...p, subject: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white" placeholder="Brief description of your issue" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Priority</label>
                <select value={ticketForm.priority} onChange={e => setTicketForm(p => ({ ...p, priority: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Message</label>
                <textarea required rows={4} value={ticketForm.message} onChange={e => setTicketForm(p => ({ ...p, message: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white resize-none" placeholder="Describe your issue in detail..." />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowTicket(false)} className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
                <button type="submit" disabled={ticketSaving} className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 disabled:opacity-60">
                  {ticketSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Settings Tab ─────────────────────────────────────────────────────────────
const SettingsTab = ({ user }) => {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword)
      return setMsg({ text: 'New passwords do not match.', type: 'error' });
    if (form.newPassword.length < 8)
      return setMsg({ text: 'Password must be at least 8 characters.', type: 'error' });
    setSaving(true); setMsg({ text: '', type: '' });
    try {
      const { data } = await api.put('/auth/update-password', { userId: user.id, currentPassword: form.currentPassword, newPassword: form.newPassword });
      setMsg({ text: data.message, type: 'success' });
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Update failed.', type: 'error' });
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account preferences.</p>
      </div>
      {/* Profile info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-900 mb-4">Profile</h2>
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-blue-600 text-white flex items-center justify-center font-extrabold text-xl">{user?.name?.[0]?.toUpperCase()}</div>
          <div>
            <p className="font-bold text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full capitalize">{user?.role}</span>
          </div>
        </div>
      </div>
      {/* Password update */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-900 mb-4">Change Password</h2>
        {msg.text && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>{msg.text}</div>
        )}
        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          {[['currentPassword', 'Current Password'], ['newPassword', 'New Password'], ['confirmPassword', 'Confirm New Password']].map(([field, label]) => (
            <div key={field}>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">{label}</label>
              <input type="password" required value={form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white" />
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

// ── ExamResultRow (answers + manual grading) ─────────────────────────────
const ExamResultRow = ({ r, exam, onGraded }) => {
  const [showDetail, setShowDetail] = useState(false);
  const [grading, setGrading] = useState(false);
  const [grades, setGrades] = useState({});
  const [saving, setSaving] = useState(false);
  const [gradeMsg, setGradeMsg] = useState('');

  const mins = r.timeTaken ? Math.floor(r.timeTaken / 60) : null;
  const secs = r.timeTaken ? r.timeTaken % 60 : null;

  // Find ALL questions for manual grading (teacher can grade any type)
  const allQs = exam?.questions?.map((q, i) => ({ ...q, idx: i })) || [];
  const hasQuestions = allQs.length > 0;
  const alreadyGraded = r.manualGrades && Object.keys(r.manualGrades).length > 0;

  const handleGradeSave = async () => {
    setSaving(true); setGradeMsg('');
    try {
      await api.put(`/exams/results/${r._id}/grade`, { manualGrades: grades });
      setGradeMsg('Grades saved!');
      setGrading(false);
      if (onGraded) onGraded();
    } catch (err) {
      setGradeMsg(err.response?.data?.message || 'Failed to save grades.');
    } finally { setSaving(false); }
  };

  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors">
        <td className="px-4 py-3">
          <p className="font-semibold text-gray-900 text-sm">{r.studentId?.name || 'Unknown'}</p>
          <p className="text-xs text-gray-400">{r.studentId?.email}</p>
        </td>
        <td className="px-4 py-3 font-bold text-gray-900 text-sm">{r.score}/{r.totalMarks}</td>
        <td className="px-4 py-3">
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            r.trustScore >= 80 ? 'bg-green-100 text-green-700' :
            r.trustScore >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
          }`}>{r.trustScore}%</span>
        </td>
        <td className="px-4 py-3 text-sm text-gray-500">{mins !== null ? `${mins}m ${secs}s` : '—'}</td>
        <td className="px-4 py-3">
          {r.status === 'passed' && <span className="text-green-600 text-xs font-bold">Passed</span>}
          {r.status === 'failed' && <span className="text-yellow-600 text-xs font-bold">Failed</span>}
          {r.status === 'terminated_for_cheating' && <span className="text-red-600 text-xs font-bold">Disqualified</span>}
          {r.status === 'pending_review' && <span className="text-orange-600 text-xs font-bold">Awaiting Grading</span>}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5">
            <button onClick={() => setShowDetail(p => !p)} className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
              {showDetail ? 'Hide' : 'Answers'}
            </button>
            {hasQuestions && (
              <button onClick={() => setGrading(p => !p)}
                className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1 ${
                  alreadyGraded ? 'text-green-600 border-green-200 hover:bg-green-50' : 'text-orange-600 border-orange-200 hover:bg-orange-50'
                }`}>
                <PenLine className="h-3 w-3" />{alreadyGraded ? 'Re-grade' : 'Grade'}
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Answer sheet */}
      {showDetail && (
        <tr>
          <td colSpan={6} className="px-4 pb-4 bg-gray-50">
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-2 bg-gray-100 text-xs font-bold text-gray-600 uppercase tracking-wider">Answer Sheet</div>
              <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {exam?.questions?.map((q, i) => {
                  const ans = r.answers?.[i];
                  const optLabels = ['A','B','C','D','E','F'];
                  return (
                    <div key={i} className="px-4 py-3 space-y-2">
                      <p className="text-xs font-semibold text-gray-700">Q{i+1} <span className="text-gray-400 font-normal">({q.type === 'mcq' ? 'MCQ' : q.type === 'multiple_correct' ? 'Multi-Correct' : 'Short Answer'})</span>: {q.questionText}</p>
                      {(q.type === 'mcq' || q.type === 'multiple_correct') && q.options?.length > 0 && (
                        <div className="space-y-1">
                          {q.options.map((opt, oi) => {
                            const isCorrectOpt = q.type === 'mcq' ? oi === q.correctOptionIndex : (q.correctOptionIndices || []).includes(oi);
                            const isStudentPick = q.type === 'mcq' ? ans === oi : (Array.isArray(ans) && ans.includes(oi));
                            let rowClass = 'border-gray-100 text-gray-600';
                            if (isCorrectOpt && isStudentPick) rowClass = 'border-green-300 bg-green-50 text-green-800';
                            else if (isCorrectOpt) rowClass = 'border-green-200 bg-green-50/50 text-green-700';
                            else if (isStudentPick) rowClass = 'border-red-200 bg-red-50 text-red-700';
                            return (
                              <div key={oi} className={`flex items-center gap-2 px-2 py-1 rounded border text-xs ${rowClass}`}>
                                <span className="font-bold w-4 shrink-0">{optLabels[oi]}.</span>
                                <span className="flex-1">{opt}</span>
                                {isStudentPick && <span className="font-bold text-blue-600">Student</span>}
                                {isCorrectOpt && <span className="font-bold text-green-700">✓</span>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {q.type === 'short_answer' && (
                        <div className="space-y-1">
                          <p className="text-xs text-gray-500">Response: <span className="text-gray-800 font-medium">{ans || 'Not answered'}</span></p>
                          {q.modelAnswer && <p className="text-xs text-gray-400">Model: {q.modelAnswer}</p>}
                          {r.manualGrades?.[i] !== undefined && <p className="text-xs text-green-600 font-bold">Graded: {r.manualGrades[i]} / {q.marks} marks</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </td>
        </tr>
      )}

      {/* Manual grading panel - ALL QUESTIONS */}
      {grading && hasQuestions && (
        <tr>
          <td colSpan={6} className="px-4 pb-4 bg-orange-50">
            <div className="rounded-xl border border-orange-200 overflow-hidden">
              <div className="px-4 py-2 bg-orange-100 text-xs font-bold text-orange-700 uppercase tracking-wider flex items-center gap-2">
                <PenLine className="h-3.5 w-3.5" /> Manual Grading — All Questions
              </div>
              <div className="divide-y divide-orange-100">
                {allQs.map(q => (
                  <div key={q.idx} className="px-4 py-3 flex items-start gap-4">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-700">Q{q.idx+1} ({q.type === 'mcq' ? 'MCQ' : q.type === 'multiple_correct' ? 'Multi-Correct' : 'Short Answer'}): {q.questionText}</p>
                      <p className="text-xs text-gray-500 mt-1">Student: <span className="text-gray-800">{r.answers?.[q.idx] !== undefined ? (Array.isArray(r.answers?.[q.idx]) ? r.answers[q.idx].map(a => q.options?.[a]).join(', ') : q.options?.[r.answers[q.idx]] || r.answers[q.idx]) : 'Not answered'}</span></p>
                      {q.modelAnswer && <p className="text-xs text-gray-400 mt-0.5">Model: {q.modelAnswer}</p>}
                      {q.type === 'mcq' && <p className="text-xs text-blue-500 mt-0.5">Correct: {q.options?.[q.correctOptionIndex]}</p>}
                      {q.type === 'multiple_correct' && <p className="text-xs text-blue-500 mt-0.5">Correct: {q.correctOptionIndices?.map(i => q.options?.[i]).join(', ')}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-500">Marks (max {q.marks}):</span>
                      <input type="number" min={0} max={q.marks} step={0.5}
                        value={grades[q.idx] ?? (r.manualGrades?.[q.idx] ?? '')}
                        onChange={e => setGrades(p => ({ ...p, [q.idx]: +e.target.value }))}
                        className="w-16 px-2 py-1 border border-orange-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-400 text-center" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 bg-orange-50 flex items-center justify-between border-t border-orange-200">
                {gradeMsg && <span className={`text-xs font-bold ${gradeMsg.includes('saved') ? 'text-green-600' : 'text-red-600'}`}>{gradeMsg}</span>}
                <div className="flex gap-2 ml-auto">
                  <button onClick={() => setGrading(false)} className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                  <button onClick={handleGradeSave} disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg disabled:opacity-60">
                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save Grades
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// ── Exams Tab ─────────────────────────────────────────────────────────────
const defaultExam = { title: '', description: '', courseCode: '', durationMinutes: 60, startTime: '', endTime: '', negativeMarking: false, securitySettings: { requireWebcam: true, strictBrowserLock: true, toleranceLimit: 3 } };
const defaultQuestion = { questionText: '', type: 'mcq', options: ['', '', '', ''], correctOptionIndex: 0, correctOptionIndices: [], modelAnswer: '', marks: 1, negativeMark: 0 };

const ExamsTab = ({ user, exams, loadingExams, onRefresh }) => {
  const [showModal, setShowModal] = useState(false);
  const [editExam, setEditExam] = useState(null);
  const [examDetails, setExamDetails] = useState(defaultExam);
  const [questions, setQuestions] = useState([{ ...defaultQuestion }]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [notifying, setNotifying] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [examResults, setExamResults] = useState(null); // { exam, results }
  const [assignModal, setAssignModal] = useState(null); // exam object
  const [allStudents, setAllStudents] = useState([]);
  const [assignedIds, setAssignedIds] = useState([]);
  const [assignSaving, setAssignSaving] = useState(false);
  // AI generation
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState(5);
  const [aiDiff, setAiDiff] = useState('medium');
  const [aiType, setAiType] = useState('mcq');
  const [aiLoading, setAiLoading] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiMode, setAiMode] = useState('topic'); // 'topic' | 'document' | 'pdf'
  const [aiDocument, setAiDocument] = useState('');
  // Image upload + crop (react-image-crop)
  const [cropModal, setCropModal] = useState(null); // { src, questionIdx }
  const [crop, setCrop] = useState({ unit: '%', width: 50, aspect: 16/9 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);
  const [pdfUploading, setPdfUploading] = useState(false);

  const openCreate = () => { setEditExam(null); setExamDetails(defaultExam); setQuestions([{ ...defaultQuestion }]); setMsg({ text: '', type: '' }); setShowModal(true); };
  const openEdit = async (exam) => {
    setEditExam(exam);
    setMsg({ text: '', type: '' });
    try {
      const { data } = await api.get(`/exams/${exam._id}`);
      const full = data.data;
      setExamDetails({ title: full.title, courseCode: full.courseCode, durationMinutes: full.durationMinutes, startTime: full.startTime?.slice(0,16) || '', endTime: full.endTime?.slice(0,16) || '', securitySettings: full.securitySettings });
      setQuestions(full.questions?.length ? full.questions : [{ ...defaultQuestion }]);
    } catch { setExamDetails({ title: exam.title, courseCode: exam.courseCode, durationMinutes: exam.durationMinutes, startTime: '', endTime: '', securitySettings: exam.securitySettings }); setQuestions([{ ...defaultQuestion }]); }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg({ text: '', type: '' });
    try {
      const payload = { ...examDetails, examinerId: user.id, questions };
      if (editExam) { await api.put(`/exams/${editExam._id}`, payload); }
      else { await api.post('/exams', payload); }
      setMsg({ text: editExam ? 'Exam updated!' : 'Exam published!', type: 'success' });
      onRefresh();
      setTimeout(() => { setShowModal(false); setMsg({ text: '', type: '' }); }, 1200);
    } catch (err) { setMsg({ text: err.response?.data?.message || 'Failed to save.', type: 'error' }); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this exam permanently?')) return;
    setDeleting(id);
    try { await api.delete(`/exams/${id}`); onRefresh(); }
    catch (err) { alert(err.response?.data?.message || 'Delete failed.'); }
    finally { setDeleting(null); }
  };

  const handleNotify = async (exam) => {
    setNotifying(exam._id);
    try {
      const { data } = await api.post(`/exams/${exam._id}/notify`, {});
      alert(data.message);
    } catch (err) { alert(err.response?.data?.message || 'Notify failed.'); }
    finally { setNotifying(null); }
  };

  const handleAIGenerate = async () => {
    if (aiMode === 'topic' && !aiTopic.trim()) return;
    if (aiMode === 'document' && aiDocument.trim().length < 50) return;
    setAiLoading(true);
    try {
      const endpoint = aiMode === 'document' ? '/exams/ai/generate-from-document' : '/exams/ai/generate-questions';
      const payload = aiMode === 'document'
        ? { text: aiDocument, count: aiCount, difficulty: aiDiff, type: aiType }
        : { topic: aiTopic, count: aiCount, difficulty: aiDiff, type: aiType };
      const { data } = await api.post(endpoint, payload);
      setQuestions(prev => [...prev.filter(q => q.questionText), ...data.data]);
      setShowAI(false); setAiTopic(''); setAiDocument('');
    } catch (err) { alert(err.response?.data?.message || 'AI generation failed.'); }
    finally { setAiLoading(false); }
  };

  const handleImageUpload = (e, qi) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCropModal({ src: ev.target.result, questionIdx: qi });
      setCrop({ unit: '%', width: 50, aspect: 16/9 });
      setCompletedCrop(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const onImageLoad = useCallback((img) => {
    imgRef.current = img;
  }, []);

  const applyCrop = useCallback(() => {
    if (!imgRef.current || !cropModal) return;

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const ctx = canvas.getContext('2d');

    // Use current crop state if completedCrop is not set
    const activeCrop = completedCrop || crop;
    if (!activeCrop || !activeCrop.width || !activeCrop.height) {
      alert('Please select a crop area first');
      return;
    }

    // Convert percentage to pixels if needed
    const pixelCrop = {
      x: activeCrop.unit === '%' ? (activeCrop.x / 100) * image.width : activeCrop.x,
      y: activeCrop.unit === '%' ? (activeCrop.y / 100) * image.height : activeCrop.y,
      width: activeCrop.unit === '%' ? (activeCrop.width / 100) * image.width : activeCrop.width,
      height: activeCrop.unit === '%' ? (activeCrop.height / 100) * image.height : activeCrop.height
    };

    canvas.width = pixelCrop.width * scaleX;
    canvas.height = pixelCrop.height * scaleY;

    ctx.drawImage(
      image,
      pixelCrop.x * scaleX,
      pixelCrop.y * scaleY,
      pixelCrop.width * scaleX,
      pixelCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const cropped = canvas.toDataURL('image/jpeg', 0.7);
    // Warn if image is too large (>500KB base64)
    if (cropped.length > 500000) {
      alert('Image is too large after cropping. Please crop a smaller area or use a smaller image.');
      return;
    }
    setQuestions(p => {
      const u = [...p];
      u[cropModal.questionIdx] = { ...u[cropModal.questionIdx], image: cropped };
      return u;
    });
    setCropModal(null);
  }, [completedCrop, crop, cropModal]);

  const handlePDFUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }
    setPdfUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const { data } = await api.post('/exams/ai/generate-from-pdf', {
          pdfBase64: ev.target.result,
          count: aiCount,
          difficulty: aiDiff,
          type: aiType
        });
        setQuestions(prev => [...prev.filter(q => q.questionText), ...data.data]);
        setShowAI(false);
      } catch (err) {
        alert(err.response?.data?.message || 'PDF generation failed.');
      } finally {
        setPdfUploading(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleViewResults = async (exam) => {
    try {
      const { data } = await api.get(`/exams/${exam._id}/results`);
      setExamResults({ exam, results: data.data });
    } catch (err) { alert('Failed to load results.'); }
  };

  const refreshExamResults = async () => {
    if (examResults) {
      try {
        const { data } = await api.get(`/exams/${examResults.exam._id}/results`);
        setExamResults({ exam: examResults.exam, results: data.data });
      } catch (err) { console.error(err); }
    }
  };

  const openAssign = async (exam) => {
    setAssignModal(exam);
    setAssignedIds(exam.assignedStudents || []);
    try {
      const { data } = await api.get('/admin/users?role=student');
      if (data.success) setAllStudents(data.data);
    } catch (e) { console.error(e); }
  };

  const handleAssignSave = async () => {
    setAssignSaving(true);
    try {
      await api.post(`/exams/${assignModal._id}/assign-students`, { studentIds: assignedIds });
      setAssignModal(null);
      onRefresh();
    } catch (err) { alert(err.response?.data?.message || 'Failed to assign.'); }
    finally { setAssignSaving(false); }
  };

  const addQ = () => setQuestions(p => [...p, { ...defaultQuestion }]);
  const removeQ = (i) => questions.length > 1 && setQuestions(p => p.filter((_, idx) => idx !== i));
  const updateQ = (i, field, val) => setQuestions(p => { const u = [...p]; u[i] = { ...u[i], [field]: val }; return u; });
  const updateOpt = (qi, oi, val) => setQuestions(p => { const u = [...p]; u[qi].options[oi] = val; return u; });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Exams</h1>
          <p className="text-sm text-gray-500 mt-0.5">Create, manage and monitor your assessments.</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm">
          <Plus className="h-4 w-4" /> New Exam
        </button>
      </div>

      {loadingExams ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
      ) : exams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 text-center">
          <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No exams yet</p>
          <button onClick={openCreate} className="mt-4 text-blue-600 text-sm font-bold hover:underline">Create your first exam →</button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Exam', 'Course', 'Duration', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {exams.map(exam => (
                  <tr key={exam._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-semibold text-gray-900">{exam.title}</td>
                    <td className="px-5 py-4 text-gray-500">{exam.courseCode}</td>
                    <td className="px-5 py-4 text-gray-500 flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{exam.durationMinutes}m</td>
                    <td className="px-5 py-4"><StatusBadge status={getExamStatus(exam)} /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => openEdit(exam)} className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors">Edit</button>
                        <button onClick={() => handleViewResults(exam)} className="text-xs font-bold text-green-600 hover:bg-green-50 px-3 py-1.5 rounded-lg border border-green-200 transition-colors">Results</button>
                        <button onClick={() => openAssign(exam)} className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors">Assign</button>
                        <button onClick={() => handleNotify(exam)} disabled={notifying === exam._id}
                          className="text-xs font-bold text-purple-600 hover:bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200 transition-colors disabled:opacity-50">
                          {notifying === exam._id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Notify'}
                        </button>
                        <button onClick={() => handleDelete(exam._id)} disabled={deleting === exam._id}
                          className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 transition-colors disabled:opacity-50">
                          {deleting === exam._id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-extrabold text-gray-900 text-lg">{editExam ? 'Edit Exam' : 'Create New Exam'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-6">
              {msg.text && (
                <div className={`px-4 py-3 rounded-xl text-sm font-medium ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>{msg.text}</div>
              )}
              {/* Exam Details */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">Exam Title</label>
                  <input required value={examDetails.title} onChange={e => setExamDetails(p => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white" placeholder="e.g. Midterm: Data Structures" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">Description <span className="text-gray-400 font-normal">(optional)</span></label>
                  <textarea rows={2} value={examDetails.description} onChange={e => setExamDetails(p => ({ ...p, description: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white resize-none" placeholder="Brief description of this exam..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">Course Code</label>
                  <input required value={examDetails.courseCode} onChange={e => setExamDetails(p => ({ ...p, courseCode: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white uppercase" placeholder="CS-201" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">Duration (mins)</label>
                  <input required type="number" min="1" value={examDetails.durationMinutes} onChange={e => setExamDetails(p => ({ ...p, durationMinutes: +e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Start Time</label>
                    <input required type="datetime-local" value={examDetails.startTime} onChange={e => setExamDetails(p => ({ ...p, startTime: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">End Time</label>
                    <input required type="datetime-local" value={examDetails.endTime} onChange={e => setExamDetails(p => ({ ...p, endTime: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
                  </div>
                </div>
              </div>
              {/* Security */}
              <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={examDetails.securitySettings.requireWebcam} onChange={e => setExamDetails(p => ({ ...p, securitySettings: { ...p.securitySettings, requireWebcam: e.target.checked } }))} className="h-4 w-4 text-blue-600 rounded" />
                  Force Webcam
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={examDetails.securitySettings.strictBrowserLock} onChange={e => setExamDetails(p => ({ ...p, securitySettings: { ...p.securitySettings, strictBrowserLock: e.target.checked } }))} className="h-4 w-4 text-blue-600 rounded" />
                  Browser Lock
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={examDetails.negativeMarking} onChange={e => setExamDetails(p => ({ ...p, negativeMarking: e.target.checked }))} className="h-4 w-4 text-red-500 rounded" />
                  <span>Negative Marking</span>
                </label>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-600">Tolerance:</span>
                  <select value={examDetails.securitySettings.toleranceLimit} onChange={e => setExamDetails(p => ({ ...p, securitySettings: { ...p.securitySettings, toleranceLimit: +e.target.value } }))} className="border border-gray-200 rounded-lg px-2 py-1 text-sm outline-none">
                    <option value={1}>1 (Strict)</option>
                    <option value={3}>3 (Standard)</option>
                    <option value={5}>5 (Lenient)</option>
                  </select>
                </div>
              </div>
              {/* Questions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900 text-sm">Questions ({questions.length})</h3>
                  <button type="button" onClick={() => setShowAI(p => !p)} className="flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200 transition-colors">
                    <Zap className="h-3.5 w-3.5" /> AI Generate
                  </button>
                </div>
                {showAI && (
                  <div className="mb-4 p-4 bg-purple-50 rounded-xl border border-purple-200 space-y-3">
                    {/* Mode toggle */}
                    <div className="flex gap-2">
                      {[['topic','By Topic'],['document','From Text'],['pdf','From PDF']].map(([m,l]) => (
                        <button key={m} type="button" onClick={() => setAiMode(m)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${aiMode === m ? 'bg-purple-600 text-white' : 'bg-white border border-purple-200 text-purple-600 hover:bg-purple-50'}`}>
                          {l}
                        </button>
                      ))}
                    </div>

                    {aiMode === 'topic' && (
                      <div className="flex flex-wrap gap-3 items-end">
                        <div className="flex-1 min-w-32">
                          <label className="block text-xs font-bold text-purple-700 mb-1">Topic</label>
                          <input value={aiTopic} onChange={e => setAiTopic(e.target.value)} placeholder="e.g. Binary Trees" className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-400" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-purple-700 mb-1">Type</label>
                          <select value={aiType} onChange={e => setAiType(e.target.value)} className="px-3 py-2 border border-purple-200 rounded-lg text-sm outline-none">
                            <option value="mcq">MCQ</option>
                            <option value="multiple_correct">Multi-Correct</option>
                            <option value="short_answer">Short Answer</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-purple-700 mb-1">Count</label>
                          <select value={aiCount} onChange={e => setAiCount(+e.target.value)} className="px-3 py-2 border border-purple-200 rounded-lg text-sm outline-none">
                            {[3,5,8,10].map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-purple-700 mb-1">Difficulty</label>
                          <select value={aiDiff} onChange={e => setAiDiff(e.target.value)} className="px-3 py-2 border border-purple-200 rounded-lg text-sm outline-none">
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                          </select>
                        </div>
                        <button type="button" onClick={handleAIGenerate} disabled={aiLoading}
                          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-700 disabled:opacity-60 transition-colors">
                          {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Zap className="h-4 w-4" /> Generate</>}
                        </button>
                      </div>
                    )}

                    {aiMode === 'document' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-purple-700 mb-1">Paste Syllabus / Document Text</label>
                          <textarea rows={5} value={aiDocument} onChange={e => setAiDocument(e.target.value)}
                            placeholder="Paste your syllabus, lecture notes, or any document text here. The AI will generate questions based on this content..."
                            className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-400 resize-y" />
                          <p className="text-[10px] text-purple-500 mt-1">{aiDocument.length} chars (min 50 required)</p>
                        </div>
                        <div className="flex flex-wrap gap-3 items-end">
                          <div>
                            <label className="block text-xs font-bold text-purple-700 mb-1">Type</label>
                            <select value={aiType} onChange={e => setAiType(e.target.value)} className="px-3 py-2 border border-purple-200 rounded-lg text-sm outline-none">
                              <option value="mcq">MCQ</option>
                              <option value="multiple_correct">Multi-Correct</option>
                              <option value="short_answer">Short Answer</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-purple-700 mb-1">Count</label>
                            <select value={aiCount} onChange={e => setAiCount(+e.target.value)} className="px-3 py-2 border border-purple-200 rounded-lg text-sm outline-none">
                              {[3,5,8,10].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-purple-700 mb-1">Difficulty</label>
                            <select value={aiDiff} onChange={e => setAiDiff(e.target.value)} className="px-3 py-2 border border-purple-200 rounded-lg text-sm outline-none">
                              <option value="easy">Easy</option>
                              <option value="medium">Medium</option>
                              <option value="hard">Hard</option>
                            </select>
                          </div>
                          <button type="button" onClick={handleAIGenerate} disabled={aiLoading || aiDocument.trim().length < 50}
                            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-700 disabled:opacity-60 transition-colors">
                            {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><FileUp className="h-4 w-4" /> Generate from Doc</>}
                          </button>
                        </div>
                      </div>
                    )}
                    {aiMode === 'pdf' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-purple-700 mb-1">Upload PDF Document</label>
                          <input type="file" accept=".pdf" onChange={handlePDFUpload}
                            className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700" />
                          <p className="text-[10px] text-purple-500 mt-1">Upload a PDF file (syllabus, notes, etc.) to generate questions</p>
                        </div>
                        <div className="flex flex-wrap gap-3 items-end">
                          <div>
                            <label className="block text-xs font-bold text-purple-700 mb-1">Type</label>
                            <select value={aiType} onChange={e => setAiType(e.target.value)} className="px-3 py-2 border border-purple-200 rounded-lg text-sm outline-none">
                              <option value="mcq">MCQ</option>
                              <option value="multiple_correct">Multi-Correct</option>
                              <option value="short_answer">Short Answer</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-purple-700 mb-1">Count</label>
                            <select value={aiCount} onChange={e => setAiCount(+e.target.value)} className="px-3 py-2 border border-purple-200 rounded-lg text-sm outline-none">
                              {[3,5,8,10].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-purple-700 mb-1">Difficulty</label>
                            <select value={aiDiff} onChange={e => setAiDiff(e.target.value)} className="px-3 py-2 border border-purple-200 rounded-lg text-sm outline-none">
                              <option value="easy">Easy</option>
                              <option value="medium">Medium</option>
                              <option value="hard">Hard</option>
                            </select>
                          </div>
                          {pdfUploading && (
                            <div className="flex items-center gap-2 text-purple-600 text-sm">
                              <Loader2 className="h-4 w-4 animate-spin" /> Processing PDF...
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                  {questions.map((q, qi) => (
                    <div key={qi} className="p-4 border border-gray-200 rounded-xl bg-gray-50/50 relative group">
                      {questions.length > 1 && (
                        <button type="button" onClick={() => removeQ(qi)} className="absolute -top-2 -right-2 h-6 w-6 bg-white border border-red-200 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                          <X className="h-3 w-3" />
                        </button>
                      )}
                      {/* Question type selector */}
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className="text-xs font-bold text-gray-500">Q{qi + 1}</span>
                        {['mcq','multiple_correct','short_answer'].map(t => (
                          <button key={t} type="button" onClick={() => updateQ(qi, 'type', t)}
                            className={`text-xs px-2.5 py-1 rounded-full font-bold border transition-colors ${
                              q.type === t ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-500 hover:border-blue-400'
                            }`}>
                            {t === 'mcq' ? 'MCQ' : t === 'multiple_correct' ? 'Multi-Correct' : 'Short Answer'}
                          </button>
                        ))}
                        <div className="ml-auto flex items-center gap-2">
                          <span className="text-xs text-gray-500">Marks:</span>
                          <input type="number" min="1" value={q.marks} onChange={e => updateQ(qi, 'marks', +e.target.value)} className="w-14 px-2 py-1 border border-gray-200 rounded-lg text-xs outline-none" />
                          {examDetails.negativeMarking && (
                            <><span className="text-xs text-red-500">-ve:</span>
                            <input type="number" min="0" step="0.25" value={q.negativeMark} onChange={e => updateQ(qi, 'negativeMark', +e.target.value)} className="w-14 px-2 py-1 border border-red-200 rounded-lg text-xs outline-none" /></>
                          )}
                        </div>
                      </div>
                      <textarea required rows={2} value={q.questionText} onChange={e => updateQ(qi, 'questionText', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-3" placeholder="Enter question..." />
                      {/* Image attachment */}
                      <div className="mb-3 flex items-center gap-2">
                        <input type="file" accept="image/*" className="hidden" id={`img-${qi}`}
                          onChange={e => handleImageUpload(e, qi)} />
                        <label htmlFor={`img-${qi}`}
                          className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-blue-600 cursor-pointer px-2.5 py-1.5 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                          <Image className="h-3.5 w-3.5" /> Add Image
                        </label>
                        {q.image && (
                          <div className="flex items-center gap-2">
                            <img src={q.image} alt="question" className="h-10 w-16 object-cover rounded border border-gray-200" />
                            <button type="button" onClick={() => updateQ(qi, 'image', null)}
                              className="text-xs text-red-500 hover:underline">Remove</button>
                          </div>
                        )}
                      </div>
                      {/* MCQ options */}
                      {q.type === 'mcq' && (
                        <div className="grid grid-cols-2 gap-2">
                          {q.options.map((opt, oi) => (
                            <div key={oi} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${q.correctOptionIndex === oi ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white'}`}>
                              <input type="radio" name={`correct-${qi}`} checked={q.correctOptionIndex === oi} onChange={() => updateQ(qi, 'correctOptionIndex', oi)} className="h-3.5 w-3.5 text-green-600" />
                              <input value={opt} onChange={e => updateOpt(qi, oi, e.target.value)} required className="flex-1 outline-none bg-transparent text-sm" placeholder={`Option ${oi + 1}`} />
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Multiple correct options */}
                      {q.type === 'multiple_correct' && (
                        <div className="grid grid-cols-2 gap-2">
                          {q.options.map((opt, oi) => {
                            const checked = (q.correctOptionIndices || []).includes(oi);
                            return (
                              <div key={oi} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${checked ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white'}`}>
                                <input type="checkbox" checked={checked} onChange={() => {
                                  const cur = q.correctOptionIndices || [];
                                  updateQ(qi, 'correctOptionIndices', checked ? cur.filter(x => x !== oi) : [...cur, oi]);
                                }} className="h-3.5 w-3.5 text-green-600" />
                                <input value={opt} onChange={e => updateOpt(qi, oi, e.target.value)} required className="flex-1 outline-none bg-transparent text-sm" placeholder={`Option ${oi + 1}`} />
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {/* Short answer model answer */}
                      {q.type === 'short_answer' && (
                        <div>
                          <label className="text-xs font-bold text-gray-500 mb-1 block">Model Answer <span className="text-gray-400 font-normal">(for reference)</span></label>
                          <textarea rows={2} value={q.modelAnswer} onChange={e => updateQ(qi, 'modelAnswer', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                            placeholder="Expected answer..." />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addQ} className="mt-3 w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 font-bold hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
                  <Plus className="h-4 w-4" /> Add Question
                </button>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editExam ? 'Save Changes' : 'Publish Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Per-exam Results Modal */}
      {examResults && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="font-extrabold text-gray-900">{examResults.exam.title} — Results</h2>
                <p className="text-xs text-gray-400">{examResults.results.length} submission(s)</p>
              </div>
              <button onClick={() => setExamResults(null)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6">
              {examResults.results.length === 0 ? (
                <p className="text-center text-gray-400 py-10">No submissions yet for this exam.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>{['Student','Score','Trust','Time Taken','Status','Detail'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {examResults.results.map(r => (
                        <ExamResultRow key={r._id} r={r} exam={examResults.exam} onGraded={refreshExamResults} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assign Students Modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-extrabold text-gray-900 text-base">Assign Students — {assignModal.title}</h2>
              <button onClick={() => setAssignModal(null)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-6">
              <p className="text-xs text-gray-500 mb-3">Select students who can access this exam:</p>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {allStudents.length === 0 ? (
                  <p className="text-center text-gray-400 py-6 text-sm">No students registered yet.</p>
                ) : allStudents.map(s => (
                  <label key={s._id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox"
                      checked={assignedIds.includes(s._id)}
                      onChange={() => setAssignedIds(p => p.includes(s._id) ? p.filter(x => x !== s._id) : [...p, s._id])}
                      className="h-4 w-4 text-blue-600 rounded" />
                    <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">{s.name[0]?.toUpperCase()}</div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-400">{s.email}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-500">{assignedIds.length} selected</span>
                <div className="flex gap-2">
                  <button onClick={() => setAssignModal(null)} className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
                  <button onClick={handleAssignSave} disabled={assignSaving} className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 disabled:opacity-60">
                    {assignSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* React Image Crop Modal */}
      {cropModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-extrabold text-gray-900 flex items-center gap-2"><Crop className="h-5 w-5" /> Crop Image</h2>
              <button onClick={() => setCropModal(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-6">
              <p className="text-xs text-gray-500 mb-3">Drag the crop box to reposition. Drag edges/corners to resize. Click Apply when done.</p>
              <div className="flex justify-center mb-4 bg-gray-100 rounded-lg p-4">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={crop.aspect}
                  style={{ maxWidth: '100%' }}
                >
                  <img
                    src={cropModal.src}
                    onLoad={onImageLoad}
                    style={{ maxHeight: '500px', maxWidth: '100%', display: 'block' }}
                    alt="Crop preview"
                  />
                </ReactCrop>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-bold text-gray-600">Aspect Ratio:</span>
                {[[16/9,'16:9'],[4/3,'4:3'],[1,'1:1'],[3/4,'3:4'],[null,'Free']].map(([val,label]) => (
                  <button key={label} type="button" onClick={() => setCrop(c => ({ ...c, aspect: val }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${crop.aspect === val ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setCropModal(null)} className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
                <button onClick={applyCrop} className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700">
                  <Crop className="h-4 w-4" /> Apply Crop
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main Component (layout only for now) ──────────────────────────────────
const ExaminerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [loadingExams, setLoadingExams] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) return navigate('/');
    const parsed = JSON.parse(stored);
    if (parsed.role !== 'examiner') return navigate('/dashboard');
    setUser(parsed);
  }, [navigate]);

  const fetchExams = useCallback(async (uid) => {
    setLoadingExams(true);
    try {
      const { data } = await api.get(`/exams/examiner/${uid}`);
      if (data.success) setExams(data.data);
    } catch (e) { console.error(e); }
    finally { setLoadingExams(false); }
  }, []);

  const fetchResults = useCallback(async (uid) => {
    try {
      const { data } = await api.get(`/results?examinerId=${uid}`);
      if (data.success) setResults(data.data);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    if (user) { fetchExams(user.id); fetchResults(user.id); }
  }, [user, fetchExams, fetchResults]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'exams', label: 'Exams', icon: FileText },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'results', label: 'Results', icon: BarChart2 },
    { id: 'help', label: 'Help', icon: HelpCircle },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 text-white flex flex-col transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="h-16 flex items-center px-6 border-b border-gray-800 shrink-0">
          <ShieldAlert className="h-6 w-6 text-blue-400 mr-2" />
          <span className="font-extrabold text-white tracking-tight text-sm">Automatic Proctoring System</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 mb-3 mt-2">Menu</p>
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors
                ${activeTab === item.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <item.icon className="h-4 w-4" /> {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button onClick={() => { localStorage.removeItem('user'); localStorage.removeItem('token'); navigate('/'); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400 hover:bg-red-500/10 rounded-xl font-medium text-sm transition-colors">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Sidebar overlay on mobile */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top navbar */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center px-4 sm:px-6 gap-4 sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-xl">
            <Menu className="h-5 w-5" />
          </button>
          <div className="relative flex-1 max-w-xs hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input placeholder="Search exams..." className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell user={user} />
            <ProfileDropdown user={user} onNavigate={setActiveTab} navigate={navigate} />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardHome user={user} exams={exams} results={results} onNavigate={setActiveTab} />
            )}
            {activeTab === 'exams' && <ExamsTab user={user} exams={exams} loadingExams={loadingExams} onRefresh={() => fetchExams(user.id)} />}
            {activeTab === 'students' && <StudentsTab />}
            {activeTab === 'results' && <ResultsTab user={user} results={results} exams={exams} onRefresh={() => fetchResults(user.id)} />}
            {activeTab === 'help' && <HelpTab />}
            {activeTab === 'settings' && <SettingsTab user={user} />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ExaminerDashboard;
