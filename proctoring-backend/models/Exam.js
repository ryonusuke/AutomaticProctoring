const mongoose = require('mongoose');

// We embed questions directly into the exam for faster database reads during a live test
const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: [true, 'Question text is required']
  },
  type: {
    type: String,
    enum: ['mcq', 'multiple_correct', 'short_answer', 'coding'],
    default: 'mcq'
  },
  options: {
    type: [String],
    default: []
  },
  correctOptionIndex: {
    type: Number,
    default: 0
  },
  correctOptionIndices: {
    type: [Number],
    default: []
  },
  modelAnswer: {
    type: String,
    default: ''
  },
  marks: {
    type: Number,
    default: 1
  },
  negativeMark: {
    type: Number,
    default: 0
  },
  image: {
    type: String,
    default: ''
  }
});

const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Exam title is required'],
    trim: true
  },
  courseCode: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  // Links the exam to the specific teacher who created it
  examinerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  durationMinutes: {
    type: Number,
    required: [true, 'Exam duration is required'],
    min: 1
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  // The heart of the proctoring system's configuration
  securitySettings: {
    requireWebcam: { type: Boolean, default: true },
    requireMic: { type: Boolean, default: false },
    strictBrowserLock: { type: Boolean, default: true },
    toleranceLimit: { type: Number, default: 3 } // How many warnings before termination
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'completed'],
    default: 'draft'
  },
  negativeMarking: {
    type: Boolean,
    default: false
  },
  passingScore: {
    type: Number,
    default: 40,
    min: 0,
    max: 100
  },
  description: {
    type: String,
    default: ''
  },
  assignedStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  questions: [questionSchema]
}, { timestamps: true });

module.exports = mongoose.model('Exam', examSchema);