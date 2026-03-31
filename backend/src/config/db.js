const { Pool } = require('pg')
const dotenv = require('dotenv')

dotenv.config()

const { DATABASE_URL } = process.env

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required')
}

const pool = new Pool({
  connectionString: DATABASE_URL
})

module.exports = { pool }

