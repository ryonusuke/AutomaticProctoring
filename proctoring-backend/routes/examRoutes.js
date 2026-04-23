const express = require('express');
const { createExam, getExams, getExamById, submitExam, getExamsByExaminer, updateExam, deleteExam, notifyStudents, generateQuestions, assignStudents, getResultsByExam, gradeResult, generateFromDocument, generateFromPDF } = require('../controllers/examController');

const router = express.Router();

// ── Existing routes (untouched) ──
router.post('/', createExam);
router.get('/', getExams);
router.get('/:id', getExamById);
router.post('/:id/submit', submitExam);

// ── New teacher dashboard routes ──
router.get('/examiner/:examinerId', getExamsByExaminer);
router.put('/:id', updateExam);
router.delete('/:id', deleteExam);
router.post('/:id/notify', notifyStudents);
router.post('/:id/assign-students', assignStudents);
router.get('/:id/results', getResultsByExam);
router.post('/ai/generate-questions', generateQuestions);
router.post('/ai/generate-from-document', generateFromDocument);
router.post('/ai/generate-from-pdf', generateFromPDF);
router.put('/results/:id/grade', gradeResult);

module.exports = router;