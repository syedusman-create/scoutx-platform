const { pool } = require('../config/db')

const PERIOD = 'all_time'

const updateLeaderboardForAssessment = async ({ userId, exerciseType, formScore, repCount }) => {
  const metric = 'form_score'
  const lbType = 'fitness_assessment'

  const existingRes = await pool.query(
    `SELECT * FROM leaderboards
     WHERE type = $1
       AND COALESCE(exercise_type, '') = COALESCE($2, '')
       AND metric = $3
       AND period = $4
     LIMIT 1`,
    [lbType, exerciseType || null, metric, PERIOD]
  )

  const nextEntry = {
    userId,
    score: Number(formScore) || 0,
    repCount: Number(repCount) || 0,
    updatedAt: new Date().toISOString()
  }

  const normalizeAndSort = (entries) => {
    const byUser = new Map()
    for (const e of entries || []) {
      if (!e?.userId) continue
      const prev = byUser.get(e.userId)
      if (!prev || Number(e.score) > Number(prev.score)) {
        byUser.set(e.userId, e)
      }
    }
    if (!byUser.has(userId) || Number(nextEntry.score) > Number(byUser.get(userId).score)) {
      byUser.set(userId, nextEntry)
    }
    return Array.from(byUser.values())
      .sort((a, b) => Number(b.score) - Number(a.score))
      .slice(0, 100)
      .map((e, idx) => ({ ...e, rank: idx + 1 }))
  }

  if (!existingRes.rows[0]) {
    const entries = normalizeAndSort([])
    await pool.query(
      `INSERT INTO leaderboards (type, exercise_type, metric, period, entries)
       VALUES ($1,$2,$3,$4,$5::jsonb)`,
      [lbType, exerciseType || null, metric, PERIOD, JSON.stringify(entries)]
    )
    return
  }

  const board = existingRes.rows[0]
  const entries = normalizeAndSort(board.entries || [])
  await pool.query(
    `UPDATE leaderboards
     SET entries = $2::jsonb, updated_at = NOW()
     WHERE id = $1`,
    [board.id, JSON.stringify(entries)]
  )
}

const listLeaderboards = async ({ period, exerciseType }) => {
  const values = [period || PERIOD]
  let query = `SELECT * FROM leaderboards WHERE period = $1`
  if (exerciseType) {
    query += ` AND exercise_type = $2`
    values.push(exerciseType)
  }
  query += ' ORDER BY updated_at DESC'

  const result = await pool.query(query, values)
  return result.rows
}

const listSportLeaderboards = async ({ sport, limit = 25 }) => {
  const values = [Number(limit) || 25]
  let where = `WHERE u.role = 'athlete'`
  if (sport) {
    where += ' AND ap.sport = $2'
    values.push(sport)
  }

  const result = await pool.query(
    `WITH base AS (
       SELECT
         ap.id AS athlete_id,
         ap.user_id,
         ap.full_name,
         ap.sport,
         ap.position,
         ap.city,
         ap.state,
         ap.fitness_score,
         ap.total_matches,
         ap.total_goals,
         ap.total_assists,
         LEAST(100, (COALESCE(ap.total_matches,0) * 0.5) + (COALESCE(ap.total_goals,0) * 2.0) + (COALESCE(ap.total_assists,0) * 1.5)) AS performance_score
       FROM athlete_profiles ap
       JOIN users u ON u.id = ap.user_id
       ${where}
     ),
     ranked AS (
       SELECT
         b.*,
         ROUND((COALESCE(b.fitness_score,0) * 0.65 + COALESCE(b.performance_score,0) * 0.35)::numeric, 2) AS leaderboard_metric
       FROM base b
     )
     SELECT *
     FROM ranked
     ORDER BY sport ASC, leaderboard_metric DESC, fitness_score DESC
     LIMIT $1`,
    values
  )

  const bySport = new Map()
  for (const row of result.rows) {
    const key = row.sport || 'unknown'
    if (!bySport.has(key)) bySport.set(key, [])
    bySport.get(key).push(row)
  }

  const data = Array.from(bySport.entries()).map(([sportName, entries]) => ({
    sport: sportName,
    metric: '0.65*fitness_score + 0.35*performance_score',
    entries: entries.map((e, idx) => ({
      rank: idx + 1,
      athleteId: e.athlete_id,
      userId: e.user_id,
      fullName: e.full_name,
      position: e.position,
      city: e.city,
      state: e.state,
      fitnessScore: Number(e.fitness_score || 0),
      performanceScore: Number(e.performance_score || 0),
      leaderboardMetric: Number(e.leaderboard_metric || 0)
    }))
  }))

  return data
}

module.exports = {
  updateLeaderboardForAssessment,
  listLeaderboards,
  listSportLeaderboards
}
