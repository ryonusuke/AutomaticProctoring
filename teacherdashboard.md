Build a modern **Teacher/Examiner Dashboard** for this existing MERN stack online exam system with anti-cheat features.

IMPORTANT:
Do NOT break, modify, or overwrite any existing functionality, APIs, database schemas, authentication system, or student dashboard.
Do NOT fuck up the current system. Only extend it cleanly with modular, well-structured additions.
brand is AUTOMATIC PROCTORING SYSTEM

---

### 🧩 CONTEXT

* Stack: MERN (MongoDB ATLAS, Express, React, Node.js) + Tailwind CSS
* Student dashboard already exists with a notification bell system
* Email system already exists (or can be extended)
* Groq API is available in `.env`
* This is a **college project**, so keep it realistic, clean, and deployment-ready 

---

# 🎯 GOAL

Create a **modern, industry-style Teacher Dashboard** with essential features only, focusing on:

* Clean UI/UX
* Functional workflows
* Anti-cheat simulation controls
* Notifications (dashboard + email)

---

# 🧑‍🏫 DASHBOARD STRUCTURE

## 1. Layout (DO NOT MODIFY GLOBAL STYLES)

* Left sidebar:

  * Dashboard
  * Exams
  * Question Bank
  * Students
  * Results
  * Settings

* Top navbar:

  * Search bar ( UI only)
  * Notification bell (reuse existing system) think of what notification a teacher would recieve yourself
  * Profile dropdown (logout/settings) and password update is must

* Main area:

  * Card-based layout using Tailwind

---

## 2. Dashboard Home

Create a summary page with:

* Stats cards:

  * Total Exams
  * Active Exams
  * Students Enrolled
  * Violations Detected

* Recent activity list:

  * Exam created
  * Results published
  * Violations flagged

* Simple chart (can be static/mock if needed)

* Quick actions:

  * Create Exam
  * Add Questions
  * View Results

---

## 3. Exam Management

### Create Exam (form or modal)

Fields:

* Title
* Description
* Duration
* Start/End time
* Total marks
* Negative marking toggle



---

### Exam List Page

Table with:

* Exam name
* Status (Upcoming / Live / Completed)
* Number of students
* Actions:

  * Edit
  * Start
  * View Results
  * Delete

---

## 4. Question Management

* Add/edit/delete questions
* Types:

  * MCQ
  * Short answer
*

---

## 5. Student Management

* Add student (name + email)
* Assign students to exams
* Simple table view

---



---

## 7. Results & Evaluation

* Auto-score MCQs
* Manual grading for subjective answers
* Table:

  * Student name
  * Score
  * Violations count
* Detailed view:

  * Answers
  * Time taken
  * Violations log

---

## 🔔 8. NOTIFICATIONS (CRITICAL)

When teacher performs actions:

* Create exam
* Update exam
* Publish results

System MUST:

1. Send notification to student dashboard (reuse existing bell system)
2. Send email to students

---

### Email Content

* Clean HTML format
* Include:

  * Exam name
  * Date/time
  * Short message

---

## 🤖 9. GROQ API USAGE (OPTIONAL BUT GOOD)

Use Groq API for:

* Generating email text
* generating sample questions
can think of extra uses



---

# ⚠️ CONSTRAINTS (VERY IMPORTANT)

* Do NOT modify existing student dashboard logic
* Do NOT change authentication flow
* Do NOT break current APIs
* Do NOT introduce unnecessary complexity

* Keep components modular and clean

---

# 🎨 UI/UX REQUIREMENTS

* Use Tailwind CSS properly (spacing, cards, shadows)
* Modern SaaS-style layout
* Responsive design (basic)
* Use modals instead of page reloads where possible

---

# 📦 OUTPUT EXPECTATION

Provide:

* React component structure
* Key frontend components (Dashboard, Exams, etc.)
* Backend routes (only new ones)
* Notification + email integration logic
* Clean, readable code

---

End goal:
A clean, modern teacher dashboard that looks realistic in a when any user use it(it will be deployed online) and works smoothly with the existing system — without breaking anything.
