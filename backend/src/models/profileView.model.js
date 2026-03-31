const { pool } = require('../config/db')

const logProfileView = async ({ viewerId, athleteId, viewerRole }) => {
  // record every view event
  try {
    const result = await pool.query(
      `INSERT INTO profile_views (viewer_id, athlete_id, viewer_role)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [viewerId || null, athleteId, viewerRole || 'guest']
    )

    return result.rows[0]
  } catch (err) {
    // Safely ignore if table doesn't exist yet; keep profile read path available
    if (err && err.code === '42P01') {
      console.warn('profile_views table missing, skipping view log:', err.message)
      return null
    }
    throw err
  }
}

const getProfileAnalytics = async (athleteId) => {
  const totalRes = await pool.query(
    `SELECT COUNT(*)::int AS total FROM profile_views WHERE athlete_id = $1`,
    [athleteId]
  )

  const byRoleRes = await pool.query(
    `SELECT viewer_role, COUNT(*)::int AS count
     FROM profile_views
     WHERE athlete_id = $1
     GROUP BY viewer_role`,
    [athleteId]
  )

  const thisWeekRes = await pool.query(
    `SELECT COUNT(*)::int AS total_week
     FROM profile_views
     WHERE athlete_id = $1
       AND created_at >= NOW() - INTERVAL '7 days'`,
    [athleteId]
  )

  const data = {
    totalViews: totalRes.rows[0]?.total || 0,
    byRole: byRoleRes.rows.reduce((acc, row) => {
      acc[row.viewer_role] = row.count
      return acc
    }, {}),
    viewsThisWeek: thisWeekRes.rows[0]?.total_week || 0
  }

  return data
}

module.exports = { logProfileView, getProfileAnalytics }
