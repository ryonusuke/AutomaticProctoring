import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard, Users, ShieldCheck, FileText, BarChart2,
  LifeBuoy, Megaphone, Settings, LogOut, ShieldAlert, Search,
  Menu, Bell, ChevronDown, Loader2, CheckCircle2, AlertTriangle,
  XCircle, Eye, X, Clock, TrendingUp, Activity, BookOpen,
  MessageSquare, UserCheck, Trash2, Send, RefreshCw
} from 'lucide-react';
import api from '../services/api';
import { StudentsTab, KycTab } from '../components/admin/AdminTabs1';
import { ExamsTab, ResultsTab, TicketsTab, AnnouncementsTab, SettingsTab } from '../components/admin/AdminTabs2';

// ── Shared ─────────────────────────────────────────────────────────────────
const KycBadge = ({ status }) => {
  const map = {
    approved: 'bg-green-100 text-green-700',
    pending:  'bg-yellow-100 text-yellow-700',
    rejected: 'bg-red-100 text-red-700',
    none:     'bg-gray-100 text-gray-500',
  };
  const icons = { approved: CheckCircle2, pending: AlertTriangle, rejected: XCircle, none: null };
  const Icon = icons[status] || null;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold capitalize ${map[status] || map.none}`}>
      {Icon && <Icon className="h-3 w-3" />} {status || 'none'}
    </span>
  );
};

// ── Dashboard Home ──────────────────────────────────────────────────────────
const DashboardHome = ({ students, exams, results, tickets, onNavigate }) => {
  const pending = students.filter(s => s.kyc?.status === 'pending').length;
  const openTickets = tickets.filter(t => t.status === 'open').length;
  const totalViolations = results.reduce((a, r) => a + (r.violations?.length || 0), 0);
  const teacherTickets = tickets.filter(t => t.userRole === 'examiner').length;

  const stats = [
    { label: 'Total Users', value: students.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', tab: 'students' },
    { label: 'KYC Pending', value: pending, icon: ShieldCheck, color: 'text-yellow-600', bg: 'bg-yellow-50', tab: 'kyc' },
    { label: 'Total Exams', value: exams.length, icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50', tab: 'exams' },
    { label: 'Open Tickets', value: openTickets, icon: LifeBuoy, color: 'text-red-600', bg: 'bg-red-50', tab: 'tickets' },
    { label: 'Results', value: results.length, icon: BarChart2, color: 'text-green-600', bg: 'bg-green-50', tab: 'results' },
    { label: 'Violations', value: totalViolations, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50', tab: 'results' },
  ];

  const recentUsers = [...students].slice(0, 5);
  const recentTickets = [...tickets].filter(t => t.status === 'open').slice(0, 4);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Admin Overview</h1>
        <p className="text-sm text-gray-500 mt-1">System-wide status and quick actions.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map(s => (
          <button key={s.label} onClick={() => onNavigate(s.tab)}
            className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-left hover:shadow-md hover:border-blue-200 transition-all">
            <div className={`h-9 w-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className="text-xl font-extrabold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Recent Users</h2>
            <button onClick={() => onNavigate('students')} className="text-xs text-blue-600 font-bold hover:underline">View all →</button>
          </div>
          <div className="space-y-3">
            {recentUsers.map(s => (
              <div key={s._id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                    s.role === 'admin' ? 'bg-red-100 text-red-700' : s.role === 'examiner' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {s.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.email}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                  s.role === 'admin' ? 'bg-red-100 text-red-700' : s.role === 'examiner' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>{s.role === 'examiner' ? 'Teacher' : s.role}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Open Tickets */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Open Support Tickets</h2>
            <button onClick={() => onNavigate('tickets')} className="text-xs text-blue-600 font-bold hover:underline">View all →</button>
          </div>
          {recentTickets.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No open tickets.</p>
          ) : (
            <div className="space-y-3">
              {recentTickets.map(t => (
                <div key={t._id} className="flex items-start justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{t.subject}</p>
                    <p className="text-xs text-gray-400">{t.userId?.name || t.studentId?.name || 'Unknown'} · {t.category}</p>
                  </div>
                  <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full shrink-0 ml-2">open</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => onNavigate('kyc')} className="flex items-center gap-2 px-4 py-2.5 bg-yellow-600 text-white rounded-xl text-sm font-bold hover:bg-yellow-700 transition-colors">
            <ShieldCheck className="h-4 w-4 shrink-0" /> Review KYC ({pending} pending)
          </button>
          <button onClick={() => onNavigate('tickets')} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">
            <LifeBuoy className="h-4 w-4 shrink-0" /> <span>Support Tickets <span className="hidden sm:inline">({openTickets} open · {teacherTickets} from teachers)</span><span className="sm:hidden">({openTickets})</span></span>
          </button>
          <button onClick={() => onNavigate('students')} className="flex items-center gap-2 px-4 py-2.5 bg-gray-700 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors">
            <Users className="h-4 w-4 shrink-0" /> Manage Users ({students.length})
          </button>
          <button onClick={() => onNavigate('announcements')} className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-colors">
            <Megaphone className="h-4 w-4 shrink-0" /> Send Announcement
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ──────────────────────────────────────────────────────────
const ADMIN_TABS = ['dashboard','students','kyc','exams','results','tickets','announcements','settings'];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [admin, setAdmin] = useState(null);
  const tabFromUrl = searchParams.get('tab');
  const activeTab = ADMIN_TABS.includes(tabFromUrl) ? tabFromUrl : 'dashboard';
  const setActiveTab = (tab) => { setSearchParams(tab === 'dashboard' ? {} : { tab }, { replace: false }); setSidebarOpen(false); };
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'admin') { navigate('/', { replace: true }); return; }
    setAdmin(user);
    loadAll();
  }, [navigate]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, e, r, t] = await Promise.allSettled([
        api.get('/admin/users'),
        api.get('/exams'),
        api.get('/results'),
        api.get('/tickets'),
      ]);
      if (s.status === 'fulfilled' && s.value.data.success) setStudents(s.value.data.data);
      if (e.status === 'fulfilled' && e.value.data.success) setExams(e.value.data.data);
      if (r.status === 'fulfilled' && r.value.data.success) setResults(r.value.data.data);
      if (t.status === 'fulfilled' && t.value.data.success) setTickets(t.value.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Users', icon: Users },
    { id: 'kyc', label: 'KYC Review', icon: ShieldCheck, badge: students.filter(s => s.kyc?.status === 'pending').length },
    { id: 'exams', label: 'Exams', icon: BookOpen },
    { id: 'results', label: 'Results', icon: BarChart2 },
    { id: 'tickets', label: 'Support Tickets', icon: LifeBuoy, badge: tickets.filter(t => t.status === 'open').length },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  if (!admin || loading) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 text-white flex flex-col transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="h-16 flex items-center px-6 border-b border-gray-800 shrink-0">
          <ShieldAlert className="h-6 w-6 text-red-400 mr-2 shrink-0" />
          <div>
            <span className="font-extrabold text-white text-sm tracking-tight">Automatic Proctoring System</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 mb-3 mt-2">Admin Panel</p>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors
                ${activeTab === item.id ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge > 0 && (
                <span className="h-5 w-5 bg-yellow-500 text-gray-900 text-[10px] font-bold rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button onClick={() => { localStorage.removeItem('user'); localStorage.removeItem('token'); navigate('/', { replace: true }); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400 hover:bg-red-500/10 rounded-xl font-medium text-sm transition-colors">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center px-4 sm:px-6 gap-4 sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-xl">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-500" />
            <span className="font-bold text-gray-900 text-sm hidden sm:block">Automatic Proctoring System — Admin</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button onClick={loadAll} className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors" title="Refresh data">
              <RefreshCw className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200">
              <div className="h-7 w-7 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-xs">
                {admin?.name?.[0]?.toUpperCase()}
              </div>
              <span className="text-sm font-semibold text-gray-700 hidden sm:block">{admin?.name}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <DashboardHome students={students} exams={exams} results={results} tickets={tickets} onNavigate={(tab) => setActiveTab(tab)} />}
            {activeTab === 'students' && <StudentsTab students={students} onRefresh={loadAll} />}
            {activeTab === 'kyc' && <KycTab students={students} onRefresh={loadAll} />}
            {activeTab === 'exams' && <ExamsTab exams={exams} />}
            {activeTab === 'results' && <ResultsTab results={results} />}
            {activeTab === 'tickets' && <TicketsTab tickets={tickets} onRefresh={loadAll} />}
            {activeTab === 'announcements' && <AnnouncementsTab />}
            {activeTab === 'settings' && <SettingsTab admin={admin} />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
