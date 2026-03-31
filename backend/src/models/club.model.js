const { pool } = require('../config/db')

const getClubById = async (id) => {
  const result = await pool.query(
    `SELECT
      cp.*,
      u.email AS email,
      u.role  AS user_role,
      u.is_verified AS user_is_verified
    FROM club_profiles cp
    JOIN users u ON u.id = cp.user_id
    WHERE cp.id = $1`,
    [id]
  )
  return result.rows[0] || null
}

const getClubByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT
      cp.*,
      u.email AS email,
      u.role  AS user_role,
      u.is_verified AS user_is_verified
    FROM club_profiles cp
    JOIN users u ON u.id = cp.user_id
    WHERE cp.user_id = $1`,
    [userId]
  )
  return result.rows[0] || null
}

const updateClubProfileForOwner = async ({ clubId, userId, updates }) => {
  const allowedFields = [
    'club_name',
    'league',
    'city',
    'state',
    'founded_year',
    'logo_url',
    'bio'
    // is_verified is club/admin-managed only.
  ]

  const setClauses = []
  const values = []

  let idx = 1
  for (const [key, value] of Object.entries(updates)) {
    if (!allowedFields.includes(key)) continue
    setClauses.push(`${key} = $${idx}`)
    values.push(value)
    idx += 1
  }

  if (setClauses.length === 0) return null

  const query = `
    UPDATE club_profiles
    SET ${setClauses.join(', ')}
    WHERE id = $${idx} AND user_id = $${idx + 1}
    RETURNING *
  `

  const result = await pool.query(query, [...values, clubId, userId])
  return result.rows[0] || null
}

const updateClubProfileForAdmin = async ({ clubId, updates }) => {
  const allowedFields = [
    'club_name',
    'league',
    'city',
    'state',
    'founded_year',
    'logo_url',
    'bio',
    'is_verified'
  ]

  const setClauses = []
  const values = []

  let idx = 1
  for (const [key, value] of Object.entries(updates)) {
    if (!allowedFields.includes(key)) continue
    setClauses.push(`${key} = $${idx}`)
    values.push(value)
    idx += 1
  }

  if (setClauses.length === 0) return null

  const query = `
    UPDATE club_profiles
    SET ${setClauses.join(', ')}
    WHERE id = $${idx}
    RETURNING *
  `

  const result = await pool.query(query, [...values, clubId])
  return result.rows[0] || null
}

const upsertClubProfileForOwner = async ({ userId, updates }) => {
  const allowedFields = [
    'club_name',
    'league',
    'city',
    'state',
    'founded_year',
    'logo_url',
    'bio'
  ]

  const keys = Object.keys(updates).filter((k) => allowedFields.includes(k))
  if (!keys.includes('club_name')) return null

  const insertCols = ['user_id', ...keys]
  const insertValues = [userId, ...keys.map((k) => updates[k])]
  const placeholders = insertCols.map((_, i) => `$${i + 1}`)

  const setClauses = keys
    .map((col) => `${col} = EXCLUDED.${col}`)
    .join(', ')

  const query = `
    INSERT INTO club_profiles (${insertCols.join(', ')})
    VALUES (${placeholders.join(', ')})
    ON CONFLICT (user_id)
    DO UPDATE SET ${setClauses}
    RETURNING *
  `

  const result = await pool.query(query, insertValues)
  return result.rows[0] || null
}

module.exports = {
  getClubById,
  getClubByUserId,
  updateClubProfileForOwner,
  updateClubProfileForAdmin,
  upsertClubProfileForOwner
}

