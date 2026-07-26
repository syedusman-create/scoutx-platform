const { pool } = require('../config/db')

const searchUsers = async ({ query, currentUserId, limit = 10 }) => {
  const q = `%${query.trim()}%`

  const result = await pool.query(
    `SELECT
       u.id,
       u.email,
       u.role,
       COALESCE(ap.full_name, cp.club_name, split_part(u.email, '@', 1)) AS display_name
     FROM users u
     LEFT JOIN athlete_profiles ap ON ap.user_id = u.id
     LEFT JOIN club_profiles cp ON cp.user_id = u.id
     WHERE (u.email ILIKE $1
        OR ap.full_name ILIKE $1
        OR cp.club_name ILIKE $1)
       AND u.id != $2
     ORDER BY
       CASE
         WHEN u.email ILIKE $3 THEN 0
         WHEN ap.full_name ILIKE $1 OR cp.club_name ILIKE $1 THEN 1
         ELSE 2
       END,
       ap.full_name ASC, cp.club_name ASC
     LIMIT $4`,
    [q, currentUserId, `${query.trim()}%`, limit]
  )

  return result.rows
}

module.exports = { searchUsers }
