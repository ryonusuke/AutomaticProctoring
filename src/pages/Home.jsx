import { useState, useEffect } from 'react';
import {
  ShieldAlert, MonitorCheck, Video, ArrowRight, ChevronDown,
  Fingerprint, Lock, Eye, Zap, BookOpen, Users, CheckCircle2,
  AlertTriangle, BarChart2, Menu, X, ShieldCheck
} from 'lucide-react';
import AuthPopup from '../components/common/AuthPopup';

// ── Navbar ─────────────────────────────────────────────────────────────────
const Navbar = ({ onLogin, onRegister }) => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const scrollTo = (id) => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); setOpen(false); };

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100' : 'bg-transparent'}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-white" />
          </div>
          <span className={`font-extrabold text-sm tracking-tight ${scrolled ? 'text-gray-900' : 'text-white'}`}>
            Automatic Proctoring System
          </span>
        </button>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {[['Features','features'],['How it Works','how-it-works'],['FAQ','faq']].map(([l,id]) => (
            <button key={id} onClick={() => scrollTo(id)}
              className={`text-sm font-medium transition-colors ${scrolled ? 'text-gray-600 hover:text-blue-600' : 'text-white/80 hover:text-white'}`}>
              {l}
            </button>
          ))}
          <div className="flex items-center gap-2 ml-4">
            <button onClick={onLogin}
              className={`text-sm font-bold px-4 py-2 rounded-xl transition-colors ${scrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'}`}>
              Sign In
            </button>
            <button onClick={onRegister}
              className="text-sm font-bold px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors">
              Register
            </button>
          </div>
        </div>

        {/* Mobile */}
        <button onClick={() => setOpen(p => !p)} className={`md:hidden p-2 rounded-lg ${scrolled ? 'text-gray-700' : 'text-white'}`}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-1 shadow-lg">
          {[['Features','features'],['How it Works','how-it-works'],['FAQ','faq']].map(([l,id]) => (
            <button key={id} onClick={() => scrollTo(id)} className="w-full text-left px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl">{l}</button>
          ))}
          <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
            <button onClick={() => { onLogin(); setOpen(false); }} className="w-full py-2.5 text-sm font-bold text-gray-900 border border-gray-200 rounded-xl">Sign In</button>
            <button onClick={() => { onRegister(); setOpen(false); }} className="w-full py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl">Register</button>
          </div>
        </div>
      )}
    </nav>
  );
};

