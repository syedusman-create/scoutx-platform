const { pool } = require('../config/db')

const createChallenge = async ({ payload, createdBy }) => {
  const result = await pool.query(
    `INSERT INTO challenges
     (title, description, type, exercise_type, target, start_date, end_date, created_by, is_active, image_url, rewards)
     VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,$10,$11::jsonb)
     RETURNING *`,
    [
      payload.title,
      payload.description || null,
      payload.type,
      payload.exerciseType || null,
      JSON.stringify(payload.target || {}),
      payload.startDate || null,
      payload.endDate || null,
      createdBy || null,
      payload.isActive !== false,
      payload.imageUrl || null,
      JSON.stringify(payload.rewards || {})
    ]
  )
  return result.rows[0]
}

const listChallenges = async () => {
  const result = await pool.query(
    `SELECT * FROM challenges ORDER BY is_active DESC, start_date DESC NULLS LAST, created_at DESC`
  )
  return result.rows
}

const joinChallenge = async ({ challengeId, userId }) => {
  const result = await pool.query(
    `INSERT INTO challenge_progress (challenge_id, user_id)
     VALUES ($1,$2)
     ON CONFLICT (challenge_id, user_id) DO NOTHING
     RETURNING *`,
    [challengeId, userId]
  )
  return result.rows[0] || null
}

const leaveChallenge = async ({ challengeId, userId }) => {
  await pool.query(
    `DELETE FROM challenge_progress WHERE challenge_id = $1 AND user_id = $2`,
    [challengeId, userId]
  )
}

const listMyChallengeProgress = async (userId) => {
  const result = await pool.query(
    `SELECT cp.*, c.title, c.description, c.type, c.exercise_type, c.target, c.start_date, c.end_date, c.is_active
     FROM challenge_progress cp
     JOIN challenges c ON c.id = cp.challenge_id
     WHERE cp.user_id = $1
     ORDER BY cp.last_updated DESC`,
    [userId]
  )
  return result.rows
}

const updateProgressForAssessment = async ({ userId, exerciseType, repCount, formScore }) => {
  const challengesRes = await pool.query(
    `SELECT * FROM challenges
     WHERE is_active = true
       AND (exercise_type IS NULL OR exercise_type = $1)
       AND (start_date IS NULL OR start_date <= NOW())
       AND (end_date IS NULL OR end_date >= NOW())`,
    [exerciseType || null]
  )

  for (const c of challengesRes.rows) {
    const progressRes = await pool.query(
      `SELECT * FROM challenge_progress WHERE challenge_id = $1 AND user_id = $2 LIMIT 1`,
      [c.id, userId]
    )
    if (!progressRes.rows[0]) continue

    const current = progressRes.rows[0]
    const progress = { ...(current.current_progress || {}) }
    progress.assessments = Number(progress.assessments || 0) + 1
    progress.repCount = Math.max(Number(progress.repCount || 0), Number(repCount || 0))
    progress.formScore = Math.max(Number(progress.formScore || 0), Number(formScore || 0))

    const target = c.target || {}
    const targetAssessments = Number(target.assessments || 0)
    const targetReps = Number(target.repCount || 0)
    const targetForm = Number(target.formScore || 0)
    const percentages = []
    if (targetAssessments > 0) percentages.push((progress.assessments / targetAssessments) * 100)
    if (targetReps > 0) percentages.push((progress.repCount / targetReps) * 100)
    if (targetForm > 0) percentages.push((progress.formScore / targetForm) * 100)
    const completion = percentages.length ? Math.min(...percentages) : 0
    const completed = completion >= 100

    await pool.query(
      `UPDATE challenge_progress
       SET current_progress = $3::jsonb,
           completion_percentage = $4,
           is_completed = $5,
           completed_at = CASE WHEN $5 THEN COALESCE(completed_at, NOW()) ELSE completed_at END,
           last_updated = NOW()
       WHERE id = $1 AND user_id = $2`,
      [current.id, userId, JSON.stringify(progress), Math.min(100, completion), completed]
    )
  }
}

module.exports = {
  createChallenge,
  listChallenges,
  joinChallenge,
  leaveChallenge,
  listMyChallengeProgress,
  updateProgressForAssessment
}
