const { pool } = require('../config/db')

const createOpportunity = async ({ clubId, payload }) => {
  const {
    title,
    position,
    contract_type,
    trial_date,
    venue,
    description,
    min_fitness,
    max_age,
    min_height_cm,
    is_active,
    expires_at
  } = payload

  const result = await pool.query(
    `INSERT INTO opportunities
      (club_id, title, position, contract_type, trial_date, venue, description, min_fitness, max_age, min_height_cm, is_active, expires_at)
     VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING *`,
    [
      clubId,
      title,
      position || null,
      contract_type || null,
      trial_date || null,
      venue || null,
      description || null,
      min_fitness ?? null,
      max_age ?? null,
      min_height_cm ?? null,
      is_active ?? true,
      expires_at || null
    ]
  )

  return result.rows[0]
}

const updateOpportunityForClub = async ({ opportunityId, clubId, updates }) => {
  const allowedFields = [
    'title',
    'position',
    'contract_type',
    'trial_date',
    'venue',
    'description',
    'min_fitness',
    'max_age',
    'min_height_cm',
    'is_active',
    'expires_at'
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
    UPDATE opportunities
    SET ${setClauses.join(', ')}
    WHERE id = $${idx} AND club_id = $${idx + 1}
    RETURNING *
  `

  const result = await pool.query(query, [...values, opportunityId, clubId])
  return result.rows[0] || null
}

const updateOpportunityForAdmin = async ({ opportunityId, updates }) => {
  const allowedFields = [
    'title',
    'position',
    'contract_type',
    'trial_date',
    'venue',
    'description',
    'min_fitness',
    'max_age',
    'min_height_cm',
    'is_active',
    'expires_at'
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
    UPDATE opportunities
    SET ${setClauses.join(', ')}
    WHERE id = $${idx}
    RETURNING *
  `

  const result = await pool.query(query, [...values, opportunityId])
  return result.rows[0] || null
}

const deleteOpportunityForClub = async ({ opportunityId, clubId }) => {
  const result = await pool.query(
    `DELETE FROM opportunities WHERE id = $1 AND club_id = $2 RETURNING *`,
    [opportunityId, clubId]
  )
  return result.rows[0] || null
}

const deleteOpportunityForAdmin = async (opportunityId) => {
  const result = await pool.query(
    `DELETE FROM opportunities WHERE id = $1 RETURNING *`,
    [opportunityId]
  )
  return result.rows[0] || null
}

const getOpportunityById = async (opportunityId) => {
  const result = await pool.query(
    `SELECT
      o.*,
      cp.club_name,
      cp.city AS club_city,
      cp.state AS club_state
     FROM opportunities o
     JOIN club_profiles cp ON cp.id = o.club_id
     WHERE o.id = $1`,
    [opportunityId]
  )
  return result.rows[0] || null
}

const listOpportunities = async ({ onlyActive = true, clubId } = {}) => {
  const where = []
  const values = []
  let idx = 1

  if (onlyActive) {
    where.push(`o.is_active = true`)
  }

  if (clubId) {
    where.push(`o.club_id = $${idx}`)
    values.push(clubId)
    idx += 1
  }

  const baseWhere = where.length ? `WHERE ${where.join(' AND ')}` : ''

  const result = await pool.query(
    `SELECT
      o.*,
      cp.club_name,
      cp.city AS club_city,
      cp.state AS club_state
     FROM opportunities o
     JOIN club_profiles cp ON cp.id = o.club_id
     ${baseWhere}
     ORDER BY o.created_at DESC`,
    values
  )

  return result.rows
}

const applyToOpportunity = async ({ opportunityId, athleteId }) => {
  const result = await pool.query(
    `INSERT INTO applications (opportunity_id, athlete_id, status)
     VALUES ($1,$2,'applied')
     ON CONFLICT (opportunity_id, athlete_id)
     DO UPDATE SET status = 'applied', applied_at = NOW()
     RETURNING *`,
    [opportunityId, athleteId]
  )

  return result.rows[0]
}

const updateApplicationStatusForClub = async ({ applicationId, clubId, status }) => {
  const result = await pool.query(
    `UPDATE applications a
     SET status = $1
     WHERE a.id = $2
       AND a.opportunity_id IN (
         SELECT o.id
         FROM opportunities o
         WHERE o.club_id = $3
       )
     RETURNING a.*`,
    [status, applicationId, clubId]
  )

  return result.rows[0] || null
}

const updateApplicationStatusForAdmin = async ({ applicationId, status }) => {
  const result = await pool.query(
    `UPDATE applications a
     SET status = $1
     WHERE a.id = $2
     RETURNING a.*`,
    [status, applicationId]
  )

  return result.rows[0] || null
}

const listApplicationsByAthleteId = async (athleteId) => {
  const result = await pool.query(
    `SELECT
      a.*,
      o.title,
      o.position,
      o.trial_date,
      cp.club_name,
      cp.city AS club_city,
      cp.state AS club_state
     FROM applications a
     JOIN opportunities o ON o.id = a.opportunity_id
     JOIN club_profiles cp ON cp.id = o.club_id
     WHERE a.athlete_id = $1
     ORDER BY a.applied_at DESC`,
    [athleteId]
  )

  return result.rows
}

const createOrUpdateShortlist = async ({ clubId, athleteId, payload }) => {
  const { stage, notes } = payload

  const result = await pool.query(
    `INSERT INTO shortlists (club_id, athlete_id, stage, notes)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (club_id, athlete_id)
     DO UPDATE SET stage = EXCLUDED.stage, notes = EXCLUDED.notes
     RETURNING *`,
    [clubId, athleteId, stage, notes || null]
  )

  return result.rows[0]
}

const listShortlistsByClubId = async (clubId) => {
  const result = await pool.query(
    `SELECT
      s.*,
      ap.full_name,
      ap.position,
      ap.city,
      ap.state,
      ap.fitness_score,
      ap.avatar_url
     FROM shortlists s
     JOIN athlete_profiles ap ON ap.id = s.athlete_id
     WHERE s.club_id = $1
     ORDER BY s.created_at DESC`,
    [clubId]
  )

  return result.rows
}

module.exports = {
  createOpportunity,
  updateOpportunityForClub,
  updateOpportunityForAdmin,
  deleteOpportunityForClub,
  deleteOpportunityForAdmin,
  getOpportunityById,
  listOpportunities,
  applyToOpportunity,
  updateApplicationStatusForClub,
  updateApplicationStatusForAdmin,
  listApplicationsByAthleteId,
  createOrUpdateShortlist,
  listShortlistsByClubId
}

