# Grading System Update - Complete Documentation

## Overview
Implemented a comprehensive grading system where exams with short answer questions show "Awaiting Grading" status until teachers manually grade them. Students receive notifications when results are published.

---

## Changes Made

### 1. Backend Changes (`proctoring-backend/controllers/examController.js`)

#### A. Exam Submission Logic
**Function**: `submitExam`

**Changes**:
- Added detection for short answer questions: `hasShortAnswer = exam.questions.some(q => q.type === 'short_answer')`
- Modified status assignment:
  - If exam has violations >= tolerance limit → `terminated_for_cheating`
  - If exam has short answer questions → `pending_review` (Awaiting Grading)
  - Otherwise → `passed` or `failed` based on score

**Code**:
```javascript
const hasShortAnswer = exam.questions.some(q => q.type === 'short_answer');

if (violations.length >= exam.securitySettings.toleranceLimit) {
  status = 'terminated_for_cheating';
  trustScore = 0;
} else if (hasShortAnswer) {
  status = 'pending_review'; // Awaiting teacher grading
} else {
  status = (score / totalMarks) >= 0.4 ? 'passed' : 'failed';
}
```

#### B. Grading Logic
**Function**: `gradeResult`

**Changes**:
1. **Manual Override for ALL Question Types**: Teachers can now manually grade ANY question type (MCQ, Multi-Correct, Short Answer)
2. **Smart Grading Logic**:
   - If manual grade exists for a question → use it (overrides auto-grading)
   - If no manual grade → use auto-grading for MCQ/Multi-Correct
   - Short answer without manual grade → 0 marks
3. **Student Notification**: When a result changes from `pending_review` to graded, student receives email + in-app notification

**Code**:
```javascript
const wasPendingReview = result.status === 'pending_review';

exam.questions.forEach((question, index) => {
  // Manual grade overrides everything
  if (manualGrades[index] !== undefined && manualGrades[index] !== null && manualGrades[index] !== '') {
    newScore += Number(manualGrades[index]) || 0;
  } else {
    // Auto-grading for MCQ/Multi-Correct
    // ... existing auto-grading logic
  }
});

// Notify student if result was pending and now graded
if (wasPendingReview && result.studentId) {
  await notifyUsers(
    [result.studentId._id],
    `Result Published: ${exam.title}`,
    `Your result for "${exam.title}" has been graded and published. Score: ${result.score}/${result.totalMarks}. Status: ${result.status.toUpperCase()}.`
  );
}
```

#### C. PDF Processing Optimization
**Function**: `generateFromPDF`

**Changes**:
- Changed from string concatenation (`text += item.text + ' '`) to array collection
- Collects all text chunks in array first, then joins once
- **Performance**: O(n²) → O(n) complexity, much faster for large PDFs

**Code**:
```javascript
const textChunks = [];
await new Promise((resolve, reject) => {
  new PdfReader().parseBuffer(pdfBuffer, (err, item) => {
    if (err) reject(err);
    else if (!item) resolve();
    else if (item.text) textChunks.push(item.text);
  });
});
text = textChunks.join(' ');
```

---

### 2. Frontend Changes (`src/pages/ExaminerDashboard.jsx`)

#### A. Results Tab - Status Display
**Component**: `ResultsTab`

**Changes**:
- Added `pending_review` status display with orange color and Clock icon
- Shows "Awaiting Grading" label

**Code**:
```javascript
{r.status === 'pending_review' && (
  <span className="text-orange-600 font-semibold flex items-center gap-1">
    <Clock className="h-3.5 w-3.5" />Awaiting Grading
  </span>
)}
```

#### B. Exam Results Modal - Status Display
**Component**: `ExamResultRow`

**Changes**:
- Added `pending_review` status display in per-exam results modal
- Shows "Awaiting Grading" with orange styling

---

### 3. Frontend Changes (`src/pages/StudentDashboard.jsx`)

#### A. Results Tab - Status Display
**Component**: `ResultsTab`

