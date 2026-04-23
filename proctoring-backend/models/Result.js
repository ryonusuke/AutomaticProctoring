const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  score: {
    type: Number,
    required: true,
    default: 0
  },
  totalMarks: {
    type: Number,
    required: true
  },
  // The Anti-Cheat payload from our React hook will be saved here
  trustScore: {
    type: Number,
    default: 100 // Starts at 100%, drops with every violation
  },
  violations: [{
    reason: String,
    timestamp: Date
  }],
  status: {
    type: String,
    enum: ['completed', 'terminated_for_cheating', 'pending_review', 'graded', 'passed', 'failed'],
    required: true
  },
  answers: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timeTaken: {
    type: Number,
    default: 0
  },
  manualGrades: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  comments: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Result', resultSchema);