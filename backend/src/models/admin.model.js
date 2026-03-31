const { pool } = require('../config/db')

const getAdminOverview = async () => {
  const result = await pool.query(
    `SELECT
      (SELECT COUNT(*)::int FROM users) AS users_count,
      (SELECT COUNT(*)::int FROM athlete_profiles) AS athletes_count,
      (SELECT COUNT(*)::int FROM club_profiles) AS clubs_count,
      (SELECT COUNT(*)::int FROM opportunities) AS opportunities_count,
      (SELECT COUNT(*)::int FROM posts) AS posts_count,
      (SELECT COUNT(*)::int FROM applications) AS applications_count`
  )
  return result.rows[0]
}

const listUsers = async ({ page = 1, limit = 50 }) => {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200)
  const safePage = Math.max(Number(page) || 1, 1)
  const offset = (safePage - 1) * safeLimit

  const totalRes = await pool.query(`SELECT COUNT(*)::int AS total FROM users`)
  const total = totalRes.rows[0]?.total || 0

  const rowsRes = await pool.query(
    `SELECT id, email, role, is_verified, created_at, updated_at
     FROM users
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [safeLimit, offset]
  )

  return {
    users: rowsRes.rows,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.max(Math.ceil(total / safeLimit), 1)
    }
  }
}

const listAthletesForAdmin = async ({ page = 1, limit = 50 }) => {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200)
  const safePage = Math.max(Number(page) || 1, 1)
  const offset = (safePage - 1) * safeLimit

  const totalRes = await pool.query(`SELECT COUNT(*)::int AS total FROM athlete_profiles`)
  const total = totalRes.rows[0]?.total || 0

  const rowsRes = await pool.query(
    `SELECT
      ap.id,
      u.email AS user_email,
      ap.full_name,
      ap.position,
      ap.city,
      ap.state,
      ap.age_verified,
      ap.is_open,
      ap.created_at
     FROM athlete_profiles ap
     JOIN users u ON u.id = ap.user_id
     ORDER BY ap.created_at DESC
     LIMIT $1 OFFSET $2`,
    [safeLimit, offset]
  )

  return {
    rows: rowsRes.rows,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.max(Math.ceil(total / safeLimit), 1)
    }
  }
}

const listClubsForAdmin = async ({ page = 1, limit = 50 }) => {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200)
  const safePage = Math.max(Number(page) || 1, 1)
  const offset = (safePage - 1) * safeLimit

  const totalRes = await pool.query(`SELECT COUNT(*)::int AS total FROM club_profiles`)
  const total = totalRes.rows[0]?.total || 0

  const rowsRes = await pool.query(
    `SELECT
      cp.id,
      u.email AS user_email,
      cp.club_name,
      cp.league,
      cp.city,
      cp.state,
      cp.is_verified,
      cp.created_at
     FROM club_profiles cp
     JOIN users u ON u.id = cp.user_id
     ORDER BY cp.created_at DESC
     LIMIT $1 OFFSET $2`,
    [safeLimit, offset]
  )

  return {
    rows: rowsRes.rows,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.max(Math.ceil(total / safeLimit), 1)
    }
  }
}

const getUserById = async (userId) => {
  const result = await pool.query(
    `SELECT id, email, role, is_verified, created_at, updated_at
     FROM users WHERE id = $1`,
    [userId]
  )
  return result.rows[0] || null
}

const updateUserRole = async ({ userId, role }) => {
  const result = await pool.query(
    `UPDATE users
     SET role = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING id, email, role, is_verified, created_at, updated_at`,
    [role, userId]
  )
  return result.rows[0] || null
}

const getAthleteById = async (athleteId) => {
  const result = await pool.query(`SELECT * FROM athlete_profiles WHERE id = $1`, [athleteId])
  return result.rows[0] || null
}

const updateAthleteVerification = async ({ athleteId, ageVerified }) => {
  const result = await pool.query(
    `UPDATE athlete_profiles
     SET age_verified = $1
     WHERE id = $2
     RETURNING *`,
    [ageVerified, athleteId]
  )
  return result.rows[0] || null
}

const getClubById = async (clubId) => {
  const result = await pool.query(`SELECT * FROM club_profiles WHERE id = $1`, [clubId])
  return result.rows[0] || null
}

const updateClubVerification = async ({ clubId, isVerified }) => {
  const result = await pool.query(
    `UPDATE club_profiles
     SET is_verified = $1
     WHERE id = $2
     RETURNING *`,
    [isVerified, clubId]
  )
  return result.rows[0] || null
}

module.exports = {
  getAdminOverview,
  listUsers,
  listAthletesForAdmin,
  listClubsForAdmin,
  getUserById,
  updateUserRole,
  getAthleteById,
  updateAthleteVerification,
  getClubById,
  updateClubVerification
}