**Changes**:
- Added `pending_review` status display with Clock icon
- Hides "View" button for pending results (students can't see details until graded)

**Code**:
```javascript
<td className="px-5 py-4">
  {r.status === 'pending_review' ? (
    <span className="text-orange-600 font-semibold text-xs flex items-center gap-1">
      <Clock className="h-3 w-3" />Awaiting Grading
    </span>
  ) : (
    <button onClick={() => setSelected(r)} className="...">View</button>
  )}
</td>
```

---

## User Flow

### Student Perspective:
1. **Takes Exam**: Student completes exam with short answer questions
2. **Submission**: Exam is submitted, MCQ/Multi-Correct auto-graded
3. **Status**: Result shows "Awaiting Grading" (orange badge with clock icon)
4. **Waiting**: Student cannot view detailed results yet
5. **Notification**: When teacher grades, student receives:
   - Email notification
   - In-app notification (bell icon)
   - Message: "Result Published: [Exam Name] - Your result has been graded and published. Score: X/Y. Status: PASSED/FAILED."
6. **View Results**: Student can now view full results with score breakdown

### Teacher Perspective:
1. **Views Results**: Goes to Results tab, sees submissions
2. **Identifies Pending**: Sees "Awaiting Grading" status for exams with short answers
3. **Clicks Grade**: Opens grading modal showing:
   - All questions (MCQ, Multi-Correct, Short Answer)
   - Student answers
   - Correct answers (for MCQ/Multi-Correct)
   - Model answers (if provided)
   - Marks input field for each question
4. **Grades Questions**: Can manually grade ANY question type:
   - Override auto-graded MCQ/Multi-Correct if needed
   - Grade short answer questions
5. **Saves**: Clicks "Save Grades"
6. **Auto-Notification**: System automatically notifies student
7. **Status Update**: Result status changes from "Awaiting Grading" to "Passed"/"Failed"

---

## Status Values

### Result Status Enum:
- `passed` - Student passed the exam (score >= 40%)
- `failed` - Student failed the exam (score < 40%)
- `terminated_for_cheating` - Disqualified due to violations
- `pending_review` - **NEW** - Awaiting teacher grading (has short answer questions)

---

## Key Features

### 1. Universal Manual Grading
- Teachers can manually grade **ANY** question type
- Useful for:
  - Overriding auto-grading if student disputes MCQ answer
  - Partial credit for Multi-Correct questions
  - Grading short answer questions

### 2. Smart Auto-Grading
- MCQ and Multi-Correct questions are auto-graded on submission
- Partial score shown immediately (excluding short answer marks)
- Final score calculated after teacher grades short answers

### 3. Automatic Notifications
- Email + in-app notification sent automatically
- No manual action needed from teacher
- Students immediately know when results are ready

### 4. Optimized PDF Processing
- Array-based text collection (faster)
- Handles large PDFs efficiently
- Reduced memory allocations

---

## Database Schema

### Result Model (`models/Result.js`)
```javascript
{
  status: {
    type: String,
    enum: ['completed', 'terminated_for_cheating', 'pending_review', 'graded', 'passed', 'failed'],
    required: true
  },
  manualGrades: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}
```

**manualGrades Structure**:
```javascript
{
  "0": 2.5,  // Question 0: 2.5 marks
  "1": 4,    // Question 1: 4 marks
  "3": 1.5   // Question 3: 1.5 marks
}
```

---

## API Endpoints

### PUT `/api/exams/results/:id/grade`
**Request Body**:
```json
{
  "manualGrades": {
    "0": 2.5,
    "1": 4,
    "3": 1.5
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "score": 45,
    "totalMarks": 50,
    "status": "passed",
    "manualGrades": { "0": 2.5, "1": 4, "3": 1.5 }
  }
}
```

---

## Testing Checklist

### Backend:
- [ ] Exam with only MCQ → auto-graded, status = passed/failed
- [ ] Exam with short answer → status = pending_review
- [ ] Teacher grades short answer → status changes to passed/failed
- [ ] Student receives notification after grading
- [ ] Manual grade overrides auto-grade for MCQ
- [ ] PDF processing works for large files

### Frontend (Teacher):
- [ ] "Awaiting Grading" badge shows in Results tab
- [ ] Grade button appears for all submissions
- [ ] Grading modal shows all question types
- [ ] Can enter marks for any question
- [ ] Save button works and refreshes results
- [ ] Status updates after grading

### Frontend (Student):
- [ ] "Awaiting Grading" shows in Results tab
- [ ] Cannot view details of pending results
- [ ] Receives notification when graded
- [ ] Can view full results after grading
- [ ] Notification bell shows unread count

---

## Files Modified

1. `proctoring-backend/controllers/examController.js`
   - `submitExam()` - Added pending_review status
   - `gradeResult()` - Universal manual grading + notifications
   - `generateFromPDF()` - Optimized text extraction

2. `src/pages/ExaminerDashboard.jsx`
   - `ResultsTab` - Added pending_review status display
   - `ExamResultRow` - Added pending_review status display

3. `src/pages/StudentDashboard.jsx`
   - `ResultsTab` - Added pending_review status + hide View button

---

## Benefits

1. **Better UX**: Students know their results are being graded, not lost
2. **Flexibility**: Teachers can override any auto-graded question
3. **Automation**: Notifications sent automatically, no manual work
4. **Performance**: Faster PDF processing for AI question generation
5. **Transparency**: Clear status indicators for all stakeholders

---

## Future Enhancements (Optional)

1. Bulk grading interface for multiple students
2. Grading rubrics for short answer questions
3. AI-assisted grading suggestions for short answers
4. Grade distribution analytics
5. Export grades to CSV/Excel
6. Grading deadline reminders for teachers
