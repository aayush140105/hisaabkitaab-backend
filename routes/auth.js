const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

/**
 * Register or get device. Issues a per-device API key — the client must send this
 * back as `Authorization: Bearer <apiKey>` on every subsequent /api/data call.
 * POST /api/auth/register
 * Body: { deviceId: string, email?: string }
 */
router.post('/register', async (req, res) => {
  try {
    const { deviceId, email } = req.body;

    if (!deviceId || typeof deviceId !== 'string') {
      return res.status(400).json({ error: 'deviceId is required' });
    }

    const existingUser = await pool.query(
      'SELECT id, api_key FROM users WHERE device_id = $1',
      [deviceId]
    );

    if (existingUser.rows.length > 0) {
      let { id, api_key } = existingUser.rows[0];
      // Backfill a key for devices registered before this fix shipped.
      if (!api_key) {
        api_key = crypto.randomBytes(32).toString('hex');
        await pool.query('UPDATE users SET api_key = $1 WHERE id = $2', [api_key, id]);
      }
      return res.json({
        userId: id,
        apiKey: api_key,
        message: 'Device already registered',
      });
    }

    const apiKey = crypto.randomBytes(32).toString('hex');
    const result = await pool.query(
      'INSERT INTO users (device_id, email, api_key) VALUES ($1, $2, $3) RETURNING id',
      [deviceId, email || null, apiKey]
    );

    res.status(201).json({
      userId: result.rows[0].id,
      apiKey,
      message: 'Device registered successfully',
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * Get the authenticated caller's own user record.
 * GET /api/auth/me
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, device_id, email, created_at FROM users WHERE id = $1',
      [req.userId]
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
