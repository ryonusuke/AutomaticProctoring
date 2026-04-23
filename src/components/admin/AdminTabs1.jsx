import { useState } from 'react';
import {
  Search, Eye, Trash2, Loader2, CheckCircle2,
  AlertTriangle, XCircle, ShieldCheck, ShieldAlert, Users, X, UserCog, Ban, UserCheck
} from 'lucide-react';
import api from '../../services/api';

export const KycBadge = ({ status }) => {
  const map = { approved: 'bg-green-100 text-green-700', pending: 'bg-yellow-100 text-yellow-700', rejected: 'bg-red-100 text-red-700', none: 'bg-gray-100 text-gray-500' };
  const icons = { approved: CheckCircle2, pending: AlertTriangle, rejected: XCircle };
  const Icon = icons[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold capitalize ${map[status] || map.none}`}>
      {Icon && <Icon className="h-3 w-3" />} {status || 'none'}
    </span>
  );
};

export const UsersTab = ({ students, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [acting, setActing] = useState(null);
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);

  const filtered = students.filter(s =>
    (s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())) &&
    (roleFilter === 'all' || s.role === roleFilter)
  );

  const deleteUser = async (id) => {
    if (!window.confirm('Permanently delete this user? This cannot be undone.')) return;
    setActing(id + '_delete');
    try {
      await api.delete(`/admin/users/${id}`);
      onRefresh();
    } catch { alert('Failed to delete.'); }
    finally { setActing(null); }
  };

  const updateRole = async (id, newRole) => {
    if (!window.confirm(`Change user role to ${newRole}?`)) return;
    setActing(id + '_role');
    try {
      await api.put(`/admin/users/${id}/role`, { role: newRole });
      onRefresh();
      setSelectedUser(null);
    } catch { alert('Failed to update role.'); }
    finally { setActing(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">{students.length} total users · {students.filter(s => s.role === 'student').length} students · {students.filter(s => s.role === 'examiner').length} teachers</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex flex-wrap gap-1">
            {['all', 'student', 'examiner', 'admin'].map(r => (
              <button key={r} onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${
                  roleFilter === r ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}>{r === 'examiner' ? 'Teachers' : r}</button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 w-full sm:w-56" />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-gray-100">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-10 text-sm">No users found.</p>
          ) : filtered.map(s => (
            <div key={s._id} className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                  s.role === 'admin' ? 'bg-red-100 text-red-700' : s.role === 'examiner' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>{s.name[0]?.toUpperCase()}</div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{s.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <KycBadge status={s.kyc?.status} />
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize ${
                      s.role === 'admin' ? 'bg-red-100 text-red-700' : s.role === 'examiner' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>{s.role === 'examiner' ? 'Teacher' : s.role}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => setSelectedUser(s)} className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-200 flex items-center gap-1">
                  <UserCog className="h-3 w-3" />
                </button>
                <button onClick={() => deleteUser(s._id)} disabled={acting === s._id + '_delete'}
                  className="text-xs font-bold text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-200 disabled:opacity-40 flex items-center gap-1">
                  {acting === s._id + '_delete' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                </button>
              </div>
            </div>
          ))}
        </div>
        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['User', 'Role', 'KYC Status', 'AI Score', 'Joined', 'Actions'].map(h => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">No users found.</td></tr>
              ) : filtered.map(s => (
                <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                        s.role === 'admin' ? 'bg-red-100 text-red-700' : s.role === 'examiner' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>{s.name[0]?.toUpperCase()}</div>
                      <div>
                        <p className="font-semibold text-gray-900">{s.name}</p>
                        <p className="text-xs text-gray-400">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${
                      s.role === 'admin' ? 'bg-red-100 text-red-700' : s.role === 'examiner' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>{s.role === 'examiner' ? 'Teacher' : s.role}</span>
                  </td>
                  <td className="px-5 py-4"><KycBadge status={s.kyc?.status} /></td>
                  <td className="px-5 py-4 font-mono text-sm text-gray-600">{s.kyc?.aiConfidenceScore ? `${s.kyc.aiConfidenceScore}%` : '—'}</td>
                  <td className="px-5 py-4 text-xs text-gray-400">{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedUser(s)}
                        className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-200 transition-colors flex items-center gap-1">
                        <UserCog className="h-3 w-3" /> Manage
                      </button>
                      <button onClick={() => deleteUser(s._id)} disabled={acting === s._id + '_delete'}
                        className="text-xs font-bold text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-200 transition-colors disabled:opacity-40 flex items-center gap-1">
                        {acting === s._id + '_delete' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">Manage User</h2>
                <p className="text-sm text-gray-500">{selectedUser.name}</p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-gray-100 rounded-full"><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Change Role</p>
                <div className="flex gap-2">
                  {['student', 'examiner', 'admin'].map(role => (
                    <button key={role} onClick={() => updateRole(selectedUser._id, role)}
                      disabled={acting === selectedUser._id + '_role' || selectedUser.role === role}
                      className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-colors ${
                        selectedUser.role === role 
                          ? 'bg-gray-900 text-white' 
                          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40'
                      }`}>
                      {role === 'examiner' ? 'Teacher' : role}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">User Details</p>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">Email:</span> <span className="font-semibold">{selectedUser.email}</span></p>
                  <p><span className="text-gray-500">Joined:</span> <span className="font-semibold">{new Date(selectedUser.createdAt).toLocaleDateString()}</span></p>
                  <p><span className="text-gray-500">KYC:</span> <KycBadge status={selectedUser.kyc?.status} /></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const StudentsTab = UsersTab;

export const KycTab = ({ students, onRefresh }) => {
  const [selected, setSelected] = useState(null);
  const [acting, setActing] = useState(false);
  const [filter, setFilter] = useState('pending');

  const filtered = students.filter(s =>
    s.kyc?.status &&
    (filter === 'all' ? true : s.kyc?.status === filter)
  );

  const handleKycAction = async (studentId, status) => {
    setActing(true);
    try {
      const { data } = await api.put(`/admin/kyc/${studentId}/review`, { status });
      if (data.success) { onRefresh(); setSelected(null); }
    } catch { alert('Action failed.'); }
    finally { setActing(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">KYC Review</h1>
          <p className="text-sm text-gray-500 mt-0.5">Review and approve student identity verifications.</p>
        </div>
        <div className="flex gap-2">
          {['pending', 'approved', 'rejected', 'all'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${filter === f ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-gray-100">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-10 text-sm">No students in this category.</p>
          ) : filtered.map(s => (
            <div key={s._id} className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {s.kyc?.faceImage ? (
                  <img src={s.kyc.faceImage} alt="" className="h-9 w-9 rounded-full object-cover border border-gray-200 scale-x-[-1] shrink-0" />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-sm shrink-0">{s.name[0]?.toUpperCase()}</div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{s.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <KycBadge status={s.kyc?.status} />
                    {s.kyc?.aiConfidenceScore && <span className="text-[10px] font-mono text-gray-500">{s.kyc.aiConfidenceScore}%</span>}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelected(s)} disabled={!s.kyc?.idImage}
                className="text-xs font-bold text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 flex items-center gap-1 shrink-0">
                <Eye className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Student', 'KYC Status', 'AI Score', 'Submitted', 'Action'].map(h => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400">No students in this category.</td></tr>
              ) : filtered.map(s => (
                <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {s.kyc?.faceImage ? (
                        <img src={s.kyc.faceImage} alt="" className="h-9 w-9 rounded-full object-cover border border-gray-200 scale-x-[-1]" />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-sm">{s.name[0]?.toUpperCase()}</div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">{s.name}</p>
                        <p className="text-xs text-gray-400">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4"><KycBadge status={s.kyc?.status} /></td>
                  <td className="px-5 py-4 font-mono text-sm">{s.kyc?.aiConfidenceScore ? `${s.kyc.aiConfidenceScore}%` : '—'}</td>
                  <td className="px-5 py-4 text-xs text-gray-400">{s.kyc?.verifiedAt ? new Date(s.kyc.verifiedAt).toLocaleDateString() : '—'}</td>
                  <td className="px-5 py-4">
                    <button onClick={() => setSelected(s)} disabled={!s.kyc?.idImage}
                      className="text-xs font-bold text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 transition-colors disabled:opacity-40 flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" /> Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">Biometric Review: {selected.name}</h2>
                <p className="text-sm text-gray-500">{selected.email}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 rounded-full"><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="p-6 bg-gray-50 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Government ID</h3>
                <div className="bg-black rounded-xl aspect-video overflow-hidden flex items-center justify-center">
                  {selected.kyc?.idImage ? <img src={selected.kyc.idImage} alt="ID" className="w-full h-full object-contain" /> : <span className="text-gray-500 text-sm">No ID Provided</span>}
                </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2"><Users className="h-4 w-4" /> Live Webcam Selfie</h3>
                <div className="bg-black rounded-xl aspect-video overflow-hidden flex items-center justify-center">
                  {selected.kyc?.faceImage ? <img src={selected.kyc.faceImage} alt="Face" className="w-full h-full object-cover scale-x-[-1]" /> : <span className="text-gray-500 text-sm">No Selfie Provided</span>}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">AI Confidence:</span>
                <span className={`ml-2 font-mono text-lg font-black ${(selected.kyc?.aiConfidenceScore || 0) > 80 ? 'text-green-600' : 'text-red-600'}`}>
                  {selected.kyc?.aiConfidenceScore || 0}%
                </span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => handleKycAction(selected._id, 'rejected')} disabled={acting}
                  className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-5 py-2 rounded-xl font-bold text-sm flex items-center gap-2">
                  {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />} Revoke
                </button>
                <button onClick={() => handleKycAction(selected._id, 'approved')} disabled={acting || selected.kyc?.status === 'approved'}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-xl font-bold shadow-md text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {selected.kyc?.status === 'approved' ? 'Already Approved' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
