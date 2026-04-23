const crypto = require('crypto');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/sendEmail');

const generateToken = (id, expiresIn = '1d') =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn });

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// @route POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'All fields are required.' });

    if (password.length < 8)
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });

    const otp = generateOTP();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student',
      isEmailVerified: false,
      emailVerificationOTP: otp,
      emailVerificationExpires: expires,
    });

    // Send email non-blocking — don't fail registration if email fails
    sendEmail({
      to: email,
      subject: 'Verify your email — Proctoring System',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;">
          <h2 style="color:#1d4ed8;margin-bottom:8px;">Welcome, ${name}!</h2>
          <p style="color:#374151;">Use the OTP below to verify your email address. It expires in <strong>15 minutes</strong>.</p>
          <div style="font-size:36px;font-weight:700;letter-spacing:8px;color:#1d4ed8;text-align:center;padding:24px 0;">${otp}</div>
          <p style="color:#6b7280;font-size:13px;">If you didn't create this account, you can safely ignore this email.</p>
        </div>
      `,
    }).catch(err => console.error('Email send failed:', err.message));

    console.log(`[DEV] Email OTP for ${email}: ${otp}`);

    res.status(201).json({
      success: true,
      message: 'Account created! Please check your email for the verification OTP.',
      email,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/auth/verify-email
exports.verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email })
      .select('+emailVerificationOTP +emailVerificationExpires');

    if (!user)
      return res.status(404).json({ success: false, message: 'User not found.' });

    if (user.isEmailVerified)
      return res.status(400).json({ success: false, message: 'Email is already verified.' });

    if (user.emailVerificationOTP !== otp)
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });

    if (user.emailVerificationExpires < Date.now())
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });

    user.isEmailVerified = true;
    user.emailVerificationOTP = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, message: 'Email verified successfully! You can now log in.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/auth/resend-otp
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user)
      return res.status(404).json({ success: false, message: 'User not found.' });

    if (user.isEmailVerified)
      return res.status(400).json({ success: false, message: 'Email is already verified.' });

    const otp = generateOTP();
    user.emailVerificationOTP = otp;
    user.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    await sendEmail({
      to: email,
      subject: 'New OTP — Proctoring System',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;">
          <h2 style="color:#1d4ed8;">New Verification OTP</h2>
          <p style="color:#374151;">Your new OTP (expires in 15 minutes):</p>
          <div style="font-size:36px;font-weight:700;letter-spacing:8px;color:#1d4ed8;text-align:center;padding:24px 0;">${otp}</div>
        </div>
      `,
    });

    res.status(200).json({ success: true, message: 'New OTP sent to your email.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required.' });

    const user = await User.findOne({ email }).select('+password +googleId +isEmailVerified');

    console.log('[LOGIN DEBUG]', { found: !!user, isEmailVerified: user?.isEmailVerified, hasPassword: !!user?.password });

    if (!user || !(await bcrypt.compare(password, user.password || '')))
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    console.log('[LOGIN DEBUG] password matched, isEmailVerified:', user.isEmailVerified);

    if (user.isEmailVerified === false)
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in.',
        needsVerification: true,
        email,
      });

    const expiresIn = rememberMe ? '30d' : '1d';
    const token = generateToken(user._id, expiresIn);

    res.status(200).json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, kyc: user.kyc },
      token,
      expiresIn,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always return success to prevent email enumeration
    if (!user)
      return res.status(200).json({ success: true, message: 'If that email exists, a reset OTP has been sent.' });

    const otp = generateOTP();
    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await user.save({ validateBeforeSave: false });

    await sendEmail({
      to: email,
      subject: 'Password Reset OTP — Proctoring System',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;">
          <h2 style="color:#dc2626;">Password Reset Request</h2>
          <p style="color:#374151;">Use this OTP to reset your password. It expires in <strong>10 minutes</strong>.</p>
          <div style="font-size:36px;font-weight:700;letter-spacing:8px;color:#dc2626;text-align:center;padding:24px 0;">${otp}</div>
          <p style="color:#6b7280;font-size:13px;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });

    res.status(200).json({ success: true, message: 'If that email exists, a reset OTP has been sent.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!newPassword || newPassword.length < 8)
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });

    const user = await User.findOne({ email }).select('+resetPasswordOTP +resetPasswordExpires');

    if (!user || user.resetPasswordOTP !== otp)
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });

    if (user.resetPasswordExpires < Date.now())
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });

    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successfully! You can now log in.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/auth/google/callback  (called by passport)
