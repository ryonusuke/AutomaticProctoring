const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    minlength: 6,
    select: false
  },
  googleId: { type: String, select: false },
  role: {
    type: String,
    enum: ['student', 'examiner', 'admin'],
    default: 'student'
  },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationOTP: { type: String, select: false },
  emailVerificationExpires: { type: Date, select: false },
  resetPasswordOTP: { type: String, select: false },
  resetPasswordExpires: { type: Date, select: false },
  rememberMeToken: { type: String, select: false },
  
  // --- THE COMPLETE KYC SECURITY OBJECT ---
  kyc: {
    isVerified: { 
      type: Boolean, 
      default: false 
    },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected', 'none'],
      default: 'none' 
    },
    idImage: { 
      type: String 
    },
    faceImage: { 
      type: String 
    },
    aiConfidenceScore: { 
      type: Number 
    },
    idDescriptor: { 
      type: [Number] // Stores the 128-dimensional mathematical array
    },
    verifiedAt: { 
      type: Date 
    }
  },
  
// ... your existing kyc object is above this

  // --- NEW: INBOX / NOTIFICATION SYSTEM ---
  notifications: [{
    type: { type: String, enum: ['alert', 'info', 'success'], default: 'info' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    date: { type: Date, default: Date.now }
  }],
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', async function() {
  if (!this.isModified('password') || !this.password) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', userSchema);