const express = require('express');
const router = express.Router();
const pool = require('../db');

/**
 * TOP SPENDING CATEGORIES (Most valuable for data buyers like Nestle)
 * GET /api/analytics/top-categories
 * Query params: limit=10, aggregated=true (anonymized)
 */
router.get('/top-categories', async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    const aggregated = req.query.aggregated === 'true'; // true for anonymized aggregate data

    if (aggregated) {
      // Aggregated across ALL users (for selling insights)
      const result = await pool.query(`
        SELECT
          category_id,
          COUNT(*) as transaction_count,
          SUM(amount_rupees) as total_spent,
          AVG(amount_rupees) as avg_transaction,
          MAX(amount_rupees) as max_transaction,
          MIN(amount_rupees) as min_transaction
        FROM expenses
        GROUP BY category_id
        ORDER BY total_spent DESC
        LIMIT $1
      `, [limit]);
      return res.json(result.rows);
    } else {
      // Per user
      const userId = req.query.userId;
      if (!userId) {
        return res.status(400).json({ error: 'userId required for non-aggregated data' });
      }

      const result = await pool.query(`
        SELECT
          category_id,
          COUNT(*) as transaction_count,
          SUM(amount_rupees) as total_spent,
          AVG(amount_rupees) as avg_transaction
        FROM expenses
        WHERE user_id = $1
        GROUP BY category_id
        ORDER BY total_spent DESC
        LIMIT $2
      `, [userId, limit]);
      return res.json(result.rows);
    }
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

/**
 * SPENDING TRENDS OVER TIME
 * GET /api/analytics/spending-trends
 * Query params: monthsBack=6, aggregated=true
 */
router.get('/spending-trends', async (req, res) => {
  try {
    const monthsBack = req.query.monthsBack || 6;
    const aggregated = req.query.aggregated === 'true';

    if (aggregated) {
      // Aggregate across all users
      const result = await pool.query(`
        SELECT
          DATE_TRUNC('month', TO_TIMESTAMP(date_epoch_day * 86400))::DATE as month,
          COUNT(*) as transaction_count,
          SUM(amount_rupees) as total_spent,
          AVG(amount_rupees) as avg_transaction
        FROM expenses
        WHERE date_epoch_day > (EXTRACT(EPOCH FROM CURRENT_DATE - INTERVAL '1 month' * $1) / 86400)
        GROUP BY DATE_TRUNC('month', TO_TIMESTAMP(date_epoch_day * 86400))
        ORDER BY month DESC
      `, [monthsBack]);
      return res.json(result.rows);
    } else {
      const userId = req.query.userId;
      if (!userId) {
        return res.status(400).json({ error: 'userId required' });
      }

      const result = await pool.query(`
        SELECT
          DATE_TRUNC('month', TO_TIMESTAMP(date_epoch_day * 86400))::DATE as month,
          COUNT(*) as transaction_count,
          SUM(amount_rupees) as total_spent
        FROM expenses
        WHERE user_id = $1 AND date_epoch_day > (EXTRACT(EPOCH FROM CURRENT_DATE - INTERVAL '1 month' * $2) / 86400)
        GROUP BY DATE_TRUNC('month', TO_TIMESTAMP(date_epoch_day * 86400))
        ORDER BY month DESC
      `, [userId, monthsBack]);
      return res.json(result.rows);
    }
  } catch (error) {
    console.error('Trends error:', error);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

/**
 * CONSUMER SEGMENTATION
 * GET /api/analytics/segments
 * Shows spending patterns: high/medium/low spenders
 */
router.get('/segments', async (req, res) => {
  try {
    // Classify users by total spending
    const result = await pool.query(`
      WITH user_spending AS (
        SELECT
          user_id,
          SUM(amount_rupees) as total_spent,
          COUNT(*) as transaction_count,
          COUNT(DISTINCT category_id) as category_diversity
        FROM expenses
        GROUP BY user_id
      )
      SELECT
        CASE
          WHEN total_spent > 500000 THEN 'High Spender'
          WHEN total_spent > 100000 THEN 'Medium Spender'
          ELSE 'Low Spender'
        END as segment,
        COUNT(*) as user_count,
        AVG(total_spent) as avg_total_spent,
        AVG(transaction_count) as avg_transactions,
        AVG(category_diversity) as avg_categories
      FROM user_spending
      GROUP BY segment
      ORDER BY user_count DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Segmentation error:', error);
    res.status(500).json({ error: 'Failed to fetch segments' });
  }
});

/**
 * INCOME SOURCES ANALYSIS
 * GET /api/analytics/income-sources
 * Query params: aggregated=true
 */
router.get('/income-sources', async (req, res) => {
  try {
    const aggregated = req.query.aggregated === 'true';

    if (aggregated) {
      const result = await pool.query(`
        SELECT
          COALESCE(source_id, custom_source_label, 'Unknown') as source,
          COUNT(*) as transaction_count,
          SUM(amount_rupees) as total_income,
          AVG(amount_rupees) as avg_income
        FROM income
        GROUP BY source_id, custom_source_label
        ORDER BY total_income DESC
      `);
      return res.json(result.rows);
    } else {
      const userId = req.query.userId;
      if (!userId) {
        return res.status(400).json({ error: 'userId required' });
      }

      const result = await pool.query(`
        SELECT
          COALESCE(source_id, custom_source_label, 'Unknown') as source,
          COUNT(*) as transaction_count,
          SUM(amount_rupees) as total_income
        FROM income
        WHERE user_id = $1
        GROUP BY source_id, custom_source_label
        ORDER BY total_income DESC
      `, [userId]);
      return res.json(result.rows);
    }
  } catch (error) {
    console.error('Income analysis error:', error);
    res.status(500).json({ error: 'Failed to fetch income analysis' });
  }
});

/**
 * OVERALL STATISTICS
 * GET /api/analytics/stats
 * Query params: aggregated=true
 */
router.get('/stats', async (req, res) => {
  try {
    const aggregated = req.query.aggregated === 'true';
    const userId = req.query.userId;

    let userFilter = aggregated ? '' : 'WHERE e.user_id = $1';

    const result = await pool.query(`
      SELECT
        COUNT(DISTINCT ${aggregated ? 'e.user_id' : 'NULL'}) as total_users,
        (SELECT COUNT(*) FROM expenses ${userFilter}) as total_expenses,
        (SELECT COUNT(*) FROM income ${userFilter}) as total_income,
        (SELECT SUM(amount_rupees) FROM expenses ${userFilter}) as total_spent,
        (SELECT SUM(amount_rupees) FROM income ${userFilter}) as total_earned,
        (SELECT COUNT(DISTINCT category_id) FROM expenses ${userFilter}) as category_count,
        (SELECT COUNT(*) FROM savings_goals ${userFilter.replace('e.', 'sg.')}) as savings_goals_count
      FROM expenses e
      ${aggregated ? '' : `WHERE e.user_id = $1`}
    `, aggregated ? [] : [userId]);

    res.json(result.rows[0] || {});
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * CATEGORY SPENDING HEATMAP (Monthly breakdown by category)
 * GET /api/analytics/category-heatmap
 * Query params: aggregated=true, monthsBack=6
 */
router.get('/category-heatmap', async (req, res) => {
  try {
    const monthsBack = req.query.monthsBack || 6;
    const aggregated = req.query.aggregated === 'true';

    if (aggregated) {
      const result = await pool.query(`
        SELECT
          category_id,
          DATE_TRUNC('month', TO_TIMESTAMP(date_epoch_day * 86400))::DATE as month,
          SUM(amount_rupees) as total_spent,
          COUNT(*) as transaction_count
        FROM expenses
        WHERE date_epoch_day > (EXTRACT(EPOCH FROM CURRENT_DATE - INTERVAL '1 month' * $1) / 86400)
        GROUP BY category_id, DATE_TRUNC('month', TO_TIMESTAMP(date_epoch_day * 86400))
        ORDER BY month DESC, total_spent DESC
      `, [monthsBack]);
      return res.json(result.rows);
    } else {
      const userId = req.query.userId;
      if (!userId) {
        return res.status(400).json({ error: 'userId required' });
      }

      const result = await pool.query(`
        SELECT
          category_id,
          DATE_TRUNC('month', TO_TIMESTAMP(date_epoch_day * 86400))::DATE as month,
          SUM(amount_rupees) as total_spent,
          COUNT(*) as transaction_count
        FROM expenses
        WHERE user_id = $1 AND date_epoch_day > (EXTRACT(EPOCH FROM CURRENT_DATE - INTERVAL '1 month' * $2) / 86400)
        GROUP BY category_id, DATE_TRUNC('month', TO_TIMESTAMP(date_epoch_day * 86400))
        ORDER BY month DESC, total_spent DESC
      `, [userId, monthsBack]);
      return res.json(result.rows);
    }
  } catch (error) {
    console.error('Heatmap error:', error);
    res.status(500).json({ error: 'Failed to fetch heatmap' });
  }
});

/**
 * TOP CATEGORIES FOR ONE CITY
 * GET /api/analytics/categories-by-city?city=Bangalore
 */
router.get('/categories-by-city', async (req, res) => {
  try {
    const city = req.query.city;
    if (!city) {
      return res.status(400).json({ error: 'city query param required' });
    }

    const result = await pool.query(`
      SELECT
        category_id,
        COUNT(*) as transaction_count,
        SUM(amount_rupees) as total_spent,
        AVG(amount_rupees) as avg_transaction
      FROM expenses
      WHERE city ILIKE $1
      GROUP BY category_id
      ORDER BY total_spent DESC
    `, [city]);

    res.json(result.rows);
  } catch (error) {
    console.error('City analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch city analytics' });
  }
});

/**
 * COMPARE ALL CITIES
 * GET /api/analytics/city-comparison
 */
router.get('/city-comparison', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        city,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(*) as transaction_count,
        SUM(amount_rupees) as total_spent,
        AVG(amount_rupees) as avg_transaction
      FROM expenses
      WHERE city IS NOT NULL
      GROUP BY city
      ORDER BY total_spent DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('City comparison error:', error);
    res.status(500).json({ error: 'Failed to fetch city comparison' });
  }
});

module.exports = router;
