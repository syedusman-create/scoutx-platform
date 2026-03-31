const { pool } = require('../config/db')

const getCareerEntriesByAthleteId = async (athleteId) => {
  const result = await pool.query(
    `SELECT *
     FROM career_entries
     WHERE athlete_id = $1
     ORDER BY start_date DESC, created_at DESC`,
    [athleteId]
  )
  return result.rows
}

const createCareerEntry = async (entry) => {
  const {
    athlete_id,
    club_name,
    role,
    competition,
    start_date,
    end_date,
    matches,
    goals,
    assists,
    clean_sheets,
    pass_accuracy,
    avg_rating,
    is_verified,
    is_current
  } = entry

  const result = await pool.query(
    `INSERT INTO career_entries
      (athlete_id, club_name, role, competition, start_date, end_date, matches, goals, assists, clean_sheets, pass_accuracy, avg_rating, is_verified, is_current)
     VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     RETURNING *`,
    [
      athlete_id,
      club_name,
      role || null,
      competition || null,
      start_date,
      end_date || null,
      matches ?? 0,
      goals ?? 0,
      assists ?? 0,
      clean_sheets ?? 0,
      pass_accuracy ?? null,
      avg_rating ?? null,
      is_verified ?? false,
      is_current ?? false
    ]
  )
  return result.rows[0]
}

const updateCareerEntryForAdmin = async ({ careerId, updates }) => {
  const allowedFields = [
    'club_name',
    'role',
    'competition',
    'start_date',
    'end_date',
    'matches',
    'goals',
    'assists',
    'clean_sheets',
    'pass_accuracy',
    'avg_rating',
    'is_verified',
    'is_current'
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
    UPDATE career_entries
    SET ${setClauses.join(', ')}
    WHERE id = $${idx}
    RETURNING *
  `

  const result = await pool.query(query, [...values, careerId])
  return result.rows[0] || null
}

const updateCareerEntryForOwner = async ({ careerId, userId, updates }) => {
  const allowedFields = [
    'club_name',
    'role',
    'competition',
    'start_date',
    'end_date',
    'matches',
    'goals',
    'assists',
    'clean_sheets',
    'pass_accuracy',
    'avg_rating',
    'is_verified',
    'is_current'
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
    UPDATE career_entries ce
    SET ${setClauses.join(', ')}
    WHERE ce.id = $${idx}
      AND ce.athlete_id IN (
        SELECT ap.id
        FROM athlete_profiles ap
        WHERE ap.user_id = $${idx + 1}
      )
    RETURNING ce.*
  `

  const result = await pool.query(query, [...values, careerId, userId])
  return result.rows[0] || null
}

const deleteCareerEntryForAdmin = async (careerId) => {
  const result = await pool.query(
    `DELETE FROM career_entries WHERE id = $1 RETURNING *`,
    [careerId]
  )
  return result.rows[0] || null
}

const deleteCareerEntryForOwner = async ({ careerId, userId }) => {
  const result = await pool.query(
    `DELETE FROM career_entries
     WHERE id = $1
       AND athlete_id IN (
         SELECT ap.id
         FROM athlete_profiles ap
         WHERE ap.user_id = $2
       )
     RETURNING *`,
    [careerId, userId]
  )
  return result.rows[0] || null
}

module.exports = {
  getCareerEntriesByAthleteId,
  createCareerEntry,
  updateCareerEntryForAdmin,
  updateCareerEntryForOwner,
  deleteCareerEntryForAdmin,
  deleteCareerEntryForOwner
}

