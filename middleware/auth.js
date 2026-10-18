const pool = require('../db');

/**
 * Verifies the caller holds the API key issued to a device at /api/auth/register.
 * Expects header: Authorization: Bearer <apiKey>
 * Attaches req.userId (trusted, from DB — never trust a client-supplied userId after this).
 */
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;

    if (!token) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }

    const result = await pool.query('SELECT id FROM users WHERE api_key = $1', [token]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.userId = result.rows[0].id;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

module.exports = { requireAuth };
