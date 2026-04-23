const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userRole: { type: String, enum: ['student', 'examiner', 'admin'], default: 'student' },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['General', 'Technical', 'Exam Issue', 'KYC/Verification', 'Grading', 'Account', 'Feature Request', 'Bug Report'],
    default: 'General' 
  },
  examRef: { type: String, default: '' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tags: [{ type: String }],
  replies: [{
    from: { type: String, enum: ['student', 'examiner', 'admin'], required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: { type: String, required: true },
    date: { type: Date, default: Date.now }
  }],
  resolvedAt: { type: Date },
  lastActivityAt: { type: Date, default: Date.now }
}, { timestamps: true });

ticketSchema.index({ userId: 1, status: 1 });
ticketSchema.index({ status: 1, priority: -1, lastActivityAt: -1 });

module.exports = mongoose.model('Ticket', ticketSchema);
