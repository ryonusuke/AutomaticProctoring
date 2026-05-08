# Automatic Proctoring System

A full-stack web application for conducting secure online exams with AI-powered anti-cheat monitoring — no human supervisor required.

## Tech Stack

**Frontend:** React 19 + Vite, TailwindCSS, Zustand, React Router  
**AI/ML:** TensorFlow.js, Face-API.js, COCO-SSD, BlazeFace  
**Backend:** Node.js + Express, MongoDB + Mongoose, JWT, Passport (Google OAuth), Nodemailer

## Features

### Anti-Cheat
- Continuous face recognition (biometric match against KYC baseline)
- Multiple face & gaze tracking (68-point landmarks)
- Forbidden object detection via COCO-SSD (phone, book, laptop)
- Audio monitoring + speech transcription
- Browser lockdown (tab switch, copy/paste, keyboard shortcuts, right-click)
- Fullscreen enforcement + auto-submit on violation limit

### Exam Management
- MCQ, Multiple Correct, Short Answer, Coding question types
- Scheduled exams with per-student assignment
- Auto-grading for objective questions, manual grading for subjective
- Trust score = 100% − violation penalty

### User Roles
| Role | Capabilities |
|------|-------------|
| Student | Take exams, view results, raise tickets |
| Examiner | Create/manage exams, grade, view analytics |
| Admin | Manage users, approve KYC, broadcast notifications |

### KYC Verification
- Government ID + live selfie capture
- Face-API.js 128-dim descriptor matching (Euclidean distance < 0.55)
- Auto-approval above confidence threshold, manual admin fallback

## Project Structure

```
├── src/
│   ├── pages/          # Route-level components
│   ├── hooks/          # useAntiCheat.js, useBiometrics.js
│   ├── components/     # Shared UI components
│   └── services/api.js # Axios instance
├── proctoring-backend/
│   ├── models/         # Mongoose schemas
│   ├── controllers/    # Business logic
│   ├── routes/         # Express routes
│   ├── middleware/     # Auth middleware
│   ├── config/         # Passport OAuth
│   └── utils/          # Email sender
└── public/models/      # Face-API.js model weights
```

## Setup

### Prerequisites
- Node.js 18+, MongoDB, Google OAuth credentials, SMTP email

### Frontend
```bash
npm install
cp .env.example .env   # fill in VITE_API_URL, VITE_GOOGLE_CLIENT_ID
npm run dev
```

### Backend
```bash
cd proctoring-backend
npm install
cp .env.example .env   # fill in all variables (see below)
node server.js
```

### Backend Environment Variables
```
MONGO_URI=
JWT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=
EMAIL_USER=
EMAIL_PASS=
FRONTEND_URL=
```

## Known Limitations
- Desktop only (mobile/tablet blocked by anti-cheat requirements)
- Chrome/Edge recommended (Web Speech API dependency)
- Face-API models ~6MB initial load
- Webcam mandatory — no offline mode
