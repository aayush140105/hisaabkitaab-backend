const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// The Android app talks to this API directly (no browser involved), so it never
// sends an Origin header and CORS doesn't affect it either way. This allowlist only
// matters if a browser-based client (e.g. a future admin dashboard) calls the API.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
}));
app.use(bodyParser.json({ limit: '100kb' }));

// Blanket rate limit — tightened further per-route below where it matters most.
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
}));

app.use('/api/auth/register', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
}));

// Routes
app.use('/api/data', require('./routes/data'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/auth', require('./routes/auth'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Backend is running' });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'HisaabKitaab Analytics Backend',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      data: '/api/data',
      analytics: '/api/analytics',
      auth: '/api/auth',
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`HisaabKitaab Backend running on http://localhost:${PORT}`);
});
