import { useState, useEffect, useCallback, useRef } from 'react';
import * as faceapi from '@vladmandic/face-api';

// NEW: Added isScanning parameter (defaults to true so it doesn't break your ActiveExam page)
export const useBiometrics = (videoRef, mode = 'kyc', baselineDescriptor = null, isScanning = true) => {
  const [status, setStatus] = useState('loading_models'); 
  const [matchScore, setMatchScore] = useState(0);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const faceMatcherRef = useRef(null);

  // 1. Load Neural Networks
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        setIsModelsLoaded(true);
        setStatus('ready');
      } catch (error) {
        console.error("Failed to load models. Check your /public/models folder.", error);
        setStatus('model_error');
      }
    };
    loadModels();
  }, []);

  // 2. Setup the Cryptographic Matcher 
  useEffect(() => {
    if (baselineDescriptor && isModelsLoaded) {
      const descriptorArray = new Float32Array(baselineDescriptor);
      const labeledDescriptor = new faceapi.LabeledFaceDescriptors('Authorized Student', [descriptorArray]);
      faceMatcherRef.current = new faceapi.FaceMatcher(labeledDescriptor, 0.6); 
    }
  }, [baselineDescriptor, isModelsLoaded]);

  // 3. Extract Math from ID Card (TUNED FOR TINY FACES)
  const extractDescriptorFromImage = async (imageElement) => {
    if (!isModelsLoaded) return null;
    setStatus('analyzing_id');
    
    // We explicitly increase inputSize to 800 so the AI can see the tiny face on the ID card
    const idDetectorOptions = new faceapi.TinyFaceDetectorOptions({ inputSize: 800, scoreThreshold: 0.3 });
    
    const detection = await faceapi.detectSingleFace(imageElement, idDetectorOptions)
      .withFaceLandmarks()
      .withFaceDescriptor();
    
    if (!detection) {
      setStatus('no_face_on_id');
      return null;
    }
    
    setStatus('id_processed');
    return Array.from(detection.descriptor); 
  };

  // 4. Continuous Scanning Loop
  const analyzeFrame = useCallback(async () => {
    const video = videoRef.current;
    // Validate it is a real HTMLVideoElement before passing to face-api
    if (!video || !(video instanceof HTMLVideoElement) || !isModelsLoaded) return;
    if (video.readyState < 2 || video.videoWidth === 0) return;

    try {
      // Standard options for a live webcam face
      const webcamOptions = new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 });
      const detections = await faceapi.detectAllFaces(video, webcamOptions)
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (detections.length === 0) {
        setStatus('no_face');
        setMatchScore(0);
        return;
      }

      if (detections.length > 1) {
        setStatus('multiple_faces');
        setMatchScore(0);
        return;
      }

      const currentFaceDescriptor = detections[0].descriptor;

      if (mode === 'kyc' && !faceMatcherRef.current) {
        setStatus('face_aligned');
        setMatchScore(Math.round(detections[0].detection.score * 100)); 
        return;
      }

      if (faceMatcherRef.current) {
        const match = faceMatcherRef.current.findBestMatch(currentFaceDescriptor);
        if (match.label === 'Authorized Student') {
          setStatus('verified_match');
          const confidence = Math.max(0, Math.round((1 - match.distance) * 100));
          setMatchScore(confidence);
        } else {
          setStatus('unauthorized_user');
          setMatchScore(0);
        }
      }

    } catch (error) {
      console.error("Frame analysis error", error);
    }
  }, [videoRef, isModelsLoaded, mode]);

  // NEW: Updated useEffect to respect the isScanning trigger
  useEffect(() => {
    let interval;
    // The loop only runs if models are loaded, video exists, AND isScanning is true
    if (isModelsLoaded && videoRef.current && isScanning) {
      interval = setInterval(analyzeFrame, 1500);
    }
    return () => clearInterval(interval);
  }, [analyzeFrame, isModelsLoaded, isScanning]);

  return { status, matchScore, extractDescriptorFromImage, isModelsLoaded };
};