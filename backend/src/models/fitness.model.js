const { pool } = require('../config/db')
const { calculateFitnessScore } = require('../utils/fitnessScore')

const getFitnessTestsByAthleteId = async (athleteId) => {
  const result = await pool.query(
    `SELECT *
     FROM fitness_tests
     WHERE athlete_id = $1
     ORDER BY tested_at DESC`,
    [athleteId]
  )
  return result.rows
}

const createFitnessTestAndRecalculate = async ({ athleteId, payload, certifiedBy }) => {
  const {
    test_type,
    score,
    unit,
    tested_at,
    location,
    notes
  } = payload

  const result = await pool.query(
    `INSERT INTO fitness_tests (athlete_id, test_type, score, unit, tested_at, location, certified_by, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [athleteId, test_type, score, unit || null, tested_at || new Date(), location || null, certifiedBy || null, notes || null]
  )

  const testsRes = await pool.query(
    `SELECT test_type, score
     FROM fitness_tests
     WHERE athlete_id = $1`,
    [athleteId]
  )

  const newScore = calculateFitnessScore(testsRes.rows || [])

  await pool.query(
    `UPDATE athlete_profiles
     SET fitness_score = $1
     WHERE id = $2`,
    [newScore, athleteId]
  )

  return { created: result.rows[0], fitness_score: newScore }
}

const updateFitnessTestForAdmin = async ({ testId, updates }) => {
  const allowedFields = ['test_type', 'score', 'unit', 'tested_at', 'location', 'notes']

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
    UPDATE fitness_tests
    SET ${setClauses.join(', ')}
    WHERE id = $${idx}
    RETURNING *
  `

  const result = await pool.query(query, [...values, testId])
  return result.rows[0] || null
}

const updateFitnessTestAndRecalculateForOwner = async ({ testId, userId, updates }) => {
  // Owner can only update tests for their athlete profile (via user_id -> athlete_profiles).
  const allowedFields = ['test_type', 'score', 'unit', 'tested_at', 'location', 'notes']

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
    UPDATE fitness_tests ft
    SET ${setClauses.join(', ')}
    WHERE ft.id = $${idx}
      AND ft.athlete_id IN (
        SELECT ap.id
        FROM athlete_profiles ap
        WHERE ap.user_id = $${idx + 1}
      )
    RETURNING ft.*, ft.athlete_id
  `

  const result = await pool.query(query, [...values, testId, userId])
  const updated = result.rows[0] || null
  if (!updated) return null

  const testsRes = await pool.query(
    `SELECT test_type, score
     FROM fitness_tests
     WHERE athlete_id = $1`,
    [updated.athlete_id]
  )

  const newScore = calculateFitnessScore(testsRes.rows || [])
  await pool.query(
    `UPDATE athlete_profiles
     SET fitness_score = $1
     WHERE id = $2`,
    [newScore, updated.athlete_id]
  )

  return { test: updated, fitness_score: newScore }
}

module.exports = {
  getFitnessTestsByAthleteId,
  createFitnessTestAndRecalculate,
  updateFitnessTestForAdmin,
  updateFitnessTestAndRecalculateForOwner
}

