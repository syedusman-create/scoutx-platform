const { pool } = require('../config/db')

const getUserSummaryById = async (userId) => {
  const result = await pool.query(
    `SELECT
       u.id,
       u.email,
       u.role,
       COALESCE(ap.full_name, cp.club_name, split_part(u.email, '@', 1)) AS other_user_name
     FROM users u
     LEFT JOIN athlete_profiles ap ON ap.user_id = u.id
     LEFT JOIN club_profiles cp ON cp.user_id = u.id
     WHERE u.id = $1`,
    [userId]
  )
  return result.rows[0] || null
}

const createMessage = async ({ senderId, receiverId, body }) => {
  const result = await pool.query(
    `INSERT INTO messages (sender_id, receiver_id, body)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [senderId, receiverId, body]
  )
  return result.rows[0]
}

const listMessagesBetween = async ({ userId, otherUserId }) => {
  const result = await pool.query(
    `SELECT m.*, u.email AS sender_email
     FROM messages m
     JOIN users u ON u.id = m.sender_id
     WHERE (m.sender_id = $1 AND m.receiver_id = $2)
       OR (m.sender_id = $2 AND m.receiver_id = $1)
     ORDER BY m.created_at ASC`,
    [userId, otherUserId]
  )
  return result.rows
}

const listConversationsForUser = async (userId) => {
  const result = await pool.query(
    `WITH conv AS (
       SELECT
         CASE
           WHEN m.sender_id = $1 THEN m.receiver_id
           ELSE m.sender_id
         END AS other_user_id,
         m.id,
         m.body,
         m.created_at,
         m.is_read,
         m.sender_id,
         m.receiver_id
       FROM messages m
       WHERE m.sender_id = $1 OR m.receiver_id = $1
     ),
     latest AS (
       SELECT DISTINCT ON (other_user_id)
         other_user_id,
         body AS last_message_body,
         created_at AS last_message_at
       FROM conv
       ORDER BY other_user_id, created_at DESC
     )
     SELECT
       c.other_user_id,
       u.email AS other_user_email,
       u.role AS other_user_role,
       COALESCE(ap.full_name, cp.club_name, split_part(u.email, '@', 1)) AS other_user_name,
       l.last_message_at,
       l.last_message_body,
       COUNT(*)::int AS total_messages,
       COALESCE(SUM(CASE WHEN c.receiver_id = $1 AND c.is_read = false THEN 1 ELSE 0 END), 0)::int AS unread_count
     FROM conv c
     JOIN users u ON u.id = c.other_user_id
     LEFT JOIN athlete_profiles ap ON ap.user_id = u.id
     LEFT JOIN club_profiles cp ON cp.user_id = u.id
     JOIN latest l ON l.other_user_id = c.other_user_id
     GROUP BY c.other_user_id, u.email, u.role, ap.full_name, cp.club_name, l.last_message_at, l.last_message_body
     ORDER BY l.last_message_at DESC`,
    [userId]
  )
  return result.rows
}

const markConversationAsRead = async ({ userId, otherUserId }) => {
  const result = await pool.query(
    `UPDATE messages
     SET is_read = true
     WHERE sender_id = $1
       AND receiver_id = $2
       AND is_read = false
     RETURNING id`,
    [otherUserId, userId]
  )
  return { updated_count: result.rowCount }
}

module.exports = {
  getUserSummaryById,
  createMessage,
  listMessagesBetween,
  listConversationsForUser,
  markConversationAsRead
}
