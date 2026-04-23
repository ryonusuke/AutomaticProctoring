const User = require('../models/User');

// @desc    Get ALL users (students, teachers, admins)
// @route   GET /api/admin/users
exports.getAllUsers = async (req, res) => {
  try {
    const { role, kycStatus } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (kycStatus) filter['kyc.status'] = kycStatus;

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get ALL users for the Admin Table (legacy)
// @route   GET /api/admin/students
exports.getAllStudents = async (req, res) => {
  try {
    const users = await User.find({ role: { $in: ['student', 'examiner'] } })
      .select('-password')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get pending KYC submissions
// @route   GET /api/admin/kyc/pending
exports.getPendingKyc = async (req, res) => {
  try {
    const pending = await User.find({ 'kyc.status': 'pending' })
      .select('name email role kyc createdAt')
      .sort({ 'kyc.verifiedAt': -1 });
    res.status(200).json({ success: true, data: pending });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.reviewKyc = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.kyc.status = status;
    
    if (!user.notifications) user.notifications = [];
    
    if (status === 'rejected') {
        user.notifications.push({
            type: 'alert',
            title: 'Security Clearance Revoked',
            message: 'An administrator has manually revoked your KYC clearance. You must re-scan your identity data to access exams.',
            isRead: false,
            date: new Date()
        });
    } else if (status === 'approved') {
        user.notifications.push({
            type: 'success',
            title: 'Security Clearance Approved',
            message: 'Your biometric data has been verified by administration. You can now access assessments.',
            isRead: false,
            date: new Date()
        });
    }

    await user.save({ validateBeforeSave: false });
    
    res.status(200).json({ success: true, message: `KYC ${status} successfully.`, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['student', 'examiner', 'admin'].includes(role))
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    
    const user = await User.findByIdAndUpdate(
      req.params.id, 
      { role }, 
      { new: true }
    ).select('-password');
    
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    // Notify user about role change
    await User.findByIdAndUpdate(user._id, {
      $push: {
        notifications: {
          $each: [{
            type: 'info',
            title: 'Account Role Updated',
            message: `Your account role has been changed to ${role} by an administrator.`,
            isRead: false,
            date: new Date()
          }],
          $position: 0
        }
      }
    });

    res.status(200).json({ success: true, message: `Role updated to ${role}.`, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update student role (legacy)
// @route   PUT /api/admin/students/:id/role
exports.updateStudentRole = async (req, res) => {
  return exports.updateUserRole(req, res);
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.status(200).json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a student (legacy)
// @route   DELETE /api/admin/students/:id
exports.deleteStudent = async (req, res) => {
  return exports.deleteUser(req, res);
};

// @desc    Suspend/Unsuspend user
// @route   PUT /api/admin/users/:id/suspend
exports.suspendUser = async (req, res) => {
  try {
    const { suspended, reason } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    user.suspended = suspended;
    if (suspended) {
      user.suspensionReason = reason || 'No reason provided';
      user.notifications.push({
        type: 'alert',
        title: 'Account Suspended',
        message: `Your account has been suspended. Reason: ${reason || 'No reason provided'}`,
        isRead: false,
        date: new Date()
      });
    } else {
      user.suspensionReason = null;
      user.notifications.push({
        type: 'success',
        title: 'Account Reactivated',
        message: 'Your account has been reactivated by an administrator.',
        isRead: false,
        date: new Date()
      });
    }

    await user.save();
    res.status(200).json({ success: true, message: `User ${suspended ? 'suspended' : 'reactivated'}.`, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Broadcast announcement
// @route   POST /api/admin/announce
exports.announce = async (req, res) => {
  try {
    const { title, message, type = 'info', targetRole } = req.body;
    if (!title || !message)
      return res.status(400).json({ success: false, message: 'Title and message are required.' });

    const filter = targetRole ? { role: targetRole } : { role: { $in: ['student', 'examiner'] } };

    await User.updateMany(
      filter,
      { $push: { notifications: { $each: [{ type, title, message, isRead: false, date: new Date() }], $position: 0 } } }
    );

    const count = await User.countDocuments(filter);
    const roleText = targetRole === 'examiner' ? 'teachers' : targetRole === 'student' ? 'students' : 'users';
    res.status(200).json({ success: true, message: `Announcement sent to ${count} ${roleText}.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get admin statistics
// @route   GET /api/admin/stats
exports.getAdminStats = async (req, res) => {
  try {
    const [totalUsers, students, teachers, admins, pendingKyc, approvedKyc] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'examiner' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ 'kyc.status': 'pending' }),
      User.countDocuments({ 'kyc.status': 'approved' })
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        students,
        teachers,
        admins,
        pendingKyc,
        approvedKyc
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
