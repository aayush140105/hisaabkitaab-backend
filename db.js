const { Pool } = require('pg');
require('dotenv').config();

const isLocalHost = ['localhost', '127.0.0.1'].includes(process.env.DB_HOST);

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // Remote managed Postgres (e.g. Supabase) requires SSL; local dev Postgres does not speak SSL at all.
  ssl: isLocalHost ? false : { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

module.exports = pool;
