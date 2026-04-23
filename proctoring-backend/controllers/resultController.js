const Result = require('../models/Result');
const Exam = require('../models/Exam');

// @desc    Get all exam results for a specific examiner
// @route   GET /api/results
exports.getExaminerResults = async (req, res) => {
  try {
    const { examinerId } = req.query;

    let results;
    if (examinerId) {
      const exams = await Exam.find({ examinerId }).select('_id');
      const examIds = exams.map(exam => exam._id);
      results = await Result.find({ examId: { $in: examIds } })
        .populate('studentId', 'name email')
        .populate('examId', 'title courseCode')
        .sort({ 'examId.title': 1, score: -1, createdAt: -1 }); // Sort by exam title, then score, then time
    } else {
      // Admin: return all results
      results = await Result.find()
        .populate('studentId', 'name email')
        .populate('examId', 'title courseCode')
        .sort({ 'examId.title': 1, score: -1, createdAt: -1 });
    }

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get logged in student's results
// @route   GET /api/results/student
exports.getStudentResults = async (req, res) => {
  try {
    const results = await Result.find({ studentId: req.user.id })
      .populate('examId', 'title courseCode questions')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit Exam Result (THE MISSING FUNCTION)
// @route   POST /api/results
exports.submitResult = async (req, res) => {
  try {
    const { examId, score, totalMarks, answers, violations, terminationReason, status } = req.body;
    
    // Calculate a basic Trust Score based on violations
    const trustScore = Math.max(0, 100 - (violations.length * 15));

    const result = await Result.create({
      studentId: req.user.id,
      examId,
      score,
      totalMarks,
      answers,
      violations,
      terminationReason,
      status,
      trustScore
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};