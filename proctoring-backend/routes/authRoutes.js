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

// Google OAuth — role stored in callbackURL path via a dedicated per-role callback
// We cannot use `state` with session:false (passport tries to verify state via session → 500)
// We cannot append ?role= to callbackURL (Google rejects non-exact redirect URIs)
// Solution: encode role in a harmless part of the URL that Google ignores — use a proxy param
// that we read BEFORE passport touches it, stored in res.locals
router.get('/google', (req, res, next) => {
  const role = ['student', 'examiner'].includes(req.query.role) ? req.query.role : 'student';
  // Store role in a signed cookie so it survives the redirect without session or state
  res.cookie('oauth_role', role, { httpOnly: true, sameSite: 'none', secure: true, maxAge: 5 * 60 * 1000 });
  passport.authenticate('google', {
    scope: ['email', 'profile'],
    session: false,
  })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/?error=google_auth_failed`,
  })(req, res, next);
}, googleAuthCallback);

module.exports = router;
