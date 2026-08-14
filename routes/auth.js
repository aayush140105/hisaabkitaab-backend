const express = require('express');
const router = express.Router();
const pool = require('../db');

/**
 * Register or get device
 * POST /api/auth/register
 * Body: { deviceId: string, email?: string }
 */
router.post('/register', async (req, res) => {
  try {
    const { deviceId, email } = req.body;

    if (!deviceId) {
      return res.status(400).json({ error: 'deviceId is required' });
    }

    // Check if device already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE device_id = $1',
      [deviceId]
    );

    if (existingUser.rows.length > 0) {
      return res.json({
        userId: existingUser.rows[0].id,
        message: 'Device already registered',
      });
    }

    // Create new user
    const result = await pool.query(
      'INSERT INTO users (device_id, email) VALUES ($1, $2) RETURNING id',
      [deviceId, email || null]
    );

    res.status(201).json({
      userId: result.rows[0].id,
      message: 'Device registered successfully',
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * Get user by device ID
 * GET /api/auth/user/:deviceId
 */
router.get('/user/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const result = await pool.query(
      'SELECT id, device_id, email, created_at FROM users WHERE device_id = $1',
      [deviceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Fetch user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;
