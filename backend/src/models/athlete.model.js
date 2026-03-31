const { pool } = require('../config/db')

const getAthleteById = async (id) => {
  const result = await pool.query(
    `SELECT
      ap.*,
      u.email AS email,
      u.role  AS user_role,
      u.is_verified AS user_is_verified
    FROM athlete_profiles ap
    JOIN users u ON u.id = ap.user_id
    WHERE ap.id = $1`,
    [id]
  )
  return result.rows[0] || null
}

const getAthleteByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT
      ap.*,
      u.email AS email,
      u.role  AS user_role,
      u.is_verified AS user_is_verified
    FROM athlete_profiles ap
    JOIN users u ON u.id = ap.user_id
    WHERE ap.user_id = $1`,
    [userId]
  )
  return result.rows[0] || null
}

const updateAthleteProfileForOwner = async ({ athleteId, userId, updates }) => {
  const allowedFields = [
    'full_name',
    'sport',
    'position',
    'city',
    'state',
    'date_of_birth',
    'age_verified',
    'preferred_foot',
    'height_cm',
    'weight_kg',
    'bio',
    'headline',
    'avatar_url',
    'is_open'
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
    UPDATE athlete_profiles
    SET ${setClauses.join(', ')}
    WHERE id = $${idx} AND user_id = $${idx + 1}
    RETURNING *
  `

  const result = await pool.query(query, [...values, athleteId, userId])
  return result.rows[0] || null
}

const updateAthleteProfileForAdmin = async ({ athleteId, updates }) => {
  const allowedFields = [
    'full_name',
    'sport',
    'position',
    'city',
    'state',
    'date_of_birth',
    'age_verified',
    'preferred_foot',
    'height_cm',
    'weight_kg',
    'bio',
    'headline',
    'avatar_url',
    'is_open'
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
    UPDATE athlete_profiles
    SET ${setClauses.join(', ')}
    WHERE id = $${idx}
    RETURNING *
  `

  const result = await pool.query(query, [...values, athleteId])
  return result.rows[0] || null
}

const searchAthletes = async ({
  position,
  minAge,
  maxAge,
  state,
  minFitness,
  isOpen,
  sport,
  sortBy,
  page,
  limit
}) => {
  const where = []
  const values = []
  let idx = 1

  if (sport) {
    where.push(`ap.sport = $${idx}`)
    values.push(sport)
    idx += 1
  } else {
    where.push(`ap.sport = $${idx}`)
    values.push('football')
    idx += 1
  }

  if (position) {
    where.push(`ap.position = $${idx}`)
    values.push(position)
    idx += 1
  }

  if (state) {
    where.push(`ap.state = $${idx}`)
    values.push(state)
    idx += 1
  }

  if (typeof minFitness === 'number' && !Number.isNaN(minFitness)) {
    where.push(`ap.fitness_score >= $${idx}`)
    values.push(minFitness)
    idx += 1
  }

  if (typeof isOpen === 'boolean') {
    where.push(`ap.is_open = $${idx}`)
    values.push(isOpen)
    idx += 1
  }

  if (typeof minAge === 'number' && !Number.isNaN(minAge)) {
    where.push(`EXTRACT(YEAR FROM age(CURRENT_DATE, ap.date_of_birth)) >= $${idx}`)
    values.push(minAge)
    idx += 1
  }

  if (typeof maxAge === 'number' && !Number.isNaN(maxAge)) {
    where.push(`EXTRACT(YEAR FROM age(CURRENT_DATE, ap.date_of_birth)) <= $${idx}`)
    values.push(maxAge)
    idx += 1
  }

  const baseWhere = where.length ? `WHERE ${where.join(' AND ')}` : ''

  const totalQuery = `
    SELECT COUNT(*)::int AS total
    FROM athlete_profiles ap
    JOIN users u ON u.id = ap.user_id
    ${baseWhere}
  `

  const totalRes = await pool.query(totalQuery, values)
  const total = totalRes.rows[0]?.total || 0

  const offset = (page - 1) * limit

  let orderBy = 'ap.fitness_score DESC'
  if (sortBy === 'matches_desc') orderBy = 'ap.total_matches DESC'
  if (sortBy === 'recent') orderBy = 'ap.created_at DESC'
  if (sortBy === 'fitness_desc' || !sortBy) orderBy = 'ap.fitness_score DESC'

  const listQuery = `
    SELECT
      ap.*,
      u.email AS email,
      u.role AS user_role,
      u.is_verified AS user_is_verified
    FROM athlete_profiles ap
    JOIN users u ON u.id = ap.user_id
    ${baseWhere}
    ORDER BY ${orderBy}, ap.created_at DESC
    LIMIT $${idx} OFFSET $${idx + 1}
  `

  const listValues = [...values, limit, offset]
  const athletesRes = await pool.query(listQuery, listValues)

  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0

  return {
    athletes: athletesRes.rows,
    total,
    page,
    limit,
    totalPages
  }
}

const upsertAthleteProfileForOwner = async ({ userId, updates }) => {
  const allowedFields = [
    'full_name',
    'sport',
    'position',
    'city',
    'state',
    'date_of_birth',
    'age_verified',
    'preferred_foot',
    'height_cm',
    'weight_kg',
    'bio',
    'headline',
    'avatar_url',
    'is_open'
  ]

  if (!updates.full_name) return null

  const optionalKeys = Object.keys(updates).filter((k) => allowedFields.includes(k) && k !== 'full_name')

  const insertCols = ['user_id', 'full_name']
  const insertValues = [userId, updates.full_name]
  let idx = 3

  for (const key of optionalKeys) {
    insertCols.push(key)
    insertValues.push(updates[key])
    idx += 1
  }

  const placeholderCols = insertCols.map((_, i) => `$${i + 1}`)

  const setCols = ['full_name', ...optionalKeys]
  const setClauses = setCols.map((col) => `${col} = EXCLUDED.${col}`)

  const query = `
    INSERT INTO athlete_profiles (${insertCols.join(', ')})
    VALUES (${placeholderCols.join(', ')})
    ON CONFLICT (user_id)
    DO UPDATE SET ${setClauses.join(', ')}
    RETURNING *
  `

  const result = await pool.query(query, insertValues)
  return result.rows[0] || null
}

module.exports = {
  getAthleteById,
  getAthleteByUserId,
  updateAthleteProfileForOwner,
  updateAthleteProfileForAdmin,
  upsertAthleteProfileForOwner,
  searchAthletes
}

