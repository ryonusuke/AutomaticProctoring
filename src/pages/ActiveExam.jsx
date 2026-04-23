import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import * as faceapi from '@vladmandic/face-api';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { 
  Calculator, ShieldCheck, ShieldAlert, Video, Flag, Clock, 
  Loader2, Mic, AlertOctagon, Activity, CheckCircle, Camera, Fingerprint 
} from 'lucide-react';

import api from '../services/api';

const isMobileOrTablet = () => {
  const ua = navigator.userAgent;
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(ua);
  const isTouchOnly = navigator.maxTouchPoints > 1 && !window.matchMedia('(pointer: fine)').matches;
  const isSmallScreen = window.screen.width < 1024;
  return isMobileUA || (isTouchOnly && isSmallScreen);
};

const ActiveExam = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const navigate = useNavigate();
  const [isBlockedDevice] = useState(() => isMobileOrTablet());
  
  const [user] = useState(JSON.parse(localStorage.getItem('user')));
  const [exam, setExam] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState(() => {
    try { const s = localStorage.getItem(`exam_answers_${id}`); return s ? JSON.parse(s) : {}; } catch { return {}; }
  });
  const [flags, setFlags] = useState([]);
  const [submitResult, setSubmitResult] = useState(null);
  const [examStarted, setExamStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submittedAt, setSubmittedAt] = useState(null);

  const examStartTimeRef = useRef(null);
  const examRef = useRef(null);
  const answersRef = useRef({});
  const logsRef = useRef([]);
  const submitFnRef = useRef(null); 

  useEffect(() => { examRef.current = exam; }, [exam]);
  useEffect(() => {
    answersRef.current = answers;
    if (examStarted && id) {
      try { localStorage.setItem(`exam_answers_${id}`, JSON.stringify(answers)); } catch {}
    }
  }, [answers, examStarted, id]);

  const webcamRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioAnalyserRef = useRef(null); 
  const mediaStreamRef = useRef(null);
  
  const [statusText, setStatusText] = useState("Initializing AI...");
  const [isSystemReady, setIsSystemReady] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false); 
  const [warningPopup, setWarningPopup] = useState(null); 
  
  const violationCountRef = useRef(0);
  const [violationsUi, setViolationsUi] = useState(0);
  const [proctorLogs, setProctorLogs] = useState([]);
  const [terminationReason, setTerminationReason] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  // Single AI Loop Refs
  const faceMatcherRef = useRef(null);
  const objectModelRef = useRef(null);
  const lastLogTimeRef = useRef(0); 
  const badFrameCounter = useRef(0);
  const isExamActive = useRef(false); 

  // --- Realtime UI States ---
  const [faceMatchScore, setFaceMatchScore] = useState(0);
  const [biometricStatus, setBiometricStatus] = useState('scanning'); // scanning, matched, mismatch

  // ==========================================
  // 1. HARDWARE & AI INITIALIZATION
  // ==========================================
  const initSystem = async () => {
    try {
      setStatusText("Requesting Camera...");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      mediaStreamRef.current = stream; 
      setHasPermissions(true);
      
      // Init Audio Analyser
      try {
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          const analyser = audioCtx.createAnalyser();
          const microphone = audioCtx.createMediaStreamSource(stream);
          microphone.connect(analyser);
          analyser.fftSize = 256; 
          audioAnalyserRef.current = { analyser, dataArray: new Uint8Array(analyser.frequencyBinCount) };
      } catch(e) {}

      setStatusText("Loading Neural Networks...");
      await tf.ready();
      
      // Load modern Face-API and COCO models simultaneously
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        cocoSsd.load().then(model => objectModelRef.current = model)
      ]);

      // RECONSTRUCT MONGODB DESCRIPTOR
      const rawDescriptor = user?.kyc?.idDescriptor;
      if (rawDescriptor) {
        // Convert standard object/array back to Float32Array
        const descriptorArray = new Float32Array(Object.values(rawDescriptor));
        const labeledDescriptor = new faceapi.LabeledFaceDescriptors('Authorized', [descriptorArray]);
        faceMatcherRef.current = new faceapi.FaceMatcher(labeledDescriptor, 0.55); // 0.55 is strict
      }

      setIsSystemReady(true);
      setStatusText("✅ System Ready");
    } catch (err) {
      setStatusText("❌ Camera/Mic Denied");
    }
  };

  const stopMedia = () => {
      if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop());
      if (recognitionRef.current) try { recognitionRef.current.stop(); } catch(e){}
  };
  useEffect(() => () => stopMedia(), []);

  // ==========================================
  // 2. EXAM SUBMIT LOGIC 
  // ==========================================
  const handleSubmit = async (forcedReason = null) => {
    if (!examRef.current || submitResult !== null || !isExamActive.current || isSubmitting) return;
    setIsSubmitting(true);
    isExamActive.current = false;
    stopMedia();

    const timeTaken = examStartTimeRef.current
      ? Math.floor((Date.now() - examStartTimeRef.current) / 1000)
      : 0;

    try {
      const { data } = await api.post(`/exams/${id}/submit`, {
        studentId: user?.id || user?._id,
        answers: answersRef.current,
        violations: logsRef.current.map(log => ({ reason: log.message, timestamp: new Date().toISOString() })),
        timeTaken,
      });
      setSubmittedAt(new Date());
      setSubmitResult(data.data);
      try { localStorage.removeItem(`exam_answers_${id}`); } catch {}
    } catch (e) {
      // If already submitted (duplicate), still show result screen
      const msg = e.response?.data?.message || '';
      if (msg.toLowerCase().includes('already')) {
        setSubmittedAt(new Date());
        setSubmitResult({ alreadySubmitted: true });
      } else {
        console.error('Submit error:', msg);
      }
    }
  };
  useEffect(() => { submitFnRef.current = handleSubmit; }, [handleSubmit]);

  // Check for existing submission on load (prevent duplicate)
  useEffect(() => {
    if (!id || !user) return;
    api.get('/results/student').then(({ data }) => {
      if (data.success) {
        const existing = data.data.find(r => r.examId?._id === id || r.examId === id);
        if (existing) { setSubmittedAt(new Date(existing.submittedAt || existing.createdAt)); setSubmitResult(existing); }
      }
    }).catch(() => {});
  }, [id]);

  // After submit: replace history so back button can't return to exam
  useEffect(() => {
    if (submitResult !== null) {
      window.history.replaceState(null, '', window.location.href);
    }
  }, [submitResult]);

  // Block browser back button during active exam
  useEffect(() => {
    if (!examStarted || submitResult !== null) return;
    const blockBack = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', blockBack);
    return () => window.removeEventListener('popstate', blockBack);
  }, [examStarted, submitResult]);

  // Auto-submit on tab close / window unload
  useEffect(() => {
    const handleUnload = () => {
      if (isExamActive.current && submitFnRef.current) submitFnRef.current('Tab/Window Closed');
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  // ==========================================
  // 3. RAPID VIOLATION HANDLER 
  // ==========================================
  const handleViolation = useCallback((message) => {
    if (!isExamActive.current) return;

    // Cooldown reduced to 1.5s for instant feedback
    const now = Date.now();
    if (now - lastLogTimeRef.current < 1500) return; 
    lastLogTimeRef.current = now;
    
    violationCountRef.current += 1;
    setViolationsUi(violationCountRef.current);
    
    const time = new Date().toLocaleTimeString();
    logsRef.current = [{ time, message }, ...logsRef.current];
    setProctorLogs([...logsRef.current]);

    setWarningPopup(`SECURITY ALERT: ${message}`);
    setTimeout(() => setWarningPopup(null), 3000);

    const limit = examRef.current?.securitySettings?.toleranceLimit || 5;
    if (violationCountRef.current >= limit) {
        if (submitFnRef.current) submitFnRef.current("Auto-Terminated: Excessive Violations.");
    }
  }, []);

  // ==========================================
  // 4. BROWSER & SPEECH LOCKDOWN
  // ==========================================
  useEffect(() => {
    if (!examStarted || !exam?.securitySettings?.strictBrowserLock) return;

    const handleLockdown = (e) => {
      if (['contextmenu', 'copy', 'paste'].includes(e.type)) {
        e.preventDefault();
        handleViolation(`Clipboard/Right-click blocked.`);
      }
      if (e.type === 'keydown' && (e.key === 'Meta' || e.key === 'Alt')) {
         handleViolation(`System key (${e.key}) detected.`);
      }
    };
    
    const handleTabSwitch = () => {
        if (document.hidden && isExamActive.current) handleViolation("Tab Switch Detected.");
    };

    document.addEventListener('visibilitychange', handleTabSwitch); 
    ['contextmenu', 'copy', 'paste', 'keydown'].forEach(evt => document.addEventListener(evt, handleLockdown));
    
    return () => {
        document.removeEventListener('visibilitychange', handleTabSwitch);
        ['contextmenu', 'copy', 'paste', 'keydown'].forEach(evt => document.removeEventListener(evt, handleLockdown));
    };
  }, [examStarted, exam, handleViolation]);

  const startSpeechRecognition = useCallback(() => {
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Speech) return;
    recognitionRef.current = new Speech();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript.trim();
        if (transcript.length > 3) handleViolation(`Speech Detected: "${transcript}"`);
    };
    recognitionRef.current.onend = () => {
        if (isExamActive.current) try { recognitionRef.current.start(); } catch(e){}
    };
    try { recognitionRef.current.start(); } catch(e){}
  }, [handleViolation]);

  // ==========================================
  // 5. UNIFIED HIGH-SPEED AI LOOP
  // ==========================================
  const runUnifiedAI = async () => {
    const video = webcamRef.current?.video;
    if (!video || video.readyState !== 4 || video.videoWidth === 0) return;

    // A. Audio Volume
    if (audioAnalyserRef.current) {
        const { analyser, dataArray } = audioAnalyserRef.current;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        if ((sum / dataArray.length) > 20) {
            badFrameCounter.current += 1;
            if (badFrameCounter.current >= 3) { handleViolation("Background Noise Detected"); badFrameCounter.current = 0; }
            return; // Skip visual analysis this frame to save CPU
        }
    }

    try {
        // B. SINGLE PASS: Detect Face, Landmarks, and Identity Descriptor
        const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 });
        const detections = await faceapi.detectAllFaces(video, options).withFaceLandmarks().withFaceDescriptors();

        if (detections.length === 0) {
            setBiometricStatus('scanning');
            badFrameCounter.current += 1;
            if (badFrameCounter.current >= 3) { handleViolation("Face Out of Frame"); badFrameCounter.current = 0; }
        } else if (detections.length > 1) {
            setBiometricStatus('mismatch');
            handleViolation("Multiple Faces Detected!");
        } else {
            badFrameCounter.current = 0;
            const det = detections[0];

            // C. GAZE TRACKING (Using Face-API Landmarks)
            const points = det.landmarks.positions;
            const nose = points[30];
            const jawLeft = points[0];
            const jawRight = points[16];
            
            // Simple Yaw Ratio
            const distLeft = Math.abs(nose.x - jawLeft.x);
            const distRight = Math.abs(jawRight.x - nose.x);
            const yawRatio = distLeft / (distRight + 0.001);

            if (yawRatio < 0.4 || yawRatio > 2.5) {
                handleViolation("Looking Away from Screen");
            } else {
                // D. IDENTITY MATCHING
                if (faceMatcherRef.current) {
                    const match = faceMatcherRef.current.findBestMatch(det.descriptor);
                    if (match.label === 'Authorized') {
                        setBiometricStatus('matched');
                        setFaceMatchScore(Math.round((1 - match.distance) * 100));
                    } else {
                        setBiometricStatus('mismatch');
                        setFaceMatchScore(0);
                        handleViolation("IDENTITY MISMATCH: Unauthorized Person Detected");
                    }
                }
            }
        }

        // E. OBJECT DETECTION
        if (objectModelRef.current) {
            const objects = await objectModelRef.current.detect(video);
            const forbidden = objects.find(obj => ['cell phone', 'book', 'laptop'].includes(obj.class) && obj.score > 0.5);
            if (forbidden) handleViolation(`${forbidden.class.toUpperCase()} Detected!`);
        }

    } catch (e) {}
  };

  // Run the loop before exam starts (for UI) AND during exam
  useEffect(() => {
    let interval;
    if (isSystemReady && submitResult === null) {
        interval = setInterval(runUnifiedAI, 800);
    }
    return () => clearInterval(interval);
  }, [isSystemReady, submitResult, handleViolation]);

  // ==========================================
  // 6. EXAM FETCHING & TIMERS
  // ==========================================
  useEffect(() => {
    const fetchExam = async () => {
        try {
            const res = await api.get(`/exams/${id}`);
            if (res.data?.success) {
               setExam(res.data.data);
               setTimeLeft((res.data.data.durationMinutes || 60) * 60);
            }
        } catch (e) {
           navigate('/dashboard');
        }
    };
    if (id) fetchExam();
  }, [id, navigate]);

  const startExamSession = () => {
    isExamActive.current = true;
    examStartTimeRef.current = Date.now();
    startSpeechRecognition();
    setExamStarted(true);
  };

  useEffect(() => {
    let timerId;
    if (examStarted && timeLeft > 0 && submitResult === null) {
      timerId = setInterval(() => setTimeLeft(p => p - 1), 1000);
    } else if (timeLeft === 0 && examStarted && isExamActive.current) {
      if (submitFnRef.current) submitFnRef.current("Time Expired");
    }
    return () => clearInterval(timerId);
  }, [examStarted, timeLeft, submitResult]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // ==========================================
  // 7. UI RENDERING 
  // ==========================================
  if (!exam) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="h-12 w-12 text-blue-600 animate-spin" /></div>;

  // DEVICE BLOCK SCREEN
  if (isBlockedDevice) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-slate-100 font-sans">
        <div className="max-w-md w-full bg-slate-800 rounded-3xl p-10 text-center shadow-2xl border border-red-500/30">
          <AlertOctagon className="h-16 w-16 text-red-500 mx-auto mb-6" />
          <h1 className="text-2xl font-black text-white mb-3">Device Not Allowed</h1>
          <p className="text-slate-400 mb-6">
            This exam must be taken on a <span className="text-white font-bold">desktop or laptop computer</span>.
            Mobile phones and tablets are not permitted.
          </p>
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-sm text-red-300 mb-8">
            <p className="font-bold mb-1">Why is this required?</p>
            <p>The proctoring system requires a full desktop browser with webcam access and screen monitoring capabilities that are not available on mobile devices.</p>
          </div>
          <button onClick={() => navigate('/dashboard', { replace: true })} className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold transition-all">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // PRE-EXAM INSTRUCTION SCREEN
  if (!examStarted) {
    const isReadyToStart = isSystemReady && biometricStatus === 'matched';

    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-slate-100 font-sans selection:bg-blue-500">
        <div className="max-w-4xl w-full bg-slate-800 rounded-3xl shadow-2xl border border-slate-700 overflow-hidden">
          <div className="p-8 border-b border-slate-700 bg-slate-800/50 flex items-center gap-4">
            <ShieldCheck className="h-10 w-10 text-blue-500" />
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight">Automatic Proctoring System</h1>
              <p className="text-slate-400 font-medium">Pre-Flight Diagnostic & Authorization</p>
            </div>
          </div>

          <div className="p-8 grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">{exam.title}</h2>
              <p className="text-slate-400 mb-8 font-medium">Course Code: {exam.courseCode} • Duration: {exam.durationMinutes} Mins</p>

              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 mb-6 text-red-100">
                <h3 className="font-bold text-red-400 mb-3 flex items-center gap-2"><AlertOctagon className="h-5 w-5" /> ZERO TOLERANCE POLICY</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><Video className="h-4 w-4 text-red-400" /> Face, Gaze & Object Detection Active.</li>
                  <li className="flex items-center gap-2"><Mic className="h-4 w-4 text-red-400" /> Audio & Speech Monitoring Active.</li>
                  <li className="flex items-center gap-2"><Fingerprint className="h-4 w-4 text-red-400" /> Biometric Authentication Required.</li>
                  <li className="mt-3 text-red-300 font-bold bg-red-900/30 px-3 py-2 rounded-lg inline-block">
                    WARNING: {exam.securitySettings.toleranceLimit} violations triggers auto-submission.
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col">
              <h3 className="font-bold text-slate-300 mb-4 uppercase tracking-wider text-sm">Pre-Exam Live Verification</h3>
              
              <div className="bg-slate-900 rounded-xl aspect-video border-2 border-slate-700 overflow-hidden relative flex flex-col items-center justify-center mb-4 shadow-inner">
                <p className={`absolute top-2 z-20 font-bold text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-black/50 ${hasPermissions ? 'text-green-400' : 'text-amber-400'}`}>{statusText}</p>
                
                {!hasPermissions ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10 px-6 text-center">
                     <button onClick={initSystem} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold shadow-md transition-all">
                        <Camera className="inline-block h-5 w-5 mr-2 -mt-1"/> Test Camera & Initialize AI
                     </button>
                  </div>
                ) : (
                  <Webcam ref={webcamRef} audio={false} className="w-full h-full object-cover transform scale-x-[-1] opacity-90" />
                )}

                {isSystemReady && (
                   <div className={`absolute bottom-3 left-3 right-3 py-2 px-3 rounded-lg text-center font-bold text-sm backdrop-blur-md shadow-lg ${biometricStatus === 'matched' ? 'bg-green-500/90 text-white border border-green-400' : biometricStatus === 'mismatch' ? 'bg-red-600/90 text-white border border-red-500' : 'bg-amber-500/90 text-slate-900'}`}>
                      {biometricStatus === 'matched' ? `Identity Confirmed (${faceMatchScore}%)` : biometricStatus === 'mismatch' ? 'Identity Mismatch!' : 'Scanning Face ID...'}
                   </div>
                )}
              </div>

              <div className="mt-auto">
                <button 
                  onClick={startExamSession} 
                  disabled={!isReadyToStart}
                  className={`w-full text-white px-8 py-4 rounded-xl font-bold shadow-lg transition-all flex justify-center items-center gap-2 ${isReadyToStart ? 'bg-blue-600 hover:bg-blue-500 active:scale-95' : 'bg-slate-700 opacity-70 cursor-not-allowed'}`}
                >
                  {isReadyToStart ? 'Start Assessment' : <><Loader2 className="h-5 w-5 animate-spin" /> Awaiting Identity Match...</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // RESULTS SCREEN
  if (submitResult !== null) {
    const isPending = submitResult.status === 'pending_review';
    const isDisqualified = submitResult.status === 'terminated_for_cheating';
    const totalMarks = exam?.questions?.reduce((a, b) => a + (parseInt(b.marks) || 1), 0) || submitResult.totalMarks;
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-slate-100 font-sans">
        <div className="max-w-md w-full bg-slate-800 rounded-3xl p-10 text-center shadow-2xl border border-slate-700">
          {isDisqualified
            ? <AlertOctagon className="h-16 w-16 text-red-500 mx-auto mb-6" />
            : isPending
            ? <Clock className="h-16 w-16 text-orange-400 mx-auto mb-6" />
            : <ShieldCheck className="h-16 w-16 text-green-500 mx-auto mb-6" />}

          <h1 className="text-3xl font-black mb-2 text-white">
            {isDisqualified ? 'Disqualified' : isPending ? 'Submission Received' : 'Exam Submitted'}
          </h1>

          <p className="text-slate-400 text-sm mb-4">
            {isDisqualified
              ? 'Your session was terminated due to excessive violations.'
              : isPending
              ? 'Your submission is under review. Your teacher will grade it and notify you when results are ready.'
              : 'Your result is ready. Visit your dashboard to view the breakdown.'}
          </p>
          {submittedAt && (
            <p className="text-slate-500 text-xs mb-6">Submitted at: {submittedAt.toLocaleString()}</p>
          )}

          {!isPending && (
            <div className="bg-slate-900 rounded-2xl p-6 mb-6 border border-slate-700">
              <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Score</p>
              <h2 className="text-5xl font-black text-blue-500">
                {submitResult.score} <span className="text-2xl text-slate-500">/ {totalMarks}</span>
              </h2>
              <p className={`text-sm font-bold mt-2 ${
                submitResult.status === 'passed' ? 'text-green-400' : 'text-red-400'
              }`}>{submitResult.status === 'passed' ? '✓ Passed' : '✗ Failed'}</p>
            </div>
          )}

          <div className="flex justify-between items-center text-sm font-bold text-slate-400 mb-8 px-4">
            <span>Violations:</span>
            <span className={violationCountRef.current > 0 ? 'text-amber-500' : 'text-green-500'}>
              {violationCountRef.current} / {exam?.securitySettings?.toleranceLimit}
            </span>
          </div>

          <button onClick={() => navigate('/dashboard', { replace: true })} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold transition-all shadow-lg">Return to Dashboard</button>
        </div>
      </div>
    );
  }

  // ACTIVE EXAM LOBBY
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans select-none">
      
      {warningPopup && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-8 py-4 rounded-2xl font-black shadow-[0_10px_40px_rgba(220,38,38,0.5)] z-50 flex items-center gap-3 animate-in slide-in-from-top-4">
          <AlertOctagon className="h-6 w-6 animate-pulse" /> {warningPopup}
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="h-14 w-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-7 w-7 text-red-600" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 mb-2">Submit Exam?</h2>
            <p className="text-sm text-slate-500 mb-1">
              {Object.keys(answers).length} of {exam.questions.length} questions answered.
            </p>
            {Object.keys(answers).length < exam.questions.length && (
              <p className="text-xs text-amber-600 font-bold bg-amber-50 px-3 py-2 rounded-lg border border-amber-200 mb-4">
                ⚠ {exam.questions.length - Object.keys(answers).length} question(s) unanswered
              </p>
            )}
            <p className="text-xs text-slate-400 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 text-sm font-bold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={() => { setShowConfirm(false); handleSubmit(); }} disabled={isSubmitting}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-6 w-6 text-blue-600" />
          <h1 className="text-base font-bold text-slate-900 tracking-tight hidden sm:block">{exam.title}</h1>
        </div>
        <div className="flex items-center gap-4">
          {/* Time progress bar */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  timeLeft < 300 ? 'bg-red-500' : timeLeft < 600 ? 'bg-amber-400' : 'bg-green-500'
                }`}
                style={{ width: `${(timeLeft / ((exam.durationMinutes || 60) * 60)) * 100}%` }}
              />
            </div>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold border transition-colors ${
            timeLeft < 300
              ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
              : 'bg-slate-50 text-slate-700 border-slate-200'
          }`}>
            <Clock className="h-4 w-4" /> {formatTime(timeLeft)}
          </div>
        </div>
      </header>

      <div className="flex-1 flex max-w-[1400px] w-full mx-auto p-6 gap-6 h-[calc(100vh-80px)]">
        
        <main className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-full relative">
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <div>
              <h2 className="font-bold text-slate-700 text-sm">Question {currentQuestion + 1} <span className="text-slate-400">/ {exam.questions.length}</span></h2>
              <p className="text-xs text-slate-400 mt-0.5 capitalize">{exam.questions[currentQuestion].type?.replace('_',' ') || 'MCQ'}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">{Object.keys(answers).length}/{exam.questions.length} answered</span>
              <button
                onClick={() => setFlags(flags.includes(currentQuestion) ? flags.filter(i => i !== currentQuestion) : [...flags, currentQuestion])}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  flags.includes(currentQuestion)
                    ? 'bg-amber-100 text-amber-700 border-amber-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}>
                <Flag className={`h-3.5 w-3.5 ${flags.includes(currentQuestion) ? 'fill-current' : ''}`} />
                {flags.includes(currentQuestion) ? 'Flagged' : 'Flag'}
              </button>
            </div>
          </div>
          
          <div className="p-8 flex-1 overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-bold text-slate-900 leading-relaxed flex-1 pr-4">
                {exam.questions[currentQuestion].questionText}
              </h3>
              <span className="shrink-0 bg-blue-50 text-blue-700 font-bold px-3 py-1 rounded-lg text-sm border border-blue-100">
                {exam.questions[currentQuestion].marks || 1} Mark{(exam.questions[currentQuestion].marks || 1) > 1 ? 's' : ''}
              </span>
            </div>

            {/* Question image if present */}
            {exam.questions[currentQuestion].image && (
              <div className="mb-6">
                <img src={exam.questions[currentQuestion].image} alt="Question diagram"
                  className="max-w-full max-h-64 rounded-xl border border-slate-200 object-contain" />
              </div>
            )}

            {/* MCQ */}
            {(!exam.questions[currentQuestion].type || exam.questions[currentQuestion].type === 'mcq') && (
              <div className="space-y-3">
                {exam.questions[currentQuestion].options.map((option, idx) => (
                  <button key={idx}
                    onClick={() => setAnswers(p => ({ ...p, [currentQuestion]: idx }))}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                      answers[currentQuestion] === idx
                        ? 'border-blue-600 bg-blue-50 shadow-sm'
                        : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                    }`}>
                    <div className="flex items-center gap-4">
                      <div className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        answers[currentQuestion] === idx ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                      }`}>
                        {answers[currentQuestion] === idx && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <span className={`font-medium ${
                        answers[currentQuestion] === idx ? 'text-blue-900' : 'text-slate-700'
                      }`}>{option}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Multiple Correct */}
            {exam.questions[currentQuestion].type === 'multiple_correct' && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 inline-block mb-2">
                  Select all correct answers
                </p>
                {exam.questions[currentQuestion].options.map((option, idx) => {
                  const selected = Array.isArray(answers[currentQuestion]) && answers[currentQuestion].includes(idx);
                  return (
                    <button key={idx}
                      onClick={() => {
                        const cur = Array.isArray(answers[currentQuestion]) ? answers[currentQuestion] : [];
                        setAnswers(p => ({ ...p, [currentQuestion]: selected ? cur.filter(x => x !== idx) : [...cur, idx] }));
                      }}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                        selected ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                      }`}>
                      <div className="flex items-center gap-4">
                        <div className={`shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                          selected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                        }`}>
                          {selected && <div className="w-3 h-3 text-white font-black text-xs flex items-center justify-center">✓</div>}
                        </div>
                        <span className={`font-medium ${selected ? 'text-blue-900' : 'text-slate-700'}`}>{option}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Short Answer */}
            {exam.questions[currentQuestion].type === 'short_answer' && (
              <div>
                <p className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100 inline-block mb-3">
                  Written answer — graded manually by examiner
                </p>
                <textarea
                  rows={5}
                  value={answers[currentQuestion] || ''}
                  onChange={e => setAnswers(p => ({ ...p, [currentQuestion]: e.target.value }))}
                  placeholder="Type your answer here..."
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl text-slate-800 focus:border-blue-500 outline-none resize-none transition-colors"
                />
              </div>
            )}

            {/* Coding */}
            {exam.questions[currentQuestion].type === 'coding' && (
              <div>
                <p className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100 inline-block mb-3">
                  Coding question — graded manually by examiner
                </p>
                <textarea
                  rows={10}
                  value={answers[currentQuestion] || ''}
                  onChange={e => setAnswers(p => ({ ...p, [currentQuestion]: e.target.value }))}
                  placeholder="Write your code here..."
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl text-slate-800 font-mono text-sm focus:border-blue-500 outline-none resize-y transition-colors bg-slate-950 text-green-400"
                />
              </div>
            )}
          </div>

          <div className="p-5 border-t border-slate-100 bg-white flex justify-between items-center">
            <button onClick={() => setCurrentQuestion(p => Math.max(0, p - 1))} disabled={currentQuestion === 0}
              className="px-6 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl disabled:opacity-40 transition-colors">← Prev</button>
            {currentQuestion === exam.questions.length - 1 ? (
      <button onClick={() => setShowConfirm(true)} disabled={isSubmitting}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-2.5 rounded-xl font-bold shadow-md transition-all active:scale-95 disabled:opacity-70">
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <><CheckCircle className="h-5 w-5" /> Submit Exam</>}
              </button>
            ) : (
              <button onClick={() => setCurrentQuestion(p => Math.min(exam.questions.length - 1, p + 1))}
                className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-2.5 rounded-xl font-bold shadow-md transition-all active:scale-95">Next →</button>
            )}
          </div>
        </main>

        <aside className="w-[340px] flex flex-col gap-6 h-full">
          
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 shrink-0">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Video className="h-5 w-5 text-blue-600" />
                    <h3 className="font-bold text-slate-900">Live AI Monitor</h3>
                </div>
            </div>
            
            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-inner">
              <Webcam ref={webcamRef} audio={false} className="w-full h-full object-cover transform scale-x-[-1] opacity-90" />
            </div>

            <div className="mt-4">
              <div className={`p-3 rounded-xl border flex items-center justify-between transition-colors duration-300 ${biometricStatus === 'matched' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Continuous Auth</h4>
                  <p className={`font-black text-sm ${biometricStatus === 'matched' ? 'text-green-700' : 'text-red-700'}`}>
                    {biometricStatus === 'matched' ? 'MATCH CONFIRMED' : 'IDENTITY MISMATCH'}
                  </p>
                </div>
                {biometricStatus === 'matched' && (
                  <div className="bg-green-600 text-white font-mono text-xs font-bold px-2 py-1 rounded-lg">{faceMatchScore}%</div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 shrink-0">
            <h3 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wider">Question Palette</h3>
            <div className="grid grid-cols-5 gap-2 mb-3">
              {exam.questions.map((q, idx) => {
                let statusClass = 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200';
                if (idx === currentQuestion) statusClass = 'bg-slate-900 text-white shadow-md scale-105 border-slate-900';
                else if (flags.includes(idx)) statusClass = 'bg-amber-100 text-amber-700 border-amber-300';
                else if (answers[idx] !== undefined) statusClass = 'bg-green-100 text-green-700 border-green-300';
                return (
                  <button key={idx} onClick={() => setCurrentQuestion(idx)}
                    className={`h-9 rounded-xl font-bold text-xs transition-all flex items-center justify-center border ${statusClass}`}>
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-500">
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-green-200 border border-green-300" />Answered</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-amber-100 border border-amber-300" />Flagged</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-slate-100 border border-slate-200" />Skipped</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-red-500" />
                <h3 className="font-bold text-slate-900">Telemetry Logs</h3>
              </div>
              <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${violationsUi > 0 ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                {violationsUi}/{exam.securitySettings.toleranceLimit} FLAGS
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {proctorLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <ShieldCheck className="h-10 w-10 mb-2 opacity-30 text-green-500" />
                  <p className="text-sm font-medium">Session Secure.</p>
                </div>
              ) : (
                proctorLogs.map((v, i) => (
                  <div key={i} className="bg-red-50 border border-red-100 p-3 rounded-xl text-sm animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-red-900 leading-tight pr-2">{v.message}</span>
                      <span className="text-[10px] text-red-500 font-mono font-bold bg-white px-1.5 py-0.5 rounded shrink-0">{v.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </aside>
      </div>
    </div>
  );
};

export default ActiveExam;