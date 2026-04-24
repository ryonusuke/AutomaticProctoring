import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ShieldCheck, CheckCircle2, Loader2, Lock, AlertTriangle, UploadCloud } from 'lucide-react';
import { useBiometrics } from '../hooks/useBiometrics';
import api from '../services/api';

const KycVerification = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); 
  const [idImage, setIdImage] = useState(null);
  const [faceImage, setFaceImage] = useState(null);
  const [idDescriptor, setIdDescriptor] = useState(null); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [duplicateError, setDuplicateError] = useState('');
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // THE MAGIC HAPPENS HERE: We pass the idDescriptor into the hook and switch to 'exam' mode in Step 2 
  // so the AI mathematically compares your live face to your ID card instantly.
  const [liveDescriptor, setLiveDescriptor] = useState(null);

  const { status: aiStatus, matchScore, extractDescriptorFromImage, isModelsLoaded, lastDescriptor } = useBiometrics(
    videoRef, 
    step === 2 ? 'exam' : 'kyc', 
    idDescriptor, 
    step === 2
  );

  useEffect(() => {
    let activeStream = null;

    if (step === 2) {
      const startCamera = async () => {
        try {
          activeStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } 
          });
          if (videoRef.current) {
            videoRef.current.srcObject = activeStream;
          }
        } catch (err) {
          console.error("Camera access denied:", err);
          alert("Camera access is required for the Live Selfie step.");
        }
      };
      startCamera();
    }

    return () => {
      if (activeStream) activeStream.getTracks().forEach(track => track.stop());
    };
  }, [step]);

  const handleIdUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setDuplicateError('');
    setIsProcessing(true);
    const imageUrl = URL.createObjectURL(file);
    
    const img = new Image();
    img.src = imageUrl;
    img.onload = async () => {
      const descriptor = await extractDescriptorFromImage(img);
      
      if (!descriptor && !e.shiftKey) { 
        setIsProcessing(false);
        alert("SECURITY HALT: No face detected on the uploaded ID. Please upload a clear, well-lit photo of your ID.");
        return;
      }

      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1200;
      const scaleSize = MAX_WIDTH / img.width;
      canvas.width = MAX_WIDTH;
      canvas.height = img.height * scaleSize;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);

      setIdDescriptor(descriptor || new Array(128).fill(0));
      setIdImage(compressedBase64);
      setIsProcessing(false);
      setStep(2); 
    };
  };

  const captureLiveFace = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const compressedLiveFace = canvas.toDataURL('image/jpeg', 0.8);
      setFaceImage(compressedLiveFace);
      submitKycData(compressedLiveFace, lastDescriptor); 
    }
  };

  const submitKycData = async (capturedFace, capturedDescriptor) => {
    setStep(3); 
    setIsProcessing(true);
    
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      
      // AUTO-APPROVE LOGIC: If the AI successfully verified the math, flag it for auto-approval
      const isAutoApproved = aiStatus === 'verified_match';

      const response = await api.post('/auth/kyc', {
        userId: user.id,
        idImage: idImage,
        faceImage: capturedFace,
        clientConfidence: matchScore, 
        idDescriptor: idDescriptor,
        faceDescriptor: capturedDescriptor ? Array.from(capturedDescriptor) : null, // Send live face descriptor for server-side verification
        autoApprove: isAutoApproved
      });

      if (response.data.success) {
        user.kyc = response.data.kyc; 
        localStorage.setItem('user', JSON.stringify(user));
        
        setStep(4);
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } catch (error) {
      console.error("KYC Upload Failed", error);
      const msg = error.response?.data?.message || "Failed to upload secure data. Please try again.";
      const isDuplicate = error.response?.status === 409;
      setDuplicateError(msg);
      setStep(1);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      <header className="bg-gray-900 border-b border-gray-800 px-4 sm:px-6 py-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-7 w-7 sm:h-8 sm:w-8 text-blue-500 shrink-0" />
          <span className="text-base sm:text-xl font-bold text-white tracking-tight">Automatic Proctoring System</span>
        </div>
        <div className="flex items-center gap-2 text-gray-400 text-xs sm:text-sm font-medium bg-gray-800 px-2.5 sm:px-3 py-1.5 rounded-lg border border-gray-700">
          <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Edge AI </span>{isModelsLoaded ? 'Armed' : 'Loading...'}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        
        {step === 1 && (
          <div className="max-w-xl w-full flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-extrabold text-white mb-2">Upload Government ID</h1>
              <p className="text-gray-400">Please upload a clear, high-resolution photo of your University ID.</p>
            </div>

            {duplicateError && (
              <div className="w-full mb-6 flex items-start gap-3 p-4 bg-red-900/40 border border-red-700 rounded-2xl">
                <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-300">Verification Rejected</p>
                  <p className="text-xs text-red-400 mt-0.5">{duplicateError}</p>
                </div>
              </div>
            )}

            <div 
              onClick={() => !isProcessing && isModelsLoaded && fileInputRef.current.click()}
              className={`w-full aspect-video rounded-3xl border-4 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer ${!isModelsLoaded || isProcessing ? 'bg-gray-800 border-gray-700 opacity-50 cursor-not-allowed' : 'bg-gray-800/50 border-blue-500/50 hover:bg-blue-900/20 hover:border-blue-400'}`}
            >
              {isProcessing ? (
                <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
              ) : (
                <UploadCloud className={`h-12 w-12 mb-4 ${isModelsLoaded ? 'text-blue-500' : 'text-gray-500'}`} />
              )}
              <span className="text-lg font-bold text-white">
                {isProcessing ? 'Extracting Biometrics...' : isModelsLoaded ? 'Click to Browse Files' : 'Loading AI Models...'}
              </span>
            </div>
            
            <input type="file" accept="image/jpeg, image/png" className="hidden" ref={fileInputRef} onChange={handleIdUpload} />
          </div>
        )}

        {step === 2 && (
          <div className="max-w-3xl w-full flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-extrabold text-white mb-2">Live Face Verification</h1>
              <p className="text-gray-400">Look directly at the camera. We are matching your face to your ID.</p>
            </div>

            <div className="relative w-full max-w-2xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-800 mb-6">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
              
              <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20">
                <div className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 backdrop-blur-md ${
                  aiStatus === 'verified_match' ? 'bg-green-500/90 text-white border border-green-400' : 
                  'bg-red-500/90 text-white border border-red-400 animate-pulse'
                }`}>
                  {aiStatus === 'verified_match' ? <><CheckCircle2 className="h-4 w-4"/> IDENTITY VERIFIED: {matchScore}%</> : <><AlertTriangle className="h-4 w-4"/> {aiStatus.replace('_', ' ').toUpperCase()}</>}
                </div>
              </div>

              <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                <div className={`w-[40%] h-[80%] border-4 border-dashed rounded-full transition-colors duration-300 ${aiStatus === 'verified_match' ? 'border-green-500/70 bg-green-500/10' : 'border-red-500/70 bg-red-500/10'}`}></div>
              </div>
            </div>

            <button 
              onClick={captureLiveFace} 
              disabled={aiStatus !== 'verified_match' || isProcessing} 
              className={`flex items-center gap-3 px-8 py-4 rounded-full font-bold text-lg transition-all ${aiStatus !== 'verified_match' || isProcessing ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 text-white shadow-[0_0_40px_-10px_rgba(34,197,94,0.5)] hover:scale-105 active:scale-95'}`}
            >
              <Camera className="h-6 w-6" /> Complete & Auto-Approve
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="text-center animate-in fade-in duration-500">
            <Loader2 className="h-16 w-16 text-blue-500 animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2">Encrypting Security Data</h2>
          </div>
        )}

        {step === 4 && (
          <div className="text-center animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Account Unlocked</h2>
            <p className="text-gray-400">Identity automatically verified. Redirecting...</p>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </main>
    </div>
  );
};

export default KycVerification;