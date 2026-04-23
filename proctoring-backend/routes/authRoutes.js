const express = require('express');
const passport = require('passport');
const {
  register, login, verifyEmail, resendOTP, forgotPassword,
  resetPassword, submitKyc, googleAuthCallback, getMe,
  markNotificationRead, markAllNotificationsRead, deleteNotification
} = require('../controllers/authController');

const router = express.Router();

router.get('/me', getMe);
router.put('/notifications/read-all', markAllNotificationsRead);
router.put('/notifications/:notifId/read', markNotificationRead);
router.delete('/notifications/:notifId', deleteNotification);

router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/resend-otp', resendOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/kyc', submitKyc);

// Google OAuth
router.get('/google', passport.authenticate('google', { 
  scope: ['email', 'profile'],
  session: false
}));

router.get('/google/callback',
  passport.authenticate('google', { 
    session: false,
    failureRedirect: '/?error=google_auth_failed'
  }),
  googleAuthCallback
);

module.exports = router;
