const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // For local development without SSL; for Render, enable SSL
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

pool.on('connect', () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('✅ PostgreSQL connected');
  }
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err.message);
});

/**
 * Execute a query against the pool.
 * @param {string} text - SQL query string
 * @param {Array}  params - Query parameters
 */
const query = (text, params) => pool.query(text, params);

/**
 * Get a client from the pool for transactions.
 */
const getClient = () => pool.connect();

module.exports = { query, getClient, pool };
