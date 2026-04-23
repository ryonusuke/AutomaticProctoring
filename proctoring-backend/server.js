require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const passport = require('./config/passport');

const authRoutes = require('./routes/authRoutes');
const examRoutes = require('./routes/examRoutes');
const resultRoutes = require('./routes/resultRoutes');
const adminRoutes = require('./routes/adminRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const { updatePassword } = require('./controllers/authController');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
// Security headers — disables MIME sniffing, sets XSS protection, prevents clickjacking
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // disabled to allow face-api model loading from /public
}));
// CSRF mitigation: JWT in Authorization header (not cookies) means CSRF is not exploitable.
// All state-changing requests require a valid Bearer token which a CSRF attacker cannot read.
// This is the standard SPA CSRF mitigation pattern.
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(passport.initialize());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tickets', ticketRoutes);
app.put('/api/auth/update-password', updatePassword);

app.get('/api/health', (_req, res) =>
  res.status(200).json({ status: 'success', message: 'Proctoring API is running.' })
);

// Test route to verify OAuth config
app.get('/api/auth/test-google', (req, res) => {
  res.json({
    clientId: process.env.GOOGLE_CLIENT_ID,
    callbackUrl: `${process.env.SERVER_URL || 'http://localhost:5000'}/api/auth/google/callback`,
    authUrl: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(`${process.env.SERVER_URL || 'http://localhost:5000'}/api/auth/google/callback`)}&response_type=code&scope=profile%20email`
  });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB.'))
  .catch((err) => { console.error('❌ MongoDB error:', err.message); process.exit(1); });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
