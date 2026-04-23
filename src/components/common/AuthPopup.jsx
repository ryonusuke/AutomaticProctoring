import { useState, useEffect } from 'react';
import { Mail, Lock, User, ShieldCheck, Loader2, X, Eye, EyeOff, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

// ── Password strength ──────────────────────────────────────────────────────
const getStrength = (pass) => {
  let score = 0;
  if (pass.length >= 8) score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;
  if (score <= 1) return { label: 'Weak', color: 'bg-red-500', width: 'w-1/4', text: 'text-red-500' };
  if (score === 2) return { label: 'Fair', color: 'bg-yellow-400', width: 'w-2/4', text: 'text-yellow-500' };
  if (score === 3) return { label: 'Good', color: 'bg-blue-500', width: 'w-3/4', text: 'text-blue-500' };
  return { label: 'Strong', color: 'bg-green-500', width: 'w-full', text: 'text-green-500' };
};

// ── Google SVG icon ────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

// ── OTP Input ──────────────────────────────────────────────────────────────
const OTPInput = ({ value, onChange }) => {
  const digits = value.split('').concat(Array(6).fill('')).slice(0, 6);
  const handleKey = (e, i) => {
    if (e.key === 'Backspace') {
      const next = value.slice(0, i) + value.slice(i + 1);
      onChange(next);
      if (i > 0) document.getElementById(`otp-${i - 1}`)?.focus();
    } else if (/^\d$/.test(e.key)) {
      const next = value.slice(0, i) + e.key + value.slice(i + 1);
      onChange(next.slice(0, 6));
      if (i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
    }
  };
  return (
    <div className="flex gap-2 justify-center">
      {digits.map((d, i) => (
        <input
          key={i}
          id={`otp-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={() => {}}
          onKeyDown={(e) => handleKey(e, i)}
          className="w-11 h-12 text-center text-lg font-bold border-2 rounded-xl outline-none transition-all
            border-gray-200 bg-gray-50 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
        />
      ))}
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────
const AuthPopup = ({ isOpen, onClose, initialView = 'login' }) => {
  const navigate = useNavigate();
  const [view, setView] = useState(initialView);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' }); // type: 'error' | 'success'
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [otp, setOtp] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');

  const [formData, setFormData] = useState({ name: '', email: '', password: '', newPassword: '', role: 'student' });

  useEffect(() => {
    setView(initialView);
    setMessage({ text: '', type: '' });
    setOtp('');
    setFormData({ name: '', email: '', password: '', newPassword: '', role: 'student' });
  }, [initialView, isOpen]);

  const strength = formData.password ? getStrength(formData.password) : null;

  const handleChange = (e) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const msg = (text, type = 'error') => setMessage({ text, type });

  const switchView = (v) => {
    setView(v);
    setMessage({ text: '', type: '' });
    setOtp('');
  };

  // ── Register ──
  const handleRegister = async () => {
    if (!formData.name || !formData.email || !formData.password)
      return msg('All fields are required.');
    if (formData.password.length < 8)
      return msg('Password must be at least 8 characters.');

    const { data } = await api.post('/auth/register', formData);
    setPendingEmail(formData.email);
    msg(data.message, 'success');
    setTimeout(() => switchView('verify-email'), 1200);
  };

  // ── Login ──
  const handleLogin = async () => {
    if (!formData.email || !formData.password)
      return msg('Email and password are required.');

    const { data } = await api.post('/auth/login', { ...formData, rememberMe });
    console.log('[LOGIN RESPONSE]', data);
    const storage = rememberMe ? localStorage : localStorage; // always localStorage to avoid sessionStorage issues
    storage.setItem('user', JSON.stringify(data.user));
    storage.setItem('token', data.token);
    console.log('[STORED] token:', localStorage.getItem('token'));
    console.log('[STORED] user:', localStorage.getItem('user'));
    onClose();
    const role = data.user.role;
    console.log('[NAVIGATING] to role:', role);
    if (role === 'admin') navigate('/admin');
    else if (role === 'examiner') navigate('/admin-dashboard');
    else navigate('/dashboard');
  };

  // ── Verify Email OTP ──
  const handleVerifyEmail = async () => {
    if (otp.length !== 6) return msg('Please enter the 6-digit OTP.');
    const { data } = await api.post('/auth/verify-email', { email: pendingEmail, otp });
    msg(data.message, 'success');
    setTimeout(() => switchView('login'), 1500);
  };

  // ── Resend OTP ──
  const handleResendOTP = async (endpoint) => {
    const { data } = await api.post(endpoint, { email: pendingEmail });
    msg(data.message, 'success');
  };

  // ── Forgot Password ──
  const handleForgotPassword = async () => {
    if (!formData.email) return msg('Please enter your email address.');
    const { data } = await api.post('/auth/forgot-password', { email: formData.email });
    setPendingEmail(formData.email);
    msg(data.message, 'success');
    setTimeout(() => switchView('reset-password'), 1200);
  };

  // ── Reset Password ──
  const handleResetPassword = async () => {
    if (otp.length !== 6) return msg('Please enter the 6-digit OTP.');
    if (!formData.newPassword || formData.newPassword.length < 8)
      return msg('New password must be at least 8 characters.');
    const { data } = await api.post('/auth/reset-password', {
      email: pendingEmail,
      otp,
      newPassword: formData.newPassword,
    });
    msg(data.message, 'success');
    setTimeout(() => switchView('login'), 1500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      if (view === 'register') await handleRegister();
      else if (view === 'login') await handleLogin();
      else if (view === 'verify-email') await handleVerifyEmail();
      else if (view === 'forgot-password') await handleForgotPassword();
      else if (view === 'reset-password') await handleResetPassword();
    } catch (err) {
      console.error('Auth error:', err.response?.status, err.response?.data);
      const errData = err.response?.data;
      if (errData?.needsVerification) {
        setPendingEmail(errData.email);
        msg(errData.message, 'error');
        setTimeout(() => switchView('verify-email'), 1200);
      } else {
        msg(errData?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // ── View configs ──
  const titles = {
    login: 'Welcome back',
    register: 'Create account',
    'verify-email': 'Verify your email',
    'forgot-password': 'Forgot password?',
    'reset-password': 'Reset password',
  };
  const subtitles = {
    login: 'Sign in to access your secure dashboard.',
    register: 'Join the platform — takes less than a minute.',
    'verify-email': `Enter the 6-digit OTP sent to ${pendingEmail}`,
    'forgot-password': 'Enter your email and we\'ll send a reset OTP.',
    'reset-password': `Enter the OTP sent to ${pendingEmail} and your new password.`,
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 pt-16 bg-black/30 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            {['verify-email', 'forgot-password', 'reset-password'].includes(view) && (
              <button onClick={() => switchView('login')} className="p-1 mr-1 text-gray-400 hover:text-gray-700 transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            <span className="font-bold text-gray-900 text-sm tracking-tight">Automatic Proctoring System</span>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{titles[view]}</h2>
          <p className="text-sm text-gray-500 mb-5">{subtitles[view]}</p>

          {/* Message banner */}
          {message.text && (
            <div className={`mb-4 px-4 py-3 rounded-xl text-sm flex items-start gap-2 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-600 border border-red-200'
            }`}>
              {message.type === 'success'
                ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                : <span className="h-4 w-4 shrink-0 mt-0.5 flex items-center justify-center rounded-full bg-red-100 text-red-600 font-bold text-xs">!</span>}
              <p>{message.text}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* ── REGISTER ── */}
            {view === 'register' && (
              <>
                {/* Role selector */}
                <div className="grid grid-cols-2 gap-2">
                  {['student', 'examiner'].map((r) => (
                    <button key={r} type="button"
                      onClick={() => setFormData((p) => ({ ...p, role: r }))}
                      className={`py-2 px-4 border rounded-xl text-sm font-medium capitalize transition-all ${
                        formData.role === r
                          ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}>
                      {r}
                    </button>
                  ))}
                </div>
                {/* Name */}
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="text" name="name" required value={formData.name} onChange={handleChange}
                    placeholder="Full Name"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                </div>
              </>
            )}

            {/* ── EMAIL (login / register / forgot) ── */}
            {['login', 'register', 'forgot-password'].includes(view) && (
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="email" name="email" required value={formData.email} onChange={handleChange}
                  placeholder="Email Address"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
              </div>
            )}

            {/* ── PASSWORD (login / register) ── */}
            {['login', 'register'].includes(view) && (
              <div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type={showPassword ? 'text' : 'password'} name="password" required
                    minLength={8} value={formData.password} onChange={handleChange}
                    placeholder="Password (min 8 chars)"
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                  <button type="button" onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Strength indicator — register only */}
                {view === 'register' && formData.password && strength && (
                  <div className="mt-2 space-y-1">
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                    </div>
                    <p className={`text-xs font-medium ${strength.text}`}>{strength.label} password</p>
                  </div>
                )}
              </div>
            )}

            {/* ── OTP INPUT (verify-email / reset-password) ── */}
            {['verify-email', 'reset-password'].includes(view) && (
              <OTPInput value={otp} onChange={setOtp} />
            )}

            {/* ── NEW PASSWORD (reset-password) ── */}
            {view === 'reset-password' && (
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type={showNewPassword ? 'text' : 'password'} name="newPassword" required
                  minLength={8} value={formData.newPassword} onChange={handleChange}
                  placeholder="New Password (min 8 chars)"
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                <button type="button" onClick={() => setShowNewPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors">
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            )}

            {/* ── REMEMBER ME + FORGOT (login only) ── */}
            {view === 'login' && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <button type="button" onClick={() => switchView('forgot-password')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
                  Forgot password?
                </button>
              </div>
            )}

            {/* ── SUBMIT ── */}
            <button type="submit" disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition-all shadow-md shadow-blue-200 mt-1">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                { login: 'Sign In', register: 'Create Account', 'verify-email': 'Verify Email',
                  'forgot-password': 'Send Reset OTP', 'reset-password': 'Reset Password' }[view]
              )}
            </button>

            {/* ── RESEND OTP ── */}
            {view === 'verify-email' && (
              <p className="text-center text-sm text-gray-500">
                Didn't receive it?{' '}
                <button type="button" onClick={() => handleResendOTP('/auth/resend-otp')}
                  className="text-blue-600 font-medium hover:underline">Resend OTP</button>
              </p>
            )}
            {view === 'reset-password' && (
              <p className="text-center text-sm text-gray-500">
                Didn't receive it?{' '}
                <button type="button" onClick={() => handleResendOTP('/auth/forgot-password')}
                  className="text-blue-600 font-medium hover:underline">Resend OTP</button>
              </p>
            )}
          </form>

          {/* ── GOOGLE SSO (login / register only) ── */}
          {['login', 'register'].includes(view) && (
            <>
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium">OR</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <a href={`${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '')}/api/auth/google?role=${formData.role}`}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all">
                <GoogleIcon />
                Continue with Google
              </a>
            </>
          )}

          {/* ── SWITCH VIEW ── */}
          {['login', 'register'].includes(view) && (
            <p className="text-center text-sm text-gray-500 mt-5 pt-4 border-t border-gray-100">
              {view === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => switchView(view === 'login' ? 'register' : 'login')}
                className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                {view === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPopup;
