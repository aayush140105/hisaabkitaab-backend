/**
 * Gates the /api/analytics routes (admin/Metabase dashboards only — never called by the app).
 * Expects header: x-admin-key: <ADMIN_API_KEY>
 */
function requireAdmin(req, res, next) {
  const key = req.headers['x-admin-key'];

  if (!process.env.ADMIN_API_KEY) {
    console.error('ADMIN_API_KEY is not set — refusing all analytics requests');
    return res.status(503).json({ error: 'Analytics temporarily unavailable' });
  }

  if (!key || key !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Invalid or missing admin key' });
  }

  next();
}

module.exports = { requireAdmin };
