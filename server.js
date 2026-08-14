const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

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
