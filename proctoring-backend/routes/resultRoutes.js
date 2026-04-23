const express = require('express');
const { getExaminerResults, getStudentResults, submitResult } = require('../controllers/resultController');
const { gradeResult } = require('../controllers/examController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', getExaminerResults);
router.get('/student', protect, getStudentResults);
router.post('/', protect, submitResult);
router.put('/:id/grade', gradeResult);

module.exports = router;