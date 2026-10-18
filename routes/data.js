const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

function isValidAmount(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 && Number.isInteger(value);
}

/**
 * Add expense
 * POST /api/data/expense
 * Body: { amountRupees: number, categoryId: string, dateEpochDay: number,
 *         city?: string, latitude?: number, longitude?: number }
 * userId comes from the authenticated token, never from the body.
 */
router.post('/expense', async (req, res) => {
  try {
    const { amountRupees, categoryId, dateEpochDay, city, latitude, longitude } = req.body;

    if (!isValidAmount(amountRupees) || !categoryId || dateEpochDay === undefined) {
      return res.status(400).json({ error: 'Missing or invalid fields' });
    }

    const result = await pool.query(
      'INSERT INTO expenses (user_id, amount_rupees, category_id, date_epoch_day, city, latitude, longitude) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [req.userId, amountRupees, categoryId, dateEpochDay, city || null, latitude || null, longitude || null]
    );

    res.status(201).json({ id: result.rows[0].id, message: 'Expense recorded' });
  } catch (error) {
    console.error('Expense error:', error);
    res.status(500).json({ error: 'Failed to record expense' });
  }
});

/**
 * Add income
 * POST /api/data/income
 * Body: { amountRupees: number, sourceId?: string, customSourceLabel?: string, dateEpochDay: number }
 */
router.post('/income', async (req, res) => {
  try {
    const { amountRupees, sourceId, customSourceLabel, dateEpochDay } = req.body;

    if (!isValidAmount(amountRupees) || dateEpochDay === undefined) {
      return res.status(400).json({ error: 'Missing or invalid fields' });
    }

    const result = await pool.query(
      'INSERT INTO income (user_id, amount_rupees, source_id, custom_source_label, date_epoch_day) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [req.userId, amountRupees, sourceId || null, customSourceLabel || null, dateEpochDay]
    );

    res.status(201).json({ id: result.rows[0].id, message: 'Income recorded' });
  } catch (error) {
    console.error('Income error:', error);
    res.status(500).json({ error: 'Failed to record income' });
  }
});

/**
 * Add savings goal
 * POST /api/data/savings-goal
 * Body: { name: string, emoji: string, targetRupees?: number, targetMonthYear?: string, isGeneral: boolean }
 */
router.post('/savings-goal', async (req, res) => {
  try {
    const { name, emoji, targetRupees, targetMonthYear, isGeneral } = req.body;

    if (!name || typeof name !== 'string' || !emoji) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (targetRupees !== undefined && targetRupees !== null && !isValidAmount(targetRupees)) {
      return res.status(400).json({ error: 'Invalid targetRupees' });
    }

    const result = await pool.query(
      'INSERT INTO savings_goals (user_id, name, emoji, target_rupees, target_month_year, is_general) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [req.userId, name, emoji, targetRupees || null, targetMonthYear || null, isGeneral || false]
    );

    res.status(201).json({ id: result.rows[0].id, message: 'Savings goal created' });
  } catch (error) {
    console.error('Savings goal error:', error);
    res.status(500).json({ error: 'Failed to create savings goal' });
  }
});

/**
 * Add savings contribution
 * POST /api/data/savings-contribution
 * Body: { goalId: number, amountRupees: number, contributionDate: number }
 * goalId must belong to the authenticated user (fixes IDOR — previously any
 * caller could post a contribution onto any other user's goal by guessing its id).
 */
router.post('/savings-contribution', async (req, res) => {
  try {
    const { goalId, amountRupees, contributionDate } = req.body;

    if (!goalId || !isValidAmount(amountRupees) || contributionDate === undefined) {
      return res.status(400).json({ error: 'Missing or invalid fields' });
    }

    const goal = await pool.query(
      'SELECT id FROM savings_goals WHERE id = $1 AND user_id = $2',
      [goalId, req.userId]
    );
    if (goal.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const result = await pool.query(
      'INSERT INTO savings_contributions (goal_id, amount_rupees, contribution_date) VALUES ($1, $2, $3) RETURNING id',
      [goalId, amountRupees, contributionDate]
    );

    res.status(201).json({ id: result.rows[0].id, message: 'Contribution recorded' });
  } catch (error) {
    console.error('Contribution error:', error);
    res.status(500).json({ error: 'Failed to record contribution' });
  }
});

/**
 * Get all expenses for the authenticated user
 * GET /api/data/expenses
 */
router.get('/expenses', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM expenses WHERE user_id = $1 ORDER BY date_epoch_day DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch expenses error:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

/**
 * Get all income for the authenticated user
 * GET /api/data/income
 */
router.get('/income', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM income WHERE user_id = $1 ORDER BY date_epoch_day DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch income error:', error);
    res.status(500).json({ error: 'Failed to fetch income' });
  }
});

module.exports = router;
