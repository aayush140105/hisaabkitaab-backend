const express = require('express');
const router = express.Router();

// In-memory storage for testing
let users = {};
let nextUserId = 1;

/**
 * Register or get device (MOCK - no database)
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  try {
    const { deviceId, email } = req.body;

    if (!deviceId) {
      return res.status(400).json({ error: 'deviceId is required' });
    }

    // Check if device already exists
    if (users[deviceId]) {
      return res.json({
        userId: users[deviceId],
        message: 'Device already registered',
      });
    }

    // Create new user
    const userId = nextUserId++;
    users[deviceId] = userId;

    console.log(`✅ Device registered: ${deviceId} -> UserId: ${userId}`);

    res.status(201).json({
      userId: userId,
      message: 'Device registered successfully',
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

module.exports = router;