exports.googleAuthCallback = async (req, res) => {
  try {
    console.log('[GOOGLE CALLBACK CONTROLLER] Processing user:', req.user?.emails?.[0]?.value);

    const { id, displayName, emails } = req.user;
    const email = emails[0].value;
    // role passed via OAuth state param (defaults to 'student')
    const requestedRole = ['student', 'examiner'].includes(req.query.state) ? req.query.state : 'student';

    let user = await User.findOne({ email });

    if (!user) {
      // New user — create with the role they selected
      user = await User.create({
        name: displayName,
        email,
        googleId: id,
        isEmailVerified: true,
        role: requestedRole,
      });
      console.log('[GOOGLE AUTH] Created new user:', user._id, 'role:', requestedRole);
    } else {
      // Existing user — link googleId if not already, preserve their role and KYC
      let changed = false;
      if (!user.googleId) { user.googleId = id; changed = true; }
      if (!user.isEmailVerified) { user.isEmailVerified = true; changed = true; }
      if (changed) await user.save({ validateBeforeSave: false });
      console.log('[GOOGLE AUTH] Existing user:', user._id, 'role:', user.role);
    }

    const token = generateToken(user._id, '1d');
    const userData = encodeURIComponent(
      JSON.stringify({ id: user._id, name: user.name, email: user.email, role: user.role, kyc: user.kyc })
    );

    const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/callback?token=${token}&user=${userData}`;
    console.log('[GOOGLE AUTH] Redirecting to:', redirectUrl);
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('[GOOGLE AUTH ERROR]', error);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/?error=google_auth_failed`);
  }
};

// ── KYC duplicate detection helpers ──────────────────────────────────────
// Euclidean distance between two 128-dim face descriptors
const faceDistance = (a, b) => {
  if (!a?.length || !b?.length || a.length !== b.length) return Infinity;
  return Math.sqrt(a.reduce((sum, v, i) => sum + (v - b[i]) ** 2, 0));
};

// Simple hash of first 200 chars of base64 image to detect same ID image reuse
const imageHash = (base64) => {
  if (!base64) return null;
  const sample = base64.replace(/^data:image\/\w+;base64,/, '').slice(0, 500);
  let h = 0;
  for (let i = 0; i < sample.length; i++) h = (Math.imul(31, h) + sample.charCodeAt(i)) | 0;
  return h.toString();
};

// @desc    Submit KYC
exports.submitKyc = async (req, res) => {
  try {
    const { userId, idImage, faceImage, clientConfidence, idDescriptor, autoApprove } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // ── Duplicate face check ──────────────────────────────────────────────
    if (idDescriptor?.length) {
      const others = await User.find({
        _id: { $ne: userId },
        'kyc.idDescriptor': { $exists: true, $not: { $size: 0 } },
        'kyc.status': { $in: ['approved', 'pending'] }
      }).select('name kyc.idDescriptor');

      for (const other of others) {
        const dist = faceDistance(idDescriptor, other.kyc.idDescriptor);
        // Threshold: < 0.45 = same person (face-api.js standard)
        if (dist < 0.45) {
          return res.status(409).json({
            success: false,
            message: `Duplicate face detected. This face is already registered to another account. If this is a mistake, contact your administrator.`,
            duplicate: true,
          });
        }
      }
    }

    // ── Duplicate ID image check ──────────────────────────────────────────
    if (idImage) {
      const incomingHash = imageHash(idImage);
      const othersWithId = await User.find({
        _id: { $ne: userId },
        'kyc.idImage': { $exists: true, $ne: null },
        'kyc.status': { $in: ['approved', 'pending'] }
      }).select('name kyc.idImage');

      for (const other of othersWithId) {
        if (imageHash(other.kyc.idImage) === incomingHash) {
          return res.status(409).json({
            success: false,
            message: `This ID document is already registered to another account. Each student must use their own unique ID.`,
            duplicate: true,
          });
        }
      }
    }

    // ── Save KYC ─────────────────────────────────────────────────────────
    user.kyc = {
      isVerified: autoApprove === true,
      status: autoApprove ? 'approved' : 'pending',
      idImage,
      faceImage,
      aiConfidenceScore: clientConfidence,
      idDescriptor,
      verifiedAt: Date.now(),
    };
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: autoApprove ? 'Identity verified successfully!' : 'Data secured. Pending Admin review.',
      kyc: user.kyc,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Password
exports.updatePassword = async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    const user = await User.findById(userId).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Incorrect current password' });

    user.password = newPassword;
    await user.save();
    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token.' });
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.status(200).json({ success: true, user });
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

// @route PUT /api/auth/notifications/:notifId/read
exports.markNotificationRead = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await User.updateOne(
      { _id: decoded.id, 'notifications._id': req.params.notifId },
      { $set: { 'notifications.$.isRead': true } }
    );
    res.status(200).json({ success: true });
  } catch { res.status(400).json({ success: false }); }
};

// @route PUT /api/auth/notifications/read-all
exports.markAllNotificationsRead = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await User.updateOne(
      { _id: decoded.id },
      { $set: { 'notifications.$[].isRead': true } }
    );
    res.status(200).json({ success: true });
  } catch { res.status(400).json({ success: false }); }
};

// @route DELETE /api/auth/notifications/:notifId
exports.deleteNotification = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await User.updateOne(
      { _id: decoded.id },
      { $pull: { notifications: { _id: req.params.notifId } } }
    );
    res.status(200).json({ success: true });
  } catch { res.status(400).json({ success: false }); }
};

// @route DELETE /api/auth/notifications/clear-all
exports.clearAllNotifications = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await User.updateOne({ _id: decoded.id }, { $set: { notifications: [] } });
    res.status(200).json({ success: true });
  } catch { res.status(400).json({ success: false }); }
};
