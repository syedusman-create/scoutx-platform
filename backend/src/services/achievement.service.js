const { pool } = require('../config/db')

const ensureDefaultAchievements = async () => {
  const defaults = [
    {
      name: 'First Assessment',
      description: 'Complete your first AI fitness assessment.',
      type: 'total',
      criteria: { assessmentsCompleted: 1 },
      iconName: 'sparkles',
      points: 50,
      rarity: 'common'
    },
    {
      name: 'Form Master 90',
      description: 'Score 90+ form score in an assessment.',
      type: 'personal_record',
      criteria: { minFormScore: 90 },
      iconName: 'target',
      points: 120,
      rarity: 'rare'
    }
  ]

  for (const a of defaults) {
    await pool.query(
      `INSERT INTO achievements (name, description, type, criteria, icon_name, points, rarity)
       SELECT $1,$2,$3,$4::jsonb,$5,$6,$7
       WHERE NOT EXISTS (SELECT 1 FROM achievements WHERE name = $1)`,
      [a.name, a.description, a.type, JSON.stringify(a.criteria), a.iconName, a.points, a.rarity]
    )
  }
}

const unlockAchievementByName = async ({ userId, achievementName }) => {
  const result = await pool.query(
    `INSERT INTO user_achievements (user_id, achievement_id)
     SELECT $1, a.id
     FROM achievements a
     WHERE a.name = $2
     ON CONFLICT (user_id, achievement_id) DO NOTHING
     RETURNING *`,
    [userId, achievementName]
  )
  return result.rows[0] || null
}

const evaluateForAssessment = async ({ userId, formScore }) => {
  await ensureDefaultAchievements()

  const countRes = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM fitness_assessments fa
     JOIN athlete_profiles ap ON ap.id = fa.athlete_id
     WHERE ap.user_id = $1
       AND fa.video_processing_status = 'completed'`,
    [userId]
  )

  const total = countRes.rows[0]?.total || 0
  if (total >= 1) {
    await unlockAchievementByName({ userId, achievementName: 'First Assessment' })
  }
  if (Number(formScore) >= 90) {
    await unlockAchievementByName({ userId, achievementName: 'Form Master 90' })
  }
}

const listAchievements = async () => {
  const result = await pool.query(
    `SELECT * FROM achievements ORDER BY points DESC, created_at DESC`
  )
  return result.rows
}

const listUserAchievements = async (userId) => {
  const result = await pool.query(
    `SELECT ua.*, a.name, a.description, a.icon_name, a.points, a.rarity, a.type, a.criteria
     FROM user_achievements ua
     JOIN achievements a ON a.id = ua.achievement_id
     WHERE ua.user_id = $1
     ORDER BY ua.unlocked_at DESC`,
    [userId]
  )
  return result.rows
}

module.exports = {
  evaluateForAssessment,
  listAchievements,
  listUserAchievements
}