// ── Feature tabs ───────────────────────────────────────────────────────────
const TABS = [
  {
    id: 'monitoring',
    icon: Video,
    title: 'Live Webcam Monitoring',
    desc: 'Your webcam is active throughout the exam. The system detects if multiple faces appear, if you look away too often, or if someone else is in the frame.',
    preview: (
      <div className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-700">
        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-800 border-b border-gray-700">
          <span className="text-xs font-mono text-gray-400">webcam_feed.live</span>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-red-400 font-bold">REC</span>
          </div>
        </div>
        <div className="aspect-video bg-gray-950 relative flex items-center justify-center">
          <div className="w-32 h-40 border-2 border-green-400 rounded relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-900 px-2 text-[10px] font-bold text-green-400 whitespace-nowrap">FACE DETECTED</div>
            <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-green-400" />
            <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-green-400" />
            <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-green-400" />
            <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-green-400" />
          </div>
          <div className="absolute bottom-3 left-3 bg-black/80 rounded-lg px-3 py-1.5 font-mono text-xs text-green-400">
            1 face · confidence 97.2%
          </div>
          <div className="absolute bottom-3 right-3 bg-black/80 rounded-lg px-3 py-1.5 font-mono text-xs text-gray-400">
            00:14:32
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'browser',
    icon: MonitorCheck,
    title: 'Browser Lockdown',
    desc: 'Once you start an exam, you cannot switch tabs, right-click, copy-paste, or use keyboard shortcuts. Every attempt is logged with a timestamp.',
    preview: (
      <div className="bg-gray-900 rounded-2xl overflow-hidden border border-red-900/60">
        <div className="bg-red-950/60 px-4 py-3 border-b border-red-900/40 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <div>
            <p className="text-sm font-bold text-red-300">Violation Detected</p>
            <p className="text-xs text-red-500">Tab switch attempt blocked</p>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div className="bg-gray-950 rounded-xl p-3 font-mono text-xs space-y-2 border border-gray-800">
            <div className="flex justify-between"><span className="text-gray-500">event</span><span className="text-yellow-400">visibilitychange</span></div>
            <div className="flex justify-between"><span className="text-gray-500">time</span><span className="text-blue-400">{new Date().toLocaleTimeString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">warnings</span><span className="text-orange-400">2 / 3 used</span></div>
            <div className="flex justify-between"><span className="text-gray-500">status</span><span className="text-red-400">warning_issued</span></div>
          </div>
          <p className="text-xs text-gray-500">3 violations = automatic exam termination.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'kyc',
    icon: Fingerprint,
    title: 'Identity Verification (KYC)',
    desc: 'Before your first exam, you scan your photo ID and take a live selfie. The system matches your face to your ID to confirm you are who you say you are.',
    preview: (
      <div className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-700 p-6 text-center">
        <div className="h-14 w-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-4">
          <Fingerprint className="h-7 w-7 text-blue-400" />
        </div>
        <h4 className="text-base font-bold text-white mb-1">Verify Your Identity</h4>
        <p className="text-xs text-gray-500 mb-5">Hold your photo ID up to the camera</p>
        <div className="relative h-28 border-2 border-dashed border-blue-500/40 rounded-xl flex items-center justify-center bg-blue-500/5 mb-4">
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-blue-400" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-blue-400" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-blue-400" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-blue-400" />
          <span className="text-xs font-bold text-blue-400/50 uppercase tracking-widest">Align ID Here</span>
        </div>
        <div className="flex items-center justify-center gap-1.5 text-xs text-green-400">
          <CheckCircle2 className="h-3.5 w-3.5" /> Match confirmed · 96.8%
        </div>
      </div>
    ),
  },
];

const FAQS = [
  { q: 'Do I need to install anything?', a: 'No. Everything runs in your browser. Just open the link, allow camera access, and you\'re ready. No downloads, no extensions required.' },
  { q: 'What happens if my internet cuts out during an exam?', a: 'Your answers and proctoring data are saved locally in your browser. Once you reconnect, everything syncs back to the server automatically.' },
  { q: 'How does the KYC verification work?', a: 'You scan your photo ID and take a live selfie once. The system creates a face map and checks it against your webcam feed during every exam to confirm your identity.' },
  { q: 'Can I take the exam on my phone?', a: 'No. Exams require a desktop or laptop. Phones and tablets cannot support the fullscreen lockdown and webcam proctoring needed for a secure exam.' },
  { q: 'What counts as a violation?', a: 'Switching tabs, minimizing the browser, right-clicking, using keyboard shortcuts, or having multiple faces in frame. Each violation is logged with a timestamp.' },
];

// ── Main ───────────────────────────────────────────────────────────────────
const Home = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const [authView, setAuthView] = useState('login');
  const [activeTab, setActiveTab] = useState('monitoring');
  const [openFaq, setOpenFaq] = useState(0);

  const openAuth = (view) => { setAuthView(view); setAuthOpen(true); };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white">
      <Navbar onLogin={() => openAuth('login')} onRegister={() => openAuth('register')} />
      <AuthPopup isOpen={authOpen} onClose={() => setAuthOpen(false)} initialView={authView} />

      <main className="flex-grow">

        {/* HERO */}
        <section className="relative min-h-screen flex items-center bg-gray-950 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,#1e3a5f,transparent)]" />
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '50px 50px' }} />

          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-16 w-full">
            <div className="max-w-3xl mx-auto text-center">

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold mb-8">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                Secure · AI-Powered · Browser Native
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
                Online exams with{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                  built-in anti-cheat
                </span>
              </h1>

              <p className="text-base sm:text-lg text-gray-400 mb-10 leading-relaxed max-w-xl mx-auto">
                A full-stack proctoring platform for colleges. Students verify their identity, take exams in a locked browser, and results are auto-graded — all in one place.
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-3 mb-16">
                <button onClick={() => openAuth('register')}
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-7 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/40 hover:-translate-y-0.5">
                  Create Account <ArrowRight className="h-4 w-4" />
                </button>
                <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 px-7 py-3.5 rounded-xl font-bold transition-all">
                  See how it works
                </button>
              </div>

              {/* Role cards */}
              <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
                {[
                  { role: 'Admin', desc: 'Manage users & KYC', color: 'border-red-800/50 bg-red-950/30', dot: 'bg-red-500' },
                  { role: 'Examiner', desc: 'Create & grade exams', color: 'border-purple-800/50 bg-purple-950/30', dot: 'bg-purple-500' },
                  { role: 'Student', desc: 'Take exams securely', color: 'border-blue-800/50 bg-blue-950/30', dot: 'bg-blue-500' },
                ].map(r => (
                  <div key={r.role} className={`p-3 rounded-xl border ${r.color} text-center`}>
                    <div className={`h-2 w-2 rounded-full ${r.dot} mx-auto mb-2`} />
                    <p className="text-xs font-bold text-white">{r.role}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{r.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-gray-600 animate-bounce">
            <ChevronDown className="h-5 w-5" />
          </div>
        </section>

        {/* WHAT IT DOES — quick overview */}
        <section className="py-16 bg-gray-50 border-y border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Eye, title: 'Face Detection', desc: 'Detects multiple faces or absence during exam', color: 'text-blue-600', bg: 'bg-blue-50' },
                { icon: Lock, title: 'Browser Lock', desc: 'No tab switching, copy-paste, or shortcuts', color: 'text-red-600', bg: 'bg-red-50' },
                { icon: Fingerprint, title: 'KYC Verification', desc: 'ID + selfie match before first exam', color: 'text-purple-600', bg: 'bg-purple-50' },
                { icon: BarChart2, title: 'Auto Grading', desc: 'MCQ auto-scored, trust score calculated', color: 'text-green-600', bg: 'bg-green-50' },
              ].map(f => (
                <div key={f.title} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl ${f.bg} shrink-0`}>
                    <f.icon className={`h-5 w-5 ${f.color}`} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{f.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="py-24 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Features</span>
              <h2 className="text-3xl font-extrabold text-gray-900 mt-2">How the proctoring works</h2>
              <p className="text-gray-500 mt-3 max-w-xl mx-auto text-sm">Three layers of security run simultaneously during every exam session.</p>
            </div>

            <div className="grid lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-5 space-y-3">
                {TABS.map(tab => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${active ? 'border-blue-600 bg-blue-50 shadow-md shadow-blue-100' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}>
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-xl shrink-0 ${active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className={`font-bold text-sm ${active ? 'text-gray-900' : 'text-gray-600'}`}>{tab.title}</p>
                          <p className={`text-xs mt-1 leading-relaxed ${active ? 'text-gray-600' : 'text-gray-400'}`}>{tab.desc}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="lg:col-span-7 bg-gray-950 rounded-3xl p-6 border border-gray-800 min-h-80 flex items-center justify-center">
                <div className="w-full" key={activeTab}>
                  {TABS.find(t => t.id === activeTab)?.preview}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-24 bg-gray-950 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '50px 50px' }} />
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Workflow</span>
              <h2 className="text-3xl font-extrabold text-white mt-2">From signup to results</h2>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              {[
                { n: '1', title: 'Register', desc: 'Create an account as a student or examiner', icon: Users },
                { n: '2', title: 'Verify KYC', desc: 'Scan your photo ID and take a live selfie for identity verification', icon: Fingerprint },
                { n: '3', title: 'Take Exam', desc: 'Answer questions in a locked, monitored browser', icon: BookOpen },
                { n: '4', title: 'Get Results', desc: 'Auto-graded score with trust score and violation log', icon: BarChart2 },
              ].map((s, i) => (
                <div key={i} className="bg-gray-900 rounded-2xl p-6 border border-gray-800 hover:border-blue-800/50 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl font-black text-blue-600/30 font-mono leading-none">{s.n}</span>
                    <div className="h-8 w-8 rounded-lg bg-blue-600/10 border border-blue-600/20 flex items-center justify-center">
                      <s.icon className="h-4 w-4 text-blue-400" />
                    </div>
                  </div>
                  <p className="font-bold text-white text-sm mb-1">{s.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>


          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-24 bg-white">
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">FAQ</span>
              <h2 className="text-3xl font-extrabold text-gray-900 mt-2">Common questions</h2>
            </div>
            <div className="space-y-2">
              {FAQS.map((faq, i) => (
                <div key={i} className={`border rounded-2xl overflow-hidden transition-all ${openFaq === i ? 'border-blue-200 shadow-sm' : 'border-gray-100'}`}>
                  <button onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                    className="w-full px-5 py-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors text-left gap-4">
                    <span className="font-semibold text-gray-900 text-sm">{faq.q}</span>
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 transition-all ${openFaq === i ? 'bg-blue-600 text-white rotate-180' : 'bg-gray-100 text-gray-500'}`}>
                      <ChevronDown className="h-3.5 w-3.5" />
                    </div>
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-40' : 'max-h-0'}`}>
                    <p className="px-5 pb-4 text-sm text-gray-500 leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 bg-gray-950 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1e3a5f_0%,_transparent_70%)]" />
          <div className="relative z-10 max-w-2xl mx-auto px-4 text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Ready to get started?</h2>
            <p className="text-gray-400 mb-8 text-sm leading-relaxed">
              Register as a student to take exams, or as an examiner to create and manage them.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button onClick={() => openAuth('register')}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/40 hover:-translate-y-0.5">
                Create Account <ArrowRight className="h-4 w-4" />
              </button>
              <button onClick={() => openAuth('login')}
                className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 px-8 py-3.5 rounded-xl font-bold transition-all">
                Sign In
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-gray-950 border-t border-gray-800 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-white">Automatic Proctoring System</span>
          </div>
          <p className="text-xs text-gray-600">© {new Date().getFullYear()} Automatic Proctoring System</p>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-gray-600">All systems running</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
