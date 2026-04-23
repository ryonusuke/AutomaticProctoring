const express = require('express');
const {
  getAllUsers,
  getAllStudents,
  getUserById,
  getPendingKyc,
  reviewKyc,
  updateUserRole,
  updateStudentRole,
  deleteUser,
  deleteStudent,
  suspendUser,
  announce,
  getAdminStats
} = require('../controllers/adminController');

const router = express.Router();

// User management
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/suspend', suspendUser);

// KYC management
router.get('/kyc/pending', getPendingKyc);
router.put('/kyc/:id/review', reviewKyc);

// Legacy routes (backward compatibility)
router.get('/students', getAllStudents);
router.put('/students/:id/role', updateStudentRole);
router.delete('/students/:id', deleteStudent);

// Announcements
router.post('/announce', announce);

// Statistics
router.get('/stats', getAdminStats);

module.exports = router;
