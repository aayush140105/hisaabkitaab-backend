const express = require('express');
const router = express.Router();
const pool = require('../db');

/**
 * Add expense
 * POST /api/data/expense
 * Body: { userId: number, amountRupees: number, categoryId: string, dateEpochDay: number,
 *         city?: string, latitude?: number, longitude?: number }
 */
router.post('/expense', async (req, res) => {
  try {
    const { userId, amountRupees, categoryId, dateEpochDay, city, latitude, longitude } = req.body;

    if (!userId || !amountRupees || !categoryId || dateEpochDay === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await pool.query(
      'INSERT INTO expenses (user_id, amount_rupees, category_id, date_epoch_day, city, latitude, longitude) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [userId, amountRupees, categoryId, dateEpochDay, city || null, latitude || null, longitude || null]
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
 * Body: { userId: number, amountRupees: number, sourceId?: string, customSourceLabel?: string, dateEpochDay: number }
 */
router.post('/income', async (req, res) => {
  try {
    const { userId, amountRupees, sourceId, customSourceLabel, dateEpochDay } = req.body;

    if (!userId || !amountRupees || dateEpochDay === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await pool.query(
      'INSERT INTO income (user_id, amount_rupees, source_id, custom_source_label, date_epoch_day) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [userId, amountRupees, sourceId || null, customSourceLabel || null, dateEpochDay]
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
 * Body: { userId: number, name: string, emoji: string, targetRupees?: number, targetMonthYear?: string, isGeneral: boolean }
 */
router.post('/savings-goal', async (req, res) => {
  try {
    const { userId, name, emoji, targetRupees, targetMonthYear, isGeneral } = req.body;

    if (!userId || !name || !emoji) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await pool.query(
      'INSERT INTO savings_goals (user_id, name, emoji, target_rupees, target_month_year, is_general) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [userId, name, emoji, targetRupees || null, targetMonthYear || null, isGeneral || false]
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
 */
router.post('/savings-contribution', async (req, res) => {
  try {
    const { goalId, amountRupees, contributionDate } = req.body;

    if (!goalId || !amountRupees || contributionDate === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
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
 * Get all expenses for a user
 * GET /api/data/expenses/:userId
 */
router.get('/expenses/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      'SELECT * FROM expenses WHERE user_id = $1 ORDER BY date_epoch_day DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch expenses error:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

/**
 * Get all income for a user
 * GET /api/data/income/:userId
 */
router.get('/income/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      'SELECT * FROM income WHERE user_id = $1 ORDER BY date_epoch_day DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch income error:', error);
    res.status(500).json({ error: 'Failed to fetch income' });
  }
});

module.exports = router;
