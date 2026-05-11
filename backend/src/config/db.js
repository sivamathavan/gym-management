const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

let isConnected = false;

async function connectDB() {
  try {
    const client = await pool.connect();
    console.log('PostgreSQL connected');
    client.release();
    isConnected = true;
  } catch (err) {
    console.error('PostgreSQL connection failed:', err.message);
    console.warn('Backend running without database. Most features will fail.');
    isConnected = false;
  }
}

const getIsConnected = () => isConnected;

// Helper: run query and return rows
async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (duration > 500) console.warn('Slow query:', { text, duration });
  return res;
}

// Helper: get single row
async function queryOne(text, params) {
  const res = await query(text, params);
  return res.rows[0] || null;
}

// Helper: transaction wrapper
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, connectDB, query, queryOne, withTransaction, getIsConnected };
