const { pool } = require('../config/db')

const listPosts = async () => {
  const result = await pool.query(
    `SELECT p.*,
            u.email AS author_email,
            u.role AS author_role,
            ap.id AS author_athlete_id,
            cp.id AS author_club_id
     FROM posts p
     JOIN users u ON u.id = p.author_id
     LEFT JOIN athlete_profiles ap ON ap.user_id = u.id AND u.role = 'athlete'
     LEFT JOIN club_profiles cp ON cp.user_id = u.id AND u.role = 'club'
     ORDER BY p.created_at DESC`
  )
  return result.rows
}

const createPost = async ({ authorId, body, mediaUrl, mediaType }) => {
  const result = await pool.query(
    `INSERT INTO posts (author_id, body, media_url, media_type)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [authorId, body, mediaUrl || null, mediaType || null]
  )

  return result.rows[0]
}

module.exports = { listPosts, createPost }
