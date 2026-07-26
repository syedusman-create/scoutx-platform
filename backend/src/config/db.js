const { Pool } = require('pg')
const dotenv = require('dotenv')

dotenv.config()

const { DATABASE_URL } = process.env

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required')
}

// Supabase PostgreSQL requires SSL and may use connection pooler (port 6543).
// If the connection string uses port 5432 and fails, try the pooler port.
const pool = new Pool({
  connectionString: DATABASE_URL,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 10,
  ssl: {
    rejectUnauthorized: false
  }
})

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err.message)
})

module.exports = { pool }

