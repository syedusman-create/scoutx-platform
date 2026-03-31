const { pool } = require('../config/db')

const createUser = async ({ email, passwordHash, role }) => {
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, role)
     VALUES ($1, $2, $3)
     RETURNING id, email, role, is_verified`,
    [email, passwordHash, role]
  )
  return result.rows[0]
}

const findUserByEmail = async (email) => {
  const result = await pool.query(
    `SELECT id, email, password_hash AS "passwordHash", role, is_verified
     FROM users
     WHERE email = $1`,
    [email]
  )
  return result.rows[0] || null
}

const findUserById = async (id) => {
  const result = await pool.query(
    `SELECT id, email, role, is_verified, created_at, updated_at
     FROM users
     WHERE id = $1`,
    [id]
  )
  return result.rows[0] || null
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById
}

