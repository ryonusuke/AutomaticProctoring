const express = require('express');
const passport = require('passport');
const {
  register, login, verifyEmail, resendOTP, forgotPassword,
  resetPassword, submitKyc, googleAuthCallback, getMe,
  markNotificationRead, markAllNotificationsRead, deleteNotification, clearAllNotifications
} = require('../controllers/authController');

const router = express.Router();

router.get('/me', getMe);
router.put('/notifications/read-all', markAllNotificationsRead);
router.put('/notifications/:notifId/read', markNotificationRead);
router.delete('/notifications/clear-all', clearAllNotifications);
router.delete('/notifications/:notifId', deleteNotification);

router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/resend-otp', resendOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/kyc', submitKyc);

// Google OAuth — pass role as query param, stored in passport callbackURL
router.get('/google', (req, res, next) => {
  const role = ['student', 'examiner'].includes(req.query.role) ? req.query.role : 'student';
  // Store role in the callbackURL so it survives the redirect without needing session state
  const callbackURL = `${process.env.SERVER_URL || 'http://localhost:5000'}/api/auth/google/callback?role=${role}`;
  passport.authenticate('google', {
    scope: ['email', 'profile'],
    session: false,
    callbackURL,
  })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  const role = ['student', 'examiner'].includes(req.query.role) ? req.query.role : 'student';
  const callbackURL = `${process.env.SERVER_URL || 'http://localhost:5000'}/api/auth/google/callback?role=${role}`;
  passport.authenticate('google', {
    session: false,
    callbackURL,
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/?error=google_auth_failed`,
  })(req, res, next);
}, googleAuthCallback);

module.exports = router;
