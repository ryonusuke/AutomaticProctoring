const Exam = require('../models/Exam');
const Result = require('../models/Result');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const axios = require('axios');

// ── helpers ────────────────────────────────────────────────────────────────
const notifyUsers = async (userIds, title, message, type = 'info') => {
  const filter = userIds && userIds.length
    ? { _id: { $in: userIds } }
    : { role: 'student' };

  await User.updateMany(
    filter,
    { $push: { notifications: { $each: [{ type, title, message, isRead: false, date: new Date() }], $position: 0 } } }
  );

  const users = await User.find(filter).select('email');
  const html = `<div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;">
    <h2 style="color:#1d4ed8;">${title}</h2>
    <p style="color:#374151;">${message}</p>
    <p style="color:#6b7280;font-size:12px;margin-top:24px;">Log in to the Automatic Proctoring System for details.</p>
  </div>`;
  users.forEach(u => sendEmail({ to: u.email, subject: title, html }).catch(() => {}));
};

const notifyAllStudents = (title, message) => notifyUsers(null, title, message);

// @route POST /api/exams
exports.createExam = async (req, res) => {
  try {
    const { title, courseCode, examinerId, durationMinutes, startTime, endTime, securitySettings, questions, description, negativeMarking, assignedStudents } = req.body;
    const newExam = await Exam.create({ title, courseCode, examinerId, durationMinutes, startTime, endTime, securitySettings, questions, description, negativeMarking, assignedStudents: assignedStudents || [] });

    if (assignedStudents?.length) {
      notifyUsers(
        assignedStudents,
        `New Exam Assigned: ${title}`,
        `You have been assigned to "${title}" (${courseCode}). Duration: ${durationMinutes} mins. Start: ${new Date(startTime).toLocaleString()}.`
      );
    }

    res.status(201).json({ success: true, message: 'Exam created successfully', data: newExam });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @route GET /api/exams
exports.getExams = async (req, res) => {
  try {
    const { studentId } = req.query;
    let query = {};
    if (studentId) {
      const { Types } = require('mongoose');
      const sid = new Types.ObjectId(studentId);
      query = { 
        assignedStudents: sid,
        $expr: { $gt: [{ $size: { $ifNull: ['$assignedStudents', []] } }, 0] }
      };
    }
    const exams = await Exam.find(query).select('-questions').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: exams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/exams/:id
exports.getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    // teacher=true query param returns full exam with answers (for grading)
    if (req.query.teacher === 'true') {
      return res.status(200).json({ success: true, data: exam.toObject() });
    }
    const secureExam = exam.toObject();
    secureExam.questions = secureExam.questions.map(q => {
      const { correctOptionIndex, correctOptionIndices, modelAnswer, ...rest } = q;
      return rest;
    });
    res.status(200).json({ success: true, data: secureExam });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Invalid exam ID' });
  }
};

// @route POST /api/exams/:id/submit
exports.submitExam = async (req, res) => {
  try {
    const { studentId, answers, violations, timeTaken } = req.body;
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    // Prevent duplicate submissions
    const existing = await Result.findOne({ examId: exam._id, studentId });
    if (existing) return res.status(400).json({ success: false, message: 'Already submitted this exam.' });

    let score = 0;
    let totalMarks = 0;
    const hasShortAnswer = exam.questions.some(q => q.type === 'short_answer');

    exam.questions.forEach((question, index) => {
      totalMarks += question.marks;
      const ans = answers[index];
      if (question.type === 'mcq') {
        if (ans === question.correctOptionIndex) score += question.marks;
        else if (exam.negativeMarking && ans !== undefined && ans !== null) score -= (question.negativeMark || 0);
      } else if (question.type === 'multiple_correct') {
        const correctSet = new Set(question.correctOptionIndices || []);
        const givenArr = Array.isArray(ans) ? ans : [];
        const correctArr = [...correctSet];
        // Partial marking: +1 per correct selection, -1 per wrong selection, min 0
        let partial = 0;
        const perMark = question.marks / (correctArr.length || 1);
        givenArr.forEach(a => { if (correctSet.has(a)) partial += perMark; else partial -= perMark; });
        partial = Math.max(0, Math.min(partial, question.marks));
        // Round to 2 decimal places
        score += Math.round(partial * 100) / 100;
        if (partial === 0 && givenArr.length > 0 && exam.negativeMarking) score -= (question.negativeMark || 0);
      }
    });

    score = Math.max(0, score);
    let status;
    let trustScore = Math.max(0, 100 - (violations.length * 20));
    
    if (violations.length >= exam.securitySettings.toleranceLimit) {
      status = 'terminated_for_cheating';
      trustScore = 0;
    } else if (hasShortAnswer) {
      status = 'pending_review'; // Awaiting teacher grading
    } else {
      status = (score / totalMarks) >= 0.4 ? 'passed' : 'failed';
    }

    const result = await Result.create({ studentId, examId: exam._id, score, totalMarks, trustScore, violations, status, answers, timeTaken });
    await Exam.findByIdAndUpdate(exam._id, { status: 'completed' });

    // Notify the exam's teacher
    const student = await User.findById(studentId).select('name');
    if (exam.examinerId) {
      const violationNote = violations.length > 0 ? ` (${violations.length} violation${violations.length > 1 ? 's' : ''} detected)` : '';
      const statusLabel = status === 'terminated_for_cheating' ? '⚠️ Terminated for cheating' : status === 'pending_review' ? '📝 Pending manual review' : `Score: ${score}/${totalMarks}`;
      await User.findByIdAndUpdate(exam.examinerId, {
        $push: {
          notifications: {
            $each: [{
              type: violations.length > 0 ? 'alert' : 'info',
              title: `Exam Submitted: ${exam.title}`,
              message: `${student?.name || 'A student'} submitted "${exam.title}" (${exam.courseCode}). ${statusLabel}${violationNote}.`,
              isRead: false,
              date: new Date()
            }],
            $position: 0
          }
        }
      });
    }

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/exams/examiner/:examinerId
exports.getExamsByExaminer = async (req, res) => {
  try {
    const exams = await Exam.find({ examinerId: req.params.examinerId }).select('-questions').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: exams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route PUT /api/exams/:id
exports.updateExam = async (req, res) => {
  try {
    const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    if (exam.assignedStudents?.length) {
      notifyUsers(
        exam.assignedStudents,
        `Exam Updated: ${exam.title}`,
        `The exam "${exam.title}" has been updated. Please check the latest details.`
      );
    }

    res.status(200).json({ success: true, data: exam });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route DELETE /api/exams/:id
exports.deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    res.status(200).json({ success: true, message: 'Exam deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/exams/:id/notify
exports.notifyStudents = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    const { message: customMsg } = req.body;
    const msg = customMsg || `Exam "${exam.title}" (${exam.courseCode}) — Start: ${new Date(exam.startTime).toLocaleString()}, Duration: ${exam.durationMinutes} mins.`;

    const targetIds = exam.assignedStudents?.length ? exam.assignedStudents : [];
    
    if (targetIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No students assigned to this exam. Assign students first.' });
    }
    
    await notifyUsers(targetIds, `Exam Reminder: ${exam.title}`, msg);

    res.status(200).json({ success: true, message: `Notified ${targetIds.length} student(s).` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/exams/:id/assign-students
exports.assignStudents = async (req, res) => {
  try {
    const { studentIds } = req.body;
    const exam = await Exam.findByIdAndUpdate(
      req.params.id, 
      { assignedStudents: studentIds || [] }, 
      { new: true }
    );
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    
    if (studentIds?.length > 0) {
      notifyUsers(studentIds, `You've been assigned: ${exam.title}`,
        `You have been assigned to the exam "${exam.title}" (${exam.courseCode}). Start: ${new Date(exam.startTime).toLocaleString()}.`
      );
    }
    
    const message = studentIds?.length > 0 
      ? `${studentIds.length} student(s) assigned successfully.`
      : 'Exam hidden from all students (no assignments).';
    
    res.status(200).json({ success: true, message, data: exam });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/exams/:id/results
exports.getResultsByExam = async (req, res) => {
  try {
    const results = await Result.find({ examId: req.params.id })
      .populate('studentId', 'name email')
      .populate('examId', 'title courseCode questions')
      .sort({ score: -1, createdAt: -1 });
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/exams/ai/generate-questions
exports.generateQuestions = async (req, res) => {
  try {
    const { topic, count = 5, difficulty = 'medium', type = 'mcq' } = req.body;
    if (!topic) return res.status(400).json({ success: false, message: 'Topic is required.' });

    let format = '';
    if (type === 'mcq') format = '[{"questionText":"...","type":"mcq","options":["A","B","C","D"],"correctOptionIndex":0,"marks":1,"negativeMark":0}]';
    else if (type === 'multiple_correct') format = '[{"questionText":"...","type":"multiple_correct","options":["A","B","C","D"],"correctOptionIndices":[0,2],"marks":2,"negativeMark":0}]';
    else if (type === 'short_answer') format = '[{"questionText":"...","type":"short_answer","modelAnswer":"...","marks":2}]';

    const prompt = `Generate ${count} ${type.replace('_', ' ')} questions about "${topic}" at ${difficulty} difficulty.\nRules: Return ONLY a valid JSON array. No markdown, no backticks, no code blocks. All string values must be single-line (no newlines or tabs inside strings).\nFormat: ${format}`;

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      { model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], temperature: 0.7 },
      { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' } }
    );

    const raw = response.data.choices[0].message.content;
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return res.status(500).json({ success: false, message: 'AI returned invalid format.' });
    
    let cleaned = jsonMatch[0]
      .replace(/\r/g, '')
      .replace(/([^\\])\n/g, '$1\\n')
      .replace(/([^\\])\t/g, '$1\\t')
      .replace(/```[\w]*/g, '')
      .replace(/```/g, '');

    let questions;
    try {
      questions = JSON.parse(cleaned);
    } catch (e) {
      const matches = [...cleaned.matchAll(/\{[^{}]*\}/gs)];
      if (!matches.length) return res.status(500).json({ success: false, message: 'AI returned unparseable JSON. Try again.' });
      questions = matches.map(m => { try { return JSON.parse(m[0]); } catch { return null; } }).filter(Boolean);
    }
    
    res.status(200).json({ success: true, data: questions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.response?.data?.error?.message || error.message });
  }
};

// @route PUT /api/exams/results/:id/grade
exports.gradeResult = async (req, res) => {
  try {
    const { manualGrades, comments, action } = req.body; // action: 'accept'|'penalize'|'disqualify'
    const result = await Result.findById(req.params.id).populate('examId').populate('studentId', 'name email');
    if (!result) return res.status(404).json({ success: false, message: 'Result not found.' });

    const wasPendingReview = result.status === 'pending_review';
    const exam = result.examId;

    if (action === 'disqualify') {
      result.status = 'terminated_for_cheating';
      result.manualGrades = manualGrades || {};
      if (comments) result.comments = comments;
      await result.save();
      if (result.studentId) {
        await notifyUsers([result.studentId._id], `Result Published: ${exam.title}`,
          `Your result for "${exam.title}" has been reviewed. Status: DISQUALIFIED.`);
      }
      return res.status(200).json({ success: true, data: result });
    }

    let newScore = 0;
    exam.questions.forEach((question, index) => {
      if (manualGrades[index] !== undefined && manualGrades[index] !== null && manualGrades[index] !== '') {
        newScore += Number(manualGrades[index]) || 0;
      } else {
        const ans = result.answers[index];
        if (question.type === 'mcq') {
          if (ans === question.correctOptionIndex) newScore += question.marks;
          else if (exam.negativeMarking && ans !== undefined && ans !== null) newScore -= (question.negativeMark || 0);
        } else if (question.type === 'multiple_correct') {
          const correctSet = new Set(question.correctOptionIndices || []);
          const givenArr = Array.isArray(ans) ? ans : [];
          const correctArr = [...correctSet];
          let partial = 0;
          const perMark = question.marks / (correctArr.length || 1);
          givenArr.forEach(a => { if (correctSet.has(a)) partial += perMark; else partial -= perMark; });
          partial = Math.max(0, Math.min(partial, question.marks));
          newScore += Math.round(partial * 100) / 100;
          if (partial === 0 && givenArr.length > 0 && exam.negativeMarking) newScore -= (question.negativeMark || 0);
        }
      }
    });

    if (action === 'penalize') newScore = Math.floor(newScore * 0.5);

    result.score = Math.max(0, Math.min(newScore, result.totalMarks));
    result.manualGrades = manualGrades;
    if (comments) result.comments = comments;
    result.status = result.score / result.totalMarks >= 0.4 ? 'passed' : 'failed';
    await result.save();

    if ((wasPendingReview || action) && result.studentId) {
      await notifyUsers([result.studentId._id], `Result Published: ${exam.title}`,
        `Your result for "${exam.title}" has been graded. Score: ${result.score}/${result.totalMarks}. Status: ${result.status.toUpperCase()}.`);
    }

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/exams/ai/generate-from-document
exports.generateFromDocument = async (req, res) => {
  try {
    const { text, count = 5, difficulty = 'medium', type = 'mcq' } = req.body;
    if (!text || text.trim().length < 50)
      return res.status(400).json({ success: false, message: 'Please provide at least 50 characters of document text.' });

    let format = '';
    if (type === 'mcq') format = '[{"questionText":"...","type":"mcq","options":["A","B","C","D"],"correctOptionIndex":0,"marks":1,"negativeMark":0}]';
    else if (type === 'multiple_correct') format = '[{"questionText":"...","type":"multiple_correct","options":["A","B","C","D"],"correctOptionIndices":[0,2],"marks":2,"negativeMark":0}]';
    else if (type === 'short_answer') format = '[{"questionText":"...","type":"short_answer","modelAnswer":"...","marks":2}]';

    const truncated = text.slice(0, 6000);

    const prompt = `You are an exam question generator. Based on the following document/syllabus content, generate ${count} ${type.replace('_', ' ')} exam questions at ${difficulty} difficulty level.\nRules: Return ONLY a valid JSON array. No markdown, no backticks, no code blocks. All string values must be single-line (no newlines or tabs inside strings). Questions must be directly based on the provided content.\nFormat: ${format}\n\nDocument content:\n"""\n${truncated}\n"""`;

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      { model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], temperature: 0.5 },
      { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' } }
    );

    const raw = response.data.choices[0].message.content;
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return res.status(500).json({ success: false, message: 'AI returned invalid format.' });

    let cleaned = jsonMatch[0]
      .replace(/\r/g, '')
      .replace(/([^\\])\n/g, '$1\\n')
      .replace(/([^\\])\t/g, '$1\\t')
      .replace(/```[\w]*/g, '')
      .replace(/```/g, '');

    let questions;
    try {
      questions = JSON.parse(cleaned);
    } catch {
      const matches = [...cleaned.matchAll(/\{[^{}]*\}/gs)];
      if (!matches.length) return res.status(500).json({ success: false, message: 'AI returned unparseable JSON. Try again.' });
      questions = matches.map(m => { try { return JSON.parse(m[0]); } catch { return null; } }).filter(Boolean);
    }

    res.status(200).json({ success: true, data: questions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.response?.data?.error?.message || error.message });
  }
};

// @route POST /api/exams/ai/generate-from-pdf
exports.generateFromPDF = async (req, res) => {
  try {
    const { pdfBase64, count = 5, difficulty = 'medium', type = 'mcq' } = req.body;
    if (!pdfBase64) return res.status(400).json({ success: false, message: 'PDF file is required.' });

    const pdfBuffer = Buffer.from(pdfBase64.split(',')[1] || pdfBase64, 'base64');
    
    let text = '';
    try {
      const { PdfReader } = require('pdfreader');
      const textChunks = [];
      await new Promise((resolve, reject) => {
        new PdfReader().parseBuffer(pdfBuffer, (err, item) => {
          if (err) reject(err);
          else if (!item) resolve();
          else if (item.text) textChunks.push(item.text);
        });
      });
      text = textChunks.join(' ');
    } catch (parseErr) {
      return res.status(400).json({ success: false, message: 'Failed to parse PDF: ' + parseErr.message });
    }

    if (!text || text.trim().length < 50) {
      return res.status(400).json({ success: false, message: 'PDF contains insufficient text (min 50 characters).' });
    }

    let format = '';
    if (type === 'mcq') format = '[{"questionText":"...","type":"mcq","options":["A","B","C","D"],"correctOptionIndex":0,"marks":1,"negativeMark":0}]';
    else if (type === 'multiple_correct') format = '[{"questionText":"...","type":"multiple_correct","options":["A","B","C","D"],"correctOptionIndices":[0,2],"marks":2,"negativeMark":0}]';
    else if (type === 'short_answer') format = '[{"questionText":"...","type":"short_answer","modelAnswer":"...","marks":2}]';

    const truncated = text.slice(0, 6000);

    const prompt = `You are an exam question generator. Based on the following PDF document content, generate ${count} ${type.replace('_', ' ')} exam questions at ${difficulty} difficulty level.\nRules: Return ONLY a valid JSON array. No markdown, no backticks, no code blocks. All string values must be single-line (no newlines or tabs inside strings). Questions must be directly based on the provided content.\nFormat: ${format}\n\nDocument content:\n"""\n${truncated}\n"""`;

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      { model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], temperature: 0.5 },
      { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' } }
    );

    const raw = response.data.choices[0].message.content;
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return res.status(500).json({ success: false, message: 'AI returned invalid format.' });

    let cleaned = jsonMatch[0]
      .replace(/\r/g, '')
      .replace(/([^\\])\n/g, '$1\\n')
      .replace(/([^\\])\t/g, '$1\\t')
      .replace(/```[\w]*/g, '')
      .replace(/```/g, '');

    let questions;
    try {
      questions = JSON.parse(cleaned);
    } catch {
      const matches = [...cleaned.matchAll(/\{[^{}]*\}/gs)];
      if (!matches.length) return res.status(500).json({ success: false, message: 'AI returned unparseable JSON. Try again.' });
      questions = matches.map(m => { try { return JSON.parse(m[0]); } catch { return null; } }).filter(Boolean);
    }

    res.status(200).json({ success: true, data: questions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
