const { pool } = require('../config/db')

const createAuditLog = async ({
  actorUserId,
  action,
  tableName,
  rowPk,
  beforeJson,
  afterJson,
  ip,
  userAgent
}) => {
  await pool.query(
    `INSERT INTO audit_logs
      (actor_user_id, action, table_name, row_pk, before_json, after_json, ip, user_agent)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [actorUserId || null, action, tableName, rowPk || null, beforeJson || null, afterJson || null, ip || null, userAgent || null]
  )
}

const listAuditLogs = async ({ page = 1, limit = 50 }) => {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200)
  const safePage = Math.max(Number(page) || 1, 1)
  const offset = (safePage - 1) * safeLimit

  const totalRes = await pool.query(`SELECT COUNT(*)::int AS total FROM audit_logs`)
  const total = totalRes.rows[0]?.total || 0

  const rowsRes = await pool.query(
    `SELECT
      a.*,
      u.email AS actor_email,
      u.role AS actor_role
     FROM audit_logs a
     LEFT JOIN users u ON u.id = a.actor_user_id
     ORDER BY a.created_at DESC
     LIMIT $1 OFFSET $2`,
    [safeLimit, offset]
  )

  return {
    logs: rowsRes.rows,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.max(Math.ceil(total / safeLimit), 1)
    }
  }
}

module.exports = { createAuditLog, listAuditLogs }
